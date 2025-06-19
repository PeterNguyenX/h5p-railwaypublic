/// <reference types="node" />
import * as express from 'express';
import { IInstalledLibrary, ILibraryAdministrationOverviewItem } from '../../types';
import H5PEditor from '../../H5PEditor';
import LibraryAdministration from '../../LibraryAdministration';
export default class LibraryAdministrationExpressController {
    protected h5pEditor: H5PEditor;
    protected libraryAdministration: LibraryAdministration;
    constructor(h5pEditor: H5PEditor, libraryAdministration: LibraryAdministration);
    /**
     * Deletes a library.
     *
     * Used HTTP status codes:
     * - 204 if successful
     * - 400 if library name is not a valid ubername
     * - 404 if library does not exist
     * - 423 if the library can't be deleted because it is used by content
     */
    deleteLibrary: (req: express.Request<{
        ubername: string;
    }>, res: express.Response) => Promise<void>;
    /**
     * Returns a list of all installed libraries.
     *
     * Used HTTP status codes:
     * - 200 if successful
     * - 500 if there was an error inside the library
     */
    getLibraries: (req: express.Request, res: express.Response<ILibraryAdministrationOverviewItem[]>) => Promise<void>;
    /**
     * Returns detailed information about a library.
     *
     * Used HTTP status codes:
     * - 200 if successful
     * - 400 if library name is not a valid ubername
     * - 404 if the library was not found
     * - 500 if there was an internal error
     */
    getLibrary: (req: express.Request<{
        ubername: string;
    }>, res: express.Response<IInstalledLibrary & {
        dependentsCount: number;
        instancesAsDependencyCount: number;
        instancesCount: number;
        isAddon: boolean;
    }>) => Promise<void>;
    /**
     * Changes the status of a library. Can currently only be used to set
     * libraries to restricted or back.
     *
     * Used HTTP status codes:
     * - 204 if successful
     * - 400 if library name is not a valid ubername
     * - 404 if the library was not found
     * - 500 if there was an internal error
     */
    patchLibrary: (req: express.Request<{
        ubername: string;
    }, any, {
        restricted: boolean;
    }>, res: express.Response) => Promise<void>;
    /**
     * Uploads H5P packages and installs the libraries inside it. Ignores
     * content in the package.
     *
     * Used HTTP status codes:
     * - 200 if successful
     * - 400 if there was a validation error in the package
     * - 500 if there was an internal error
     */
    postLibraries: (req: express.Request & {
        files: {
            file: {
                data: Buffer;
                mimetype: string;
                name: string;
                size: number;
            };
        };
    }, res: express.Response<{
        installed: number;
        updated: number;
    }>) => Promise<void>;
}
