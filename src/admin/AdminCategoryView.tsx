import { useState, useEffect, useRef } from 'react';
import {
  Star,
  Sparkles,
  Plus,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  UploadCloud,
  X,
  Layers,
  Zap,
  Palette,
  Shield,
  Sun,
  Moon,
  Check,
  FileArchive,
  Download,
  Edit3,
  Package,
  Info,
  Image as ImageIcon,
  Video,
  Film,
  Upload,
  Play,
  FileUp,
  Link2,
} from 'lucide-react';
import { OnevaAsset, OnevaAssetCategory, IconPackValidationResult, UploadProgressState } from '../types/adminAssets';
import { AdminAssetService, ASSET_CATEGORIES } from '../services/adminAssetService';
import { IconPackValidator } from '../services/iconPackValidator';
import { ThemeBundleValidator, ThemeValidationResult } from '../services/themeBundleValidator';
import { SystemUIBundleValidator, SystemUIValidationResult } from '../services/systemUIBundleValidator';
import { WallpaperService } from '../services/wallpaperService';
import { LauncherSettingsService } from '../launcher/services/launcherSettingsService';
import { UserCustomizationService } from '../services/userCustomizationService';
import { IconService } from '../services/iconService';
import { KeyboardService } from '../services/keyboardService';
import { ThemeService } from '../services/themeService';
import { WidgetsSystemUIService } from '../services/widgetsSystemUIService';
import { AssetStorageService } from '../services/assetStorageService';
import { ChunkedUploadEngine } from '../services/chunkedUploadEngine';
import { ScalableStorageService } from '../services/scalableStorageService';
import { ThemeCreatorModal } from './ThemeCreatorModal';

interface AdminCategoryViewProps {
  category: OnevaAssetCategory;
  title?: string;
  subtitle?: string;
}

