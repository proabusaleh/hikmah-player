import { Heart } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing, Typography } from '@/constants/theme';

export default function FavoritesScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.emptyState}>
        <Heart size={64} color={Colors.dim} />
        <Text style={styles.title}>No Favorites Yet</Text>
        <Text style={styles.subtitle}>
          Tap the heart icon on any track to save it here for quick access.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxxl,
  },
  emptyState: {
    alignItems: 'center',
  },
  title: {
    ...Typography.h3,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
});
