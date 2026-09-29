import { Check, Palette, Smile } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { BottomSheet } from '@/components/common/BottomSheet';
import { HikmahButton } from '@/components/common/HikmahButton';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import {
    PLAYLIST_COVER_COLORS,
    PLAYLIST_COVER_EMOJIS,
    Playlist,
    PlaylistFormData,
    validatePlaylistDescription,
    validatePlaylistName,
} from '@/types/playlist';

interface PlaylistFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: PlaylistFormData) => Promise<void>;
  editPlaylist?: Playlist | null;
}

export const PlaylistFormSheet: React.FC<PlaylistFormSheetProps> = ({
  visible,
  onClose,
  onSave,
  editPlaylist,
}) => {
  const isEditing = !!editPlaylist;

  // Form state is initialized from `editPlaylist` on mount.
  // Parents must pass `key={editPlaylist?.id ?? 'new'}` so the form
  // remounts (and resets) when switching between create/edit targets
  // instead of syncing via setState-in-effect.
  const [name, setName] = useState(() => editPlaylist?.name ?? '');
  const [description, setDescription] = useState(() => editPlaylist?.description ?? '');
  const [coverColor, setCoverColor] = useState<string>(() => editPlaylist?.coverColor ?? PLAYLIST_COVER_COLORS[0]);
  const [coverEmoji, setCoverEmoji] = useState<string>(() => editPlaylist?.coverEmoji ?? PLAYLIST_COVER_EMOJIS[0]);
  const [nameError, setNameError] = useState<string | null>(null);
  const [descError, setDescError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const nError = validatePlaylistName(name);
    const dError = validatePlaylistDescription(description);
    setNameError(nError);
    setDescError(dError);

    if (nError || dError) return;

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        coverColor,
        coverEmoji,
      });
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save playlist');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      title={isEditing ? 'Edit Playlist' : 'New Playlist'}
      onClose={onClose}
      snapHeight={0.7}
    >
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <View style={styles.coverPreviewRow}>
          <View style={[styles.coverPreview, { backgroundColor: coverColor }]}>
            <Text style={styles.coverEmojiPreview}>{coverEmoji}</Text>
          </View>
          <View style={styles.coverInfo}>
            <Text style={styles.coverLabel}>Playlist Cover</Text>
            <Text style={styles.coverHint}>Choose a color and icon below</Text>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Playlist Name *</Text>
          <TextInput
            style={[styles.textInput, nameError && styles.textInputError]}
            placeholder="e.g., Tafsir Lectures"
            placeholderTextColor={Colors.muted}
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (nameError) setNameError(null);
            }}
            maxLength={50}
            autoFocus={!isEditing}
          />
          {nameError && <Text style={styles.errorText}>{nameError}</Text>}
          <Text style={styles.charCount}>{name.length}/50</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Description</Text>
          <TextInput
            style={[styles.textInput, styles.textArea, descError && styles.textInputError]}
            placeholder="What's this playlist about?"
            placeholderTextColor={Colors.muted}
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              if (descError) setDescError(null);
            }}
            maxLength={200}
            multiline
            numberOfLines={3}
          />
          {descError && <Text style={styles.errorText}>{descError}</Text>}
          <Text style={styles.charCount}>{description.length}/200</Text>
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.pickerHeader}>
            <Palette size={16} color={Colors.muted} />
            <Text style={styles.inputLabel}>Cover Color</Text>
          </View>
          <View style={styles.colorGrid}>
            {PLAYLIST_COVER_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorCircle,
                  { backgroundColor: color },
                  coverColor === color && styles.colorCircleActive,
                ]}
                onPress={() => setCoverColor(color)}
                activeOpacity={0.7}
              >
                {coverColor === color && <Check size={16} color={Colors.white} strokeWidth={3} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.pickerHeader}>
            <Smile size={16} color={Colors.muted} />
            <Text style={styles.inputLabel}>Cover Icon</Text>
          </View>
          <View style={styles.emojiGrid}>
            {PLAYLIST_COVER_EMOJIS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={[
                  styles.emojiCircle,
                  coverEmoji === emoji && styles.emojiCircleActive,
                ]}
                onPress={() => setCoverEmoji(emoji)}
                activeOpacity={0.7}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.saveButtonContainer}>
          <HikmahButton
            title={isEditing ? 'Save Changes' : 'Create Playlist'}
            onPress={handleSave}
            variant="primary"
            size="lg"
            fullWidth
            loading={isSaving}
          />
        </View>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  coverPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.xxl,
    backgroundColor: Colors.card,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  coverPreview: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverEmojiPreview: {
    fontSize: 32,
  },
  coverInfo: {
    flex: 1,
  },
  coverLabel: {
    ...Typography.h4,
    fontSize: 15,
  },
  coverHint: {
    ...Typography.bodySmall,
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: Spacing.xl,
  },
  inputLabel: {
    ...Typography.h4,
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  textInput: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 15,
    color: Colors.text,
  },
  textInputError: {
    borderColor: Colors.danger,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    marginTop: 4,
  },
  charCount: {
    fontSize: 11,
    color: Colors.muted,
    textAlign: 'right',
    marginTop: 4,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorCircleActive: {
    borderWidth: 3,
    borderColor: Colors.white,
    shadowColor: Colors.white,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  emojiCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiCircleActive: {
    borderColor: Colors.secondary,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  emojiText: {
    fontSize: 22,
  },
  saveButtonContainer: {
    marginTop: Spacing.lg,
  },
});
