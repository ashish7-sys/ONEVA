/**
 * ONEVA Phase 13: Application Resolution Service
 * 
 * Resolves natural language references, spoken aliases, abbreviations,
 * and multi-language keywords into verified Android package identifiers
 * using AppRepository (installed apps) and AppCatalogService (comprehensive catalog).
 */

import { AppRepository } from '../../launcher/services/appRepository';
import { AppCatalogService } from '../appCatalogService';
import { AppResolutionResult } from '../../types/jarvisActions';
import { AppShortcut } from '../../launcher/types';

export class AppResolutionService {
  // Common colloquial & multi-lingual alias dictionary
  private static readonly ALIAS_MAP: Record<string, string[]> = {
    'com.google.android.youtube': ['youtube', 'yt', 'you tube', 'yutub', 'ytube', 'video', 'videos'],
    'com.google.android.apps.youtube.music': ['youtube music', 'yt music', 'ytm'],
    'com.whatsapp': ['whatsapp', 'whats app', 'watsapp', 'wa', 'chat'],
    'com.android.chrome': ['chrome', 'browser', 'google chrome', 'internet', 'web browser'],
    'com.sec.android.app.sbrowser': ['samsung internet', 'samsung browser', 'sbrowser'],
    'com.google.android.calculator': ['calculator', 'calc', 'hisab', 'hisab kitab'],
    'com.android.camera': ['camera', 'cam', 'kamera', 'photo', 'video recorder'],
    'com.spotify.music': ['spotify', 'music', 'gaana', 'songs', 'spotify music'],
    'com.instagram.android': ['instagram', 'insta', 'ig', 'reels'],
    'com.netflix.mediaclient': ['netflix', 'movies', 'series'],
    'in.startv.hotstar': ['hotstar', 'jiohotstar', 'disney hotstar'],
    'com.google.android.gm': ['gmail', 'email', 'mail', 'google mail'],
    'com.google.android.apps.docs': ['google drive', 'drive', 'docs'],
    'com.google.android.apps.maps': ['maps', 'google maps', 'navigation', 'rasta'],
    'org.telegram.messenger': ['telegram', 'tele gram', 'tg'],
    'com.android.settings': ['settings', 'phone settings', 'system settings', 'setting'],
    'com.oneva.android.launcher': ['oneva', 'launcher', 'home', 'oneva launcher'],
  };

