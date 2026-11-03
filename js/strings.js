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
    strength: 'Strength', climb: 'Climbing', swim: 'Swim', habits: 'Habits',
  },

  scores: {
    consistency: 'Consistency',
    consistencySub: 'sessions vs target',
    since: 'since',
    noSessions: 'Log a session to start',
    goal: 'Weight goal',
    noWeight: 'Log your weight',
    avg7: '7-day avg',
    oneWeighIn: 'latest',
    logWeight: 'Log weight',
  },

  weight: {
    title: 'Log weight',
    kg: 'Weight (kg)',
    date: 'Date',
    invalid: 'Enter a weight between 20 and 300 kg.',
    saved: 'Weight saved',
    deleted: 'Weight removed',
    remove: 'Remove this weigh-in',
  },

  month: {
    title: 'Calendar',
    prev: 'Previous month',
    next: 'Next month',
    names: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    tapDay: 'Tap a day to edit it.',
  },

  day: {
    habits: 'Habits',
    weight: 'Weight',
    sessions: 'Sessions',
    none: 'No session this day.',
    saveWeight: 'Save weight',
    future: 'Habits, weight and sessions can be filled in once the day has come.',
  },

  climb: {
    title: 'Log climbing',
    where: 'Where',
    indoor: 'Indoor', outdoor: 'Outdoor',
    duration: 'Duration',
    grade: 'Best grade sent',
    noGrade: 'No send',
    saved: 'Climbing saved',
    session: 'Climbing',
  },

  swim: {
    title: 'Log swim',
    duration: 'Duration',
    distance: 'Distance (m, optional)',
    saved: 'Swim saved',
    session: 'Swim',
  },

  min: 'min',

  plan: {
    title: 'Plan',
    week: 'Week',
    today: 'Today',
    rest: 'Rest day',
    restSub: 'Recovery. Habits still count.',
    start: 'Start',
    other: 'Other workout',
    done: 'Done today',
    climbToday: 'Climbing today',
    swimToday: 'Swim today',
    logIt: 'Log it',
    dayPlan: 'Plan',
    restOption: 'Rest',
    climbOption: 'Climbing',
    swimOption: 'Swim',
    saved: 'Plan updated',
    planned: 'planned',
  },

  habits: {
    title: 'Habits',
    yogaAM: 'Yoga', meditationAM: 'Meditation',
    creatine: 'Creatine', whey: 'Whey', collagen: 'Collagen', dogWalk: 'Dog walk',
  },

  week: {
    title: 'This week',
    gym: 'Gym', climbing: 'Climbing', swim: 'Swim',
    days: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    daysLong: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    open: 'Open the monthly calendar',
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
    last: 'Last',
    target: 'Target',
    removeExercise: 'Remove exercise',
    removeExerciseConfirm: 'Remove “{name}” from this session? The template stays unchanged.',
    lastExercise: 'A workout needs at least one exercise. Discard it instead.',
  },

  actions: {
    startWorkout: 'Start workout',
    logClimb: 'Climbing',
    logSwim: 'Swim',
  },

  settings: {
    appearance: 'Appearance',
    theme: 'Theme',
    themeSystem: 'System', themeLight: 'Light', themeDark: 'Dark',
    storage: 'Storage',
    persistent: 'Persistent storage',
    granted: 'Granted', notGranted: 'Not granted', unknown: 'Unknown',
    goal: 'Weight goal',
    goalStart: 'Start weight (kg)',
    goalTarget: 'Target weight (kg)',
    goalSaved: 'Goal saved',
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
