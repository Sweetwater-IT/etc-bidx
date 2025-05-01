export const safeNumber = (value: number | null | undefined, defaultValue: number | undefined = 0): number | undefined => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return defaultValue;
  }
  return Number(value);
};