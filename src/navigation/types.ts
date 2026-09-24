export type PageId =
  | 'home'
  | 'modules'
  | 'launcher'
  | 'modify_apps'
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

export type ModifyAppsSubSection =
  | 'app_list'
  | 'customize'
  | 'preview'
  | 'icons'
  | 'keyboard'
  | 'themes'
  | 'applied';

export interface NavigationRoute {
  page: PageId;
  subSection?: string;
  selectedPackageName?: string;
}
