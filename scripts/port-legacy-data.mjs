/**
 * Copies the legacy (pre-rebuild) database into the current schema.
 *
 * The old app and this one share almost no column names: `subscriptions_clients`
 * is now `customers_customers`, ids were random base62 strings and are now
 * prefixed (`cst_…`), and every row now needs a human business number. This
 * script reads the old tables, mints new identities, and writes the current
 * tables in foreign-key order.
 *
 * Run it with both URLs explicit — it never guesses a database:
 *
 *   SOURCE_LEGACY_URL='…/streamdb' TARGET_URL='…/stream-test' \
 *     node scripts/port-legacy-data.mjs
 *
 * Refuses to run when the target already has rows, so a second run cannot
 * duplicate the data. Everything happens in one transaction.
 */
import { randomUUID } from 'node:crypto';
import postgres from 'postgres';

const sourceUrl = process.env.SOURCE_LEGACY_URL;
const targetUrl = process.env.TARGET_URL;

if (!sourceUrl || !targetUrl) {
  throw new Error('SOURCE_LEGACY_URL and TARGET_URL are both required.');
}

if (new URL(sourceUrl).pathname === new URL(targetUrl).pathname) {
  throw new Error('Source and target point at the same database. Refusing to run.');
}

const source = postgres(sourceUrl, { max: 1, ssl: 'require' });
const target = postgres(targetUrl, { max: 1, ssl: 'require' });

const id = (prefix) => `${prefix}_${randomUUID().replaceAll('-', '')}`;
const sequence = (n) => String(n).padStart(4, '0');
const yearOf = (value) => new Date(value).getUTCFullYear();

/** Old `full` plans were one whole subscription; the nearest current type is individual. */
const PLAN_TYPE = {
  full: 'individual',
  individual: 'individual',
  shared: 'shared',
  family: 'family',
};
/** The old app called every service "streaming"; the current enum says what kind of media. */
const SERVICE_CATEGORY = { streaming: 'video', video: 'video', music: 'music', gaming: 'gaming' };

function categoryOf(value) {
  const mapped = SERVICE_CATEGORY[String(value).toLowerCase()];

  if (mapped === undefined) throw new Error(`Unknown service category: ${value}`);

  return mapped;
}

function planTypeOf(value) {
  const mapped = PLAN_TYPE[String(value).toLowerCase()];

  if (mapped === undefined) throw new Error(`Unknown plan type: ${value}`);

  return mapped;
}

/**
 * A parent that was not mapped is a broken reference, not a missing value —
 * inserting null into a required column would fail with a database error that
 * names a constraint instead of the row that is wrong.
 */
function required(map, key, label) {
  const value = map.get(key);

  if (value === undefined) throw new Error(`Missing ${label} for legacy id ${key}`);

  return value;
}

async function assertTargetIsEmpty() {
  const [{ count }] = await target`select count(*)::int as count from customers_customers`;

  if (count > 0) {
    throw new Error('Target already has customers; refusing to import over it.');
  }
}

