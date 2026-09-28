import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    Edit3,
    ListMusic,
    Play,
    Shuffle,
    Trash2,
} from 'lucide-react-native';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AudioCard } from '@/components/cards/AudioCard';
import { HikmahButton } from '@/components/common/HikmahButton';
import { HikmahIconButton } from '@/components/common/HikmahIconButton';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
import { useLibraryStore } from '@/store/useLibraryStore';

export default function PlaylistDetailScreen() {
  const router = useRouter();
  const { playlistId } = useLocalSearchParams<{ playlistId: string }>();
  const { playlists, getPlaylistMedia, deletePlaylist, renamePlaylist, removeFromPlaylist } =
    useLibraryStore();
  const { playMedia, setQueue } = useAudioPlayback();

  const playlist = playlists.find((p) => p.id === playlistId);
  const mediaItems = playlistId ? getPlaylistMedia(playlistId) : [];

  if (!playlist) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.errorText}>Playlist not found</Text>
        <HikmahButton title="Go Back" onPress={() => router.back()} variant="outline" />
      </View>
    );
  }

  const handlePlayAll = () => {
    if (mediaItems.length === 0) return;

    const queueItems = mediaItems.map((m) => ({
      id: m.id,
      title: m.title,
      url: m.filePath,
      duration: m.duration,
      type: m.mediaType,
      addedAt: m.addedAt,
    }));

    setQueue(queueItems, 0);
    playMedia(queueItems[0]);
  };

  const handleDeletePlaylist = () => {
    Alert.alert(
      'Delete Playlist',
      `Are you sure you want to delete "${playlist.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deletePlaylist(playlist.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleRenamePlaylist = () => {
    Alert.prompt(
      'Rename Playlist',
      'Enter new name:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: (name?: string) => {
            if (name?.trim()) {
              void renamePlaylist(playlist.id, name.trim());
            }
          },
        },
      ],
      'plain-text',
      playlist.name
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.playlistIcon}>
          <ListMusic size={36} color={Colors.accent} />
        </View>
        <Text style={styles.playlistName}>{playlist.name}</Text>
        <Text style={styles.playlistMeta}>
          {mediaItems.length} items • Created {new Date(playlist.createdAt).toLocaleDateString()}
        </Text>

        <View style={styles.headerActions}>
          <HikmahIconButton
            icon={<Edit3 size={18} color={Colors.muted} />}
            onPress={handleRenamePlaylist}
            size="sm"
          />
          <HikmahIconButton
            icon={<Trash2 size={18} color={Colors.danger} />}
            onPress={handleDeletePlaylist}
            size="sm"
          />
        </View>
      </View>

      {mediaItems.length > 0 && (
        <View style={styles.actionRow}>
          <HikmahButton
            title="Play All"
            onPress={handlePlayAll}
            variant="primary"
            size="md"
            icon={<Play size={16} color={Colors.white} fill={Colors.white} />}
          />
          <HikmahButton
            title="Shuffle"
            onPress={handlePlayAll}
            variant="outline"
            size="md"
            icon={<Shuffle size={16} color={Colors.text} />}
          />
        </View>
      )}

      <FlatList
        data={mediaItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <AudioCard
            item={{
              id: item.id,
              title: item.title,
              url: item.filePath,
              duration: item.duration,
              type: item.mediaType,
              addedAt: item.addedAt,
            }}
            index={index}
            onPress={() => {
              const queueItems = mediaItems.map((m) => ({
                id: m.id,
                title: m.title,
                url: m.filePath,
                duration: m.duration,
                type: m.mediaType,
                addedAt: m.addedAt,
              }));

              setQueue(queueItems, index);
              playMedia(queueItems[index]);
            }}
            rightAction={
              <TouchableOpacity
                onPress={() => void removeFromPlaylist(playlist.id, item.id)}
                style={{ padding: Spacing.sm }}
              >
                <Trash2 size={16} color={Colors.dim} />
              </TouchableOpacity>
            }
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <ListMusic size={48} color={Colors.dim} />
            <Text style={styles.emptyTitle}>Empty Playlist</Text>
            <Text style={styles.emptySubtitle}>Add media from your library to this playlist</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
    backgroundColor: Colors.background,
  },
  errorText: {
    ...Typography.h3,
    color: Colors.danger,
  },
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  playlistIcon: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  playlistName: {
    ...Typography.h2,
    textAlign: 'center',
  },
  playlistMeta: {
    ...Typography.bodySmall,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.huge,
    gap: Spacing.md,
  },
  emptyTitle: {
    ...Typography.h3,
  },
  emptySubtitle: {
    ...Typography.body,
    textAlign: 'center',
    color: Colors.dim,
  },
});
