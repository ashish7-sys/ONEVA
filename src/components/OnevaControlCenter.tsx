import { useState, useEffect } from 'react';
import { PageId, NavigationRoute, ModifyAppsSubSection } from '../navigation/types';
import { NavigationBus } from '../navigation/navigationBus';
import { Header } from './Header';
import { HomePage } from '../pages/HomePage';
import { ModulesPage } from '../pages/ModulesPage';
import { ModifyAppsPage } from '../pages/ModifyAppsPage';
import { KeyboardPage } from '../pages/KeyboardPage';
import { IconsPage } from '../pages/IconsPage';
import { ThemesPage } from '../pages/ThemesPage';
import { WallpapersPage } from '../pages/WallpapersPage';
import { CameraPage } from '../pages/CameraPage';
import { AssistPage } from '../pages/AssistPage';
import { PrivacyPage } from '../pages/PrivacyPage';
import { SettingsPage } from '../pages/SettingsPage';
import { CustomizationLibraryPage } from '../pages/CustomizationLibraryPage';
import { LauncherPage } from '../pages/LauncherPage';
import { WidgetsSystemUIPage } from '../pages/WidgetsSystemUIPage';
import { AppRepository } from '../launcher/services/appRepository';
import { HandControlOverlay } from './jarvis/HandControlOverlay';
import { JarvisProactiveSentinelOverlay } from './jarvis/JarvisProactiveSentinelOverlay';

interface OnevaControlCenterProps {
  onOpenAdminPortal: () => void;
}