async function main() {
  await assertTargetIsEmpty();

  const services = await source`select * from services_services order by created_at`;
  const plans = await source`select * from services_plans order by created_at`;
  const clients = await source`select * from subscriptions_clients order by created_at`;
  const subscriptions = await source`select * from subscriptions_subscriptions order by created_at`;
  const payments = await source`select * from subscriptions_payments order by created_at`;
  const accounts = await source`select * from streaming_accounts order by created_at`;
  const profiles = await source`select * from streaming_profiles order by created_at`;
  const assignments = await source`select * from subscription_profiles order by created_at`;
  const notifications = await source`select * from notification_events order by created_at`;
  const links = await source`select * from summary_links order by created_at`;

  // Identity maps, old id -> new id. Built before any insert so a child row can
  // name its parent even when the parent appears later in the list.
  const serviceIds = new Map(services.map((row) => [row.id, id('svc')]));
  const planIds = new Map(plans.map((row) => [row.id, id('pln')]));
  const customerIds = new Map(clients.map((row) => [row.id, id('cst')]));
  const membershipIds = new Map(subscriptions.map((row) => [row.id, id('mbr')]));
  const accountIds = new Map(accounts.map((row) => [row.id, id('acc')]));
  const profileIds = new Map(profiles.map((row) => [row.id, id('prf')]));
  const customerOfMembership = new Map(
    subscriptions.map((row) => [membershipIds.get(row.id), customerIds.get(row.client_id)])
  );

  // Business numbers are sequential per year, assigned in creation order so
  // the numbers read the way the operator remembers them.
  const membershipNumbers = new Map();
  const membershipCounters = new Map();
  const paymentNumbers = new Map();
  const paymentCounters = new Map();

  for (const row of subscriptions) {
    const year = yearOf(row.start_date);
    const next = (membershipCounters.get(year) ?? 0) + 1;

    membershipCounters.set(year, next);
    membershipNumbers.set(row.id, `MBR-${year}-${sequence(next)}`);
  }

  for (const row of payments) {
    const year = yearOf(row.due_date);
    const next = (paymentCounters.get(year) ?? 0) + 1;

    paymentCounters.set(year, next);
    paymentNumbers.set(row.id, `PAY-${year}-${sequence(next)}`);
  }

  const assignedProfileIds = new Set(assignments.map((row) => row.profile_id));

  await target.begin(async (tx) => {
    for (const row of services) {
      // `image_key` stays empty: the old logo is a Cloudinary URL, and this
      // schema stores a storage key that the media service resolves. Copying
      // a URL into it would render a broken image with a double prefix.
      await tx`
        insert into services_services
          (id, name, category, description_content, image_key, supports_profiles, is_active, deleted_at, created_at, updated_at)
        values
          (${serviceIds.get(row.id)}, ${row.name}, ${categoryOf(row.category)},
           ${row.description ?? null}, ${null},
           ${accounts.some((account) => account.service_id === row.id && account.supports_profiles)},
           ${row.is_active}, ${row.deleted_at ?? null}, ${row.created_at}, ${row.updated_at})
      `;
    }

    for (const row of plans) {
      await tx`
        insert into services_plans
          (id, name, duration_months, price, currency_code, plan_type, description_content, is_active, service_id, created_at, updated_at)
        values
          (${planIds.get(row.id)}, ${row.name}, ${row.duration_months}, ${row.price},
           ${row.currency_code}, ${planTypeOf(row.plan_type)}, ${row.description ?? null},
           ${row.is_active}, ${required(serviceIds, row.service_id, 'service')},
           ${row.created_at}, ${row.updated_at})
      `;
    }

    let customerSequence = 0;

    for (const row of clients) {
      customerSequence += 1;
      await tx`
        insert into customers_customers
          (id, business_id, name, email, phone, notes_content, is_active, language, created_at, updated_at)
        values
          (${customerIds.get(row.id)}, ${`CST-${sequence(customerSequence)}`}, ${row.name},
           ${row.email ?? null}, ${row.phone ?? null}, ${row.notes ?? null},
           ${row.is_active}, 'fr', ${row.created_at}, ${row.updated_at})
      `;
    }

    for (const row of subscriptions) {
      await tx`
        insert into memberships_memberships
          (id, business_id, customer_id, plan_id, start_date, end_date, is_recurring, status, renewed_from_id, created_at, updated_at)
        values
          (${membershipIds.get(row.id)}, ${membershipNumbers.get(row.id)},
           ${required(customerIds, row.client_id, 'customer')},
           ${required(planIds, row.plan_id, 'plan')},
           ${row.start_date}, ${row.end_date}, ${row.is_recurring}, ${row.status},
           ${null}, ${row.created_at}, ${row.updated_at})
      `;
    }

    // Second pass: the chain link can point at a row inserted after its child.
    for (const row of subscriptions) {
      if (row.renewed_from_id === null || row.renewed_from_id === undefined) continue;
      const parentId = membershipIds.get(row.renewed_from_id);

      if (parentId === undefined) continue;
      await tx`update memberships_memberships set renewed_from_id = ${parentId} where id = ${membershipIds.get(row.id)}`;
    }

    for (const row of payments) {
      const membershipId = required(membershipIds, row.subscription_id, 'membership');

      await tx`
        insert into memberships_payments
          (id, business_id, membership_id, customer_id, amount, currency_code, due_date, paid_date, status, method, notes, created_at, updated_at)
        values
          (${id('pay')}, ${paymentNumbers.get(row.id)}, ${membershipId},
           ${required(customerOfMembership, membershipId, 'customer for membership')},
           ${row.amount}, ${row.currency_code}, ${row.due_date}, ${row.paid_date ?? null},
           ${row.status}, ${null}, ${row.notes ?? null}, ${row.created_at}, ${row.updated_at})
      `;
    }

    for (const row of accounts) {
      await tx`
        insert into streaming_accounts
          (id, service_id, label, email, supports_profiles, max_profiles, is_active, password_encrypted, created_at, updated_at)
        values
          (${accountIds.get(row.id)}, ${required(serviceIds, row.service_id, 'service for account')},
           ${row.label}, ${row.email ?? null}, ${row.supports_profiles}, ${row.max_profiles},
           ${row.is_active}, ${null}, ${row.created_at}, ${row.updated_at})
      `;
    }

    for (const row of profiles) {
      await tx`
        insert into streaming_profiles
          (id, account_id, name, pin_encrypted, is_assigned, created_at, updated_at)
        values
          (${profileIds.get(row.id)}, ${required(accountIds, row.account_id, 'account')},
           ${row.name}, ${row.pin_encrypted ?? null}, ${assignedProfileIds.has(row.id)},
           ${row.created_at}, ${row.updated_at})
      `;
    }

    for (const row of assignments) {
      await tx`
        insert into streaming_profile_assignments
          (id, account_id, membership_id, profile_id, assigned_at, created_at)
        values
          (${id('asg')}, ${required(accountIds, row.account_id, 'account for assignment')},
           ${required(membershipIds, row.subscription_id, 'membership for assignment')},
           ${required(profileIds, row.profile_id, 'profile for assignment')},
           ${row.created_at}, ${row.created_at})
      `;
    }

    for (const row of notifications) {
      await tx`
        insert into notifications_events
          (id, event, recipient, status, error_message, sent_at)
        values
          (${id('nte')}, ${row.event}, ${row.to_email}, ${row.success ? 'sent' : 'failed'},
           ${row.error_message ?? null}, ${row.created_at})
      `;
    }

    for (const row of links) {
      await tx`
        insert into settings_summary_links
          (id, token, label, expires_at, created_at)
        values
          (${id('sum')}, ${row.token}, ${row.label ?? null}, ${row.expires_at ?? null}, ${row.created_at})
      `;
    }
  });

  const [{ count: customers }] =
    await target`select count(*)::int as count from customers_customers`;
  const [{ count: memberships }] =
    await target`select count(*)::int as count from memberships_memberships`;
  const [{ count: paymentCount }] =
    await target`select count(*)::int as count from memberships_payments`;
  const [{ count: profileCount }] =
    await target`select count(*)::int as count from streaming_profiles`;

  console.info(
    `Ported ${services.length} services, ${plans.length} plans, ${customers} customers, ` +
      `${memberships} memberships, ${paymentCount} payments, ${profileCount} profiles, ` +
      `${assignments.length} assignments, ${notifications.length} notifications, ${links.length} links.`
  );
}

main()
  .catch((error) => {
    console.error('Port failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await source.end({ timeout: 5 });
    await target.end({ timeout: 5 });
  });
