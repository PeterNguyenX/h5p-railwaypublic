import { ILibraryName, ILibraryStorage } from './types';
/**
 * Gets the libraries required to run a specific library.
 * Uses LibraryManager to get metadata for libraries.
 */
export default class DependencyGetter {
    private libraryStorage;
    constructor(libraryStorage: ILibraryStorage);
    /**
     * Gets all dependent libraries of the libraries in the list.
     * @param libraries the libraries whose dependencies should be retrieved
     * @param dynamic include dependencies that are part of the dynamicDependencies property or used in the content
     * @param editor include dependencies that are listed in editorDependencies
     * @param preloaded include regular dependencies that are included in preloadedDependencies
     * @param doNotAdd libraries in this list will not be added to the dependency list
     * @returns a list of libraries
     */
    getDependentLibraries(libraries: ILibraryName[], { dynamic, editor, preloaded }: {
        dynamic?: boolean;
        editor?: boolean;
        preloaded?: boolean;
    }, doNotAdd?: ILibraryName[]): Promise<ILibraryName[]>;
    /**
     * Recursively walks through all dependencies of a library and adds them to the set libraries.
     * @param library the library that is currently being processed
     * @param libraries the set to add to
     * @returns the set that was added to (same as libraries; can be used to chain the call)
     */
    private addDependenciesRecursive;
    /**
     * Adds all dependencies in the list to the set.
     */
    private addDependenciesToSet;
}
