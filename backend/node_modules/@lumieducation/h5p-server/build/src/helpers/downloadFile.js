"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadFile = downloadFile;
const fs_1 = __importDefault(require("fs"));
const stream = __importStar(require("stream"));
const util_1 = require("util");
const H5pError_1 = __importDefault(require("./H5pError"));
const HttpClient_1 = __importDefault(require("./HttpClient"));
const finished = (0, util_1.promisify)(stream.finished);
/**
 * Downloads a file to the local filesystem. Throws H5pError that contain the
 * HTTP status code of the outgoing request if something went wrong.
 * @param fileUrl
 * @param outputLocationPath
 * @returns
 */
async function downloadFile(fileUrl, outputLocationPath, config) {
    const writer = fs_1.default.createWriteStream(outputLocationPath);
    const client = (0, HttpClient_1.default)(config);
    return client({
        method: 'get',
        url: fileUrl,
        responseType: 'stream'
    })
        .then(async (response) => {
        response.data.pipe(writer);
        return finished(writer);
    })
        .catch((reason) => {
        if (reason.isAxiosError) {
            throw new H5pError_1.default('content-hub-download-error-with-message', { message: reason.message }, Number.parseInt(reason.code, 10));
        }
        throw new H5pError_1.default('content-hub-download-error');
    });
}
//# sourceMappingURL=downloadFile.js.map