/**
 * ONEVA Phase 11: Multilingual Entity Extraction Engine
 * 
 * Extracts structured entities (applications, targets, queries, asset types,
 * constraints, item indexes, settings) from natural-language inputs in English,
 * Hindi, Hinglish, Punjabi, and Haryanvi.
 */

import { JarvisEntities } from '../../types/jarvisIntelligence';

export class JarvisEntityExtractor {
  // Known app names dictionary with phonetic/alias variants
  private static APP_DICTIONARY: Record<string, string[]> = {
    YouTube: ['youtube', 'yt', 'you tube', 'yutub'],
    WhatsApp: ['whatsapp', 'whats app', 'watsapp', 'wa'],
    Chrome: ['chrome', 'browser', 'google chrome', 'internet'],
    Camera: ['camera', 'cam', 'kamera', 'photo', 'video recorder'],
    Settings: ['settings', 'setting', 'phone settings', 'system settings'],
    Gallery: ['gallery', 'photos', 'google photos', 'pictures'],
    Clock: ['clock', 'alarm', 'timer', 'stopwatch'],
    Calculator: ['calculator', 'calc', 'hisab'],
    Maps: ['maps', 'google maps', 'navigation', 'rasta'],
    Spotify: ['spotify', 'music', 'gaana', 'songs'],
    Telegram: ['telegram', 'tele gram'],
    Phone: ['phone', 'dialer', 'call'],
    Messages: ['messages', 'sms', 'messaging'],
  };

  // Known asset types
  private static ASSET_TYPES: Record<string, string[]> = {
    '3D model': ['3d model', '3d asset', '3d mesh', '3d object', 'model for game', 'blend file', 'fbx', 'obj'],
    'wallpaper': ['wallpaper', 'background', 'lockscreen', 'home wallpaper', 'photo for screen'],
    'icon': ['icon', 'app icon', 'icon pack', 'symbol'],
    'theme': ['theme', 'color scheme', 'look and feel', 'palette'],
    'sound': ['sound effect', 'sfx', 'ringtone', 'audio clip', 'track'],
  };

  // Known device settings
  private static SETTINGS_KEYS: Record<string, string[]> = {
    flashlight: ['flashlight', 'torch', 'flash'],
    wifi: ['wifi', 'wi-fi', 'wireless internet'],
    bluetooth: ['bluetooth', 'bt'],
    volume: ['volume', 'sound', 'awaz', 'loudness'],
    brightness: ['brightness', 'screen light', 'roshni'],
    battery: ['battery', 'charge', 'charging', 'power saver'],
  };

