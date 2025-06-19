"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const async_lock_1 = __importDefault(require("async-lock"));
const Logger_1 = __importDefault(require("../helpers/Logger"));
const log = new Logger_1.default('SimpleLockProvider');
class SimpleLockProvider {
    constructor() {
        log.debug('initialize');
        this.lock = new async_lock_1.default();
    }
    lock;
    async acquire(key, callback, options) {
        let result;
        try {
            log.debug(`Attempting to acquire lock for key ${key}`);
            result = await this.lock.acquire(key, (done) => {
                callback()
                    .then((ret) => done(null, ret))
                    .catch((reason) => done(reason));
            }, {
                timeout: options.timeout,
                maxOccupationTime: options.maxOccupationTime
            } // the typescript typings are out of date
            );
        }
        catch (error) {
            if (error.message.startsWith('async-lock timed out')) {
                log.debug(`There was a timeout when acquiring lock for key ${key}.`);
                throw new Error('timeout');
            }
            if (error.message.startsWith('Maximum occupation time is exceeded')) {
                log.debug(`The operation holding the lock for key ${key} took longer than allowed. Releasing key.`);
                throw new Error('occupation-time-exceeded');
            }
            throw error;
        }
        log.debug(`The lock for key ${key} was released`);
        return result;
    }
}
exports.default = SimpleLockProvider;
//# sourceMappingURL=SimpleLockProvider.js.map