import { ValueObject } from '../base/value-object';
export declare class IdValueObject extends ValueObject<{
    value: string;
}> {
    constructor(value: string);
    get value(): string;
}
