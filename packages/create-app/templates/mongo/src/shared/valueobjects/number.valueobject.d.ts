import { ValueObject } from '../base/value-object';
export declare class NumberValueObject extends ValueObject<{
    value: number;
}> {
    constructor(value: number);
    get value(): number;
}
