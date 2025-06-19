import { ILibraryName } from './types';
export default class LibraryName implements ILibraryName {
    machineName: string;
    majorVersion: number;
    minorVersion: number;
    /**
     * Constructs the object and validates the parameters.
     * @throws errors if the validation fails
     */
    constructor(machineName: string, majorVersion: number, minorVersion: number);
    /**
     * Checks if two libraries are identical.
     * @param library1
     * @param library2
     */
    static equal(library1: ILibraryName, library2: ILibraryName): boolean;
    /**
     * Creates a library object from a library name. Also validates the ubername
     * to protect against attempts to manipulate the server by creating library
     * names.
     * @param ubername The library name in a format "H5P.Example-1.0" or
     * "H5P.Example 1.0" (see options)
     * @param restricted true if the library is restricted
     * @param useWhitespace true if the parser should accept names like
     * "H5P.Library 1.0"
     * @param useHyphen true if the parser should accept names like
     * "H5P.Library-1.0"
     * @returns undefined if the name could not be parsed
     */
    static fromUberName(ubername: string, options?: {
        useHyphen?: boolean;
        useWhitespace?: boolean;
    }): ILibraryName;
    /**
     * Returns the ubername for a library (e.g. H5P.ExampleLibrary-1.0).
     * Also validates the ubername to protect against attempts to manipulate the
     * server by creating invalid ubernames.
     */
    static toUberName(libraryName: ILibraryName, options?: {
        useHyphen?: boolean;
        useWhitespace?: boolean;
    }): string;
    /**
     * Checks if the library name is valid.
     * @throws errors if the library name is invalid
     */
    static validate(library: ILibraryName): void;
    /**
     * Throws an error if the machine name is not valid.
     * @param machineName
     */
    static validateMachineName(machineName: string): void;
}
