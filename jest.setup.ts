/* eslint-disable @typescript-eslint/no-explicit-any */

// ─── Mock Expo Modules ───────────────────────────────
jest.mock('expo-av', () => {
  const makeSound = () => ({
    playAsync: jest.fn().mockResolvedValue(undefined),
    pauseAsync: jest.fn().mockResolvedValue(undefined),
    stopAsync: jest.fn().mockResolvedValue(undefined),
    unloadAsync: jest.fn().mockResolvedValue(undefined),
    setPositionAsync: jest.fn().mockResolvedValue(undefined),
    setRateAsync: jest.fn().mockResolvedValue(undefined),
    setVolumeAsync: jest.fn().mockResolvedValue(undefined),
    setIsMutedAsync: jest.fn().mockResolvedValue(undefined),
    getStatusAsync: jest.fn().mockResolvedValue({
      isLoaded: true,
      isPlaying: false,
      positionMillis: 0,
      durationMillis: 120000,
      isBuffering: false,
      rate: 1.0,
      volume: 1.0,
      isMuted: false,
    }),
    setOnPlaybackStatusUpdate: jest.fn(),
  });

  return {
    Audio: {
      setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
      Sound: {
        // Fresh sound mocks per call so tests can assert per-track behavior
        createAsync: jest.fn(async () => ({
          sound: makeSound(),
          status: { isLoaded: true, durationMillis: 120000 },
        })),
      },
    },
    InterruptionModeAndroid: { DoNotMix: 1 },
    InterruptionModeIOS: { DoNotMix: 1 },
  };
});

jest.mock('expo-video', () => ({
  useVideoPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    currentTime: 0,
    duration: 120,
    playing: false,
    volume: 1.0,
    playbackRate: 1.0,
    muted: false,
    loop: false,
    status: 'ready',
  })),
  VideoView: 'VideoView',
}));

const mockFileSystem = {
  documentDirectory: 'file:///mock/documents/',
  cacheDirectory: 'file:///mock/cache/',
  getInfoAsync: jest.fn().mockResolvedValue({ exists: false }),
  makeDirectoryAsync: jest.fn().mockResolvedValue(undefined),
  readDirectoryAsync: jest.fn().mockResolvedValue([]),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  createDownloadResumable: jest.fn(() => ({
    downloadAsync: jest.fn().mockResolvedValue({ uri: 'file:///mock/downloaded.mp3' }),
    pauseAsync: jest.fn().mockResolvedValue(undefined),
    resumeAsync: jest.fn().mockResolvedValue(undefined),
  })),
};

jest.mock('expo-file-system', () => mockFileSystem);
jest.mock('expo-file-system/legacy', () => mockFileSystem);

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  setNotificationCategoryAsync: jest.fn().mockResolvedValue(undefined),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('mock-id'),
  dismissNotificationAsync: jest.fn().mockResolvedValue(undefined),
  dismissAllNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  AndroidImportance: { LOW: 2, DEFAULT: 3, HIGH: 4 },
  AndroidNotificationVisibility: { PUBLIC: 1 },
  AndroidNotificationPriority: { LOW: -1, DEFAULT: 0, HIGH: 1 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));

jest.mock('expo-screen-orientation', () => ({
  lockAsync: jest.fn().mockResolvedValue(undefined),
  OrientationLock: { PORTRAIT_UP: 1, LANDSCAPE: 4 },
}));

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageCode: 'en' }]),
}));

jest.mock('expo-image', () => ({
  Image: 'Image',
  clearMemoryCache: jest.fn().mockResolvedValue(true),
  clearDiskCache: jest.fn().mockResolvedValue(true),
  prefetch: jest.fn().mockResolvedValue(true),
}));

jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { MD5: 'MD5', SHA256: 'SHA256' },
  digestStringAsync: jest.fn().mockResolvedValue('mockhash'),
}));

jest.mock('expo-media-library', () => ({
  Asset: jest.fn(),
  Query: jest.fn(),
  AssetField: { MEDIA_TYPE: 'mediaType', CREATION_TIME: 'creationTime' },
  MediaType: { AUDIO: 'audio', VIDEO: 'video', IMAGE: 'image', UNKNOWN: 'unknown' },
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted', granted: true }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted', granted: true }),
}));

jest.mock('expo-device', () => ({
  isDevice: true,
}));

// In-memory AsyncStorage so StorageService-backed code runs for real
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    setItem: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    getItem: jest.fn(async (key: string) => (store.has(key) ? store.get(key)! : null)),
    removeItem: jest.fn(async (key: string) => {
      store.delete(key);
    }),
    clear: jest.fn(async () => {
      store.clear();
    }),
    __reset: () => store.clear(),
  };
});

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    fetch: jest.fn().mockResolvedValue({
      isConnected: true,
      type: 'wifi',
      details: { strength: 80 },
    }),
    addEventListener: jest.fn(() => jest.fn()),
  },
  fetch: jest.fn().mockResolvedValue({
    isConnected: true,
    type: 'wifi',
    details: { strength: 80 },
  }),
  addEventListener: jest.fn(() => jest.fn()),
}));

jest.mock('@react-native-community/slider', () => 'Slider');

// Lucide icons render react-native-svg; stub them to keep UI tests focused
jest.mock('lucide-react-native', () => {
  return new Proxy(
    {},
    {
      get: (_target, prop: string) => {
        if (prop === '__esModule') return true;
        const MockIcon = () => null;
        (MockIcon as any).displayName = `MockedIcon(${String(prop)})`;
        return MockIcon;
      },
    }
  );
});

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  })),
  useLocalSearchParams: jest.fn(() => ({})),
  useSegments: jest.fn(() => []),
  Stack: { Screen: 'StackScreen' },
  Tabs: { Screen: 'TabScreen' },
  Redirect: 'Redirect',
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaProvider: ({ children }: any) => React.createElement(React.Fragment, null, children),
    SafeAreaView: ({ children }: any) => React.createElement(React.Fragment, null, children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

// ─── Quieter logs (keep warnings/errors visible) ─────
global.console = {
  ...console,
  log: jest.fn(),
};
