import { IContentAuthor, IContentChange, IContentMetadata, ILibraryName } from './types';
/**
 * Content metadata object with defaults for required values and
 * sanitization to make sure it the metadata conforms to the schema.
 */
export declare class ContentMetadata implements IContentMetadata {
    /**
     * Creates an object conforming to the h5p.json schema.
     * @param furtherMetadata these objects will be merged into the newly created object
     */
    constructor(...furtherMetadata: Partial<IContentMetadata>[]);
    author?: string;
    authorComments?: string;
    authors?: IContentAuthor[];
    changes?: IContentChange[];
    contentType?: string;
    dynamicDependencies?: ILibraryName[];
    editorDependencies?: ILibraryName[];
    embedTypes: ('iframe' | 'div')[];
    h?: string;
    language: string;
    license?: string;
    licenseExtras?: string;
    licenseVersion?: string;
    mainLibrary: string;
    metaDescription?: string;
    metaKeywords?: string;
    preloadedDependencies: ILibraryName[];
    source?: string;
    title: string;
    w?: string;
    yearsFrom?: string;
    yearsTo?: string;
    /**
     * Determines the main library and returns the ubername for it (e.g. "H5P.Example 1.0").
     * @param metadata the metadata object (=h5p.json)
     * @returns the ubername with a whitespace as separator
     */
    static toUbername(metadata: IContentMetadata): string;
}
