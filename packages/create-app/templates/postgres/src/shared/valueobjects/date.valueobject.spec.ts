import { DateValueObject } from './date.valueobject';

describe('DateValueObject', () => {
  it('should store and return a valid Date', () => {
    const date = new Date('2024-01-15T10:00:00Z');
    const vo = new DateValueObject(date);
    expect(vo.value).toEqual(date);
  });

  it('should throw when constructed with an invalid Date (NaN time)', () => {
    expect(() => new DateValueObject(new Date('invalid'))).toThrow(
      'Date value must be a valid Date',
    );
  });

  it('should throw when constructed with a non-Date value', () => {
    expect(() => new DateValueObject('2024-01-01' as any)).toThrow(
      'Date value must be a valid Date',
    );
  });

  it('should throw when constructed with null', () => {
    expect(() => new DateValueObject(null as any)).toThrow(
      'Date value must be a valid Date',
    );
  });

  it('should be equal to another DateValueObject with the same date value', () => {
    const date = new Date('2024-06-01T00:00:00Z');
    const vo1 = new DateValueObject(date);
    const vo2 = new DateValueObject(new Date('2024-06-01T00:00:00Z'));
    expect(vo1.equals(vo2)).toBe(true);
  });

  it('should not be equal to a DateValueObject with a different date', () => {
    const vo1 = new DateValueObject(new Date('2024-01-01'));
    const vo2 = new DateValueObject(new Date('2024-12-31'));
    expect(vo1.equals(vo2)).toBe(false);
  });
});
