"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const InMemoryStorage_1 = __importDefault(require("../InMemoryStorage"));
/**
 * Reads key-value pairs from a JSON file and writes them back. It is
 * recommended to create it with the static create(...) factory instead of the
 * sync constructor.
 */
class JsonStorage extends InMemoryStorage_1.default {
    /**
     * Initializes the JsonStorage. It's advised to use the async static factory
     * method create(...) instead.
     * @param file Path to the JSON file (must be read- and writable)
     */
    constructor(file) {
        super();
        if (file) {
            this.file = file;
            this.storage = JSON.parse((0, fs_1.readFileSync)(file, 'utf-8'));
        }
    }
    file;
    /**
     * Factory for a JsonStorage object that initializes the object. Throws
     * errors is something is wrong with the file (not accessible / can't be
     * parsed).
     * @param file Path to the JSON file (must be read- and writeable)
     */
    static async create(file) {
        const storage = new JsonStorage();
        await storage.initialize(file);
        return storage;
    }
    /**
     * Saves a key in the JSON file (supports nested values).
     * @param key
     * @param value
     */
    async save(key, value) {
        const returnValue = await super.save(key, value);
        await (0, promises_1.writeFile)(this.file, JSON.stringify(this.storage));
        return returnValue;
    }
    /**
     * Initializes the storage by loading the JSON file.
     * @param file Path to the JSON file (must be read- and writeable)
     */
    async initialize(file) {
        this.storage = await JSON.parse(await (0, promises_1.readFile)(file, 'utf-8'));
        this.file = file;
    }
}
exports.default = JsonStorage;
//# sourceMappingURL=JsonStorage.js.map