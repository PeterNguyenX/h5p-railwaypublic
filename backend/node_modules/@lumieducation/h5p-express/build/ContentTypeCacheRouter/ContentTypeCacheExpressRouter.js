"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const express_1 = require("express");
const expressErrorHandler_1 = require("../expressErrorHandler");
const ContentTypeCacheController_1 = __importDefault(require("./ContentTypeCacheController"));
function default_1(contentTypeCache, options = { handleErrors: true }, languageOverride = 'auto') {
    const router = (0, express_1.Router)();
    const controller = new ContentTypeCacheController_1.default(contentTypeCache);
    router.post(`/update`, (0, expressErrorHandler_1.catchAndPassOnErrors)(controller.postLibrariesContentTypeCacheUpdate, (0, expressErrorHandler_1.undefinedOrTrue)(options?.handleErrors)));
    router.get(`/update`, (0, expressErrorHandler_1.catchAndPassOnErrors)(controller.getLibrariesContentTypeCacheUpdate, (0, expressErrorHandler_1.undefinedOrTrue)(options?.handleErrors)));
    if ((0, expressErrorHandler_1.undefinedOrTrue)(options?.handleErrors)) {
        router.use((0, expressErrorHandler_1.errorHandler)(languageOverride));
    }
    return router;
}
//# sourceMappingURL=ContentTypeCacheExpressRouter.js.map