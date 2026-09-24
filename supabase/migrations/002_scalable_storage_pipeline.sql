-- ============================================================================
-- ONEVA BACKEND INFRASTRUCTURE SCHEMA
-- Migration: 002_scalable_storage_pipeline.sql
-- Description: Scalable multi-category asset storage architecture, metadata
--              references, storage path indexing, and strict Row-Level-Security (RLS).
-- ============================================================================

-- 1. EXPAND ASSET TYPE CHECK CONSTRAINT
-- Allows all ONEVA modular categories without artificial limitations
ALTER TABLE IF EXISTS public.assets
    DROP CONSTRAINT IF EXISTS assets_type_check;

ALTER TABLE IF EXISTS public.assets
    ADD CONSTRAINT assets_type_check CHECK (
        type IN (
            'wallpaper',
            'live_wallpaper',
            'icon_pack',
            'individual_icon',
            'theme',
            'system_ui',
            'keyboard',
            'keyboard_theme',
            'keyboard_background',
            'app_icon',
            'camera',
            'assist',
            'edge_glow_video',
            'ui_animation'
        )
    );

-- 2. ENSURE STANDARD STORAGE PATH & METADATA COLUMNS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'preview_storage_path') THEN
        ALTER TABLE public.assets ADD COLUMN preview_storage_path TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'thumbnail_storage_path') THEN
        ALTER TABLE public.assets ADD COLUMN thumbnail_storage_path TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'poster_storage_path') THEN
        ALTER TABLE public.assets ADD COLUMN poster_storage_path TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'rating') THEN
        ALTER TABLE public.assets ADD COLUMN rating INT DEFAULT 8 CHECK (rating BETWEEN 1 AND 10);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'checksum') THEN
        ALTER TABLE public.assets ADD COLUMN checksum TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'author') THEN
        ALTER TABLE public.assets ADD COLUMN author TEXT DEFAULT 'ONEVA Studio';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'published_at') THEN
        ALTER TABLE public.assets ADD COLUMN published_at TIMESTAMPTZ;
    END IF;
END $$;

-- 3. HIGH-PERFORMANCE INDEXES FOR THOUSANDS OF ASSETS
CREATE INDEX IF NOT EXISTS idx_assets_type_status_rating ON public.assets(type, status, rating DESC);
CREATE INDEX IF NOT EXISTS idx_assets_status_created ON public.assets(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assets_file_size ON public.assets(file_size_bytes);

-- 4. HARDEN ROW-LEVEL SECURITY (RLS) FOR ASSETS
-- Ensures draft / unpublished assets are NEVER visible to the public or standard client queries
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published public assets" ON public.assets;
CREATE POLICY "Public read published public assets"
    ON public.assets FOR SELECT
    TO anon, authenticated
    USING (
        status = 'published' AND bucket = 'oneva-public-assets'
    );

DROP POLICY IF EXISTS "Admins full management of assets" ON public.assets;
CREATE POLICY "Admins full management of assets"
    ON public.assets FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 5. STORAGE BUCKET CONFIGURATION (IDEMPOTENT SETUP)
-- Note: In Supabase dashboard, verify that 'oneva-public-assets' exists and is set to Public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'oneva-public-assets',
    'oneva-public-assets',
    true,
    52428800, -- Default 50MB per file (Increase to 5GB on Supabase Pro plan)
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'video/mp4', 'video/webm', 'application/zip', 'application/json', 'application/octet-stream']
)
ON CONFLICT (id) DO UPDATE SET
    public = true;

-- Storage object policies: Public read for published files
DROP POLICY IF EXISTS "Public read asset storage" ON storage.objects;
CREATE POLICY "Public read asset storage"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'oneva-public-assets');

DROP POLICY IF EXISTS "Admin write asset storage" ON storage.objects;
CREATE POLICY "Admin write asset storage"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id IN ('oneva-public-assets', 'oneva-admin-assets') AND
        public.is_admin()
    );

DROP POLICY IF EXISTS "Admin delete asset storage" ON storage.objects;
CREATE POLICY "Admin delete asset storage"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id IN ('oneva-public-assets', 'oneva-admin-assets') AND
        public.is_admin()
    );
