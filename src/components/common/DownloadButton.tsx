import { CheckCircle2, Download } from 'lucide-react-native';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { Colors } from '@/constants/colors';
import { useDownloadsStore } from '@/store/useDownloadsStore';
import { MediaItem } from '@/types/media';

interface DownloadButtonProps {
  item: MediaItem;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({ item }) => {
  const { startDownload, isItemDownloaded, isDownloading, downloadProgress } =
    useDownloadsStore();

  const isDownloaded = isItemDownloaded(item.id);
  const downloading = isDownloading[item.id];
  const progress = Math.round((downloadProgress[item.id] || 0) * 100);

  if (isDownloaded) {
    return (
      <View style={styles.button}>
        <CheckCircle2 size={20} color={Colors.dark.accent} />
      </View>
    );
  }

  if (downloading) {
    return (
      <View style={styles.downloadingWrapper}>
        <ActivityIndicator size="small" color={Colors.dark.primary} />
        <Text style={styles.progressText}>{progress}%</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={() => startDownload(item)}
      activeOpacity={0.7}
    >
      <Download size={20} color={Colors.dark.textMuted} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadingWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
  },
  progressText: {
    fontSize: 10,
    color: Colors.dark.primaryLight,
    marginTop: 2,
  },
});
