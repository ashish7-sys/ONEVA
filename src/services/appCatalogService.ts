import {
  CatalogApp,
  CatalogAppCategory,
  IconAssetReference,
  UnifiedAppCatalogStructure,
} from '../types/catalogAndIcons';
import { getSupabaseClient } from '../supabase/client';
import { CatalogIconHelper } from './catalogIconHelper';

const STORAGE_CATALOG_KEY = 'oneva_app_catalog_v9';

/**
 * Helper to construct a fully populated CatalogApp entry for canonical apps (56 apps)
 */
function createCatalogApp(
  name: string,
  packageName: string,
  category: CatalogAppCategory,
  accentColor: string,
  defaultIcon: string,
  searchKeywords: string[],
  options?: {
    packageAliases?: string[];
    isSystemApp?: boolean;
    webFallbackIntent?: string;
    defaultIconType?: 'lucide' | 'image' | 'svg';
    capabilities?: string[];
    actions?: string[];
  }
): CatalogApp {
  const iconKey = CatalogIconHelper.normalizeToSvgFilename(name);
  const normalizedName = iconKey.replace(/\.svg$/i, '');
  return {
    id: packageName,
    name,
    appName: name,
    displayName: name,
    normalizedName,
    aliases: options?.packageAliases || [],
    packageName,
    packageAliases: options?.packageAliases || [],
    category,
    defaultIcon,
    defaultIconType: options?.defaultIconType || 'lucide',
    icon: defaultIcon,
    iconKey,
    iconPath: `/icons/${iconKey}`,
    accentColor,
    fallbackInitial: name.trim().charAt(0).toUpperCase(),
    status: 'active',
    catalogType: 'canonical',
    iconStatus: 'available',
    iconAsset: null,
    supported: true,
    enabled: true,
    capabilities: options?.capabilities || ['open_app', 'icon_customization'],
    actions: options?.actions || ['launch', 'override_icon'],
    searchKeywords: Array.from(new Set([name.toLowerCase(), ...searchKeywords])),
    isSystemApp: Boolean(options?.isSystemApp),
    webFallbackIntent: options?.webFallbackIntent,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  };
}

/**
 * Helper to construct a structured catalog record for Extended Apps (separate from canonical 56)
 */
function createExtendedApp(
  id: string,
  displayName: string,
  normalizedName: string,
  packageName: string,
  category: CatalogAppCategory,
  accentColor: string,
  defaultIcon: string,
  aliases: string[],
  options?: {
    packageAliases?: string[];
    webFallbackIntent?: string;
    metadata?: Record<string, any>;
  }
): CatalogApp {
  return {
    id,
    name: displayName,
    appName: displayName,
    displayName,
    normalizedName,
    aliases,
    packageName,
    packageAliases: options?.packageAliases || [],
    category,
    defaultIcon,
    defaultIconType: 'lucide',
    icon: defaultIcon,
    iconKey: `${normalizedName}.svg`,
    iconPath: `/icons/${normalizedName}.svg`,
    accentColor,
    fallbackInitial: displayName.trim().charAt(0).toUpperCase(),
    status: 'active',
    catalogType: 'extended',
    iconStatus: 'not_uploaded',
    iconAsset: null,
    supported: true,
    enabled: true,
    capabilities: ['open_app', 'icon_customization', 'app_animation'],
    actions: ['launch', 'override_icon'],
    searchKeywords: Array.from(
      new Set([displayName.toLowerCase(), normalizedName, ...aliases.map((a) => a.toLowerCase())])
    ),
    isSystemApp: false,
    webFallbackIntent: options?.webFallbackIntent,
    metadata: options?.metadata || {},
    createdAt: '2026-03-23T00:00:00Z',
    updatedAt: '2026-03-23T00:00:00Z',
  };
}

/**
 * Master catalog of applications containing at least the 50 specified apps + platform core apps.
 */
