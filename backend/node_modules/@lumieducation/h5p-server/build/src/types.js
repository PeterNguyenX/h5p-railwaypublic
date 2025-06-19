"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSanitizerResult = exports.MalwareScanResult = exports.GeneralPermission = exports.TemporaryFilePermission = exports.UserDataPermission = exports.ContentPermission = void 0;
/**
 * Give rights to users to perform certain actions with a piece of content.
 */
var ContentPermission;
(function (ContentPermission) {
    ContentPermission[ContentPermission["Create"] = 0] = "Create";
    ContentPermission[ContentPermission["Delete"] = 1] = "Delete";
    ContentPermission[ContentPermission["Download"] = 2] = "Download";
    ContentPermission[ContentPermission["Edit"] = 3] = "Edit";
    ContentPermission[ContentPermission["Embed"] = 4] = "Embed";
    ContentPermission[ContentPermission["List"] = 5] = "List";
    ContentPermission[ContentPermission["View"] = 6] = "View";
})(ContentPermission || (exports.ContentPermission = ContentPermission = {}));
/**
 * Give rights to users to perform certain actions with a user data.
 */
var UserDataPermission;
(function (UserDataPermission) {
    UserDataPermission[UserDataPermission["EditState"] = 0] = "EditState";
    UserDataPermission[UserDataPermission["DeleteState"] = 1] = "DeleteState";
    UserDataPermission[UserDataPermission["ViewState"] = 2] = "ViewState";
    UserDataPermission[UserDataPermission["ListStates"] = 3] = "ListStates";
    UserDataPermission[UserDataPermission["EditFinished"] = 4] = "EditFinished";
    UserDataPermission[UserDataPermission["ViewFinished"] = 5] = "ViewFinished";
    UserDataPermission[UserDataPermission["DeleteFinished"] = 6] = "DeleteFinished";
})(UserDataPermission || (exports.UserDataPermission = UserDataPermission = {}));
/**
 * Give rights to users to perform certain actions with temporary files.
 */
var TemporaryFilePermission;
(function (TemporaryFilePermission) {
    TemporaryFilePermission[TemporaryFilePermission["Create"] = 0] = "Create";
    TemporaryFilePermission[TemporaryFilePermission["Delete"] = 1] = "Delete";
    TemporaryFilePermission[TemporaryFilePermission["List"] = 2] = "List";
    TemporaryFilePermission[TemporaryFilePermission["View"] = 3] = "View";
})(TemporaryFilePermission || (exports.TemporaryFilePermission = TemporaryFilePermission = {}));
/**
 * Give rights to users to perform certain actions that are not associated with
 * existing objects.
 */
var GeneralPermission;
(function (GeneralPermission) {
    /**
     * If given, the user can create content of content types that are set to
     * "restricted".
     */
    GeneralPermission[GeneralPermission["CreateRestricted"] = 0] = "CreateRestricted";
    /**
     * If given, the user can install content types from the hub that have the
     *  "recommended" flag in the Hub.
     */
    GeneralPermission[GeneralPermission["InstallRecommended"] = 1] = "InstallRecommended";
    /**
     * If given, the user can generally install and update libraries. This
     * includes Hub content types that aren't set to "recommended" or uploading
     * custom packages.
     */
    GeneralPermission[GeneralPermission["UpdateAndInstallLibraries"] = 2] = "UpdateAndInstallLibraries";
})(GeneralPermission || (exports.GeneralPermission = GeneralPermission = {}));
var MalwareScanResult;
(function (MalwareScanResult) {
    MalwareScanResult[MalwareScanResult["MalwareFound"] = 0] = "MalwareFound";
    MalwareScanResult[MalwareScanResult["Clean"] = 1] = "Clean";
    MalwareScanResult[MalwareScanResult["NotScanned"] = 2] = "NotScanned";
})(MalwareScanResult || (exports.MalwareScanResult = MalwareScanResult = {}));
var FileSanitizerResult;
(function (FileSanitizerResult) {
    FileSanitizerResult[FileSanitizerResult["Sanitized"] = 0] = "Sanitized";
    FileSanitizerResult[FileSanitizerResult["NotSanitized"] = 1] = "NotSanitized";
    FileSanitizerResult[FileSanitizerResult["Ignored"] = 2] = "Ignored";
})(FileSanitizerResult || (exports.FileSanitizerResult = FileSanitizerResult = {}));
//# sourceMappingURL=types.js.map