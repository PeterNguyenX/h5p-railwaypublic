import { IAjaxResponse } from '../types';
/**
 * A response sent back to the H5P client if a requests succeeded. Note that MANY requests
 * don't use this response structure but simply send back the payload data.
 */
export default class AjaxSuccessResponse implements IAjaxResponse {
    data: any;
    message?: string;
    details?: string;
    /**
     * @param data the payload data
     * @param message (optional) A message displayed to the user. Should be localized if possible.
     * @param details (optional) Further text to be displayed to the user. Should be localized if possible.
     */
    constructor(data: any, message?: string, details?: string);
    success: boolean;
}
