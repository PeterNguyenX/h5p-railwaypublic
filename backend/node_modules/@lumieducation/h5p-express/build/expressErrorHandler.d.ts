import { AggregateH5pError, H5pError } from '@lumieducation/h5p-server';
import { Request, Response, NextFunction } from 'express';
export declare function undefinedOrTrue(option: boolean): boolean;
/**
 * Calls the function passed to it and catches errors it throws. These errors
 * are then passed to the next(...) function for proper error handling.
 * You can disable error catching by setting options.handleErrors to false
 * @param fn The function to call
 * @param handleErrors whether to handle errors
 */
export declare const catchAndPassOnErrors: (fn: (req: Request, res: Response, next?: NextFunction) => Promise<any>, handleErrors: boolean) => (req: Request, res: Response, next: NextFunction) => Promise<any>;
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
 */ export declare function errorHandler(languageOverride?: string | 'auto'): (err: Error | H5pError | AggregateH5pError, req: Request & {
    t: any;
    i18n: any;
}, res: Response, next: NextFunction) => Promise<void>;