  /**
   * Resolves a raw natural-language app name or alias into a verified target
   */
  static resolveApp(rawQuery: string): AppResolutionResult {
    const clean = rawQuery.trim().toLowerCase();
    if (!clean) {
      return {
        found: false,
        isInstalled: false,
        appName: '',
        packageName: '',
        confidence: 0,
        rejectionReason: 'Empty app query',
      };
    }

    const allInstalled = AppRepository.getAllInstalledApps();
    const availableApps = AppRepository.getAvailableApps();
    const catalogApps = AppCatalogService.getAllApps();

    const enrichCapabilities = (pkg: string, base: AppResolutionResult): AppResolutionResult => {
      const cap = AppRepository.getAppCapabilityModel(pkg);
      if (cap) {
        return {
          ...base,
          isInstalled: cap.installed,
          launchable: cap.launchable,
          catalogSupported: cap.catalogSupported,
          jarvisLaunchSupported: cap.jarvisLaunchSupported,
          jarvisInteractionSupported: cap.jarvisInteractionSupported,
          isSystemApp: cap.isSystemApp,
        };
      }
      return base;
    };

    // 1. Exact Package Match
    const directInstalled = allInstalled.find((a) => a.packageName.toLowerCase() === clean);
    if (directInstalled) {
      return enrichCapabilities(directInstalled.packageName, {
        found: true,
        isInstalled: true,
        appName: directInstalled.label,
        packageName: directInstalled.packageName,
        confidence: 1.0,
        webFallbackIntent: directInstalled.webFallbackIntent,
      });
    }

    const directCatalog = catalogApps.find((a) => a.packageName.toLowerCase() === clean);
    if (directCatalog) {
      const isInstalled = AppRepository.isPackageInstalled(directCatalog.packageName);
      return enrichCapabilities(directCatalog.packageName, {
        found: true,
        isInstalled,
        appName: directCatalog.name,
        packageName: directCatalog.packageName,
        confidence: 1.0,
        webFallbackIntent: directCatalog.webFallbackIntent,
      });
    }

    // 2. Exact Normalized App Name Match (Installed apps, then catalog)
    const exactInstalled = allInstalled.find(
      (a) => a.label.trim().toLowerCase() === clean
    );
    if (exactInstalled) {
      return enrichCapabilities(exactInstalled.packageName, {
        found: true,
        isInstalled: true,
        appName: exactInstalled.label,
        packageName: exactInstalled.packageName,
        confidence: 0.98,
        webFallbackIntent: exactInstalled.webFallbackIntent,
      });
    }

    const exactCatalog = catalogApps.find(
      (a) => (a.appName || a.name).trim().toLowerCase() === clean
    );
    if (exactCatalog) {
      const isInstalled = AppRepository.isPackageInstalled(exactCatalog.packageName);
      return enrichCapabilities(exactCatalog.packageName, {
        found: true,
        isInstalled,
        appName: exactCatalog.appName || exactCatalog.name,
        packageName: exactCatalog.packageName,
        confidence: 0.97,
        webFallbackIntent: exactCatalog.webFallbackIntent,
      });
    }

    // 3. Known Alias Map Matching & Ambiguity Check
    const aliasMatches: { pkg: string; alias: string; name: string; installed: boolean; webFallbackIntent?: string }[] = [];
    for (const [pkg, aliases] of Object.entries(this.ALIAS_MAP)) {
      for (const alias of aliases) {
        if (clean === alias || clean.startsWith(alias + ' ') || clean.endsWith(' ' + alias)) {
          const installedMatch = allInstalled.find((a) => a.packageName.toLowerCase() === pkg.toLowerCase());
          if (installedMatch) {
            aliasMatches.push({
              pkg: installedMatch.packageName,
              alias,
              name: installedMatch.label,
              installed: true,
              webFallbackIntent: installedMatch.webFallbackIntent,
            });
          } else {
            const catalogMatch = catalogApps.find((a) => a.packageName.toLowerCase() === pkg.toLowerCase());
            if (catalogMatch) {
              aliasMatches.push({
                pkg: catalogMatch.packageName,
                alias,
                name: catalogMatch.name || catalogMatch.appName || pkg,
                installed: false,
                webFallbackIntent: catalogMatch.webFallbackIntent,
              });
            }
          }
          break;
        }
      }
    }

    // Also check if any installed app labels contain this alias/query as a distinct term (e.g. "Tor Browser" when querying "browser")
    const labelMatches = allInstalled.filter((a) => {
      const labelLower = a.label.toLowerCase();
      return (
        !aliasMatches.some((m) => m.pkg === a.packageName) &&
        (labelLower.includes(clean) || (clean.length >= 3 && labelLower.split(/\s+/).includes(clean)))
      );
    });

    const combinedCandidateMatches = [
      ...aliasMatches.map((m) => ({ name: m.name, packageName: m.pkg, installed: m.installed })),
      ...labelMatches.map((l) => ({ name: l.label, packageName: l.packageName, installed: true })),
    ];

    if (combinedCandidateMatches.length > 1) {
      const namesList = combinedCandidateMatches.map((c) => c.name).join(' and ');
      return {
        found: true,
        isInstalled: combinedCandidateMatches.some((m) => m.installed),
        isAmbiguous: true,
        appName: combinedCandidateMatches[0].name,
        packageName: combinedCandidateMatches[0].packageName,
        confidence: 0.6,
        ambiguousCandidates: combinedCandidateMatches.map((c) => ({ name: c.name, packageName: c.packageName })),
        rejectionReason: `I found multiple matching applications (${namesList}). Which one do you mean?`,
      };
    }

    if (aliasMatches.length === 1 && labelMatches.length === 0) {
      const match = aliasMatches[0];
      return enrichCapabilities(match.pkg, {
        found: true,
        isInstalled: match.installed,
        appName: match.name,
        packageName: match.pkg,
        confidence: 0.95,
        matchedAlias: match.alias,
        webFallbackIntent: match.webFallbackIntent,
      });
    }

    // 4. Existing ONEVA Catalog Mapping
    const catalogDirect = catalogApps.filter((a) => {
      const name = (a.appName || a.name).toLowerCase();
      const pkg = a.packageName.toLowerCase();
      const keywords = a.searchKeywords?.map((k) => k.toLowerCase()) || [];
      return name === clean || pkg === clean || keywords.some((k) => k === clean);
    });

    if (catalogDirect.length === 1) {
      const best = catalogDirect[0];
      const isInstalled = AppRepository.isPackageInstalled(best.packageName);
      return enrichCapabilities(best.packageName, {
        found: true,
        isInstalled,
        appName: best.appName || best.name,
        packageName: best.packageName,
        confidence: 0.9,
        webFallbackIntent: best.webFallbackIntent,
      });
    }

    // 5. Installed-App Discovery Result (Substring / Prefix / Keyword)
    const matchingInstalled = allInstalled.filter((a) => {
      const label = (a.label || '').toLowerCase().trim();
      const pkg = (a.packageName || '').toLowerCase().trim();
      if (!label && !pkg) return false;
      return (
        (label.length >= 3 && clean.includes(label)) ||
        (clean.length >= 3 && label.includes(clean)) ||
        (pkg.length >= 4 && pkg.includes(clean))
      );
    });

    // Check for Ambiguity: If multiple installed apps have similar names, do NOT guess!
    if (matchingInstalled.length > 1) {
      const candidates = matchingInstalled.map((m) => ({ name: m.label, packageName: m.packageName }));
      const namesList = candidates.map((c) => c.name).join(' and ');
      return {
        found: true,
        isInstalled: true,
        isAmbiguous: true,
        appName: matchingInstalled[0].label,
        packageName: matchingInstalled[0].packageName,
        confidence: 0.6,
        ambiguousCandidates: candidates,
        rejectionReason: `I found multiple matching applications (${namesList}). Which one do you mean?`,
      };
    }

    if (matchingInstalled.length === 1) {
      const match = matchingInstalled[0];
      return enrichCapabilities(match.packageName, {
        found: true,
        isInstalled: true,
        appName: match.label,
        packageName: match.packageName,
        confidence: 0.85,
        webFallbackIntent: match.webFallbackIntent,
      });
    }

    // 6. Broader Catalog Substring Search
    const catalogMatches = catalogApps.filter((a) => {
      const name = (a.name || '').toLowerCase().trim();
      const pkg = (a.packageName || '').toLowerCase().trim();
      if (!name && !pkg) return false;
      const keywords = a.searchKeywords?.map((k) => k.toLowerCase()) || [];
      return (
        (name.length >= 3 && clean.includes(name)) ||
        (clean.length >= 3 && name.includes(clean)) ||
        (pkg.length >= 4 && pkg.includes(clean)) ||
        keywords.some((k) => k.length >= 3 && (k === clean || clean.includes(k)))
      );
    });

    // Check for Ambiguity in Catalog Matches
    if (catalogMatches.length > 1) {
      const candidates = catalogMatches.map((m) => ({ name: m.name, packageName: m.packageName }));
      const namesList = candidates.slice(0, 3).map((c) => c.name).join(' and ');
      return {
        found: true,
        isInstalled: candidates.some((c) => AppRepository.isPackageInstalled(c.packageName)),
        isAmbiguous: true,
        appName: catalogMatches[0].name,
        packageName: catalogMatches[0].packageName,
        confidence: 0.6,
        ambiguousCandidates: candidates,
        rejectionReason: `I found multiple matching applications (${namesList}). Which one do you mean?`,
      };
    }

    if (catalogMatches.length === 1) {
      const best = catalogMatches[0];
      const isInstalled = AppRepository.isPackageInstalled(best.packageName);
      return enrichCapabilities(best.packageName, {
        found: true,
        isInstalled,
        appName: best.name,
        packageName: best.packageName,
        confidence: 0.75,
        webFallbackIntent: best.webFallbackIntent,
      });
    }

    // 6. Not found in installed apps or catalog
    return {
      found: false,
      isInstalled: false,
      appName: rawQuery,
      packageName: '',
      confidence: 0.1,
      rejectionReason: `Application "${rawQuery}" is not recognized on this device.`,
    };
  }

