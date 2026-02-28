import "react-native-url-polyfill/auto";
import React, { useEffect } from "react";
import { Stack, router, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { colors } from "@/components/ui/colors";

function RootLayoutNav() {
  const { session, loading } = useAuth();
  const segments = useSegments() as string[];

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inAppGroup = segments[0] === "(app)";

    if (!session && !inAuthGroup) {
      router.replace("/login");
    } else if (session && !inAppGroup) {
      router.replace("/");
    }
  }, [session, loading, segments]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
});
