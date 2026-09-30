import { FolderOpen } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';

import { StorageKeys } from '@/constants/colors';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { StorageService } from '@/services/storage/storageService';
import { useLibraryStore } from '@/store/useLibraryStore';
import { HikmahButton } from '../common/HikmahButton';

/**
 * Full-screen gate shown once on first launch (native only) asking for
 * access to the device's audio/video files. Dismissal is persisted so the
 * user is never nagged again — the Library screen guides denied users to
 * Settings instead.
 */
export const MediaPermissionGate: React.FC = () => {
  // Web has no media-library permission — never gate there.
  const [checked, setChecked] = useState(Platform.OS === 'web');
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);

  const permission = useLibraryStore((s) => s.phoneMediaPermission);
  const refreshPermission = useLibraryStore((s) => s.refreshPhoneMediaPermission);
  const importPhoneMedia = useLibraryStore((s) => s.importPhoneMedia);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    let cancelled = false;
    const check = async () => {
      const askedBefore = await StorageService.getItem<boolean>(
        StorageKeys.MEDIA_PERMISSION_ASKED
      );
      if (!cancelled && askedBefore) {
        setDismissed(true);
      }
      if (!cancelled) {
        await refreshPermission();
        setChecked(true);
      }
    };
    void check();
    return () => {
      cancelled = true;
    };
  }, [refreshPermission]);

  const dismissPermanently = () => {
    setDismissed(true);
    void StorageService.setItem(StorageKeys.MEDIA_PERMISSION_ASKED, true);
  };

  const handleAllow = () => {
    setBusy(true);
    void (async () => {
      try {
        // Requests the OS permission and imports found media in one go.
        await importPhoneMedia();
        await refreshPermission();
      } finally {
        setBusy(false);
        dismissPermanently();
      }
    })();
  };

  if (Platform.OS === 'web' || !checked || dismissed || permission !== 'undetermined') {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <FolderOpen size={40} color={Colors.secondary} />
        </View>
        <Text style={styles.title}>Access your media</Text>
        <Text style={styles.description}>
          Hikmah Player needs access to the audio and video files on this device so you can play
          your recitations and lectures offline.
        </Text>
        {busy ? (
          <ActivityIndicator size="large" color={Colors.secondary} style={styles.spinner} />
        ) : (
          <View style={styles.actions}>
            <HikmahButton title="Allow access" onPress={handleAllow} variant="primary" size="md" />
            <HikmahButton
              title="Maybe later"
              onPress={dismissPermanently}
              variant="outline"
              size="md"
            />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xxl,
  },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h2,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  spinner: {
    marginTop: Spacing.lg,
  },
  description: {
    ...Typography.body,
    color: Colors.muted,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  actions: {
    width: '100%',
    gap: Spacing.md,
  },
});
