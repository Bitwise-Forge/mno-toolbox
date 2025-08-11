export const roundTo = (value: number, precision = 2): number => {
  const valueType = typeof value;
  const valueAsNumber = Number(value);

  if (valueType !== 'number' || Number.isNaN(valueAsNumber)) {
    throw new Error(`Value passed to roundTo is not a number: ${valueType}`);
  }

  const precisionType = typeof precision;
  const precisionAsNumber = Number(precision);

  if (precisionType !== 'number' || Number.isNaN(precisionAsNumber)) {
    throw new Error(`Precision passed to roundTo is not a number: ${precisionType}`);
  }

  if (precision < 0) {
    throw new Error('Precision must be non-negative');
  }

  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
};

export const getPercentage = (value: number, total: number, precision = 2): number => {
  const valueType = typeof value;
  const valueAsNumber = Number(value);

  if (valueType !== 'number' || Number.isNaN(valueAsNumber)) {
    throw new Error(`Value passed to getPercentage is not a number: ${valueType}`);
  }

  const totalType = typeof total;
  const totalAsNumber = Number(total);

  if (totalType !== 'number' || Number.isNaN(totalAsNumber)) {
    throw new Error(`Total passed to getPercentage is not a number: ${totalType}`);
  }

  if (precision < 0) {
    throw new Error('Precision must be non-negative');
  }

  return roundTo((value / total) * 100, precision);
};
