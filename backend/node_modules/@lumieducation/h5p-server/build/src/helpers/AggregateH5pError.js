"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const H5pError_1 = __importDefault(require("./H5pError"));
/**
 * An AggregateH5pError can be used to store error messages if the error that occurred first doesn't mean that
 * the execution has to be stopped stopped right away.
 */
class AggregateH5pError extends H5pError_1.default {
    /**
     * @param firstError (optional) the first error
     */
    constructor(errorId, replacements, httpStatusCode, debugMessage, clientErrorId) {
        super(errorId, replacements, httpStatusCode, debugMessage, clientErrorId);
        Object.setPrototypeOf(this, new.target.prototype); // need to restore the prototype chain
    }
    errors = [];
    /**
     * Adds a message to the object. You can add as many messages as you want.
     */
    addError(error) {
        this.errors.push(error);
        this.message = `${this.errorId}:${this.getErrors()
            .map((e) => e.message)
            .sort()
            .join(',')}`;
        return this;
    }
    /**
     * Returns the errors added by addError(...).
     * @returns the errors
     */
    getErrors() {
        return this.errors;
    }
    /**
     * Checks if any errors were added to the error.
     * @returns true of any errors were added.
     */
    hasErrors() {
        return this.errors.length > 0;
    }
}
exports.default = AggregateH5pError;
//# sourceMappingURL=AggregateH5pError.js.map