export const SEED_CATALOG_APPS: CatalogApp[] = [
  // System & Platform Core (Essential ONEVA & Android baseline)
  createCatalogApp(
    'ONEVA',
    'com.oneva.android.launcher',
    'utilities',
    '#10b981',
    '/oneva_logo.png',
    ['oneva', 'launcher', 'system', 'privacy', 'glow', 'assist', 'jarvis'],
    { isSystemApp: true, defaultIconType: 'image', packageAliases: ['io.oneva.android.launcher'], webFallbackIntent: '#' }
  ),
  createCatalogApp(
    'Chrome',
    'com.android.chrome',
    'utilities',
    '#3b82f6',
    'Globe',
    ['chrome', 'browser', 'google', 'web', 'internet'],
    { isSystemApp: true, packageAliases: ['com.chrome.beta', 'com.chrome.dev'], webFallbackIntent: 'https://google.com' }
  ),
  createCatalogApp(
    'Camera',
    'com.android.camera',
    'media',
    '#10b981',
    'Camera',
    ['camera', 'photo', 'video', 'lens'],
    { isSystemApp: true, packageAliases: ['com.google.android.GoogleCamera'] }
  ),
  createCatalogApp(
    'Calculator',
    'com.google.android.calculator',
    'utilities',
    '#f59e0b',
    'Calculator',
    ['calculator', 'calc', 'math'],
    { isSystemApp: true, packageAliases: ['com.android.calculator2'] }
  ),
  createCatalogApp(
    'Settings',
    'com.android.settings',
    'utilities',
    '#64748b',
    'Settings',
    ['settings', 'configuration', 'android', 'system'],
    { isSystemApp: true }
  ),
  createCatalogApp(
    'Clock',
    'com.google.android.deskclock',
    'utilities',
    '#0284c7',
    'Clock',
    ['clock', 'alarm', 'timer', 'stopwatch'],
    { isSystemApp: true, packageAliases: ['com.android.deskclock'] }
  ),

  // ==========================================
  // THE 50 REQUIRED APPLICATION ENTRIES
  // ==========================================

  // 1. WhatsApp
  createCatalogApp(
    'WhatsApp',
    'com.whatsapp',
    'communication',
    '#25d366',
    'MessageCircle',
    ['whatsapp', 'chat', 'message', 'call', 'wa', 'status'],
    { packageAliases: ['com.whatsapp.w4b'], webFallbackIntent: 'https://web.whatsapp.com' }
  ),

  // 2. Instagram
  createCatalogApp(
    'Instagram',
    'com.instagram.android',
    'social',
    '#e1306c',
    'Camera',
    ['instagram', 'ig', 'reels', 'photos', 'stories', 'meta'],
    { packageAliases: ['com.instagram.lite'], webFallbackIntent: 'https://instagram.com' }
  ),

  // 3. YouTube
  createCatalogApp(
    'YouTube',
    'com.google.android.youtube',
    'media',
    '#ef4444',
    'Youtube',
    ['youtube', 'video', 'stream', 'google', 'yt', 'shorts'],
    { webFallbackIntent: 'https://youtube.com' }
  ),

  // 4. PhonePe
  createCatalogApp(
    'PhonePe',
    'com.phonepe.app',
    'finance',
    '#5f259f',
    'CreditCard',
    ['phonepe', 'upi', 'payment', 'money', 'transfer', 'recharge', 'bills'],
    { webFallbackIntent: 'https://www.phonepe.com' }
  ),

  // 5. Google Pay
  createCatalogApp(
    'Google Pay',
    'com.google.android.apps.nbu.paisa.user',
    'finance',
    '#1a73e8',
    'Wallet',
    ['google pay', 'gpay', 'upi', 'payment', 'money', 'tez'],
    { packageAliases: ['com.google.android.apps.walletnfcrel'], webFallbackIntent: 'https://pay.google.com' }
  ),

  // 6. Facebook
  createCatalogApp(
    'Facebook',
    'com.facebook.katana',
    'social',
    '#1877f2',
    'Share2',
    ['facebook', 'fb', 'social', 'meta', 'friends', 'groups'],
    { packageAliases: ['com.facebook.lite'], webFallbackIntent: 'https://facebook.com' }
  ),

  // 7. Flipkart
  createCatalogApp(
    'Flipkart',
    'com.flipkart.android',
    'shopping',
    '#2874f0',
    'ShoppingBag',
    ['flipkart', 'shopping', 'ecommerce', 'deals', 'electronics', 'fashion'],
    { webFallbackIntent: 'https://flipkart.com' }
  ),

  // 8. Amazon
  createCatalogApp(
    'Amazon',
    'com.amazon.mShop.android.shopping',
    'shopping',
    '#ff9900',
    'ShoppingCart',
    ['amazon', 'shopping', 'prime', 'orders', 'ecommerce'],
    { packageAliases: ['in.amazon.mShop.android.shopping'], webFallbackIntent: 'https://amazon.in' }
  ),

  // 9. Truecaller
  createCatalogApp(
    'Truecaller',
    'com.truecaller',
    'communication',
    '#0087ff',
    'Phone',
    ['truecaller', 'caller id', 'spam', 'block', 'dialer', 'contacts'],
    { webFallbackIntent: 'https://www.truecaller.com' }
  ),

  // 10. Google Maps
  createCatalogApp(
    'Google Maps',
    'com.google.android.apps.maps',
    'utilities',
    '#34a853',
    'MapPin',
    ['google maps', 'maps', 'gps', 'navigation', 'traffic', 'directions'],
    { packageAliases: ['com.google.android.apps.mapslite'], webFallbackIntent: 'https://maps.google.com' }
  ),

  // 11. Snapchat
  createCatalogApp(
    'Snapchat',
    'com.snapchat.android',
    'social',
    '#fffc00',
    'Ghost',
    ['snapchat', 'snap', 'filters', 'streaks', 'stories'],
    { webFallbackIntent: 'https://web.snapchat.com' }
  ),

  // 12. Paytm
  createCatalogApp(
    'Paytm',
    'net.one97.paytm',
    'finance',
    '#00b9f5',
    'DollarSign',
    ['paytm', 'upi', 'wallet', 'bank', 'recharge', 'ticket'],
    { webFallbackIntent: 'https://paytm.com' }
  ),

  // 13. Zomato
  createCatalogApp(
    'Zomato',
    'com.application.zomato',
    'lifestyle',
    '#cb202d',
    'Utensils',
    ['zomato', 'food', 'delivery', 'restaurant', 'order food', 'dining'],
    { webFallbackIntent: 'https://zomato.com' }
  ),

  // 14. Swiggy
  createCatalogApp(
    'Swiggy',
    'in.swiggy.android',
    'lifestyle',
    '#fc8019',
    'UtensilsCrossed',
    ['swiggy', 'food', 'delivery', 'instamart', 'dineout', 'groceries'],
    { webFallbackIntent: 'https://swiggy.com' }
  ),

  // 15. Blinkit
  createCatalogApp(
    'Blinkit',
    'com.grofers.customerapp',
    'shopping',
    '#f8cb46',
    'Truck',
    ['blinkit', 'grofers', 'grocery', '10 minutes', 'quick commerce', 'essentials'],
    { webFallbackIntent: 'https://blinkit.com' }
  ),

  // 16. JioCinema
  createCatalogApp(
    'JioCinema',
    'com.jio.media.ondemand',
    'entertainment',
    '#d9006c',
    'Tv',
    ['jiocinema', 'movies', 'cricket', 'ipl', 'web series', 'streaming', 'hbo'],
    { webFallbackIntent: 'https://jiocinema.com' }
  ),

  // 17. Spotify
  createCatalogApp(
    'Spotify',
    'com.spotify.music',
    'media',
    '#1db954',
    'Music',
    ['spotify', 'music', 'podcast', 'songs', 'playlist', 'audio'],
    { packageAliases: ['com.spotify.lite'], webFallbackIntent: 'https://open.spotify.com' }
  ),

  // 18. Telegram
  createCatalogApp(
    'Telegram',
    'org.telegram.messenger',
    'communication',
    '#26a5e4',
    'Send',
    ['telegram', 'tg', 'chat', 'channel', 'group', 'messaging'],
    { packageAliases: ['org.telegram.messenger.web', 'org.thunderdog.challegram'], webFallbackIntent: 'https://web.telegram.org' }
  ),

  // 19. Meesho
  createCatalogApp(
    'Meesho',
    'com.meesho.supply',
    'shopping',
    '#f43397',
    'ShoppingBag',
    ['meesho', 'shopping', 'reselling', 'clothing', 'fashion', 'budget'],
    { webFallbackIntent: 'https://meesho.com' }
  ),

  // 20. Disney+ Hotstar
  createCatalogApp(
    'Disney+ Hotstar',
    'in.startv.hotstar',
    'entertainment',
    '#1259c3',
    'Film',
    ['hotstar', 'disney', 'disney+', 'cricket', 'ipl', 'marvel', 'streaming'],
    { packageAliases: ['in.startv.hotstar.dplus'], webFallbackIntent: 'https://hotstar.com' }
  ),

  // 21. DigiLocker
  createCatalogApp(
    'DigiLocker',
    'com.digilocker.android',
    'utilities',
    '#0c4da2',
    'FileCheck',
    ['digilocker', 'documents', 'aadhaar', 'pan card', 'driving license', 'government', 'india'],
    { webFallbackIntent: 'https://digilocker.gov.in' }
  ),

  // 22. IRCTC Rail Connect
  createCatalogApp(
    'IRCTC Rail Connect',
    'cris.org.in.prs.ima',
    'utilities',
    '#f26522',
    'TrainTrack',
    ['irctc', 'train', 'railway', 'ticket', 'booking', 'pnr', 'reservation'],
    { webFallbackIntent: 'https://irctc.co.in' }
  ),

  // 23. Uber
  createCatalogApp(
    'Uber',
    'com.ubercab',
    'lifestyle',
    '#000000',
    'Navigation',
    ['uber', 'cab', 'taxi', 'ride', 'travel', 'car'],
    { packageAliases: ['com.ubercab.uberlite'], webFallbackIntent: 'https://uber.com' }
  ),

  // 24. Ola
  createCatalogApp(
    'Ola',
    'com.olacabs.customer',
    'lifestyle',
    '#9acd32',
    'Compass',
    ['ola', 'cab', 'auto', 'bike', 'taxi', 'ride'],
    { packageAliases: ['com.olacabs.consumer'], webFallbackIntent: 'https://olacabs.com' }
  ),

  // 25. Rapido
  createCatalogApp(
    'Rapido',
    'com.rapido.passenger',
    'lifestyle',
    '#f9a825',
    'Bike',
    ['rapido', 'bike taxi', 'auto', 'ride', 'travel'],
    { webFallbackIntent: 'https://rapido.bike' }
  ),

  // 26. Zepto
  createCatalogApp(
    'Zepto',
    'com.zeptoconsumerapp',
    'shopping',
    '#5200ff',
    'Zap',
    ['zepto', 'grocery', '10 min delivery', 'quick delivery', 'vegetables'],
    { webFallbackIntent: 'https://zeptonow.com' }
  ),

  // 27. Myntra
  createCatalogApp(
    'Myntra',
    'com.myntra.android',
    'shopping',
    '#ff3f6c',
    'Shirt',
    ['myntra', 'fashion', 'clothes', 'shoes', 'brands', 'online shopping'],
    { webFallbackIntent: 'https://myntra.com' }
  ),

  // 28. X (Twitter)
  createCatalogApp(
    'X (Twitter)',
    'com.twitter.android',
    'social',
    '#000000',
    'Hash',
    ['x', 'twitter', 'tweet', 'news', 'trending', 'social'],
    { packageAliases: ['com.twitter.android.lite'], webFallbackIntent: 'https://x.com' }
  ),

  // 29. LinkedIn
  createCatalogApp(
    'LinkedIn',
    'com.linkedin.android',
    'social',
    '#0a66c2',
    'Briefcase',
    ['linkedin', 'jobs', 'professional', 'career', 'networking', 'resume'],
    { packageAliases: ['com.linkedin.android.lite'], webFallbackIntent: 'https://linkedin.com' }
  ),

  // 30. JioSaavn
  createCatalogApp(
    'JioSaavn',
    'com.jio.media.jiobeats',
    'media',
    '#2bc5b4',
    'Headphones',
    ['jiosaavn', 'saavn', 'jio music', 'songs', 'bollywood', 'podcasts'],
    { webFallbackIntent: 'https://jiosaavn.com' }
  ),

  // 31. Wynk Music
  createCatalogApp(
    'Wynk Music',
    'com.bsb.portal',
    'media',
    '#e60000',
    'Radio',
    ['wynk', 'airtel', 'wynk music', 'songs', 'hellotunes', 'music streaming'],
    { webFallbackIntent: 'https://wynk.in' }
  ),

  // 32. YouTube Music
  createCatalogApp(
    'YouTube Music',
    'com.google.android.apps.youtube.music',
    'media',
    '#dc2626',
    'Headphones',
    ['youtube music', 'ytm', 'songs', 'audio', 'stream music'],
    { webFallbackIntent: 'https://music.youtube.com' }
  ),

  // 33. Netflix
  createCatalogApp(
    'Netflix',
    'com.netflix.mediaclient',
    'entertainment',
    '#e50914',
    'Tv',
    ['netflix', 'movies', 'series', 'shows', 'streaming', 'cinema'],
    { webFallbackIntent: 'https://netflix.com' }
  ),

  // 34. Amazon Prime Video
  createCatalogApp(
    'Amazon Prime Video',
    'com.amazon.avod.thirdpartyclient',
    'entertainment',
    '#00a8e1',
    'PlaySquare',
    ['prime video', 'amazon prime', 'movies', 'web series', 'streaming'],
    { webFallbackIntent: 'https://primevideo.com' }
  ),

  // 35. InShot
  createCatalogApp(
    'InShot',
    'com.camerasideas.instashot',
    'media',
    '#ff4d67',
    'Video',
    ['inshot', 'video editor', 'reel editor', 'cut video', 'effects', 'editor'],
    { webFallbackIntent: 'https://inshot.com' }
  ),

  // 36. CapCut
  createCatalogApp(
    'CapCut',
    'com.lemon.lvoverseas',
    'media',
    '#000000',
    'Scissors',
    ['capcut', 'video editor', 'tiktok', 'reels', 'templates', 'effects'],
    { packageAliases: ['com.lemon.kcard'], webFallbackIntent: 'https://capcut.com' }
  ),

  // 37. Canva
  createCatalogApp(
    'Canva',
    'com.canva.editor',
    'productivity',
    '#00c4cc',
    'PenTool',
    ['canva', 'design', 'graphic', 'poster', 'thumbnail', 'presentation'],
    { webFallbackIntent: 'https://canva.com' }
  ),

  // 38. ChatGPT
  createCatalogApp(
    'ChatGPT',
    'com.openai.chatgpt',
    'productivity',
    '#10a37f',
    'Bot',
    ['chatgpt', 'openai', 'ai', 'chatbot', 'assistant', 'prompt'],
    { webFallbackIntent: 'https://chat.openai.com' }
  ),

  // 39. Adobe Scan
  createCatalogApp(
    'Adobe Scan',
    'com.adobe.scan.android',
    'productivity',
    '#fa0f00',
    'ScanLine',
    ['adobe scan', 'scanner', 'pdf', 'document scanner', 'ocr', 'adobe'],
    { webFallbackIntent: 'https://adobe.com/acrobat/mobile/scanner-app.html' }
  ),

  // 40. Pinterest
  createCatalogApp(
    'Pinterest',
    'com.pinterest',
    'social',
    '#e60023',
    'Pin',
    ['pinterest', 'ideas', 'photos', 'recipes', 'decor', 'pins'],
    { webFallbackIntent: 'https://pinterest.com' }
  ),

  // 41. Messenger
  createCatalogApp(
    'Messenger',
    'com.facebook.orca',
    'communication',
    '#0084ff',
    'MessageSquare',
    ['messenger', 'facebook messenger', 'fb chat', 'calls', 'meta'],
    { packageAliases: ['com.facebook.mlite'], webFallbackIntent: 'https://messenger.com' }
  ),

  // 42. mAadhaar
  createCatalogApp(
    'mAadhaar',
    'in.gov.uidai.myaadhaar',
    'utilities',
    '#005a9c',
    'ShieldCheck',
    ['maadhaar', 'aadhaar', 'uidai', 'identity', 'government', 'india'],
    { packageAliases: ['in.gov.uidai.mAadhaarPlus'], webFallbackIntent: 'https://myaadhaar.uidai.gov.in' }
  ),

  // 43. MakeMyTrip
  createCatalogApp(
    'MakeMyTrip',
    'com.makemytrip',
    'lifestyle',
    '#ea2327',
    'Plane',
    ['makemytrip', 'mmt', 'flights', 'hotels', 'trains', 'travel', 'holiday'],
    { webFallbackIntent: 'https://makemytrip.com' }
  ),

  // 44. BookMyShow
  createCatalogApp(
    'BookMyShow',
    'com.bt.bms',
    'entertainment',
    '#e51837',
    'Ticket',
    ['bookmyshow', 'bms', 'movies', 'cinema', 'tickets', 'events', 'plays'],
    { webFallbackIntent: 'https://bookmyshow.com' }
  ),

  // 45. Nykaa
  createCatalogApp(
    'Nykaa',
    'com.fsn.nykaa',
    'shopping',
    '#fc2779',
    'Sparkles',
    ['nykaa', 'beauty', 'cosmetics', 'makeup', 'skincare', 'fashion'],
    { webFallbackIntent: 'https://nykaa.com' }
  ),

  // 46. AJIO
  createCatalogApp(
    'AJIO',
    'com.ril.ajio',
    'shopping',
    '#2c4152',
    'ShoppingBag',
    ['ajio', 'reliance', 'fashion', 'clothing', 'trends', 'shopping'],
    { webFallbackIntent: 'https://ajio.com' }
  ),

  // 47. Lenskart
  createCatalogApp(
    'Lenskart',
    'com.lenskart.app',
    'shopping',
    '#000042',
    'Glasses',
    ['lenskart', 'glasses', 'eyewear', 'sunglasses', 'frames', 'contact lens'],
    { webFallbackIntent: 'https://lenskart.com' }
  ),

  // 48. BigBasket
  createCatalogApp(
    'BigBasket',
    'com.bigbasket.mobileapp',
    'shopping',
    '#84c225',
    'ShoppingBasket',
    ['bigbasket', 'bb', 'groceries', 'supermarket', 'fruits', 'tata'],
    { webFallbackIntent: 'https://bigbasket.com' }
  ),

  // 49. Google Drive
  createCatalogApp(
    'Google Drive',
    'com.google.android.apps.docs',
    'productivity',
    '#1fa463',
    'HardDrive',
    ['google drive', 'drive', 'cloud storage', 'docs', 'backup', 'files'],
    { packageAliases: ['com.google.android.apps.docs.editors.sheets', 'com.google.android.apps.docs.editors.docs'], webFallbackIntent: 'https://drive.google.com' }
  ),

  // 50. YONO SBI
  createCatalogApp(
    'YONO SBI',
    'com.sbi.lotusintouch',
    'finance',
    '#280071',
    'Landmark',
    ['yono', 'sbi', 'state bank of india', 'net banking', 'upi', 'yono sbi'],
    { webFallbackIntent: 'https://www.yonobusiness.sbi' }
  ),
];

