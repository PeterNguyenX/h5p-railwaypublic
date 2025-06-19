"use strict";
exports.__esModule = true;
exports.streamToString = void 0;
/**
 * Returns the contents of a stream as a string
 * @param stream the stream to read
 * @returns
 */
function streamToString(stream, encoding) {
    if (encoding === void 0) { encoding = 'utf8'; }
    /* from https://stackoverflow.com/questions/10623798/read-contents-of-node-js-stream-into-a-string-variable */
    var chunks = [];
    return new Promise(function (resolve, reject) {
        stream.on('data', function (chunk) { return chunks.push(chunk); });
        stream.on('error', reject);
        stream.on('end', function () {
            return resolve(Buffer.concat(chunks).toString(encoding));
        });
    });
}
exports.streamToString = streamToString;
//# sourceMappingURL=StreamHelpers.js.map