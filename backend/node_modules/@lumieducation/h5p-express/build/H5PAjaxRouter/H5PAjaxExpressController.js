"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const h5p_server_1 = require("@lumieducation/h5p-server");
/**
 * This class is part of the Express adapter for the H5PAjaxEndpoint class and
 * maps Express specific properties and methods to the generic H5PAjaxEndpoint
 * methods.
 */
class H5PAjaxExpressController {
    h5pEditor;
    constructor(h5pEditor) {
        this.h5pEditor = h5pEditor;
        this.ajaxEndpoint = new h5p_server_1.H5PAjaxEndpoint(h5pEditor);
    }
    ajaxEndpoint;
    /**
     * GET /ajax
     * Get various things through the Ajax endpoint.
     */
    getAjax = async (req, res) => {
        const result = await this.ajaxEndpoint.getAjax(req.query.action, req.query.machineName, req.query.majorVersion, req.query.minorVersion, req.query.language ?? req.language, req.user);
        res.status(200).send(result);
    };
    /**
     * GET /content/<contentId>/<filename>
     */
    getContentFile = async (req, res) => {
        const { mimetype, stream, stats, range } = await this.ajaxEndpoint.getContentFile(req.params.id, req.params.file, req.user, this.getRange(req));
        if (range) {
            this.pipeStreamToPartialResponse(req.params.file, stream, res, stats.size, range.start, range.end);
        }
        else {
            this.pipeStreamToResponse(mimetype, stream, res, stats.size);
        }
    };
    /**
     * GET /params/<contentId>
     */
    getContentParameters = async (req, res) => {
        const result = await this.ajaxEndpoint.getContentParameters(req.params.contentId, req.user);
        res.status(200).json(result);
    };
    /**
     * GET /download/<contentId>
     */
    getDownload = async (req, res) => {
        // set filename for the package with .h5p extension
        res.setHeader('Content-disposition', `attachment; filename=${req.params.contentId}.h5p`);
        await this.ajaxEndpoint.getDownload(req.params.contentId, req.user, res);
    };
    /**
     * GET /libraries/<uberName>/<file>
     */
    getLibraryFile = async (req, res) => {
        const { mimetype, stream, stats } = await this.ajaxEndpoint.getLibraryFile(req.params.uberName, req.params.file);
        this.pipeStreamToResponse(mimetype, stream, res, stats.size, {
            'Cache-Control': 'public, max-age=31536000'
        });
    };
    /**
     * GET /temp-files/<file>
     */
    getTemporaryContentFile = async (req, res) => {
        const { mimetype, stream, stats, range } = await this.ajaxEndpoint.getTemporaryFile(req.params.file, req.user, this.getRange(req));
        if (range) {
            this.pipeStreamToPartialResponse(req.params.file, stream, res, stats.size, range.start, range.end);
        }
        else {
            this.pipeStreamToResponse(mimetype, stream, res, stats.size);
        }
    };
    /**
     * POST /ajax
     * Post various things through the Ajax endpoint
     * Don't be confused by the fact that many of the requests dealt with here are not
     * really POST requests, but look more like GET requests. This is simply how the H5P
     * client works and we can't change it.
     */
    postAjax = async (req, res) => {
        const result = await this.ajaxEndpoint.postAjax(req.query.action, req.body, req.query.language ?? req.language, req.user, req.files?.file, req.query.id, req.t, req.files?.h5p, req.query.hubId);
        res.status(200).send(result);
    };
    /**
     * Retrieves a range that was specified in the HTTP request headers. Returns
     * undefined if no range was specified.
     */
    getRange = (req) => (fileSize) => {
        const range = req.range(fileSize);
        if (range) {
            if (range === -2) {
                throw new h5p_server_1.H5pError('malformed-request', {}, 400);
            }
            if (range === -1) {
                throw new h5p_server_1.H5pError('unsatisfiable-range', {}, 416);
            }
            if (range.length > 1) {
                throw new h5p_server_1.H5pError('multipart-ranges-unsupported', {}, 400);
            }
            return range[0];
        }
        return undefined;
    };
    /**
     * Pipes the contents of the file to the request object and sets the
     * 206 status code and all necessary headers.
     * @param mimetype the mimetype of the file
     * @param readStream a readable stream of the file (at the start position)
     * @param response the Express response object (a writable stream)
     * @param totalLength the total file size of the file
     * @param start the start of the range
     * @param end the end of the range
     */
    pipeStreamToPartialResponse = (mimetype, readStream, response, totalLength, start, end) => {
        response.writeHead(206, {
            'Content-Type': mimetype,
            'Content-Length': end - start + 1,
            'Content-Range': `bytes ${start}-${end}/${totalLength}`
        });
        readStream.on('error', (err) => {
            response.status(404).end();
        });
        readStream.pipe(response);
    };
    /**
     * Pipes the contents of the file to the request object and sets the
     * 200 status code and all necessary headers to indicate support for ranges.
     * @param mimetype the mimetype of the file
     * @param readStream a readable stream of the file (at the start position)
     * @param response the Express response object (a writable stream)
     * @param contentLength the total file size of the file
     */
    pipeStreamToResponse = (mimetype, readStream, response, contentLength, additionalHeaders) => {
        response.writeHead(200, {
            ...(additionalHeaders || {}),
            'Content-Type': mimetype,
            'Content-Length': contentLength,
            'Accept-Ranges': 'bytes'
        });
        readStream.on('error', (err) => {
            response.status(404).end();
        });
        readStream.pipe(response);
    };
}
exports.default = H5PAjaxExpressController;
//# sourceMappingURL=H5PAjaxExpressController.js.map