/**
 * Extended App Catalog (22 additional applications outside the canonical 56 catalog).
 * Kept strictly separate from the canonical 56 apps with catalogType: 'extended'.
 * Initially their icon status is 'not_uploaded' and icon asset is null.
 * When an icon is uploaded or attached, it automatically transitions to 'available'.
 */
export const EXTENDED_CATALOG_APPS: CatalogApp[] = [
  // 1. Google
  createExtendedApp(
    'ext-google',
    'Google',
    'google',
    'com.google.android.googlequicksearchbox',
    'utilities',
    '#4285F4',
    'Search',
    ['google search', 'google app', 'search', 'quick search box', 'assistant'],
    { packageAliases: ['com.google.android.apps.searchlite'], webFallbackIntent: 'https://google.com' }
  ),

  // 2. Gmail
  createExtendedApp(
    'ext-gmail',
    'Gmail',
    'gmail',
    'com.google.android.gm',
    'communication',
    '#EA4335',
    'Mail',
    ['google mail', 'email', 'inbox', 'webmail'],
    { packageAliases: ['com.google.android.email'], webFallbackIntent: 'https://mail.google.com' }
  ),

  // 3. Google Photos
  createExtendedApp(
    'ext-google-photos',
    'Google Photos',
    'google-photos',
    'com.google.android.apps.photos',
    'media',
    '#FBBC05',
    'Image',
    ['photos', 'google gallery', 'cloud photos', 'google pictures', 'backup photos'],
    { packageAliases: ['com.google.android.gallery'], webFallbackIntent: 'https://photos.google.com' }
  ),

  // 4. Google Play Store
  createExtendedApp(
    'ext-google-play-store',
    'Google Play Store',
    'google-play-store',
    'com.android.vending',
    'utilities',
    '#00875F',
    'ShoppingBag',
    ['play store', 'playstore', 'google play', 'android market', 'store', 'apps'],
    { packageAliases: ['com.google.android.feedback'], webFallbackIntent: 'https://play.google.com' }
  ),

  // 5. Discord
  createExtendedApp(
    'ext-discord',
    'Discord',
    'discord',
    'com.discord',
    'communication',
    '#5865F2',
    'MessageSquare',
    ['discord chat', 'discord servers', 'voice chat', 'discord app'],
    { packageAliases: ['com.discord.canary', 'com.discord.ptb'], webFallbackIntent: 'https://discord.com' }
  ),

  // 6. Reddit
  createExtendedApp(
    'ext-reddit',
    'Reddit',
    'reddit',
    'com.reddit.frontpage',
    'social',
    '#FF4500',
    'Compass',
    ['reddit frontpage', 'subreddits', 'reddit official', 'community'],
    { packageAliases: ['com.reddit.app'], webFallbackIntent: 'https://reddit.com' }
  ),

  // 7. GitHub
  createExtendedApp(
    'ext-github',
    'GitHub',
    'github',
    'com.github.android',
    'developer',
    '#24292E',
    'Code2',
    ['github mobile', 'git', 'github app', 'repositories', 'code'],
    { webFallbackIntent: 'https://github.com' }
  ),

  // 8. Gemini
  createExtendedApp(
    'ext-gemini',
    'Gemini',
    'gemini',
    'com.google.android.apps.bard',
    'productivity',
    '#8AB4F8',
    'Sparkles',
    ['google gemini', 'bard', 'gemini ai', 'google ai', 'gemini advanced'],
    { packageAliases: ['com.google.android.apps.gemini'], webFallbackIntent: 'https://gemini.google.com' }
  ),

  // 9. Google AI Studio
  createExtendedApp(
    'ext-google-ai-studio',
    'Google AI Studio',
    'google-ai-studio',
    'com.google.android.apps.aistudio',
    'developer',
    '#4285F4',
    'Cpu',
    ['ai studio', 'google aistudio', 'maker suite', 'makersuite', 'developer console', 'api keys'],
    { packageAliases: ['com.google.aistudio.pwa'], webFallbackIntent: 'https://aistudio.google.com' }
  ),

  // 10. Microsoft Copilot
  createExtendedApp(
    'ext-microsoft-copilot',
    'Microsoft Copilot',
    'microsoft-copilot',
    'com.microsoft.copilot',
    'productivity',
    '#0078D4',
    'Sparkles',
    ['copilot', 'ms copilot', 'bing copilot', 'microsoft ai', 'copilot chat'],
    { packageAliases: ['com.microsoft.bing.copilot'], webFallbackIntent: 'https://copilot.microsoft.com' }
  ),

  // 11. Microsoft Word
  createExtendedApp(
    'ext-microsoft-word',
    'Microsoft Word',
    'microsoft-word',
    'com.microsoft.office.word',
    'productivity',
    '#2B579A',
    'FileText',
    ['word', 'ms word', 'office word', 'docs', 'docx reader', 'word processor'],
    { packageAliases: ['com.microsoft.office.word.preview'], webFallbackIntent: 'https://office.com/word' }
  ),

  // 12. Microsoft Excel
  createExtendedApp(
    'ext-microsoft-excel',
    'Microsoft Excel',
    'microsoft-excel',
    'com.microsoft.office.excel',
    'productivity',
    '#217346',
    'Table',
    ['excel', 'ms excel', 'office excel', 'spreadsheet', 'xlsx reader', 'sheets'],
    { packageAliases: ['com.microsoft.office.excel.preview'], webFallbackIntent: 'https://office.com/excel' }
  ),

  // 13. Microsoft PowerPoint
  createExtendedApp(
    'ext-microsoft-powerpoint',
    'Microsoft PowerPoint',
    'microsoft-powerpoint',
    'com.microsoft.office.powerpoint',
    'productivity',
    '#D24726',
    'Presentation',
    ['powerpoint', 'ms powerpoint', 'ppt', 'pptx', 'slides', 'presentations'],
    { packageAliases: ['com.microsoft.office.powerpoint.preview'], webFallbackIntent: 'https://office.com/powerpoint' }
  ),

  // 14. Zoom
  createExtendedApp(
    'ext-zoom',
    'Zoom',
    'zoom',
    'us.zoom.videomeetings',
    'communication',
    '#0B5CFF',
    'Video',
    ['zoom meetings', 'zoom workplace', 'zoom video', 'video conference'],
    { packageAliases: ['us.zoom.config'], webFallbackIntent: 'https://zoom.us' }
  ),

  // 15. Google Meet
  createExtendedApp(
    'ext-google-meet',
    'Google Meet',
    'google-meet',
    'com.google.android.apps.tachyon',
    'communication',
    '#00897B',
    'Video',
    ['meet', 'google duo', 'duo', 'video calls', 'google meetings'],
    { packageAliases: ['com.google.android.apps.meetings'], webFallbackIntent: 'https://meet.google.com' }
  ),

  // 16. Google Classroom
  createExtendedApp(
    'ext-google-classroom',
    'Google Classroom',
    'google-classroom',
    'com.google.android.apps.classroom',
    'productivity',
    '#25A267',
    'GraduationCap',
    ['classroom', 'google class', 'school', 'assignments', 'education'],
    { webFallbackIntent: 'https://classroom.google.com' }
  ),

  // 17. Notion
  createExtendedApp(
    'ext-notion',
    'Notion',
    'notion',
    'notion.id',
    'productivity',
    '#000000',
    'BookOpen',
    ['notion notes', 'notion workspace', 'docs', 'wiki', 'notes'],
    { webFallbackIntent: 'https://notion.so' }
  ),

  // 18. Figma
  createExtendedApp(
    'ext-figma',
    'Figma',
    'figma',
    'com.figma.mirror',
    'developer',
    '#F24E1E',
    'Figma',
    ['figma design', 'figma mirror', 'figjam', 'ui design', 'prototypes'],
    { webFallbackIntent: 'https://figma.com' }
  ),

  // 19. Adobe Acrobat
  createExtendedApp(
    'ext-adobe-acrobat',
    'Adobe Acrobat',
    'adobe-acrobat',
    'com.adobe.reader',
    'productivity',
    '#FA0F00',
    'FileText',
    ['acrobat', 'adobe reader', 'acrobat reader', 'pdf reader', 'adobe pdf', 'pdf viewer'],
    { webFallbackIntent: 'https://acrobat.adobe.com' }
  ),

  // 20. VLC
  createExtendedApp(
    'ext-vlc',
    'VLC',
    'vlc',
    'org.videolan.vlc',
    'media',
    '#FF8800',
    'Film',
    ['vlc media player', 'videolan', 'vlc player', 'video player', 'audio player'],
    { webFallbackIntent: 'https://videolan.org' }
  ),

  // 21. Calendar
  createExtendedApp(
    'ext-calendar',
    'Calendar',
    'calendar',
    'com.google.android.calendar',
    'utilities',
    '#4285F4',
    'Calendar',
    ['google calendar', 'calendar app', 'events', 'schedule', 'agenda'],
    { packageAliases: ['com.android.calendar'], webFallbackIntent: 'https://calendar.google.com' }
  ),

  // 22. Files / File Manager
  createExtendedApp(
    'ext-files',
    'Files / File Manager',
    'files',
    'com.google.android.apps.nbu.files',
    'utilities',
    '#1A73E8',
    'Folder',
    ['files by google', 'files app', 'file manager', 'my files', 'storage', 'documentsui'],
    { packageAliases: ['com.android.documentsui', 'com.google.android.documentsui'] }
  ),
];

