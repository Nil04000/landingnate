import { BlurView } from 'expo-blur';
import { router, Tabs } from 'expo-router';
import { ChartLine, House, NotebookPen, Plus, Sparkles, Utensils } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/core/design-system/components';
import { haptic } from '@/core/design-system/haptics';
import { palette } from '@/core/design-system/tokens/palette';

const ICON_PROPS = { strokeWidth: 1.8 } as const;

/** Botón flotante de registro rápido, visible sobre todos los tabs. */
function QuickAddFab() {
  const insets = useSafeAreaInsets();
  return (
    <PressableScale
      onPress={() => {
        haptic.select();
        router.push('/quick-add');
      }}
      style={{ position: 'absolute', right: 20, bottom: insets.bottom + 64 }}
    >
      <View
        className="h-14 w-14 items-center justify-center rounded-full bg-tint"
        style={{
          shadowColor: palette.tint,
          shadowOpacity: 0.4,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 8,
        }}
      >
        <Plus color="#FFFFFF" size={26} strokeWidth={2.2} />
      </View>
    </PressableScale>
  );
}

/** 5 tabs con tab bar flotante translúcida (blur + velo oscuro) + FAB "+". */
export default function TabsLayout() {
  return (
    <View className="flex-1">
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.text.primary,
        tabBarInactiveTintColor: palette.text.tertiary,
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: palette.stroke,
          backgroundColor: 'transparent',
          elevation: 0,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
        tabBarBackground: () => (
          <BlurView
            tint="dark"
            intensity={60}
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(10,10,12,0.72)' }]}
          />
        ),
        sceneStyle: { backgroundColor: palette.canvas },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => <House color={color} size={size} {...ICON_PROPS} />,
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: 'Registro',
          tabBarIcon: ({ color, size }) => <NotebookPen color={color} size={size} {...ICON_PROPS} />,
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Nutrición',
          tabBarIcon: ({ color, size }) => <Utensils color={color} size={size} {...ICON_PROPS} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Estadísticas',
          tabBarIcon: ({ color, size }) => <ChartLine color={color} size={size} {...ICON_PROPS} />,
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: 'Asistente',
          tabBarIcon: ({ color, size }) => <Sparkles color={color} size={size} {...ICON_PROPS} />,
        }}
      />
      </Tabs>
      <QuickAddFab />
    </View>
  );
}
