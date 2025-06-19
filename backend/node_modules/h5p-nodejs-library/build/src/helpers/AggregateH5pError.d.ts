import H5pError from './H5pError';
/**
 * An AggregateH5pError can be used to store error messages if the error that occurred first doesn't mean that
 * the execution has to be stopped stopped right away.
 */
export default class AggregateH5pError extends H5pError {
    /**
     * @param firstError (optional) the first error
     */
    constructor(errorId: string, replacements: {
        [key: string]: string;
    }, httpStatusCode: number, debugMessage: string, clientErrorId?: string);
    private errors;
    /**
     * Adds a message to the object. You can add as many messages as you want.
     */
    addError(error: H5pError): AggregateH5pError;
    /**
     * Returns the errors added by addError(...).
     * @returns the errors
     */
    getErrors(): H5pError[];
    /**
     * Checks if any errors were added to the error.
     * @returns true of any errors were added.
     */
    hasErrors(): boolean;
}
