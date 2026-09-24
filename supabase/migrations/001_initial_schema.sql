-- ============================================================================
-- ONEVA BACKEND INFRASTRUCTURE SCHEMA
-- Migration: 001_initial_schema.sql
-- Description: Core schema, tables, indexes, and Row-Level-Security (RLS)
--              for ONEVA OS client and Admin Portal.
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. USER PROFILES & ADMIN ROLE AUTHORIZATION
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
    is_admin BOOLEAN NOT NULL DEFAULT false,
    display_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin);

-- Helper security function to verify administrative privileges
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND (is_admin = true OR role IN ('admin', 'superadmin'))
    );
$$;

-- Trigger to create public.profiles entry automatically upon auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role, is_admin, display_name)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'role', 'user'),
        COALESCE((new.raw_user_meta_data->>'is_admin')::boolean, false),
        COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 2. REMOTE CONFIGURATION TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.remote_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    min_client_version TEXT NOT NULL DEFAULT '1.0.0',
    environment TEXT NOT NULL DEFAULT 'production' CHECK (environment IN ('production', 'staging', 'development')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_remote_configs_key ON public.remote_configs(key);
CREATE INDEX IF NOT EXISTS idx_remote_configs_active ON public.remote_configs(is_active);

-- Seed baseline configuration defaults
INSERT INTO public.remote_configs (key, value, description, is_active)
VALUES
    ('core.diagnostics.consent_required', 'true'::jsonb, 'Require explicit device user opt-in before sending technical diagnostic reports', true),
    ('core.privacy.zero_cloud_logging', 'true'::jsonb, 'Strict privacy guarantee: WhatsApp, personal messages, audio, and contacts stay strictly on-device', true),
    ('core.offline_mode.enabled', 'true'::jsonb, 'Allow app to operate in standalone offline state without active cloud connection', true),
    ('features.oneva_ui.enabled', 'true'::jsonb, 'ONEVA UI Core engine switch', true),
    ('features.oneva_glow.status', '"verified"'::jsonb, 'Ambient Edge Glow engine rollout status', true),
    ('features.oneva_themes.status', '"verified"'::jsonb, 'Aesthetic OLED themes engine', true),
    ('features.oneva_icons.status', '"verified"'::jsonb, 'Custom vector icon packs engine', true),
    ('features.oneva_keyboard.status', '"testing"'::jsonb, 'Localized keyboard engine', true),
    ('features.oneva_assist.status', '"draft"'::jsonb, 'Localized assistant engine', true),
    ('features.oneva_vision.status', '"draft"'::jsonb, 'Localized camera NPU engine', true),
    ('features.oneva_upgrade_center.status', '"verified"'::jsonb, 'Differential upgrade distributor', true)
ON CONFLICT (key) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. MODULAR FEATURES & VERSIONING
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.features (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tagline TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'testing', 'verified', 'published', 'disabled')),
    current_version TEXT NOT NULL DEFAULT '1.0.0',
    is_local_only BOOLEAN NOT NULL DEFAULT true,
    min_client_version TEXT NOT NULL DEFAULT '1.0.0',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.feature_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_id TEXT NOT NULL REFERENCES public.features(id) ON DELETE CASCADE,
    version TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'testing', 'verified', 'published', 'disabled')),
    changelog JSONB NOT NULL DEFAULT '[]'::jsonb,
    min_client_version TEXT NOT NULL DEFAULT '1.0.0',
    target_android_version TEXT NOT NULL DEFAULT '14',
    published_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(feature_id, version)
);

CREATE INDEX IF NOT EXISTS idx_features_status ON public.features(status);
CREATE INDEX IF NOT EXISTS idx_feature_versions_lookup ON public.feature_versions(feature_id, version);

