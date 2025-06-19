"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catchAndPassOnErrors = void 0;
exports.undefinedOrTrue = undefinedOrTrue;
exports.errorHandler = errorHandler;
const h5p_server_1 = require("@lumieducation/h5p-server");
const log = new h5p_server_1.Logger('h5p-express');
function undefinedOrTrue(option) {
    return option === undefined || option;
}
/**
 * Calls the function passed to it and catches errors it throws. These errors
 * are then passed to the next(...) function for proper error handling.
 * You can disable error catching by setting options.handleErrors to false
 * @param fn The function to call
 * @param handleErrors whether to handle errors
 */
const catchAndPassOnErrors = (fn, handleErrors) => async (req, res, next) => {
    if (undefinedOrTrue(handleErrors)) {
        try {
            return await fn(req, res);
        }
        catch (error) {
            return next(error);
        }
    }
    return fn(req, res);
};
exports.catchAndPassOnErrors = catchAndPassOnErrors;
/**
 * An Express middleware that converts NodeJs error objects into error
 * responses the H5P client can understand. Add this middleware as the last
 * entry in your express application and make sure all routes don't throw errors
 * but pass them to the next(...) function. (You must do this manually in async functions!)
 * @param languageOverride the language to use when returning errors.
 * Only has an effect if you use the i18next http middleware, as it relies on
 * req.i18n.changeLanguage to be present. Defaults to auto, which means the
 * a language detector must have detected language and req.t translated to the
 * detected language.
 */ function errorHandler(languageOverride = 'auto') {
    return async (err, req, res, next) => {
        let statusCode = 500;
        let statusText = '';
        let detailsList;
        let clientErrorId = '';
        if (err instanceof h5p_server_1.H5pError) {
            if (req.t &&
                req.i18n &&
                languageOverride &&
                languageOverride !== 'auto') {
                await req.i18n.changeLanguage(languageOverride);
            }
            statusCode = err.httpStatusCode;
            statusText =
                req.t === undefined
                    ? err.errorId
                    : req.t(err.errorId, err.replacements);
            clientErrorId = err.clientErrorId || '';
            log.debug(`H5PError: ${statusCode} - ${statusText}`);
            log.debug(err.stack);
            if (err instanceof h5p_server_1.AggregateH5pError) {
                detailsList = err.getErrors().map((e) => ({
                    code: e.errorId,
                    message: req.t === undefined
                        ? e.errorId
                        : req.t(e.errorId, e.replacements)
                }));
            }
        }
        else {
            log.error('An unexpected error occurred:');
            log.error(err.message);
            log.error(err.stack);
            statusText = err.message;
        }
        res.status(statusCode).json(new h5p_server_1.AjaxErrorResponse(clientErrorId, statusCode, statusText, detailsList));
    };
}
//# sourceMappingURL=expressErrorHandler.js.map