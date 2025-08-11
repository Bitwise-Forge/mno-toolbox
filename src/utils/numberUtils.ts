export const roundToTwoDecimalPlaces = (value: number): number => {
  if (Number.isNaN(value)) {
    throw new Error(`Value ${value} is NaN`);
  }

  return Number.parseFloat(value.toFixed(2));
};

export const getPercentage = (value: number, total: number): number => {
  if (Number.isNaN(value)) {
    throw new Error(`Value ${value} is NaN`);
  }

  if (Number.isNaN(total)) {
    throw new Error(`Total ${total} is NaN`);
  }

  return roundToTwoDecimalPlaces((value / total) * 100);
};
