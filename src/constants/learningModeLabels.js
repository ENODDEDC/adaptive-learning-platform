/** Canonical learning-mode keys (API / DB) → short student-facing toolbar labels */
export const LEARNING_MODE_LABELS = {
  'AI Narrator': 'Listen along',
  'Visual Learning': 'Diagrams',
  'Sequential Learning': 'Step-by-step',
  'Global Learning': 'Overview',
  'Hands-On Lab': 'Examples',
  'Concept Constellation': 'Patterns',
  'Active Learning Hub': 'Practice',
  'Reflective Learning': 'Think deeper'
};

export function databaseModeToButtonLabel(databaseName) {
  return LEARNING_MODE_LABELS[databaseName] ?? databaseName;
}

export const buttonLabelToDatabaseMode = Object.fromEntries(
  Object.entries(LEARNING_MODE_LABELS).map(([db, label]) => [label, db])
);
