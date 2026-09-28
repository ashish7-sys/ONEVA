/**
 * ONEVA Full Pack Guided Setup & Requirement Queue Types
 * 7 Components with prerequisite validation and fault isolation.
 */

import { OnevaPackComponentKey } from './fullPack';
import { CameraProviderId } from './cameraProviders';

export type ComponentSetupStatus =
  | 'pending'
  | 'in_progress'
  | 'applied'
  | 'skipped'
  | 'needs_attention';

export type PrerequisiteStatus =
  | 'CHECKING'
  | 'SATISFIED'
  | 'NEEDS_USER_ACTION'
  | 'SKIPPED'
  | 'FAILED';

export interface ComponentRequirement {
  id: string;
  componentKey: OnevaPackComponentKey;
  componentIndex: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  title: string;
  description: string;
  rationale: string;
  actionLabel: string;
  skipLabel: string;
  isMandatory: boolean;
  status: PrerequisiteStatus;
  settingsIntent?: string;
  detectedDetail?: string;
}

export interface GuidedStepState {
  index: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  key: OnevaPackComponentKey;
  name: string;
  status: ComponentSetupStatus;
  detailMessage?: string;
  selectedAssetOrProvider?: string;
  timestamp?: string;
}

export interface FullPackWizardState {
  currentStepIndex: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8; // 8 = completed summary
  steps: GuidedStepState[];
  selectedCameraProviderId?: CameraProviderId;
  isStarted: boolean;
  isCompleted: boolean;
  appliedCount: number;
  skippedCount: number;
  startedAt?: string;
  completedAt?: string;
}
