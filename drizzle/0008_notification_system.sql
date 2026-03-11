-- Migration: notification settings toggles + audit log
CREATE TABLE IF NOT EXISTS "notification_settings"
(
    "event"      text PRIMARY KEY         NOT NULL,
    "enabled"    boolean                  NOT NULL DEFAULT true,
    "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "notification_events"
(
    "id"            text PRIMARY KEY         NOT NULL,
    "event"         text                     NOT NULL,
    "subject"       text                     NOT NULL,
    "to_email"      text                     NOT NULL,
    "success"       boolean                  NOT NULL,
    "error_message" text,
    "created_at"    timestamp with time zone NOT NULL DEFAULT now()
);

-- Seed default notification settings
INSERT INTO "notification_settings" ("event", "enabled")
VALUES ('new_inquiry', true),
       ('payment_overdue', true),
       ('payment_paid', false),
       ('subscription_created', false),
       ('subscription_renewed', true),
       ('subscription_expiring', true)
ON CONFLICT ("event") DO NOTHING;
