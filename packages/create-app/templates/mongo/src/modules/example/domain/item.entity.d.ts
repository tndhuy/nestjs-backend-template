import { AggregateRoot } from '../../../shared/base/aggregate-root';
import { ItemName } from './item-name.value-object';
export declare class Item extends AggregateRoot<string> {
    private _name;
    private constructor();
    static create(id: string, name: ItemName): Item;
    get name(): ItemName;
}
