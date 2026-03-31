import { ValueObject } from '../base/value-object';

export class DateValueObject extends ValueObject<{ value: Date }> {
  constructor(value: Date) {
    if (!(value instanceof Date) || isNaN(value.getTime())) {
      throw new Error('Date value must be a valid Date');
    }
    super({ value });
  }

  get value(): Date {
    return this.props.value;
  }
}
