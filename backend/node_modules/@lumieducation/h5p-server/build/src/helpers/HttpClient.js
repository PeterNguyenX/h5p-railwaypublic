"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
// We need to use https-proxy-agent as the default Axios proxy functionality
// doesn't work with https.
const https_proxy_agent_1 = require("https-proxy-agent");
/**
 * Creates an Axios instance that supports corporate HTTPS proxies.
 * The proxy can either be configured in the config's proxy property or by
 * setting the environment variable HTTPS_PROXY.
 * @param config the H5P config object
 * @returns the AxiosInstance
 */
const getClient = (config) => {
    let proxyAgent;
    if (config.proxy) {
        proxyAgent = new https_proxy_agent_1.HttpsProxyAgent(`${config.proxy.protocol === 'https' ? 'https://' : 'http://'}${config.proxy.host}:${config.proxy.port.toString()}`);
    }
    else if (process.env.HTTPS_PROXY) {
        proxyAgent = new https_proxy_agent_1.HttpsProxyAgent(process.env.HTTPS_PROXY);
    }
    return axios_1.default.create({
        proxy: proxyAgent ? false : undefined,
        httpsAgent: proxyAgent
    });
};
exports.default = getClient;
//# sourceMappingURL=HttpClient.js.map