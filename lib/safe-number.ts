export const safeNumber = (value: number | null | undefined): number => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return 0;
    }
    return Number(value);
  };