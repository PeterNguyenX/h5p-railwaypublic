import { Readable } from 'stream';
/**
 * Returns the contents of a stream as a string
 * @param stream the stream to read
 * @returns
 */
export declare function streamToString(stream: Readable, encoding?: BufferEncoding): Promise<string>;
