'use client';

import {
  SpeakerWaveIcon,
  PhotoIcon,
  ListBulletIcon,
  GlobeAltIcon,
  BeakerIcon,
  LightBulbIcon,
  PencilSquareIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { LEARNING_MODE_LABELS } from './learningModeLabels';

const ICON_BY_DB = {
  'AI Narrator': SpeakerWaveIcon,
  'Visual Learning': PhotoIcon,
  'Sequential Learning': ListBulletIcon,
  'Global Learning': GlobeAltIcon,
  'Hands-On Lab': BeakerIcon,
  'Concept Constellation': LightBulbIcon,
  'Active Learning Hub': PencilSquareIcon,
  'Reflective Learning': ChatBubbleLeftRightIcon
};

export const LEARNING_MODE_UI = Object.fromEntries(
  Object.keys(LEARNING_MODE_LABELS).map((db) => [
    db,
    { label: LEARNING_MODE_LABELS[db], Icon: ICON_BY_DB[db] }
  ])
);

export function LearningModeToolbarIcon({ databaseMode, className = 'w-4 h-4 shrink-0' }) {
  const Icon = ICON_BY_DB[databaseMode];
  if (!Icon) return null;
  return <Icon className={className} aria-hidden />;
}

export function LearningModeTooltipGlyph({ databaseMode, className = 'w-8 h-8 shrink-0 text-gray-600' }) {
  const Icon = ICON_BY_DB[databaseMode];
  if (!Icon) return null;
  return <Icon className={className} aria-hidden />;
}
