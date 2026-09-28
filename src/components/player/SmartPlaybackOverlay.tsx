import {
  ChevronRight,
  CirclePlay,
  Clock,
  Signal,
  SignalZero,
  SkipForward,
  Sparkles,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useSmartPlayback } from '@/hooks/useSmartPlayback';
import { formatTime } from '@/utils/formatters';

interface SmartPlaybackOverlayProps {
  /** Seek target in seconds (engine units). Audio callers convert ms→s. */
  onSeek: (positionSec: number) => void;
}

export const SmartPlaybackOverlay: React.FC<SmartPlaybackOverlayProps> = ({ onSeek }) => {
  const {
    networkState,
    currentQuality,
    qualityDecision,
    showSkipButton,
    currentSkipSegment,
    handleSkip,
    showResumePrompt,
    resumeData,
    handleResume,
    dismissResume,
    smartQueue,
    isSmartQueueActive,
  } = useSmartPlayback();

  // ── Skip Button ──
  const handleSkipPress = () => {
    const target = handleSkip();
    if (target !== null) {
      onSeek(target);
    }
  };

  // ── Network Icon ──
  const getNetworkIcon = () => {
    switch (networkState.quality) {
      case 'excellent':
        return <Wifi size={14} color={Colors.success} />;
      case 'good':
        return <Wifi size={14} color={Colors.secondary} />;
      case 'fair':
        return <Signal size={14} color={Colors.warning} />;
      case 'poor':
        return <SignalZero size={14} color={Colors.danger} />;
      case 'offline':
        return <WifiOff size={14} color={Colors.danger} />;
    }
  };

  const skipLabel =
    currentSkipSegment?.type === 'intro'
      ? 'Intro'
      : currentSkipSegment?.type === 'outro'
        ? 'Outro'
        : 'Ad';

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* ── Top Status Bar ── */}
      <View style={styles.statusBar} pointerEvents="box-none">
        {/* Network Indicator */}
        <View style={styles.statusChip}>
          {getNetworkIcon()}
          <Text style={styles.statusText}>
            {networkState.type === 'wifi'
              ? 'Wi-Fi'
              : networkState.type === 'cellular'
                ? 'Mobile'
                : 'Offline'}
          </Text>
        </View>

        {/* Quality Indicator */}
        {qualityDecision && currentQuality !== 'auto' && (
          <View style={styles.statusChip}>
            <Zap size={12} color={Colors.accent} />
            <Text style={styles.statusText}>{currentQuality}</Text>
          </View>
        )}

        {/* Auto Quality Reason */}
        {qualityDecision?.reason && currentQuality === 'auto' && (
          <View style={[styles.statusChip, styles.autoChip]}>
            <Sparkles size={12} color={Colors.warning} />
            <Text style={styles.statusText} numberOfLines={1}>
              Auto
            </Text>
          </View>
        )}
      </View>

      {/* ── Skip Intro/Outro Button ── */}
      {showSkipButton && currentSkipSegment && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkipPress} activeOpacity={0.8}>
          <SkipForward size={18} color={Colors.white} />
          <Text style={styles.skipText}>Skip {skipLabel}</Text>
          <ChevronRight size={16} color={Colors.white} />
        </TouchableOpacity>
      )}

      {/* ── Resume Prompt ── */}
      {showResumePrompt && resumeData && (
        <View style={styles.resumeBanner}>
          <View style={styles.resumeInfo}>
            <CirclePlay size={20} color={Colors.secondary} />
            <View style={styles.resumeTextWrap}>
              <Text style={styles.resumeTitle}>Continue from where you left off?</Text>
              <Text style={styles.resumeTime}>
                <Clock size={12} color={Colors.muted} /> {formatTime(resumeData.position)} /{' '}
                {formatTime(resumeData.duration)} ({resumeData.percentComplete}%)
              </Text>
            </View>
          </View>
          <View style={styles.resumeActions}>
            <TouchableOpacity
              style={styles.resumeBtn}
              onPress={() => {
                const pos = handleResume();
                if (pos !== null) onSeek(pos);
              }}
            >
              <Text style={styles.resumeBtnText}>Resume</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dismissBtn} onPress={dismissResume}>
              <Text style={styles.dismissBtnText}>Start Over</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Smart Queue Indicator ── */}
      {isSmartQueueActive && smartQueue.length > 0 && !showResumePrompt && (
        <View style={styles.smartQueueBanner} pointerEvents="box-none">
          <Sparkles size={14} color={Colors.accent} />
          <Text style={styles.smartQueueText} numberOfLines={1}>
            Up next: {smartQueue[0]?.media.title} — {smartQueue[0]?.reason}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 30,
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  statusBar: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignSelf: 'flex-end',
    marginTop: Spacing.xxl,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  autoChip: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
  },
  // Skip Button
  skipButton: {
    position: 'absolute',
    right: Spacing.xl,
    bottom: 120,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.white,
  },
  // Resume Banner
  resumeBanner: {
    position: 'absolute',
    bottom: 100,
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.secondary,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  resumeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  resumeTextWrap: {
    flex: 1,
  },
  resumeTitle: {
    ...Typography.h4,
    fontSize: 14,
    marginBottom: 2,
  },
  resumeTime: {
    ...Typography.bodySmall,
    fontSize: 12,
    color: Colors.muted,
  },
  resumeActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  resumeBtn: {
    flex: 1,
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  resumeBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.background,
  },
  dismissBtn: {
    flex: 1,
    backgroundColor: Colors.card,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dismissBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.muted,
  },
  // Smart Queue
  smartQueueBanner: {
    position: 'absolute',
    bottom: 80,
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.2)',
  },
  smartQueueText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.accent,
  },
});
