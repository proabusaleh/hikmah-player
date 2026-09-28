import NetInfo from '@react-native-community/netinfo';
import { create } from 'zustand';

import { SmartPlaybackEngine } from '@/services/playback/smartPlaybackEngine';
import { StorageService } from '@/services/storage/storageService';
import { MediaItem } from '@/types/media';
import { PlaybackProgress } from '@/types/progress';
import {
  DEFAULT_SMART_CONFIG,
  NetworkState,
  QualityDecision,
  QualityLevel,
  RecommendationContext,
  ResumeData,
  SkipProfile,
  SkipSegment,
  SmartPlaybackConfig,
  SmartQueueItem,
} from '@/types/smartPlayback';

const CONFIG_KEY = '@hikmah_smart_config';

interface SmartPlaybackState {
  // Config
  config: SmartPlaybackConfig;

  // Network
  networkState: NetworkState;
  isMonitoringNetwork: boolean;

  // Quality
  currentQuality: QualityLevel;
  qualityDecision: QualityDecision | null;
  userQualityPreference: QualityLevel;

  // Skip
  currentSkipSegment: SkipSegment | null;
  showSkipButton: boolean;

  // Smart Queue
  smartQueue: SmartQueueItem[];
  isSmartQueueActive: boolean;

  // Resume
  resumeData: ResumeData | null;
  showResumePrompt: boolean;

  // Recently Played
  recentlyPlayedIds: string[];

  // Actions — Config
  loadConfig: () => Promise<void>;
  updateConfig: (updates: Partial<SmartPlaybackConfig>) => Promise<void>;

  // Actions — Network
  startNetworkMonitoring: () => void;
  stopNetworkMonitoring: () => void;
  refreshNetwork: () => Promise<void>;

  // Actions — Quality
  setUserQuality: (quality: QualityLevel) => void;
  recalculateQuality: () => Promise<void>;

  // Actions — Skip
  checkSkipOpportunity: (
    positionSec: number,
    durationSec: number,
    mediaId: string
  ) => Promise<void>;
  executeSkip: () => number | null;
  saveSkipSegment: (mediaId: string, segment: SkipSegment) => Promise<void>;

  // Actions — Smart Queue
  generateSmartQueue: (
    currentMedia: MediaItem | null,
    allMedia: MediaItem[],
    progressRecords: PlaybackProgress[]
  ) => void;
  getNextSmartItem: () => SmartQueueItem | null;

  // Actions — Resume
  checkResume: (mediaId: string, progressRecords: PlaybackProgress[]) => void;
  dismissResume: () => void;
  acceptResume: () => number | null;

  // Actions — Recently Played
  recordPlay: (mediaId: string) => void;
}

let networkUnsubscribe: (() => void) | null = null;

