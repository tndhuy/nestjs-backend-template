import { ValueObject } from '../base/value-object';

export class IdValueObject extends ValueObject<{ value: string }> {
  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('ID must not be empty');
    }
    super({ value });
  }

  get value(): string {
    return this.props.value;
  }
}