export class AppCatalogService {
  private static apps: CatalogApp[] | null = null;
  private static listeners: Set<() => void> = new Set();

  /**
   * Return all catalog apps from persistent store or seeds, ensuring seeds & extended apps are merged
   */
  static getAllApps(): CatalogApp[] {
    if (this.apps) return this.apps;

    let storedApps: CatalogApp[] = [];
    if (typeof window !== 'undefined') {
      try {
        const raw =
          localStorage.getItem(STORAGE_CATALOG_KEY) ||
          localStorage.getItem('oneva_app_catalog_v8') ||
          localStorage.getItem('oneva_app_catalog_v7');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            storedApps = parsed;
          }
        }
      } catch (err) {
        console.warn('[AppCatalogService] Failed to load cached catalog:', err);
      }
    }

    // Merge: ensure all seed apps and extended apps exist, update with stored custom apps/assets
    const map = new Map<string, CatalogApp>();

    // 1. Put canonical seed apps first (56 canonical apps)
    for (const seed of SEED_CATALOG_APPS) {
      map.set(seed.packageName.toLowerCase(), seed);
    }

    // 2. Put extended apps next (22 extended apps)
    for (const ext of EXTENDED_CATALOG_APPS) {
      map.set(ext.packageName.toLowerCase(), ext);
    }

    // 3. Overlay any stored updates or custom admin-added apps
    for (const stored of storedApps) {
      const key = (stored.packageName || stored.id || '').toLowerCase();
      if (!key) continue;
      const existing = map.get(key);
      if (existing) {
        map.set(key, {
          ...existing,
          ...stored,
          catalogType: existing.catalogType || stored.catalogType || 'canonical',
          // Preserve uploaded icon asset & status if user/admin uploaded an icon
          iconStatus: stored.iconStatus || existing.iconStatus,
          iconAsset: stored.iconAsset || existing.iconAsset,
          name: stored.name || existing.name,
          appName: stored.appName || stored.name || existing.name,
          displayName: stored.displayName || existing.displayName || stored.name,
          normalizedName: stored.normalizedName || existing.normalizedName,
          aliases: stored.aliases || existing.aliases,
          iconKey: stored.iconKey || existing.iconKey,
          iconPath: stored.iconPath || existing.iconPath,
          packageAliases: stored.packageAliases || existing.packageAliases,
          capabilities: stored.capabilities || existing.capabilities,
          actions: stored.actions || existing.actions,
          status: stored.status || existing.status,
          supported: stored.supported ?? true,
          enabled: stored.enabled ?? (stored.status === 'active'),
        });
      } else {
        // Custom app added by admin
        const iconKey = stored.iconKey || CatalogIconHelper.normalizeToSvgFilename(stored.name);
        map.set(key, {
          ...stored,
          catalogType: stored.catalogType || 'custom',
          iconStatus: stored.iconStatus || 'available',
          appName: stored.appName || stored.name,
          displayName: stored.displayName || stored.name,
          normalizedName: stored.normalizedName || iconKey.replace(/\.svg$/i, ''),
          aliases: stored.aliases || stored.packageAliases || [],
          iconKey,
          iconPath: stored.iconPath || `/icons/${iconKey}`,
          supported: stored.supported ?? true,
          enabled: stored.enabled ?? (stored.status === 'active'),
        });
      }
    }

    this.apps = Array.from(map.values());
    this.persistLocal();
    return this.apps;
  }

  /**
   * Return the exact 56 canonical apps
   */
  static getCanonicalApps(): CatalogApp[] {
    return this.getAllApps().filter((a) => a.catalogType === 'canonical' || !a.catalogType);
  }

  /**
   * Return the 22 extended apps
   */
  static getExtendedApps(): CatalogApp[] {
    return this.getAllApps().filter((a) => a.catalogType === 'extended');
  }

  /**
   * Return custom admin-added apps
   */
  static getCustomApps(): CatalogApp[] {
    return this.getAllApps().filter((a) => a.catalogType === 'custom');
  }

  /**
   * Return structured catalog breakdown
   */
  static getAppCatalogStructure(): UnifiedAppCatalogStructure {
    const canonicalApps = this.getCanonicalApps();
    const extendedApps = this.getExtendedApps();
    const customApps = this.getCustomApps();
    return {
      canonicalApps,
      extendedApps,
      customApps,
      totalCapacity: canonicalApps.length + extendedApps.length + customApps.length,
    };
  }

  /**
   * Count of canonical apps (56)
   */
  static getCanonicalCatalogCount(): number {
    return this.getCanonicalApps().length;
  }

  /**
   * Count of extended apps (22)
   */
  static getExtendedCatalogCount(): number {
    return this.getExtendedApps().length;
  }

  /**
   * Total catalog capacity (canonical + extended + custom)
   */
  static getTotalCatalogCapacity(): number {
    return this.getAllApps().length;
  }

  /**
   * Get active apps for launcher / user presentation
   */
  static getActiveApps(): CatalogApp[] {
    return this.getAllApps().filter((a) => a.status === 'active' && a.enabled !== false);
  }

  /**
   * Returns the finalized 50-app catalog defined for ONEVA Icon Packs
   * and individual app customization (the 50 target applications).
   */
  static getFinalizedCatalogApps(): CatalogApp[] {
    const canonical = this.getCanonicalApps();
    const target50 = canonical.filter(
      (a) =>
        a.packageName !== 'com.oneva.android.launcher' &&
        a.packageName !== 'io.oneva.android.launcher' &&
        a.packageName !== 'com.android.settings' &&
        a.packageName !== 'com.google.android.deskclock' &&
        a.packageName !== 'com.android.camera' &&
        a.packageName !== 'com.google.android.calculator'
    );
    return target50.slice(0, 50);
  }

  /**
   * Returns the count of finalized catalog apps (50).
   */
  static getFinalizedCatalogCount(): number {
    return this.getFinalizedCatalogApps().length || 50;
  }

  /**
   * Find app by package name or package alias
   */
  static getAppByPackage(packageName: string): CatalogApp | undefined {
    if (!packageName) return undefined;
    const norm = packageName.trim().toLowerCase();
    return this.getAllApps().find((a) => {
      if (a.packageName.toLowerCase() === norm) return true;
      if (a.packageAliases && a.packageAliases.some((alias) => alias.toLowerCase() === norm)) {
        return true;
      }
      return false;
    });
  }

  /**
   * Find app by stable internal ID
   */
  static getAppById(id: string): CatalogApp | undefined {
    if (!id) return undefined;
    const norm = id.trim().toLowerCase();
    return this.getAllApps().find(
      (a) => a.id.toLowerCase() === norm || a.packageName.toLowerCase() === norm
    );
  }

  /**
   * Robust multi-attribute app lookup (ID, package, normalized name, display name, aliases)
   */
  static findAppByAnyIdentifier(query: string): CatalogApp | undefined {
    if (!query) return undefined;
    const norm = query.trim().toLowerCase();
    const clean = norm.replace(/[^a-z0-9]/g, '');

    const all = this.getAllApps();

    // 1. Direct ID / package match
    let match = all.find(
      (a) => a.id.toLowerCase() === norm || a.packageName.toLowerCase() === norm
    );
    if (match) return match;

    // 2. Normalized name match
    match = all.find((a) => a.normalizedName?.toLowerCase() === norm);
    if (match) return match;

    // 3. Name / DisplayName match
    match = all.find(
      (a) =>
        a.name.toLowerCase() === norm ||
        a.displayName?.toLowerCase() === norm ||
        a.name.toLowerCase().replace(/[^a-z0-9]/g, '') === clean
    );
    if (match) return match;

    // 4. Aliases match
    match = all.find(
      (a) =>
        a.aliases?.some((al) => al.toLowerCase() === norm) ||
        a.packageAliases?.some((p) => p.toLowerCase() === norm)
    );
    if (match) return match;

    // 5. Search keywords match
    match = all.find((a) =>
      a.searchKeywords?.some((k) => k.toLowerCase() === norm || k.toLowerCase().replace(/[^a-z0-9]/g, '') === clean)
    );
    return match;
  }

  /**
   * Attach an uploaded icon asset (SVG, PNG, JPG) to an app in the catalog.
   * Automatically transitions status from "not_uploaded" to "available".
   */
  static async attachIconAsset(
    identifier: string,
    asset: IconAssetReference
  ): Promise<{ success: boolean; app?: CatalogApp; error?: string }> {
    const all = this.getAllApps();
    const app = this.findAppByAnyIdentifier(identifier);

    if (!app) {
      return { success: false, error: `App "${identifier}" not found in catalog.` };
    }

    app.iconAsset = asset;
    app.iconStatus = 'available';
    if (asset.url || asset.dataUrl) {
      app.icon = asset.url || asset.dataUrl;
      app.iconPath = asset.url || asset.dataUrl;
    }
    app.updatedAt = new Date().toISOString();

    const idx = all.findIndex((a) => a.id === app.id);
    if (idx !== -1) {
      all[idx] = { ...app };
      this.apps = [...all];
    }

    this.persistLocal();
    this.notify();

    // Sync to Supabase if connected
    this.syncToSupabase(app).catch((err) => {
      console.warn('[AppCatalogService] Supabase attach icon note:', err);
    });

    return { success: true, app };
  }

  /**
   * Add a new extended app dynamically without code changes or APK update
   */
  static async addExtendedApp(newApp: {
    displayName: string;
    packageName?: string;
    category?: CatalogAppCategory;
    accentColor?: string;
    defaultIcon?: string;
    aliases?: string[];
    webFallbackIntent?: string;
  }): Promise<{ success: boolean; app?: CatalogApp; error?: string }> {
    const all = this.getAllApps();
    const displayName = newApp.displayName.trim();
    if (!displayName) {
      return { success: false, error: 'App display name is required.' };
    }

    const normalizedName = displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const stableId = `ext-${normalizedName}`;
    const pkg = newApp.packageName?.trim().toLowerCase() || `com.oneva.ext.${normalizedName}`;

    if (all.some((a) => a.id === stableId || (newApp.packageName && a.packageName === pkg))) {
      return { success: false, error: `App with ID "${stableId}" or package "${pkg}" already exists.` };
    }

    const created = createExtendedApp(
      stableId,
      displayName,
      normalizedName,
      pkg,
      newApp.category || 'utilities',
      newApp.accentColor || '#38bdf8',
      newApp.defaultIcon || 'Smartphone',
      newApp.aliases || [],
      { webFallbackIntent: newApp.webFallbackIntent }
    );

    all.push(created);
    this.apps = [...all];
    this.persistLocal();
    this.notify();

    this.syncToSupabase(created).catch((err) => {
      console.warn('[AppCatalogService] Supabase add extended app note:', err);
    });

    return { success: true, app: created };
  }

  /**
   * Search apps by query (name, package, category, keywords, catalogType)
   */
  static searchApps(
    query: string,
    filterCategory: CatalogAppCategory | 'all' = 'all',
    statusFilter: 'all' | 'active' | 'disabled' = 'all',
    catalogTypeFilter: 'all' | 'canonical' | 'extended' | 'custom' = 'all'
  ): CatalogApp[] {
    const q = query.trim().toLowerCase();
    const all = this.getAllApps();

    return all.filter((app) => {
      // Catalog type filter
      if (catalogTypeFilter !== 'all') {
        const appType = app.catalogType || 'canonical';
        if (appType !== catalogTypeFilter) return false;
      }

      // Category filter
      if (filterCategory !== 'all' && app.category !== filterCategory) return false;

      // Status filter
      if (statusFilter !== 'all' && app.status !== statusFilter) return false;

      // Search match
      if (!q) return true;

      const matchName =
        app.name.toLowerCase().includes(q) ||
        (app.appName && app.appName.toLowerCase().includes(q)) ||
        (app.displayName && app.displayName.toLowerCase().includes(q));
      const matchPkg = app.packageName.toLowerCase().includes(q);
      const matchAliases =
        app.packageAliases?.some((p) => p.toLowerCase().includes(q)) ||
        app.aliases?.some((al) => al.toLowerCase().includes(q));
      const matchCat = app.category.toLowerCase().includes(q);
      const matchKeywords = app.searchKeywords?.some((k) => k.toLowerCase().includes(q));
      const matchIconKey = app.iconKey?.toLowerCase().includes(q);

      return matchName || matchPkg || matchAliases || matchCat || matchKeywords || matchIconKey;
    });
  }

  /**
   * Admin: Add a new app to the catalog with automatic normalized SVG key generation
   */
  static async addApp(appData: {
    name: string;
    packageName: string;
    category: CatalogAppCategory;
    status?: 'active' | 'disabled';
    packageAliases?: string[];
    defaultIcon?: string;
    accentColor?: string;
    searchKeywords?: string[];
    isSystemApp?: boolean;
    webFallbackIntent?: string;
    capabilities?: string[];
    actions?: string[];
  }): Promise<{ success: boolean; app?: CatalogApp; error?: string }> {
    const trimmedPkg = appData.packageName.trim().toLowerCase();
    if (!trimmedPkg) {
      return { success: false, error: 'Package name cannot be empty.' };
    }

    if (!appData.name.trim()) {
      return { success: false, error: 'Application name cannot be empty.' };
    }

    const existing = this.getAppByPackage(trimmedPkg);
    if (existing) {
      return { success: false, error: `An app with package name "${trimmedPkg}" already exists in catalog.` };
    }

    const now = new Date().toISOString();
    const cleanName = appData.name.trim();
    const iconKey = CatalogIconHelper.normalizeToSvgFilename(cleanName);
    const iconPath = `/icons/${iconKey}`;
    const initialStatus = appData.status || 'active';

    const newApp: CatalogApp = {
      id: trimmedPkg,
      name: cleanName,
      appName: cleanName,
      packageName: trimmedPkg,
      packageAliases: appData.packageAliases || [],
      category: appData.category,
      defaultIcon: appData.defaultIcon || 'Smartphone',
      defaultIconType: 'lucide',
      icon: appData.defaultIcon || 'Smartphone',
      iconKey,
      iconPath,
      accentColor: appData.accentColor || '#38bdf8',
      fallbackInitial: cleanName.charAt(0).toUpperCase(),
      status: initialStatus,
      supported: true,
      enabled: initialStatus === 'active',
      capabilities: appData.capabilities || ['open_app', 'icon_customization'],
      actions: appData.actions || ['launch', 'override_icon'],
      searchKeywords: appData.searchKeywords || [cleanName.toLowerCase()],
      isSystemApp: Boolean(appData.isSystemApp),
      webFallbackIntent: appData.webFallbackIntent,
      createdAt: now,
      updatedAt: now,
    };

    const current = this.getAllApps();
    this.apps = [newApp, ...current];
    this.persistLocal();
    this.notify();

    // Async sync to Supabase if connected
    this.syncToSupabase(newApp).catch((err) => {
      console.warn('[AppCatalogService] Supabase add app note:', err);
    });

    return { success: true, app: newApp };
  }

  /**
   * Admin: Update app metadata
   */
  static async updateApp(
    packageName: string,
    updates: Partial<Omit<CatalogApp, 'id' | 'packageName' | 'createdAt'>>
  ): Promise<{ success: boolean; app?: CatalogApp; error?: string }> {
    const current = this.getAllApps();
    const idx = current.findIndex((a) => a.packageName.toLowerCase() === packageName.toLowerCase());

    if (idx === -1) {
      return { success: false, error: `App with package "${packageName}" not found.` };
    }

    const existing = current[idx];
    const updatedName = updates.name || existing.name;
    const iconKey = updates.iconKey || existing.iconKey || CatalogIconHelper.normalizeToSvgFilename(updatedName);
    const iconPath = updates.iconPath || existing.iconPath || `/icons/${iconKey}`;

    const updated: CatalogApp = {
      ...existing,
      ...updates,
      name: updatedName,
      appName: updatedName,
      iconKey,
      iconPath,
      enabled: updates.status !== undefined ? updates.status === 'active' : existing.enabled,
      updatedAt: new Date().toISOString(),
    };

    current[idx] = updated;
    this.apps = [...current];
    this.persistLocal();
    this.notify();

    this.syncToSupabase(updated).catch((err) => {
      console.warn('[AppCatalogService] Supabase update app note:', err);
    });

    return { success: true, app: updated };
  }

  /**
   * Admin: Toggle app status (active/disabled)
   */
  static async toggleAppStatus(packageName: string): Promise<{ success: boolean; status: 'active' | 'disabled' }> {
    const app = this.getAppByPackage(packageName);
    if (!app) return { success: false, status: 'disabled' };

    const nextStatus: 'active' | 'disabled' = app.status === 'active' ? 'disabled' : 'active';
    await this.updateApp(packageName, { status: nextStatus, enabled: nextStatus === 'active' });
    return { success: true, status: nextStatus };
  }

  /**
   * Admin: Delete app from catalog
   */
  static async deleteApp(packageName: string): Promise<{ success: boolean; error?: string }> {
    const current = this.getAllApps();
    const filtered = current.filter((a) => a.packageName.toLowerCase() !== packageName.toLowerCase());

    if (filtered.length === current.length) {
      return { success: false, error: `App "${packageName}" not found.` };
    }

    this.apps = filtered;
    this.persistLocal();
    this.notify();

    // Remove from Supabase if connected
    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('app_catalog').delete().eq('package_name', packageName).then();
    }

    return { success: true };
  }

  /**
   * Get all distinct categories
   */
  static getCategories(): CatalogAppCategory[] {
    const all = this.getAllApps();
    const cats = new Set<CatalogAppCategory>();
    for (const a of all) {
      cats.add(a.category);
    }
    return Array.from(cats);
  }

  private static persistLocal(): void {
    if (typeof window !== 'undefined' && this.apps) {
      try {
        const sanitized = this.apps.map((app) => {
          const icon = app.icon;
          if (icon && (icon.length > 25000 || icon.startsWith('blob:'))) {
            return {
              ...app,
              icon: undefined,
              iconAsset: undefined,
            };
          }
          return app;
        });
        localStorage.setItem(STORAGE_CATALOG_KEY, JSON.stringify(sanitized));
      } catch (err) {
        console.warn('[AppCatalogService] Failed to persist catalog:', err);
      }
    }
  }

  private static async syncToSupabase(app: CatalogApp): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      await supabase.from('app_catalog').upsert({
        package_name: app.packageName,
        name: app.name,
        category: app.category,
        default_icon: app.defaultIcon,
        accent_color: app.accentColor,
        status: app.status,
        search_keywords: app.searchKeywords,
        is_system_app: app.isSystemApp,
        web_fallback_intent: app.webFallbackIntent,
        updated_at: app.updatedAt,
      });
    } catch (err) {
      console.warn('[AppCatalogService] Supabase sync error:', err);
    }
  }

  static subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notify(): void {
    for (const l of this.listeners) {
      try {
        l();
      } catch (err) {
        console.error('[AppCatalogService] Listener error:', err);
      }
    }
  }
}
