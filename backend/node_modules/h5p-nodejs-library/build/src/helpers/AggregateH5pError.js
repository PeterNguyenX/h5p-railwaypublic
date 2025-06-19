"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var H5pError_1 = __importDefault(require("./H5pError"));
/**
 * An AggregateH5pError can be used to store error messages if the error that occurred first doesn't mean that
 * the execution has to be stopped stopped right away.
 */
var AggregateH5pError = /** @class */ (function (_super) {
    __extends(AggregateH5pError, _super);
    /**
     * @param firstError (optional) the first error
     */
    function AggregateH5pError(errorId, replacements, httpStatusCode, debugMessage, clientErrorId) {
        var _newTarget = this.constructor;
        var _this = _super.call(this, errorId, replacements, httpStatusCode, debugMessage, clientErrorId) || this;
        _this.errors = [];
        Object.setPrototypeOf(_this, _newTarget.prototype); // need to restore the prototype chain
        return _this;
    }
    /**
     * Adds a message to the object. You can add as many messages as you want.
     */
    AggregateH5pError.prototype.addError = function (error) {
        this.errors.push(error);
        this.message = this.errorId + ":" + this.getErrors()
            .map(function (e) { return e.message; })
            .join(',');
        return this;
    };
    /**
     * Returns the errors added by addError(...).
     * @returns the errors
     */
    AggregateH5pError.prototype.getErrors = function () {
        return this.errors;
    };
    /**
     * Checks if any errors were added to the error.
     * @returns true of any errors were added.
     */
    AggregateH5pError.prototype.hasErrors = function () {
        return this.errors.length > 0;
    };
    return AggregateH5pError;
}(H5pError_1["default"]));
exports["default"] = AggregateH5pError;
//# sourceMappingURL=AggregateH5pError.js.map