import {
    History,
    MousePointerClick,
    PlayCircle,
    RotateCcw,
    SkipBack,
    SkipForward,
} from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { HikmahCard } from '@/components/common/HikmahCard';
import { SettingsRow } from '@/components/common/SettingsRow';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { type SkipInterval, useSettingsStore } from '@/store/useSettingsStore';

const SKIP_OPTIONS: SkipInterval[] = [5, 10, 15, 30, 60];

export const AdvancedSettings: React.FC = () => {
  const {
    skipForwardInterval,
    skipBackwardInterval,
    autoPlayNext,
    rememberPosition,
    doubleTapToSeek,
    updateSetting,
    resetToDefaults,
  } = useSettingsStore();

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <SkipForward size={18} color={Colors.secondary} />
        <Text style={styles.sectionTitle}>Skip Forward</Text>
        <Text style={styles.valueBadge}>{skipForwardInterval}s</Text>
      </View>
      <View style={styles.intervalRow}>
        {SKIP_OPTIONS.map((interval) => (
          <TouchableOpacity
            key={`fwd-${interval}`}
            style={[
              styles.intervalChip,
              skipForwardInterval === interval && styles.intervalChipActive,
            ]}
            onPress={() => updateSetting('skipForwardInterval', interval)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.intervalText,
                skipForwardInterval === interval && styles.intervalTextActive,
              ]}
            >
              {interval}s
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.sectionHeader, { marginTop: Spacing.xl }]}> 
        <SkipBack size={18} color={Colors.info} />
        <Text style={styles.sectionTitle}>Skip Backward</Text>
        <Text style={styles.valueBadge}>{skipBackwardInterval}s</Text>
      </View>
      <View style={styles.intervalRow}>
        {SKIP_OPTIONS.map((interval) => (
          <TouchableOpacity
            key={`bwd-${interval}`}
            style={[
              styles.intervalChip,
              skipBackwardInterval === interval && styles.intervalChipActive,
            ]}
            onPress={() => updateSetting('skipBackwardInterval', interval)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.intervalText,
                skipBackwardInterval === interval && styles.intervalTextActive,
              ]}
            >
              {interval}s
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.divider} />

      <HikmahCard variant="bordered" padding="xs">
        <SettingsRow
          icon={<PlayCircle size={18} color={Colors.accent} />}
          label="Auto Play Next"
          description="Automatically play next item in queue"
          isToggle
          toggleValue={autoPlayNext}
          onToggle={(value) => updateSetting('autoPlayNext', value)}
        />
        <SettingsRow
          icon={<History size={18} color={Colors.info} />}
          label="Remember Position"
          description="Resume from where you left off"
          isToggle
          toggleValue={rememberPosition}
          onToggle={(value) => updateSetting('rememberPosition', value)}
        />
        <SettingsRow
          icon={<MousePointerClick size={18} color={Colors.warning} />}
          label="Double Tap to Seek"
          description="Double tap left/right to skip"
          isToggle
          toggleValue={doubleTapToSeek}
          onToggle={(value) => updateSetting('doubleTapToSeek', value)}
        />
      </HikmahCard>

      <TouchableOpacity style={styles.resetButton} onPress={resetToDefaults} activeOpacity={0.7}>
        <RotateCcw size={16} color={Colors.danger} />
        <Text style={styles.resetText}>Reset All to Defaults</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h4,
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  valueBadge: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.secondary,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  intervalRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  intervalChip: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  intervalChipActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  intervalText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.muted,
  },
  intervalTextActive: {
    color: Colors.background,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xl,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xxl,
    paddingVertical: Spacing.lg,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: BorderRadius.lg,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
  },
  resetText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.danger,
  },
});
