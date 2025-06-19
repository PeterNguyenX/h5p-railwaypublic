"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mime_types_1 = require("mime-types");
const H5pError_1 = __importDefault(require("./helpers/H5pError"));
const AjaxSuccessResponse_1 = __importDefault(require("./helpers/AjaxSuccessResponse"));
const LibraryName_1 = __importDefault(require("./LibraryName"));
const SemanticsEnforcer_1 = __importDefault(require("./SemanticsEnforcer"));
/**
 * Each method in this class corresponds to a route that is called by the H5P
 * client. Normally, the implementation must call them and send back the
 * return values as a JSON body in the HTTP response.
 *
 * If something goes wrong, the methods throw H5pErrors, which include HTTP
 * status codes. Send back these status codes in your HTTP response.
 *
 * Remarks:
 * - Most of the route names can be configured in the IH5PConfig object and thus
 *   might have different names in your case!
 * - The GET /content/<contentId>/<file> and GET /temp-files/<file> routes
 *   should support partials for the Interactive Video editor to work. This
 *   means that the response with HTTP 200 must send back the header
 *   'Accept-Ranges: bytes' and must send back status code 206 for partials.
 *   Check out the documentation of the methods `getContentFile` and
 *   `getTemporaryFile` for more details.
 */
class H5PAjaxEndpoint {
    h5pEditor;
    constructor(h5pEditor) {
        this.h5pEditor = h5pEditor;
        this.semanticsEnforcer = new SemanticsEnforcer_1.default(h5pEditor.libraryManager);
    }
    semanticsEnforcer;
    /**
     * This method must be called by the GET route at the Ajax URL, e.g. GET
     * /ajax. This route must be implemented for editor to work.
     * @param action This is the sub action that should be executed. It is part
     * of the query like this: GET /ajax?action=xyz Possible values:
     *   - content-type-cache: Requests information about available content
     *     types from the server. The user parameter must be set, as the
     *     accessible content types and possible actions (update, etc.) can vary
     *     from user to user
     *   - content-hub-metadata-cache: Requests information about the metadata
     *     currently in use by the H5P Content Hub.
     *   - libraries: Requests detailed data about a single library. The
     *     parameters machineName, majorVersion, minorVersion and language must
     *     be set in this case. Queries look like this: GET
     *     /ajax?action=libraries?machineName=<machine_name>&majorVersion=<major_version>&minorVersion=<minor_version>
     * @param machineName (need if action == 'libraries') The machine name of
     * the library about which information is requested, e.g. 'H5P.Example'. It
     * is part of the query, e.g. +machineName=H5P.Example
     * @param majorVersion (need if action == 'libraries') The major version of
     * the library about which information is requested, e.g. '1'.
     * @param minorVersion (need if action == 'libraries') The minor version of
     * the library about which information is requested, e.g. '0'.
     * @param language (can be set if action == 'libraries') The language in
     * which the editor is currently displayed, e.g. 'en'. Will default to
     * English if unset.
     * @param user (needed if action == 'content-type-cache') The user who is
     * displaying the H5P Content Type Hub. It is the job of the implementation
     * to inject this object.
     * @returns an object which must be sent back in the response as JSON with
     * HTTP status code 200
     * @throws H5pErrors with HTTP status codes, which you must catch and then
     * send back in the response
     */
    getAjax = async (action, machineName, majorVersion, minorVersion, language, user) => {
        switch (action) {
            case 'content-type-cache':
                if (!user) {
                    throw new Error('You must specify a user when calling getAjax(...).');
                }
                return this.h5pEditor.getContentTypeCache(user, language);
            case 'content-hub-metadata-cache':
                return new AjaxSuccessResponse_1.default(await this.h5pEditor.contentHub.getMetadata(language));
            case 'libraries':
                if (machineName === undefined ||
                    majorVersion === undefined ||
                    minorVersion === undefined) {
                    throw new H5pError_1.default('malformed-request', {
                        error: 'You must specify a machineName, majorVersion and minorVersion.'
                    }, 400);
                }
                // getLibraryData validates the library name and language code,
                // so we don't do it here.
                return this.h5pEditor.getLibraryData(machineName.toString(), majorVersion.toString(), minorVersion.toString(), language?.toString());
            default:
                throw new H5pError_1.default('malformed-request', {
                    error: "The only allowed actions at the GET Ajax endpoint are 'content-type-cache' and 'libraries'."
                }, 400);
        }
    };
    /**
     * The method must be called by the GET /content/<contentId>/<filename>
     * route.
     * As it is necessary for the method to know about a possible range start
     * and end, you need to pass in a callback function that returns the range
     * specified in the http request. The start and end of the range cannot be
     * passed to this method directly, as you need to know the file size to
     * calculate the correct range. That's why we use the callback.
     *
     * Note: You can also use a status route to serve content files, but then
     * you lose the rights and permission check.
     *
     * @param contentId the contentId of the resource
     * @param filename the filename of the resource
     * @param user the user who is requesting the resource
     * @param getRangeCallback a function that can be called to retrieve the
     * start and end of a range; if the request doesn't specify a range, simply
     * return undefined; if you do not specify getRangeCallback, the method
     * will simply always use the whole file.
     * @returns mimetype: the mimetype of the file, the range (undefined if
     * unused), stats about the file and a readable. Do this with the response:
     * - Pipe back the readable as the response with status code 200.
     * - Set this HTTP header in the response: "Content-Type: <mimetype>"
     * - If range is undefined:
     *    - Return status code 200
     *    - Set this HTTP header in the response: 'Accept-Ranges: bytes'
     * - If range is defined:
     *    - Return status code 206
     *    - Set these HTTP headers in the response: 'Content-Length: <end - start + 1>'
     *                                              'Content-Range': `bytes <start-end>/<totalLength>`
     * **IMPORTANT:** You must subscribe to the error event of the readable and
     * send back a 404 status code if an error occurs. This is necessary as the
     * AWS S3 library doesn't throw proper 404 errors.
     * @throws H5pErrors with HTTP status codes, which you must catch and then
     * send back in the response
     */
    getContentFile = async (contentId, filename, user, getRangeCallback) => {
        if (!user) {
            throw new Error('You must specify a user when calling getContentFile(...).');
        }
        if (!contentId) {
            throw new Error('You must specify a contentId when calling getContentFile(...)');
        }
        if (!filename) {
            throw new Error('You must specify a contentId when calling getContentFile(...)');
        }
        // getFileStats validates filenames itself, so we don't do it here.
        const stats = await this.h5pEditor.contentManager.getContentFileStats(contentId, filename, user);
        const range = getRangeCallback
            ? getRangeCallback(stats.size)
            : undefined;
        // getContentFileStream validates filenames itself, so we don't do it here.
        const stream = await this.h5pEditor.getContentFileStream(contentId, filename, user, range?.start, range?.end);
        const mimetype = (0, mime_types_1.lookup)(filename) || 'application/octet-stream';
        return { mimetype, range, stats, stream };
    };
    /**
     * This method must be called when the editor requests the parameters
     * (= content.json) of a piece of content, which is done with
     * GET /params/<contentId>
     * This route must be implemented for the editor to work.
     * @param contentId the content id of the piece of content; it is part of
     * the requests URL (see above)
     * @param user the user who is using the editor. It is the job of the
     * implementation to inject this object.
     * @returns an object which must be sent back in the response as JSON with
     * HTTP status code 200
     * @throws H5pErrors with HTTP status codes, which you must catch and then
     * send back in the response
     */
    getContentParameters = async (contentId, user) => {
        if (!user) {
            throw new Error('You must specify a user when calling getContentParameters(...).');
        }
        if (!contentId) {
            throw new Error('You must specify a contentId when calling getContentParameters(...)');
        }
        return this.h5pEditor.getContent(contentId, user);
    };
    /**
     * This method must be called when the user downloads a H5P package (the
     * .h5p file containing all libraries and content files). The route is
     * GET /download/<contentId>
     * @param contentId the id of the content object. It is part of the request
     * URL (see above).
     * @param user the user who wants to download the package. It is the job of
     * the implementation to inject this object.
     * @param outputWritable a Writable to which the file contents are piped.
     * @returns no return value; the result is directly piped to the Writable,
     * which is the Response object in Express, for instance. Note that you must
     * set the HTTP Header 'Content-disposition: attachment; filename=xyz.h5p'
     * in your response!
     * @throws H5pErrors with HTTP status codes, which you must catch and then
     * send back in the response
     */
    getDownload = async (contentId, user, outputWritable) => {
        if (!user) {
            throw new Error('You must specify a user when calling getDownload(...).');
        }
        if (!contentId) {
            throw new Error('You must specify a contentId when calling getDownload(...)');
        }
        return this.h5pEditor.exportContent(contentId, outputWritable, user);
    };
    /**
     * This method must be called when the client requests a library file with
     * GET /libraries/<uberName>/<filename>.
     *
     * Note: You can also use a static route to serve library files.
     *
     * @param ubername the ubername of the library (e.g. H5P.Example-1.0). This
     * is the first component of the path after /libraries/
     * @param filename the filename of the requested file, e.g. xyz.js. This is the
     * rest of the path after the uberName.
     * @returns all the values that must be send back with HTTP status code 200.
     * You should send back:
     *   - status code 200
     *   - the mimetype
     *   - the file size (in stats)
     * @throws H5pErrors with HTTP status codes, which you must catch and then
     * send back in the response
     */
    getLibraryFile = async (ubername, filename) => {
        if (!filename) {
            throw new Error('You must pass a file to getLibraryFile(...).');
        }
        const library = LibraryName_1.default.fromUberName(ubername);
        // Filenames are validated in the storage classes, so we don't validate
        // them here.
        const [stats, stream] = await Promise.all([
            this.h5pEditor.libraryManager.getFileStats(library, filename),
            this.h5pEditor.getLibraryFileStream(library, filename)
        ]);
        const mimetype = (0, mime_types_1.lookup)(filename) || 'application/octet-stream';
        return { mimetype, stream, stats };
    };
    /**
     * The method must be called by the GET /temp-files/<filename> route.
     * As it is necessary for the method to know about a possible range start
     * and end, you need to pass in a callback function that returns the range
     * specified in the http request. The start and end of the range cannot be
     * passed to this method directly, as you need to know the file size to
     * calculate the correct range. That's why we use the callback.
     * @param filename the filename of the resource
     * @param user the user who is requesting the resource
     * @param getRangeCallback a function that can be called to retrieve the
     * start and end of a range; if the request doesn't specify a range, simply
     * return undefined; if you do not specify getRangeCallback, the method
     * will simply always use the whole file.
     * @returns mimetype: the mimetype of the file, the range (undefined if
     * unused), stats about the file and a readable. Do this with the response:
     * - Pipe back the readable as the response with status code 200.
     * - Set this HTTP header in the response: "Content-Type: <mimetype>"
     * - If range is undefined:
     *    - Return status code 200
     *    - Set this HTTP header in the response: 'Accept-Ranges': 'bytes'
     * - If range is defined:
     *    - Return status code 206
     *    - Set these HTTP headers in the response: 'Content-Length: <end - start + 1>'
     *                                              'Content-Range': `bytes <start-end>/<totalLength>`
     * **IMPORTANT:** You must subscribe to the error event of the readable and
     * send back a 404 status code if an error occurs. This is necessary as the
     * AWS S3 library doesn't throw proper 404 errors.
     * @throws H5pErrors with HTTP status codes, which you must catch and then
     * send back in the response
     */
    getTemporaryFile = async (filename, user, getRangeCallback) => {
        if (!user) {
            throw new Error('You must specify a user when calling getTemporaryFile(...).');
        }
        if (!filename) {
            throw new Error('You must specify a filename when calling getContentParameters(...)');
        }
        // Filenames are validated in the storage classes, so we don't validate
        // them here.
        const stats = await this.h5pEditor.temporaryFileManager.getFileStats(filename, user);
        const range = getRangeCallback
            ? getRangeCallback(stats.size)
            : undefined;
        const readable = await this.h5pEditor.getContentFileStream(undefined, filename, user, range?.start, range?.end);
        const mimetype = (0, mime_types_1.lookup)(filename) || 'application/octet-stream';
        return { mimetype, range, stats, stream: readable };
    };
    /**
     * Implements the POST /ajax route. Performs various actions. Don't be
     * confused by the fact that many of the requests dealt with here are not
     * really POST requests, but look more like GET requests. This is simply how
     * the H5P client works and we can't change it.
     * @param action This is the sub action that should be executed. It is part
     * of the query like this: POST /ajax?action=xyz Possible values:
     *   - libraries:       returns basic information about a list of libraries
     *   - translations:    returns translation data about a list of libraries
     *                      in a specific language
     *   - files:           uploads a resource file (image, video, ...) into
     *                      temporary storage
     *   - filter:          cleans the parameters passed to it to avoid XSS
     *                      attacks and schema violations (currently only
     *                      implemented as a stub)
     *   - library-install: downloads an installs content types from the H5P Hub
     *   - library-upload:  uploads a h5p package from the user's computer and
     *                      installs the libraries in it; returns the parameters
     *                      and metadata in it
     * @param body the parsed JSON content of the request body
     * @param language (needed for 'translations' and optionally possible for
     * 'libraries') the language code for which the translations should be
     * retrieved, e.g. 'en'. This paramter is part of the query URL, e.g. POST
     * /ajax?action=translations&language=en
     * @param user (needed for 'files', 'library-install' and 'get-content') the
     * user who is performing the action. It is the job of the implementation to
     * inject this object.
     * @param filesFile (needed for 'files') the file uploaded to the server;
     * this file is part of the HTTP request and has the name 'file'.
     * @param id (needed for 'library-install') the machine name of the library
     * to  install. The id is part of the query URL, e.g. POST
     * /ajax?action=library-install&id=H5P.Example
     * @param translate (needed for 'library-install' and 'library-upload') a
     * translation function used to localize messages
     * @param filesFile (needed for 'library-upload') the file uploaded to the
     * server; this file is part of the HTTP request and has the name 'h5p'.
     * @param hubId (need for 'get-content') the id of a content object on the
     * H5P Content Hub
     * @returns an object which must be sent back in the response as JSON with
     * HTTP status code 200
     * @throws H5pErrors with HTTP status codes, which you must catch and then
     * send back in the response
     */
    postAjax = async (action, body, language, user, filesFile, id, translate, libraryUploadFile, hubId) => {
        let updatedLibCount;
        let installedLibCount;
        const getLibraryResultText = (installed, updated) => `${installed
            ? translate
                ? translate('installed-libraries', { count: installed })
                : `Installed ${installed} libraries.`
            : ''} ${updated
            ? translate
                ? translate('updated-libraries', { count: updated })
                : `Updated ${updated} libraries.`
            : ''}`.trim();
        switch (action) {
            case 'libraries':
                if (!('libraries' in body) || !Array.isArray(body.libraries)) {
                    throw new H5pError_1.default('malformed-request', {
                        error: 'the body of the request must contain an array of strings'
                    }, 400);
                }
                // getLibraryOverview validates the library list, so we don't do
                // it here.
                return this.h5pEditor.getLibraryOverview(body.libraries, language);
            case 'translations':
                if (!('libraries' in body) || !Array.isArray(body.libraries)) {
                    throw new H5pError_1.default('malformed-request', {
                        error: 'the body of the request must contain an array of strings'
                    }, 400);
                }
                // listLibraryLanguageFiles validates the parameters, so we
                // don't do it here.
                return new AjaxSuccessResponse_1.default(await this.h5pEditor.listLibraryLanguageFiles(body.libraries, language));
            case 'files': {
                if (!('field' in body)) {
                    throw new H5pError_1.default('malformed-request', {
                        error: "'field' property is missing in request body"
                    }, 400);
                }
                let field;
                try {
                    field = JSON.parse(body.field);
                }
                catch (e) {
                    throw new H5pError_1.default('malformed-request', {
                        error: "'field' property is malformed (must be in JSON)"
                    }, 400);
                }
                // saveContentFile only uses save properties of field, so we
                // don't need to validate it here.
                return this.h5pEditor.saveContentFile(undefined, field, filesFile, user);
            }
            case 'filter': {
                if (!('libraryParameters' in body)) {
                    throw new H5pError_1.default('malformed-request', {
                        error: 'libraryParameters is missing in request body'
                    }, 400);
                }
                let unfiltered;
                try {
                    unfiltered = JSON.parse(body.libraryParameters);
                }
                catch {
                    throw new H5pError_1.default('malformed-request', {
                        error: "'libraryParameters' property is malformed (must be in JSON)"
                    }, 400);
                }
                if (!unfiltered?.library ||
                    !unfiltered?.params ||
                    !unfiltered?.metadata) {
                    throw new H5pError_1.default('malformed-request', { error: 'Property missing in libraryParameters' }, 400);
                }
                const filteredParams = unfiltered.params;
                const filteredLibraryName = LibraryName_1.default.fromUberName(unfiltered.library, { useWhitespace: true });
                await this.semanticsEnforcer.enforceSemanticStructure(filteredParams, filteredLibraryName);
                // TODO: filter metadata, too
                return new AjaxSuccessResponse_1.default({
                    library: LibraryName_1.default.toUberName(filteredLibraryName, {
                        useWhitespace: true
                    }),
                    metadata: unfiltered.metadata,
                    params: filteredParams
                });
            }
            case 'library-install': {
                if (!id || !user) {
                    throw new H5pError_1.default('malformed-request', {
                        error: 'Request parameters incorrect: You need an id and a user.'
                    }, 400);
                }
                // installLibraryFrom hub validates the id, so we don't do it
                // here.
                const installedLibs = await this.h5pEditor.installLibraryFromHub(id, user);
                updatedLibCount = installedLibs.filter((l) => l.type === 'patch').length;
                installedLibCount = installedLibs.filter((l) => l.type === 'new').length;
                const contentTypeCache = await this.h5pEditor.getContentTypeCache(user, language);
                return new AjaxSuccessResponse_1.default(contentTypeCache, installedLibCount + updatedLibCount > 0
                    ? getLibraryResultText(installedLibCount, updatedLibCount)
                    : undefined);
            }
            case 'library-upload': {
                if (!libraryUploadFile.name.endsWith('.h5p')) {
                    throw new H5pError_1.default('missing-h5p-extension', {}, 400);
                }
                const { installedLibraries, metadata, parameters } = await this.h5pEditor.uploadPackage(libraryUploadFile.data?.length > 0
                    ? libraryUploadFile.data
                    : libraryUploadFile.tempFilePath, user);
                updatedLibCount = installedLibraries.filter((l) => l.type === 'patch').length;
                installedLibCount = installedLibraries.filter((l) => l.type === 'new').length;
                const contentTypes = await this.h5pEditor.getContentTypeCache(user, language);
                return new AjaxSuccessResponse_1.default({
                    content: parameters,
                    contentTypes,
                    h5p: metadata
                }, installedLibCount + updatedLibCount > 0
                    ? getLibraryResultText(installedLibCount, updatedLibCount)
                    : undefined);
            }
            case 'get-content': {
                const { installedLibraries: installedLibraries2, metadata: metadata2, parameters: parameters2 } = await this.h5pEditor.getContentHubContent(hubId, user);
                updatedLibCount = installedLibraries2.filter((l) => l.type === 'patch').length;
                installedLibCount = installedLibraries2.filter((l) => l.type === 'new').length;
                const contentTypes2 = await this.h5pEditor.getContentTypeCache(user, language);
                return new AjaxSuccessResponse_1.default({
                    content: parameters2,
                    contentTypes: contentTypes2,
                    h5p: metadata2
                }, installedLibCount + updatedLibCount > 0
                    ? getLibraryResultText(installedLibCount, updatedLibCount)
                    : undefined);
            }
            default:
                throw new H5pError_1.default('malformed-request', {
                    error: 'This action is not implemented in h5p-nodejs-library.'
                }, 500);
        }
    };
}
exports.default = H5PAjaxEndpoint;
//# sourceMappingURL=H5PAjaxEndpoint.js.map