export const useSmartPlaybackStore = create<SmartPlaybackState>((set, get) => ({
  config: { ...DEFAULT_SMART_CONFIG },
  networkState: {
    type: 'unknown',
    quality: 'fair',
    bandwidthMbps: 2,
    isMetered: false,
  },
  isMonitoringNetwork: false,
  currentQuality: 'auto',
  qualityDecision: null,
  userQualityPreference: 'auto',
  currentSkipSegment: null,
  showSkipButton: false,
  smartQueue: [],
  isSmartQueueActive: false,
  resumeData: null,
  showResumePrompt: false,
  recentlyPlayedIds: [],

  // ── Config ──
  loadConfig: async () => {
    const saved = await StorageService.getItem<SmartPlaybackConfig>(CONFIG_KEY);
    if (saved) {
      set({ config: { ...DEFAULT_SMART_CONFIG, ...saved } });
    }
  },

  updateConfig: async (updates) => {
    const newConfig = { ...get().config, ...updates };
    set({ config: newConfig });
    await StorageService.setItem(CONFIG_KEY, newConfig);
  },

  // ── Network ──
  startNetworkMonitoring: () => {
    if (get().isMonitoringNetwork) return;

    networkUnsubscribe = NetInfo.addEventListener((state) => {
      const type = state.isConnected
        ? state.type === 'wifi'
          ? 'wifi'
          : state.type === 'cellular'
            ? 'cellular'
            : 'unknown'
        : 'none';

      const quality = SmartPlaybackEngine.assessNetworkQuality(type, state);
      const bandwidth = SmartPlaybackEngine.estimateBandwidth(quality);

      set({
        networkState: {
          type,
          quality,
          bandwidthMbps: bandwidth,
          isMetered: type === 'cellular',
        },
      });

      // Auto-recalculate quality if enabled
      if (get().config.autoQuality && get().config.networkAware) {
        void get().recalculateQuality();
      }
    });

    set({ isMonitoringNetwork: true });
    // Prime with current state immediately
    void get().refreshNetwork();
  },

  stopNetworkMonitoring: () => {
    if (networkUnsubscribe) {
      networkUnsubscribe();
      networkUnsubscribe = null;
    }
    set({ isMonitoringNetwork: false });
  },

  refreshNetwork: async () => {
    const state = await SmartPlaybackEngine.getNetworkState();
    set({ networkState: state });
  },

  // ── Quality ──
  setUserQuality: (quality) => {
    set({ userQualityPreference: quality });
    void get().recalculateQuality();
  },

  recalculateQuality: async () => {
    const { networkState, userQualityPreference, config } = get();
    const decision = SmartPlaybackEngine.decideQuality(
      networkState,
      userQualityPreference,
      !config.networkAware // If not network-aware, allow metered
    );
    set({
      qualityDecision: decision,
      currentQuality: decision.selected,
    });
  },

  // ── Skip ──
  checkSkipOpportunity: async (positionSec, durationSec, mediaId) => {
    const { config } = get();
    if (!config.skipIntro && !config.skipOutro) {
      set({ currentSkipSegment: null, showSkipButton: false });
      return;
    }

    const profile = await SmartPlaybackEngine.getSkipProfile(mediaId);
    const segment = SmartPlaybackEngine.detectSkipOpportunity(positionSec, durationSec, profile);

    if (segment) {
      const shouldShow =
        (segment.type === 'intro' && config.skipIntro) ||
        (segment.type === 'outro' && config.skipOutro) ||
        segment.type === 'ad';

      set({
        currentSkipSegment: segment,
        showSkipButton: shouldShow,
      });
    } else {
      set({ currentSkipSegment: null, showSkipButton: false });
    }
  },

  executeSkip: () => {
    const { currentSkipSegment } = get();
    if (!currentSkipSegment) return null;

    const target = SmartPlaybackEngine.getSkipTarget(currentSkipSegment);
    set({ currentSkipSegment: null, showSkipButton: false });
    return target;
  },

  saveSkipSegment: async (mediaId, segment) => {
    const profile: SkipProfile = {
      mediaId,
      segments: [segment],
      updatedAt: Date.now(),
    };
    await SmartPlaybackEngine.saveSkipProfile(profile);
  },

  // ── Smart Queue ──
  generateSmartQueue: (currentMedia, allMedia, progressRecords) => {
    const { config, recentlyPlayedIds } = get();
    if (!config.smartQueue) {
      set({ smartQueue: [], isSmartQueueActive: false });
      return;
    }

    const context: RecommendationContext = {
      currentMediaId: currentMedia?.id || null,
      currentCategory: '',
      currentTags: [],
      recentlyPlayedIds,
      favoriteCategories: [],
      timeOfDay: SmartPlaybackEngine.getTimeOfDay(),
      listeningStreak: recentlyPlayedIds.length,
    };

    const queue = SmartPlaybackEngine.buildSmartQueue(
      currentMedia,
      allMedia,
      progressRecords,
      context
    );

    set({ smartQueue: queue, isSmartQueueActive: true });
  },

  getNextSmartItem: () => {
    const { smartQueue } = get();
    return smartQueue.length > 0 ? smartQueue[0] : null;
  },

  // ── Resume ──
  checkResume: (mediaId, progressRecords) => {
    const { config } = get();
    if (!config.autoResume) {
      set({ resumeData: null, showResumePrompt: false });
      return;
    }

    const data = SmartPlaybackEngine.getResumeData(mediaId, progressRecords);
    if (data && data.canResume) {
      set({ resumeData: data, showResumePrompt: true });
    } else {
      set({ resumeData: null, showResumePrompt: false });
    }
  },

  dismissResume: () => {
    set({ showResumePrompt: false });
  },

  acceptResume: () => {
    const { resumeData } = get();
    set({ showResumePrompt: false });
    return resumeData?.position || null;
  },

  // ── Recently Played ──
  recordPlay: (mediaId) => {
    set((state) => {
      const filtered = state.recentlyPlayedIds.filter((id) => id !== mediaId);
      return {
        recentlyPlayedIds: [mediaId, ...filtered].slice(0, 50),
      };
    });
  },
}));
