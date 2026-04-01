import { AggregateRoot } from '../../shared/base/aggregate-root';
import { ItemName } from './item-name.value-object';

export class Item extends AggregateRoot<string> {
  private _name: ItemName;

  private constructor(id: string, name: ItemName) {
    super(id);
    this._name = name;
  }

  static create(id: string, name: ItemName): Item {
    return new Item(id, name);
  }

  get name(): ItemName {
    return this._name;
  }
}
