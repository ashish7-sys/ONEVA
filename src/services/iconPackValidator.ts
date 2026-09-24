import JSZip from 'jszip';
import { IconPackManifest, IconPackValidationResult } from '../types/adminAssets';
import { AppCatalogService } from './appCatalogService';
import { CatalogApp } from '../types/catalogAndIcons';

export class IconPackValidator {
  /**
   * Validates and automatically parses an uploaded Icon Pack ZIP archive.
   * Supports:
   * 1. ZIP with manifest.json (standard ONEVA format)
   * 2. Raw ZIP containing icons (auto-detects and matches against ONEVA catalog)
   */
  static async validateIconPackZip(
    input: File | Blob | ArrayBuffer,
    fileName: string = 'archive.zip'
  ): Promise<IconPackValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let iconCount = 0;
    const verifiedPackages: string[] = [];
    const extractedIcons: Record<string, string> = {};
    let previewDataUrl: string | undefined;
    let manifest: IconPackManifest | undefined;

    const zipSize = input instanceof File || input instanceof Blob ? input.size : input.byteLength;

    if (zipSize === 0) {
      return {
        isValid: false,
        errors: ['Uploaded file is completely empty (0 bytes).'],
        warnings: [],
        iconCount: 0,
        verifiedPackages: [],
        zipSize: 0,
      };
    }

    let zip: JSZip;
    try {
      zip = await JSZip.loadAsync(input);
    } catch (err: any) {
      return {
        isValid: false,
        errors: [`Corrupt or invalid ZIP archive: ${err?.message || 'Failed to decompress'}`],
        warnings: [],
        iconCount: 0,
        verifiedPackages: [],
        zipSize,
      };
    }

    const catalogApps = AppCatalogService.getAllApps();

    // Helper to match a filename against ONEVA catalog apps (Canonical + Extended)
    // Hierarchy: 1. Package ID -> 2. Normalized Package Name -> 3. Normalized App Name -> 4. Aliases
    const matchToCatalog = (baseName: string): CatalogApp | undefined => {
      const raw = baseName.toLowerCase().trim();
      const stripped = raw.replace(/^(ic_|icon_|app_|oneva_)/, '');
      const clean = stripped.replace(/[^a-z0-9]/g, '');

      if (!clean) return undefined;

      // 1. Package ID when available (exact match or package prefix)
      let match = catalogApps.find(
        (a) => a.packageName.toLowerCase() === raw || a.packageName.toLowerCase() === stripped
      );
      if (match) return match;

      // 2. Normalized package name (e.g. "comgoogleandroidappsphotos" or "comdiscord")
      match = catalogApps.find((a) => {
        const normPkg = a.packageName.toLowerCase().replace(/[^a-z0-9]/g, '');
        return normPkg === clean || normPkg === raw.replace(/[^a-z0-9]/g, '');
      });
      if (match) return match;

      // Also check package aliases normalized
      match = catalogApps.find((a) =>
        a.packageAliases?.some((p) => {
          const normP = p.toLowerCase().replace(/[^a-z0-9]/g, '');
          return normP === clean;
        })
      );
      if (match) return match;

      // 3. Normalized app name (e.g. "googlephotos", "discord", "microsoftword")
      match = catalogApps.find((a) => {
        const normName = (a.normalizedName || a.name).toLowerCase().replace(/[^a-z0-9]/g, '');
        const normDisplay = (a.displayName || a.name).toLowerCase().replace(/[^a-z0-9]/g, '');
        return normName === clean || normDisplay === clean;
      });
      if (match) return match;

      // Check stable ID match (e.g. "ext-google-photos")
      match = catalogApps.find(
        (a) => a.id.toLowerCase() === raw || a.id.toLowerCase().replace(/[^a-z0-9]/g, '') === clean
      );
      if (match) return match;

      // 4. Aliases (natural language aliases and iconKey)
      match = catalogApps.find((a) => {
        // iconKey check
        const cleanIconKey = a.iconKey?.replace(/\.svg$/i, '').replace(/[^a-z0-9]/g, '');
        if (cleanIconKey && cleanIconKey === clean) return true;

        // aliases check
        return a.aliases?.some((alias) => {
          const normAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
          return normAlias === clean && normAlias.length >= 3;
        });
      });
      if (match) return match;

      // Suffix package segment match ONLY if confident (length >= 5 and clean matching package leaf)
      if (clean.length >= 5) {
        match = catalogApps.find((a) => {
          const parts = a.packageName.toLowerCase().split('.');
          const lastLeaf = parts[parts.length - 1];
          return lastLeaf === stripped || lastLeaf === clean;
        });
        if (match) return match;
      }

      // Never silently guess or invent: return undefined (unmatched)
      return undefined;
    };

