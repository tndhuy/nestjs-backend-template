import { Entity } from './entity';

class TestEntity extends Entity<string> {
  constructor(id: string) {
    super(id);
  }
}

describe('Entity', () => {
  it('should store and return the id', () => {
    const entity = new TestEntity('abc');
    expect(entity.id).toBe('abc');
  });

  it('should be equal to another entity with the same id', () => {
    const e1 = new TestEntity('abc');
    const e2 = new TestEntity('abc');
    expect(e1.equals(e2)).toBe(true);
  });

  it('should not be equal to another entity with a different id', () => {
    const e1 = new TestEntity('abc');
    const e2 = new TestEntity('xyz');
    expect(e1.equals(e2)).toBe(false);
  });

  it('should return false when comparing with undefined', () => {
    const entity = new TestEntity('abc');
    expect(entity.equals(undefined)).toBe(false);
  });

  it('should return true when comparing with itself (reference equality)', () => {
    const entity = new TestEntity('abc');
    expect(entity.equals(entity)).toBe(true);
  });
});
