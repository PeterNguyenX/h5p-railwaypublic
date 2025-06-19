"use strict";
exports.__esModule = true;
/**
 * This class generates URLs for files based on the URLs set in the configuration.
 */
var UrlGenerator = /** @class */ (function () {
    function UrlGenerator(config) {
        var _this = this;
        this.config = config;
        this.coreFile = function (file) {
            return "" + _this.getBaseUrl() + _this.config.coreUrl + "/" + file;
        };
        this.downloadPackage = function (contentId) {
            return "" + _this.getBaseUrl() + _this.config.downloadUrl + "/" + contentId;
        };
        this.editorLibraryFile = function (file) {
            return "" + _this.getBaseUrl() + _this.config.editorLibraryUrl + "/" + file;
        };
        this.editorLibraryFiles = function () {
            return "" + _this.getBaseUrl() + _this.config.editorLibraryUrl + "/";
        };
        this.libraryFile = function (library, file) {
            return "" + _this.getBaseUrl() + _this.config.librariesUrl + "/" + library.machineName + "-" + library.majorVersion + "." + library.minorVersion + "/" + file;
        };
        this.parameters = function () {
            return "" + _this.getBaseUrl() + _this.config.paramsUrl;
        };
        this.play = function () {
            return "" + _this.getBaseUrl() + _this.config.playUrl;
        };
        this.temporaryFiles = function () {
            return _this.getBaseUrl() + _this.config.temporaryFilesUrl;
        };
        this.getBaseUrl = function () {
            return _this.config.baseUrl;
        };
    }
    return UrlGenerator;
}());
exports["default"] = UrlGenerator;
//# sourceMappingURL=UrlGenerator.js.map