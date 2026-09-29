import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { HikmahButton } from '@/components/common/HikmahButton';
import { Colors, Spacing, Typography } from '@/constants/theme';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Not Found', headerShown: false }} />
      <Text style={styles.code}>404</Text>
      <Text style={styles.title}>Page not found</Text>
      <Text style={styles.subtitle}>The screen you tried to open does not exist.</Text>
      <Link href="/" asChild>
        <HikmahButton title="Go Home" onPress={() => {}} variant="primary" size="md" />
      </Link>
      <View style={{ height: Spacing.lg }} />
      <Link href="/search" asChild>
        <HikmahButton title="Search" onPress={() => {}} variant="outline" size="md" />
      </Link>
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
  code: {
    ...Typography.h1,
    fontSize: 64,
    color: Colors.secondary,
  },
  title: {
    ...Typography.h2,
    marginTop: Spacing.md,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.muted,
    textAlign: 'center',
    marginVertical: Spacing.lg,
  },
});
