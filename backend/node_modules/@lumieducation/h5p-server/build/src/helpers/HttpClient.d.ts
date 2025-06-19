import { AxiosInstance } from 'axios';
import { IH5PConfig } from '../types';
/**
 * Creates an Axios instance that supports corporate HTTPS proxies.
 * The proxy can either be configured in the config's proxy property or by
 * setting the environment variable HTTPS_PROXY.
 * @param config the H5P config object
 * @returns the AxiosInstance
 */
declare const getClient: (config: IH5PConfig) => AxiosInstance;
export default getClient;
