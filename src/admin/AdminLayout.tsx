import { useState } from 'react';
import {
  Shield,
  LayoutDashboard,
  Sliders,
  Palette,
  Package,
  Zap,
  Keyboard,
  Image,
  Activity,
  Camera,
  Cpu,
  CheckCircle2,
  AlertOctagon,
  Settings,
  LogOut,
  UserCheck,
  X,
  Shapes,
  Smartphone,
  Star,
} from 'lucide-react';
import { AdminProfile } from '../types';
import { AuthService } from '../services/authService';
import { AdminDashboard } from './AdminDashboard';
import { AdminModifyApps } from './AdminModifyApps';
import { AdminAppCatalog } from './AdminAppCatalog';
import { AdminFullIconPacks } from './AdminFullIconPacks';
import { AdminSingleAppIcons } from './AdminSingleAppIcons';
import { AdminCategoryView } from './AdminCategoryView';
import { OnevaLogo } from '../components/OnevaLogo';
import { AdminPublishedView } from './AdminPublishedView';
import { AdminErrorReports } from './AdminErrorReports';
import { AdminSettings } from './AdminSettings';

interface AdminLayoutProps {
  admin: AdminProfile;
  onSignOut: () => void;
  onExitToApp: () => void;
}

export type AdminTab =
  | 'dashboard'
  | 'app_catalog'
  | 'modify_apps'
  | 'themes'
  | 'icons'
  | 'keyboard'
  | 'wallpapers'
  | 'camera'
  | 'assist'
  | 'published'
  | 'errors'
  | 'settings';

export function AdminLayout({ admin, onSignOut, onExitToApp }: AdminLayoutProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [iconSubSection, setIconSubSection] = useState<'packs' | 'single_apps'>('packs');

  const handleLogout = async () => {
    await AuthService.logoutAdmin();
    onSignOut();
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'app_catalog', label: 'App Catalog', icon: Smartphone },
    { id: 'modify_apps', label: 'Modify Apps', icon: Sliders },
    { id: 'themes', label: 'Themes', icon: Palette },
    { id: 'icons', label: 'Icon Engine', icon: Package },
    { id: 'keyboard', label: 'Keyboard', icon: Keyboard },
    { id: 'wallpapers', label: 'Wallpapers', icon: Image },
    { id: 'camera', label: 'Camera', icon: Camera },
    { id: 'assist', label: 'ONEVA Assist / Jarvis', icon: Cpu },
    { id: 'published', label: 'Published', icon: CheckCircle2 },
    { id: 'errors', label: 'Errors / Reports', icon: AlertOctagon },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <div id="admin-panel-root" className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-neutral-800/80 bg-neutral-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <OnevaLogo
              variant="admin"
              className="border border-white/10 shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-wider text-base text-white">ONEVA</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                  ADMIN CONTROL
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="truncate max-w-[150px] font-mono text-[11px]">{admin.email}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 uppercase">
                {admin.role}
              </span>
            </div>

            <button
              id="admin-cut-close-btn"
              onClick={onExitToApp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 border border-neutral-700/60 transition cursor-pointer"
              title="Cut / Close Admin Portal (Return to ONEVA)"
            >
              <X className="w-3.5 h-3.5 text-neutral-300" />
              <span>Cut Portal</span>
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs transition cursor-pointer"
              title="Sign Out of Admin Session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 overflow-x-auto flex gap-1 border-t border-neutral-800/40 scrollbar-thin">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as AdminTab)}
                className={`flex items-center gap-2 px-3 py-2.5 text-xs font-medium border-b-2 transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-emerald-400 text-white bg-neutral-800/30'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-neutral-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'dashboard' && <AdminDashboard />}

        {activeTab === 'app_catalog' && <AdminAppCatalog />}

        {activeTab === 'modify_apps' && <AdminModifyApps />}

        {activeTab === 'themes' && (
          <AdminCategoryView
            category="theme"
            title="Themes Management"
            subtitle="Configure luminance profiles, OLED pure black (#000000), and define the single active ⭐ Default theme for Full Pack."
          />
        )}

        {activeTab === 'icons' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
              <button
                type="button"
                onClick={() => setIconSubSection('packs')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
                  iconSubSection === 'packs'
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Icon Packs</span>
              </button>

              <button
                type="button"
                onClick={() => setIconSubSection('single_apps')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
                  iconSubSection === 'single_apps'
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                <Shapes className="w-3.5 h-3.5" />
                <span>Individual App Icons</span>
              </button>
            </div>

            {iconSubSection === 'packs' && <AdminFullIconPacks />}
            {iconSubSection === 'single_apps' && <AdminSingleAppIcons />}
          </div>
        )}

        {activeTab === 'keyboard' && (
          <AdminCategoryView
            category="keyboard"
            title="Tactile Keyboard Engine"
            subtitle="Manage localized tactile keyboard themes & keypress elevation/ripple animations, and define the ⭐ Default keyboard."
          />
        )}

        {activeTab === 'wallpapers' && (
          <AdminCategoryView
            category="wallpaper"
            title="Luminance Wallpapers"
            subtitle="Manage OLED pitch-black wallpapers and high-contrast gradients, and define the single active ⭐ Default wallpaper."
          />
        )}

        {activeTab === 'camera' && (
          <AdminCategoryView
            category="camera"
            title="Computational Camera Software Profiles"
            subtitle="Manage software-level dynamic range profiles and neutral color tuning for device camera hardware, and set the active ⭐ Default profile."
          />
        )}

        {activeTab === 'assist' && (
          <AdminCategoryView
            category="assist"
            title="ONEVA Assist & Jarvis Core"
            subtitle="Manage privacy-first assistant wake engines and reactive live wallpaper configurations, and define the active ⭐ Default Jarvis setup."
          />
        )}

        {activeTab === 'published' && <AdminPublishedView />}

        {activeTab === 'errors' && <AdminErrorReports />}

        {activeTab === 'settings' && <AdminSettings />}
      </main>

      {/* Admin Footer */}
      <footer className="border-t border-neutral-800/80 bg-neutral-950 px-6 py-4 text-xs text-neutral-500 text-center">
        ONEVA OS Internal Administration Portal &bull; RLS Security Enforced &bull; Confidential
      </footer>
    </div>
  );
}
