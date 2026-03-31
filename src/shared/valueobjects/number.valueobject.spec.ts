import { NumberValueObject } from './number.valueobject';

describe('NumberValueObject', () => {
  it('should store and return the numeric value', () => {
    const vo = new NumberValueObject(42);
    expect(vo.value).toBe(42);
  });

  it('should store zero as a valid value', () => {
    const vo = new NumberValueObject(0);
    expect(vo.value).toBe(0);
  });

  it('should store negative numbers', () => {
    const vo = new NumberValueObject(-7);
    expect(vo.value).toBe(-7);
  });

  it('should throw when constructed with NaN', () => {
    expect(() => new NumberValueObject(NaN)).toThrow(
      'Number value must be a finite number',
    );
  });

  it('should throw when constructed with Infinity', () => {
    expect(() => new NumberValueObject(Infinity)).toThrow(
      'Number value must be a finite number',
    );
  });

  it('should throw when constructed with negative Infinity', () => {
    expect(() => new NumberValueObject(-Infinity)).toThrow(
      'Number value must be a finite number',
    );
  });

  it('should be equal to another NumberValueObject with the same value', () => {
    const vo1 = new NumberValueObject(99);
    const vo2 = new NumberValueObject(99);
    expect(vo1.equals(vo2)).toBe(true);
  });

  it('should not be equal to a NumberValueObject with a different value', () => {
    const vo1 = new NumberValueObject(1);
    const vo2 = new NumberValueObject(2);
    expect(vo1.equals(vo2)).toBe(false);
  });
});
