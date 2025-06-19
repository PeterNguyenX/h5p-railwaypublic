"use strict";
exports.__esModule = true;
/**
 * A response that can be sent back to the H5P client when something went wrong.
 */
var AjaxErrorResponse = /** @class */ (function () {
    /**
     *
     * @param errorCode an error code that can be understood by the H5P client
     * @param httpStatusCode the HTTP status code
     * @param message The message displayed to the user. Should be localized if possible.
     * @param details (optional) Further text displayed to the user. Should be localized if possible.
     */
    function AjaxErrorResponse(errorCode, httpStatusCode, message, details) {
        this.errorCode = errorCode;
        this.httpStatusCode = httpStatusCode;
        this.message = message;
        this.details = details;
        this.success = false;
    }
    return AjaxErrorResponse;
}());
exports["default"] = AjaxErrorResponse;
//# sourceMappingURL=AjaxErrorResponse.js.map