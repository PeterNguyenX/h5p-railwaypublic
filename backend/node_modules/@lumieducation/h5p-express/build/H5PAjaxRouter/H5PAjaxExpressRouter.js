"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const express_1 = require("express");
const expressErrorHandler_1 = require("../expressErrorHandler");
const H5PAjaxExpressController_1 = __importDefault(require("./H5PAjaxExpressController"));
const H5PAjaxExpressRouterOptions_1 = __importDefault(require("./H5PAjaxExpressRouterOptions"));
const ContentUserDataExpressRouter_1 = __importDefault(require("../ContentUserDataRouter/ContentUserDataExpressRouter"));
const FinishedDataExpressRouter_1 = __importDefault(require("../FinishedDataRouter/FinishedDataExpressRouter"));
/**
 * This router implements all Ajax calls necessary for the H5P (editor) client to work.
 * Use it like this: server.use('/h5p', H5P.adapters.express(h5pEditor, path.resolve('h5p/core'), path.resolve('h5p/editor')));
 * If you only want certain routes, you can specify this in the options parameter.
 * @param h5pEditor the editor object
 * @param h5pCorePath the path on the local disk at which the core files (of the player) can be found
 * @param h5pEditorLibraryPath the path on the local disk at which the core files of the editor can be found
 * @param routeOptions sets which routes you want and how to handle errors
 * @param languageOverride the language to use when returning errors.
 * Only has an effect if you use the i18next http middleware, as it relies on
 * req.i18n.changeLanguage to be present. Defaults to auto, which means the
 * a language detector must have detected language and req.t translated to the
 * detected language.
 */
function default_1(h5pEditor, h5pCorePath, h5pEditorLibraryPath, routeOptions = new H5PAjaxExpressRouterOptions_1.default(), languageOverride = 'auto') {
    const router = (0, express_1.Router)();
    const h5pController = new H5PAjaxExpressController_1.default(h5pEditor);
    // get library file
    if ((0, expressErrorHandler_1.undefinedOrTrue)(routeOptions.routeGetLibraryFile)) {
        router.get(`${h5pEditor.config.librariesUrl}/:uberName/:file(*)`, (0, expressErrorHandler_1.catchAndPassOnErrors)(h5pController.getLibraryFile, routeOptions.handleErrors));
    }
    // get content file
    if ((0, expressErrorHandler_1.undefinedOrTrue)(routeOptions.routeGetContentFile)) {
        router.get(`${h5pEditor.config.contentFilesUrl}/:id/:file(*)`, (0, expressErrorHandler_1.catchAndPassOnErrors)(h5pController.getContentFile, routeOptions.handleErrors));
    }
    // get temporary content file
    if ((0, expressErrorHandler_1.undefinedOrTrue)(routeOptions.routeGetTemporaryContentFile)) {
        router.get(`${h5pEditor.config.temporaryFilesUrl}/:file(*)`, (0, expressErrorHandler_1.catchAndPassOnErrors)(h5pController.getTemporaryContentFile, routeOptions.handleErrors));
    }
    // get parameters (= content.json) of content
    if ((0, expressErrorHandler_1.undefinedOrTrue)(routeOptions.routeGetParameters)) {
        router.get(`${h5pEditor.config.paramsUrl}/:contentId`, (0, expressErrorHandler_1.catchAndPassOnErrors)(h5pController.getContentParameters, routeOptions.handleErrors));
    }
    // get various things through the Ajax endpoint
    if ((0, expressErrorHandler_1.undefinedOrTrue)(routeOptions.routeGetAjax)) {
        router.get(h5pEditor.config.ajaxUrl, (0, expressErrorHandler_1.catchAndPassOnErrors)(h5pController.getAjax, routeOptions.handleErrors));
    }
    // post various things through the Ajax endpoint
    // Don't be confused by the fact that many of the requests dealt with here are not
    // really POST requests, but look more like GET requests. This is simply how the H5P
    // client works and we can't change it.
    if ((0, expressErrorHandler_1.undefinedOrTrue)(routeOptions.routePostAjax)) {
        router.post(h5pEditor.config.ajaxUrl, (0, expressErrorHandler_1.catchAndPassOnErrors)(h5pController.postAjax, routeOptions.handleErrors));
    }
    // save and retrieve the state of individual users
    if ((0, expressErrorHandler_1.undefinedOrTrue)(routeOptions.routeContentUserData)) {
        router.use(h5pEditor.config.contentUserDataUrl, (0, ContentUserDataExpressRouter_1.default)(h5pEditor.contentUserDataManager, h5pEditor.config));
    }
    // track usage of users
    if ((0, expressErrorHandler_1.undefinedOrTrue)(routeOptions.routeFinishedData)) {
        router.use(h5pEditor.config.setFinishedUrl, (0, FinishedDataExpressRouter_1.default)(h5pEditor.contentUserDataManager, h5pEditor.config));
    }
    // serve core files (= JavaScript + CSS from h5p-php-library)
    if ((0, expressErrorHandler_1.undefinedOrTrue)(routeOptions.routeCoreFiles)) {
        router.use(h5pEditor.config.coreUrl, (0, express_1.static)(h5pCorePath, {
            cacheControl: true,
            etag: true,
            lastModified: true,
            maxAge: 31536000000
        }));
    }
    // serve editor core files (= JavaScript + CSS from h5p-editor-php-library)
    if ((0, expressErrorHandler_1.undefinedOrTrue)(routeOptions.routeEditorCoreFiles)) {
        router.use(h5pEditor.config.editorLibraryUrl, (0, express_1.static)(h5pEditorLibraryPath, {
            cacheControl: true,
            etag: true,
            lastModified: true,
            maxAge: 31536000000
        }));
    }
    // serve download links
    if ((0, expressErrorHandler_1.undefinedOrTrue)(routeOptions.routeGetDownload)) {
        router.get(`${h5pEditor.config.downloadUrl}/:contentId`, (0, expressErrorHandler_1.catchAndPassOnErrors)(h5pController.getDownload, routeOptions.handleErrors));
    }
    if ((0, expressErrorHandler_1.undefinedOrTrue)(routeOptions.handleErrors)) {
        router.use((0, expressErrorHandler_1.errorHandler)(languageOverride));
    }
    return router;
}
//# sourceMappingURL=H5PAjaxExpressRouter.js.map