"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregateRoot = void 0;
const entity_1 = require("./entity");
class AggregateRoot extends entity_1.Entity {
    domainEvents = [];
    constructor(id) {
        super(id);
    }
    addDomainEvent(event) {
        this.domainEvents.push(event);
    }
    pullDomainEvents() {
        const events = [...this.domainEvents];
        this.domainEvents.length = 0;
        return events;
    }
}
exports.AggregateRoot = AggregateRoot;
//# sourceMappingURL=aggregate-root.js.map