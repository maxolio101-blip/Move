// All UI strings live here. A French table can be added later with the
// same keys; `t()` falls back to English for any missing key.

const en = {
  tabs: { today: 'Today', history: 'History', progress: 'Progress', settings: 'Settings' },

  install: {
    title: 'Install Move',
    lead: 'Move is designed to run from your Home Screen, full screen and offline.',
    step1: 'Open this page in Safari (not DuckDuckGo).',
    step2: 'Tap the Share button.',
    step3: 'Choose “Add to Home Screen”, then “Add”.',
    step4: 'Always open Move from its Home Screen icon.',
    copyLink: 'Copy link to open in Safari',
    copied: 'Link copied',
    warnTitle: 'Don’t log data in a browser tab',
    warnBody: 'Data saved in a regular browser tab can be wiped by the browser (Safari can delete it after 7 days of use without a visit to this site). The installed app keeps its own storage.',
  },

  update: { available: 'New version available', reload: 'Reload' },

  placeholder: {
    history: 'Your sessions will appear here.',
    progress: 'Your charts will appear here.',
  },

  activity: {
    strength: 'Strength', climb: 'Climbing', swim: 'Swim', habits: 'Habits', steps: 'Steps',
  },

  steps: {
    title: 'Steps',
    of: 'of',
    goalMet: 'Goal reached',
    toGo: 'to go',
    noData: 'No steps yet today',
    paste: 'Paste steps',
    manual: 'Enter',
    savedToday: 'Steps saved',
    savedFor: 'Steps saved for',
    lowerConfirm: 'This is lower than what is already saved for that day. Replace it?',
    clipboardDenied: 'Couldn’t read the clipboard. Tap Paste in the bubble, or enter steps manually.',
    errEmpty: 'Clipboard is empty. Run the “Move steps” shortcut first.',
    errFormat: 'Clipboard doesn’t contain Move steps. Run the “Move steps” shortcut first.',
    errDate: 'The date in the clipboard isn’t valid.',
    errFuture: 'The date in the clipboard is in the future.',
    errNumber: 'The step count in the clipboard isn’t valid.',
    manualTitle: 'Enter steps',
    date: 'Date',
    count: 'Steps',
    save: 'Save',
    cancel: 'Cancel',
    invalidManual: 'Enter a number between 0 and 150,000.',
  },

  habits: {
    title: 'Habits',
    yogaAM: 'Yoga AM', meditationAM: 'Meditation AM',
    yogaPM: 'Yoga PM', meditationPM: 'Meditation PM',
    creatine: 'Creatine', dogWalk: 'Dog walk',
  },

  week: {
    title: 'This week',
    gym: 'Gym', climbing: 'Climbing', swim: 'Swim',
    days: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    daysLong: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    stepsGoal: 'step goal met',
    habitsOf: 'habits',
  },

  common: { back: 'Back', close: 'Close', save: 'Save', done: 'Done', cancel: 'Cancel' },

  equipment: { barbell: 'Barbell', dumbbell: 'Dumbbell', machine: 'Machine', cable: 'Cable', bodyweight: 'Bodyweight' },

  tpl: {
    chooseTitle: 'Start workout',
    tapToStart: 'Tap a template to start.',
    edit: 'Edit',
    new: 'New template',
    none: 'No templates yet.',
    empty: 'No exercises',
    newTitle: 'New template',
    editTitle: 'Edit template',
    name: 'Name',
    namePlaceholder: 'e.g. Lower',
    exercises: 'Exercises',
    noExercises: 'Add the exercises of this workout.',
    addExercise: 'Add exercise',
    sets: 'sets', reps: 'reps',
    moveUp: 'Move up', moveDown: 'Move down', remove: 'Remove',
    delete: 'Delete template',
    deleteConfirm: 'Delete the template “{name}”? Past sessions are kept.',
    deleted: 'Template deleted',
    saved: 'Template saved',
    nameRequired: 'Give the template a name.',
    exercisesRequired: 'Add at least one exercise.',
  },

  ex: {
    search: 'Search exercises',
    noMatch: 'No match. Create it below.',
    new: 'New exercise',
    newTitle: 'New exercise',
    editTitle: 'Edit exercise',
    name: 'Name',
    namePlaceholder: 'e.g. Goblet squat',
    equipment: 'Equipment',
    increment: 'Weight increment (kg)',
    incDefault: 'Default',
    incHint: 'Step used by the + and − buttons. Leave empty to use the equipment default.',
    nameRequired: 'Give the exercise a name.',
    duplicate: 'An exercise with this name already exists.',
    saved: 'Exercise saved',
  },

  wk: {
    duration: 'Duration',
    over45: '45 min',
    hide: 'Hide',
    finish: 'Finish',
    set: 'set', reps: 'Reps', load: 'Load', done: 'Done',
    complete: 'Complete',
    increase: 'Increase', decrease: 'Decrease',
    addedLoad: 'added load',
    swap: 'Swap',
    swapTitle: 'Swap for this session',
    swapHint: 'The template stays unchanged.',
    insteadOf: 'Instead of',
    backTo: 'Back to',
    addSet: 'Add set',
    removeSet: 'Remove set',
    rest: 'Rest', restOver: 'Rest over', go: 'Go',
    rest15minus: 'Rest minus 15 seconds', rest15plus: 'Rest plus 15 seconds', restSkip: 'Skip rest',
    discard: 'Discard workout',
    discardConfirm: 'Discard this workout? Its sets will be deleted.',
    discarded: 'Workout discarded',
    noSetsDiscard: 'No set completed. Discard this workout?',
    finishConfirm: 'Finish this workout?',
    saveError: 'Could not save. Your last change may be lost.',
    summary: 'Workout complete',
    setsCompleted: 'Sets completed',
    loadsUp: 'Loads that went up',
    noLoadsUp: 'No load increase compared with last time.',
    resume: 'Resume workout',
  },

  actions: {
    startWorkout: 'Start workout',
    logClimb: 'Climbing',
    logSwim: 'Swim',
    comingPhase4: 'Quick log arrives in phase 4',
  },

  settings: {
    appearance: 'Appearance',
    theme: 'Theme',
    themeSystem: 'System', themeLight: 'Light', themeDark: 'Dark',
    storage: 'Storage',
    persistent: 'Persistent storage',
    granted: 'Granted', notGranted: 'Not granted', unknown: 'Unknown',
    used: 'Space used',
    about: 'About',
    version: 'Version',
    mode: 'Mode',
    modeStandalone: 'Installed app',
    modeBrowser: 'Browser tab (preview)',
  },
};

const tables = { en };
let current = en;

export function setLocale(code) { current = tables[code] || en; }

export function t(path) {
  const pick = (table) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), table);
  const v = pick(current);
  return v == null ? (pick(en) ?? path) : v;
}

/** Fill every element carrying data-i18n="key" (textContent only). */
export function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
}
