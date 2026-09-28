/**
 * Converts milliseconds or seconds to MM:SS or HH:MM:SS format
 */
export const formatTime = (timeInMsOrSec: number, isMilliseconds = false): string => {
  const totalSeconds = Math.floor(
    isMilliseconds ? timeInMsOrSec / 1000 : timeInMsOrSec
  );

  if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(seconds).padStart(2, '0');

  if (hours > 0) {
    const paddedHours = String(hours).padStart(2, '0');
    return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
  }

  return `${paddedMinutes}:${paddedSeconds}`;
};

/**
 * Converts bytes into human-readable size (e.g. 15.4 MB)
 */
export const formatFileSize = (bytes?: number): string => {
  if (!bytes || bytes <= 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = (bytes / Math.pow(1024, index)).toFixed(1);

  return `${size} ${units[index]}`;
};
