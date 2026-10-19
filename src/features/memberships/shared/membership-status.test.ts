import {
  formatExpiryCountdown,
  getExpiryUrgency,
  isExpiringSoon,
} from '@/features/memberships/shared/membership-status';

function inDays(days: number): string {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

describe('getExpiryUrgency', () => {
  it('shouts inside a week and warns inside a month', () => {
    expect(getExpiryUrgency(inDays(0), 'active')).toBe('critical');
    expect(getExpiryUrgency(inDays(7), 'active')).toBe('critical');
    expect(getExpiryUrgency(inDays(8), 'active')).toBe('caution');
    expect(getExpiryUrgency(inDays(30), 'active')).toBe('caution');
    expect(getExpiryUrgency(inDays(31), 'active')).toBe('none');
  });

  it('stays quiet for a term that already ended or was cancelled', () => {
    expect(getExpiryUrgency(inDays(-1), 'active')).toBe('none');
    expect(getExpiryUrgency(inDays(3), 'cancelled')).toBe('none');
    expect(getExpiryUrgency(inDays(3), 'expired')).toBe('none');
  });

  it('survives an unparseable date', () => {
    expect(getExpiryUrgency('not-a-date', 'active')).toBe('none');
    expect(formatExpiryCountdown('not-a-date', 'active')).toBeNull();
  });
});

describe('formatExpiryCountdown', () => {
  it('names the deadline rather than leaving a colour to carry it', () => {
    expect(formatExpiryCountdown(inDays(0), 'active')).toBe('ends today');
    expect(formatExpiryCountdown(inDays(1), 'active')).toBe('ends tomorrow');
    expect(formatExpiryCountdown(inDays(12), 'active')).toBe('ends in 12 days');
  });

  it('says nothing when there is nothing to chase', () => {
    expect(formatExpiryCountdown(inDays(60), 'active')).toBeNull();
    expect(formatExpiryCountdown(inDays(2), 'cancelled')).toBeNull();
  });
});

describe('isExpiringSoon', () => {
  it('agrees with the urgency the row shows', () => {
    expect(isExpiringSoon(inDays(3), 'active')).toBe(true);
    expect(isExpiringSoon(inDays(25), 'active')).toBe(true);
    expect(isExpiringSoon(inDays(40), 'active')).toBe(false);
  });
});
