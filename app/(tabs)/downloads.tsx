import { useRouter } from 'expo-router';
import { FolderDown } from 'lucide-react-native';
import { useEffect } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';

import { DownloadedItemCard } from '@/components/cards/DownloadedItemCard';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
import { useDownloadsStore } from '@/store/useDownloadsStore';
import { MediaItem } from '@/types/media';

export default function DownloadsScreen() {
  const router = useRouter();
  const { downloadedItems, loadDownloads, removeDownload } = useDownloadsStore();
  const { playMedia } = useAudioPlayback();

  useEffect(() => {
    loadDownloads();
  }, [loadDownloads]);

  const handlePlay = (item: MediaItem) => {
    if (item.type === 'video') {
      router.push({
        pathname: '/player/video',
        params: {
          id: item.id,
          title: item.title,
          speaker: item.artistOrSpeaker,
          url: item.url,
        },
      });
    } else {
      playMedia(item);
    }
  };

  const confirmDelete = (id: string, title: string) => {
    Alert.alert('Delete Download', `Remove "${title}" from offline storage?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeDownload(id) },
    ]);
  };

  if (downloadedItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <FolderDown size={64} color={Colors.dim} />
        <Text style={styles.emptyTitle}>No Downloads</Text>
        <Text style={styles.emptySubtitle}>Downloaded media will appear here for offline playback.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={downloadedItems}
      keyExtractor={(item) => item.id}
      style={styles.container}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <DownloadedItemCard
          item={item}
          onPress={() => handlePlay(item)}
          onDelete={() => confirmDelete(item.id, item.title)}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxxl,
  },
  emptyTitle: {
    ...Typography.h3,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
});
