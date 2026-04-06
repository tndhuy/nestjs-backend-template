import { AggregateRoot } from './aggregate-root';
import { DomainEvent } from './domain-event';

class TestEvent extends DomainEvent {
  constructor() {
    super();
  }
}

class TestAggregate extends AggregateRoot<string> {
  constructor(id: string) {
    super(id);
  }
}

describe('AggregateRoot', () => {
  it('should extend Entity and return the id', () => {
    const aggregate = new TestAggregate('agg-1');
    expect(aggregate.id).toBe('agg-1');
  });

  it('should collect a domain event via addDomainEvent', () => {
    const aggregate = new TestAggregate('agg-1');
    const event = new TestEvent();
    aggregate.addDomainEvent(event);
    const events = aggregate.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBe(event);
  });

  it('should clear domain events after pullDomainEvents', () => {
    const aggregate = new TestAggregate('agg-1');
    aggregate.addDomainEvent(new TestEvent());
    aggregate.pullDomainEvents();
    const secondPull = aggregate.pullDomainEvents();
    expect(secondPull).toHaveLength(0);
  });

  it('should support equals comparison via inherited Entity method', () => {
    const a1 = new TestAggregate('agg-1');
    const a2 = new TestAggregate('agg-1');
    expect(a1.equals(a2)).toBe(true);
  });
});
