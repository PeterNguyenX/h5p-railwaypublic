"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Stores objects in memory. It can store any key-value pairs.
 * This is just a placeholder for a proper storage implementation.
 */
class InMemoryStorage {
    storage;
    constructor() {
        this.storage = {};
    }
    async load(key) {
        return this.storage[key];
    }
    async save(key, value) {
        this.storage[key] = value;
    }
}
exports.default = InMemoryStorage;
//# sourceMappingURL=InMemoryStorage.js.map