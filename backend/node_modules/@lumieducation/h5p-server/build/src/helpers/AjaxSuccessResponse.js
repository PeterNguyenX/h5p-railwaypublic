"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A response sent back to the H5P client if a requests succeeded. Note that MANY requests
 * don't use this response structure but simply send back the payload data.
 */
class AjaxSuccessResponse {
    data;
    message;
    details;
    /**
     * @param data the payload data
     * @param message (optional) A message displayed to the user. Should be localized if possible.
     * @param details (optional) Further text to be displayed to the user. Should be localized if possible.
     */
    constructor(data, message, details) {
        this.data = data;
        this.message = message;
        this.details = details;
    }
    success = true;
}
exports.default = AjaxSuccessResponse;
//# sourceMappingURL=AjaxSuccessResponse.js.map