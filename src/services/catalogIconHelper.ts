/**
 * ONEVA Catalog Icon Normalization and Resolution Helper
 * 
 * Ensures safe, valid SVG filenames adhering to:
 * app-name.svg
 * 
 * Handles special characters, spaces, punctuation safely:
 * - "Google Pay" -> "google-pay.svg"
 * - "Disney+ Hotstar" -> "disney-hotstar.svg"
 * - "IRCTC Rail Connect" -> "irctc-rail-connect.svg"
 * - "X (Twitter)" -> "x-twitter.svg"
 * - "YONO SBI" -> "yono-sbi.svg"
 * - "mAadhaar" -> "maadhaar.svg"
 */

export class CatalogIconHelper {
  /**
   * Normalize an application name to a safe, URL-compatible SVG filename
   */
  static normalizeToSvgFilename(appName: string): string {
    if (!appName || !appName.trim()) {
      return 'generic-app.svg';
    }

    const normalized = appName
      .trim()
      .toLowerCase()
      // Replace '+' with word or space
      .replace(/\+/g, ' ')
      // Replace '&' with 'and'
      .replace(/&/g, 'and')
      // Replace all non-alphanumeric characters (including spaces, parentheses, slashes, dots) with hyphens
      .replace(/[^a-z0-9]+/g, '-')
      // Collapse multiple consecutive hyphens
      .replace(/-+/g, '-')
      // Trim leading and trailing hyphens
      .replace(/^-+|-+$/g, '');

    return `${normalized || 'app'}.svg`;
  }

  /**
   * Derive full icon path for a given SVG key or app name
   */
  static getIconPath(iconKeyOrAppName: string): string {
    if (iconKeyOrAppName.endsWith('.svg')) {
      return `/icons/${iconKeyOrAppName}`;
    }
    return `/icons/${this.normalizeToSvgFilename(iconKeyOrAppName)}`;
  }
}
