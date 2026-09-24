/**
 * ONEVA Phase 21: Modular Computer Vision Gesture Engine
 * 
 * Lightweight, privacy-first hand gesture recognition layer.
 * Analyzes video frames locally using offscreen Canvas 2D image analysis,
 * temporal centroid tracking, morphological solidity, and motion vector flow.
 * 
 * ZERO cloud processing. ZERO frame storage. Fully ephemeral (Rule 6).
 */

import {
  CustomGestureDefinition,
  GestureDetectionFrame,
  HandGestureType,
} from '../../../types/jarvisHandControl';

export interface CentroidHistoryPoint {
  x: number;
  y: number;
  area: number;
  timestamp: number;
}

export interface GestureRecognitionAdapter {
  init(): Promise<void>;
  processFrame(
    video: HTMLVideoElement | HTMLCanvasElement,
    isMirrored?: boolean
  ): GestureDetectionFrame;
  extractFeatures(source: HTMLVideoElement | HTMLCanvasElement): number[];
  matchCustomGesture(
    features: number[],
    customDefs: CustomGestureDefinition[]
  ): { matchId: string; confidence: number } | null;
  destroy(): void;
}

export class ComputerVisionGestureAdapter implements GestureRecognitionAdapter {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private centroidHistory: CentroidHistoryPoint[] = [];
  private static readonly MAX_HISTORY = 10;
  private static readonly ANALYSIS_WIDTH = 160;
  private static readonly ANALYSIS_HEIGHT = 120;

  // Track sustained posture for hold recognition
  private lastStaticGesture: HandGestureType | null = null;
  private staticGestureStartTime = 0;

  async init(): Promise<void> {
    if (typeof document !== 'undefined' && !this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.width = ComputerVisionGestureAdapter.ANALYSIS_WIDTH;
      this.canvas.height = ComputerVisionGestureAdapter.ANALYSIS_HEIGHT;
      this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    }
  }

