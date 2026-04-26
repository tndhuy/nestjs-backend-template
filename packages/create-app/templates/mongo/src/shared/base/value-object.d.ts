export declare abstract class ValueObject<TProps> {
    protected readonly props: TProps;
    protected constructor(props: TProps);
    equals(other?: ValueObject<TProps>): boolean;
}
