"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A response that can be sent back to the H5P client when something went wrong.
 */
class AjaxErrorResponse {
    errorCode;
    httpStatusCode;
    message;
    details;
    /**
     *
     * @param errorCode an error code that can be understood by the H5P client
     * @param httpStatusCode the HTTP status code
     * @param message The message displayed to the user. Should be localized if possible.
     * @param details (optional) Further text displayed to the user. Should be localized if possible.
     */
    constructor(errorCode, httpStatusCode, message, details) {
        this.errorCode = errorCode;
        this.httpStatusCode = httpStatusCode;
        this.message = message;
        this.details = details;
    }
    success = false;
}
exports.default = AjaxErrorResponse;
//# sourceMappingURL=AjaxErrorResponse.js.map