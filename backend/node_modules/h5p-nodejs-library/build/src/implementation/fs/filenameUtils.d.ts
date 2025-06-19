export declare function checkFilename(filename: string): void;
/**
 * Sanitizes a filename or path by shortening it to the specified maximum length
 * and removing the invalid characters in the RegExp. If you don't specify a
 * RegExp a very strict invalid character list will be used that only leaves
 * alphanumeric filenames untouched.
 * @param filename the filename or path (with UNIX slash separator) to sanitize
 * @param maxFileLength the filename will be shortened to this length
 * @param invalidCharactersRegex these characters will be removed from the
 * filename
 * @returns the cleaned filename
 */
export declare function sanitizeFilename(filename: string, maxFileLength: number, invalidCharactersRegex?: RegExp): string;
