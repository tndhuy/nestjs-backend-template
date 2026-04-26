import { Entity } from './entity';
import { DomainEvent } from './domain-event';
export declare abstract class AggregateRoot<TId> extends Entity<TId> {
    private readonly domainEvents;
    protected constructor(id: TId);
    addDomainEvent(event: DomainEvent): void;
    pullDomainEvents(): DomainEvent[];
}
