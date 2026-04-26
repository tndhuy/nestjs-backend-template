import { ValueObject } from '../../../shared/base/value-object';
interface ItemNameProps {
    value: string;
}
export declare class ItemName extends ValueObject<ItemNameProps> {
    static create(value: string): ItemName;
    get value(): string;
}
export {};
