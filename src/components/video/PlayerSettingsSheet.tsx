import { Gauge, Monitor, Settings2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BottomSheet } from '@/components/common/BottomSheet';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useSettingsStore } from '@/store/useSettingsStore';
import { AdvancedSettings } from './settings/AdvancedSettings';
import { DisplaySettings } from './settings/DisplaySettings';
import { PlaybackSettings } from './settings/PlaybackSettings';

type SettingsTab = 'playback' | 'display' | 'advanced';

const TABS: { key: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { key: 'playback', label: 'Playback', icon: <Gauge size={16} color={Colors.secondary} /> },
  { key: 'display', label: 'Display', icon: <Monitor size={16} color={Colors.info} /> },
  { key: 'advanced', label: 'Advanced', icon: <Settings2 size={16} color={Colors.warning} /> },
];

interface PlayerSettingsSheetProps {
  visible: boolean;
  onClose: () => void;
}

export const PlayerSettingsSheet: React.FC<PlayerSettingsSheetProps> = ({ visible, onClose }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('playback');
  const { isLoaded, loadSettings, playbackSpeed, quality } = useSettingsStore();

  useEffect(() => {
    if (visible && !isLoaded) {
      void loadSettings();
    }
  }, [visible, isLoaded, loadSettings]);

  const renderContent = () => {
    switch (activeTab) {
      case 'playback':
        return <PlaybackSettings />;
      case 'display':
        return <DisplaySettings />;
      case 'advanced':
        return <AdvancedSettings />;
      default:
        return null;
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} height={620} title="Player Settings">
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              {tab.icon}
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
              {isActive ? <View style={styles.tabIndicator} /> : null}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.storeHint}>
        <Text style={styles.storeHintText}>Current: {playbackSpeed}x · {quality}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} bounces={false}>
        {renderContent()}
        <View style={{ height: Spacing.huge }} />
      </ScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: 4,
    marginBottom: Spacing.xl,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    position: 'relative',
  },
  tabActive: {
    backgroundColor: Colors.surface,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.muted,
  },
  tabLabelActive: {
    color: Colors.text,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.secondary,
  },
  content: {
    flex: 1,
  },
  storeHint: {
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  storeHintText: {
    fontSize: 11,
    color: Colors.muted,
    textAlign: 'center',
  },
});
