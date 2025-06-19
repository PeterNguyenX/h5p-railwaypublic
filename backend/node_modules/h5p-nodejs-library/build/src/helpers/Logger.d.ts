export declare type logLevel = 'error' | 'warn' | 'info' | 'verbose' | 'debug' | 'silly';
export default class Logger {
    constructor(scope: string);
    private DEBUG;
    private ERROR;
    private INFO;
    private logLevel;
    private scope;
    private SILLY;
    private VERBOSE;
    private WARN;
    debug(message: string): void;
    error(message: string): void;
    info(message: string): void;
    silly(message: string): void;
    verbose(message: string): void;
    warn(message: string): void;
}