  processFrame(
    video: HTMLVideoElement | HTMLCanvasElement,
    isMirrored: boolean = true
  ): GestureDetectionFrame {
    const timestamp = Date.now();

    if (!this.canvas || !this.ctx) {
      return {
        detectedGesture: null,
        confidence: 0,
        timestamp,
        handDetected: false,
        isHolding: false,
        holdProgress: 0,
      };
    }

    const w = ComputerVisionGestureAdapter.ANALYSIS_WIDTH;
    const h = ComputerVisionGestureAdapter.ANALYSIS_HEIGHT;

    try {
      this.ctx.drawImage(video, 0, 0, w, h);
      const imgData = this.ctx.getImageData(0, 0, w, h);
      const pixels = imgData.data;

      // 1. Skin / active silhouette segmentation & bounding box
      let totalX = 0;
      let totalY = 0;
      let activePixels = 0;
      let minX = w;
      let maxX = 0;
      let minY = h;
      let maxY = 0;

      // Count pixels in upper & lower halves to compute vertical mass ratio
      let upperActive = 0;
      let lowerActive = 0;

      for (let y = 0; y < h; y += 2) {
        for (let x = 0; x < w; x += 2) {
          const idx = (y * w + x) * 4;
          const r = pixels[idx];
          const g = pixels[idx + 1];
          const b = pixels[idx + 2];

          // Normalized color thresholding for hand skin in varying lighting
          // (R > G, R > B, |R-G| > 12, luminance between 40 and 245)
          const maxVal = Math.max(r, g, b);
          const minVal = Math.min(r, g, b);
          const isHand =
            r > 60 &&
            g > 40 &&
            b > 20 &&
            maxVal - minVal > 15 &&
            Math.abs(r - g) > 10 &&
            r > g &&
            r > b;

          if (isHand) {
            activePixels++;
            totalX += x;
            totalY += y;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;

            if (y < h / 2) {
              upperActive++;
            } else {
              lowerActive++;
            }
          }
        }
      }

      // Minimum pixel threshold to qualify as a visible hand
      const minHandPixels = (w * h * 0.015) / 4; // ~75 sampled pixels
      if (activePixels < minHandPixels) {
        this.centroidHistory = [];
        this.lastStaticGesture = null;
        return {
          detectedGesture: null,
          confidence: 0,
          timestamp,
          handDetected: false,
          isHolding: false,
          holdProgress: 0,
        };
      }

      const centroidX = totalX / activePixels;
      const centroidY = totalY / activePixels;
      const boxW = Math.max(1, maxX - minX);
      const boxH = Math.max(1, maxY - minY);
      const boundingBoxArea = boxW * boxH;
      const solidity = Math.min(1.0, (activePixels * 4) / boundingBoxArea);
      const aspectRatio = boxW / boxH;

      // Add to centroid history for motion vector calculation
      this.centroidHistory.push({
        x: centroidX,
        y: centroidY,
        area: activePixels,
        timestamp,
      });

      if (this.centroidHistory.length > ComputerVisionGestureAdapter.MAX_HISTORY) {
        this.centroidHistory.shift();
      }

      // 2. Motion Flow Analysis (Swipes)
      const motion = this.calculateMotionVector();
      // Mirror compensation: on front camera, moving right moves towards right on preview
      const effectiveDx = isMirrored ? -motion.dx : motion.dx;

      const swipeThreshold = 18; // Pixel travel over history window
      if (Math.abs(effectiveDx) > swipeThreshold && Math.abs(effectiveDx) > Math.abs(motion.dy) * 1.3) {
        const gesture: HandGestureType = effectiveDx > 0 ? 'swipe_right' : 'swipe_left';
        const confidence = Math.min(0.95, 0.65 + Math.min(0.3, Math.abs(effectiveDx) / 50));
        
        // Swipes clear static hold
        this.lastStaticGesture = null;

        return {
          detectedGesture: gesture,
          confidence,
          timestamp,
          boundingBox: { x: minX, y: minY, width: boxW, height: boxH },
          motionVector: { dx: effectiveDx, dy: motion.dy },
          handDetected: true,
          isHolding: false,
          holdProgress: 0,
        };
      }

      if (Math.abs(motion.dy) > swipeThreshold && Math.abs(motion.dy) > Math.abs(effectiveDx) * 1.3) {
        const gesture: HandGestureType = motion.dy < 0 ? 'swipe_up' : 'swipe_down';
        const confidence = Math.min(0.95, 0.65 + Math.min(0.3, Math.abs(motion.dy) / 50));

        this.lastStaticGesture = null;

        return {
          detectedGesture: gesture,
          confidence,
          timestamp,
          boundingBox: { x: minX, y: minY, width: boxW, height: boxH },
          motionVector: { dx: effectiveDx, dy: motion.dy },
          handDetected: true,
          isHolding: false,
          holdProgress: 0,
        };
      }

      // 3. Static Hand Shape Classification
      // Open Palm vs Closed Fist vs Thumbs Up vs Two Finger Point
      let staticCandidate: HandGestureType | null = null;
      let shapeConfidence = 0.5;

      const upperToLowerRatio = lowerActive > 0 ? upperActive / lowerActive : 1;

      // Closed Fist: High solidity, balanced aspect ratio (0.75 - 1.25), compact bounding box
      if (solidity > 0.68 && aspectRatio >= 0.7 && aspectRatio <= 1.35) {
        staticCandidate = 'closed_fist';
        shapeConfidence = 0.72 + (solidity - 0.68) * 0.5;
      }
      // Open Palm: Lower solidity due to open fingers, spread perimeter, larger area
      else if (solidity < 0.52 && aspectRatio >= 0.7 && aspectRatio <= 1.45) {
        staticCandidate = 'open_palm';
        shapeConfidence = 0.70 + (0.52 - solidity) * 0.6;
      }
      // Thumbs Up: Upper protrusion (thumb) pointing up, higher lower mass
      else if (upperToLowerRatio < 0.65 && boxH > boxW * 1.1) {
        staticCandidate = 'thumbs_up';
        shapeConfidence = 0.68 + Math.min(0.25, (0.65 - upperToLowerRatio) * 0.4);
      }
      // Two Finger Point: Tall bounding box, medium-low solidity, distinct vertical orientation
      else if (boxH > boxW * 1.4 && solidity < 0.62) {
        staticCandidate = 'two_finger_point';
        shapeConfidence = 0.70 + Math.min(0.22, (boxH / boxW - 1.4) * 0.2);
      }

      // Hold duration tracking (require stable pose for e.g. 250ms before full trigger)
      let isHolding = false;
      let holdProgress = 0;

      if (staticCandidate) {
        if (this.lastStaticGesture === staticCandidate) {
          const elapsed = timestamp - this.staticGestureStartTime;
          holdProgress = Math.min(1.0, elapsed / 250);
          if (elapsed >= 250) {
            isHolding = true;
          }
        } else {
          this.lastStaticGesture = staticCandidate;
          this.staticGestureStartTime = timestamp;
          holdProgress = 0.1;
        }
      } else {
        this.lastStaticGesture = null;
        this.staticGestureStartTime = 0;
      }

      return {
        detectedGesture: isHolding ? staticCandidate : null,
        confidence: Math.min(0.98, Math.max(0.1, shapeConfidence)),
        timestamp,
        boundingBox: { x: minX, y: minY, width: boxW, height: boxH },
        motionVector: { dx: effectiveDx, dy: motion.dy },
        handDetected: true,
        isHolding,
        holdProgress,
      };
    } catch {
      return {
        detectedGesture: null,
        confidence: 0,
        timestamp,
        handDetected: false,
        isHolding: false,
        holdProgress: 0,
      };
    }
  }

  /**
   * Calculates displacement between earliest and latest recorded centroids
   */
  private calculateMotionVector(): { dx: number; dy: number } {
    if (this.centroidHistory.length < 3) {
      return { dx: 0, dy: 0 };
    }
    const first = this.centroidHistory[0];
    const last = this.centroidHistory[this.centroidHistory.length - 1];
    return {
      dx: last.x - first.x,
      dy: last.y - first.y,
    };
  }

