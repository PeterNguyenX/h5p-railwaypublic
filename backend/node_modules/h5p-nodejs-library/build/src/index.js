"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.fsImplementations = exports.fs = exports.H5PConfig = exports.Permission = exports.PackageExporter = exports.LibraryName = exports.LibraryAdministration = exports.InstalledLibrary = exports.HtmlExporter = exports.H5PPlayer = exports.H5pError = exports.H5PEditor = void 0;
// Classes
var H5PEditor_1 = __importDefault(require("./H5PEditor"));
exports.H5PEditor = H5PEditor_1["default"];
var H5pError_1 = __importDefault(require("./helpers/H5pError"));
exports.H5pError = H5pError_1["default"];
var H5PPlayer_1 = __importDefault(require("./H5PPlayer"));
exports.H5PPlayer = H5PPlayer_1["default"];
var HtmlExporter_1 = __importDefault(require("./HtmlExporter"));
exports.HtmlExporter = HtmlExporter_1["default"];
var InstalledLibrary_1 = __importDefault(require("./InstalledLibrary"));
exports.InstalledLibrary = InstalledLibrary_1["default"];
var LibraryName_1 = __importDefault(require("./LibraryName"));
exports.LibraryName = LibraryName_1["default"];
var PackageExporter_1 = __importDefault(require("./PackageExporter"));
exports.PackageExporter = PackageExporter_1["default"];
var H5PConfig_1 = __importDefault(require("./implementation/H5PConfig"));
exports.H5PConfig = H5PConfig_1["default"];
var fs_1 = __importDefault(require("./implementation/fs"));
exports.fs = fs_1["default"];
var DirectoryTemporaryFileStorage_1 = __importDefault(require("./implementation/fs/DirectoryTemporaryFileStorage"));
var FileContentStorage_1 = __importDefault(require("./implementation/fs/FileContentStorage"));
var FileLibraryStorage_1 = __importDefault(require("./implementation/fs/FileLibraryStorage"));
var JsonStorage_1 = __importDefault(require("./implementation/fs/JsonStorage"));
var InMemoryStorage_1 = __importDefault(require("./implementation/InMemoryStorage"));
// Interfaces
var types_1 = require("./types");
exports.Permission = types_1.Permission;
// Adapters
var LibraryAdministration_1 = __importDefault(require("./LibraryAdministration"));
exports.LibraryAdministration = LibraryAdministration_1["default"];
var fsImplementations = {
    DirectoryTemporaryFileStorage: DirectoryTemporaryFileStorage_1["default"],
    FileContentStorage: FileContentStorage_1["default"],
    FileLibraryStorage: FileLibraryStorage_1["default"],
    InMemoryStorage: InMemoryStorage_1["default"],
    JsonStorage: JsonStorage_1["default"]
};
exports.fsImplementations = fsImplementations;
//# sourceMappingURL=index.js.map