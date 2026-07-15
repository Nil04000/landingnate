import * as Haptics from 'expo-haptics';

/**
 * Vocabulario háptico semántico. NUNCA llamar expo-haptics directo:
 * el significado (no la intensidad) es la API.
 */
export const haptic = {
  /** Cambio de selección: steppers, segmented, pickers, scrub de gráficos */
  select(): void {
    void Haptics.selectionAsync();
  },
  /** Registro exitoso (cualquier write de log) */
  logged(): void {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  /** Objetivo cumplido, PR, racha extendida */
  goal(): void {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  /** Lab fuera de rango, exceso de cafeína, validación fallida */
  warn(): void {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },
  /** Tick rígido: últimos 3s del rest timer, keypad numérico */
  tick(): void {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
  },
};
