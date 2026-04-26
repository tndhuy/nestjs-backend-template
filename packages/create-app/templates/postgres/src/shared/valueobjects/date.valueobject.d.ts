import { ValueObject } from '../base/value-object';
export declare class DateValueObject extends ValueObject<{
    value: Date;
}> {
    constructor(value: Date);
    get value(): Date;
}
