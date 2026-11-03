// Programme « Phase 1 — Fondations & hypertrophie », 8 semaines.
// Source: Programme_Phase_1_8_semaines.docx. Imported once on first launch of
// this version; afterwards everything is editable in the app (templates,
// exercises, plan per day).

export const PLAN_ID = 'phase1-2026-11';

const MAIN = 120, ISO = 90;    // rest: main lifts up to 2 min, isolation 90 s

export const EXERCISES = [
  // Existing id kept so the history of this exercise carries over.
  { id: 'semi-incline-db-press', name: 'Développé semi-incliné haltères', equipment: 'dumbbell' },
  { id: 'tractions-prise-neutre', name: 'Tractions prise neutre (assistées si besoin)', equipment: 'bodyweight' },
  { id: 'developpe-couche-barre', name: 'Développé couché barre', equipment: 'barbell' },
  { id: 'elevations-laterales-halteres', name: 'Élévations latérales haltères', equipment: 'dumbbell' },
  { id: 'extension-triceps-poulie-haute-corde', name: 'Extension triceps poulie haute, corde', equipment: 'cable' },
  { id: 'curl-incline-halteres', name: 'Curl incliné haltères', equipment: 'dumbbell' },
  { id: 'hack-squat', name: 'Hack squat', equipment: 'machine' },
  { id: 'souleve-de-terre-roumain', name: 'Soulevé de terre roumain', equipment: 'barbell' },
  { id: 'leg-curl-assis', name: 'Leg curl assis', equipment: 'machine' },
  { id: 'mollets-debout', name: 'Mollets debout', equipment: 'machine' },
  { id: 'crunch-poulie-haute', name: 'Crunch à genoux, poulie haute', equipment: 'cable' },
  { id: 'developpe-couche-halteres', name: 'Développé couché haltères', equipment: 'dumbbell' },
  { id: 'tirage-horizontal-poulie-unilateral', name: 'Tirage horizontal poulie unilatéral', equipment: 'cable' },
  { id: 'pec-deck-inverse', name: 'Pec deck inversé', equipment: 'machine' },
  { id: 'elevations-laterales-poulie', name: 'Élévations latérales à la poulie', equipment: 'cable' },
  { id: 'curl-barre', name: 'Curl barre', equipment: 'barbell' },
  { id: 'extension-triceps-derriere-tete-corde', name: 'Extension triceps derrière la tête, corde', equipment: 'cable' },
  { id: 'presse-a-cuisses', name: 'Presse à cuisses', equipment: 'machine' },
  { id: 'hip-thrust-barre', name: 'Hip thrust barre', equipment: 'barbell' },
  { id: 'leg-curl-allonge', name: 'Leg curl allongé', equipment: 'machine' },
  { id: 'fente-bulgare-halteres', name: 'Fente bulgare haltères (par jambe)', equipment: 'dumbbell' },
  { id: 'mollets-assis', name: 'Mollets assis', equipment: 'machine' },
  { id: 'releves-de-jambes-suspendu', name: 'Relevés de jambes suspendu', equipment: 'bodyweight' },
];

const ex = (exerciseId, sets, reps, repsMax, restSec) => ({ exerciseId, sets, reps, repsMax, restSec, load: 0 });