    // 1. Check for manifest.json
    let manifestEntry = zip.file('manifest.json');
    let prefix = '';
    if (!manifestEntry) {
      const candidates = zip.file(/manifest\.json$/i);
      if (candidates.length > 0) {
        manifestEntry = candidates[0];
        const lastSlash = manifestEntry.name.lastIndexOf('/');
        if (lastSlash >= 0) {
          prefix = manifestEntry.name.substring(0, lastSlash + 1);
        }
      }
    }

    if (manifestEntry) {
      try {
        const manifestText = await manifestEntry.async('text');
        manifest = JSON.parse(manifestText);
      } catch (err: any) {
        warnings.push(`Could not parse manifest.json (${err?.message}). Auto-detecting icons from archive instead.`);
      }
    }

    // 2. Auto-generate or sanitize manifest
    const cleanPackName =
      fileName
        .replace(/\.zip$/i, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim() || 'Uploaded Icon Pack';

    if (!manifest || typeof manifest !== 'object') {
      manifest = {
        packId: `pack-${Date.now().toString(36)}`,
        name: cleanPackName,
        version: '1.0.0',
        author: 'Admin Upload',
        description: `Icon pack imported from ${fileName}`,
        icons: {},
      };
    } else {
      if (!manifest.packId) manifest.packId = `pack-${Date.now().toString(36)}`;
      if (!manifest.name) manifest.name = cleanPackName;
      if (!manifest.version) manifest.version = '1.0.0';
      if (!manifest.icons) manifest.icons = {};
    }

    // 3. Scan all image files in the ZIP archive (filter out __MACOSX resource forks and hidden files)
    const imageFiles: JSZip.JSZipObject[] = [];
    zip.forEach((relativePath, file) => {
      const isHidden = relativePath.split('/').some((seg) => seg.startsWith('.') || seg.startsWith('__MACOSX'));
      if (!file.dir && !isHidden && /\.(svg|png|jpe?g|webp)$/i.test(relativePath)) {
        imageFiles.push(file);
      }
    });

    if (imageFiles.length === 0) {
      errors.push('No icon image files (.svg, .png, .jpg, .webp) found in the ZIP archive.');
      return {
        isValid: false,
        errors,
        warnings,
        iconCount: 0,
        verifiedPackages: [],
        zipSize,
      };
    }

    // 4. Match and extract icons in high-speed parallel batches
    const seenPackages = new Set<string>();

    interface PendingIconExtraction {
      normPkg: string;
      file: JSZip.JSZipObject;
      mime: string;
      explicitPath?: string;
    }

    const pendingMap = new Map<string, PendingIconExtraction>();

    // First: If manifest had explicit mappings, queue them
    if (manifest.icons && Object.keys(manifest.icons).length > 0) {
      for (const [pkgName, relPath] of Object.entries(manifest.icons)) {
        const normPkg = pkgName.trim().toLowerCase();
        const resolvedPath = prefix ? `${prefix}${relPath}` : relPath;
        const fileInZip = zip.file(resolvedPath) || zip.file(relPath);
        if (fileInZip && !fileInZip.dir) {
          const mime = relPath.endsWith('.svg')
            ? 'image/svg+xml'
            : relPath.endsWith('.webp')
            ? 'image/webp'
            : relPath.endsWith('.jpg') || relPath.endsWith('.jpeg')
            ? 'image/jpeg'
            : 'image/png';
          pendingMap.set(normPkg, { normPkg, file: fileInZip, mime, explicitPath: relPath });
        }
      }
    }

    // Second: Automatically match image files in the ZIP against catalog apps
    for (const file of imageFiles) {
      const fileNameOnly = file.name.split('/').pop() || file.name;
      const baseName = fileNameOnly.replace(/\.[^/.]+$/, '');
      const matchedApp = matchToCatalog(baseName);

      if (matchedApp) {
        const normPkg = matchedApp.packageName.toLowerCase();
        if (!pendingMap.has(normPkg)) {
          const mime = file.name.endsWith('.svg')
            ? 'image/svg+xml'
            : file.name.endsWith('.webp')
            ? 'image/webp'
            : file.name.endsWith('.jpg') || file.name.endsWith('.jpeg')
            ? 'image/jpeg'
            : 'image/png';
          pendingMap.set(normPkg, { normPkg, file, mime });
          manifest.icons[normPkg] = file.name;
        }
      }
    }

    // Third: Parallel chunked extraction (12 concurrent files per chunk)
    // Avoids memory heap spikes and prevents blocking the JavaScript event loop
    const pendingList = Array.from(pendingMap.values());
    const CHUNK_SIZE = 12;

    for (let i = 0; i < pendingList.length; i += CHUNK_SIZE) {
      const chunk = pendingList.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map(async (item) => {
          try {
            const base64 = await item.file.async('base64');
            if (base64 && base64.trim().length > 10) {
              const dataUrl = `data:${item.mime};base64,${base64}`;
              extractedIcons[item.normPkg] = dataUrl;
              if (!seenPackages.has(item.normPkg)) {
                seenPackages.add(item.normPkg);
                verifiedPackages.push(item.normPkg);
                iconCount++;
              }
            }
          } catch (e) {
            warnings.push(`Could not extract icon for ${item.normPkg}.`);
          }
        })
      );
      // Non-blocking yield to event loop to prevent UI locking on large archives
      await new Promise((resolve) => setTimeout(resolve, 5));
    }

