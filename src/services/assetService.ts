import { Asset, AssetType } from '../types';
import { getSupabaseClient } from '../supabase/client';
import { ONEVA_CLIENT_CONFIG } from '../core/config';

export interface AssetQueryParams {
  type?: AssetType;
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  sortBy?: 'rating' | 'created_at' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export class AssetService {
  /**
   * Retrieves published public assets with pagination and search projection
   */
  static async getPublishedAssetsPaginated(
    params: AssetQueryParams = {}
  ): Promise<{ assets: Asset[]; totalCount: number; hasMore: boolean }> {
    const supabase = getSupabaseClient();
    if (!supabase) return { assets: [], totalCount: 0, hasMore: false };

    const page = params.page || 1;
    const pageSize = params.pageSize || 24;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    try {
      let query = supabase
        .from('assets')
        .select('*', { count: 'exact' })
        .eq('status', 'published')
        .eq('bucket', ONEVA_CLIENT_CONFIG.storage.publicBucket);

      if (params.type) {
        query = query.eq('type', params.type);
      }

      if (params.searchQuery && params.searchQuery.trim()) {
        query = query.ilike('name', `%${params.searchQuery.trim()}%`);
      }

      const sortBy = params.sortBy || 'rating';
      const ascending = params.sortOrder === 'asc';
      query = query.order(sortBy, { ascending });

      const { data, count, error } = await query.range(from, to);
      if (error || !data) return { assets: [], totalCount: 0, hasMore: false };

      const totalCount = count || 0;
      const hasMore = to + 1 < totalCount;

      const assets: Asset[] = data.map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type as AssetType,
        storagePath: item.storage_path,
        bucket: item.bucket,
        publicUrl: item.public_url,
        version: item.version,
        fileSizeBytes: item.file_size_bytes,
        mimeType: item.mime_type,
        status: item.status,
        metadata: item.metadata,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      return { assets, totalCount, hasMore };
    } catch {
      return { assets: [], totalCount: 0, hasMore: false };
    }
  }

  /**
   * Retrieves published public assets (wallpapers, icon packs, glow videos, etc.)
   */
  static async getPublishedAssets(type?: AssetType): Promise<Asset[]> {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    try {
      let query = supabase
        .from('assets')
        .select('*')
        .eq('status', 'published')
        .eq('bucket', ONEVA_CLIENT_CONFIG.storage.publicBucket);

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;
      if (error || !data) return [];

      return data.map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type as AssetType,
        storagePath: item.storage_path,
        bucket: item.bucket,
        publicUrl: item.public_url,
        version: item.version,
        fileSizeBytes: item.file_size_bytes,
        mimeType: item.mime_type,
        status: item.status,
        metadata: item.metadata,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Admin-only: list all assets including drafts/private
   */
  static async getAllAssetsForAdmin(): Promise<Asset[]> {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) return [];

      return data.map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type as AssetType,
        storagePath: item.storage_path,
        bucket: item.bucket,
        publicUrl: item.public_url,
        version: item.version,
        fileSizeBytes: item.file_size_bytes,
        mimeType: item.mime_type,
        status: item.status,
        metadata: item.metadata,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));
    } catch {
      return [];
    }
  }
}
