import { formatTransferFee } from '../utils/formatTransferFee';

describe('formatTransferFee', () => {
  it('formats millions shorthand with default £ symbol', () => {
    expect(formatTransferFee('12m')).toBe('£12,000,000');
  });

  it('formats decimal millions', () => {
    expect(formatTransferFee('12.5m')).toBe('£12,500,000');
  });

  it('formats thousands shorthand', () => {
    expect(formatTransferFee('500k')).toBe('£500,000');
  });

  it('formats decimal thousands', () => {
    expect(formatTransferFee('1.2k')).toBe('£1,200');
  });

  it('preserves euro symbol', () => {
    expect(formatTransferFee('€80M')).toBe('€80,000,000');
  });

  it('preserves dollar symbol', () => {
    expect(formatTransferFee('$30m')).toBe('$30,000,000');
  });

  it('preserves pound symbol', () => {
    expect(formatTransferFee('£12m')).toBe('£12,000,000');
  });

  it('passes through already formatted values', () => {
    expect(formatTransferFee('£12,000,000')).toBe('£12,000,000');
  });

  it('passes through already formatted values with euro', () => {
    expect(formatTransferFee('€80,000,000')).toBe('€80,000,000');
  });

  it('uppercases "Free"', () => {
    expect(formatTransferFee('Free')).toBe('FREE');
  });

  it('uppercases "Undisclosed"', () => {
    expect(formatTransferFee('Undisclosed')).toBe('UNDISCLOSED');
  });

  it('uppercases "Loan"', () => {
    expect(formatTransferFee('Loan')).toBe('LOAN');
  });

  it('returns empty string for empty input', () => {
    expect(formatTransferFee('')).toBe('');
  });

  it('returns empty string for whitespace', () => {
    expect(formatTransferFee('   ')).toBe('');
  });

  it('handles uppercase M suffix', () => {
    expect(formatTransferFee('75M')).toBe('£75,000,000');
  });

  it('handles uppercase K suffix', () => {
    expect(formatTransferFee('250K')).toBe('£250,000');
  });

  it('handles plain number without suffix', () => {
    expect(formatTransferFee('5000000')).toBe('£5,000,000');
  });

  it('handles plain number with currency symbol', () => {
    expect(formatTransferFee('€5000000')).toBe('€5,000,000');
  });
});
