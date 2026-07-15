import { useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { haptic } from '../haptics';
import { springs } from '../tokens/motion';
import { PressableScale } from './PressableScale';

type SegmentedControlProps<T extends string> = {
  options: { key: T; label: string }[];
  selected: T;
  onChange: (key: T) => void;
};

/** Segmented control con thumb animado (períodos D/S/M/A, etc.). */
export function SegmentedControl<T extends string>({
  options,
  selected,
  onChange,
}: SegmentedControlProps<T>) {
  const [width, setWidth] = useState(0);
  const segmentWidth = options.length > 0 ? width / options.length : 0;
  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.key === selected),
  );

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(selectedIndex * segmentWidth, springs.snappy) }],
  }));

  return (
    <View
      className="h-9 flex-row rounded-row bg-surface-2 p-0.5"
      onLayout={(e) => setWidth(e.nativeEvent.layout.width - 4)}
    >
      {segmentWidth > 0 ? (
        <Animated.View
          className="absolute bottom-0.5 top-0.5 rounded-[10px] bg-surface"
          style={[{ width: segmentWidth, left: 2 }, thumbStyle]}
        />
      ) : null}
      {options.map((option) => (
        <PressableScale
          key={option.key}
          className="flex-1"
          onPress={() => {
            haptic.select();
            onChange(option.key);
          }}
        >
          <View className="h-full items-center justify-center">
            <Text
              className={`text-footnote ${option.key === selected ? 'font-semibold text-txt' : 'text-txt-dim'}`}
            >
              {option.label}
            </Text>
          </View>
        </PressableScale>
      ))}
    </View>
  );
}
