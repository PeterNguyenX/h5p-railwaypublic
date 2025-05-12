declare module "@ffmpeg/ffmpeg" {
    export function createFFmpeg(options?: any): any;
    export function fetchFile(file: File | string): Promise<Uint8Array>;
}

declare module 'hls.js';