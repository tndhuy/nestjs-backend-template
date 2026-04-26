import { ValueObject } from '../base/value-object';
export declare class StringValueObject extends ValueObject<{
    value: string;
}> {
    constructor(value: string);
    get value(): string;
}
