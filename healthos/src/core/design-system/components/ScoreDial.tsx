import { Text, View } from 'react-native';

import { typography } from '../tokens/typography';
import { palette, scoreColor } from '../tokens/palette';
import { AnimatedNumber } from './AnimatedNumber';
import { RingProgress } from './RingProgress';

type ScoreDialProps = {
  /** 0..100, null = datos insuficientes */
  score: number | null;
  size?: number;
};

/** Dial grande del Health Score: anillo con color de rampa + número animado. */
export function ScoreDial({ score, size = 168 }: ScoreDialProps) {
  const color = scoreColor(score);

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <View className="absolute inset-0">
        <RingProgress
          progress={score != null ? score / 100 : 0}
          size={size}
          strokeWidth={13}
          color={color}
          trackColor={palette.surface2}
        />
      </View>
      {score == null ? (
        <Text style={typography.display} className="text-txt-faint">
          —
        </Text>
      ) : (
        <AnimatedNumber
          value={score}
          style={[typography.display as object, { color: palette.text.primary, textAlign: 'center' }]}
        />
      )}
      <Text className="mt-0.5 text-caption uppercase text-txt-faint">Health Score</Text>
    </View>
  );
}
