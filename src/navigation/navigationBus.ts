/**
 * ONEVA Navigation Bus
 * 
 * Provides a decoupled event bus for programmatic navigation between
 * ONEVA sections, supporting Jarvis internal actions and system commands.
 */

import { PageId, NavigationRoute } from './types';
import { JarvisDeviceContextManager } from '../services/intelligence/jarvisDeviceContextManager';

type NavigationListener = (route: NavigationRoute) => void;

export class NavigationBus {
  private static listeners: Set<NavigationListener> = new Set();
  private static currentRoute: NavigationRoute = { page: 'home' };

  static getCurrentRoute(): NavigationRoute {
    return this.currentRoute;
  }

  static navigateTo(page: PageId, subSection?: string, packageName?: string): void {
    const route: NavigationRoute = {
      page,
      subSection,
      selectedPackageName: packageName,
    };
    this.currentRoute = route;

    try {
      JarvisDeviceContextManager.setSection(page);
    } catch (e) {
      // safe continue
    }

    this.listeners.forEach((listener) => {
      try {
        listener(route);
      } catch (err) {
        console.error('[NavigationBus] Listener error:', err);
      }
    });
  }

  static subscribe(listener: NavigationListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