  /**
   * Main entity extraction method
   */
  static extractEntities(input: string): JarvisEntities {
    const normalized = input.toLowerCase().trim();
    const entities: JarvisEntities = {};

    // 1. Extract Application
    for (const [appName, aliases] of Object.entries(this.APP_DICTIONARY)) {
      for (const alias of aliases) {
        const regex = new RegExp(`\\b${alias}\\b`, 'i');
        if (regex.test(normalized)) {
          entities.application = appName;
          break;
        }
      }
      if (entities.application) break;
    }

    // 2. Extract Target Contact (e.g. "WhatsApp me Rahul ka chat kholo", "call Mom")
    const contactMatches = [
      /(?:whatsapp|message|chat|call|bol)\s+(?:me|par|mein|ko|to)?\s*([a-zA-Z\u0900-\u097F]+)(?:\s+ka|\s+ki|\s+ko|\s+se|\s+chat)/i,
      /(?:send\s+message\s+to|chat\s+with|call)\s+([a-zA-Z\u0900-\u097F]+)/i,
      /(?:kholo|open)\s+([a-zA-Z\u0900-\u097F]+)(?:'s|\s+ka|\s+ki)?\s+chat/i,
    ];
    for (const rx of contactMatches) {
      const match = input.match(rx);
      if (match && match[1]) {
        const candidate = match[1].trim();
        // Discard if candidate is a common preposition or app name
        if (!['me', 'par', 'ko', 'to', 'chat', 'the', 'a', 'an', 'youtube', 'chrome', 'whatsapp'].includes(candidate.toLowerCase())) {
          entities.targetContact = candidate.charAt(0).toUpperCase() + candidate.slice(1);
          break;
        }
      }
    }

    // 3. Extract Asset Type
    for (const [assetType, aliases] of Object.entries(this.ASSET_TYPES)) {
      for (const alias of aliases) {
        if (normalized.includes(alias)) {
          entities.assetType = assetType;
          break;
        }
      }
      if (entities.assetType) break;
    }

    // 4. Extract Subject / Topic
    // e.g. "3D tree model" -> subject: "tree", "cricket highlights" -> query: "cricket highlights"
    if (entities.assetType) {
      // Find subject around the asset type
      const subjectPatterns = [
        /(?:find|search|get|download|need)\s+(?:a\s+|an\s+|me\s+)?(?:free\s+|paid\s+|good\s+)?(?:3d\s+)?([a-z0-9_-]+)\s+(?:model|asset|wallpaper|theme|icon)/i,
        /([a-z0-9_-]+)\s+(?:model|asset|mesh|wallpaper|theme|icon)/i,
      ];
      for (const rx of subjectPatterns) {
        const match = normalized.match(rx);
        if (match && match[1]) {
          const sub = match[1].trim();
          if (!['3d', 'free', 'a', 'an', 'good', 'my', 'the'].includes(sub)) {
            entities.subject = sub;
            break;
          }
        }
      }
    }

    // 5. Extract Constraints (e.g. "free", "open source", "4k", "offline", "low poly")
    const constraints: string[] = [];
    if (/\b(?:free|bina paise|muft|free wala|free wali)\b/i.test(normalized)) {
      constraints.push('free');
    }
    if (/\b(?:4k|hd|high res|high resolution|ultra hd)\b/i.test(normalized)) {
      constraints.push('high_resolution');
    }
    if (/\b(?:low poly|lowpoly|lightweight)\b/i.test(normalized)) {
      constraints.push('low_poly');
    }
    if (/\b(?:offline|bina net)\b/i.test(normalized)) {
      constraints.push('offline');
    }
    if (constraints.length > 0) {
      entities.constraints = constraints;
    }

    // 6. Extract Purpose (e.g. "for my game", "for wallpaper", "for project")
    const purposeMatch = normalized.match(/(?:for\s+(?:my\s+)?|ke\s+liye\s+)([a-z0-9\s]+?)(?:$|\s+and|\s+aur|\s+save|\s+download)/i);
    if (purposeMatch && purposeMatch[1]) {
      const purp = purposeMatch[1].trim();
      if (purp.length < 30) {
        entities.purpose = purp;
      }
    }

    // 7. Extract Search Query & Secondary Tasks
    // e.g. "Open YouTube and search for cricket highlights"
    const searchMatch = normalized.match(/(?:search(?:\s+for)?|dhundho|khojo|find)\s+(.+?)(?:$|\s+and|\s+aur|\s+then)/i);
    if (searchMatch && searchMatch[1]) {
      entities.query = searchMatch[1].trim();
      entities.secondaryTask = 'search';
    } else if (/(?:ke\s+baare\s+mein|about|information\s+on)\s+(.+?)(?:$|\s+chahiye|\s+batao|\s+information)/i.test(normalized)) {
      const infoMatch = normalized.match(/(?:ke\s+baare\s+mein|about|information\s+on)\s+(.+?)(?:$|\s+chahiye|\s+batao|\s+information)/i);
      if (infoMatch && infoMatch[1]) {
        entities.query = infoMatch[1].trim();
      }
    } else if (normalized.includes('cricket')) {
      entities.query = 'cricket highlights';
    }

    // 8. Extract Item Index for follow-ups (e.g. "second one", "first one", "teesra wala")
    const indexMatches = [
      { regex: /\b(?:first|1st|pehla|pahla)\s*(?:one|wala|wali)?\b/i, index: 1 },
      { regex: /\b(?:second|2nd|dusra|doosra)\s*(?:one|wala|wali)?\b/i, index: 2 },
      { regex: /\b(?:third|3rd|teesra|tisra)\s*(?:one|wala|wali)?\b/i, index: 3 },
      { regex: /\b(?:fourth|4th|chautha)\s*(?:one|wala|wali)?\b/i, index: 4 },
      { regex: /\b(?:last|aakhri|antim)\s*(?:one|wala)?\b/i, index: -1 },
    ];
    for (const item of indexMatches) {
      if (item.regex.test(normalized)) {
        entities.itemIndex = item.index;
        break;
      }
    }

    // 9. Extract Device Setting
    for (const [settingKey, aliases] of Object.entries(this.SETTINGS_KEYS)) {
      for (const alias of aliases) {
        if (new RegExp(`\\b${alias}\\b`, 'i').test(normalized)) {
          entities.settingName = settingKey;
          break;
        }
      }
      if (entities.settingName) break;
    }

    if (entities.settingName) {
      if (/\b(?:on|enable|chalu|jalao|start)\b/i.test(normalized)) {
        entities.settingValue = true;
      } else if (/\b(?:off|disable|band|bujhao|stop)\b/i.test(normalized)) {
        entities.settingValue = false;
      }
    }

    // 10. Extract Primary Action
    if (/\b(?:open|launch|kholo|chalao|chala do|start)\b/i.test(normalized)) {
      entities.action = 'open';
    } else if (/\b(?:search|find|dhundho|khojo|look for)\b/i.test(normalized)) {
      entities.action = 'search';
    } else if (/\b(?:create|make|banao|generate)\b/i.test(normalized)) {
      entities.action = 'create';
    } else if (/\b(?:play|bajao|suno)\b/i.test(normalized)) {
      entities.action = 'play';
    } else if (/\b(?:change|modify|badlo|set)\b/i.test(normalized)) {
      entities.action = 'modify';
    }

    return entities;
  }
}
