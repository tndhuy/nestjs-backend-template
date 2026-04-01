import { ValueObject } from '../../shared/base/value-object';

interface ItemNameProps {
  value: string;
}

export class ItemName extends ValueObject<ItemNameProps> {
  static create(value: string): ItemName {
    if (!value || value.trim().length === 0) {
      throw new Error('ItemName cannot be empty');
    }
    return new ItemName({ value: value.trim() });
  }

  get value(): string {
    return this.props.value;
  }
}
