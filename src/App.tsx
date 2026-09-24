import { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OnevaControlCenter } from './components/OnevaControlCenter';
import { AdminLogin } from './admin/AdminLogin';
import { AdminLayout } from './admin/AdminLayout';
import { AdminProfile } from './types';
import { AuthService } from './services/authService';
import { OnevaLogo } from './components/OnevaLogo';
import { OnevaSplashScreen } from './components/OnevaSplashScreen';
import { OnevaStartupPermissionWizard } from './components/OnevaStartupPermissionWizard';
import { OnevaPermissionManager } from './services/onevaPermissionManager';
import { JarvisGlobalWakeService } from './services/voice/jarvisGlobalWakeService';
import { UserProfileService } from './services/userProfileService';
import { UserNameModal } from './components/UserNameOnboardingModal';

const ADMIN_VIEW_STORAGE_KEY = 'oneva_admin_view_active';

export default function App() {
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const viewActive = localStorage.getItem(ADMIN_VIEW_STORAGE_KEY) === 'true';
      const urlParams = new URLSearchParams(window.location.search);
      return viewActive || urlParams.get('admin') === 'true';
    }
    return false;
  });
  const [activeAdmin, setActiveAdmin] = useState<AdminProfile | null>(null);
  const [isVerifyingSession, setIsVerifyingSession] = useState<boolean>(true);
  const [showInitialSplash, setShowInitialSplash] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const alreadyShown = sessionStorage.getItem('oneva_initial_splash_shown');
      return !alreadyShown;
    }
    return false;
  });
  const [showPermissionWizard, setShowPermissionWizard] = useState<boolean>(() => {
    return !OnevaPermissionManager.hasCompletedOnboarding();
  });
  const [showNameOnboarding, setShowNameOnboarding] = useState<boolean>(() => {
    return UserProfileService.isFirstLaunch();
  });

  // Check URL query parameters or active admin session on initial mount
  useEffect(() => {
    JarvisGlobalWakeService.init();

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('admin') === 'true') {
        setIsAdminMode(true);
      }
    }

    AuthService.getActiveAdminSession()
      .then((admin) => {
        if (admin) {
          setActiveAdmin(admin);
          const wasAdminActive = localStorage.getItem(ADMIN_VIEW_STORAGE_KEY) === 'true';
          if (wasAdminActive) {
            setIsAdminMode(true);
          }
        } else {
          // If no active session found, clear view persistence so client isn't trapped
          localStorage.removeItem(ADMIN_VIEW_STORAGE_KEY);
          setIsAdminMode(false);
        }
      })
      .finally(() => {
        setIsVerifyingSession(false);
      });
  }, []);

  const handleOpenAdminPortal = () => {
    setIsAdminMode(true);
    if (activeAdmin) {
      localStorage.setItem(ADMIN_VIEW_STORAGE_KEY, 'true');
    }
  };

  const handleCutAdminPortal = () => {
    // User explicitly cut / closed the admin portal
    localStorage.removeItem(ADMIN_VIEW_STORAGE_KEY);
    setIsAdminMode(false);
  };

  const handleAdminSignOut = () => {
    localStorage.removeItem(ADMIN_VIEW_STORAGE_KEY);
    setActiveAdmin(null);
    setIsAdminMode(false);
  };

  const handleAdminLoginSuccess = (admin: AdminProfile) => {
    setActiveAdmin(admin);
    // Persist that the user is inside the admin portal until they explicitly cut it
    localStorage.setItem(ADMIN_VIEW_STORAGE_KEY, 'true');
  };

  if (isVerifyingSession && isAdminMode) {
    return (
      <div className="min-h-screen bg-[#050B1A] flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-4">
          <OnevaLogo variant="admin" className="animate-pulse shadow-lg shadow-cyan-950/40" />
          <span className="text-xs font-mono text-cyan-400">Restoring ONEVA Admin Session...</span>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {/* Official Startup / Splash Experience on Initial Launch */}
      {showInitialSplash && (
        <OnevaSplashScreen
          onComplete={() => {
            sessionStorage.setItem('oneva_initial_splash_shown', 'true');
            setShowInitialSplash(false);
            if (!OnevaPermissionManager.hasCompletedOnboarding()) {
              setShowPermissionWizard(true);
            } else if (UserProfileService.isFirstLaunch()) {
              setShowNameOnboarding(true);
            }
          }}
        />
      )}

      {/* Startup Permissions Initialization Wizard ("Grant All Permissions" One-Time Flow) */}
      {!showInitialSplash && showPermissionWizard && (
        <OnevaStartupPermissionWizard
          isOpen={showPermissionWizard}
          onClose={() => {
            setShowPermissionWizard(false);
            if (UserProfileService.isFirstLaunch()) {
              setShowNameOnboarding(true);
            }
          }}
          onComplete={() => {
            setShowPermissionWizard(false);
            if (UserProfileService.isFirstLaunch()) {
              setShowNameOnboarding(true);
            }
          }}
        />
      )}

      {/* Startup User Name Onboarding */}
      {!showInitialSplash && !showPermissionWizard && showNameOnboarding && (
        <UserNameModal
          isOpen={showNameOnboarding}
          isInitialOnboarding={true}
          onClose={() => setShowNameOnboarding(false)}
          onSaved={() => setShowNameOnboarding(false)}
        />
      )}

      {/* If Admin Mode is active */}
      {isAdminMode ? (
        activeAdmin ? (
          <AdminLayout
            admin={activeAdmin}
            onSignOut={handleAdminSignOut}
            onExitToApp={handleCutAdminPortal}
          />
        ) : (
          <AdminLogin
            onSuccess={handleAdminLoginSuccess}
            onCancel={() => setIsAdminMode(false)}
          />
        )
      ) : (
        /* ONEVA Customization & Enhancement Control Center */
        <OnevaControlCenter onOpenAdminPortal={handleOpenAdminPortal} />
      )}
    </ErrorBoundary>
  );
}
