import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import '../global.css';

import { db } from '@/core/db/client';
import { useDbMigrations } from '@/core/db/migrate';
import { runSeeds } from '@/core/db/seeds/run';
import { palette } from '@/core/design-system/tokens/palette';
import { queryClient } from '@/queries/client';

void SplashScreen.preventAutoHideAsync();

/**
 * Layout raíz: providers + gate de base de datos.
 * La UI no monta hasta que las migraciones corrieron y el catálogo está
 * sembrado; mientras tanto sigue visible el splash nativo.
 */
export default function RootLayout() {
  const { success, error } = useDbMigrations();
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    if (!success) return;
    let cancelled = false;
    // Diferido: no bloquea el commit del render y evita setState síncrono en el effect
    const timer = setTimeout(() => {
      runSeeds(db);
      if (!cancelled) setDbReady(true);
      void SplashScreen.hideAsync();
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [success]);

  useEffect(() => {
    if (error) void SplashScreen.hideAsync();
  }, [error]);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas px-8">
        <Text className="text-center text-headline text-danger">
          No se pudo inicializar la base de datos
        </Text>
        <Text className="mt-2 text-center text-footnote text-txt-dim">{error.message}</Text>
      </View>
    );
  }

  if (!dbReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: palette.canvas },
          }}
        >
          <Stack.Screen name="(tabs)" />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
