"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var aws_sdk_1 = __importDefault(require("aws-sdk"));
/**
 * Creates an S3 client.
 * @param options (optional) These options will be passed to the S3 client. You
 * can override options through these environment variables:
 * AWS_ACCESS_KEY_ID: string
 * AWS_SECRET_ACCESS_KEY: string
 * AWS_S3_ENDPOINT: string
 * AWS_REGION: string
 * @returns the S3 client
 */
exports["default"] = (function (options) {
    var _a;
    var optionsWithOverrides = (_a = __assign({}, options)) !== null && _a !== void 0 ? _a : {};
    // add overrides to configuration values that are set through environment
    // variables
    if (process.env.AWS_ACCESS_KEY_ID) {
        optionsWithOverrides.accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    }
    if (process.env.AWS_SECRET_ACCESS_KEY) {
        optionsWithOverrides.secretAccessKey =
            process.env.AWS_SECRET_ACCESS_KEY;
    }
    if (process.env.AWS_S3_ENDPOINT) {
        optionsWithOverrides.endpoint = process.env.AWS_S3_ENDPOINT;
    }
    if (process.env.AWS_REGION) {
        optionsWithOverrides.region = process.env.AWS_REGION;
    }
    if (!optionsWithOverrides.accessKeyId) {
        throw new Error('Access key for S3 storage missing. Either set the environment variable AWS_ACCESS_KEY_ID or pass the accessKeyId property through the option object.');
    }
    if (!optionsWithOverrides.secretAccessKey) {
        throw new Error('Secret access key for S3 storage missing. Either set the environment variable AWS_SECRET_ACCESS_KEY or pass the secretAccessKey property through the option object.');
    }
    if (!optionsWithOverrides.endpoint && !optionsWithOverrides.region) {
        throw new Error('No S3 endpoint or AWS region was specified. You must either set the environment variables AWS_S3_ENDPOINT or AWS_REGION or set the properties endpoint or region in the option object.');
    }
    return new aws_sdk_1["default"].S3(optionsWithOverrides);
});
//# sourceMappingURL=initS3.js.map