"use strict";
exports.__esModule = true;
/**
 * Stores information about installed H5P libraries.
 */
var InstalledLibrary = /** @class */ (function () {
    function InstalledLibrary(machineName, majorVersion, minorVersion, patchVersion, restricted, optionalProperties) {
        if (restricted === void 0) { restricted = false; }
        this.machineName = machineName;
        this.majorVersion = majorVersion;
        this.minorVersion = minorVersion;
        this.patchVersion = patchVersion;
        this.restricted = restricted;
        if (optionalProperties) {
            Object.assign(this, optionalProperties);
        }
        this.machineName = machineName;
        this.majorVersion = majorVersion;
        this.minorVersion = minorVersion;
        this.patchVersion = patchVersion;
        this.restricted = restricted;
    }
    InstalledLibrary.fromMetadata = function (metadata) {
        return new InstalledLibrary(metadata.machineName, metadata.majorVersion, metadata.minorVersion, metadata.patchVersion, metadata.restricted, metadata);
    };
    InstalledLibrary.fromName = function (name) {
        return new InstalledLibrary(name.machineName, name.majorVersion, name.minorVersion, undefined, undefined);
    };
    /**
     * Compares libraries by giving precedence to title, then major version, then minor version
     * @param otherLibrary
     */
    InstalledLibrary.prototype.compare = function (otherLibrary) {
        return (this.title.localeCompare(otherLibrary.title) ||
            this.majorVersion - otherLibrary.majorVersion ||
            this.minorVersion - otherLibrary.minorVersion);
    };
    /**
     * Compares libraries by giving precedence to major version, then minor version, then if present patch version.
     * @param otherLibrary
     * @returns a negative value: if this library is older than the other library
     * a positive value: if this library is newer than the other library
     * zero: if both libraries are the same (or if it can't be determined, because the patch version is missing in the other library)
     */
    InstalledLibrary.prototype.compareVersions = function (otherLibrary) {
        return (this.majorVersion - otherLibrary.majorVersion ||
            this.minorVersion - otherLibrary.minorVersion ||
            (otherLibrary.patchVersion !== undefined
                ? this.patchVersion - otherLibrary.patchVersion
                : 0));
    };
    return InstalledLibrary;
}());
exports["default"] = InstalledLibrary;
//# sourceMappingURL=InstalledLibrary.js.map