import { ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { OnevaAssetBrowser } from '../components/assets/OnevaAssetBrowser';

interface WallpapersPageProps {
  onNavigateBack?: () => void;
}

export function WallpapersPage({ onNavigateBack }: WallpapersPageProps) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-28 text-white">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800/80">
        <div className="flex items-center gap-3">
          {onNavigateBack && (
            <button
              type="button"
              onClick={onNavigateBack}
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <ImageIcon className="w-6 h-6 text-cyan-400" />
              <span>Wallpapers &amp; Backgrounds</span>
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              User-selectable high-contrast OLED wallpapers, gradients, and personal device gallery photos.
            </p>
          </div>
        </div>
      </div>

      {/* Main Wallpaper Catalog (Exclusively user wallpapers, separated from Jarvis reactive system) */}
      <OnevaAssetBrowser
        targetCategory="wallpaper"
        title="Wallpaper Catalog"
        subtitle="Select any static or animated background. Tap to enter full-screen preview and apply to your device."
        allowUpload={true}
      />
    </div>
  );
}
