import { IAjaxResponse } from '../types';
/**
 * A response that can be sent back to the H5P client when something went wrong.
 */
export default class AjaxErrorResponse implements IAjaxResponse {
    errorCode: string;
    httpStatusCode: number;
    message: string;
    details?: string;
    /**
     *
     * @param errorCode an error code that can be understood by the H5P client
     * @param httpStatusCode the HTTP status code
     * @param message The message displayed to the user. Should be localized if possible.
     * @param details (optional) Further text displayed to the user. Should be localized if possible.
     */
    constructor(errorCode: string, httpStatusCode: number, message: string, details?: string);
    success: boolean;
}
