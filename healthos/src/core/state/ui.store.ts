import { create } from 'zustand';

import { todayLocal } from '@/core/lib/dates';

/**
 * Estado efímero de UI (NUNCA datos de la DB — eso es de React Query).
 * Hoy: la fecha seleccionada del tab Registro (back-logging).
 */
type UiState = {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
};

export const useUiStore = create<UiState>((set) => ({
  selectedDate: todayLocal(),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
}));
