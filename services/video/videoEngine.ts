import type { VideoSource } from 'expo-video';

export type VideoQualityValue = 'auto' | '720p' | '1080p';
export type QualityPreset = VideoQualityValue;
export type QualityPresetOption = {
  label: string;
  value: QualityPreset;
};

export const videoSpeedPresets = [0.75, 1, 1.25, 1.5, 2];
export const PLAYBACK_SPEEDS = [...videoSpeedPresets] as number[];

export const videoQualityPresets: QualityPresetOption[] = [
  { label: 'Auto', value: 'auto' },
  { label: '720p', value: '720p' },
  { label: '1080p', value: '1080p' },
];
export const QUALITY_PRESETS = videoQualityPresets;

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const createVideoSource = (uri: string, title?: string): VideoSource => ({
  uri,
  metadata: {
    title: title ?? 'Hikmah Video',
  },
});
