import { ValueObject } from '../base/value-object';

export class NumberValueObject extends ValueObject<{ value: number }> {
  constructor(value: number) {
    if (!Number.isFinite(value)) {
      throw new Error('Number value must be a finite number');
    }
    super({ value });
  }

  get value(): number {
    return this.props.value;
  }
}
