"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var H5P = __importStar(require("../../"));
var InMemoryStorage_1 = __importDefault(require("../InMemoryStorage"));
var DirectoryTemporaryFileStorage_1 = __importDefault(require("./DirectoryTemporaryFileStorage"));
var FileContentStorage_1 = __importDefault(require("./FileContentStorage"));
var FileLibraryStorage_1 = __importDefault(require("./FileLibraryStorage"));
function h5pfs(config, librariesPath, temporaryStoragePath, contentPath, contentStorage, translationCallback) {
    return new H5P.H5PEditor(new InMemoryStorage_1["default"](), config, new FileLibraryStorage_1["default"](librariesPath), contentStorage || new FileContentStorage_1["default"](contentPath), new DirectoryTemporaryFileStorage_1["default"](temporaryStoragePath), translationCallback);
}
exports["default"] = h5pfs;
//# sourceMappingURL=index.js.map