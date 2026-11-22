// Trainingsprogramma: 7 oefeningen, elk met een ladder van trappen.
// unit: 'reps' of 'sec'. start/top = doel per set aan het begin en einde van een trap.
// step = hoeveel het doel omhoog gaat na 3 gelukte sessies.
// fig = de tekening uit figures.js. tempo = seconden per herhaling (standaard 2,2).

const EXERCISES = [
  {
    id: 'squat',
    muscles: 'Bovenbenen, billen',
    name: 'Squat',
    group: 'Benen',
    unit: 'reps',
    levels: [
      { name: 'Box squat naar stoel', fig: 'squat_box', cue: 'Zak tot je de stoel raakt, druk terug omhoog zonder te hangen.', start: 8, top: 15 },
      { name: 'Volledige squat', fig: 'squat', cue: 'Heupen onder knie-hoogte, hakken blijven op de grond.', start: 8, top: 20 },
      { name: 'Split squat', fig: 'split_squat', cue: 'Tel per been. Achterknie richting de grond, romp rechtop.', start: 6, top: 12, perSide: true },
      { name: 'Bulgarian split squat', fig: 'bulgarian', cue: 'Achtervoet op stoel. Tel per been, voorknie boven de voet.', start: 5, top: 12, perSide: true },
      { name: 'Pistol squat met steun', fig: 'pistol_assist', cue: 'Houd de stang vast, tel per been, zak zo diep als lukt.', start: 3, top: 8, perSide: true },
      { name: 'Pistol squat', fig: 'pistol', cue: 'Tel per been. Vrij been gestrekt vooruit, controle omlaag.', start: 1, top: 5, perSide: true },
    ],
  },
  {
    id: 'pushup',
    muscles: 'Borst, triceps, schouders',
    name: 'Push-up',
    group: 'Duwen',
    unit: 'reps',
    levels: [
      { name: 'Muur push-up', fig: 'pushup_wall', cue: 'Lichaam als een plank, ellebogen schuin naar achter.', start: 8, top: 15 },
      { name: 'Push-up op hoge stang', fig: 'pushup_bar', cue: 'Handen op stang of aanrecht, borst naar de rand.', start: 6, top: 15 },
      { name: 'Push-up op stoel of bank', fig: 'pushup_chair', cue: 'Handen op de zitting, heupen niet laten zakken.', start: 6, top: 15 },
      { name: 'Push-up op de grond', fig: 'pushup', cue: 'Borst raakt bijna de grond, volledig strekken bovenin.', start: 5, top: 20 },
      { name: 'Diamond push-up', fig: 'pushup', cue: 'Duimen en wijsvingers vormen een driehoek onder je borst.', start: 5, top: 15 },
      { name: 'Archer push-up', fig: 'pushup', cue: 'Tel per kant. Eén arm buigt, de andere blijft gestrekt.', start: 3, top: 10, perSide: true },
      { name: 'Pseudo-planche push-up', fig: 'pushup_planche', cue: 'Handen bij je heupen, leun ver naar voren.', start: 3, top: 12 },
    ],
  },
  {
    id: 'row',
    muscles: 'Rug, biceps',
    name: 'Trekken',
    group: 'Row naar pull-up',
    unit: 'reps',
    levels: [
      { name: 'Australian row, stang hoog', fig: 'row_high', cue: 'Lichaam schuin en strak, trek de borst naar de stang.', start: 6, top: 15 },
      { name: 'Australian row, stang laag', fig: 'row_bent', cue: 'Knieën gebogen, schouderbladen samen bovenin.', start: 6, top: 15 },
      { name: 'Australian row, benen gestrekt', fig: 'row', cue: 'Hakken op de grond, lichaam één rechte lijn.', start: 5, top: 15 },
      { name: 'Australian row, voeten op stoel', fig: 'row_feet_up', cue: 'Voeten verhoogd, heupen hoog houden.', start: 5, top: 12 },
      { name: 'Negatieve pull-up', fig: 'pullup', tempo: 6, cue: 'Spring omhoog, zak in 5 tellen gecontroleerd naar beneden.', start: 3, top: 8 },
      { name: 'Pull-up', fig: 'pullup', cue: 'Kin over de stang, helemaal uithangen onderin.', start: 1, top: 10 },
      { name: 'Archer pull-up', fig: 'pullup', cue: 'Tel per kant. Trek naar één hand, andere arm gestrekt.', start: 2, top: 8, perSide: true },
    ],
  },
  {
    id: 'dip',
    muscles: 'Triceps, borst, schouders',
    name: 'Dip',
    group: 'Duwen verticaal',
    unit: 'reps',
    levels: [
      { name: 'Bench dip, voeten op de grond', fig: 'dip_bench', cue: 'Handen op de rand achter je, ellebogen recht naar achter.', start: 6, top: 15 },
      { name: 'Bench dip, voeten op tweede stoel', fig: 'dip_bench_up', cue: 'Benen gestrekt op de andere stoel, zak tot 90 graden.', start: 6, top: 15 },
      { name: 'Negatieve dip', fig: 'dip', tempo: 6, cue: 'Start bovenin op de steunen, zak in 5 tellen.', start: 3, top: 8 },
      { name: 'Dip, halve diepte', fig: 'dip_half', cue: 'Ellebogen tot ongeveer 90 graden, dan omhoog.', start: 3, top: 10 },
      { name: 'Volledige dip', fig: 'dip', cue: 'Schouder onder de elleboog onderin, strek volledig.', start: 3, top: 12 },
      { name: 'Dip aan ringen', fig: 'dip_rings', cue: 'Ringen naar buiten draaien bovenin, schouders laag.', start: 3, top: 10 },
    ],
  },
  {
    id: 'hinge',
    muscles: 'Billen, hamstrings',
    name: 'Glute bridge',
    group: 'Billen en hamstrings',
    unit: 'reps',
    levels: [
      { name: 'Glute bridge', fig: 'bridge', cue: 'Knijp de billen bovenin, heupen volledig gestrekt.', start: 10, top: 20 },
      { name: 'Glute bridge, voeten op stoel', fig: 'bridge_feet_up', cue: 'Hielen op de zitting, druk door de hakken.', start: 8, top: 20 },
      { name: 'Eenbenige glute bridge', fig: 'bridge_single', cue: 'Tel per been. Heupen recht houden, niet kantelen.', start: 6, top: 15, perSide: true },
      { name: 'Nordic curl, negatief', fig: 'nordic', tempo: 6, cue: 'Enkels vast onder de stang of bank, zak in 5 tellen voorover.', start: 3, top: 8 },
      { name: 'Nordic curl', fig: 'nordic', tempo: 6, cue: 'Trek jezelf met de hamstrings terug omhoog.', start: 2, top: 8 },
    ],
  },
  {
    id: 'core',
    muscles: 'Buik, heupbuigers',
    name: 'Core',
    group: 'Plank naar L-sit',
    unit: 'sec',
    levels: [
      { name: 'Plank op knieën', fig: 'plank_knee', cue: 'Ellebogen onder de schouders, buik aangespannen.', start: 20, top: 45 },
      { name: 'Plank', fig: 'plank', cue: 'Van hoofd tot hiel één lijn, billen niet omhoog.', start: 20, top: 60 },
      { name: 'Hollow hold, knieën gebogen', fig: 'hollow_tuck', cue: 'Onderrug in de grond drukken, schouders los van de vloer.', start: 15, top: 45 },
      { name: 'Hollow hold', fig: 'hollow', cue: 'Benen gestrekt laag, armen langs de oren.', start: 15, top: 45 },
      { name: 'L-sit, knieën gebogen', fig: 'lsit_tuck', cue: 'Op de steunen, heupen boven de handen, knieën opgetrokken.', start: 10, top: 30 },
      { name: 'L-sit', fig: 'lsit', cue: 'Benen gestrekt horizontaal, schouders laag.', start: 5, top: 30 },
    ],
  },
  {
    id: 'hang',
    muscles: 'Grip, schouders, buik',
    name: 'Hangen',
    group: 'Grip en schouders',
    unit: 'sec',
    levels: [
      { name: 'Dead hang', fig: 'hang', cue: 'Ontspannen hangen, rustig ademen.', start: 10, top: 45 },
      { name: 'Actieve hang', fig: 'hang_active', cue: 'Trek de schouders naar beneden, nek lang.', start: 10, top: 40 },
      { name: 'Hangende knieheffing', fig: 'knee_raise', cue: 'Knieën naar de borst, niet zwaaien.', start: 5, top: 15, unit: 'reps' },
      { name: 'Hangende beenheffing', fig: 'leg_raise', cue: 'Gestrekte benen tot 90 graden, langzaam terug.', start: 4, top: 12, unit: 'reps' },
      { name: 'Toes to bar', fig: 'toes_to_bar', cue: 'Tenen raken de stang, controle omlaag.', start: 3, top: 12, unit: 'reps' },
    ],
  },
];

const WARMUP = [
  '10 armcirkels voor- en achteruit',
  '10 heupcirkels per kant',
  '10 lichte squats',
  '10 push-ups tegen de muur',
  '20 sec rustig hangen',
];

// Helpers om de eenheid per trap te bepalen (hang-ladder wisselt van sec naar reps).
function unitOf(ex, levelIdx) {
  const lvl = ex.levels[levelIdx];
  return lvl.unit || ex.unit;
}
function stepOf(ex, levelIdx) {
  return unitOf(ex, levelIdx) === 'sec' ? 5 : 1;
}

if (typeof module !== 'undefined') module.exports = { EXERCISES, WARMUP, unitOf, stepOf };
