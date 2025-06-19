"use strict";
exports.__esModule = true;
/**
 * A response sent back to the H5P client if a requests succeeded. Note that MANY requests
 * don't use this response structure but simply send back the payload data.
 */
var AjaxSuccessResponse = /** @class */ (function () {
    /**
     * @param data the payload data
     * @param message (optional) A message displayed to the user. Should be localized if possible.
     * @param details (optional) Further text to be displayed to the user. Should be localized if possible.
     */
    function AjaxSuccessResponse(data, message, details) {
        this.data = data;
        this.message = message;
        this.details = details;
        this.success = true;
    }
    return AjaxSuccessResponse;
}());
exports["default"] = AjaxSuccessResponse;
//# sourceMappingURL=AjaxSuccessResponse.js.map