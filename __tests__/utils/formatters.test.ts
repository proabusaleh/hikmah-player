import { formatFileSize, formatTime } from '@/utils/formatters';

describe('formatTime', () => {
  it('should format seconds to MM:SS', () => {
    expect(formatTime(65)).toBe('01:05');
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(3661)).toBe('01:01:01');
  });

  it('should format milliseconds when flag is true', () => {
    expect(formatTime(65000, true)).toBe('01:05');
    expect(formatTime(120000, true)).toBe('02:00');
  });

  it('should handle NaN and negative values', () => {
    expect(formatTime(NaN)).toBe('00:00');
    expect(formatTime(-10)).toBe('00:00');
  });
});

describe('formatFileSize', () => {
  it('should format bytes correctly', () => {
    expect(formatFileSize(500)).toBe('500.0 B');
    expect(formatFileSize(1024)).toBe('1.0 KB');
    expect(formatFileSize(1048576)).toBe('1.0 MB');
    expect(formatFileSize(1073741824)).toBe('1.0 GB');
  });

  it('should handle undefined and zero', () => {
    expect(formatFileSize(undefined)).toBe('0 B');
    expect(formatFileSize(0)).toBe('0 B');
  });
});
