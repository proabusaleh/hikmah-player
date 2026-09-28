import Slider from '@react-native-community/slider';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { formatTime } from '@/utils/formatters';

interface ProgressBarProps {
  position: number;
  duration: number;
  onSeek: (positionMs: number) => void;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  position,
  duration,
  onSeek,
}) => {
  const [isSliding, setIsSliding] = useState(false);
  const [slidingValue, setSlidingValue] = useState(0);

  const displayPosition = isSliding ? slidingValue : position;

  return (
    <View style={styles.container}>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={Math.max(duration, 1)}
        value={displayPosition}
        minimumTrackTintColor={Colors.dark.primary}
        maximumTrackTintColor={Colors.dark.border}
        thumbTintColor={Colors.dark.primaryLight}
        onValueChange={(val) => {
          setIsSliding(true);
          setSlidingValue(val);
        }}
        onSlidingComplete={(val) => {
          setIsSliding(false);
          onSeek(val);
        }}
      />
      <View style={styles.timeRow}>
        <Text style={styles.timeText}>{formatTime(displayPosition, true)}</Text>
        <Text style={styles.timeText}>{formatTime(duration, true)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginTop: -8,
  },
  timeText: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    fontVariant: ['tabular-nums'],
  },
});
