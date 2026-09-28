import { AccessibilityInfo, Platform } from 'react-native';

// ─── Accessibility Helpers ───────────────────────────
export const Accessibility = {
  /**
   * Check if screen reader is active
   */
  async isScreenReaderEnabled(): Promise<boolean> {
    try {
      return await AccessibilityInfo.isScreenReaderEnabled();
    } catch {
      return false;
    }
  },

  /**
   * Announce a message to the screen reader
   */
  announce(message: string): void {
    if (Platform.OS === 'android') {
      AccessibilityInfo.announceForAccessibility(message);
    } else {
      AccessibilityInfo.announceForAccessibilityWithOptions(message, { queue: true });
    }
  },

  /**
   * Check if bold text is enabled (iOS)
   */
  async isBoldTextEnabled(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      try {
        return await AccessibilityInfo.isBoldTextEnabled();
      } catch {
        return false;
      }
    }
    return false;
  },

  /**
   * Check if reduce motion is enabled
   */
  async isReduceMotionEnabled(): Promise<boolean> {
    try {
      return await AccessibilityInfo.isReduceMotionEnabled();
    } catch {
      return false;
    }
  },

  /**
   * Check if high text contrast is enabled
   */
  async isHighTextContrastEnabled(): Promise<boolean> {
    try {
      return await AccessibilityInfo.isHighTextContrastEnabled();
    } catch {
      return false;
    }
  },
};

// ─── Accessibility Label Builders ────────────────────
export const a11yLabels = {
  playButton: (title: string) => `Play ${title}`,
  pauseButton: (title: string) => `Pause ${title}`,
  skipForward: (seconds: number) => `Skip forward ${seconds} seconds`,
  skipBackward: (seconds: number) => `Skip backward ${seconds} seconds`,
  seekTo: (percent: number) => `Seek to ${percent} percent`,
  volumeSlider: (level: number) => `Volume ${Math.round(level * 100)} percent`,
  speedControl: (speed: number) => `Playback speed ${speed}x`,
  downloadButton: (title: string) => `Download ${title}`,
  favoriteButton: (title: string, isFav: boolean) =>
    `${isFav ? 'Remove' : 'Add'} ${title} ${isFav ? 'from' : 'to'} favorites`,
  progressBar: (current: string, total: string) => `Progress: ${current} of ${total}`,
  mediaCard: (title: string, artist: string, duration: string) =>
    artist ? `${title} by ${artist}, ${duration}` : `${title}, ${duration}`,
  playlistCard: (name: string, count: number) => `Playlist ${name}, ${count} items`,
  searchInput: 'Search for recitations, lectures, playlists',
  miniPlayer: (title: string) => `Now playing: ${title}. Tap to open full player.`,
};

// ─── Accessibility Hints ─────────────────────────────
export const a11yHints = {
  doubleTapToPlay: 'Double tap to play',
  swipeToSeek: 'Swipe left or right to seek',
  longPressForOptions: 'Long press for more options',
  tapToExpand: 'Tap to expand',
  tapToCollapse: 'Tap to collapse',
};
