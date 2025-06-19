"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleLockProvider = exports.UrlGenerator = exports.cacheImplementations = exports.fsImplementations = exports.utils = exports.fs = exports.LaissezFairePermissionSystem = exports.H5PConfig = exports.UserDataPermission = exports.TemporaryFilePermission = exports.MalwareScanResult = exports.GeneralPermission = exports.FileSanitizerResult = exports.ContentPermission = exports.PackageExporter = exports.Logger = exports.LibraryName = exports.LibraryManager = exports.LibraryAdministration = exports.InstalledLibrary = exports.H5PPlayer = exports.H5pError = exports.H5PEditor = exports.H5PAjaxEndpoint = exports.ContentUserDataManager = exports.ContentTypeCache = exports.ContentFileScanner = exports.streamToString = exports.AjaxSuccessResponse = exports.AjaxErrorResponse = exports.AggregateH5pError = void 0;
// Classes
const H5PEditor_1 = __importDefault(require("./H5PEditor"));
exports.H5PEditor = H5PEditor_1.default;
const H5pError_1 = __importDefault(require("./helpers/H5pError"));
exports.H5pError = H5pError_1.default;
const H5PPlayer_1 = __importDefault(require("./H5PPlayer"));
exports.H5PPlayer = H5PPlayer_1.default;
const InstalledLibrary_1 = __importDefault(require("./InstalledLibrary"));
exports.InstalledLibrary = InstalledLibrary_1.default;
const LibraryName_1 = __importDefault(require("./LibraryName"));
exports.LibraryName = LibraryName_1.default;
const PackageExporter_1 = __importDefault(require("./PackageExporter"));
exports.PackageExporter = PackageExporter_1.default;
const H5PAjaxEndpoint_1 = __importDefault(require("./H5PAjaxEndpoint"));
exports.H5PAjaxEndpoint = H5PAjaxEndpoint_1.default;
const ContentTypeCache_1 = __importDefault(require("./ContentTypeCache"));
exports.ContentTypeCache = ContentTypeCache_1.default;
const AggregateH5pError_1 = __importDefault(require("./helpers/AggregateH5pError"));
exports.AggregateH5pError = AggregateH5pError_1.default;
const AjaxErrorResponse_1 = __importDefault(require("./helpers/AjaxErrorResponse"));
exports.AjaxErrorResponse = AjaxErrorResponse_1.default;
const AjaxSuccessResponse_1 = __importDefault(require("./helpers/AjaxSuccessResponse"));
exports.AjaxSuccessResponse = AjaxSuccessResponse_1.default;
const StreamHelpers_1 = require("./helpers/StreamHelpers");
Object.defineProperty(exports, "streamToString", { enumerable: true, get: function () { return StreamHelpers_1.streamToString; } });
const Logger_1 = __importDefault(require("./helpers/Logger"));
exports.Logger = Logger_1.default;
const H5PConfig_1 = __importDefault(require("./implementation/H5PConfig"));
exports.H5PConfig = H5PConfig_1.default;
const fs_1 = __importDefault(require("./implementation/fs"));
exports.fs = fs_1.default;
const utils = __importStar(require("./implementation/utils"));
exports.utils = utils;
const DirectoryTemporaryFileStorage_1 = __importDefault(require("./implementation/fs/DirectoryTemporaryFileStorage"));
const FileContentStorage_1 = __importDefault(require("./implementation/fs/FileContentStorage"));
const FileLibraryStorage_1 = __importDefault(require("./implementation/fs/FileLibraryStorage"));
const FileContentUserDataStorage_1 = __importDefault(require("./implementation/fs/FileContentUserDataStorage"));
const JsonStorage_1 = __importDefault(require("./implementation/fs/JsonStorage"));
const InMemoryStorage_1 = __importDefault(require("./implementation/InMemoryStorage"));
const CachedLibraryStorage_1 = __importDefault(require("./implementation/cache/CachedLibraryStorage"));
const CachedKeyValueStorage_1 = __importDefault(require("./implementation/cache/CachedKeyValueStorage"));
const ContentFileScanner_1 = require("./ContentFileScanner");
Object.defineProperty(exports, "ContentFileScanner", { enumerable: true, get: function () { return ContentFileScanner_1.ContentFileScanner; } });
const LibraryManager_1 = __importDefault(require("./LibraryManager"));
exports.LibraryManager = LibraryManager_1.default;
const ContentUserDataManager_1 = __importDefault(require("./ContentUserDataManager"));
exports.ContentUserDataManager = ContentUserDataManager_1.default;
const UrlGenerator_1 = __importDefault(require("./UrlGenerator"));
exports.UrlGenerator = UrlGenerator_1.default;
const SimpleLockProvider_1 = __importDefault(require("./implementation/SimpleLockProvider"));
exports.SimpleLockProvider = SimpleLockProvider_1.default;
const LaissezFairePermissionSystem_1 = require("./implementation/LaissezFairePermissionSystem");
Object.defineProperty(exports, "LaissezFairePermissionSystem", { enumerable: true, get: function () { return LaissezFairePermissionSystem_1.LaissezFairePermissionSystem; } });
// Interfaces
const types_1 = require("./types");
Object.defineProperty(exports, "ContentPermission", { enumerable: true, get: function () { return types_1.ContentPermission; } });
Object.defineProperty(exports, "FileSanitizerResult", { enumerable: true, get: function () { return types_1.FileSanitizerResult; } });
Object.defineProperty(exports, "GeneralPermission", { enumerable: true, get: function () { return types_1.GeneralPermission; } });
Object.defineProperty(exports, "MalwareScanResult", { enumerable: true, get: function () { return types_1.MalwareScanResult; } });
Object.defineProperty(exports, "TemporaryFilePermission", { enumerable: true, get: function () { return types_1.TemporaryFilePermission; } });
Object.defineProperty(exports, "UserDataPermission", { enumerable: true, get: function () { return types_1.UserDataPermission; } });
// Adapters
const LibraryAdministration_1 = __importDefault(require("./LibraryAdministration"));
exports.LibraryAdministration = LibraryAdministration_1.default;
const fsImplementations = {
    DirectoryTemporaryFileStorage: DirectoryTemporaryFileStorage_1.default,
    FileContentStorage: FileContentStorage_1.default,
    FileLibraryStorage: FileLibraryStorage_1.default,
    InMemoryStorage: InMemoryStorage_1.default,
    JsonStorage: JsonStorage_1.default,
    FileContentUserDataStorage: FileContentUserDataStorage_1.default
};
exports.fsImplementations = fsImplementations;
const cacheImplementations = {
    CachedKeyValueStorage: CachedKeyValueStorage_1.default,
    CachedLibraryStorage: CachedLibraryStorage_1.default
};
exports.cacheImplementations = cacheImplementations;
//# sourceMappingURL=index.js.map