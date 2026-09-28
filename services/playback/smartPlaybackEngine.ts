import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

import { StorageService } from '@/services/storage/storageService';
import { MediaItem } from '@/types/media';
import { PlaybackProgress } from '@/types/progress';
import {
  NetworkQuality,
  NetworkState,
  NetworkType,
  QUALITY_BANDWIDTH_MAP,
  QualityDecision,
  QualityLevel,
  RecommendationContext,
  ResumeData,
  SkipProfile,
  SkipSegment,
  SmartPlaybackConfig,
  SmartQueueItem,
} from '@/types/smartPlayback';

const SKIP_PROFILES_KEY = '@hikmah_skip_profiles';

export const SmartPlaybackEngine = {
  // ═══════════════════════════════════════════════════
  // NETWORK DETECTION
  // ═══════════════════════════════════════════════════

  async getNetworkState(): Promise<NetworkState> {
    try {
      const netInfo = await NetInfo.fetch();

      const type: NetworkType = netInfo.isConnected
        ? netInfo.type === 'wifi'
          ? 'wifi'
          : netInfo.type === 'cellular'
            ? 'cellular'
            : 'unknown'
        : 'none';

      const quality = this.assessNetworkQuality(type, netInfo);

      return {
        type,
        quality,
        bandwidthMbps: this.estimateBandwidth(quality),
        isMetered: type === 'cellular',
      };
    } catch {
      return {
        type: 'unknown',
        quality: 'fair',
        bandwidthMbps: 2,
        isMetered: false,
      };
    }
  },

  assessNetworkQuality(type: NetworkType, netInfo: NetInfoState): NetworkQuality {
    if (type === 'none') return 'offline';

    if (type === 'wifi') {
      const strength =
        netInfo.type === 'wifi' && typeof netInfo.details?.strength === 'number'
          ? netInfo.details.strength
          : 80;
      if (strength > 75) return 'excellent';
      if (strength > 50) return 'good';
      if (strength > 25) return 'fair';
      return 'poor';
    }

    if (type === 'cellular') {
      const gen =
        netInfo.type === 'cellular' ? netInfo.details?.cellularGeneration : null;
      if (gen === '5g') return 'excellent';
      if (gen === '4g') return 'good';
      if (gen === '3g') return 'fair';
      return 'poor';
    }

    return 'fair';
  },

  estimateBandwidth(quality: NetworkQuality): number {
    const map: Record<NetworkQuality, number> = {
      excellent: 25,
      good: 10,
      fair: 3,
      poor: 0.8,
      offline: 0,
    };
    return map[quality];
  },

  // ═══════════════════════════════════════════════════
  // ADAPTIVE QUALITY
  // ═══════════════════════════════════════════════════

  decideQuality(
    networkState: NetworkState,
    userPreference: QualityLevel,
    isMeteredAllowed: boolean
  ): QualityDecision {
    // User explicitly chose a quality
    if (userPreference !== 'auto') {
      return {
        selected: userPreference,
        reason: 'User selected',
        networkQuality: networkState.quality,
        availableLevels: this.getAvailableLevels(networkState),
      };
    }

    // Offline → lowest or cached
    if (networkState.quality === 'offline') {
      return {
        selected: 'audio-only',
        reason: 'No network connection',
        networkQuality: 'offline',
        availableLevels: ['audio-only'],
      };
    }

    // Metered connection → cap at 480p unless allowed
    if (networkState.isMetered && !isMeteredAllowed) {
      return {
        selected: '480p',
        reason: 'Cellular data — quality limited to save data',
        networkQuality: networkState.quality,
        availableLevels: this.getAvailableLevels(networkState),
      };
    }

    // Auto-detect based on bandwidth
    const bandwidth = networkState.bandwidthMbps;
    let selected: QualityLevel = '360p';

    if (bandwidth >= QUALITY_BANDWIDTH_MAP['1080p']) selected = '1080p';
    else if (bandwidth >= QUALITY_BANDWIDTH_MAP['720p']) selected = '720p';
    else if (bandwidth >= QUALITY_BANDWIDTH_MAP['480p']) selected = '480p';
    else if (bandwidth >= QUALITY_BANDWIDTH_MAP['360p']) selected = '360p';
    else selected = '240p';

    return {
      selected,
      reason: `Auto-selected for ${networkState.quality} network (${bandwidth}Mbps)`,
      networkQuality: networkState.quality,
      availableLevels: this.getAvailableLevels(networkState),
    };
  },

  getAvailableLevels(networkState: NetworkState): QualityLevel[] {
    const bandwidth = networkState.bandwidthMbps;
    const levels: QualityLevel[] = ['auto'];

    if (bandwidth >= QUALITY_BANDWIDTH_MAP['1080p']) levels.push('1080p');
    if (bandwidth >= QUALITY_BANDWIDTH_MAP['720p']) levels.push('720p');
    if (bandwidth >= QUALITY_BANDWIDTH_MAP['480p']) levels.push('480p');
    levels.push('360p', '240p', 'audio-only');

    return levels;
  },

  // ═══════════════════════════════════════════════════
  // SKIP INTRO / OUTRO
  // ═══════════════════════════════════════════════════

  async getSkipProfile(mediaId: string): Promise<SkipProfile | null> {
    const profiles = await this.getAllSkipProfiles();
    return profiles.find((p) => p.mediaId === mediaId) || null;
  },

  async getAllSkipProfiles(): Promise<SkipProfile[]> {
    return (await StorageService.getItem<SkipProfile[]>(SKIP_PROFILES_KEY)) || [];
  },

  async saveSkipProfile(profile: SkipProfile): Promise<void> {
    const profiles = await this.getAllSkipProfiles();
    const filtered = profiles.filter((p) => p.mediaId !== profile.mediaId);
    filtered.unshift(profile);
    // Keep max 500 profiles
    await StorageService.setItem(SKIP_PROFILES_KEY, filtered.slice(0, 500));
  },

  /**
   * Detect if current position falls within a skippable segment.
   * All times in seconds.
   */
  detectSkipOpportunity(
    positionSec: number,
    durationSec: number,
    profile: SkipProfile | null
  ): SkipSegment | null {
    if (!profile) return null;

    for (const segment of profile.segments) {
      if (positionSec >= segment.startTime && positionSec < segment.endTime) {
        return segment;
      }
    }

    // Heuristic: detect generic intro (first 15s) and outro (last 30s)
    if (positionSec < 15 && durationSec > 120) {
      return {
        type: 'intro',
        startTime: 0,
        endTime: 15,
        confidence: 0.3,
        source: 'detected',
      };
    }

    if (durationSec - positionSec < 30 && durationSec > 120) {
      return {
        type: 'outro',
        startTime: durationSec - 30,
        endTime: durationSec,
        confidence: 0.3,
        source: 'detected',
      };
    }

    return null;
  },

  /**
   * Get the position (seconds) to seek to when skipping.
   */
  getSkipTarget(segment: SkipSegment): number {
    return segment.endTime;
  },

  // ═══════════════════════════════════════════════════
  // RESUME PLAYBACK
  // ═══════════════════════════════════════════════════

  getResumeData(mediaId: string, progressRecords: PlaybackProgress[]): ResumeData | null {
    const record = progressRecords.find((r) => r.mediaId === mediaId);
    if (!record) return null;

    const percentComplete =
      record.duration > 0 ? Math.round((record.position / record.duration) * 100) : 0;

    return {
      mediaId,
      position: record.position,
      duration: record.duration,
      percentComplete,
      lastPlayedAt: record.updatedAt,
      canResume: percentComplete >= 2 && percentComplete <= 95,
    };
  },

  // ═══════════════════════════════════════════════════
  // AUTO-NEXT LOGIC
  // ═══════════════════════════════════════════════════

  shouldAutoNext(
    config: SmartPlaybackConfig,
    currentPosition: number,
    duration: number,
    queueLength: number,
    currentIndex: number,
    repeatMode: string
  ): boolean {
    if (!config.autoNext) return false;
    if (repeatMode === 'one') return false;
    if (queueLength === 0) return false;

    const isLastTrack = currentIndex >= queueLength - 1;
    if (isLastTrack && repeatMode === 'off') return false;

    // Trigger auto-next when within 2 seconds of end
    return duration - currentPosition <= 2;
  },

  // ═══════════════════════════════════════════════════
  // SMART QUEUE
  // ═══════════════════════════════════════════════════

  buildSmartQueue(
    currentMedia: MediaItem | null,
    allMedia: MediaItem[],
    progressRecords: PlaybackProgress[],
    context: RecommendationContext
  ): SmartQueueItem[] {
    const scored = allMedia
      .filter((m) => m.id !== currentMedia?.id)
      .map((media) => {
        const score = this.scoreRecommendation(media, context, progressRecords);
        const reason = this.getRecommendationReason(media, context);
        const source = this.getRecommendationSource(media, context);

        return {
          media,
          score,
          reason,
          source,
          position: 0,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    return scored.map((item, index) => ({
      ...item,
      position: index + 1,
    }));
  },

  scoreRecommendation(
    media: MediaItem,
    context: RecommendationContext,
    progressRecords: PlaybackProgress[]
  ): number {
    let score = 0;

    // Same category bonus
    if (
      context.currentCategory &&
      media.title.toLowerCase().includes(context.currentCategory.toLowerCase())
    ) {
      score += 0.3;
    }

    // Tag overlap
    const mediaTitleLower = media.title.toLowerCase();
    const tagOverlap = context.currentTags.filter((tag) =>
      mediaTitleLower.includes(tag.toLowerCase())
    ).length;
    score += tagOverlap * 0.15;

    // Not recently played bonus (avoid repeats)
    const wasRecentlyPlayed = context.recentlyPlayedIds.includes(media.id);
    if (!wasRecentlyPlayed) {
      score += 0.2;
    } else {
      score -= 0.3;
    }

    // Incomplete items get priority
    const progress = progressRecords.find((r) => r.mediaId === media.id);
    if (progress && progress.progressPercent > 5 && progress.progressPercent < 90) {
      score += 0.25;
    }

    // Time-of-day relevance
    if (context.timeOfDay === 'night' || context.timeOfDay === 'evening') {
      if (mediaTitleLower.includes('sleep') || mediaTitleLower.includes('relax')) {
        score += 0.15;
      }
    }
    if (context.timeOfDay === 'morning') {
      if (mediaTitleLower.includes('fajr') || mediaTitleLower.includes('morning')) {
        score += 0.15;
      }
    }

    return Math.max(0, Math.min(1, score));
  },

  getRecommendationReason(media: MediaItem, context: RecommendationContext): string {
    const titleLower = media.title.toLowerCase();

    if (context.currentTags.some((t) => titleLower.includes(t.toLowerCase()))) {
      return 'Similar to current';
    }
    if (context.favoriteCategories.some((c) => titleLower.includes(c.toLowerCase()))) {
      return 'From your favorites';
    }
    return 'Recommended for you';
  },

  getRecommendationSource(
    media: MediaItem,
    context: RecommendationContext
  ): SmartQueueItem['source'] {
    if (context.recentlyPlayedIds.includes(media.id)) return 'history';
    if (context.currentTags.length > 0) return 'similar';
    return 'queue';
  },

  getTimeOfDay(): RecommendationContext['timeOfDay'] {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  },
};
