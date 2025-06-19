"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = __importDefault(require("debug"));
var LogLevelNumber;
(function (LogLevelNumber) {
    LogLevelNumber[LogLevelNumber["error"] = 0] = "error";
    LogLevelNumber[LogLevelNumber["warn"] = 1] = "warn";
    LogLevelNumber[LogLevelNumber["info"] = 2] = "info";
    LogLevelNumber[LogLevelNumber["verbose"] = 3] = "verbose";
    LogLevelNumber[LogLevelNumber["debug"] = 4] = "debug";
    LogLevelNumber[LogLevelNumber["silly"] = 5] = "silly";
})(LogLevelNumber || (LogLevelNumber = {}));
class Logger {
    scope;
    constructor(scope) {
        this.scope = scope;
        this.DEBUG =
            this.ERROR =
                this.INFO =
                    this.SILLY =
                        this.VERBOSE =
                            this.WARN =
                                (0, debug_1.default)(`h5p:${this.scope}`);
        this.logLevel =
            process.env.LOG_LEVEL?.toLowerCase() || 'info';
    }
    DEBUG;
    ERROR;
    INFO;
    logLevel;
    SILLY;
    VERBOSE;
    WARN;
    debug(...args) {
        if (LogLevelNumber[this.logLevel] >= LogLevelNumber.debug) {
            this.DEBUG(...args);
        }
    }
    error(...args) {
        if (LogLevelNumber[this.logLevel] >= LogLevelNumber.error) {
            this.ERROR(...args);
        }
    }
    info(...args) {
        if (LogLevelNumber[this.logLevel] >= LogLevelNumber.info) {
            this.INFO(...args);
        }
    }
    silly(...args) {
        if (LogLevelNumber[this.logLevel] >= LogLevelNumber.silly) {
            this.SILLY(...args);
        }
    }
    verbose(...args) {
        if (LogLevelNumber[this.logLevel] >= LogLevelNumber.verbose) {
            this.VERBOSE(...args);
        }
    }
    warn(...args) {
        if (LogLevelNumber[this.logLevel] >= LogLevelNumber.warn) {
            this.WARN(...args);
        }
    }
}
exports.default = Logger;
//# sourceMappingURL=Logger.js.map