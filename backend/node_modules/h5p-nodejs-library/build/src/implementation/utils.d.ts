/**
 * Sanitizes a filename. Removes invalid characters and shortens to the max
 * length.
 * @param filename
 * @param invalidCharacterRegex
 * @param maxLength
 * @returns the sanitized filename
 */
export declare function generalizedSanitizeFilename(filename: string, invalidCharacterRegex: RegExp, maxLength: number): string;