    // 5. Check preview
    const previewDeclared = manifest.preview || 'preview.png';
    const previewFile =
      zip.file(prefix ? `${prefix}${previewDeclared}` : previewDeclared) || zip.file(previewDeclared);
    if (previewFile) {
      try {
        const base64 = await previewFile.async('base64');
        previewDataUrl = `data:image/png;base64,${base64}`;
      } catch (err) {
        // Fallback to first icon below
      }
    }
    if (!previewDataUrl && verifiedPackages.length > 0) {
      previewDataUrl = extractedIcons[verifiedPackages[0]];
    }

    // 6. Generate canonical sample icons for instant card preview
    const sampleCatalog = [
      { name: 'Chrome', pkg: 'com.android.chrome', iconName: 'Compass', color: '#4285f4' },
      { name: 'YouTube', pkg: 'com.google.android.youtube', iconName: 'Youtube', color: '#ef4444' },
      { name: 'WhatsApp', pkg: 'com.whatsapp', iconName: 'MessageCircle', color: '#25d366' },
      { name: 'Camera', pkg: 'com.google.android.GoogleCamera', iconName: 'Camera', color: '#8b5cf6' },
      { name: 'Phone', pkg: 'com.google.android.dialer', iconName: 'Phone', color: '#06b6d4' },
      { name: 'Photos', pkg: 'com.google.android.apps.photos', iconName: 'Image', color: '#ec4899' },
      { name: 'Settings', pkg: 'com.android.settings', iconName: 'Sliders', color: '#94a3b8' },
      { name: 'Gmail', pkg: 'com.google.android.gm', iconName: 'Mail', color: '#ea4335' },
    ];

