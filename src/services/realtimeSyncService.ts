import { getSupabaseClient } from '../supabase/client';
import { AssetCacheService } from './assetCacheService';

export type RealtimeAssetEventType =
  | 'ASSET_CREATED'
  | 'ASSET_PUBLISHED'
  | 'ASSET_UNPUBLISHED'
  | 'ASSET_UPDATED'
  | 'ASSET_DELETED'
  | 'DEFAULT_CHANGED';

export interface RealtimeAssetEvent {
  type: RealtimeAssetEventType;
  assetId: string;
  category?: string;
  timestamp: string;
  payload?: any;
  originId?: string;
}

type EventCallback = (event: RealtimeAssetEvent) => void;

const BROADCAST_CHANNEL_NAME = 'oneva_asset_sync_bus_v1';
const WINDOW_EVENT_NAME = 'oneva:asset_sync_event';

export class RealtimeSyncService {
  private static channel: BroadcastChannel | null = null;
  private static subscribers: Set<EventCallback> = new Set();
  private static isInitialized = false;

  /**
   * Initializes the cross-tab BroadcastChannel and Supabase Realtime listener.
   */
  static init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // 1. Browser BroadcastChannel
    try {
      if ('BroadcastChannel' in window) {
        this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.channel.onmessage = (event: MessageEvent<RealtimeAssetEvent>) => {
          if (event.data && event.data.type) {
            this.dispatchLocal(event.data);
          }
        };
      }
    } catch (err) {
      console.warn('[RealtimeSyncService] BroadcastChannel init note:', err);
    }

    // 2. Window CustomEvent listener
    window.addEventListener(WINDOW_EVENT_NAME, ((customEvent: CustomEvent<RealtimeAssetEvent>) => {
      if (customEvent.detail) {
        this.notifySubscribers(customEvent.detail);
      }
    }) as EventListener);

    // 3. Supabase Realtime Subscription (if configured)
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const sbChannel = supabase.channel('oneva_public_assets_sync');
        sbChannel
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'assets' },
            (payload) => {
              let eventType: RealtimeAssetEventType = 'ASSET_UPDATED';
              if (payload.eventType === 'INSERT') eventType = 'ASSET_CREATED';
              if (payload.eventType === 'DELETE') eventType = 'ASSET_DELETED';

              const assetId = (payload.new as any)?.id || (payload.old as any)?.id || 'unknown';
              const category = (payload.new as any)?.type || (payload.old as any)?.type;

              this.broadcastLocally({
                type: eventType,
                assetId,
                category,
                timestamp: new Date().toISOString(),
                payload: payload.new,
              });
            }
          )
          .subscribe();
      }
    } catch (err) {
      console.warn('[RealtimeSyncService] Supabase Realtime subscription note:', err);
    }

    // 4. Foreground / Tab return auto-sync
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.broadcastLocally({
            type: 'ASSET_UPDATED',
            assetId: 'foreground_sync',
            timestamp: new Date().toISOString(),
          });
        }
      });
    }
  }

  /**
   * Broadcasts an asset lifecycle event across all tabs, workers, and subscribers.
   */
  static broadcast(
    type: RealtimeAssetEventType,
    assetId: string,
    category?: string,
    payload?: any,
    originId?: string
  ): void {
    const event: RealtimeAssetEvent = {
      type,
      assetId,
      category,
      timestamp: new Date().toISOString(),
      payload,
      originId,
    };

    // 1. Post to BroadcastChannel (other tabs)
    try {
      if (this.channel) {
        this.channel.postMessage(event);
      }
    } catch (err) {
      console.warn('[RealtimeSyncService] BroadcastChannel post error:', err);
    }

    // 2. Dispatch to current window
    this.broadcastLocally(event);
  }

  private static broadcastLocally(event: RealtimeAssetEvent): void {
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent(WINDOW_EVENT_NAME, { detail: event }));
      } catch {
        this.notifySubscribers(event);
      }
    } else {
      this.notifySubscribers(event);
    }
  }

  private static dispatchLocal(event: RealtimeAssetEvent): void {
    this.notifySubscribers(event);
  }

  private static notifySubscribers(event: RealtimeAssetEvent): void {
    if (
      (event.type === 'ASSET_UPDATED' || event.type === 'ASSET_DELETED') &&
      event.assetId &&
      event.assetId !== 'foreground_sync'
    ) {
      AssetCacheService.invalidateAsset(event.assetId).catch(() => {});
    }

    this.subscribers.forEach((cb) => {
      try {
        cb(event);
      } catch (err) {
        console.error('[RealtimeSyncService] Callback error:', err);
      }
    });
  }

  /**
   * Subscribes to realtime asset lifecycle events.
   */
  static subscribe(callback: EventCallback): () => void {
    this.init();
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }
}
