# ONEVA Permanent Product Context & Architectural Directives

## 1. What is ONEVA?
ONEVA is a **privacy-first Android customization and enhancement platform**.
ONEVA is **NOT**:
- An alternative app store
- A collection of replacement apps
- A clone of YouTube, WhatsApp, Chrome, Instagram, etc.
- A fake version of any existing app

The user keeps the genuine applications already installed on their Android device. ONEVA acts strictly as an enhancement and customization layer around the user's existing device and applications where Android technically allows it.

Formula:
```
EXISTING PHONE + EXISTING APPLICATIONS + ONEVA CUSTOMIZATION + ONEVA VISUAL EXPERIENCE + ONEVA ASSISTANCE = ENHANCED PHONE EXPERIENCE
```

---

## 2. Visual Identity & Brand Philosophy
- ONEVA provides a modern, premium, and futuristic phone experience.
- It maintains its own unique visual identity (does NOT blindly copy Samsung One UI or stock launchers).
- Attributes: Smooth, premium, clean, futuristic, responsive, customizable, lightweight, privacy-first.

---

## 3. Core Architectural Rules for Future Phases

### Rule 1: Phase-by-Phase Discipline
- **NEVER** attempt to build the entire vision at once.
- **DO NOT** start Phase 4 until Phase 3 and prerequisite foundations are completed and verified.
- Before modifying a feature, inspect its dependencies and contracts.
- Preserve existing working code; avoid breaking unrelated modules.
- Never fake unsupported Android capabilities or claim a placeholder is complete.

### Rule 2: Modular Architecture
ONEVA is divided into independent subsystems with clear contracts:
1. **ONEVA UI**: Adaptive luxury system framework & launcher surface
2. **ONEVA Glow**: Ambient edge illumination & particle physics engine (with chroma/blending transparency)
3. **ONEVA Themes**: Luminance palettes, OLED blacks, and system color matching
4. **ONEVA Icons**: Vector icon pack engine & granular individual app icon customization
5. **ONEVA Keyboard**: Privacy-first tactile IME with localized prediction (Android IME architecture)
6. **ONEVA Assist**: Voice & command execution core with customizable assistant names (e.g. Jarvis, Nova, Friday) and multilingual NLU
7. **ONEVA Vision**: Computational image/video enhancements for existing device camera hardware
8. **ONEVA Upgrade Center**: Differential OTA release & cryptographically signed asset distributor
9. **Admin System**: Visual asset management, review pipeline, and remote configuration

### Rule 3: Individual App Icon Customization Hierarchy
Icon resolution must follow this strict priority chain:
```
1. Individual Custom Icon (user override for that specific app)
   ↓
2. Individual Pack Override (specific pack selected for that app)
   ↓
3. Selected Global Icon Pack
   ↓
4. Configurable Fallback Icon (adaptive / themed / masked / generated / user-provided)
   ↓
5. Original App System Icon
```

### Rule 4: Admin Visual Asset Lifecycle
All visual assets (Edge Glow animations, Keyboard themes, App icons, Icon packs, Wallpapers, UI animations) must follow the verified publishing workflow:
```
UPLOAD → PREVIEW → TEST → VERIFY → PUBLISH
(with instant DISABLE / ROLLBACK support)
```
Assets are distributed remotely to clients without requiring an APK update unless a new native Android engine or system permission is needed.

### Rule 5: Edge Glow Rendering Constraints
- Glow animations must run as edge overlays with proper transparency/blending (screen/additive/chroma-key).
- The user's underlying real application must remain visible beneath the glowing edge effect.
- Never cover the entire screen with an opaque background.

### Rule 6: Absolute Privacy & Android Security Boundaries
- **Zero Spyware**: ONEVA must NEVER intercept private chats, keystrokes, personal photos, or contact books for transmission to the cloud.
- **Local-First Processing**: Commands (e.g., "WhatsApp में Rahul का chat खोलो") inspect visible UI locally and discard context immediately after execution.
- **No Password Access**: ONEVA must NEVER ask for, learn, store, or bypass phone PINs, pattern locks, or biometric credentials.
- **No APK Bytecode Tampering**: No DEX patching, code injection, or sandbox breaking.
- **Transparent Permissions**: Sensitive Android permissions require explicit user consent and honest rationale.

### Rule 7: Local-First Resilience & Supabase Backend Role
- Supabase is used strictly for: Admin auth, remote asset metadata, published packs, remote flags, and consented anonymous error diagnostics.
- Supabase is NOT a database of user personal phone activity.
- The client must function fully offline using local storage, cached assets, and last-known-good configuration. Backend unavailability must never crash the launcher.
