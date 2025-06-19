import { IH5PConfig } from '../types';
/**
 * Downloads a file to the local filesystem. Throws H5pError that contain the
 * HTTP status code of the outgoing request if something went wrong.
 * @param fileUrl
 * @param outputLocationPath
 * @returns
 */
export declare function downloadFile(fileUrl: string, outputLocationPath: string, config: IH5PConfig): Promise<any>;
