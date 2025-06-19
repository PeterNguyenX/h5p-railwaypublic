"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = h5pfs;
const H5PEditor_1 = __importDefault(require("../../H5PEditor"));
const InMemoryStorage_1 = __importDefault(require("../InMemoryStorage"));
const DirectoryTemporaryFileStorage_1 = __importDefault(require("./DirectoryTemporaryFileStorage"));
const FileContentStorage_1 = __importDefault(require("./FileContentStorage"));
const FileLibraryStorage_1 = __importDefault(require("./FileLibraryStorage"));
function h5pfs(config, librariesPath, temporaryStoragePath, contentPath, contentUserDataStorage, contentStorage, translationCallback, urlGenerator, options) {
    return new H5PEditor_1.default(new InMemoryStorage_1.default(), config, new FileLibraryStorage_1.default(librariesPath), contentStorage || new FileContentStorage_1.default(contentPath), new DirectoryTemporaryFileStorage_1.default(temporaryStoragePath), translationCallback, urlGenerator, options, contentUserDataStorage);
}
//# sourceMappingURL=index.js.map