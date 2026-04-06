export abstract class Entity<TId> {
  readonly id: TId;

  protected constructor(id: TId) {
    this.id = id;
  }

  equals(other?: Entity<TId>): boolean {
    if (!other) return false;
    if (other === this) return true;
    return this.id === other.id;
  }
}
