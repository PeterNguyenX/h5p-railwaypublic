/// <reference types="node" />
import { Stream } from 'stream';
/**
 * Returns the contents of a stream as a string
 * @param stream the stream to read
 * @returns
 */
export declare function streamToString(stream: Stream, encoding?: BufferEncoding): Promise<string>;