    const sampleIcons = sampleCatalog.map((app) => ({
      name: app.name,
      label: app.name.slice(0, 2).toUpperCase(),
      bg: app.color,
      fg: '#ffffff',
      iconName: app.iconName,
      glyphUrl: extractedIcons[app.pkg],
    }));

    const isValid = verifiedPackages.length > 0;
    if (!isValid) {
      errors.push(
        'Could not match any icons in the ZIP archive to ONEVA catalog apps. Ensure icon filenames correspond to app names or package names (e.g. whatsapp.svg, youtube.png).'
      );
    }

    return {
      isValid,
      errors,
      warnings,
      manifest,
      iconCount,
      verifiedPackages,
      previewDataUrl,
      extractedIcons,
      sampleIcons,
      originalFile: input instanceof File || input instanceof Blob ? input : undefined,
      zipSize,
    };
  }

  /**
   * Helper generator that constructs a real, fully valid ONEVA_ICON_PACK.zip
   * for testing or demonstration of genuine ZIP upload & extraction in the Admin Panel.
   */
  static async createSampleIconPackZip(packVariant: 'purple_glass' | 'neon_matrix' = 'purple_glass'): Promise<Blob> {
    const zip = new JSZip();

    const isPurple = packVariant === 'purple_glass';
    const packId = isPurple ? 'oneva-purple-glass' : 'oneva-neon-matrix';
    const name = isPurple ? 'ONEVA Purple Glass' : 'ONEVA Cyber Matrix';
    const primaryColor = isPurple ? '#a855f7' : '#10b981';
    const secondaryColor = isPurple ? '#6366f1' : '#06b6d4';

    const iconsList = [
      { pkg: 'com.android.chrome', label: 'Chrome', glyph: '🌐' },
      { pkg: 'com.google.android.gm', label: 'Gmail', glyph: '✉️' },
      { pkg: 'com.google.android.apps.photos', label: 'Photos', glyph: '🖼️' },
      { pkg: 'com.google.android.calculator', label: 'Calculator', glyph: '🔢' },
      { pkg: 'com.android.settings', label: 'Settings', glyph: '⚙️' },
      { pkg: 'com.google.android.youtube', label: 'YouTube', glyph: '▶️' },
      { pkg: 'com.whatsapp', label: 'WhatsApp', glyph: '💬' },
      { pkg: 'com.spotify.music', label: 'Spotify', glyph: '🎵' },
      { pkg: 'com.instagram.android', label: 'Instagram', glyph: '📷' },
    ];

    const iconsMapping: Record<string, string> = {};

    const iconsFolder = zip.folder('icons');

    for (const item of iconsList) {
      const fileName = `${item.pkg}.svg`;
      const relativePath = `icons/${fileName}`;
      iconsMapping[item.pkg] = relativePath;

      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primaryColor}" />
      <stop offset="100%" stop-color="${secondaryColor}" />
    </linearGradient>
  </defs>
  <rect x="5" y="5" width="90" height="90" rx="26" fill="#09132A" stroke="url(#grad)" stroke-width="3"/>
  <text x="50" y="58" font-size="34" text-anchor="middle" dominant-baseline="middle">${item.glyph}</text>
</svg>`;

      iconsFolder?.file(fileName, svgContent);
    }

    const manifest = {
      packId,
      name,
      version: '1.0.0',
      author: 'ONEVA Verified Publisher',
      description: `Premium curated ${isPurple ? 'Purple Glass' : 'Cyber Matrix'} icon pack with vector SVG contours.`,
      preview: 'icons/com.whatsapp.svg',
      icons: iconsMapping,
    };

    zip.file('manifest.json', JSON.stringify(manifest, null, 2));

    return await zip.generateAsync({ type: 'blob' });
  }
}
