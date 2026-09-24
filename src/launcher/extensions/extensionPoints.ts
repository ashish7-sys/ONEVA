/**
 * ONEVA Architecture Extension Points (Phases 3+)
 * 
 * IMPORTANT ARCHITECTURAL BOUNDARY:
 * These interfaces define the extension contracts for future ONEVA subsystems.
 * In Phase 2, they are strictly interfaces/placeholders and are NOT implemented.
 * They must NEVER be marked as active, verified, or functional until their respective
 * engineering phase is explicitly scheduled and implemented.
 */

export interface OnevaIconsExtension {
  readonly id: 'oneva.extension.icons';
  readonly name: 'ONEVA Icons Engine';
  readonly isImplemented: false;
  readonly targetPhase: 'Phase 3+';
  getIconPack?: (packId: string) => Promise<unknown>;
  applyCustomIcon?: (packageName: string, assetPath: string) => Promise<boolean>;
}

export interface OnevaThemesExtension {
  readonly id: 'oneva.extension.themes';
  readonly name: 'ONEVA Theme Engine';
  readonly isImplemented: false;
  readonly targetPhase: 'Phase 3+';
  applySystemPalette?: (paletteToken: string) => Promise<boolean>;
  getAvailableThemes?: () => Promise<unknown[]>;
}

export interface OnevaGlowExtension {
  readonly id: 'oneva.extension.glow';
  readonly name: 'ONEVA Edge Glow Engine';
  readonly isImplemented: false;
  readonly targetPhase: 'Future Subsystem';
  triggerGlowAnimation?: (style: string, durationMs: number) => void;
}

export interface OnevaKeyboardExtension {
  readonly id: 'oneva.extension.keyboard';
  readonly name: 'ONEVA Tactile Keyboard';
  readonly isImplemented: false;
  readonly targetPhase: 'Future Subsystem';
  bindInputMethodEngine?: () => boolean;
}

export interface OnevaAssistExtension {
  readonly id: 'oneva.extension.assist';
  readonly name: 'ONEVA Assist / Voice Core';
  readonly isImplemented: false;
  readonly targetPhase: 'Future Subsystem';
  listenForVoiceTrigger?: () => void;
}

export interface OnevaVisionExtension {
  readonly id: 'oneva.extension.vision';
  readonly name: 'ONEVA Vision / Camera AI';
  readonly isImplemented: false;
  readonly targetPhase: 'Future Subsystem';
  processFrameNPU?: (frameBuffer: unknown) => Promise<unknown>;
}

export interface OnevaUpgradeCenterExtension {
  readonly id: 'oneva.extension.upgrade';
  readonly name: 'ONEVA System Upgrade Center';
  readonly isImplemented: false;
  readonly targetPhase: 'Future Subsystem';
  checkForOTAPackages?: () => Promise<unknown>;
}

export const ONEVA_EXTENSION_REGISTRY = {
  icons: {
    id: 'oneva.extension.icons',
    name: 'ONEVA Icons',
    status: 'UNIMPLEMENTED_RESERVED',
  },
  themes: {
    id: 'oneva.extension.themes',
    name: 'ONEVA Themes',
    status: 'UNIMPLEMENTED_RESERVED',
  },
  glow: {
    id: 'oneva.extension.glow',
    name: 'ONEVA Glow',
    status: 'UNIMPLEMENTED_RESERVED',
  },
  keyboard: {
    id: 'oneva.extension.keyboard',
    name: 'ONEVA Keyboard',
    status: 'UNIMPLEMENTED_RESERVED',
  },
  assist: {
    id: 'oneva.extension.assist',
    name: 'ONEVA Assist',
    status: 'UNIMPLEMENTED_RESERVED',
  },
  vision: {
    id: 'oneva.extension.vision',
    name: 'ONEVA Vision',
    status: 'UNIMPLEMENTED_RESERVED',
  },
  upgrade: {
    id: 'oneva.extension.upgrade',
    name: 'ONEVA Upgrade Center',
    status: 'UNIMPLEMENTED_RESERVED',
  },
} as const;
