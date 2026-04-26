export declare abstract class Entity<TId> {
    readonly id: TId;
    protected constructor(id: TId);
    equals(other?: Entity<TId>): boolean;
}
