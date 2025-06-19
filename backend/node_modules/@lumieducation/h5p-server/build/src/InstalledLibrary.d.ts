import { IInstalledLibrary, ILibraryMetadata, ILibraryName, IPath } from './types';
/**
 * Stores information about installed H5P libraries.
 */
export default class InstalledLibrary implements IInstalledLibrary {
    machineName: string;
    majorVersion: number;
    minorVersion: number;
    patchVersion: number;
    restricted: boolean;
    constructor(machineName: string, majorVersion: number, minorVersion: number, patchVersion: number, restricted?: boolean, optionalProperties?: Partial<IInstalledLibrary>);
    author?: string;
    coreApi?: {
        majorVersion: number;
        minorVersion: number;
    };
    description?: string;
    dropLibraryCss?: {
        machineName: string;
    }[];
    dynamicDependencies?: ILibraryName[];
    editorDependencies?: ILibraryName[];
    embedTypes?: ('iframe' | 'div')[];
    fullscreen?: 0 | 1;
    h?: number;
    license?: string;
    metadataSettings?: {
        disable: 0 | 1;
        disableExtraTitleField: 0 | 1;
    };
    preloadedCss?: IPath[];
    preloadedDependencies?: ILibraryName[];
    preloadedJs?: IPath[];
    runnable: boolean | 0 | 1;
    title: string;
    w?: number;
    static fromMetadata(metadata: ILibraryMetadata & {
        restricted?: boolean;
    }): InstalledLibrary;
    static fromName(name: ILibraryName): InstalledLibrary;
    /**
     * Compares libraries by giving precedence to title, then major version,
     * then minor version
     * @param otherLibrary
     */
    compare(otherLibrary: IInstalledLibrary): number;
    /**
     * Compares libraries by giving precedence to major version, then minor
     * version, then if present patch version.
     * @param otherLibrary
     * @returns a negative value: if this library is older than the other
     * library a positive value: if this library is newer than the other library
     * zero: if both libraries are the same (or if it can't be determined,
     * because the patch version is missing in the other library)
     */
    compareVersions(otherLibrary: ILibraryName & {
        patchVersion?: number;
    }): number;
}