  /**
   * Extracts an 8-dimensional normalized feature vector for custom gesture enrollment
   */
  extractFeatures(source: HTMLVideoElement | HTMLCanvasElement): number[] {
    if (!this.canvas || !this.ctx) {
      return [0, 0, 0, 0, 0, 0, 0, 0];
    }

    const w = ComputerVisionGestureAdapter.ANALYSIS_WIDTH;
    const h = ComputerVisionGestureAdapter.ANALYSIS_HEIGHT;

    this.ctx.drawImage(source, 0, 0, w, h);
    const imgData = this.ctx.getImageData(0, 0, w, h);
    const pixels = imgData.data;

    let activePixels = 0;
    let minX = w, maxX = 0, minY = h, maxY = 0;
    let upper = 0, lower = 0;

    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x += 2) {
        const idx = (y * w + x) * 4;
        const r = pixels[idx], g = pixels[idx + 1], b = pixels[idx + 2];
        if (r > 60 && g > 40 && b > 20 && Math.abs(r - g) > 10 && r > g && r > b) {
          activePixels++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          if (y < h / 2) upper++;
          else lower++;
        }
      }
    }

    const boxW = Math.max(1, maxX - minX);
    const boxH = Math.max(1, maxY - minY);
    const solidity = (activePixels * 4) / (boxW * boxH);
    const aspectRatio = boxW / boxH;
    const motion = this.calculateMotionVector();
    const upperRatio = lower > 0 ? upper / lower : 1;

    return [
      Math.min(2.5, aspectRatio) / 2.5,
      Math.min(1.0, solidity),
      Math.min(1.0, activePixels / ((w * h) / 4)),
      Math.max(-1.0, Math.min(1.0, motion.dx / 40)),
      Math.max(-1.0, Math.min(1.0, motion.dy / 40)),
      Math.min(1.0, Math.sqrt(motion.dx * motion.dx + motion.dy * motion.dy) / 50),
      Math.min(2.0, upperRatio) / 2.0,
      solidity > 0.6 ? 1 : 0,
    ];
  }

  /**
   * Matches live features against enrolled custom gesture definitions
   */
  matchCustomGesture(
    features: number[],
    customDefs: CustomGestureDefinition[]
  ): { matchId: string; confidence: number } | null {
    if (!customDefs || customDefs.length === 0 || features.length !== 8) {
      return null;
    }

    let bestMatchId: string | null = null;
    let highestSim = 0;

    for (const def of customDefs) {
      if (!def.featureVector || def.featureVector.length !== 8) continue;
      // Cosine similarity
      let dot = 0;
      let magA = 0;
      let magB = 0;
      for (let i = 0; i < 8; i++) {
        dot += features[i] * def.featureVector[i];
        magA += features[i] * features[i];
        magB += def.featureVector[i] * def.featureVector[i];
      }
      const denom = Math.sqrt(magA) * Math.sqrt(magB);
      const sim = denom > 0 ? Math.max(0, dot / denom) : 0;

      if (sim > def.threshold && sim > highestSim) {
        highestSim = sim;
        bestMatchId = def.id;
      }
    }

    if (bestMatchId && highestSim > 0.65) {
      return { matchId: bestMatchId, confidence: highestSim };
    }

    return null;
  }

  destroy(): void {
    this.canvas = null;
    this.ctx = null;
    this.centroidHistory = [];
    this.lastStaticGesture = null;
  }
}

/**
 * Singleton Gesture Engine Facade
 */
export class GestureEngine {
  private static adapter: GestureRecognitionAdapter = new ComputerVisionGestureAdapter();
  private static simulatedFrame: GestureDetectionFrame | null = null;

  static async init(): Promise<void> {
    await this.adapter.init();
  }

  static setAdapter(customAdapter: GestureRecognitionAdapter): void {
    this.adapter.destroy();
    this.adapter = customAdapter;
  }

  static getAdapter(): GestureRecognitionAdapter {
    return this.adapter;
  }

  static processFrame(
    video: HTMLVideoElement | HTMLCanvasElement,
    isMirrored?: boolean
  ): GestureDetectionFrame {
    if (this.simulatedFrame) {
      return this.simulatedFrame;
    }
    return this.adapter.processFrame(video, isMirrored);
  }

  static extractFeatures(source: HTMLVideoElement | HTMLCanvasElement): number[] {
    return this.adapter.extractFeatures(source);
  }

  static matchCustomGesture(
    features: number[],
    customDefs: CustomGestureDefinition[]
  ): { matchId: string; confidence: number } | null {
    return this.adapter.matchCustomGesture(features, customDefs);
  }

  /**
   * For automated testing: allows injecting simulated frame results directly
   */
  static setSimulatedFrame(frame: GestureDetectionFrame | null): void {
    this.simulatedFrame = frame;
  }

  static destroy(): void {
    this.adapter.destroy();
    this.simulatedFrame = null;
  }
}