export function OnevaControlCenter({ onOpenAdminPortal }: OnevaControlCenterProps) {
  // Navigation stack for clean back navigation
  const [history, setHistory] = useState<NavigationRoute[]>([{ page: 'home' }]);
  const [isBridgeConnected, setIsBridgeConnected] = useState<boolean>(AppRepository.isBridgeConnected());

  useEffect(() => {
    const unsubRepo = AppRepository.subscribe(() => {
      setIsBridgeConnected(AppRepository.isBridgeConnected());
    });
    const unsubNav = NavigationBus.subscribe((route) => {
      setHistory((prev) => [...prev, route]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    return () => {
      unsubRepo();
      unsubNav();
    };
  }, []);

  const currentRoute = history[history.length - 1] || { page: 'home' };

  const navigateTo = (page: PageId, subSection?: string, packageName?: string) => {
    setHistory((prev) => [...prev, { page, subSection, selectedPackageName: packageName }]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    if (history.length > 1) {
      setHistory((prev) => prev.slice(0, prev.length - 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getPageTitle = (page: PageId): string => {
    switch (page) {
      case 'home':
        return 'Control Center';
      case 'modules':
        return 'Customization Modules';
      case 'modify_apps':
        return 'Modify Apps';
      case 'library':
        return 'Customization Library';
      case 'themes':
        return 'Themes';
      case 'icons':
      case 'icon_packs':
        return 'Icons & Packs';
      case 'widgets_system_ui':
        return 'Widgets & System UI';
      case 'keyboard':
        return 'Tactile Keyboard';
      case 'wallpapers':
        return 'Wallpapers';
      case 'camera':
        return 'ONEVA Vision';
      case 'assist':
        return 'ONEVA Assist';
      case 'privacy':
        return 'Privacy & Sandbox';
      case 'settings':
        return 'Settings & Bridge';
      case 'launcher':
        return 'Launcher Surface';
      default:
        return 'ONEVA';
    }
  };

  return (
    <div className="min-h-screen bg-[#060C1E] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-x-hidden">
      {/* Sci-Fi Futuristic Ambient Background with deep navy & cyan highlights */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Subtle Cyber Stardust / Grid Pattern */}
        <div className="absolute inset-0 bg-oneva-grid opacity-35" />

        {/* Breathing Cyan Ambient Orb */}
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none"
          style={{ animation: 'ambient-nebula-float 8s ease-in-out infinite' }}
        />

        {/* Breathing Blue / Indigo Ambient Orb */}
        <div
          className="absolute top-1/3 -left-36 w-96 h-96 rounded-full bg-blue-600/15 blur-[130px] pointer-events-none"
          style={{ animation: 'ambient-nebula-float-rev 10s ease-in-out infinite' }}
        />

        {/* Breathing Electric Pink / Magenta Ambient Orb */}
        <div
          className="absolute bottom-1/4 right-0 w-96 h-96 rounded-full bg-pink-500/10 blur-[140px] pointer-events-none"
          style={{ animation: 'ambient-nebula-float 9s ease-in-out infinite 2s' }}
        />

        {/* Breathing Electric Violet Ambient Orb */}
        <div
          className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full bg-purple-600/12 blur-[130px] pointer-events-none"
          style={{ animation: 'ambient-nebula-float-rev 11s ease-in-out infinite 1s' }}
        />

        {/* Subtle Vignette for Contrast & Focus */}
        <div className="absolute inset-0 bg-radial from-transparent via-[#060C1E]/40 to-[#040816]/90 pointer-events-none" />
      </div>

      {/* Hand Control Floating HUD Overlay */}
      <HandControlOverlay />

      {/* JARVIS Proactive Autonomous Sentinel Toast HUD */}
      <JarvisProactiveSentinelOverlay />

      {/* Shared Header with Back button, Settings button, and Admin Lock Icon */}
      {currentRoute.page !== 'launcher' && (
        <Header
          currentPage={currentRoute.page}
          pageTitle={getPageTitle(currentRoute.page)}
          onNavigateBack={history.length > 1 ? goBack : undefined}
          onOpenAdminPortal={onOpenAdminPortal}
          isBridgeConnected={isBridgeConnected}
          onOpenLauncher={() => navigateTo('launcher')}
          onOpenSettings={() => navigateTo('settings')}
        />
      )}

      {/* Main Content Area: Dedicated Page Views */}
      <main className="flex-1 relative z-10">
        {currentRoute.page === 'launcher' && (
          <LauncherPage
            onNavigateBack={goBack}
            onOpenSettings={() => navigateTo('settings')}
            onNavigateToPage={(page) => navigateTo(page)}
          />
        )}

        {currentRoute.page === 'home' && (
          <HomePage onNavigate={(page, subSection) => navigateTo(page, subSection)} />
        )}

        {currentRoute.page === 'modules' && (
          <ModulesPage
            onNavigate={(page) => navigateTo(page)}
            onNavigateBack={goBack}
          />
        )}

        {currentRoute.page === 'modify_apps' && (
          <ModifyAppsPage
            initialSubSection={(currentRoute.subSection as ModifyAppsSubSection) || 'app_list'}
            onNavigateToSubSection={(sub, pkg) => navigateTo('modify_apps', sub, pkg)}
            onOpenGlobalFeature={(globalPage, pkg) => navigateTo(globalPage, undefined, pkg)}
            onNavigateBack={goBack}
          />
        )}

        {currentRoute.page === 'library' && (
          <div className="p-4 sm:p-8">
            <CustomizationLibraryPage onNavigate={(page) => navigateTo(page as PageId)} />
          </div>
        )}

        {currentRoute.page === 'widgets_system_ui' && (
          <WidgetsSystemUIPage onNavigateBack={goBack} />
        )}

        {currentRoute.page === 'keyboard' && (
          <KeyboardPage
            contextPackageName={currentRoute.selectedPackageName}
            onNavigateBack={goBack}
          />
        )}

        {(currentRoute.page === 'icons' || currentRoute.page === 'icon_packs') && (
          <IconsPage
            contextPackageName={currentRoute.selectedPackageName}
            onNavigateBack={goBack}
          />
        )}

        {currentRoute.page === 'themes' && <ThemesPage onNavigateBack={goBack} />}

        {currentRoute.page === 'wallpapers' && <WallpapersPage onNavigateBack={goBack} />}

        {currentRoute.page === 'camera' && <CameraPage onNavigateBack={goBack} />}

        {currentRoute.page === 'assist' && <AssistPage onNavigateBack={goBack} />}

        {currentRoute.page === 'privacy' && <PrivacyPage onNavigateBack={goBack} />}

        {currentRoute.page === 'settings' && <SettingsPage onNavigateBack={goBack} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-cyan-500/15 py-6 px-4 sm:px-8 text-center text-xs text-slate-400 font-mono relative z-10 bg-[#050A19]/80 backdrop-blur-md">
        ONEVA Platform &bull; Modular Android Customization Layer &bull; Privacy-First Architecture
      </footer>
    </div>
  );
}
