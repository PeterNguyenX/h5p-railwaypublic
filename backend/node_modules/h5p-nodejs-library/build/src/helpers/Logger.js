"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var debug_1 = __importDefault(require("debug"));
var logLevelNumber;
(function (logLevelNumber) {
    logLevelNumber[logLevelNumber["error"] = 0] = "error";
    logLevelNumber[logLevelNumber["warn"] = 1] = "warn";
    logLevelNumber[logLevelNumber["info"] = 2] = "info";
    logLevelNumber[logLevelNumber["verbose"] = 3] = "verbose";
    logLevelNumber[logLevelNumber["debug"] = 4] = "debug";
    logLevelNumber[logLevelNumber["silly"] = 5] = "silly";
})(logLevelNumber || (logLevelNumber = {}));
var Logger = /** @class */ (function () {
    function Logger(scope) {
        this.scope = scope;
        this.DEBUG = this.ERROR = this.INFO = this.SILLY = this.VERBOSE = this.WARN = debug_1["default"]("h5p:" + this.scope);
        this.logLevel = process.env.LOG_LEVEL || 'info';
    }
    Logger.prototype.debug = function (message) {
        if (logLevelNumber[this.logLevel] >= logLevelNumber.debug) {
            this.DEBUG(message);
        }
    };
    Logger.prototype.error = function (message) {
        if (logLevelNumber[this.logLevel] >= logLevelNumber.error) {
            this.ERROR(message);
        }
    };
    Logger.prototype.info = function (message) {
        if (logLevelNumber[this.logLevel] >= logLevelNumber.info) {
            this.INFO(message);
        }
    };
    Logger.prototype.silly = function (message) {
        if (logLevelNumber[this.logLevel] >= logLevelNumber.silly) {
            this.SILLY(message);
        }
    };
    Logger.prototype.verbose = function (message) {
        if (logLevelNumber[this.logLevel] >= logLevelNumber.verbose) {
            this.VERBOSE(message);
        }
    };
    Logger.prototype.warn = function (message) {
        if (logLevelNumber[this.logLevel] >= logLevelNumber.warn) {
            this.WARN(message);
        }
    };
    return Logger;
}());
exports["default"] = Logger;
//# sourceMappingURL=Logger.js.map