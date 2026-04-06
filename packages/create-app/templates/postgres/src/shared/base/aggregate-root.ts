import { Entity } from './entity';
import { DomainEvent } from './domain-event';

export abstract class AggregateRoot<TId> extends Entity<TId> {
  private readonly domainEvents: DomainEvent[] = [];

  protected constructor(id: TId) {
    super(id);
  }

  addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents.length = 0;
    return events;
  }
}
