import { MediaItem } from './media';

// ─── Smart Playback Config ───────────────────────────
export interface SmartPlaybackConfig {
  autoNext: boolean;
  autoResume: boolean;
  smartQueue: boolean;
  skipIntro: boolean;
  skipOutro: boolean;
  autoQuality: boolean;
  networkAware: boolean;
  crossfadeDuration: number; // seconds (0 = disabled)
  gaplessPlayback: boolean;
  prebufferNext: boolean;
}

export const DEFAULT_SMART_CONFIG: SmartPlaybackConfig = {
  autoNext: true,
  autoResume: true,
  smartQueue: true,
  skipIntro: true,
  skipOutro: true,
  autoQuality: true,
  networkAware: true,
  crossfadeDuration: 0,
  gaplessPlayback: true,
  prebufferNext: true,
};

// ─── Network State ───────────────────────────────────
export type NetworkType = 'wifi' | 'cellular' | 'none' | 'unknown';
export type NetworkQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'offline';

export interface NetworkState {
  type: NetworkType;
  quality: NetworkQuality;
  bandwidthMbps: number;
  isMetered: boolean;
}

// ─── Adaptive Quality ────────────────────────────────
export type QualityLevel = 'auto' | '1080p' | '720p' | '480p' | '360p' | '240p' | 'audio-only';

export interface QualityDecision {
  selected: QualityLevel;
  reason: string;
  networkQuality: NetworkQuality;
  availableLevels: QualityLevel[];
}

export const QUALITY_BANDWIDTH_MAP: Record<QualityLevel, number> = {
  auto: 0,
  '1080p': 8,
  '720p': 4,
  '480p': 2,
  '360p': 1,
  '240p': 0.5,
  'audio-only': 0.1,
};

// ─── Skip Detection ──────────────────────────────────
export interface SkipSegment {
  type: 'intro' | 'outro' | 'ad' | 'recap';
  startTime: number; // seconds
  endTime: number; // seconds
  confidence: number; // 0-1
  source: 'manual' | 'detected' | 'crowdsourced';
}

export interface SkipProfile {
  mediaId: string;
  segments: SkipSegment[];
  updatedAt: number;
}

// ─── Smart Queue Item ────────────────────────────────
export interface SmartQueueItem {
  media: MediaItem;
  score: number; // Recommendation score 0-1
  reason: string; // Why this was recommended
  source: 'queue' | 'history' | 'similar' | 'trending' | 'playlist';
  position: number; // Position in smart queue
}

// ─── Recommendation Factors ──────────────────────────
export interface RecommendationContext {
  currentMediaId: string | null;
  currentCategory: string;
  currentTags: string[];
  recentlyPlayedIds: string[];
  favoriteCategories: string[];
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  listeningStreak: number; // Consecutive items played
}

// ─── Resume Data ─────────────────────────────────────
export interface ResumeData {
  mediaId: string;
  position: number; // seconds
  duration: number; // seconds
  percentComplete: number;
  lastPlayedAt: number; // timestamp
  canResume: boolean; // false if > 95% complete
}
