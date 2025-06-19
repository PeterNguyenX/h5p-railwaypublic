"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var express_1 = require("express");
var LibraryAdministrationController_1 = __importDefault(require("./LibraryAdministrationController"));
var LibraryAdministrationExpressRouterOptions_1 = __importDefault(require("./LibraryAdministrationExpressRouterOptions"));
var expressErrorHandler_1 = require("../expressErrorHandler");
var LibraryAdministration_1 = __importDefault(require("../../LibraryAdministration"));
function default_1(h5pEditor, routeOptions, languageOverride) {
    if (routeOptions === void 0) { routeOptions = new LibraryAdministrationExpressRouterOptions_1["default"](); }
    if (languageOverride === void 0) { languageOverride = 'auto'; }
    var router = express_1.Router();
    var controller = new LibraryAdministrationController_1["default"](h5pEditor, new LibraryAdministration_1["default"](h5pEditor.libraryManager, h5pEditor.contentManager));
    if (expressErrorHandler_1.undefinedOrTrue(routeOptions.routeGetLibraries)) {
        router.get("/", expressErrorHandler_1.catchAndPassOnErrors(controller.getLibraries, routeOptions.handleErrors));
    }
    if (expressErrorHandler_1.undefinedOrTrue(routeOptions.routePostLibraries)) {
        router.post("/", expressErrorHandler_1.catchAndPassOnErrors(controller.postLibraries, routeOptions.handleErrors));
    }
    if (expressErrorHandler_1.undefinedOrTrue(routeOptions.routeGetLibrary)) {
        router.get("/:ubername", expressErrorHandler_1.catchAndPassOnErrors(controller.getLibrary, routeOptions.handleErrors));
    }
    if (expressErrorHandler_1.undefinedOrTrue(routeOptions.routePatchLibrary)) {
        router.patch("/:ubername", expressErrorHandler_1.catchAndPassOnErrors(controller.patchLibrary, routeOptions.handleErrors));
    }
    if (expressErrorHandler_1.undefinedOrTrue(routeOptions.routeDeleteLibrary)) {
        router["delete"]("/:ubername", expressErrorHandler_1.catchAndPassOnErrors(controller.deleteLibrary, routeOptions.handleErrors));
    }
    if (expressErrorHandler_1.undefinedOrTrue(routeOptions.handleErrors)) {
        router.use(expressErrorHandler_1.errorHandler(languageOverride));
    }
    return router;
}
exports["default"] = default_1;
//# sourceMappingURL=LibraryAdministrationExpressRouter.js.map