"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Stores information about installed H5P libraries.
 */
class InstalledLibrary {
    machineName;
    majorVersion;
    minorVersion;
    patchVersion;
    restricted;
    constructor(machineName, majorVersion, minorVersion, patchVersion, restricted = false, optionalProperties) {
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
    author;
    coreApi;
    description;
    dropLibraryCss;
    dynamicDependencies;
    editorDependencies;
    embedTypes;
    fullscreen;
    h;
    license;
    metadataSettings;
    preloadedCss;
    preloadedDependencies;
    preloadedJs;
    runnable;
    title;
    w;
    static fromMetadata(metadata) {
        return new InstalledLibrary(metadata.machineName, metadata.majorVersion, metadata.minorVersion, metadata.patchVersion, metadata.restricted, metadata);
    }
    static fromName(name) {
        return new InstalledLibrary(name.machineName, name.majorVersion, name.minorVersion, undefined, undefined);
    }
    /**
     * Compares libraries by giving precedence to title, then major version,
     * then minor version
     * @param otherLibrary
     */
    compare(otherLibrary) {
        return (this.title.localeCompare(otherLibrary.title) ||
            this.majorVersion - otherLibrary.majorVersion ||
            this.minorVersion - otherLibrary.minorVersion);
    }
    /**
     * Compares libraries by giving precedence to major version, then minor
     * version, then if present patch version.
     * @param otherLibrary
     * @returns a negative value: if this library is older than the other
     * library a positive value: if this library is newer than the other library
     * zero: if both libraries are the same (or if it can't be determined,
     * because the patch version is missing in the other library)
     */
    compareVersions(otherLibrary) {
        return (this.majorVersion - otherLibrary.majorVersion ||
            this.minorVersion - otherLibrary.minorVersion ||
            (otherLibrary.patchVersion !== undefined
                ? this.patchVersion - otherLibrary.patchVersion
                : 0));
    }
}
exports.default = InstalledLibrary;
//# sourceMappingURL=InstalledLibrary.js.map