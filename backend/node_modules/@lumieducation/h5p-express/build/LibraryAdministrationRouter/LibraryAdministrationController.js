"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const h5p_server_1 = require("@lumieducation/h5p-server");
class LibraryAdministrationExpressController {
    h5pEditor;
    libraryAdministration;
    constructor(h5pEditor, libraryAdministration) {
        this.h5pEditor = h5pEditor;
        this.libraryAdministration = libraryAdministration;
    }
    /**
     * Deletes a library.
     *
     * Used HTTP status codes:
     * - 204 if successful
     * - 400 if library name is not a valid ubername
     * - 404 if library does not exist
     * - 423 if the library can't be deleted because it is used by content
     */
    deleteLibrary = async (req, res) => {
        await this.libraryAdministration.deleteLibrary(req.params.ubername);
        res.status(204).send();
    };
    /**
     * Returns a list of all installed libraries.
     *
     * Used HTTP status codes:
     * - 200 if successful
     * - 500 if there was an error inside the library
     */
    getLibraries = async (req, res) => {
        const libraries = await this.libraryAdministration.getLibraries();
        res.status(200).json(libraries);
    };
    /**
     * Returns detailed information about a library.
     *
     * Used HTTP status codes:
     * - 200 if successful
     * - 400 if library name is not a valid ubername
     * - 404 if the library was not found
     * - 500 if there was an internal error
     */
    getLibrary = async (req, res) => {
        const libraryDetails = await this.libraryAdministration.getLibrary(req.params.ubername);
        res.status(200).json(libraryDetails);
    };
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
    patchLibrary = async (req, res) => {
        await this.libraryAdministration.restrictLibrary(req.params.ubername, req.body.restricted);
        res.status(204).send();
    };
    /**
     * Uploads H5P packages and installs the libraries inside it. Ignores
     * content in the package.
     *
     * Used HTTP status codes:
     * - 200 if successful
     * - 400 if there was a validation error in the package
     * - 500 if there was an internal error
     */
    postLibraries = async (req, res) => {
        if (!req.files?.file?.data && !req.files?.file?.tempFilePath) {
            throw new h5p_server_1.H5pError('malformed-request', {}, 400);
        }
        const { installedLibraries } = await this.h5pEditor.uploadPackage(req.files.file.tempFilePath || req.files.file.data, undefined, {
            onlyInstallLibraries: true
        });
        res.status(200).json({
            installed: installedLibraries.filter((l) => l.type === 'new')
                .length,
            updated: installedLibraries.filter((l) => l.type === 'patch').length
        });
    };
}
exports.default = LibraryAdministrationExpressController;
//# sourceMappingURL=LibraryAdministrationController.js.map