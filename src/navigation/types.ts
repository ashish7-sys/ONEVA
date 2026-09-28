export type PageId =
  | 'home'
  | 'modules'
  | 'launcher'
  | 'library'
  | 'themes'
  | 'icons'
  | 'icon_packs'
  | 'widgets_system_ui'
  | 'keyboard'
  | 'wallpapers'
  | 'camera'
  | 'assist'
  | 'privacy'
  | 'settings';

export interface NavigationRoute {
  page: PageId;
  subSection?: string;
  selectedPackageName?: string;
}
