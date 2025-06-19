import { ILibraryName } from '../types';
/**
 * Checks if the metadata contains any dependencies on the given library.
 * @param metadata
 * @param library
 */
export declare function hasDependencyOn(metadata: {
    dynamicDependencies?: ILibraryName[];
    editorDependencies?: ILibraryName[];
    preloadedDependencies?: ILibraryName[];
}, library: ILibraryName): boolean;
