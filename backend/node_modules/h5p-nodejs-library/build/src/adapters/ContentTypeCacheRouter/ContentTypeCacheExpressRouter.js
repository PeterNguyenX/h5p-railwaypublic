"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var express_1 = require("express");
var expressErrorHandler_1 = require("../expressErrorHandler");
var ContentTypeCacheController_1 = __importDefault(require("./ContentTypeCacheController"));
function default_1(contentTypeCache, options, languageOverride) {
    if (options === void 0) { options = { handleErrors: true }; }
    if (languageOverride === void 0) { languageOverride = 'auto'; }
    var router = express_1.Router();
    var controller = new ContentTypeCacheController_1["default"](contentTypeCache);
    router.post("/update", expressErrorHandler_1.catchAndPassOnErrors(controller.postLibrariesContentTypeCacheUpdate, expressErrorHandler_1.undefinedOrTrue(options === null || options === void 0 ? void 0 : options.handleErrors)));
    router.get("/update", expressErrorHandler_1.catchAndPassOnErrors(controller.getLibrariesContentTypeCacheUpdate, expressErrorHandler_1.undefinedOrTrue(options === null || options === void 0 ? void 0 : options.handleErrors)));
    if (expressErrorHandler_1.undefinedOrTrue(options === null || options === void 0 ? void 0 : options.handleErrors)) {
        router.use(expressErrorHandler_1.errorHandler(languageOverride));
    }
    return router;
}
exports["default"] = default_1;
//# sourceMappingURL=ContentTypeCacheExpressRouter.js.map