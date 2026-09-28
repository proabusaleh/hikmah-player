import { Check, FolderPlus, ListMusic, Plus } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { BottomSheet } from '@/components/common/BottomSheet';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { PlaylistManager } from '@/services/storage/playlistManager';
import { Playlist, PlaylistFormData } from '@/types/playlist';
import { PlaylistFormSheet } from './PlaylistFormSheet';

interface AddToPlaylistSheetProps {
  visible: boolean;
  onClose: () => void;
  mediaId: string;
  mediaTitle: string;
  onAdded?: () => void;
}

export const AddToPlaylistSheet: React.FC<AddToPlaylistSheetProps> = ({
  visible,
  onClose,
  mediaId,
  mediaTitle,
  onAdded,
}) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [addedToIds, setAddedToIds] = useState<Set<string>>(new Set());
  const [showCreateSheet, setShowCreateSheet] = useState(false);

  useEffect(() => {
    if (visible) {
      void loadPlaylists();
    }
  }, [visible]);

  const loadPlaylists = async () => {
    const all = await PlaylistManager.getAllPlaylists();
    setPlaylists(all.filter((p) => !p.isSystem));

    const alreadyIn = new Set<string>();
    all.forEach((p) => {
      if (p.mediaIds.includes(mediaId)) {
        alreadyIn.add(p.id);
      }
    });
    setAddedToIds(alreadyIn);
  };

  const handleTogglePlaylist = async (playlist: Playlist) => {
    const isAlreadyAdded = addedToIds.has(playlist.id);

    try {
      if (isAlreadyAdded) {
        await PlaylistManager.removeMediaFromPlaylist(playlist.id, [mediaId]);
        setAddedToIds((prev) => {
          const next = new Set(prev);
          next.delete(playlist.id);
          return next;
        });
      } else {
        const count = await PlaylistManager.addMediaToPlaylist(playlist.id, [mediaId]);
        if (count > 0) {
          setAddedToIds((prev) => new Set(prev).add(playlist.id));
          onAdded?.();
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleCreateAndAdd = async (data: PlaylistFormData) => {
    const newPlaylist = await PlaylistManager.createPlaylist(data);
    await PlaylistManager.addMediaToPlaylist(newPlaylist.id, [mediaId]);
    setAddedToIds((prev) => new Set(prev).add(newPlaylist.id));
    await loadPlaylists();
    onAdded?.();
  };

  return (
    <>
      <BottomSheet visible={visible} title={`Add "${mediaTitle}" to...`} onClose={onClose} snapHeight={0.55}>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => setShowCreateSheet(true)}
          activeOpacity={0.7}
        >
          <View style={styles.createIcon}>
            <FolderPlus size={22} color={Colors.secondary} />
          </View>
          <Text style={styles.createText}>Create New Playlist</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {playlists.length === 0 ? (
          <View style={styles.emptyState}>
            <ListMusic size={40} color={Colors.muted} />
            <Text style={styles.emptyText}>No playlists yet</Text>
            <Text style={styles.emptyHint}>Create your first playlist above</Text>
          </View>
        ) : (
          <FlatList
            data={playlists}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isAdded = addedToIds.has(item.id);
              return (
                <TouchableOpacity
                  style={styles.playlistRow}
                  onPress={() => void handleTogglePlaylist(item)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.playlistCover, { backgroundColor: item.coverColor }]}>
                    <Text style={styles.playlistEmoji}>{item.coverEmoji}</Text>
                  </View>

                  <View style={styles.playlistInfo}>
                    <Text style={styles.playlistName}>{item.name}</Text>
                    <Text style={styles.playlistCount}>{item.mediaIds.length} items</Text>
                  </View>

                  {isAdded ? (
                    <View style={styles.addedBadge}>
                      <Check size={16} color={Colors.secondary} strokeWidth={3} />
                      <Text style={styles.addedText}>Added</Text>
                    </View>
                  ) : (
                    <View style={styles.addBtn}>
                      <Plus size={20} color={Colors.muted} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        )}

        <View style={{ height: Spacing.xxl }} />
      </BottomSheet>

      <PlaylistFormSheet
        visible={showCreateSheet}
        onClose={() => setShowCreateSheet(false)}
        onSave={handleCreateAndAdd}
      />
    </>
  );
};

const styles = StyleSheet.create({
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.15)',
    marginBottom: Spacing.md,
  },
  createIcon: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createText: {
    ...Typography.h4,
    fontSize: 15,
    color: Colors.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    gap: Spacing.sm,
  },
  emptyText: {
    ...Typography.h4,
    color: Colors.muted,
  },
  emptyHint: {
    ...Typography.bodySmall,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  playlistCover: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  playlistEmoji: {
    fontSize: 22,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    ...Typography.h4,
    fontSize: 15,
  },
  playlistCount: {
    ...Typography.bodySmall,
    fontSize: 12,
  },
  addedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  addedText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondary,
  },
  addBtn: {
    padding: Spacing.sm,
  },
});
