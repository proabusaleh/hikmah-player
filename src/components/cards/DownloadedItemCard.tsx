import { Film, Music, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { MediaItem } from '@/types/media';
import { formatFileSize, formatTime } from '@/utils/formatters';

interface DownloadedItemCardProps {
  item: MediaItem;
  onPress: () => void;
  onDelete: () => void;
}

export const DownloadedItemCard: React.FC<DownloadedItemCardProps> = ({
  item,
  onPress,
  onDelete,
}) => {
  const isVideo = item.type === 'video';
  const [delPressed, setDelPressed] = useState(false);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.iconCircle}>
        {isVideo ? (
          <Film size={20} color={Colors.dark.primaryLight} />
        ) : (
          <Music size={20} color={Colors.dark.accent} />
        )}
      </View>

      <View style={styles.textContainer}>
        <Text numberOfLines={1} style={styles.title}>
          {item.title}
        </Text>
        <Text numberOfLines={1} style={styles.subtitle}>
          {item.artistOrSpeaker || 'Hikmah Media'} • {formatFileSize(item.sizeInBytes)} •{' '}
          {formatTime(item.duration)}
        </Text>
      </View>

      <View
        style={[styles.deleteButton, delPressed && styles.deleteButtonPressed]}
        onStartShouldSetResponder={() => true}
        onResponderGrant={() => setDelPressed(true)}
        onResponderRelease={() => {
          setDelPressed(false);
          onDelete();
        }}
      >
        <Trash2 size={18} color={Colors.dark.danger} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: 10,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.dark.textMuted,
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonPressed: {
    opacity: 0.6,
  },
});
