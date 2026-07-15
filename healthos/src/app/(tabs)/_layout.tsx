import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { ChartLine, House, NotebookPen, Sparkles, Utensils } from 'lucide-react-native';
import { StyleSheet } from 'react-native';

import { palette } from '@/core/design-system/tokens/palette';

const ICON_PROPS = { strokeWidth: 1.8 } as const;

/** 5 tabs con tab bar flotante translúcida (blur + velo oscuro). */
export default function TabsLayout() {
  return (
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
  );
}
