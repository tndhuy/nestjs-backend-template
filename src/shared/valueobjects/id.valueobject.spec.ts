import { IdValueObject } from './id.valueobject';

describe('IdValueObject', () => {
  it('should store and return the id value', () => {
    const id = new IdValueObject('abc-123');
    expect(id.value).toBe('abc-123');
  });

  it('should throw when constructed with an empty string', () => {
    expect(() => new IdValueObject('')).toThrow('ID must not be empty');
  });

  it('should throw when constructed with whitespace-only string', () => {
    expect(() => new IdValueObject('   ')).toThrow('ID must not be empty');
  });

  it('should be equal to another IdValueObject with the same value', () => {
    const id1 = new IdValueObject('abc-123');
    const id2 = new IdValueObject('abc-123');
    expect(id1.equals(id2)).toBe(true);
  });

  it('should not be equal to another IdValueObject with a different value', () => {
    const id1 = new IdValueObject('abc-123');
    const id2 = new IdValueObject('xyz-456');
    expect(id1.equals(id2)).toBe(false);
  });
});
