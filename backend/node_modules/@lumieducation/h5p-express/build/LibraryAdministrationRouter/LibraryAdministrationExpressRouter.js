"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const express_1 = require("express");
const h5p_server_1 = require("@lumieducation/h5p-server");
const LibraryAdministrationController_1 = __importDefault(require("./LibraryAdministrationController"));
const LibraryAdministrationExpressRouterOptions_1 = __importDefault(require("./LibraryAdministrationExpressRouterOptions"));
const expressErrorHandler_1 = require("../expressErrorHandler");
function default_1(h5pEditor, routeOptions = new LibraryAdministrationExpressRouterOptions_1.default(), languageOverride = 'auto') {
    const router = (0, express_1.Router)();
    const controller = new LibraryAdministrationController_1.default(h5pEditor, new h5p_server_1.LibraryAdministration(h5pEditor.libraryManager, h5pEditor.contentManager));
    if ((0, expressErrorHandler_1.undefinedOrTrue)(routeOptions.routeGetLibraries)) {
        router.get(`/`, (0, expressErrorHandler_1.catchAndPassOnErrors)(controller.getLibraries, routeOptions.handleErrors));
    }
    if ((0, expressErrorHandler_1.undefinedOrTrue)(routeOptions.routePostLibraries)) {
        router.post(`/`, (0, expressErrorHandler_1.catchAndPassOnErrors)(controller.postLibraries, routeOptions.handleErrors));
    }
    if ((0, expressErrorHandler_1.undefinedOrTrue)(routeOptions.routeGetLibrary)) {
        router.get(`/:ubername`, (0, expressErrorHandler_1.catchAndPassOnErrors)(controller.getLibrary, routeOptions.handleErrors));
    }
    if ((0, expressErrorHandler_1.undefinedOrTrue)(routeOptions.routePatchLibrary)) {
        router.patch(`/:ubername`, (0, expressErrorHandler_1.catchAndPassOnErrors)(controller.patchLibrary, routeOptions.handleErrors));
    }
    if ((0, expressErrorHandler_1.undefinedOrTrue)(routeOptions.routeDeleteLibrary)) {
        router.delete(`/:ubername`, (0, expressErrorHandler_1.catchAndPassOnErrors)(controller.deleteLibrary, routeOptions.handleErrors));
    }
    if ((0, expressErrorHandler_1.undefinedOrTrue)(routeOptions.handleErrors)) {
        router.use((0, expressErrorHandler_1.errorHandler)(languageOverride));
    }
    return router;
}
//# sourceMappingURL=LibraryAdministrationExpressRouter.js.map