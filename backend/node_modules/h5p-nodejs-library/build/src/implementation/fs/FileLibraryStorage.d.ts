/// <reference types="node" />
import { ReadStream } from 'fs-extra';
import { Stream } from 'stream';
import { IInstalledLibrary, ILibraryMetadata, ILibraryName, ILibraryStorage } from '../../../src';
import { IFileStats, IAdditionalLibraryMetadata } from '../../types';
/**
 * Stores libraries in a directory.
 */
export default class FileLibraryStorage implements ILibraryStorage {
    protected librariesDirectory: string;
    /**
     * Gets the directory path of the specified library.
     * @param library
     * @returns the absolute path to the directory
     */
    protected getDirectoryPath(library: ILibraryName): string;
    /**
     * Gets the path of any file of the specified library.
     * @param library
     * @param filename
     * @returns the absolute path to the file
     */
    protected getFilePath(library: ILibraryName, filename: string): string;
    /**
     * Get the base path of the libraries
     * @returns the base library path
     */
    protected getLibrariesDirectory(): string;
    /**
     * Files with this pattern are not returned when listing the directory contents. Can be used by classes
     * extending FileLibraryStorage to hide internals.
     */
    protected ignoredFilePatterns: RegExp[];
    /**
     * @param librariesDirectory The path of the directory in the file system at which libraries are stored.
     */
    constructor(librariesDirectory: string);
    /**
     * Adds a library file to a library. The library metadata must have been installed with installLibrary(...) first.
     * Throws an error if something unexpected happens.
     * @param library The library that is being installed
     * @param filename Filename of the file to add, relative to the library root
     * @param stream The stream containing the file content
     * @returns true if successful
     */
    addFile(library: ILibraryName, filename: string, stream: Stream): Promise<boolean>;
    /**
     * Adds the metadata of the library to the repository.
     * Throws errors if something goes wrong.
     * @param libraryMetadata The library metadata object (= content of library.json)
     * @param restricted True if the library can only be used be users allowed to install restricted libraries.
     * @returns The newly created library object to use when adding library files with addFile(...)
     */
    addLibrary(libraryMetadata: ILibraryMetadata, restricted?: boolean): Promise<IInstalledLibrary>;
    /**
     * Removes all files of a library. Doesn't delete the library metadata. (Used when updating libraries.)
     * @param library the library whose files should be deleted
     * @returns
     */
    clearFiles(library: ILibraryName): Promise<void>;
    /**
     * Removes the library and all its files from the repository.
     * Throws errors if something went wrong.
     * @param library The library to remove.
     * @returns
     */
    deleteLibrary(library: ILibraryName): Promise<void>;
    /**
     * Check if the library contains a file
     * @param library The library to check
     * @param filename
     * @returns true if file exists in library, false otherwise
     */
    fileExists(library: ILibraryName, filename: string): Promise<boolean>;
    /**
     * Counts how often libraries are listed in the dependencies of other
     * libraries and returns a list of the number.
     * @returns an object with ubernames as key.
     * Example:
     * {
     *   'H5P.Example': 10
     * }
     * This means that H5P.Example is used by 10 other libraries.
     */
    getAllDependentsCount(): Promise<{
        [ubername: string]: number;
    }>;
    /**
     * Returns the number of libraries that depend on this (single) library.
     * @param library the library to check
     * @returns the number of libraries that depend on this library.
     */
    getDependentsCount(library: ILibraryName): Promise<number>;
    /**
     * Returns a information about a library file.
     * Throws an exception if the file does not exist.
     * @param library library
     * @param filename the relative path inside the library
     * @returns the file stats
     */
    getFileStats(library: ILibraryName, filename: string): Promise<IFileStats>;
    /**
     * Returns a readable stream of a library file's contents.
     * Throws an exception if the file does not exist.
     * @param library library
     * @param filename the relative path inside the library
     * @returns a readable stream of the file's contents
     */
    getFileStream(library: ILibraryName, filename: string): Promise<ReadStream>;
    /**
     * Returns all installed libraries or the installed libraries that have the machine names in the arguments.
     * @param {...string[]} machineNames (optional) only return libraries that have these machine names
     * @returns the libraries installed
     */
    getInstalledLibraryNames(...machineNames: string[]): Promise<ILibraryName[]>;
    /**
     * Gets a list of installed language files for the library.
     * @param library The library to get the languages for
     * @returns The list of JSON files in the language folder (without the extension .json)
     */
    getLanguages(library: ILibraryName): Promise<string[]>;
    /**
     * Gets the library metadata (= content of library.json) of the library.
     * @param library the library
     * @returns the metadata
     */
    getLibrary(library: ILibraryName): Promise<IInstalledLibrary>;
    /**
     * Checks if a library is installed in the system.
     * @param library the library to check
     * @returns true if installed, false if not
     */
    isInstalled(library: ILibraryName): Promise<boolean>;
    /**
     * Checks if the library has been installed.
     * @param name the library name
     * @returns true if the library has been installed
     */
    libraryExists(name: ILibraryName): Promise<boolean>;
    /**
     * Returns a list of library addons that are installed in the system.
     * Addons are libraries that have the property 'addTo' in their metadata.
     */
    listAddons(): Promise<ILibraryMetadata[]>;
    /**
     * Gets a list of all library files that exist for this library.
     * @param library
     * @returns all files that exist for the library
     */
    listFiles(library: ILibraryName): Promise<string[]>;
    /**
     * Updates the additional metadata properties that is added to the
     * stored libraries. This metadata can be used to customize behavior like
     * restricting libraries to specific users.
     * @param library the library for which the metadata should be updated
     * @param additionalMetadata the metadata to update
     * @returns true if the additionalMetadata object contained real changes
     * and if they were successfully saved; false if there were not changes.
     * Throws an error if saving was not possible.
     */
    updateAdditionalMetadata(library: ILibraryName, additionalMetadata: Partial<IAdditionalLibraryMetadata>): Promise<boolean>;
    /**
     * Updates the library metadata.
     * This is necessary when updating to a new patch version.
     * You also need to call clearFiles(...) to remove all old files
     * during the update process and addFile(...) to add the files of
     * the patch.
     * @param libraryMetadata the new library metadata
     * @returns The updated library object
     */
    updateLibrary(libraryMetadata: ILibraryMetadata): Promise<IInstalledLibrary>;
    /**
     * Checks if a filename is in the ignore list.
     * @param filename the filename to check
     */
    private isIgnored;
}
