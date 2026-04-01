import { ItemName } from './item-name.value-object';

describe('ItemName value object', () => {
  it('should create an ItemName with a valid non-empty string', () => {
    const name = ItemName.create('Widget');

    expect(name.value).toBe('Widget');
  });

  it('should trim leading and trailing whitespace on creation', () => {
    const name = ItemName.create('  Trimmed  ');

    expect(name.value).toBe('Trimmed');
  });

  it('should throw when given an empty string', () => {
    expect(() => ItemName.create('')).toThrow('ItemName cannot be empty');
  });

  it('should throw when given a whitespace-only string', () => {
    expect(() => ItemName.create('   ')).toThrow('ItemName cannot be empty');
  });

  it('should be equal to another ItemName with the same trimmed value', () => {
    const name1 = ItemName.create('Widget');
    const name2 = ItemName.create('Widget');

    expect(name1.equals(name2)).toBe(true);
  });

  it('should not be equal to an ItemName with a different value', () => {
    const name1 = ItemName.create('Widget');
    const name2 = ItemName.create('Gadget');

    expect(name1.equals(name2)).toBe(false);
  });

  it('should return false when compared with undefined', () => {
    const name = ItemName.create('Widget');

    expect(name.equals(undefined)).toBe(false);
  });

  it('should return true when compared with itself', () => {
    const name = ItemName.create('Widget');

    expect(name.equals(name)).toBe(true);
  });
});
