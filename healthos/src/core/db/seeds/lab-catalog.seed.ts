import type { LabPanelSeed } from './types';

/**
 * Catálogo de paneles/marcadores/rangos de laboratorio.
 * Rangos de referencia genéricos de laboratorio + banda "óptima" más exigente
 * (medicina preventiva). Sexo null = aplica a ambos. El usuario puede
 * sobreescribir rangos con los de su laboratorio y crear marcadores custom.
 */
export const labPanelSeeds: LabPanelSeed[] = [
  {
    code: 'cbc',
    name: 'Hemograma',
    markers: [
      {
        code: 'hgb',
        name: 'Hemoglobina',
        unit: 'g/dL',
        ranges: [
          { low: 13.5, high: 17.5, sex: 'male' },
          { low: 12, high: 15.5, sex: 'female' },
        ],
      },
      {
        code: 'hct',
        name: 'Hematocrito',
        unit: '%',
        ranges: [
          { low: 41, high: 53, sex: 'male' },
          { low: 36, high: 46, sex: 'female' },
        ],
      },
      { code: 'rbc', name: 'Glóbulos rojos', unit: '10⁶/µL', ranges: [{ low: 4.5, high: 5.9 }] },
      { code: 'wbc', name: 'Glóbulos blancos', unit: '10³/µL', ranges: [{ low: 4.5, high: 11 }] },
      { code: 'platelets', name: 'Plaquetas', unit: '10³/µL', ranges: [{ low: 150, high: 450 }] },
      { code: 'mcv', name: 'VCM', unit: 'fL', ranges: [{ low: 80, high: 100 }] },
      { code: 'mch', name: 'HCM', unit: 'pg', ranges: [{ low: 27, high: 33 }] },
      { code: 'rdw', name: 'RDW', unit: '%', ranges: [{ low: 11.5, high: 14.5 }] },
    ],
  },
  {
    code: 'lipids',
    name: 'Perfil lipídico',
    markers: [
      {
        code: 'total_cholesterol',
        name: 'Colesterol total',
        unit: 'mg/dL',
        higherIsWorse: 1,
        ranges: [{ high: 200, optimalHigh: 180 }],
      },
      {
        code: 'ldl',
        name: 'Colesterol LDL',
        unit: 'mg/dL',
        higherIsWorse: 1,
        ranges: [{ high: 130, optimalHigh: 100 }],
      },
      {
        code: 'hdl',
        name: 'Colesterol HDL',
        unit: 'mg/dL',
        higherIsWorse: 0,
        ranges: [
          { low: 40, optimalLow: 55, sex: 'male' },
          { low: 50, optimalLow: 60, sex: 'female' },
        ],
      },
      {
        code: 'triglycerides',
        name: 'Triglicéridos',
        unit: 'mg/dL',
        higherIsWorse: 1,
        ranges: [{ high: 150, optimalHigh: 100 }],
      },
      {
        code: 'non_hdl',
        name: 'Colesterol no-HDL',
        unit: 'mg/dL',
        higherIsWorse: 1,
        ranges: [{ high: 160, optimalHigh: 130 }],
      },
      {
        code: 'apob',
        name: 'Apolipoproteína B',
        unit: 'mg/dL',
        higherIsWorse: 1,
        ranges: [{ high: 120, optimalHigh: 90 }],
      },
      {
        code: 'lipoprotein_a',
        name: 'Lipoproteína (a)',
        unit: 'nmol/L',
        higherIsWorse: 1,
        ranges: [{ high: 75 }],
      },
    ],
  },
  {
    code: 'metabolic',
    name: 'Metabólico',
    markers: [
      {
        code: 'glucose',
        name: 'Glucosa (ayunas)',
        unit: 'mg/dL',
        ranges: [{ low: 70, high: 100, optimalLow: 75, optimalHigh: 90 }],
      },
      {
        code: 'hba1c',
        name: 'HbA1c',
        unit: '%',
        higherIsWorse: 1,
        ranges: [{ low: 4, high: 5.6, optimalLow: 4.8, optimalHigh: 5.3 }],
      },
      {
        code: 'insulin',
        name: 'Insulina (ayunas)',
        unit: 'µUI/mL',
        higherIsWorse: 1,
        ranges: [{ low: 2, high: 25, optimalLow: 2, optimalHigh: 8 }],
      },
      {
        code: 'uric_acid',
        name: 'Ácido úrico',
        unit: 'mg/dL',
        ranges: [{ low: 3.5, high: 7.2 }],
      },
    ],
  },
  {
    code: 'kidney',
    name: 'Renal',
    markers: [
      {
        code: 'creatinine',
        name: 'Creatinina',
        unit: 'mg/dL',
        ranges: [
          { low: 0.7, high: 1.3, sex: 'male' },
          { low: 0.6, high: 1.1, sex: 'female' },
        ],
      },
      {
        code: 'egfr',
        name: 'Filtrado glomerular (eGFR)',
        unit: 'mL/min/1.73m²',
        higherIsWorse: 0,
        ranges: [{ low: 60, optimalLow: 90 }],
      },
      { code: 'urea', name: 'Urea', unit: 'mg/dL', ranges: [{ low: 15, high: 45 }] },
    ],
  },
  {
    code: 'liver',
    name: 'Hepático',
    markers: [
      {
        code: 'alt',
        name: 'ALT (TGP)',
        unit: 'U/L',
        higherIsWorse: 1,
        ranges: [{ high: 40, optimalHigh: 30 }],
      },
      {
        code: 'ast',
        name: 'AST (TGO)',
        unit: 'U/L',
        higherIsWorse: 1,
        ranges: [{ high: 40, optimalHigh: 30 }],
      },
      {
        code: 'ggt',
        name: 'GGT',
        unit: 'U/L',
        higherIsWorse: 1,
        ranges: [{ high: 60, optimalHigh: 25 }],
      },
      {
        code: 'alp',
        name: 'Fosfatasa alcalina',
        unit: 'U/L',
        ranges: [{ low: 40, high: 129 }],
      },
      {
        code: 'bilirubin_total',
        name: 'Bilirrubina total',
        unit: 'mg/dL',
        ranges: [{ low: 0.1, high: 1.2 }],
      },
      { code: 'albumin', name: 'Albúmina', unit: 'g/dL', ranges: [{ low: 3.5, high: 5 }] },
    ],
  },
  {
    code: 'hormones',
    name: 'Hormonal',
    markers: [
      {
        code: 'testosterone_total',
        name: 'Testosterona total',
        unit: 'ng/dL',
        ranges: [
          { low: 300, high: 1000, optimalLow: 550, optimalHigh: 900, sex: 'male' },
          { low: 15, high: 70, sex: 'female' },
        ],
      },
      {
        code: 'testosterone_free',
        name: 'Testosterona libre',
        unit: 'pg/mL',
        ranges: [
          { low: 9, high: 30, optimalLow: 15, optimalHigh: 25, sex: 'male' },
          { low: 0.3, high: 1.9, sex: 'female' },
        ],
      },
      {
        code: 'shbg',
        name: 'SHBG',
        unit: 'nmol/L',
        ranges: [
          { low: 10, high: 57, sex: 'male' },
          { low: 18, high: 144, sex: 'female' },
        ],
      },
      { code: 'lh', name: 'LH', unit: 'mUI/mL', ranges: [{ low: 1.7, high: 8.6 }] },
      { code: 'fsh', name: 'FSH', unit: 'mUI/mL', ranges: [{ low: 1.5, high: 12.4 }] },
      {
        code: 'estradiol',
        name: 'Estradiol',
        unit: 'pg/mL',
        ranges: [{ low: 10, high: 40, optimalLow: 20, optimalHigh: 30, sex: 'male' }],
      },
      {
        code: 'prolactin',
        name: 'Prolactina',
        unit: 'ng/mL',
        ranges: [
          { low: 4, high: 15, sex: 'male' },
          { low: 4, high: 23, sex: 'female' },
        ],
      },
      { code: 'dhea_s', name: 'DHEA-S', unit: 'µg/dL', ranges: [{ low: 100, high: 500 }] },
      {
        code: 'cortisol_am',
        name: 'Cortisol (matinal)',
        unit: 'µg/dL',
        ranges: [{ low: 6, high: 18 }],
      },
    ],
  },
  {
    code: 'thyroid',
    name: 'Tiroides',
    markers: [
      {
        code: 'tsh',
        name: 'TSH',
        unit: 'µUI/mL',
        ranges: [{ low: 0.4, high: 4, optimalLow: 1, optimalHigh: 2.5 }],
      },
      { code: 'ft4', name: 'T4 libre', unit: 'ng/dL', ranges: [{ low: 0.8, high: 1.8 }] },
      {
        code: 'ft3',
        name: 'T3 libre',
        unit: 'pg/mL',
        ranges: [{ low: 2.3, high: 4.2, optimalLow: 3, optimalHigh: 4 }],
      },
    ],
  },
  {
    code: 'vitamins',
    name: 'Vitaminas y minerales',
    markers: [
      {
        code: 'vitamin_d',
        name: 'Vitamina D (25-OH)',
        unit: 'ng/mL',
        ranges: [{ low: 30, high: 100, optimalLow: 40, optimalHigh: 60 }],
      },
      {
        code: 'vitamin_b12_serum',
        name: 'Vitamina B12',
        unit: 'pg/mL',
        ranges: [{ low: 200, high: 900, optimalLow: 500, optimalHigh: 800 }],
      },
      { code: 'folate_serum', name: 'Folato sérico', unit: 'ng/mL', ranges: [{ low: 4, high: 20 }] },
      {
        code: 'ferritin',
        name: 'Ferritina',
        unit: 'ng/mL',
        ranges: [
          { low: 30, high: 400, optimalLow: 50, optimalHigh: 150, sex: 'male' },
          { low: 15, high: 200, optimalLow: 50, optimalHigh: 150, sex: 'female' },
        ],
      },
      { code: 'iron_serum', name: 'Hierro sérico', unit: 'µg/dL', ranges: [{ low: 60, high: 170 }] },
      {
        code: 'transferrin_sat',
        name: 'Saturación de transferrina',
        unit: '%',
        ranges: [{ low: 20, high: 50 }],
      },
      {
        code: 'magnesium_serum',
        name: 'Magnesio sérico',
        unit: 'mg/dL',
        ranges: [{ low: 1.7, high: 2.2 }],
      },
    ],
  },
  {
    code: 'inflammation',
    name: 'Inflamación',
    markers: [
      {
        code: 'crp',
        name: 'PCR ultrasensible',
        unit: 'mg/L',
        higherIsWorse: 1,
        ranges: [{ high: 3, optimalHigh: 1 }],
      },
      { code: 'esr', name: 'Eritrosedimentación', unit: 'mm/h', higherIsWorse: 1, ranges: [{ high: 15 }] },
      {
        code: 'homocysteine',
        name: 'Homocisteína',
        unit: 'µmol/L',
        higherIsWorse: 1,
        ranges: [{ high: 15, optimalHigh: 9 }],
      },
    ],
  },
];