-- Seed isolated features catalog
INSERT INTO public.features (id, name, tagline, description, status, current_version, is_local_only)
VALUES
    ('oneva_ui', 'ONEVA UI', 'Adaptive luxury system framework', 'Core aesthetic rendering layer and responsive feedback interfaces.', 'verified', '1.0.0', true),
    ('oneva_glow', 'ONEVA Glow', 'Ambient edge lighting & particle engine', 'Hardware-accelerated edge illumination engine.', 'verified', '0.9.4', true),
    ('oneva_themes', 'ONEVA Themes', 'Deep dark neutral & luminance palette system', 'System-wide theme color matching and OLED black calibrations.', 'verified', '0.9.1', true),
    ('oneva_icons', 'ONEVA Icons', 'Minimalist vector icon pack architecture', 'Scalable vector icon engine with glyph overrides.', 'verified', '0.8.8', true),
    ('oneva_keyboard', 'ONEVA Keyboard', 'Privacy-first tactile IME with localized prediction', 'Zero-cloud keystroke processing and private on-device typing.', 'testing', '0.5.0', true),
    ('oneva_assist', 'ONEVA Assist', 'On-device contextual intelligence engine', 'Private localized smart routines without cloud command storage.', 'draft', '0.2.0', true),
    ('oneva_vision', 'ONEVA Vision', 'Hardware camera neural pipeline', 'Localized scene recognition and visual processing executed purely on NPU.', 'draft', '0.1.0', true),
    ('oneva_upgrade_center', 'ONEVA Upgrade Center', 'Differential OTA & asset release distributor', 'Remote version verification and signed asset delivery.', 'verified', '1.0.0', false)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. VISUAL ASSETS & STORAGE METADATA
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('edge_glow_video', 'keyboard_theme', 'app_icon', 'icon_pack', 'wallpaper', 'ui_animation')),
    storage_path TEXT NOT NULL,
    bucket TEXT NOT NULL CHECK (bucket IN ('oneva-public-assets', 'oneva-admin-assets')),
    public_url TEXT,
    version TEXT NOT NULL DEFAULT '1.0.0',
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    mime_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'testing', 'verified', 'published', 'disabled')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assets_type_status ON public.assets(type, status);
CREATE INDEX IF NOT EXISTS idx_assets_bucket ON public.assets(bucket);

-- ----------------------------------------------------------------------------
-- 5. DIAGNOSTIC ERROR REPORTS (PRIVACY-GATED)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.error_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_code TEXT NOT NULL,
    message TEXT NOT NULL,
    feature_name TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'fatal')),
    user_consented BOOLEAN NOT NULL DEFAULT false,
    client_version TEXT NOT NULL,
    platform TEXT NOT NULL,
    device_model TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_error_reports_severity ON public.error_reports(severity);
CREATE INDEX IF NOT EXISTS idx_error_reports_created ON public.error_reports(created_at DESC);

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remote_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_reports ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
-- Users can view their own profile
CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Users can update their own profile (display name, etc.)
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Admins can manage all profiles
CREATE POLICY "Admins can update all profiles"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 2. REMOTE CONFIGS POLICIES
-- Anyone (anon or authenticated) can read active configs
CREATE POLICY "Public read active remote configs"
    ON public.remote_configs FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

-- Only admins can modify remote configurations
CREATE POLICY "Admins full management of remote configs"
    ON public.remote_configs FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 3. FEATURES & FEATURE VERSIONS POLICIES
-- Public can read verified or published features
CREATE POLICY "Public read published features"
    ON public.features FOR SELECT
    TO anon, authenticated
    USING (status IN ('published', 'verified', 'testing'));

-- Only admins can manage features
CREATE POLICY "Admins full management of features"
    ON public.features FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Public read published feature versions"
    ON public.feature_versions FOR SELECT
    TO anon, authenticated
    USING (status IN ('published', 'verified'));

CREATE POLICY "Admins full management of feature versions"
    ON public.feature_versions FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 4. ASSETS POLICIES
-- Public can only view published assets in the public bucket
CREATE POLICY "Public read published public assets"
    ON public.assets FOR SELECT
    TO anon, authenticated
    USING (status = 'published' AND bucket = 'oneva-public-assets');

-- Admins can view and manage all assets
CREATE POLICY "Admins full management of assets"
    ON public.assets FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 5. ERROR REPORTS POLICIES
-- Device clients may only insert error reports IF user explicitly consented
CREATE POLICY "Clients can insert consented error reports"
    ON public.error_reports FOR INSERT
    TO anon, authenticated
    WITH CHECK (user_consented = true);

-- Normal users CANNOT view error reports. Only authorized admins can SELECT
CREATE POLICY "Admins can view error reports"
    ON public.error_reports FOR SELECT
    TO authenticated
    USING (public.is_admin());
