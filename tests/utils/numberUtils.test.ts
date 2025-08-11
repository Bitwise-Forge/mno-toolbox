import { describe, expect, it } from 'vitest';

import { getPercentage, roundTo } from '@/utils/numberUtils';

describe('numberUtils', () => {
  describe('roundTo', () => {
    const testCasesWithoutPrecision: { input: number; expected: number }[] = [
      { input: 3.14159, expected: 3.14 },
      { input: 2.999, expected: 3.0 },
      { input: 1.006, expected: 1.01 },
      { input: -3.14159, expected: -3.14 },
      { input: 5, expected: 5.0 },
      { input: 0, expected: 0.0 },
      { input: 999999.999, expected: 1000000.0 },
    ];

    it.each(testCasesWithoutPrecision)('should round to $expected when input is $input', ({ expected, input }) =>
      expect(roundTo(input)).toBe(expected),
    );

    const testCasesWithPrecision: { input: number; precision: number; expected: number }[] = [
      { input: 3.14159, precision: 3, expected: 3.142 },
      { input: 3.14159, precision: 1, expected: 3.1 },
      { input: 3.14159, precision: 0, expected: 3 },
      { input: 3.99, precision: 0, expected: 4 },
      { input: -3.99, precision: 0, expected: -4 },
    ];

    it.each(testCasesWithPrecision)(
      'should round to $expected when input is $input and precision is $precision',
      ({ expected, input, precision }) => expect(roundTo(input, precision)).toBe(expected),
    );

    const testCasesWithInvalidInput: { input: unknown }[] = [
      { input: NaN },
      { input: undefined },
      { input: null },
      { input: 'abc' },
      { input: true },
      { input: {} },
      { input: [] },
    ];

    it.each(testCasesWithInvalidInput)(
      'should throw error for invalid input $input',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      ({ input }) => expect(() => roundTo(input as any)).toThrow(),
    );

    const testCasesWithInvalidPrecision: { input: number; precision: unknown }[] = [
      { input: 3.14, precision: -1 },
      { input: 3.14, precision: NaN },
      { input: 3.14, precision: null },
      { input: 3.14, precision: 'abc' },
      { input: 3.14, precision: true },
      { input: 3.14, precision: {} },
    ];

    it.each(testCasesWithInvalidPrecision)(
      'should throw error for invalid precision $precision',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      ({ input, precision }) => expect(() => roundTo(input, precision as any)).toThrow(),
    );

    it('should handle Infinity values', () => {
      expect(roundTo(Infinity)).toBe(Infinity);
      expect(roundTo(-Infinity)).toBe(-Infinity);
    });
  });

  describe('getPercentage', () => {
    const testCasesWithoutPrecision: { value: number; total: number; expected: number }[] = [
      { value: 25, total: 100, expected: 25.0 },
      { value: 50, total: 200, expected: 25.0 },
      { value: 75, total: 300, expected: 25.0 },
      { value: 0, total: 100, expected: 0.0 },
      { value: 50, total: 0, expected: Infinity },
      { value: 1, total: 3, expected: 33.33 },
      { value: 150, total: 100, expected: 150.0 },
      { value: -25, total: 100, expected: -25.0 },
      { value: 999999, total: 1000000, expected: 100.0 },
    ];

    it.each(testCasesWithoutPrecision)(
      'should calculate $expected% when value is $value and total is $total',
      ({ expected, total, value }) => expect(getPercentage(value, total)).toBe(expected),
    );

    const testCasesWithPrecision: { expected: number; precision: number; total: number; value: number }[] = [
      { value: 1, total: 3, precision: 3, expected: 33.333 },
      { value: 2, total: 7, precision: 4, expected: 28.5714 },
      { value: 1, total: 8, precision: 1, expected: 12.5 },
      { value: 1, total: 3, precision: 0, expected: 33 },
    ];

    it.each(testCasesWithPrecision)(
      'should calculate $expected% with precision $precision when value is $value and total is $total',
      ({ expected, precision, total, value }) => expect(getPercentage(value, total, precision)).toBe(expected),
    );

    const testCasesWithInvalidValue: { total: number; value: unknown }[] = [
      { value: NaN, total: 100 },
      { value: undefined, total: 100 },
      { value: null, total: 100 },
      { value: 'abc', total: 100 },
      { value: true, total: 100 },
      { value: {}, total: 100 },
    ];

    it.each(testCasesWithInvalidValue)(
      'should throw error for invalid value $value',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      ({ total, value }) => expect(() => getPercentage(value as any, total)).toThrow(),
    );

    const testCasesWithInvalidTotal: { total: unknown; value: number }[] = [
      { value: 25, total: NaN },
      { value: 25, total: undefined },
      { value: 25, total: null },
      { value: 25, total: 'abc' },
      { value: 25, total: true },
      { value: 25, total: {} },
    ];

    it.each(testCasesWithInvalidTotal)(
      'should throw error for invalid total $total',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      ({ total, value }) => expect(() => getPercentage(value, total as any)).toThrow(),
    );

    const testCasesWithInvalidPrecision: { precision: unknown; total: number; value: number }[] = [
      { value: 25, total: 100, precision: -1 },
      { value: 25, total: 100, precision: NaN },
      { value: 25, total: 100, precision: null },
      { value: 25, total: 100, precision: 'abc' },
      { value: 25, total: 100, precision: true },
      { value: 25, total: 100, precision: {} },
    ];

    it.each(testCasesWithInvalidPrecision)(
      'should throw error for invalid precision $precision',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      ({ precision, total, value }) => expect(() => getPercentage(value, total, precision as any)).toThrow(),
    );

    it('should handle division by zero correctly', () => {
      expect(() => getPercentage(0, 0)).toThrow();
    });

    it('should handle edge cases with extreme values', () => {
      expect(getPercentage(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)).toBe(100.0);
      expect(getPercentage(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)).toBe(-100.0);
    });
  });
});
