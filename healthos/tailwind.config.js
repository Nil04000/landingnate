/**
 * Espejo de `src/core/design-system/tokens/palette.ts` — mantener sincronizado.
 * (El config de Tailwind corre en Node al bundlear; los tokens TS alimentan Skia/JS.)
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        canvas: '#0A0A0C',
        surface: { DEFAULT: '#141417', 2: '#1C1C21' },
        stroke: '#26262C',
        separator: '#2E2E34',
        txt: { DEFAULT: '#F5F5F7', dim: '#A1A1AA', faint: '#5E5E66' },
        tint: '#0A84FF',
        success: '#30D158',
        warning: '#FFD60A',
        danger: '#FF453A',
        metric: {
          sleep: '#BF5AF2',
          activity: '#FF9F0A',
          nutrition: '#30D158',
          hydration: '#64D2FF',
          caffeine: '#A2845E',
          mood: '#FF375F',
          training: '#FF6482',
          labs: '#6C8EEF',
          score: '#5DE6C0',
        },
      },
      fontSize: {
        display: ['34px', { lineHeight: '41px', fontWeight: '700' }],
        title1: ['28px', { lineHeight: '34px', fontWeight: '700' }],
        title2: ['22px', { lineHeight: '28px', fontWeight: '600' }],
        headline: ['17px', { lineHeight: '22px', fontWeight: '600' }],
        body: ['17px', { lineHeight: '22px' }],
        subhead: ['15px', { lineHeight: '20px' }],
        footnote: ['13px', { lineHeight: '18px' }],
        caption: ['11px', { lineHeight: '13px', letterSpacing: '0.6px', fontWeight: '500' }],
      },
      borderRadius: {
        chip: '10px',
        row: '14px',
        card: '20px',
        sheet: '28px',
      },
    },
  },
  plugins: [],
};