export const TEMPLATES = [
  {
    id: 'p1-upper-a', name: 'Upper A', order: 1,
    exercises: [
      ex('semi-incline-db-press', 3, 8, 10, MAIN),
      ex('tractions-prise-neutre', 3, 6, 10, MAIN),
      ex('developpe-couche-barre', 2, 8, 12, ISO),
      ex('elevations-laterales-halteres', 2, 12, 15, ISO),
      ex('extension-triceps-poulie-haute-corde', 2, 10, 15, ISO),
      ex('curl-incline-halteres', 2, 10, 12, ISO),
    ],
  },
  {
    id: 'p1-lower-a', name: 'Lower A', order: 2,
    exercises: [
      ex('hack-squat', 3, 8, 10, MAIN),
      ex('souleve-de-terre-roumain', 3, 8, 10, MAIN),
      ex('leg-curl-assis', 2, 10, 15, ISO),
      ex('mollets-debout', 2, 12, 15, ISO),
      ex('crunch-poulie-haute', 2, 12, 15, ISO),
    ],
  },
  {
    id: 'p1-upper-b', name: 'Upper B', order: 3,
    exercises: [
      ex('developpe-couche-halteres', 3, 8, 12, MAIN),
      ex('tirage-horizontal-poulie-unilateral', 2, 10, 12, ISO),
      ex('pec-deck-inverse', 2, 12, 15, ISO),
      ex('elevations-laterales-poulie', 2, 12, 15, ISO),
      ex('curl-barre', 2, 8, 12, ISO),
      ex('extension-triceps-derriere-tete-corde', 2, 10, 15, ISO),
    ],
  },
  {
    id: 'p1-lower-b', name: 'Lower B', order: 4,
    exercises: [
      ex('presse-a-cuisses', 3, 10, 12, MAIN),
      ex('hip-thrust-barre', 3, 8, 12, MAIN),
      ex('leg-curl-allonge', 2, 10, 15, ISO),
      ex('fente-bulgare-halteres', 2, 8, 10, ISO),
      ex('mollets-assis', 2, 12, 15, ISO),
      ex('releves-de-jambes-suspendu', 2, 10, 15, ISO),
    ],
  },
  {
    // Week 1 only: Thursday off, so Friday merges Upper B + Lower B.
    // 14 working sets ≈ 40 min with the programme's rests.
    id: 'p1-full-body', name: 'Full body', order: 5,
    exercises: [
      ex('presse-a-cuisses', 3, 10, 12, MAIN),
      ex('developpe-couche-halteres', 3, 8, 12, MAIN),
      ex('hip-thrust-barre', 2, 8, 12, MAIN),
      ex('tirage-horizontal-poulie-unilateral', 2, 10, 12, ISO),
      ex('leg-curl-allonge', 2, 10, 15, ISO),
      ex('elevations-laterales-poulie', 2, 12, 15, ISO),
    ],
  },
];

// Weekly guidance from section 4 of the programme (weeks 1–2, 3–4, 5–6, 7–8).
export const GUIDANCE = [
  'Démarrer léger ; 2–3 répétitions en réserve. Si besoin, 2 séries au lieu de 3 sur les mouvements principaux.',
  'Passer au nombre de séries prévu. Ajouter des répétitions à charge constante.',
  'Quand toutes les séries atteignent le haut de la fourchette proprement, augmenter légèrement la charge.',
  'Consolider charges et répétitions ; garder 1–2 répétitions en réserve sur les mouvements principaux.',
];

const S = (templateId) => ({ kind: 'strength', templateId });
const CLIMB = { kind: 'climb' }, SWIM = { kind: 'swim' };

// Mon → Sun
const WEEK = [[S('p1-upper-a')], [S('p1-lower-a')], [CLIMB], [S('p1-upper-b')], [S('p1-lower-b')], [SWIM], []];
// Week 1: Monday 2 Nov (Upper) was logged in Cap 78 kg, before Move; Thursday off,
// so Friday is a full-body session.
const WEEK_1 = [[], [S('p1-lower-a')], [CLIMB], [], [S('p1-full-body')], [SWIM], []];

/** 56 plan days from Monday 2 Nov 2026. */
export function planDays() {
  const out = [];
  const start = new Date(2026, 10, 2);
  for (let w = 0; w < 8; w++) {
    const pattern = w === 0 ? WEEK_1 : WEEK;
    for (let d = 0; d < 7; d++) {
      const dt = new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + d);
      const iso = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
      out.push({ date: iso, planId: PLAN_ID, week: w + 1, items: structuredClone(pattern[d]) });
    }
  }
  return out;
}
