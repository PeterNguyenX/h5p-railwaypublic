import { Plugin } from 'postcss';
/**
 * A list of font types used in CSS.
 */
declare type FontTypes = 'woff' | 'woff2' | 'truetype' | 'svg' | 'embedded-opentype' | 'opentype';
/**
 * A PostCSS plugin Removing redundant URLs in @font-face rules by deleting all
 * URLs from src except for a single one.
 * @param fontPreference (optional) the order in which fonts should be kept; the
 * first one in the list is the one that is taken first, if it exists
 * @param removedCallback (optional) this function if executed for each file
 * reference that is removed by the plugin
 */
export default function (fontPreference?: FontTypes[], removedCallback?: (filename: string) => void): Plugin;
export {};
