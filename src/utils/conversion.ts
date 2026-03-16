export const KG_TO_LB = 2.20462;

/** Convert a kg value from DB to the user's display unit */
export const fromDb = (kg: number, unidad: 'kg' | 'lb'): number =>
  unidad === 'lb' ? kg * KG_TO_LB : kg;

/** Convert a value in the user's display unit to kg for DB storage */
export const toDb = (value: number, unidad: 'kg' | 'lb'): number =>
  unidad === 'lb' ? value / KG_TO_LB : value;

/** Format a kg value for display in the user's unit */
export const displayWeight = (kg: number, unidad: 'kg' | 'lb', decimals = 1): string =>
  fromDb(kg, unidad).toFixed(decimals);

/** Weight increment for +/- buttons: 2.5 for kg, 5 for lb */
export const weightIncrement = (unidad: 'kg' | 'lb'): number =>
  unidad === 'lb' ? 5 : 2.5;

/** Plate-friendly rounding: nearest 2.5 for kg, nearest 5 for lb */
export const roundToPlate = (value: number, unidad: 'kg' | 'lb'): number => {
  const inc = weightIncrement(unidad);
  return Math.round(value / inc) * inc;
};
