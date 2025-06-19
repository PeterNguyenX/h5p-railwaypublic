export type LogLevel = 'error' | 'warn' | 'info' | 'verbose' | 'debug' | 'silly';
export default class Logger {
    private scope;
    constructor(scope: string);
    private DEBUG;
    private ERROR;
    private INFO;
    private logLevel;
    private SILLY;
    private VERBOSE;
    private WARN;
    debug(...args: any[]): void;
    error(...args: any[]): void;
    info(...args: any[]): void;
    silly(...args: any[]): void;
    verbose(...args: any[]): void;
    warn(...args: any[]): void;
}
