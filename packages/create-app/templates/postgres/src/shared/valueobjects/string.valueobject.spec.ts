import { StringValueObject } from './string.valueobject';

describe('StringValueObject', () => {
  it('should store and return the string value', () => {
    const vo = new StringValueObject('hello');
    expect(vo.value).toBe('hello');
  });

  it('should throw when constructed with null', () => {
    expect(() => new StringValueObject(null as any)).toThrow(
      'String value must not be null or undefined',
    );
  });

  it('should throw when constructed with undefined', () => {
    expect(() => new StringValueObject(undefined as any)).toThrow(
      'String value must not be null or undefined',
    );
  });

  it('should be equal to another StringValueObject with the same value', () => {
    const vo1 = new StringValueObject('hello');
    const vo2 = new StringValueObject('hello');
    expect(vo1.equals(vo2)).toBe(true);
  });

  it('should not be equal to a StringValueObject with a different value', () => {
    const vo1 = new StringValueObject('hello');
    const vo2 = new StringValueObject('world');
    expect(vo1.equals(vo2)).toBe(false);
  });

  it('should allow empty strings (only null/undefined are rejected)', () => {
    const vo = new StringValueObject('');
    expect(vo.value).toBe('');
  });
});
