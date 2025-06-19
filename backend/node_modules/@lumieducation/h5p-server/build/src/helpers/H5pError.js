"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Represents a localizable error that can be reported back to the user.
 * The actual error text that is displayed to the user should not be passed to the error in code.
 * Use the errorId to tell the translation service which error this is. Optionally you can
 * also pass in a debugError.
 * DO NOT USE THIS CLASS FOR INTERNAL ERRORS SENT TO THE DEVELOPER!
 */
class H5pError extends Error {
    errorId;
    replacements;
    httpStatusCode;
    debugMessage;
    clientErrorId;
    constructor(errorId, replacements = {}, httpStatusCode = 500, debugMessage, clientErrorId) {
        let replacementsString = null;
        if (replacements && Object.keys(replacements).length > 0) {
            replacementsString = ` (${Object.keys(replacements)
                .map((k) => `${k}: ${replacements[k]}`)
                .join(', ')})`;
        }
        super(`${errorId}${debugMessage ? `: ${debugMessage}` : ''}${replacementsString ? replacementsString : ''}`);
        this.errorId = errorId;
        this.replacements = replacements;
        this.httpStatusCode = httpStatusCode;
        this.debugMessage = debugMessage;
        this.clientErrorId = clientErrorId;
        Error.captureStackTrace(this, H5pError);
        Object.setPrototypeOf(this, new.target.prototype); // need to restore the prototype chain
    }
}
exports.default = H5pError;
//# sourceMappingURL=H5pError.js.map