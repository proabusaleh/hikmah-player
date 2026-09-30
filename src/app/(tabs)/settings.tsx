import { Bell, BellRing, Download, Globe, Info, ListMusic, Moon, Music, Settings2, Shield, SkipForward, Sparkles, Trash2, Volume2, Wifi, Zap } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Linking, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { HikmahCard } from '@/components/common/HikmahCard';
import { SectionHeader } from '@/components/common/SectionHeader';
import { SettingsRow } from '@/components/common/SettingsRow';
import { Colors, Spacing } from '@/constants/theme';
import { changeLanguage, getSupportedLanguages } from '@/services/i18n/i18n';
import { NotificationService } from '@/services/notifications/notificationService';
import { useSmartPlaybackStore } from '@/store/useSmartPlaybackStore';

/**
 * `Linking.openSettings()` only exists on native (iOS/Android). On web it is
 * undefined, so guard it and explain where browser permissions live instead.
 */
const openSystemSettings = (): void => {
  if (Platform.OS === 'web') {
    Alert.alert(
      'System Settings',
      'Notification permissions are managed in your browser\u2019s site settings (lock icon in the address bar).'
    );
    return;
  }
  void Linking.openSettings();
};

export default function SettingsScreen() {
  const { config, loadConfig, updateConfig, networkState, currentQuality } =
    useSmartPlaybackStore();

  const [notificationsOn, setNotificationsOn] = useState(() => NotificationService.isEnabled());
  const [systemPermission, setSystemPermission] = useState(false);
  const { t, i18n } = useTranslation();
  const languages = getSupportedLanguages();

  useEffect(() => {
    void loadConfig();
    void NotificationService.getPermissionStatus().then((granted) => {
      setSystemPermission(granted);
      setNotificationsOn(NotificationService.isEnabled());
    });
  }, [loadConfig]);

  const handleMasterToggle = (value: boolean) => {
    void (async () => {
      if (value) {
        const granted = await NotificationService.requestPermissions();
        setSystemPermission(granted);
        if (granted) {
          await NotificationService.setupChannels();
          await NotificationService.setupCategories();
          await NotificationService.setEnabled(true);
          setNotificationsOn(true);
        } else {
          Alert.alert(
            'Permission Needed',
            'Allow notifications in system settings to receive alerts.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => openSystemSettings() },
            ]
          );
        }
      } else {
        await NotificationService.setEnabled(false);
        setNotificationsOn(false);
      }
    })();
  };

  const toggle =
    (key: 'autoNext' | 'autoResume' | 'smartQueue' | 'skipIntro' | 'skipOutro' | 'autoQuality' | 'networkAware') =>
    (value: boolean) => {
      void updateConfig({ [key]: value });
    };

  const networkLabel =
    networkState.type === 'none'
      ? 'Offline'
      : `${networkState.type === 'wifi' ? 'Wi-Fi' : networkState.type} • ${networkState.quality} (${networkState.bandwidthMbps} Mbps)`;
  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will remove temporary files. Downloaded media will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive' },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SectionHeader title="Playback" />
      <HikmahCard variant="bordered" padding="xs" style={styles.card}>
        <SettingsRow icon={<Volume2 size={18} color={Colors.secondary} />} label="Audio Quality" value="High (320kbps)" onPress={() => {}} />
        <SettingsRow
          icon={<Wifi size={18} color={Colors.info} />}
          label="Download on Wi-Fi Only"
          isToggle
          toggleValue={true}
          onToggle={() => {}}
        />
      </HikmahCard>

      <View style={styles.sectionGap} />
      <SectionHeader title="Smart Playback" />
      <HikmahCard variant="bordered" padding="xs" style={styles.card}>
        <SettingsRow
          icon={<Sparkles size={18} color={Colors.accent} />}
          label="Smart Queue"
          description="Personalized Up Next recommendations"
          isToggle
          toggleValue={config.smartQueue}
          onToggle={toggle('smartQueue')}
        />
        <SettingsRow
          icon={<SkipForward size={18} color={Colors.secondary} />}
          label="Skip Intro"
          description="Show skip button during intros"
          isToggle
          toggleValue={config.skipIntro}
          onToggle={toggle('skipIntro')}
        />
        <SettingsRow
          icon={<SkipForward size={18} color={Colors.secondary} />}
          label="Skip Outro"
          description="Show skip button during outros"
          isToggle
          toggleValue={config.skipOutro}
          onToggle={toggle('skipOutro')}
        />
        <SettingsRow
          icon={<ListMusic size={18} color={Colors.info} />}
          label="Auto-Next"
          description="Automatically play the next track"
          isToggle
          toggleValue={config.autoNext}
          onToggle={toggle('autoNext')}
        />
        <SettingsRow
          icon={<Volume2 size={18} color={Colors.warning} />}
          label="Auto-Resume"
          description="Ask to continue where you left off"
          isToggle
          toggleValue={config.autoResume}
          onToggle={toggle('autoResume')}
        />
        <SettingsRow
          icon={<Zap size={18} color={Colors.accent} />}
          label="Auto Quality"
          description={`Currently: ${currentQuality}`}
          isToggle
          toggleValue={config.autoQuality}
          onToggle={toggle('autoQuality')}
        />
        <SettingsRow
          icon={<Wifi size={18} color={Colors.info} />}
          label="Network Aware"
          description={networkLabel}
          isToggle
          toggleValue={config.networkAware}
          onToggle={toggle('networkAware')}
        />
      </HikmahCard>

      <View style={styles.sectionGap} />
      <SectionHeader title="Appearance" />
      <HikmahCard variant="bordered" padding="xs" style={styles.card}>
        <SettingsRow
          icon={<Moon size={18} color={Colors.accent} />}
          label="Dark Mode"
          description="Currently active"
          isToggle
          toggleValue={true}
          onToggle={() => {}}
        />
        <SettingsRow
          icon={<Bell size={18} color={Colors.warning} />}
          label="Notifications"
          isToggle
          toggleValue={false}
          onToggle={() => {}}
        />
      </HikmahCard>

      <View style={styles.sectionGap} />
      <SectionHeader title="Storage" />
      <HikmahCard variant="bordered" padding="xs" style={styles.card}>
        <SettingsRow
          icon={<Trash2 size={18} color={Colors.danger} />}
          label="Clear Cache"
          description="Free up device storage"
          onPress={handleClearCache}
          danger
        />
      </HikmahCard>

      <View style={styles.sectionGap} />
      <SectionHeader title="Notifications" />
      <HikmahCard variant="bordered" padding="xs" style={styles.card}>
        <SettingsRow
          icon={<BellRing size={18} color={Colors.secondary} />}
          label="Enable Notifications"
          description={
            systemPermission ? 'Download and content alerts are on' : 'System permission not granted'
          }
          isToggle
          toggleValue={notificationsOn}
          onToggle={handleMasterToggle}
        />
        <SettingsRow
          icon={<Download size={18} color={Colors.info} />}
          label="Download Alerts"
          description="Notify when downloads complete or fail"
          isToggle
          toggleValue={notificationsOn}
          onToggle={handleMasterToggle}
        />
        <SettingsRow
          icon={<Music size={18} color={Colors.accent} />}
          label="New Content"
          description="Notify about new lectures and recitations"
          isToggle
          toggleValue={notificationsOn}
          onToggle={handleMasterToggle}
        />
        <SettingsRow
          icon={<Settings2 size={18} color={Colors.muted} />}
          label="System Settings"
          description="Manage permission in system settings"
          onPress={() => openSystemSettings()}
        />
      </HikmahCard>

      <View style={styles.sectionGap} />
      <SectionHeader title={t('settings.language')} />
      <HikmahCard variant="bordered" padding="xs" style={styles.card}>
        {languages.map((lang) => (
          <SettingsRow
            key={lang.code}
            icon={<Globe size={18} color={Colors.info} />}
            label={lang.nativeName}
            description={lang.isRTL ? `${lang.name} • RTL` : lang.name}
            value={i18n.language === lang.code ? '✓' : ''}
            onPress={() => {
              void (async () => {
                await changeLanguage(lang.code);
                if (lang.isRTL) {
                  Alert.alert(
                    t('settings.language'),
                    'Restart the app for full right-to-left layout.',
                    [{ text: t('common.done') || 'OK' }]
                  );
                }
              })();
            }}
          />
        ))}
      </HikmahCard>

      <View style={styles.sectionGap} />
      <SectionHeader title="About" />
      <HikmahCard variant="bordered" padding="xs" style={styles.card}>
        <SettingsRow icon={<Info size={18} color={Colors.muted} />} label="Version" value="1.0.0" />
        <SettingsRow icon={<Shield size={18} color={Colors.secondary} />} label="Privacy Policy" onPress={() => {}} />
      </HikmahCard>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
  },
  card: {
    marginBottom: Spacing.sm,
  },
  sectionGap: {
    height: Spacing.xxl,
  },
});
