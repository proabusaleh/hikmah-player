import { useRouter } from 'expo-router';
import { FolderDown } from 'lucide-react-native';
import { useEffect } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';

import { DownloadedItemCard } from '@/components/cards/DownloadedItemCard';
import { Colors } from '@/constants/colors';
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
      return;
    }

    playMedia(item);
  };

  const confirmDelete = (id: string, title: string) => {
    Alert.alert(
      'Delete Download',
      `Are you sure you want to remove "${title}" from offline storage?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removeDownload(id) },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {downloadedItems.length === 0 ? (
        <View style={styles.emptyState}>
          <FolderDown size={64} color={Colors.dark.textDim} />
          <Text style={styles.emptyTitle}>No Downloads Found</Text>
          <Text style={styles.emptySubtitle}>
            Downloaded recitations and videos will appear here for offline playback.
          </Text>
        </View>
      ) : (
        <FlatList
          data={downloadedItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <DownloadedItemCard
              item={item}
              onPress={() => handlePlay(item)}
              onDelete={() => confirmDelete(item.id, item.title)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    padding: 16,
  },
  listContent: {
    paddingBottom: 90,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginTop: 16,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.dark.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
