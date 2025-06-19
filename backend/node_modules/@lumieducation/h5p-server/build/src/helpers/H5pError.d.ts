/**
 * Represents a localizable error that can be reported back to the user.
 * The actual error text that is displayed to the user should not be passed to the error in code.
 * Use the errorId to tell the translation service which error this is. Optionally you can
 * also pass in a debugError.
 * DO NOT USE THIS CLASS FOR INTERNAL ERRORS SENT TO THE DEVELOPER!
 */
export default class H5pError extends Error {
    errorId: string;
    replacements: {
        [key: string]: string | string[];
    };
    httpStatusCode: number;
    debugMessage?: string;
    clientErrorId?: string;
    constructor(errorId: string, replacements?: {
        [key: string]: string | string[];
    }, httpStatusCode?: number, debugMessage?: string, clientErrorId?: string);
}
