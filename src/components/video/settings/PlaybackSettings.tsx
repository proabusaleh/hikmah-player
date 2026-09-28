import {
    Check,
    Gauge,
    Monitor,
    RectangleHorizontal,
    Subtitles,
    Volume2,
} from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import {
    PLAYBACK_SPEEDS,
    QUALITY_PRESETS
} from '@/services/video/videoEngine';
import { type AspectRatioMode, useSettingsStore } from '@/store/useSettingsStore';

const AUDIO_TRACKS = [
  { id: 'default', label: 'Default (Arabic)' },
  { id: 'english', label: 'English' },
  { id: 'urdu', label: 'Urdu' },
  { id: 'bengali', label: 'Bengali' },
] as const;

const SUBTITLE_OPTIONS = [
  { id: 'off', label: 'Off' },
  { id: 'english', label: 'English' },
  { id: 'arabic', label: 'Arabic' },
  { id: 'urdu', label: 'Urdu' },
  { id: 'bengali', label: 'Bengali' },
] as const;

const ASPECT_RATIOS: { value: AspectRatioMode; label: string; icon: string }[] = [
  { value: 'fit', label: 'Fit', icon: '⊡' },
  { value: 'fill', label: 'Fill', icon: '⊞' },
  { value: 'stretch', label: 'Stretch', icon: '↔' },
  { value: '16:9', label: '16:9', icon: '▭' },
  { value: '4:3', label: '4:3', icon: '□' },
];

const SectionTitle: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
  <View style={styles.sectionHeader}>
    {icon}
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

const Chip: React.FC<{ label: string; isActive: boolean; onPress: () => void }> = ({
  label,
  isActive,
  onPress,
}) => (
  <TouchableOpacity
    style={[styles.chip, isActive && styles.chipActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{label}</Text>
    {isActive ? <Check size={12} color={Colors.background} /> : null}
  </TouchableOpacity>
);

const ListOption: React.FC<{ label: string; isActive: boolean; onPress: () => void }> = ({
  label,
  isActive,
  onPress,
}) => (
  <TouchableOpacity
    style={[styles.listOption, isActive && styles.listOptionActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.listOptionText, isActive && styles.listOptionTextActive]}>{label}</Text>
    {isActive ? <Check size={16} color={Colors.secondary} /> : null}
  </TouchableOpacity>
);

export const PlaybackSettings: React.FC = () => {
  const { playbackSpeed, quality, audioTrack, subtitle, aspectRatio, updateSetting } =
    useSettingsStore();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection((previous) => (previous === section ? null : section));
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <SectionTitle icon={<Gauge size={18} color={Colors.secondary} />} title="Playback Speed" />
      <View style={styles.chipGrid}>
        {PLAYBACK_SPEEDS.map((speed) => (
          <Chip
            key={speed}
            label={`${speed}x`}
            isActive={playbackSpeed === speed}
            onPress={() => updateSetting('playbackSpeed', speed)}
          />
        ))}
      </View>

      <View style={styles.sectionGap} />
      <SectionTitle icon={<Monitor size={18} color={Colors.info} />} title="Video Quality" />
      <View style={styles.chipGrid}>
        {QUALITY_PRESETS.map((preset) => (
          <Chip
            key={preset.value}
            label={preset.label}
            isActive={quality === preset.value}
            onPress={() => updateSetting('quality', preset.value)}
          />
        ))}
      </View>

      <View style={styles.sectionGap} />
      <TouchableOpacity
        style={styles.expandableHeader}
        onPress={() => toggleSection('audio')}
        activeOpacity={0.7}
      >
        <View style={styles.sectionHeader}>
          <Volume2 size={18} color={Colors.accent} />
          <Text style={styles.sectionTitle}>Audio Track</Text>
        </View>
        <Text style={styles.currentValue}>
          {AUDIO_TRACKS.find((track) => track.id === audioTrack)?.label ?? 'Default'}
        </Text>
      </TouchableOpacity>
      {expandedSection === 'audio' ? (
        <View style={styles.expandableContent}>
          {AUDIO_TRACKS.map((track) => (
            <ListOption
              key={track.id}
              label={track.label}
              isActive={audioTrack === track.id}
              onPress={() => {
                updateSetting('audioTrack', track.id);
                setExpandedSection(null);
              }}
            />
          ))}
        </View>
      ) : null}

      <View style={styles.divider} />
      <TouchableOpacity
        style={styles.expandableHeader}
        onPress={() => toggleSection('subtitle')}
        activeOpacity={0.7}
      >
        <View style={styles.sectionHeader}>
          <Subtitles size={18} color={Colors.warning} />
          <Text style={styles.sectionTitle}>Subtitles</Text>
        </View>
        <Text style={styles.currentValue}>
          {SUBTITLE_OPTIONS.find((option) => option.id === subtitle)?.label ?? 'Off'}
        </Text>
      </TouchableOpacity>
      {expandedSection === 'subtitle' ? (
        <View style={styles.expandableContent}>
          {SUBTITLE_OPTIONS.map((option) => (
            <ListOption
              key={option.id}
              label={option.label}
              isActive={subtitle === option.id}
              onPress={() => {
                updateSetting('subtitle', option.id);
                setExpandedSection(null);
              }}
            />
          ))}
        </View>
      ) : null}

      <View style={styles.divider} />
      <SectionTitle icon={<RectangleHorizontal size={18} color={Colors.muted} />} title="Aspect Ratio" />
      <View style={styles.chipGrid}>
        {ASPECT_RATIOS.map((ratio) => (
          <Chip
            key={ratio.value}
            label={`${ratio.icon} ${ratio.label}`}
            isActive={aspectRatio === ratio.value}
            onPress={() => updateSetting('aspectRatio', ratio.value)}
          />
        ))}
      </View>
    </ScrollView>
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
  },
  sectionTitle: {
    ...Typography.h4,
    fontSize: 14,
    color: Colors.text,
  },
  sectionGap: {
    height: Spacing.xl,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  chipTextActive: {
    color: Colors.background,
    fontWeight: '800',
  },
  expandableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  currentValue: {
    fontSize: 13,
    color: Colors.secondary,
    fontWeight: '600',
  },
  expandableContent: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  listOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  listOptionActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  listOptionText: {
    fontSize: 14,
    color: Colors.muted,
    fontWeight: '500',
  },
  listOptionTextActive: {
    color: Colors.secondary,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
});
