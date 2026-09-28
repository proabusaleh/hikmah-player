import Slider from '@react-native-community/slider';
import { RotateCw, Smartphone, Sun, SunDim, SunMedium } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { HikmahIconButton } from '@/components/common/HikmahIconButton';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useSettingsStore } from '@/store/useSettingsStore';

export const DisplaySettings: React.FC = () => {
  const { brightness, autoRotate, updateSetting } = useSettingsStore();

  const BrightnessIcon = brightness < 0.33 ? SunDim : brightness < 0.66 ? SunMedium : Sun;

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <BrightnessIcon size={18} color={Colors.warning} />
        <Text style={styles.sectionTitle}>Brightness</Text>
        <Text style={styles.valueLabel}>{Math.round(brightness * 100)}%</Text>
      </View>

      <View style={styles.sliderContainer}>
        <SunDim size={16} color={Colors.dim} />
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={1}
          step={0.05}
          value={brightness}
          minimumTrackTintColor={Colors.warning}
          maximumTrackTintColor={Colors.border}
          thumbTintColor={Colors.warning}
          onValueChange={(value) => updateSetting('brightness', value)}
        />
        <Sun size={16} color={Colors.warning} />
      </View>

      <View style={styles.presetRow}>
        {[
          { label: 'Low', value: 0.25 },
          { label: 'Medium', value: 0.5 },
          { label: 'High', value: 0.75 },
          { label: 'Max', value: 1.0 },
        ].map((preset) => (
          <HikmahIconButton
            key={preset.label}
            icon={
              <Text
                style={[
                  styles.presetText,
                  Math.abs(brightness - preset.value) < 0.1 && styles.presetTextActive,
                ]}
              >
                {preset.label}
              </Text>
            }
            onPress={() => updateSetting('brightness', preset.value)}
            variant={Math.abs(brightness - preset.value) < 0.1 ? 'accent' : 'filled'}
            size="sm"
          />
        ))}
      </View>

      <View style={styles.divider} />

      <View style={styles.sectionHeader}>
        <RotateCw size={18} color={Colors.info} />
        <Text style={styles.sectionTitle}>Orientation</Text>
      </View>

      <View style={styles.orientationRow}>
        <View style={[styles.orientationCard, autoRotate && styles.orientationCardActive]}>
          <HikmahIconButton
            icon={<RotateCw size={20} color={autoRotate ? Colors.background : Colors.text} />}
            onPress={() => updateSetting('autoRotate', true)}
            variant={autoRotate ? 'accent' : 'filled'}
            size="md"
          />
          <Text style={[styles.orientationLabel, autoRotate && styles.orientationLabelActive]}>
            Auto
          </Text>
        </View>

        <View style={[styles.orientationCard, !autoRotate && styles.orientationCardActive]}>
          <HikmahIconButton
            icon={<Smartphone size={20} color={!autoRotate ? Colors.background : Colors.text} />}
            onPress={() => updateSetting('autoRotate', false)}
            variant={!autoRotate ? 'accent' : 'filled'}
            size="md"
          />
          <Text style={[styles.orientationLabel, !autoRotate && styles.orientationLabelActive]}>
            Portrait
          </Text>
        </View>
      </View>
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
  valueLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.warning,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: Spacing.sm,
  },
  presetText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.muted,
  },
  presetTextActive: {
    color: Colors.background,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xl,
  },
  orientationRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.sm,
  },
  orientationCard: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  orientationCardActive: {
    borderColor: Colors.secondary,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  orientationLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.muted,
  },
  orientationLabelActive: {
    color: Colors.secondary,
  },
});
