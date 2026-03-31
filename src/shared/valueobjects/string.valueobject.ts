import { ValueObject } from '../base/value-object';

export class StringValueObject extends ValueObject<{ value: string }> {
  constructor(value: string) {
    if (value === null || value === undefined) {
      throw new Error('String value must not be null or undefined');
    }
    super({ value });
  }

  get value(): string {
    return this.props.value;
  }
}