export function AdminCategoryView({ category, title, subtitle }: AdminCategoryViewProps) {
  const [assets, setAssets] = useState<OnevaAsset[]>([]);
  const [defaultAsset, setDefaultAsset] = useState<OnevaAsset | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Theme Creator Modal State (Method 2: Build from Assets)
  const [isThemeCreatorOpen, setIsThemeCreatorOpen] = useState(false);

  // Default Replacement Confirmation Dialog State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    targetAsset: OnevaAsset | null;
    previousDefault: OnevaAsset | null;
  }>({ isOpen: false, targetAsset: null, previousDefault: null });

  // ZIP Upload & Validation Modal State
  const [isZipModalOpen, setIsZipModalOpen] = useState(false);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [isAnalyzingZip, setIsAnalyzingZip] = useState(false);
  const [zipValidationResult, setZipValidationResult] = useState<IconPackValidationResult | ThemeValidationResult | SystemUIValidationResult | null>(null);
  const [zipPublishDefault, setZipPublishDefault] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit Modal State
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    asset: OnevaAsset | null;
    name: string;
    description: string;
    version: string;
    status: 'published' | 'draft';
    rating: number;
  }>({
    isOpen: false,
    asset: null,
    name: '',
    description: '',
    version: '',
    status: 'published',
    rating: 8,
  });
  const [editMediaUrl, setEditMediaUrl] = useState<string | null>(null);
  const [editMediaType, setEditMediaType] = useState<'image' | 'video' | 'gradient'>('image');
  const editMediaFileInputRef = useRef<HTMLInputElement>(null);

  // Add/Upload Asset Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetDesc, setNewAssetDesc] = useState('');
  const [newAssetVersion, setNewAssetVersion] = useState('1.0.0');
  const [newAssetStatus, setNewAssetStatus] = useState<'published' | 'draft'>('published');
  const [newAssetRating, setNewAssetRating] = useState<number>(8);
  const [newProcessingMode, setNewProcessingMode] = useState<'screen_blend' | 'chroma_key' | 'alpha_channel' | 'original'>('screen_blend');
  const [newKeyColor, setNewKeyColor] = useState<'#000000' | '#00ff00' | '#ffffff'>('#000000');
  const [newBlendMode, setNewBlendMode] = useState<'screen' | 'additive' | 'normal'>('screen');
  const [previewBgDark, setPreviewBgDark] = useState(true);

  // Media Upload State (Image & Video)
  const [uploadedMediaUrl, setUploadedMediaUrl] = useState<string | null>(null);
  const [uploadedMediaType, setUploadedMediaType] = useState<'image' | 'video' | 'gradient'>('image');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadedFileSize, setUploadedFileSize] = useState<string>('');
  const [selectedRawFile, setSelectedRawFile] = useState<File | null>(null);
  const [uploadedVideoPosterUrl, setUploadedVideoPosterUrl] = useState<string | null>(null);
  const [uploadedPreviewVideoBlob, setUploadedPreviewVideoBlob] = useState<Blob | null>(null);
  const [uploadedPosterBlob, setUploadedPosterBlob] = useState<Blob | null>(null);
  const [uploadedThumbBlob, setUploadedThumbBlob] = useState<Blob | null>(null);
  const [uploadedDurationSec, setUploadedDurationSec] = useState<number | undefined>(undefined);
  const [uploadedDimensions, setUploadedDimensions] = useState<string | undefined>(undefined);
  const [uploadedChecksum, setUploadedChecksum] = useState<string | undefined>(undefined);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressState | null>(null);
  const [mediaUrlInput, setMediaUrlInput] = useState<string>('');
  const [mediaUploadTab, setMediaUploadTab] = useState<'file' | 'url' | 'gradient'>('file');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const mediaFileInputRef = useRef<HTMLInputElement>(null);

  // Live Inspection / Phone Mockup Preview Modal State
  const [previewInspectionAsset, setPreviewInspectionAsset] = useState<OnevaAsset | null>(null);

  // Delete confirmation modal state
  const [assetToDelete, setAssetToDelete] = useState<OnevaAsset | null>(null);
  const [isDeletingAsset, setIsDeletingAsset] = useState(false);

  const categoryDef = ASSET_CATEGORIES.find((c) => c.id === category);

  const reloadData = () => {
    const list = AdminAssetService.getAssetsByCategory(category, true);
    setAssets(list);
    setDefaultAsset(AdminAssetService.getDefaultAsset(category));
  };

  useEffect(() => {
    reloadData();
    return AdminAssetService.subscribe(() => {
      reloadData();
    });
  }, [category]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ZIP Handler with Non-Blocking Asynchronous Chunked Upload Engine
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setZipFile(file);
    setIsAnalyzingZip(true);
    setZipValidationResult(null);
    setIsZipModalOpen(true);

    try {
      // 1. Process upload through ChunkedUploadEngine (5-phase non-blocking progression)
      await ChunkedUploadEngine.processUpload({
        file,
        category,
        onProgress: (state) => {
          setUploadProgress(state);
        },
      });

      // 2. Validate extracted bundle structure without locking browser thread
      if (category === 'theme') {
        const res = await ThemeBundleValidator.validateThemeZip(file, file.name);
        setZipValidationResult(res);
      } else if (category === 'system_ui') {
        const res = await SystemUIBundleValidator.validateSystemUIZip(file, file.name);
        setZipValidationResult(res);
      } else {
        const res = await IconPackValidator.validateIconPackZip(file, file.name);
        setZipValidationResult(res);
      }
    } catch (err: any) {
      showToast(`Validation error: ${err?.message || 'Failed to inspect ZIP archive'}`);
    } finally {
      setIsAnalyzingZip(false);
      setTimeout(() => setUploadProgress(null), 1000);
    }
  };

  const handlePublishZipPack = async (customStatus: 'published' | 'draft' = 'published') => {
    if (!zipValidationResult || !zipValidationResult.isValid) {
      showToast('Cannot publish invalid or corrupt pack.');
      return;
    }

    if (category === 'theme') {
      const themeResult = zipValidationResult as ThemeValidationResult;
      if (!themeResult.themeDefinition) {
        showToast('Invalid theme bundle missing theme definition.');
        return;
      }
      const res = await AdminAssetService.registerValidatedTheme(
        themeResult.themeDefinition,
        themeResult,
        {
          fileName: zipFile?.name,
          status: customStatus,
          isDefault: customStatus === 'published' ? zipPublishDefault : false,
        }
      );
      if (res.success) {
        showToast(`Theme "${themeResult.themeDefinition.name}" ${customStatus === 'published' ? 'verified and published!' : 'saved as draft!'}`);
        setIsZipModalOpen(false);
        setZipFile(null);
        setZipValidationResult(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        showToast(`Publish error: ${res.error}`);
      }
    } else if (category === 'system_ui') {
      const sysResult = zipValidationResult as SystemUIValidationResult;
      if (!sysResult.systemUiConfig) {
        showToast('Invalid system UI bundle missing config.');
        return;
      }
      const manifestDef = {
        name: sysResult.name || 'System UI Bundle',
        version: '1.0.0',
        author: sysResult.author || 'ONEVA Designer',
        description: sysResult.description || 'System UI customization pack.',
      };
      const res = await AdminAssetService.registerValidatedSystemUI(
        manifestDef,
        sysResult,
        {
          fileName: zipFile?.name,
          status: customStatus,
          isDefault: customStatus === 'published' ? zipPublishDefault : false,
        }
      );
      if (res.success) {
        showToast(`System UI "${manifestDef.name}" ${customStatus === 'published' ? 'verified and published!' : 'saved as draft!'}`);
        setIsZipModalOpen(false);
        setZipFile(null);
        setZipValidationResult(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        showToast(`Publish error: ${res.error}`);
      }
    } else {
      const iconResult = zipValidationResult as IconPackValidationResult;
      if (!iconResult.manifest) {
        showToast('Invalid icon pack missing manifest.');
        return;
      }
      const res = await AdminAssetService.registerValidatedIconPack(
        iconResult.manifest,
        iconResult,
        {
          fileName: zipFile?.name,
          status: customStatus,
          isDefault: customStatus === 'published' ? zipPublishDefault : false,
          file: zipFile || undefined,
        } as any
      );

      if (res.success) {
        showToast(`Icon Pack "${iconResult.manifest.name}" (v${iconResult.manifest.version}) ${customStatus === 'published' ? 'verified and published!' : 'saved as draft!'}`);
        setIsZipModalOpen(false);
        setZipFile(null);
        setZipValidationResult(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        showToast(`Publish error: ${res.error}`);
      }
    }
  };

  const handleDownloadSampleZip = async (variant: 'purple_glass' | 'neon_matrix' = 'purple_glass') => {
    try {
      if (category === 'theme') {
        showToast('Generating official ONEVA_THEME_BUNDLE.zip...');
        const blob = await ThemeBundleValidator.createSampleThemeZip('neon_cyan');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ONEVA_NEON_CYAN_THEME_BUNDLE.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Sample Theme ZIP downloaded. You can test uploading it now!');
      } else if (category === 'system_ui') {
        showToast('Generating official ONEVA_SYSTEM_UI_BUNDLE.zip...');
        const blob = await SystemUIBundleValidator.createSampleSystemUIZip('Cyberpunk Emerald');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ONEVA_EMERALD_SYSTEM_UI_BUNDLE.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Sample System UI ZIP downloaded. You can test uploading it now!');
      } else {
        showToast('Generating official ONEVA_ICON_PACK.zip bundle...');
        const blob = await IconPackValidator.createSampleIconPackZip(variant);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = variant === 'purple_glass' ? 'ONEVA_PURPLE_GLASS_ICON_PACK.zip' : 'ONEVA_NEON_MATRIX_ICON_PACK.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Sample Icon Pack ZIP downloaded. You can test uploading it now!');
      }
    } catch (err) {
      showToast('Failed to generate sample zip');
    }
  };

  // Media File Handling (Image & Video) with ChunkedUploadEngine
  const handleMediaFileSelection = async (file: File, isEditMode = false) => {
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      showToast('Please select a valid image (PNG, JPG, WEBP, SVG) or video (MP4, WEBM) file.');
      return;
    }

    const sizeFormatted = (file.size / (1024 * 1024)).toFixed(2) + ' MB';

    if (isEditMode) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          setEditMediaUrl(dataUrl);
          setEditMediaType(isVideo ? 'video' : 'image');
        }
      };
      reader.readAsDataURL(file);
      return;
    }

    setSelectedRawFile(file);
    setUploadedFileName(file.name);
    setUploadedFileSize(sizeFormatted);
    setUploadedMediaType(isVideo ? 'video' : 'image');

    try {
      const uploadRes = await ChunkedUploadEngine.processUpload({
        file,
        category: category === 'wallpaper' && isVideo ? 'live_wallpaper' : category,
        onProgress: (state) => {
          setUploadProgress(state);
        },
      });

      if (uploadRes.success) {
        const mediaUrl = uploadRes.dataUrl || (uploadRes.originalFile ? URL.createObjectURL(uploadRes.originalFile) : '');
        if (mediaUrl) {
          setUploadedMediaUrl(mediaUrl);
        }
        setUploadedMediaType(uploadRes.mediaType === 'video' ? 'video' : 'image');
        if (uploadRes.videoPosterUrl) {
          setUploadedVideoPosterUrl(uploadRes.videoPosterUrl);
        }
        if (uploadRes.previewVideoBlob) setUploadedPreviewVideoBlob(uploadRes.previewVideoBlob);
        if (uploadRes.posterBlob) setUploadedPosterBlob(uploadRes.posterBlob);
        if (uploadRes.thumbnailBlob) setUploadedThumbBlob(uploadRes.thumbnailBlob);
        if (uploadRes.durationSec) setUploadedDurationSec(uploadRes.durationSec);
        if (uploadRes.dimensions) setUploadedDimensions(uploadRes.dimensions);
        if (uploadRes.checksum) setUploadedChecksum(uploadRes.checksum);
        showToast(`${isVideo ? 'Live video' : 'Image'} processed successfully through upload engine.`);
      } else {
        showToast(`Upload notice: ${uploadRes.error || 'Could not process media'}`);
      }
    } catch (err: any) {
      showToast(`Upload error: ${err?.message || 'Failed to process media file'}`);
    } finally {
      setTimeout(() => setUploadProgress(null), 1200);
    }
  };

  // Edit Asset Handlers
  const handleOpenEdit = (asset: OnevaAsset) => {
    setEditModal({
      isOpen: true,
      asset,
      name: asset.name,
      description: asset.description,
      version: asset.version,
      status: asset.status === 'published' ? 'published' : 'draft',
      rating: asset.rating ?? 8,
    });
    setEditMediaUrl(asset.previewData?.previewUrl || asset.previewData?.previewVideoUrl || null);
    setEditMediaType(
      asset.previewData?.mediaType || (asset.previewData?.previewVideoUrl ? 'video' : 'image')
    );
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal.asset || !editModal.name.trim()) return;

    const currentPreview = editModal.asset.previewData || {};
    const isVideo = editMediaType === 'video';
    const updatedPreview = {
      ...currentPreview,
      previewUrl: editMediaUrl || currentPreview.previewUrl,
      previewDataUrl: editMediaUrl || currentPreview.previewDataUrl,
      previewVideoUrl: isVideo ? editMediaUrl || currentPreview.previewVideoUrl : undefined,
      mediaType: editMediaType,
    };

    const res = await AdminAssetService.updateAsset(editModal.asset.id, {
      name: editModal.name.trim(),
      description: editModal.description.trim(),
      version: editModal.version.trim() || '1.0.0',
      status: editModal.status,
      rating: editModal.rating,
      isLiveWallpaper: isVideo || editModal.asset.isLiveWallpaper,
      previewData: updatedPreview,
      payload: {
        ...(editModal.asset.payload || {}),
        assetUrl: editMediaUrl || (editModal.asset.payload as any)?.assetUrl,
        wallpaperUrl: editMediaUrl || (editModal.asset.payload as any)?.wallpaperUrl,
        mediaType: isVideo ? 'wallpaper_live' : 'wallpaper_static',
      },
    });

    if (res.success) {
      if (editMediaUrl) {
        await AssetStorageService.saveMedia(
          editModal.asset.id,
          new Blob([editMediaUrl], { type: isVideo ? 'video/mp4' : 'image/png' }),
          { dataUrl: editMediaUrl, customName: editModal.name }
        ).catch(() => {});
      }
      showToast(`Asset "${editModal.name}" updated successfully with visual media.`);
      setEditModal({ isOpen: false, asset: null, name: '', description: '', version: '', status: 'published', rating: 8 });
      setEditMediaUrl(null);
    } else {
      showToast(`Update error: ${res.error}`);
    }
  };

  // Trigger Star Confirmation
  const handleInitiateSetDefault = (asset: OnevaAsset) => {
    if (asset.isDefault) return; // Already default

    setConfirmModal({
      isOpen: true,
      targetAsset: asset,
      previousDefault: defaultAsset,
    });
  };

  // Confirm Star Selection
  const handleConfirmSetDefault = async () => {
    if (!confirmModal.targetAsset) return;

    const target = confirmModal.targetAsset;
    const res = await AdminAssetService.setDefaultAsset(category, target.id);

    if (res.success) {
      showToast(`★ "${target.name}" is now the default for ${categoryDef?.name || category}.`);
    } else {
      showToast(`Error: ${res.error}`);
    }

    setConfirmModal({ isOpen: false, targetAsset: null, previousDefault: null });
  };

  // Immediate Apply to Live Phone Interface
  const handleApplyAsset = (asset: OnevaAsset) => {
    try {
      if (asset.category === 'wallpaper') {
        UserCustomizationService.applyItem('wallpaper', asset.id);
        WallpaperService.applyWallpaper({
          presetId: asset.id,
          assetId: asset.id,
          name: asset.name,
          source: 'preset',
        });
        if (asset.previewData?.previewUrl) {
          LauncherSettingsService.updateSettings({
            wallpaperId: asset.id,
            customWallpaperUrl: asset.previewData.previewUrl,
            wallpaperSource: 'admin_pack',
          });
        } else if (asset.previewData?.cssBackground) {
          LauncherSettingsService.updateSettings({
            wallpaperId: asset.id,
            customWallpaperUrl: undefined,
            wallpaperSource: 'admin_pack',
          });
        }
      } else if (asset.category === 'live_wallpaper') {
        UserCustomizationService.applyItem('live_wallpaper', asset.id);
        const videoUrl = asset.previewData?.previewVideoUrl || (asset.payload as any)?.assetUrl;
        WallpaperService.applyWallpaper({
          presetId: asset.id,
          assetId: asset.id,
          name: asset.name,
          source: 'preset',
          videoUrl,
        });
        LauncherSettingsService.updateSettings({
          wallpaperId: asset.id,
          customWallpaperUrl: videoUrl,
          wallpaperSource: 'admin_pack',
        });
      } else if (asset.category === 'theme') {
        UserCustomizationService.applyItem('theme', asset.id);
        ThemeService.applyTheme({
          assetId: asset.id,
          accentColor: (asset.payload as any)?.accentColor || (asset.payload as any)?.colors?.accent || '#10b981',
          mode: (asset.payload as any)?.mode || (asset.payload as any)?.appearance?.mode || 'dark',
          luminance: (asset.payload as any)?.luminanceLevel || (asset.payload as any)?.appearance?.luminance || 'pure_black',
        });
      } else if (asset.category === 'system_ui') {
        UserCustomizationService.applyItem('system_ui', asset.id);
        WidgetsSystemUIService.applySystemUIPack({
          id: asset.id,
          name: asset.name,
          config: (asset.payload as any)?.systemUIConfig || (asset.payload as any) || {},
        });
      } else if (asset.category === 'icon_pack') {
        IconService.setActiveGlobalPack(asset.id);
      } else if (asset.category === 'keyboard') {
        KeyboardService.saveSettings({
          activeThemeId: asset.id,
        });
      } else if (asset.category === 'keyboard_background') {
        UserCustomizationService.applyItem('keyboard_background', asset.id);
        KeyboardService.saveSettings({
          customBackgroundUrl: asset.previewData?.previewUrl || (asset.payload as any)?.assetUrl,
        });
      }
      showToast(`Successfully applied "${asset.name}" to the active phone interface.`);
    } catch (err: any) {
      showToast(`Error applying asset: ${err?.message || 'Unknown error'}`);
    }
  };

  // Toggle Publish
  const handleTogglePublish = async (assetId: string) => {
    const res = await AdminAssetService.togglePublish(assetId);
    if (res.success) {
      showToast(`Asset status changed to ${res.isPublished ? 'PUBLISHED' : 'DRAFT'}.`);
      if (res.warning) {
        setTimeout(() => showToast(res.warning!), 2500);
      }
    }
  };

  // Delete Asset Handlers
  const handleInitiateDelete = (asset: OnevaAsset) => {
    if (asset.isDefault) {
      showToast(`Cannot delete active ⭐ Default. Star another asset first.`);
      return;
    }
    setAssetToDelete(asset);
  };

  const handleConfirmDelete = async () => {
    if (!assetToDelete) return;
    setIsDeletingAsset(true);
    try {
      const res = await AdminAssetService.deleteAsset(assetToDelete.id);
      if (res.success) {
        showToast(`Asset "${assetToDelete.name}" permanently deleted.`);
        setAssetToDelete(null);
      } else {
        showToast(`Delete failed: ${res.error}`);
      }
    } catch (err: any) {
      showToast(`Delete error: ${err?.message || 'Failed to delete'}`);
    } finally {
      setIsDeletingAsset(false);
    }
  };

  // Add Asset Form Submit
  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetName.trim()) return;

    const finalMediaUrl = uploadedMediaUrl || (mediaUrlInput.trim() || undefined);
    const isVideo = uploadedMediaType === 'video';

    let thumbUrl: string | undefined = undefined;
    if (finalMediaUrl && !isVideo) {
      try {
        thumbUrl = await AssetStorageService.generateThumbnail(finalMediaUrl, 480);
      } catch {
        thumbUrl = finalMediaUrl;
      }
    } else if (uploadedVideoPosterUrl) {
      thumbUrl = uploadedVideoPosterUrl;
    }

    const targetCategory = category === 'wallpaper' && isVideo ? 'live_wallpaper' : category;

    const created = await AdminAssetService.createAsset({
      name: newAssetName.trim(),
      description: newAssetDesc.trim() || 'Custom admin asset package.',
      version: newAssetVersion.trim() || '1.0.0',
      category: targetCategory,
      isLiveWallpaper: isVideo || (category === 'wallpaper' && isVideo),
      status: newAssetStatus,
      author: 'Admin Portal',
      rating: newAssetRating,
      fileSize: uploadedFileSize || undefined,
      fileSizeBytes: selectedRawFile?.size,
      dimensions: uploadedDimensions,
      durationSec: uploadedDurationSec,
      checksum: uploadedChecksum,
      processingMode: categoryDef?.supportsTransparency ? newProcessingMode : undefined,
      keyColor: newProcessingMode === 'chroma_key' ? newKeyColor : undefined,
      blendMode: categoryDef?.supportsTransparency ? newBlendMode : undefined,
      previewData: {
        color: '#10b981',
        previewUrl: finalMediaUrl,
        previewThumbnailUrl: thumbUrl || finalMediaUrl,
        previewDataUrl: finalMediaUrl,
        previewVideoUrl: isVideo ? finalMediaUrl : undefined,
        mediaType: uploadedMediaType,
        cssBackground: category === 'wallpaper' && uploadedMediaType === 'gradient' ? mediaUrlInput : undefined,
      },
      payload: {
        custom: true,
        category: targetCategory,
        assetUrl: finalMediaUrl,
        wallpaperUrl: finalMediaUrl,
        mediaType: isVideo ? 'wallpaper_live' : 'wallpaper_static',
      },
    });

    if (created) {
      if (selectedRawFile) {
        // Upload original source file and previews to ScalableStorageService (remote bucket + local cache)
        ScalableStorageService.uploadAssetMedia({
          assetId: created.id,
          category: targetCategory,
          fileName: selectedRawFile.name,
          file: selectedRawFile,
          previewBlob: finalMediaUrl,
          previewVideoBlob: uploadedPreviewVideoBlob || undefined,
          thumbnailBlob: uploadedThumbBlob || thumbUrl || finalMediaUrl,
          posterBlob: uploadedPosterBlob || uploadedVideoPosterUrl || undefined,
        }).then((storageRes) => {
          if (storageRes.success) {
            AdminAssetService.updateAsset(created.id, {
              storagePaths: storageRes.storagePaths,
              mediaUrls: storageRes.mediaUrls,
            });
          } else if (storageRes.isQuotaError) {
            showToast(storageRes.error || 'Storage upload rejected: Quota exceeded');
          }
        }).catch((e) => console.warn('[AdminCategoryView] ScalableStorage notice:', e));
      } else if (finalMediaUrl) {
        await AssetStorageService.saveMedia(
          created.id,
          new Blob([finalMediaUrl], { type: isVideo ? 'video/mp4' : 'image/png' }),
          { dataUrl: finalMediaUrl, thumbnailUrl: thumbUrl || finalMediaUrl, customName: created.name }
        ).catch(() => {});
      }
    }

    showToast(`Asset "${newAssetName}" created successfully!`);
    setIsAddModalOpen(false);
    setNewAssetName('');
    setNewAssetDesc('');
    setUploadedMediaUrl(null);
    setUploadedFileName('');
    setUploadedFileSize('');
    setSelectedRawFile(null);
    setUploadedVideoPosterUrl(null);
    setUploadedPreviewVideoBlob(null);
    setUploadedPosterBlob(null);
    setUploadedThumbBlob(null);
    setUploadedDurationSec(undefined);
    setUploadedDimensions(undefined);
    setUploadedChecksum(undefined);
    setMediaUrlInput('');
  };

  const filteredAssets = assets.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 border border-emerald-500/40 text-emerald-300 text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {title || categoryDef?.name || 'Asset Management'}
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            {subtitle || categoryDef?.description || 'Manage published assets and configure the single active ⭐ Default.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start">
          {category === 'theme' && (
            <button
              type="button"
              onClick={() => setIsThemeCreatorOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-semibold hover:bg-cyan-500/30 transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-950/20"
              title="Build theme from standalone wallpaper and icon pack"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Theme Creator</span>
            </button>
          )}

          {(category === 'icon_pack' || category === 'theme' || category === 'system_ui') && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                onChange={handleFileChange}
                className="hidden"
                id="bundle-zip-input"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-semibold hover:bg-purple-500/30 transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-950/20"
                title={
                  category === 'theme'
                    ? 'Upload structured ONEVA_THEME_BUNDLE.zip with theme.json'
                    : category === 'system_ui'
                    ? 'Upload structured ONEVA_SYSTEM_UI_BUNDLE.zip with system_ui.json'
                    : 'Upload structured ONEVA_ICON_PACK.zip with manifest.json'
                }
              >
                <FileArchive className="w-4 h-4 text-purple-400" />
                <span>
                  {category === 'theme'
                    ? 'Upload ZIP Theme'
                    : category === 'system_ui'
                    ? 'Upload ZIP System UI'
                    : 'Upload ZIP Icon Pack'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadSampleZip('purple_glass')}
                className="px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs font-medium hover:bg-neutral-800 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Download a verified sample ZIP bundle for testing"
              >
                <Download className="w-3.5 h-3.5 text-neutral-400" />
                <span>
                  {category === 'theme'
                    ? 'Sample Theme ZIP'
                    : category === 'system_ui'
                    ? 'Sample UI ZIP'
                    : 'Sample Icon ZIP'}
                </span>
              </button>
            </>
          )}

          <button
            id="admin-add-asset-btn"
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-500 text-neutral-950 text-xs font-semibold hover:bg-emerald-400 transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/30"
          >
            <Plus className="w-4 h-4" />
            <span>Add Asset</span>
          </button>
        </div>
      </div>

      {/* ⭐ Active Default Highlight Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-amber-300">
                Current Full Pack Default
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                ★ ACTIVE
              </span>
            </div>
            <p className="text-sm font-semibold text-white mt-0.5">
              {defaultAsset ? defaultAsset.name : 'No default selected yet'}
            </p>
            <p className="text-xs text-neutral-400 mt-0.5">
              {defaultAsset
                ? `${defaultAsset.description} (v${defaultAsset.version})`
                : 'Please select one published asset as the active default below.'}
            </p>
          </div>
        </div>

        <div className="text-xs text-neutral-400 font-mono sm:text-right">
          <span className="block text-[10px] text-neutral-500 uppercase">Rule 4 Enforcement</span>
          <span className="text-amber-400 font-medium">Exactly 1 Default Per Category</span>
        </div>
      </div>

      {/* 🎨 Dual-Method Theme Creation & Ingestion Cards (Requirement: Admin Dual Flow) */}
      {category === 'theme' && (
        <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-b from-purple-950/20 via-neutral-900/40 to-neutral-950/40 p-5 backdrop-blur-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-500/15 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono">
                  Theme Ingestion & Creation Architecture
                </h3>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Choose complete ZIP bundle ingestion or assemble customized themes directly from standalone media assets.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                Dual Method Pipeline
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* OPTION A: Complete Theme ZIP */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/80 p-4 flex flex-col justify-between hover:border-purple-500/40 transition">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      METHOD 1
                    </span>
                    <h4 className="text-xs font-bold text-white">Complete Theme ZIP Upload</h4>
                  </div>
                  <FileArchive className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                  Upload an official <span className="font-mono text-neutral-300">ONEVA_THEME_BUNDLE.zip</span> containing <span className="font-mono text-neutral-300">theme.json</span>, bundled OLED/video wallpaper, app icons, and quick-settings styling.
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[10px] text-neutral-400">
                  <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800">theme.json</span>
                  <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800">wallpaper.png/mp4</span>
                  <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800">icons.zip / icons/</span>
                  <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800">previews</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-900 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-purple-950/40 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Theme ZIP</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadSampleZip('purple_glass')}
                  className="py-2 px-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs transition flex items-center gap-1.5 cursor-pointer"
                  title="Download verified ONEVA sample theme ZIP"
                >
                  <Download className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Sample</span>
                </button>
              </div>
            </div>

            {/* OPTION B: Build Theme from Assets */}
            <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/20 via-neutral-950 to-neutral-950/90 p-4 flex flex-col justify-between hover:border-cyan-500/50 transition">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      METHOD 2
                    </span>
                    <h4 className="text-xs font-bold text-white">Build Theme from Assets</h4>
                  </div>
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                </div>
                <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                  Assemble a custom theme by combining standalone wallpaper (Image / Video) and standalone Icon Pack (ZIP), registering reusable assets into the catalog.
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-[10px] text-neutral-400">
                  <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800">Wallpaper (Image/Video)</span>
                  <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800">Icon Pack ZIP</span>
                  <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800">Colors & Luminance</span>
                  <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800">Draft/Publish</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-900 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsThemeCreatorOpen(true)}
                  className="flex-1 py-2 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/40 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Open Theme Creator</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${categoryDef?.name || 'assets'}...`}
            className="w-full px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {categoryDef?.supportsTransparency && (
          <button
            type="button"
            onClick={() => setPreviewBgDark(!previewBgDark)}
            className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 transition"
            title="Toggle preview contrast background"
          >
            {previewBgDark ? <Moon className="w-3.5 h-3.5 text-sky-400" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
            <span className="hidden sm:inline">Preview Bg: {previewBgDark ? 'Dark OLED' : 'Light'}</span>
          </button>
        )}
      </div>

      {/* Asset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAssets.map((asset) => {
          const isCurrentDefault = asset.isDefault;
          const isPublished = asset.status === 'published';

          return (
            <div
              key={asset.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isCurrentDefault
                  ? 'bg-neutral-900/90 border-amber-500/50 shadow-lg shadow-amber-950/20 ring-1 ring-amber-500/30'
                  : 'bg-neutral-900/50 hover:bg-neutral-900/80 border-neutral-800'
              }`}
            >
              <div className="space-y-3">
                {/* Status Badges */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {isCurrentDefault ? (
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                        ★ DEFAULT
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                        Candidate
                      </span>
                    )}

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${
                        isPublished
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-neutral-800 text-neutral-500 border border-neutral-700'
                      }`}
                    >
                      {asset.status}
                    </span>

                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-500/30 flex items-center gap-1 font-semibold"
                      title="Admin Blue-Star Ranking Priority (1-10)"
                    >
                      <Star className="w-3 h-3 fill-blue-400 text-blue-400" />
                      <span>{asset.rating ?? 8}</span>
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-neutral-400">
                    v{asset.version}
                  </span>
                </div>

                {/* Visual Media Preview Banner */}
                <div className="relative w-full h-28 rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800/80 flex items-center justify-center group/preview">
                  {(() => {
                    const isVid = Boolean(
                      asset.previewData?.previewVideoUrl ||
                      asset.previewData?.mediaType === 'video' ||
                      asset.isLiveWallpaper ||
                      asset.category === 'live_wallpaper'
                    );
                    const vidUrl =
                      asset.previewData?.previewVideoUrl ||
                      (isVid ? (asset.payload as any)?.assetUrl : null) ||
                      (isVid ? AssetStorageService.getMediaSync(asset.id)?.dataUrl : null);

                    if (vidUrl) {
                      return (
                        <div className="relative w-full h-full bg-black flex items-center justify-center">
                          <video
                            src={vidUrl}
                            muted
                            loop
                            playsInline
                            autoPlay
                            className="w-full h-full object-cover opacity-85"
                          />
                          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 border border-white/20 text-[9px] font-mono text-white flex items-center gap-1">
                            <Video className="w-2.5 h-2.5 text-rose-400" />
                            <span>VIDEO</span>
                          </div>
                        </div>
                      );
                    }

                    const imgUrl =
                      asset.previewData?.previewThumbnailUrl ||
                      asset.previewData?.previewUrl ||
                      asset.previewData?.previewDataUrl ||
                      (asset.payload as any)?.assetUrl ||
                      (asset.payload as any)?.wallpaperUrl ||
                      AssetStorageService.getMediaSync(asset.id)?.thumbnailUrl ||
                      AssetStorageService.getMediaSync(asset.id)?.dataUrl;

                    if (imgUrl) {
                      return (
                        <img
                          src={imgUrl}
                          alt={asset.name}
                          className="w-full h-full object-cover group-hover/preview:scale-105 transition-transform duration-300"
                        />
                      );
                    }

                    if (asset.category === 'wallpaper' && asset.previewData?.cssBackground) {
                      return (
                        <div
                          className="w-full h-full flex flex-col justify-end p-2.5"
                          style={{ background: asset.previewData.cssBackground }}
                        >
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/60 text-white/90 backdrop-blur-sm self-start border border-white/10">
                            OLED Swatch
                          </span>
                        </div>
                      );
                    }

                    if (asset.category === 'icon_pack') {
                      return (
                        <div className="w-full h-full flex items-center justify-center gap-2 p-3 bg-gradient-to-br from-neutral-900 to-neutral-950">
                          <div className="w-8 h-8 rounded-xl bg-neutral-800 border border-neutral-700/80 flex items-center justify-center text-xs font-bold text-amber-400 shadow">
                            📞
                          </div>
                          <div className="w-8 h-8 rounded-xl bg-neutral-800 border border-neutral-700/80 flex items-center justify-center text-xs font-bold text-emerald-400 shadow">
                            💬
                          </div>
                          <div className="w-8 h-8 rounded-xl bg-neutral-800 border border-neutral-700/80 flex items-center justify-center text-xs font-bold text-sky-400 shadow">
                            📷
                          </div>
                          <div className="w-8 h-8 rounded-xl bg-neutral-800 border border-neutral-700/80 flex items-center justify-center text-xs font-bold text-purple-400 shadow">
                            ⚙️
                          </div>
                        </div>
                      );
                    }

                    if (asset.category === 'keyboard') {
                      return (
                        <div className="w-full h-full flex flex-col justify-center p-2.5 bg-neutral-950">
                          <div className="flex justify-center gap-1">
                            {['Q', 'W', 'E', 'R', 'T', 'Y'].map((k) => (
                              <div
                                key={k}
                                className="w-6 h-6 rounded bg-neutral-800/90 border border-neutral-700/70 flex items-center justify-center text-[10px] text-white font-mono shadow-sm"
                                style={{
                                  backgroundColor: asset.previewData?.keyBg || undefined,
                                  color: asset.previewData?.textColor || undefined,
                                }}
                              >
                                {k}
                              </div>
                            ))}
                          </div>
                          <div className="mt-1.5 flex justify-center">
                            <div
                              className="h-1.5 w-24 rounded-full"
                              style={{ backgroundColor: asset.previewData?.color || '#10b981' }}
                            />
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        className="w-full h-full flex flex-col justify-end p-2.5"
                        style={{
                          background: asset.previewData?.color
                            ? `radial-gradient(circle at 50% 30%, ${asset.previewData.color}40 0%, #050a14 75%, #000000 100%)`
                            : 'linear-gradient(180deg, #1e1b4b 0%, #030712 100%)',
                        }}
                      >
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/60 text-white/90 backdrop-blur-sm self-start border border-white/10">
                          {asset.category.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Inspect Overlay on hover */}
                  <button
                    type="button"
                    onClick={() => setPreviewInspectionAsset(asset)}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold backdrop-blur-xs cursor-pointer"
                  >
                    <Eye className="w-4 h-4 text-emerald-400" />
                    <span>Device Preview</span>
                  </button>
                </div>

                {/* Asset Details */}
                <div>
                  <h3 className="text-sm font-semibold text-white">{asset.name}</h3>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    {asset.description}
                  </p>
                </div>

                {/* Transparency / Processing Mode Details */}
                {asset.processingMode && (
                  <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800/80 text-[11px] font-mono flex items-center justify-between text-neutral-400">
                    <span>Mode: <strong className="text-neutral-200">{asset.processingMode}</strong></span>
                    {asset.blendMode && (
                      <span>Blend: <strong className="text-neutral-200">{asset.blendMode}</strong></span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-4 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(asset.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition cursor-pointer ${
                      isPublished
                        ? 'bg-neutral-800 text-neutral-300 hover:text-white border-neutral-700'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                    }`}
                  >
                    {isPublished ? 'Unpublish' : 'Publish'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyAsset(asset)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition cursor-pointer flex items-center gap-1"
                    title="Apply directly to active phone environment"
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>Apply</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewInspectionAsset(asset)}
                    className="p-1 rounded-lg text-neutral-400 hover:text-sky-300 hover:bg-neutral-800 transition cursor-pointer"
                    title="Live Device Preview"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(asset)}
                    className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
                    title="Edit metadata & media"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {!isCurrentDefault && (
                    <button
                      type="button"
                      onClick={() => handleInitiateDelete(asset)}
                      className="p-1 rounded-lg text-neutral-500 hover:text-rose-400 transition cursor-pointer"
                      title="Delete asset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* ⭐ Star / Set Default Button */}
                {isCurrentDefault ? (
                  <button
                    type="button"
                    disabled
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 cursor-default"
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-300" />
                    <span>Active Default</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleInitiateSetDefault(asset)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition cursor-pointer bg-neutral-800 hover:bg-amber-500/20 hover:text-amber-300 hover:border-amber-500/30 text-neutral-300 border border-neutral-700"
                    title={isPublished ? 'Set as active default for Full ONEVA Pack' : 'Publish & set as active default for Full ONEVA Pack'}
                  >
                    <Star className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isPublished ? 'Set Default' : 'Publish & Set Default'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal for Default Star Replacement */}
      {confirmModal.isOpen && confirmModal.targetAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                <Star className="w-5 h-5 fill-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Set Full ONEVA Pack Default?</h3>
                <p className="text-[11px] text-neutral-400">Atomic default replacement workflow</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs space-y-2">
              <p className="text-neutral-200">
                Set <strong className="text-white">"{confirmModal.targetAsset.name}"</strong> as the Full ONEVA Pack default for <strong className="text-emerald-400">{categoryDef?.name}</strong>?
              </p>
              {confirmModal.targetAsset.status !== 'published' && (
                <p className="text-amber-300 text-[11px] bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 font-mono">
                  ⚡ Asset is currently {confirmModal.targetAsset.status.toUpperCase()}. Setting it as default will automatically publish it for all users.
                </p>
              )}
              {confirmModal.previousDefault && (
                <p className="text-neutral-400">
                  The previous default (<span className="line-through text-neutral-400 font-medium">{confirmModal.previousDefault.name}</span>) will be automatically unstarred.
                </p>
              )}
            </div>

            <p className="text-[11px] text-neutral-400">
              This will update the Full ONEVA Pack configuration in Supabase and notify all clients immediately.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, targetAsset: null, previousDefault: null })}
                className="px-4 py-2 rounded-xl text-xs text-neutral-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSetDefault}
                className="px-5 py-2 rounded-xl bg-amber-500 text-neutral-950 text-xs font-bold hover:bg-amber-400 transition flex items-center gap-1.5"
              >
                <Star className="w-3.5 h-3.5 fill-neutral-950" />
                <span>Confirm &amp; Set Default</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Upload Asset Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Add New {categoryDef?.name || 'Asset'}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAsset} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-300 font-medium mb-1">Asset Name</label>
                <input
                  type="text"
                  required
                  value={newAssetName}
                  onChange={(e) => setNewAssetName(e.target.value)}
                  placeholder="e.g. Obsidian Velocity Flux"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Description / Tagline</label>
                <textarea
                  rows={2}
                  value={newAssetDesc}
                  onChange={(e) => setNewAssetDesc(e.target.value)}
                  placeholder="Technical description of the asset..."
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">Semantic Version</label>
                  <input
                    type="text"
                    value={newAssetVersion}
                    onChange={(e) => setNewAssetVersion(e.target.value)}
                    placeholder="1.0.0"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">Initial Status</label>
                  <select
                    value={newAssetStatus}
                    onChange={(e) => setNewAssetStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="published">Published (Ready)</option>
                    <option value="draft">Draft (Private)</option>
                  </select>
                </div>
              </div>

              {/* Admin Blue-Star Rating (1 - 10 Priority Ranking) */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-neutral-300 font-medium">
                    <Star className="w-3.5 h-3.5 fill-blue-400 text-blue-400" />
                    <span>Admin Blue-Star Rating (Priority Ranking 1–10)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-blue-950/60 border border-blue-500/40 text-blue-300 font-mono text-xs font-bold">
                    ★ {newAssetRating} / 10
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={newAssetRating}
                  onChange={(e) => setNewAssetRating(parseInt(e.target.value, 10))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <p className="text-[10px] text-neutral-500">
                  Controls ranking priority in the Asset Browser. 10 is highest display priority (10 → 9 → ... → 1).
                </p>
              </div>

              {/* Media Upload Section (Image or Video) */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-neutral-300 font-medium">
                    <Film className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Visual Asset Media (Image / Video)</span>
                  </div>
                  <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded-lg border border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setMediaUploadTab('file')}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                        mediaUploadTab === 'file' ? 'bg-emerald-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      File Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaUploadTab('url')}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                        mediaUploadTab === 'url' ? 'bg-emerald-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      URL Link
                    </button>
                    {category === 'wallpaper' && (
                      <button
                        type="button"
                        onClick={() => setMediaUploadTab('gradient')}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                          mediaUploadTab === 'gradient' ? 'bg-emerald-500 text-neutral-950 font-bold' : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        OLED Swatches
                      </button>
                    )}
                  </div>
                </div>

                {/* Hidden File Input */}
                <input
                  ref={mediaFileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleMediaFileSelection(file, false);
                  }}
                  className="hidden"
                />

                {/* Upload Progress Bar */}
                {uploadProgress && (
                  <div className="p-3 rounded-xl bg-neutral-900 border border-cyan-500/40 space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] text-cyan-300 font-bold uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        <span>Pipeline: {uploadProgress.step.replace('_', ' ')}</span>
                      </div>
                      <span className="font-mono text-cyan-400 font-bold text-[11px]">
                        {Math.round(uploadProgress.progressPercent)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-200"
                        style={{ width: `${Math.max(5, uploadProgress.progressPercent)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-neutral-400 truncate">{uploadProgress.statusMessage}</p>
                  </div>
                )}

                {mediaUploadTab === 'file' && (
                  <div className="space-y-2.5">
                    {uploadedMediaUrl ? (
                      <div className="relative rounded-xl overflow-hidden border border-emerald-500/40 bg-neutral-900 p-2 space-y-2">
                        <div className="relative h-36 w-full rounded-lg overflow-hidden bg-black flex items-center justify-center">
                          {uploadedMediaType === 'video' ? (
                            <video
                              src={uploadedMediaUrl}
                              controls
                              autoPlay
                              loop
                              muted
                              playsInline
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <img
                              src={uploadedMediaUrl}
                              alt="Uploaded preview"
                              className="h-full w-full object-contain"
                            />
                          )}
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 border border-white/20 text-[10px] font-mono text-emerald-400 flex items-center gap-1 backdrop-blur-sm">
                            {uploadedMediaType === 'video' ? <Video className="w-3 h-3 text-rose-400" /> : <ImageIcon className="w-3 h-3 text-emerald-400" />}
                            <span>{uploadedMediaType.toUpperCase()} ATTACHED</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1">
                          <div className="truncate max-w-[240px]">
                            <span className="text-white font-medium">{uploadedFileName || 'Media File'}</span>
                            {uploadedFileSize && <span className="text-neutral-500 ml-1.5">({uploadedFileSize})</span>}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => mediaFileInputRef.current?.click()}
                              className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition text-[10px] cursor-pointer"
                            >
                              Change File
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setUploadedMediaUrl(null);
                                setUploadedFileName('');
                                setUploadedFileSize('');
                              }}
                              className="p-1 rounded bg-neutral-800 hover:bg-rose-500/20 hover:text-rose-400 text-neutral-400 transition cursor-pointer"
                              title="Remove media"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingOver(true);
                        }}
                        onDragLeave={() => setIsDraggingOver(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingOver(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file) handleMediaFileSelection(file, false);
                        }}
                        onClick={() => mediaFileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-5 text-center transition cursor-pointer flex flex-col items-center justify-center gap-2 ${
                          isDraggingOver
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/40 hover:bg-neutral-900/80'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                          <UploadCloud className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-white">
                            Click to browse or drop an Image / Video here
                          </p>
                          <p className="text-[10px] text-neutral-500 mt-0.5">
                            Supports PNG, JPG, WEBP, GIF, SVG, and MP4/WEBM videos
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-neutral-800 text-[10px] font-mono text-neutral-300 border border-neutral-700">
                          Select Image or Video
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {mediaUploadTab === 'url' && (
                  <div className="space-y-2">
                    <label className="block text-neutral-400 text-[10px]">
                      Direct Image or Video URL
                    </label>
                    <input
                      type="url"
                      value={mediaUrlInput}
                      onChange={(e) => {
                        setMediaUrlInput(e.target.value);
                        setUploadedMediaUrl(e.target.value);
                        setUploadedMediaType(
                          e.target.value.match(/\.(mp4|webm|mov)(\?.*)?$/i) ? 'video' : 'image'
                        );
                      }}
                      placeholder="https://images.unsplash.com/... or https://.../video.mp4"
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
                    />
                    {mediaUrlInput && (
                      <div className="h-28 rounded-xl overflow-hidden bg-black flex items-center justify-center border border-neutral-800">
                        {mediaUrlInput.match(/\.(mp4|webm|mov)(\?.*)?$/i) ? (
                          <video src={mediaUrlInput} controls autoPlay loop muted className="h-full w-full object-contain" />
                        ) : (
                          <img src={mediaUrlInput} alt="Preview from URL" className="h-full w-full object-contain" />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {mediaUploadTab === 'gradient' && category === 'wallpaper' && (
                  <div className="space-y-2">
                    <span className="block text-neutral-400 text-[10px]">Curated Pure OLED Presets</span>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { name: 'OLED Obsidian Flux', value: 'radial-gradient(ellipse at top, #0f172a 0%, #020617 45%, #000000 100%)' },
                        { name: 'Cyber Emerald Aurora', value: 'linear-gradient(180deg, #022c22 0%, #050505 50%, #000000 100%)' },
                        { name: 'Deep Amethyst Void', value: 'linear-gradient(135deg, #1e1b4b 0%, #030712 60%, #000000 100%)' },
                        { name: 'Phosphor Amber Glow', value: 'radial-gradient(circle at center, #451a03 0%, #0a0a0a 60%, #000000 100%)' },
                      ].map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            setMediaUrlInput(preset.value);
                            setUploadedMediaUrl(null);
                            setUploadedMediaType('gradient');
                            showToast(`Selected "${preset.name}" swatch`);
                          }}
                          className="p-2 rounded-xl border border-neutral-800 text-left flex items-center gap-2 hover:border-emerald-500/50 transition cursor-pointer"
                        >
                          <div className="w-6 h-6 rounded-lg shrink-0 border border-white/10" style={{ background: preset.value }} />
                          <span className="text-[10px] text-neutral-300 truncate">{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {categoryDef?.supportsTransparency && (
                <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                  <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block">
                    Transparency &amp; Background Removal Mode
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-neutral-400 text-[10px] mb-1">Extraction Method</label>
                      <select
                        value={newProcessingMode}
                        onChange={(e) => setNewProcessingMode(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white"
                      >
                        <option value="screen_blend">Screen Blend (Hardware Additive)</option>
                        <option value="chroma_key">Chroma-Key Extraction</option>
                        <option value="alpha_channel">Alpha Channel Transparency</option>
                        <option value="original">Original (No Removal)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-neutral-400 text-[10px] mb-1">Hardware Blend Mode</label>
                      <select
                        value={newBlendMode}
                        onChange={(e) => setNewBlendMode(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white"
                      >
                        <option value="screen">Screen</option>
                        <option value="additive">Additive</option>
                        <option value="normal">Normal</option>
                      </select>
                    </div>
                  </div>

                  {newProcessingMode === 'chroma_key' && (
                    <div>
                      <label className="block text-neutral-400 text-[10px] mb-1">Chroma Key Color to Extract</label>
                      <select
                        value={newKeyColor}
                        onChange={(e) => setNewKeyColor(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white font-mono"
                      >
                        <option value="#000000">Pure Black (#000000)</option>
                        <option value="#00ff00">Green Screen (#00ff00)</option>
                        <option value="#ffffff">Pure White (#ffffff)</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 text-neutral-950 font-bold hover:bg-emerald-400 transition flex items-center gap-1.5"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Register Asset</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ZIP Upload & Validation Modal */}
      {isZipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-2xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <FileArchive className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {category === 'theme'
                      ? 'Validate Theme Bundle ZIP Archive'
                      : category === 'system_ui'
                      ? 'Validate System UI Bundle ZIP Archive'
                      : 'Validate Icon Pack ZIP Archive'}
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    {zipFile?.name ||
                      (category === 'theme'
                        ? 'ONEVA_THEME.zip'
                        : category === 'system_ui'
                        ? 'ONEVA_SYSTEM_UI.zip'
                        : 'ONEVA_ICON_PACK.zip')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsZipModalOpen(false);
                  setZipFile(null);
                  setZipValidationResult(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="p-1 rounded text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isAnalyzingZip && (
              <div className="py-8 px-4 rounded-xl bg-neutral-900/90 border border-purple-500/30 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-purple-300 font-medium">Decompressing and validating archive structure...</p>
                {uploadProgress ? (
                  <div className="w-full max-w-sm mx-auto space-y-2 pt-2">
                    <div className="flex justify-between text-[11px] font-mono text-purple-300 font-bold">
                      <span className="uppercase">{uploadProgress.step.replace('_', ' ')}</span>
                      <span>{Math.round(uploadProgress.progressPercent)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-200"
                        style={{ width: `${Math.max(5, uploadProgress.progressPercent)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-neutral-400">{uploadProgress.statusMessage}</p>
                  </div>
                ) : (
                  <p className="text-[11px] text-neutral-500">
                    {category === 'theme'
                      ? 'Inspecting theme.json and wallpaper assets...'
                      : category === 'system_ui'
                      ? 'Inspecting system_ui.json and UI parameters...'
                      : 'Inspecting manifest.json and icon mappings...'}
                  </p>
                )}
              </div>
            )}

            {!isAnalyzingZip && zipValidationResult && (
              <div className="space-y-4 text-xs">
                {/* Validation Status Banner */}
                <div
                  className={`p-3.5 rounded-xl border flex items-center justify-between ${
                    zipValidationResult.isValid
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {zipValidationResult.isValid ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                    )}
                    <div>
                      <span className="font-bold block">
                        {zipValidationResult.isValid
                          ? category === 'theme'
                            ? 'VALID ONEVA THEME BUNDLE'
                            : category === 'system_ui'
                            ? 'VALID ONEVA SYSTEM UI BUNDLE'
                            : 'VALID ONEVA ICON PACK ARCHIVE'
                          : 'INVALID ARCHIVE STRUCTURE'}
                      </span>
                      <span className="text-[11px] opacity-80">
                        {zipValidationResult.isValid
                          ? 'All manifest requirements, configuration parameters, and bundled assets passed verification.'
                          : 'Archive failed verification. Review errors below before publishing.'}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-neutral-900 border border-neutral-700">
                    {(zipValidationResult.zipSize / 1024).toFixed(1)} KB
                  </span>
                </div>

                {/* Errors List */}
                {zipValidationResult.errors.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-800/50 space-y-1.5">
                    <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block">
                      Validation Errors ({zipValidationResult.errors.length})
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-rose-300 text-[11px]">
                      {zipValidationResult.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warnings List */}
                {zipValidationResult.warnings.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-1 text-amber-300 text-[11px]">
                    <span className="font-semibold block uppercase text-[10px] text-amber-400">Warnings</span>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {zipValidationResult.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Theme Metadata View */}
                {category === 'theme' && (zipValidationResult as ThemeValidationResult).themeDefinition && (
                  <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                    {(() => {
                      const tDef = (zipValidationResult as ThemeValidationResult).themeDefinition!;
                      const tRes = zipValidationResult as ThemeValidationResult;
                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-white font-semibold text-sm">{tDef.name}</span>
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                                style={{ backgroundColor: tDef.colors?.accent || '#06b6d4' }}
                              />
                              <span className="font-mono text-[10px] text-neutral-300">{tDef.colors?.accent || '#06b6d4'}</span>
                            </div>
                          </div>

                          <p className="text-neutral-400 text-[11px] leading-relaxed">
                            {tDef.description || 'Custom theme package.'}
                          </p>

                          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-900 font-mono text-[10px] text-neutral-400">
                            <div>
                              Mode: <strong className="text-neutral-200 capitalize">{tDef.appearance?.mode || 'oled'}</strong>
                            </div>
                            <div>
                              Luminance: <strong className="text-neutral-200">{tDef.appearance?.luminance || 'pure_black'}</strong>
                            </div>
                            <div>
                              Blur: <strong className="text-emerald-400">{tDef.quickSettings?.backgroundBlur ?? 16}px</strong>
                            </div>
                          </div>

                          {/* Bundled Wallpaper Preview (Video or Image) */}
                          {tRes.wallpaperDataUrl && (
                            <div className="pt-2 border-t border-neutral-900 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
                                  Bundled Wallpaper ({tRes.isLiveWallpaper || tRes.wallpaperType === 'video' ? 'Live Video' : 'Static Image'})
                                </span>
                                {(tRes.isLiveWallpaper || tRes.wallpaperType === 'video') && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                                    LIVE MP4/WEBM
                                  </span>
                                )}
                              </div>
                              <div className="w-28 h-44 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 relative shadow-inner">
                                {tRes.isLiveWallpaper || tRes.wallpaperType === 'video' ? (
                                  <video
                                    src={tRes.wallpaperDataUrl}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <img
                                    src={tRes.wallpaperDataUrl}
                                    alt="Bundled Wallpaper"
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                )}
                              </div>
                            </div>
                          )}

                          {/* Extracted Icons Preview */}
                          {tRes.extractedIcons && Object.keys(tRes.extractedIcons).length > 0 && (
                            <div className="pt-2 border-t border-neutral-900 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
                                  Extracted Icons ({Object.keys(tRes.extractedIcons).length} apps matched)
                                </span>
                                <span className="text-[9px] font-mono text-cyan-400">ONEVA App Catalog</span>
                              </div>
                              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 p-2 rounded-xl bg-neutral-900 border border-neutral-800 max-h-36 overflow-y-auto">
                                {Object.entries(tRes.extractedIcons).map(([pkg, url]) => (
                                  <div
                                    key={pkg}
                                    className="flex flex-col items-center gap-1 p-1 bg-black/40 rounded-lg border border-white/5"
                                    title={pkg}
                                  >
                                    <img
                                      src={url}
                                      alt={pkg}
                                      className="w-7 h-7 object-contain"
                                      referrerPolicy="no-referrer"
                                    />
                                    <span className="text-[8px] font-mono text-neutral-400 truncate max-w-[40px]">
                                      {pkg.split('.').pop()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* System UI Metadata View */}
                {category === 'system_ui' && (zipValidationResult as SystemUIValidationResult).systemUiConfig && (
                  <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
                    {(() => {
                      const sRes = zipValidationResult as SystemUIValidationResult;
                      const sCfg = sRes.systemUiConfig!;
                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-white font-semibold text-sm">{sRes.name || 'System UI Pack'}</span>
                            <span className="font-mono px-2 py-0.5 rounded bg-neutral-900 text-purple-400 border border-purple-900/50 text-[10px]">
                              {sRes.author || 'ONEVA Studio'}
                            </span>
                          </div>

                          <p className="text-neutral-400 text-[11px] leading-relaxed">
                            {sRes.description || 'System UI configuration.'}
                          </p>

                          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-900 font-mono text-[10px] text-neutral-400">
                            <div>
                              Search Bar: <strong className="text-neutral-200">{sCfg.searchBar?.style || 'futuristic_pill'}</strong>
                            </div>
                            <div>
                              Tile Shape: <strong className="text-neutral-200">{sCfg.quickSettings?.tileShape || 'squircle'}</strong>
                            </div>
                            <div>
                              Volume HUD: <strong className="text-emerald-400">{sCfg.volumePanel?.style || 'compact'}</strong>
                            </div>
                          </div>

                          {sRes.previewDataUrl && (
                            <div className="pt-2 border-t border-neutral-900 space-y-1.5">
                              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
                                Visual Showcase Preview
                              </span>
                              <div className="w-full h-36 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900">
                                <img
                                  src={sRes.previewDataUrl}
                                  alt="System UI Preview"
                                  className="w-full h-full object-contain"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* Icon Pack Metadata */}
                {category === 'icon_pack' && (zipValidationResult as IconPackValidationResult).manifest && (
                  <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2.5">
                    {(() => {
                      const iRes = zipValidationResult as IconPackValidationResult;
                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-white font-semibold text-sm">{iRes.manifest!.name}</span>
                            <span className="font-mono px-2 py-0.5 rounded bg-neutral-900 text-purple-400 border border-purple-900/50 text-[10px]">
                              v{iRes.manifest!.version}
                            </span>
                          </div>

                          <p className="text-neutral-400 text-[11px] leading-relaxed">
                            {iRes.manifest!.description || 'No description provided in manifest.'}
                          </p>

                          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-900 font-mono text-[10px] text-neutral-400">
                            <div>
                              Pack ID: <strong className="text-neutral-200">{iRes.manifest!.packId}</strong>
                            </div>
                            <div>
                              Author: <strong className="text-neutral-200">{iRes.manifest!.author || 'Unknown'}</strong>
                            </div>
                            <div>
                              Verified Glyphs: <strong className="text-emerald-400">{iRes.iconCount}</strong>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* Sample Extracted Icon Previews */}
                {category === 'icon_pack' &&
                  (zipValidationResult as IconPackValidationResult).extractedIcons &&
                  Object.keys((zipValidationResult as IconPackValidationResult).extractedIcons || {}).length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider block">
                        Sample Verified Glyphs ({Object.keys((zipValidationResult as IconPackValidationResult).extractedIcons || {}).length})
                      </span>
                      <div className="flex items-center gap-2.5 flex-wrap p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                        {Object.entries((zipValidationResult as IconPackValidationResult).extractedIcons || {}).map(([pkg, dataUrl]) => (
                          <div
                            key={pkg}
                            className="flex flex-col items-center gap-1 p-2 rounded-lg bg-neutral-900 border border-neutral-800"
                            title={pkg}
                          >
                            <img
                              src={dataUrl}
                              alt={pkg}
                              className="w-9 h-9 object-contain"
                              referrerPolicy="no-referrer"
                            />
                            <span className="text-[9px] font-mono text-neutral-400 max-w-[54px] truncate">
                              {pkg.split('.').pop()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Default Option */}
                {zipValidationResult.isValid && (
                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={zipPublishDefault}
                      onChange={(e) => setZipPublishDefault(e.target.checked)}
                      className="rounded border-amber-500/50 text-amber-500 focus:ring-0"
                    />
                    <div className="text-xs">
                      <span className="font-bold block">
                        Set as active ⭐ Default for {categoryDef?.name || category}
                      </span>
                      <span className="text-[11px] opacity-80">
                        Will become the active pack for system defaults and user-side launcher defaults.
                      </span>
                    </div>
                  </label>
                )}

                {/* Action Bar */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsZipModalOpen(false);
                      setZipFile(null);
                      setZipValidationResult(null);
                    }}
                    className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  {category === 'theme' ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePublishZipPack('draft')}
                        disabled={!zipValidationResult.isValid}
                        className={`px-4 py-2 rounded-xl font-semibold text-xs transition ${
                          zipValidationResult.isValid
                            ? 'text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 cursor-pointer'
                            : 'bg-neutral-800 text-neutral-600 border border-neutral-700 cursor-not-allowed'
                        }`}
                      >
                        Save as Draft
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePublishZipPack('published')}
                        disabled={!zipValidationResult.isValid}
                        className={`px-5 py-2 rounded-xl font-bold transition flex items-center gap-2 ${
                          zipValidationResult.isValid
                            ? 'bg-purple-600 text-white hover:bg-purple-500 cursor-pointer shadow-lg shadow-purple-950/40'
                            : 'bg-neutral-800 text-neutral-600 border border-neutral-700 cursor-not-allowed'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        <span>Verify & Publish</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handlePublishZipPack('published')}
                      disabled={!zipValidationResult.isValid}
                      className={`px-5 py-2 rounded-xl font-bold transition flex items-center gap-2 ${
                        zipValidationResult.isValid
                          ? 'bg-purple-500 text-white hover:bg-purple-400 cursor-pointer shadow-lg shadow-purple-950/40'
                          : 'bg-neutral-800 text-neutral-600 border border-neutral-700 cursor-not-allowed'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      <span>
                        {category === 'system_ui'
                          ? 'Publish System UI'
                          : 'Publish Icon Pack'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Asset Modal */}
      {editModal.isOpen && editModal.asset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Edit Asset Metadata</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditModal({ isOpen: false, asset: null, name: '', description: '', version: '', status: 'published', rating: 8 })}
                className="p-1 rounded text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-300 font-medium mb-1">Asset Name</label>
                <input
                  type="text"
                  required
                  value={editModal.name}
                  onChange={(e) => setEditModal({ ...editModal, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editModal.description}
                  onChange={(e) => setEditModal({ ...editModal, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-medium mb-1">Semantic Version</label>
                  <input
                    type="text"
                    required
                    value={editModal.version}
                    onChange={(e) => setEditModal({ ...editModal, version: e.target.value })}
                    placeholder="1.0.0"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1">Status</label>
                  <select
                    value={editModal.status}
                    onChange={(e) => setEditModal({ ...editModal, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              {/* Edit Admin Blue-Star Rating */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-neutral-300 font-medium">
                    <Star className="w-3.5 h-3.5 fill-blue-400 text-blue-400" />
                    <span>Admin Blue-Star Rating (Priority Ranking 1–10)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-blue-950/60 border border-blue-500/40 text-blue-300 font-mono text-xs font-bold">
                    ★ {editModal.rating} / 10
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={editModal.rating}
                  onChange={(e) => setEditModal({ ...editModal, rating: parseInt(e.target.value, 10) })}
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <p className="text-[10px] text-neutral-500">
                  Controls ranking priority in the Asset Browser. 10 is highest display priority.
                </p>
              </div>

              {/* Edit Media Section */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-300 font-medium flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Visual Media (Image / Video)</span>
                  </span>
                  <input
                    ref={editMediaFileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleMediaFileSelection(file, true);
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => editMediaFileInputRef.current?.click()}
                    className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-medium transition cursor-pointer flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3 text-emerald-400" />
                    <span>Upload New File</span>
                  </button>
                </div>

                {editMediaUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-neutral-800 bg-black h-32 flex items-center justify-center">
                    {editMediaType === 'video' ? (
                      <video src={editMediaUrl} controls autoPlay loop muted className="w-full h-full object-contain" />
                    ) : (
                      <img src={editMediaUrl} alt="Asset media" className="w-full h-full object-contain" />
                    )}
                    <button
                      type="button"
                      onClick={() => setEditMediaUrl(null)}
                      className="absolute top-2 right-2 p-1 rounded-lg bg-black/80 hover:bg-rose-500/30 text-neutral-300 hover:text-rose-400 border border-white/20 transition cursor-pointer"
                      title="Clear media"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => editMediaFileInputRef.current?.click()}
                    className="h-20 rounded-xl border border-dashed border-neutral-800 hover:border-neutral-700 flex flex-col items-center justify-center text-neutral-500 cursor-pointer bg-neutral-900/30 transition text-center p-2"
                  >
                    <UploadCloud className="w-4 h-4 mb-1 text-neutral-400" />
                    <span className="text-[10px]">No custom media attached. Click to upload an image or video.</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModal({ isOpen: false, asset: null, name: '', description: '', version: '', status: 'published', rating: 8 })}
                  className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 text-neutral-950 font-bold hover:bg-emerald-400 transition cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Live Phone Device Mockup Preview Modal */}
      {previewInspectionAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-3xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl flex flex-col md:flex-row gap-6 max-h-[92vh] overflow-y-auto">
            {/* Phone Bezel */}
            <div className="w-64 h-[440px] shrink-0 mx-auto rounded-[36px] bg-neutral-950 border-[6px] border-neutral-800 shadow-2xl overflow-hidden relative flex flex-col">
              {/* Top Camera Punchhole & Status Bar */}
              <div className="absolute top-2 inset-x-0 z-30 flex items-center justify-between px-4 text-[10px] font-mono text-white/90">
                <span>12:45</span>
                <div className="w-3 h-3 rounded-full bg-black border border-neutral-700" />
                <div className="flex items-center gap-1">
                  <span>5G</span>
                  <span>98%</span>
                </div>
              </div>

              {/* Main Phone Surface */}
              <div className="relative w-full h-full overflow-hidden flex flex-col justify-between pt-7 pb-4 px-3">
                {/* Wallpaper or Media Layer */}
                {(() => {
                  const isVid = Boolean(
                    previewInspectionAsset.previewData?.previewVideoUrl ||
                    previewInspectionAsset.previewData?.mediaType === 'video' ||
                    previewInspectionAsset.isLiveWallpaper ||
                    previewInspectionAsset.category === 'live_wallpaper'
                  );
                  const vidUrl =
                    previewInspectionAsset.previewData?.previewVideoUrl ||
                    (isVid ? (previewInspectionAsset.payload as any)?.assetUrl : null) ||
                    (isVid ? AssetStorageService.getMediaSync(previewInspectionAsset.id)?.dataUrl : null);

                  if (vidUrl) {
                    return (
                      <video
                        src={vidUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    );
                  }

                  const imgUrl =
                    previewInspectionAsset.previewData?.previewThumbnailUrl ||
                    previewInspectionAsset.previewData?.previewUrl ||
                    previewInspectionAsset.previewData?.previewDataUrl ||
                    (previewInspectionAsset.payload as any)?.assetUrl ||
                    (previewInspectionAsset.payload as any)?.wallpaperUrl ||
                    AssetStorageService.getMediaSync(previewInspectionAsset.id)?.thumbnailUrl ||
                    AssetStorageService.getMediaSync(previewInspectionAsset.id)?.dataUrl;

                  if (imgUrl) {
                    return (
                      <img
                        src={imgUrl}
                        alt={previewInspectionAsset.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    );
                  }

                  if (previewInspectionAsset.category === 'wallpaper' && previewInspectionAsset.previewData?.cssBackground) {
                    return (
                      <div
                        className="absolute inset-0 w-full h-full"
                        style={{ background: previewInspectionAsset.previewData.cssBackground }}
                      />
                    );
                  }

                  return <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-neutral-950 via-neutral-900 to-black" />;
                })()}

                {/* Simulated Content Layer */}
                <div className="relative z-20 space-y-2 mt-4 text-center">
                  <div className="text-3xl font-light text-white drop-shadow-md tracking-tight">12:45</div>
                  <div className="text-[10px] text-white/80 font-medium tracking-wide">Friday, September 19</div>
                </div>

                {/* Icons Grid preview or Keyboard Preview */}
                {previewInspectionAsset.category === 'keyboard' ? (
                  <div className="relative z-20 p-2 rounded-2xl bg-neutral-950/90 backdrop-blur-md border border-white/10 space-y-1 shadow-2xl">
                    <div className="flex justify-center gap-0.5">
                      {['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'].map((k) => (
                        <div
                          key={k}
                          className="w-4.5 h-6 rounded bg-neutral-800 text-[9px] text-white flex items-center justify-center font-mono"
                          style={{
                            backgroundColor: previewInspectionAsset.previewData?.keyBg,
                            color: previewInspectionAsset.previewData?.textColor,
                          }}
                        >
                          {k}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-center">
                      <div
                        className="h-2 w-28 rounded-full shadow"
                        style={{ backgroundColor: previewInspectionAsset.previewData?.color || '#10b981' }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="relative z-20 grid grid-cols-4 gap-2 mb-2 px-1">
                    {[
                      { icon: '📞', label: 'Phone' },
                      { icon: '💬', label: 'Messages' },
                      { icon: '📷', label: 'Camera' },
                      { icon: '⚙️', label: 'Settings' },
                    ].map((app) => (
                      <div key={app.label} className="flex flex-col items-center gap-1">
                        <div className="w-10 h-10 rounded-2xl bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center text-sm shadow-lg">
                          {app.icon}
                        </div>
                        <span className="text-[9px] text-white/90 drop-shadow truncate">{app.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Technical Asset Metadata Side */}
            <div className="flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                    {previewInspectionAsset.category.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400">
                    v{previewInspectionAsset.version}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">{previewInspectionAsset.name}</h3>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    {previewInspectionAsset.description}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-neutral-400">
                    <span>Status:</span>
                    <strong className="text-emerald-400 uppercase">{previewInspectionAsset.status}</strong>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Default Flag:</span>
                    <strong className={previewInspectionAsset.isDefault ? 'text-amber-400' : 'text-neutral-500'}>
                      {previewInspectionAsset.isDefault ? '⭐ ACTIVE DEFAULT' : 'NO'}
                    </strong>
                  </div>
                  {previewInspectionAsset.processingMode && (
                    <div className="flex justify-between text-neutral-400">
                      <span>Extraction:</span>
                      <strong className="text-neutral-200">{previewInspectionAsset.processingMode}</strong>
                    </div>
                  )}
                  {previewInspectionAsset.blendMode && (
                    <div className="flex justify-between text-neutral-400">
                      <span>Blend Mode:</span>
                      <strong className="text-neutral-200">{previewInspectionAsset.blendMode}</strong>
                    </div>
                  )}
                  <div className="flex justify-between text-neutral-400">
                    <span>Media Type:</span>
                    <strong className="text-neutral-200">
                      {previewInspectionAsset.previewData?.previewVideoUrl
                        ? 'Video (MP4/WEBM)'
                        : previewInspectionAsset.previewData?.previewUrl
                        ? 'Raster / Vector Image'
                        : 'Engine Swatch'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    handleApplyAsset(previewInspectionAsset);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-neutral-950 text-xs font-bold hover:bg-emerald-400 transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-950/40"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Apply to Active Phone</span>
                </button>

                {!previewInspectionAsset.isDefault && (
                  <button
                    type="button"
                    onClick={() => {
                      handleInitiateSetDefault(previewInspectionAsset);
                      setPreviewInspectionAsset(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold hover:bg-amber-500/30 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-300" />
                    <span>Set as Active Default</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewInspectionAsset(null)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Dialog Modal */}
      {assetToDelete && (
        <div className="fixed inset-0 z-70 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-rose-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Asset Permanently</h3>
                <p className="text-xs text-neutral-400">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-neutral-500 font-mono">Asset Name:</span>
                <span className="text-white font-semibold">{assetToDelete.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 font-mono">Category:</span>
                <span className="text-cyan-400 uppercase font-mono">{assetToDelete.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 font-mono">Status:</span>
                <span className={assetToDelete.status === 'published' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {assetToDelete.status.toUpperCase()}
                </span>
              </div>
            </div>

            {assetToDelete.status === 'published' && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Warning:</strong> This asset is currently PUBLISHED. Deleting it will immediately remove it from all user catalogs in real-time.
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAssetToDelete(null)}
                disabled={isDeletingAsset}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeletingAsset}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-lg shadow-rose-950/50 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingAsset ? 'Deleting...' : 'Confirm Permanent Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Theme Creator Modal (Method 2: Component Assembly) */}
      {isThemeCreatorOpen && (
        <ThemeCreatorModal
          isOpen={isThemeCreatorOpen}
          onClose={() => setIsThemeCreatorOpen(false)}
          showToast={showToast}
          onThemeCreated={(createdTheme) => {
            reloadData();
            showToast(`Theme "${createdTheme.name}" successfully saved (${createdTheme.status})!`);
          }}
        />
      )}
    </div>
  );
}
