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
exports.__esModule = true;
/**
 * Represents a localizable error that can be reported back to the user.
 * The actual error text that is displayed to the user should not be passed to the error in code.
 * Use the errorId to tell the translation service which error this is. Optionally you can
 * also pass in a debugError.
 * DO NOT USE THIS CLASS FOR INTERNAL ERRORS SENT TO THE DEVELOPER!
 */
var H5pError = /** @class */ (function (_super) {
    __extends(H5pError, _super);
    function H5pError(errorId, replacements, httpStatusCode, debugMessage, clientErrorId) {
        var _newTarget = this.constructor;
        if (replacements === void 0) { replacements = {}; }
        if (httpStatusCode === void 0) { httpStatusCode = 500; }
        var _this = _super.call(this, "" + errorId + (debugMessage ? ": " + debugMessage : '')) || this;
        _this.errorId = errorId;
        _this.replacements = replacements;
        _this.httpStatusCode = httpStatusCode;
        _this.debugMessage = debugMessage;
        _this.clientErrorId = clientErrorId;
        Object.setPrototypeOf(_this, _newTarget.prototype); // need to restore the prototype chain
        return _this;
    }
    return H5pError;
}(Error));
exports["default"] = H5pError;
//# sourceMappingURL=H5pError.js.map