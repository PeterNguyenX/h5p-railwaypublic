import { ILibraryName } from '../types';
/**
 * Collects lists of files grouped by libraries.
 */
export default class LibrariesFilesList {
    private usedFiles;
    /**
     * Adds a library file to the list.
     * @param library
     * @param filename
     */
    addFile(library: ILibraryName, filename: string): void;
    /**
     * Checks if a library file is in the list
     * @param library
     * @param filename
     */
    checkFile(library: ILibraryName, filename: string): boolean;
    /**
     * Clears the list of all libraries.
     */
    clear(): void;
}
