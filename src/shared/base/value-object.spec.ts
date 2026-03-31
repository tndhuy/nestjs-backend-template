import { ValueObject } from './value-object';

class TestVO extends ValueObject<{ value: string }> {
  constructor(props: { value: string }) {
    super(props);
  }
}

describe('ValueObject', () => {
  it('should be equal to another VO with the same props', () => {
    const vo1 = new TestVO({ value: 'hello' });
    const vo2 = new TestVO({ value: 'hello' });
    expect(vo1.equals(vo2)).toBe(true);
  });

  it('should not be equal to a VO with different props', () => {
    const vo1 = new TestVO({ value: 'hello' });
    const vo2 = new TestVO({ value: 'world' });
    expect(vo1.equals(vo2)).toBe(false);
  });

  it('should return false when comparing with undefined', () => {
    const vo = new TestVO({ value: 'hello' });
    expect(vo.equals(undefined)).toBe(false);
  });

  it('should return true when comparing with itself (reference equality)', () => {
    const vo = new TestVO({ value: 'hello' });
    expect(vo.equals(vo)).toBe(true);
  });

  it('should be immutable — mutation attempt does not change value', () => {
    const vo = new TestVO({ value: 'original' });
    expect(() => {
      (vo as any).props.value = 'mutated';
    }).toThrow();
    expect(vo.equals(new TestVO({ value: 'original' }))).toBe(true);
  });
});