  /**
   * Helper to format human-friendly not-installed explanation
   */
  static getNotInstalledMessage(appName: string, lang: 'en' | 'hi' | 'pa' | 'hr' | 'other' = 'en'): string {
    if (lang === 'hi' || lang === 'hr') {
      return `सर, ${appName} आपके फोन में इनस्टॉल (installed) नहीं है।`;
    }
    if (lang === 'pa') {
      return `ਸਰ, ${appName} ਤੁਹਾਡੇ ਫੋਨ 'ਤੇ ਇੰਸਟੌਲ ਨਹੀਂ ਹੈ।`;
    }
    return `Sir, ${appName} is not installed on this device.`;
  }

  /**
   * Helper to format human-friendly launched confirmation
   */
  static getLaunchedMessage(appName: string, lang: 'en' | 'hi' | 'pa' | 'hr' | 'other' = 'en'): string {
    if (lang === 'hi' || lang === 'hr') {
      return `जी सर, ${appName} खोल दिया गया है।`;
    }
    if (lang === 'pa') {
      return `ਹਾਂ ਜੀ ਸਰ, ${appName} ਖੋਲ੍ਹ ਦਿੱਤਾ ਗਿਆ ਹੈ।`;
    }
    return `Yes sir, ${appName} is open.`;
  }
}
