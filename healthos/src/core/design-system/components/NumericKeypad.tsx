import { Delete } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { haptic } from '../haptics';
import { palette } from '../tokens/palette';
import { PressableScale } from './PressableScale';

type NumericKeypadProps = {
  onDigit: (digit: string) => void;
  onDecimal: () => void;
  onBackspace: () => void;
  /** Ocultar la coma para campos enteros (pasos) */
  allowDecimal?: boolean | undefined;
};

const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
] as const;

/** Teclado numérico propio (peso, dosis): grande, con tick háptico por tecla. */
export function NumericKeypad({
  onDigit,
  onDecimal,
  onBackspace,
  allowDecimal = true,
}: NumericKeypadProps) {
  const key = (label: string, onPress: () => void, content?: React.ReactNode) => (
    <PressableScale
      key={label}
      onPress={() => {
        haptic.tick();
        onPress();
      }}
      className="h-14 flex-1 items-center justify-center rounded-row"
    >
      {content ?? <Text className="text-title2 text-txt">{label}</Text>}
    </PressableScale>
  );

  return (
    <View className="gap-1">
      {ROWS.map((row) => (
        <View key={row[0]} className="flex-row gap-1">
          {row.map((d) => key(d, () => onDigit(d)))}
        </View>
      ))}
      <View className="flex-row gap-1">
        {allowDecimal ? (
          key(',', onDecimal)
        ) : (
          <View className="h-14 flex-1" />
        )}
        {key('0', () => onDigit('0'))}
        {key(
          'back',
          onBackspace,
          <Delete color={palette.text.secondary} size={24} strokeWidth={1.8} />,
        )}
      </View>
    </View>
  );
}
