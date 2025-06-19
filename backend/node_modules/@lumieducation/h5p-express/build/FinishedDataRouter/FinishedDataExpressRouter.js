"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const express_1 = require("express");
const expressErrorHandler_1 = require("../expressErrorHandler");
const FinishedDataController_1 = __importDefault(require("./FinishedDataController"));
/**
 * This router implements necessary routes for setFinished to work. If you only
 * want certain routes, you can specify this in the options parameter.
 * @param options sets if you want and how to handle errors
 * @param languageOverride the language to use when returning errors. Only has
 * an effect if you use the i18next http middleware, as it relies on
 * req.i18n.changeLanguage to be present. Defaults to auto, which means the a
 * language detector must have detected language and req.t translated to the
 * detected language.
 */
function default_1(contentUserDataManager, config, options = { handleErrors: true }, languageOverride = 'auto') {
    const router = (0, express_1.Router)();
    const contentUserDataController = new FinishedDataController_1.default(contentUserDataManager, config);
    router.post(`/`, (0, expressErrorHandler_1.catchAndPassOnErrors)(contentUserDataController.postSetFinished, (0, expressErrorHandler_1.undefinedOrTrue)(options?.handleErrors)));
    if ((0, expressErrorHandler_1.undefinedOrTrue)(options?.handleErrors)) {
        router.use((0, expressErrorHandler_1.errorHandler)(languageOverride));
    }
    return router;
}
//# sourceMappingURL=FinishedDataExpressRouter.js.map