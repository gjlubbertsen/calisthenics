/* Calisthenics trainer: opslag, instaptest, circuit-timer, progressie, statistieken. */

const STORE_KEY = 'calisthenics-v2';
const DEFAULT_SETTINGS = {
  rounds: 3, work: 25, rest: 15, roundRest: 30, warmup: 45, weeklyGoal: 3,
  sound: true, voice: false, vibrate: true, wakeLock: true, theme: 'dark',
};
const LIMITS = { rounds: [1, 6], work: [10, 120], rest: [5, 120], roundRest: [0, 180], warmup: [0, 300], weeklyGoal: [1, 7] };
const REP_SECONDS = 2.2;

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

// ---------- Opslag ----------
function defaultState() {
  const ex = {};
  for (const e of EXERCISES) ex[e.id] = { level: 0, target: e.levels[0].start, succ: 0, fail: 0, active: true };
  return { version: 2, onboarded: false, ex, sessions: [], badges: {}, levelUps: 0, settings: { ...DEFAULT_SETTINGS } };
}
// Maakt van willekeurige opgeslagen of geïmporteerde data een geldige staat.
function normalise(raw) {
  const d = defaultState();
  if (!raw || typeof raw !== 'object') return d;
  const s = { ...d, ...raw };
  s.settings = { ...d.settings, ...(raw.settings || {}) };
  for (const [k, [lo, hi]] of Object.entries(LIMITS)) {
    const v = Number(s.settings[k]);
    s.settings[k] = Number.isFinite(v) ? clamp(Math.round(v), lo, hi) : d.settings[k];
  }
  s.ex = { ...(raw.ex || {}) };
  for (const e of EXERCISES) {
    const st = { ...d.ex[e.id], ...(s.ex[e.id] || {}) };
    st.level = clamp(Math.round(Number(st.level) || 0), 0, e.levels.length - 1);
    const L = e.levels[st.level];
    st.target = clamp(Math.round(Number(st.target) || L.start), L.start, L.top);
    st.active = st.active !== false;
    s.ex[e.id] = st;
  }
  s.sessions = Array.isArray(raw.sessions) ? raw.sessions.filter((x) => x && x.date && x.results) : [];
  s.badges = raw.badges && typeof raw.badges === 'object' ? raw.badges : {};
  s.levelUps = Number(raw.levelUps) || 0;
  return s;
}
function load() {
  try { return normalise(JSON.parse(localStorage.getItem(STORE_KEY))); } catch { return defaultState(); }
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { console.warn('Opslaan mislukt', e); }
}

// ---------- Hulpfuncties ----------
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
const pad = (n) => String(n).padStart(2, '0');
const fmtTime = (s) => `${Math.floor(s / 60)}:${pad(Math.floor(s % 60))}`;
const fmtUnit = (n, unit) => (unit === 'sec' ? `${n} sec` : `${n}×`);
const iso = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseISO = (s) => new Date(`${s}T12:00:00`);
const fmtDate = (s, opts = { weekday: 'long', day: 'numeric', month: 'long' }) => parseISO(s).toLocaleDateString('nl-NL', opts);
function weekStart(d) {
  const x = new Date(d); x.setHours(12, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

let state = load();

const exState = (ex) => state.ex[ex.id];
const currentLevel = (ex) => ex.levels[exState(ex).level];
const currentUnit = (ex) => unitOf(ex, exState(ex).level);
const activeExercises = () => EXERCISES.filter((e) => exState(e).active);
const sideText = (L) => (L.perSide ? ' per kant' : '');

function workDuration(ex) {
  const st = exState(ex); const L = currentLevel(ex);
  const need = currentUnit(ex) === 'sec'
    ? st.target + 3
    : st.target * (L.perSide ? 2 : 1) * (L.tempo || REP_SECONDS) + 3;
  return Math.max(state.settings.work, Math.ceil(need / 5) * 5);
}
function buildPhases() {
  const s = state.settings; const list = activeExercises(); const ph = [];
  ph.push(s.warmup > 0 ? { type: 'warmup', dur: s.warmup } : { type: 'ready', dur: 5 });
  for (let r = 0; r < s.rounds; r++) {
    list.forEach((ex, i) => {
      ph.push({ type: 'work', ex, round: r, dur: workDuration(ex) });
      const last = r === s.rounds - 1 && i === list.length - 1;
      if (!last) ph.push({ type: 'rest', ex, round: r, dur: s.rest + (i === list.length - 1 ? s.roundRest : 0) });
    });
  }
  ph.push({ type: 'done', dur: 0 });
  return ph;
}
const totalDuration = () => buildPhases().reduce((t, p) => t + p.dur, 0);

// ---------- Statistieken ----------
function stats() {
  const byWeek = {}; const days = new Set();
  let secs = 0, reps = 0, perfect = false;
  for (const s of state.sessions) {
    const wk = iso(weekStart(parseISO(s.date)));
    byWeek[wk] = (byWeek[wk] || 0) + 1;
    days.add(s.date);
    secs += s.dur || 0;
    const rs = Object.values(s.results);
    if (rs.length && rs.every((r) => r.ok)) perfect = true;
    for (const r of rs) {
      if (r.unit === 'sec') continue;
      for (const v of r.sets) if (v != null) reps += v * (r.perSide ? 2 : 1);
    }
  }
  const goal = state.settings.weeklyGoal;
  const hit = (d) => (byWeek[iso(d)] || 0) >= goal;
  const thisWeek = weekStart(new Date());
  // Reeks: weken op rij met het weekdoel. De lopende week breekt de reeks niet.
  let streak = hit(thisWeek) ? 1 : 0;
  for (let w = addDays(thisWeek, -7); hit(w); w = addDays(w, -7)) streak++;
  let best = 0, run = 0;
  if (state.sessions.length) {
    const first = weekStart(parseISO(state.sessions.reduce((m, s) => (s.date < m ? s.date : m), state.sessions[0].date)));
    for (let w = first; w <= thisWeek; w = addDays(w, 7)) { run = hit(w) ? run + 1 : 0; best = Math.max(best, run); }
  }
  return { n: state.sessions.length, days, byWeek, secs, reps, perfect, streak, best, weekCount: byWeek[iso(thisWeek)] || 0, goal };
}

const BADGES = [
  { id: 'first', ico: '🚀', name: 'Eerste stap', desc: 'Je eerste training', test: (c) => c.n >= 1 },
  { id: 'five', ico: '🖐️', name: 'High five', desc: '5 trainingen', test: (c) => c.n >= 5 },
  { id: 'ten', ico: '🔟', name: 'Dubbele cijfers', desc: '10 trainingen', test: (c) => c.n >= 10 },
  { id: 'twentyfive', ico: '🏅', name: 'Gewoonte', desc: '25 trainingen', test: (c) => c.n >= 25 },
  { id: 'fifty', ico: '🏆', name: 'Vijftig', desc: '50 trainingen', test: (c) => c.n >= 50 },
  { id: 'week', ico: '🎯', name: 'Weekdoel', desc: 'Weekdoel gehaald', test: (c) => c.best >= 1 },
  { id: 'month', ico: '🔥', name: 'Vier weken', desc: '4 weken op rij je weekdoel', test: (c) => c.best >= 4 },
  { id: 'perfect', ico: '💯', name: 'Alles raak', desc: 'Elke oefening gehaald', test: (c) => c.perfect },
  { id: 'levelup', ico: '⬆️', name: 'Trap hoger', desc: 'Voor het eerst een trap omhoog', test: () => state.levelUps >= 1 },
  { id: 'reps', ico: '💪', name: 'Duizend', desc: '1000 herhalingen', test: (c) => c.reps >= 1000 },
  { id: 'pushup', ico: '🤸', name: 'Echte push-up', desc: 'Push-ups op de grond', test: () => state.ex.pushup.level >= 3 },
  { id: 'pullup', ico: '🧗', name: 'Pull-up', desc: 'Je eerste pull-ups', test: () => state.ex.row.level >= 5 },
  { id: 'dip', ico: '🦾', name: 'Volledige dip', desc: 'Dips op volle diepte', test: () => state.ex.dip.level >= 4 },
  { id: 'pistol', ico: '🦵', name: 'Pistol squat', desc: 'Squat op één been', test: () => state.ex.squat.level >= 5 },
  { id: 'lsit', ico: '🧘', name: 'L-sit', desc: 'Benen gestrekt vooruit', test: () => state.ex.core.level >= 5 },
];
function awardBadges() {
  const c = stats(); const fresh = [];
  for (const b of BADGES) if (!state.badges[b.id] && b.test(c)) { state.badges[b.id] = iso(); fresh.push(b); }
  return fresh;
}

// ---------- Thema ----------
function applyTheme() {
  let t = state.settings.theme;
  if (t === 'system') t = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  document.documentElement.dataset.theme = t;
  $('meta[name="theme-color"]').content = t === 'light' ? '#F3F4F7' : '#0E1116';
}
matchMedia('(prefers-color-scheme: light)').addEventListener('change', applyTheme);

// ---------- Schermen ----------
let currentScreen = '';
function show(name) {
  currentScreen = name;
  $$('.screen').forEach((s) => (s.hidden = s.id !== `screen-${name}`));
  $('#tabs').hidden = !['home', 'progress', 'history', 'settings'].includes(name);
  $$('#tabs button').forEach((b) => b.classList.toggle('active', b.dataset.screen === name));
  window.scrollTo(0, 0);
  if (name === 'home') renderHome();
  if (name === 'progress') renderProgress();
  if (name === 'history') renderHistory();
  if (name === 'settings') renderSettings();
}
$$('#tabs button').forEach((b) => b.addEventListener('click', () => show(b.dataset.screen)));

// Steppers: elke .stepper heeft −/+ knoppen rond een input.
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.step');
  if (!btn) return;
  const input = btn.parentElement.querySelector('input');
  const inc = Number(input.dataset.inc || 1);
  if (input.value === '') input.value = input.dataset.default ?? 0;
  else input.value = Math.max(0, (Number(input.value) || 0) + Number(btn.dataset.step) * inc);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
});

// ---------- Welkom en instaptest ----------
let obIndex = 0;
function startWelcome() {
  $('#welcome-fig').innerHTML = figSVG('pushup', { anim: true });
  show('welcome');
}
$('#welcome-start').addEventListener('click', startOnboard);
$('#welcome-skip').addEventListener('click', () => { state.onboarded = true; save(); show('home'); });

function startOnboard() { obIndex = 0; renderOnboard(); show('onboard'); }
function renderOnboard() {
  const ex = EXERCISES[obIndex]; const st = exState(ex);
  $('#ob-progress').textContent = `Instaptest ${obIndex + 1} van ${EXERCISES.length}`;
  $('#ob-segs').innerHTML = EXERCISES.map((_, i) => `<i class="${i < obIndex ? 'done' : i === obIndex ? 'now' : ''}"></i>`).join('');
  $('#ob-title').textContent = ex.name;
  $('#ob-group').textContent = `${ex.group} · ${ex.muscles}`;
  const box = $('#ob-levels');
  box.innerHTML = ex.levels.map((l, i) => {
    const u = unitOf(ex, i);
    return `<label><input type="radio" name="ob-level" value="${i}" ${i === st.level ? 'checked' : ''}>
      <span class="num">${i + 1}</span><span class="name">${l.name}</span>
      <span class="range">${fmtUnit(l.start, u)} – ${fmtUnit(l.top, u)}</span></label>`;
  }).join('');
  const update = () => {
    const lvl = Number(box.querySelector('input:checked').value);
    const L = ex.levels[lvl]; const u = unitOf(ex, lvl);
    $('#ob-fig').innerHTML = figSVG(L.fig, { anim: true, label: L.name });
    $('#ob-cue').textContent = L.cue;
    $('#ob-max-label').textContent = u === 'sec'
      ? 'Hoe lang houd je dit maximaal vol (sec)?'
      : `Hoeveel haal je maximaal in één set${sideText(L)}?`;
    const inp = $('#ob-max');
    inp.dataset.inc = u === 'sec' ? 5 : 1;
    inp.value = Math.round((st.level === lvl ? st.target : L.start) / 0.7);
  };
  box.querySelectorAll('input').forEach((r) => r.addEventListener('change', update));
  update();
  $('#ob-back').hidden = obIndex === 0;
  $('#ob-next').textContent = obIndex === EXERCISES.length - 1 ? 'Klaar' : 'Volgende';
  window.scrollTo(0, 0);
}
function commitOnboard() {
  const ex = EXERCISES[obIndex];
  let lvl = Number($('#ob-levels input:checked').value);
  const max = Number($('#ob-max').value) || 0;
  let L = ex.levels[lvl];
  let target = Math.round(max * 0.7);
  if (unitOf(ex, lvl) === 'sec') target = Math.round(target / 5) * 5;
  if (target > L.top && lvl < ex.levels.length - 1) { lvl += 1; L = ex.levels[lvl]; target = L.start; }
  state.ex[ex.id] = { ...exState(ex), level: lvl, target: clamp(target, L.start, L.top), succ: 0, fail: 0 };
}
$('#ob-next').addEventListener('click', () => {
  commitOnboard();
  if (obIndex < EXERCISES.length - 1) { obIndex++; renderOnboard(); }
  else { state.onboarded = true; save(); show('home'); }
});
$('#ob-back').addEventListener('click', () => { if (obIndex > 0) { obIndex--; renderOnboard(); } });

// ---------- Start ----------
function renderHome() {
  const c = stats(); const now = new Date(); const s = state.settings;
  const doneToday = c.days.has(iso(now));
  $('#home-date').textContent = now.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });
  $('#home-title').textContent = doneToday ? 'Vandaag zit erop' : c.n === 0 ? 'Je eerste training' : 'Klaar om te trainen?';
  const chip = $('#home-streak');
  chip.hidden = c.streak < 1;
  chip.textContent = `🔥 ${c.streak} ${c.streak === 1 ? 'week' : 'weken'}`;
  chip.title = 'Weken op rij met je weekdoel gehaald';

  const mon = weekStart(now);
  const dayNames = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];
  $('#home-week').innerHTML = `<div class="week-days">${dayNames.map((n, i) => {
    const d = iso(addDays(mon, i)); const done = c.days.has(d);
    return `<div class="${done ? 'done' : ''} ${d === iso(now) ? 'today' : ''}"><i>${done ? '✓' : ''}</i>${n}</div>`;
  }).join('')}</div>
  <div class="week-count"><b>${c.weekCount}/${c.goal}</b><span>deze week</span></div>`;

  const list = activeExercises();
  $('#home-min').textContent = Math.round(totalDuration() / 60);
  $('#home-meta').textContent = `${list.length} oefeningen · ${s.rounds} ${s.rounds === 1 ? 'ronde' : 'rondes'} · ${s.warmup > 0 ? 'met' : 'zonder'} warming-up`;
  $('#home-rounds').innerHTML = [2, 3, 4].map((r) => `<button type="button" data-rounds="${r}" class="${s.rounds === r ? 'on' : ''}">${r} rondes</button>`).join('');
  const startBtn = $('#home-start');
  startBtn.textContent = doneToday ? 'Nog een keer trainen' : 'Start training';
  startBtn.disabled = list.length === 0;

  $('#home-plan').innerHTML = EXERCISES.map((ex) => {
    const st = exState(ex); const L = currentLevel(ex);
    return `<li><button type="button" data-ex="${ex.id}" class="${st.active ? '' : 'off'}">
      <span class="thumb">${figSVG(L.fig, { label: L.name })}</span>
      <span class="txt"><span class="name">${ex.name}</span><span class="lvl">Trap ${st.level + 1} · ${L.name}</span></span>
      <span class="tgt">${st.active ? fmtUnit(st.target, currentUnit(ex)) : 'uit'}</span></button></li>`;
  }).join('');
}
$('#home-rounds').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-rounds]');
  if (!b) return;
  state.settings.rounds = Number(b.dataset.rounds); save(); renderHome();
});
$('#home-plan').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-ex]');
  if (b) openSheet(b.dataset.ex);
});
$('#home-start').addEventListener('click', startWorkout);

// ---------- Uitleg per oefening ----------
const sheet = { ex: null, lvl: 0 };
function openSheet(id) {
  sheet.ex = EXERCISES.find((e) => e.id === id);
  sheet.lvl = exState(sheet.ex).level;
  renderSheet();
  $('#sheet').hidden = false;
  $('.sheet-card').scrollTop = 0;
}
function closeSheet() {
  $('#sheet').hidden = true;
  $('#sheet-body').innerHTML = '';
  if (currentScreen === 'home') renderHome();
  if (currentScreen === 'progress') renderProgress();
}
function renderSheet() {
  const ex = sheet.ex; const st = exState(ex); const lvl = sheet.lvl;
  const L = ex.levels[lvl]; const u = unitOf(ex, lvl); const isCurrent = lvl === st.level;
  $('#sheet-body').innerHTML = `
    <p class="kicker">${ex.group} · ${ex.muscles}</p>
    <h1 id="sheet-title">${ex.name}</h1>
    <div class="figcard">${figSVG(L.fig, { anim: true, label: L.name })}</div>
    <h2>Trap ${lvl + 1}: ${L.name}</h2>
    <p class="cue">${L.cue}</p>
    ${isCurrent ? `<div class="card">
      <p class="label">Jouw doel per set${sideText(L)} (${fmtUnit(L.start, u)} – ${fmtUnit(L.top, u)})</p>
      <div class="stepper">
        <button type="button" class="step" data-step="-1" aria-label="Minder">−</button>
        <input id="sheet-target" type="number" inputmode="numeric" data-inc="${stepOf(ex, lvl)}" value="${st.target}" aria-label="Doel per set">
        <button type="button" class="step" data-step="1" aria-label="Meer">+</button>
      </div></div>`
    : `<button type="button" class="btn primary" id="sheet-use" style="width:100%;margin-bottom:12px">Train op deze trap</button>`}
    <p class="label">Alle trappen</p>
    <div class="levels">${ex.levels.map((l, i) => `<label><input type="radio" name="sheet-level" value="${i}" ${i === lvl ? 'checked' : ''}>
      <span class="num">${i + 1}</span><span class="name">${l.name}</span>
      ${i === st.level ? '<span class="tag">Nu</span>' : `<span class="range">${fmtUnit(l.start, unitOf(ex, i))} – ${fmtUnit(l.top, unitOf(ex, i))}</span>`}</label>`).join('')}</div>
    <div class="card"><div class="setting"><label for="sheet-active">In mijn circuit</label>
      <input id="sheet-active" class="switch" type="checkbox" ${st.active ? 'checked' : ''}></div>
      <p class="muted small">Zet uit als je deze oefening tijdelijk niet kunt doen, bijvoorbeeld zonder stang.</p></div>`;
}
$('#sheet-body').addEventListener('change', (e) => {
  const ex = sheet.ex; const st = exState(ex);
  if (e.target.name === 'sheet-level') { sheet.lvl = Number(e.target.value); renderSheet(); }
  if (e.target.id === 'sheet-active') { st.active = e.target.checked; save(); }
  if (e.target.id === 'sheet-target') {
    const L = currentLevel(ex);
    st.target = clamp(Math.round(Number(e.target.value) || L.start), L.start, L.top);
    e.target.value = st.target; st.succ = 0; st.fail = 0; save();
  }
});
$('#sheet-body').addEventListener('click', (e) => {
  if (e.target.id !== 'sheet-use') return;
  const st = exState(sheet.ex);
  st.level = sheet.lvl; st.target = sheet.ex.levels[sheet.lvl].start; st.succ = 0; st.fail = 0;
  save(); renderSheet();
});
$('#sheet-close').addEventListener('click', closeSheet);
$('#sheet').addEventListener('click', (e) => { if (e.target.id === 'sheet') closeSheet(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#sheet').hidden) closeSheet(); });

// ---------- Voortgang ----------
function ladderIndex(ex, level, target) {
  const L = ex.levels[level];
  return level + (target - L.start) / (L.top - L.start + stepOf(ex, level));
}
function sparkline(ex) {
  const pts = state.sessions.map((s) => s.results[ex.id]).filter((r) => r && typeof r.idx === 'number').map((r) => r.idx).slice(-20);
  if (pts.length < 2) return '';
  const lo = Math.min(...pts), hi = Math.max(...pts); const span = hi - lo || 1;
  const xy = pts.map((v, i) => [4 + (i * 76) / (pts.length - 1), 25 - ((v - lo) / span) * 20]);
  const end = xy[xy.length - 1];
  return `<svg class="spark" viewBox="0 0 84 30" role="img" aria-label="Verloop van je doel over de laatste ${pts.length} trainingen">
    <path d="M${xy.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L')}"/><circle cx="${end[0]}" cy="${end[1].toFixed(1)}" r="3.5"/></svg>`;
}
function weekChart(c) {
  const W = 320, H = 132, left = 22, top = 10, bottom = 22, n = 8;
  const now = weekStart(new Date());
  const weeks = Array.from({ length: n }, (_, i) => addDays(now, -7 * (n - 1 - i)));
  const counts = weeks.map((w) => c.byWeek[iso(w)] || 0);
  const max = Math.max(c.goal, ...counts, 1);
  const ph = H - top - bottom; const y = (v) => top + ph - (v / max) * ph;
  const slot = (W - left) / n; const bw = Math.min(24, slot - 8);
  let out = '';
  for (let v = 0; v <= max; v++) {
    if (max > 4 && v % 2 && v !== max) continue;
    out += `<path class="grid" d="M${left} ${y(v)}H${W}"/><text x="${left - 6}" y="${y(v) + 3.5}" text-anchor="end">${v}</text>`;
  }
  weeks.forEach((w, i) => {
    const x = left + slot * i + (slot - bw) / 2; const v = counts[i];
    const label = i === n - 1 ? 'nu' : `${w.getDate()}/${w.getMonth() + 1}`;
    const tip = `Week van ${w.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}: ${v} ${v === 1 ? 'training' : 'trainingen'}`;
    if (v > 0) {
      const yy = y(v); const r = Math.min(4, (y(0) - yy) / 2);
      out += `<path class="bar" d="M${x} ${y(0)}V${yy + r}q0 ${-r} ${r} ${-r}H${x + bw - r}q${r} 0 ${r} ${r}V${y(0)}z"><title>${tip}</title></path>`;
    } else out += `<rect class="bar empty" x="${x}" y="${y(0) - 3}" width="${bw}" height="3" rx="1.5"><title>${tip}</title></rect>`;
    out += `<text class="${i === n - 1 ? 'now' : ''}" x="${x + bw / 2}" y="${H - 6}" text-anchor="middle">${label}</text>`;
  });
  out += `<path class="goal" d="M${left} ${y(c.goal)}H${W}"/>`;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Trainingen per week, laatste ${n} weken: ${counts.join(', ')}. Weekdoel ${c.goal}.">${out}</svg>`;
}
function renderProgress() {
  const c = stats();
  $('#progress-tiles').innerHTML = [
    [c.n, c.n === 1 ? 'training' : 'trainingen'],
    [c.streak, `${c.streak === 1 ? 'week' : 'weken'} op rij (record ${c.best})`],
    [Math.round(c.secs / 60), 'minuten getraind'],
    [c.reps.toLocaleString('nl-NL'), 'herhalingen'],
  ].map(([v, l]) => `<div class="tile"><b>${v}</b><span>${l}</span></div>`).join('');
  $('#progress-week-sub').textContent = `Stippellijn is je weekdoel van ${c.goal}. Deze week: ${c.weekCount}.`;
  $('#progress-weeks').innerHTML = weekChart(c);

  $('#progress-list').innerHTML = EXERCISES.map((ex) => {
    const st = exState(ex); const L = currentLevel(ex); const u = currentUnit(ex);
    const pct = Math.round(((st.target - L.start) / Math.max(1, L.top - L.start)) * 100);
    const streak = st.succ > 0 ? `${st.succ} van 3 gehaald, daarna gaat het doel omhoog`
      : st.fail > 0 ? 'Eén keer gemist. Nog een keer en het doel gaat omlaag' : 'Haal je doel 3 trainingen op rij om te stijgen';
    return `<div class="card prog" data-ex="${ex.id}">
      <div class="prog-head"><span class="thumb">${figSVG(L.fig, { label: L.name })}</span>
        <div><h2>${ex.name}</h2><p class="muted small" style="margin:0">Trap ${st.level + 1} van ${ex.levels.length} · ${L.name}</p></div>${sparkline(ex)}</div>
      <div class="row-between small"><span>Doel <b>${fmtUnit(st.target, u)}</b>${sideText(L)}</span><span class="muted">volgende trap na ${fmtUnit(L.top, u)}</span></div>
      <div class="bar-track"><span style="width:${pct}%"></span></div>
      <p class="muted small" style="margin:0">${streak}</p>
      <div class="pips" aria-hidden="true">${ex.levels.map((_, i) => `<i class="${i < st.level ? 'done' : i === st.level ? 'current' : ''}"></i>`).join('')}</div>
    </div>`;
  }).join('');
  $('#progress-badges').innerHTML = BADGES.map((b) => `<div class="badge ${state.badges[b.id] ? 'got' : ''}">
    <span class="ico">${b.ico}</span><b>${b.name}</b>${b.desc}</div>`).join('');
}
$('#progress-list').addEventListener('click', (e) => {
  const card = e.target.closest('.prog[data-ex]');
  if (card) openSheet(card.dataset.ex);
});

// ---------- Historie ----------
let calMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
function renderHistory() {
  const c = stats(); const y = calMonth.getFullYear(), m = calMonth.getMonth();
  const blanks = (new Date(y, m, 1).getDay() + 6) % 7; const count = new Date(y, m + 1, 0).getDate();
  let cells = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'].map((d) => `<span>${d}</span>`).join('') + '<b></b>'.repeat(blanks);
  for (let d = 1; d <= count; d++) {
    const key = `${y}-${pad(m + 1)}-${pad(d)}`;
    cells += `<i class="${c.days.has(key) ? 'done' : ''} ${key === iso() ? 'today' : ''}">${d}</i>`;
  }
  $('#history-cal').innerHTML = `<div class="cal-head">
    <button type="button" class="icon-btn" data-cal="-1" aria-label="Vorige maand">‹</button>
    <h2>${calMonth.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}</h2>
    <button type="button" class="icon-btn" data-cal="1" aria-label="Volgende maand">›</button></div>
    <div class="cal-grid">${cells}</div>`;

  const box = $('#history-list');
  if (!state.sessions.length) { box.innerHTML = '<p class="empty">Nog geen trainingen. Je eerste staat zo in deze lijst.</p>'; return; }
  box.innerHTML = state.sessions.map((s, i) => ({ s, i })).reverse().map(({ s, i }) => {
    const rs = EXERCISES.map((ex) => [ex, s.results[ex.id]]).filter(([, r]) => r);
    const okCount = rs.filter(([, r]) => r.ok).length;
    return `<details class="card hist"><summary><span class="date">${fmtDate(s.date, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
      <span class="meta">${s.dur >= 60 ? `${Math.round(s.dur / 60)} min · ` : ''}${okCount}/${rs.length} gehaald</span></summary>
      ${rs.map(([ex, r]) => `<p class="sets"><b>${ex.name}</b>
        <span>${r.sets.map((v) => (v == null ? '–' : v)).join(' / ')} <span class="${r.ok ? 'ok' : r.done === false ? '' : 'bad'}">${r.ok ? '✓' : r.done === false ? 'deels' : '✗'}</span> doel ${fmtUnit(r.target, r.unit)}</span></p>`).join('')}
      <button type="button" class="btn danger" data-del="${i}">Verwijder training</button></details>`;
  }).join('');
}
$('#history-cal').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-cal]');
  if (!b) return;
  calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + Number(b.dataset.cal), 1);
  renderHistory();
});
$('#history-list').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-del]');
  if (!b) return;
  if (confirm('Deze training verwijderen? Je trappen en doelen blijven zoals ze nu zijn.')) {
    state.sessions.splice(Number(b.dataset.del), 1); save(); renderHistory();
  }
});

// ---------- Instellingen ----------
function renderSettings() {
  $$('#screen-settings input[data-key]').forEach((inp) => {
    const k = inp.dataset.key; const v = state.settings[k];
    if (inp.type === 'checkbox') inp.checked = !!v;
    else { inp.value = v; [inp.min, inp.max] = LIMITS[k]; }
  });
  $$('#s-theme button').forEach((b) => b.classList.toggle('on', b.dataset.themeOpt === state.settings.theme));
  $('#s-duration').textContent = `Een training duurt nu ongeveer ${Math.round(totalDuration() / 60)} minuten. Oefeningen met veel herhalingen of lange holds krijgen automatisch meer tijd.`;
}
$$('#screen-settings input[data-key]').forEach((inp) => inp.addEventListener('change', () => {
  const k = inp.dataset.key;
  if (inp.type === 'checkbox') state.settings[k] = inp.checked;
  else {
    const v = Number(inp.value); const [lo, hi] = LIMITS[k];
    state.settings[k] = inp.value === '' || !Number.isFinite(v) ? DEFAULT_SETTINGS[k] : clamp(Math.round(v), lo, hi);
  }
  save(); renderSettings();
  if (k === 'voice' && inp.checked) speak('Gesproken coach staat aan.');
}));
$('#s-theme').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-theme-opt]');
  if (!b) return;
  state.settings.theme = b.dataset.themeOpt; save(); applyTheme(); renderSettings();
});
$('#s-export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `calisthenics-${iso()}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});
$('#s-import').addEventListener('change', async (e) => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const s = JSON.parse(await f.text());
    if (!s || typeof s.ex !== 'object' || !Array.isArray(s.sessions)) throw new Error('bestand');
    if (!confirm(`Importeren vervangt je huidige data door ${s.sessions.length} trainingen uit dit bestand. Doorgaan?`)) return;
    state = normalise(s); state.onboarded = true; save(); applyTheme(); show('home');
  } catch { alert('Dit bestand kon niet gelezen worden. Kies een export van deze app.'); }
  finally { e.target.value = ''; }
});
$('#s-redo').addEventListener('click', startOnboard);
$('#s-reset').addEventListener('click', () => {
  if (confirm('Alle trappen, doelen, badges en trainingen wissen?')) { state = defaultState(); save(); applyTheme(); startWelcome(); }
});
let installEvent = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvent = e; $('#s-install').hidden = false; });
$('#s-install').addEventListener('click', async () => {
  if (!installEvent) return;
  installEvent.prompt(); await installEvent.userChoice; installEvent = null; $('#s-install').hidden = true;
});

// ---------- Geluid, stem, trillen, scherm aan ----------
let audio;
function beep(freq = 880, ms = 120) {
  if (!state.settings.sound) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
    const o = audio.createOscillator(); const g = audio.createGain();
    o.frequency.value = freq; o.connect(g); g.connect(audio.destination);
    g.gain.setValueAtTime(0.25, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + ms / 1000);
    o.start(); o.stop(audio.currentTime + ms / 1000);
  } catch { /* geen geluid beschikbaar */ }
}
function speak(text) {
  if (!state.settings.voice || !('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = 'nl-NL'; u.rate = 1.05;
    speechSynthesis.speak(u);
  } catch { /* geen stem beschikbaar */ }
}
function buzz(pattern) { if (state.settings.vibrate && navigator.vibrate) navigator.vibrate(pattern); }
let wakeLock = null;
async function keepAwake(on) {
  try {
    if (on && state.settings.wakeLock && 'wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
    else if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch { /* niet ondersteund */ }
}

// ---------- Training ----------
const RING = 2 * Math.PI * 54;
const wo = { active: false, phases: [], idx: 0, endAt: 0, remaining: 0, paused: false, timer: 0, lastShown: null, results: {}, list: [], elapsed: 0 };

function startWorkout() {
  wo.list = activeExercises();
  if (!wo.list.length) return;
  wo.phases = buildPhases(); wo.idx = 0; wo.paused = false; wo.active = true; wo.results = {}; wo.elapsed = 0;
  for (const ex of wo.list) wo.results[ex.id] = Array(state.settings.rounds).fill(null);
  beep(660, 60);
  keepAwake(true);
  show('workout');
  setPaused(false);
  enterPhase();
  clearInterval(wo.timer);
  wo.timer = setInterval(tick, 100);
}
function nextWork(from) {
  for (let i = from + 1; i < wo.phases.length; i++) if (wo.phases[i].type === 'work') return wo.phases[i];
  return null;
}
const targetText = (ex) => `${fmtUnit(exState(ex).target, currentUnit(ex))}${sideText(currentLevel(ex))} · ${currentLevel(ex).name}`;
const spoken = (ex) => (currentUnit(ex) === 'sec' ? `${exState(ex).target} seconden` : `${exState(ex).target} keer${sideText(currentLevel(ex))}`);

function enterPhase() {
  const p = wo.phases[wo.idx];
  if (p.type === 'done') { finishWorkout(); return; }
  const root = $('#screen-workout');
  const kind = p.type === 'work' ? 'work' : p.type === 'rest' ? 'rest' : 'warmup';
  ['work', 'rest', 'warmup'].forEach((k) => root.classList.toggle(`is-${k}`, k === kind));
  const next = nextWork(wo.idx);
  const works = wo.phases.filter((x) => x.type === 'work');
  const doneCount = wo.phases.slice(0, wo.idx).filter((x) => x.type === 'work').length;
  $('#wo-warmup').hidden = p.type !== 'warmup';
  $('#wo-log').hidden = p.type !== 'rest';
  $('#wo-cue').textContent = '';

  if (p.type === 'work') {
    const L = currentLevel(p.ex);
    $('#wo-phase').textContent = `Oefening ${doneCount + 1} van ${works.length}`;
    $('#wo-kicker').textContent = `Ronde ${p.round + 1} van ${state.settings.rounds}`;
    $('#wo-name').textContent = p.ex.name;
    $('#wo-target').textContent = targetText(p.ex);
    $('#wo-cue').textContent = L.cue;
    $('#wo-fig').innerHTML = figSVG(L.fig, { anim: true, label: L.name });
    $('#wo-skip').textContent = 'Klaar';
    beep(1046, 180); buzz([80, 40, 80]);
    speak(`${p.ex.name}. ${spoken(p.ex)}.`);
  } else {
    const L = next ? currentLevel(next.ex) : null;
    $('#wo-phase').textContent = p.type === 'rest' ? `${doneCount} van ${works.length} gedaan` : 'Voorbereiding';
    $('#wo-kicker').textContent = p.type === 'rest' ? 'Rust · straks' : p.type === 'warmup' ? 'Warming-up · straks' : 'Maak je klaar';
    $('#wo-name').textContent = next ? next.ex.name : 'Bijna klaar';
    $('#wo-target').textContent = next ? targetText(next.ex) : '';
    $('#wo-fig').innerHTML = L ? figSVG(L.fig, { anim: true, label: L.name }) : '';
    $('#wo-skip').textContent = 'Verder';
    if (p.type === 'warmup') {
      $('#wo-warmup').innerHTML = WARMUP.map((w) => `<li>${w}</li>`).join('');
      speak('Warming-up.');
    } else if (p.type === 'rest') {
      const st = exState(p.ex); const u = currentUnit(p.ex);
      $('#wo-log-label').textContent = `${p.ex.name}: hoeveel haalde je? Doel ${fmtUnit(st.target, u)}`;
      const inp = $('#wo-log-val');
      inp.dataset.inc = u === 'sec' ? 5 : 1;
      inp.value = wo.results[p.ex.id][p.round] ?? st.target;
      beep(523, 180); buzz(150);
      speak(next ? `Rust. Straks ${next.ex.name}.` : 'Rust.');
    } else speak(next ? `Maak je klaar voor ${next.ex.name}.` : '');
  }
  $('#wo-segs').innerHTML = works.map((w, i) => `${i > 0 && w.round !== works[i - 1].round ? '<i class="gap"></i>' : ''}<i class="${i < doneCount ? 'done' : i === doneCount && p.type === 'work' ? 'now' : ''}"></i>`).join('');
  wo.remaining = p.dur * 1000; wo.endAt = Date.now() + wo.remaining; wo.lastShown = null;
  tick();
}

function tick() {
  if (!wo.active || wo.paused) return;
  const p = wo.phases[wo.idx];
  const ms = Math.max(0, wo.endAt - Date.now());
  const left = Math.ceil(ms / 1000);
  $('#wo-ring').style.strokeDashoffset = RING * (1 - ms / (p.dur * 1000));
  if (left !== wo.lastShown) {
    $('#wo-clock').textContent = fmtTime(left);
    const rest = wo.phases.slice(wo.idx + 1).reduce((t, x) => t + x.dur, 0) + left;
    $('#wo-total').textContent = fmtTime(rest);
    if (left > 0 && left <= 3 && wo.lastShown !== null) beep(880, 90);
    wo.lastShown = left;
  }
  if (ms <= 0) advance();
}
function advance() {
  const p = wo.phases[wo.idx];
  const msLeft = wo.paused ? wo.remaining : Math.max(0, wo.endAt - Date.now());
  wo.elapsed += p.dur - msLeft / 1000;
  // Een afgeronde werkfase telt als gehaald; in de rust erna kun je het getal aanpassen.
  if (p.type === 'work' && wo.results[p.ex.id][p.round] === null) wo.results[p.ex.id][p.round] = exState(p.ex).target;
  setPaused(false);
  wo.idx++;
  enterPhase();
}
function setPaused(on) {
  if (on && !wo.paused) wo.remaining = Math.max(0, wo.endAt - Date.now());
  if (!on && wo.paused) wo.endAt = Date.now() + wo.remaining;
  wo.paused = on;
  $('#screen-workout').classList.toggle('is-paused', on);
  document.body.classList.toggle('figs-paused', on);
  $('#wo-pause').textContent = on ? 'Hervat' : 'Pauze';
}
$('#wo-log-val').addEventListener('input', (e) => {
  const p = wo.phases[wo.idx];
  if (p && p.type === 'rest') wo.results[p.ex.id][p.round] = Math.max(0, Number(e.target.value) || 0);
});
$('#wo-pause').addEventListener('click', () => { setPaused(!wo.paused); tick(); });
$('#wo-skip').addEventListener('click', advance);
$('#wo-stop').addEventListener('click', () => {
  const wasPaused = wo.paused;
  setPaused(true);
  const anyDone = Object.values(wo.results).some((sets) => sets.some((v) => v !== null));
  if (!confirm(anyDone ? 'Training stoppen? De sets die je al deed kun je nog opslaan.' : 'Training stoppen?')) { setPaused(wasPaused); return; }
  if (anyDone) { wo.elapsed += wo.phases[wo.idx].dur - wo.remaining / 1000; finishWorkout(); } else endWorkout('home');
});
function endWorkout(screen) {
  wo.active = false; clearInterval(wo.timer); keepAwake(false);
  document.body.classList.remove('figs-paused');
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  if (screen) show(screen);
}
// De timer loopt niet betrouwbaar op de achtergrond, dus pauzeer zodra het scherm weg is.
document.addEventListener('visibilitychange', () => {
  if (!wo.active) return;
  if (document.hidden) setPaused(true); else keepAwake(true);
});
window.addEventListener('beforeunload', (e) => { if (wo.active) e.preventDefault(); });

// ---------- Samenvatting en progressie ----------
function finishWorkout() {
  endWorkout();
  beep(1318, 300); buzz([100, 60, 100, 60, 200]);
  speak('Klaar. Goed gedaan.');
  $('#summary-list').innerHTML = wo.list.map((ex) => {
    const st = exState(ex); const u = currentUnit(ex); const L = currentLevel(ex);
    return `<div class="card"><h2>${ex.name}</h2><p class="muted small">Doel ${fmtUnit(st.target, u)}${sideText(L)} per set</p>
      ${wo.results[ex.id].map((v, i) => `<div class="sum-row"><label for="sum-${ex.id}-${i}">Set ${i + 1}</label>
        <div class="stepper mini"><button type="button" class="step" data-step="-1" aria-label="Minder">−</button>
        <input id="sum-${ex.id}-${i}" type="number" inputmode="numeric" data-ex="${ex.id}" data-inc="${u === 'sec' ? 5 : 1}" data-default="${st.target}" placeholder="–" value="${v === null ? '' : v}">
        <button type="button" class="step" data-step="1" aria-label="Meer">+</button></div></div>`).join('')}
    </div>`;
  }).join('');
  show('summary');
}
$('#sum-discard').addEventListener('click', () => { if (confirm('Deze training niet opslaan?')) show('home'); });
$('#sum-save').addEventListener('click', () => {
  const results = {}; const changes = [];
  for (const ex of wo.list) {
    const sets = $$(`#summary-list input[data-ex="${ex.id}"]`).map((i) => (i.value === '' ? null : Math.max(0, Number(i.value) || 0)));
    if (sets.every((v) => v === null)) continue;
    const st = exState(ex); const L = currentLevel(ex);
    const done = sets.every((v) => v !== null);
    const ok = done && sets.every((v) => v >= st.target);
    results[ex.id] = { level: st.level, name: L.name, target: st.target, unit: currentUnit(ex), perSide: !!L.perSide, sets, done, ok };
    changes.push(done ? applyProgression(ex, ok) : { ex, kind: 'skip', text: 'Niet alle sets gedaan. Telt niet mee voor je doel.' });
    results[ex.id].idx = ladderIndex(ex, exState(ex).level, exState(ex).target);
  }
  if (!changes.length) { alert('Er is nog geen enkele set ingevuld.'); return; }
  state.sessions.push({ date: iso(), ts: Date.now(), dur: Math.round(wo.elapsed), rounds: state.settings.rounds, results });
  const fresh = awardBadges();
  save();
  renderResult(changes, fresh);
});

function applyProgression(ex, ok) {
  const st = exState(ex); const L = currentLevel(ex); const step = stepOf(ex, st.level); const u = currentUnit(ex);
  const before = fmtUnit(st.target, u);
  if (ok) {
    st.succ += 1; st.fail = 0;
    if (st.succ < 3) return { ex, kind: 'ok', text: `Gehaald, ${st.succ} van 3 op rij.` };
    st.succ = 0;
    if (st.target + step <= L.top) {
      st.target += step;
      return { ex, kind: 'up', text: `Doel omhoog van ${before} naar ${fmtUnit(st.target, u)}.` };
    }
    if (st.level < ex.levels.length - 1) {
      st.level += 1; st.target = ex.levels[st.level].start; state.levelUps += 1;
      return { ex, kind: 'level', text: `Naar trap ${st.level + 1}: ${ex.levels[st.level].name}. Nieuw doel ${fmtUnit(st.target, currentUnit(ex))}.` };
    }
    return { ex, kind: 'max', text: 'Hoogste trap op het hoogste doel. Respect.' };
  }
  st.fail += 1; st.succ = 0;
  if (st.fail < 2) return { ex, kind: 'miss', text: 'Niet gehaald. Volgende keer hetzelfde doel.' };
  st.fail = 0;
  if (st.target - step < L.start) return { ex, kind: 'miss', text: `Twee keer niet gehaald. Je zit al op het laagste doel van deze trap; kies eventueel een trap lager bij de oefening.` };
  st.target -= step;
  return { ex, kind: 'down', text: `Twee keer niet gehaald, doel terug van ${before} naar ${fmtUnit(st.target, u)}.` };
}

function renderResult(changes, fresh) {
  const ups = changes.filter((c) => c.kind === 'level' || c.kind === 'up').length;
  const c = stats();
  $('#res-title').textContent = ups ? `${ups} ${ups === 1 ? 'doel' : 'doelen'} omhoog` : 'Goed bezig';
  $('#res-sub').textContent = `Training ${c.n} staat erin. Deze week ${c.weekCount} van ${c.goal}.`;
  $('#result-badges').innerHTML = fresh.map((b) => `<div class="new-badge"><span class="ico">${b.ico}</span>
    <div><b>Nieuwe badge: ${b.name}</b><span class="muted small">${b.desc}</span></div></div>`).join('');
  const sign = { level: '↑', up: '↑', ok: '✓', max: '★', down: '↓', miss: '·', skip: '·' };
  $('#result-list').innerHTML = changes.map((ch) => `<div class="card res ${['level', 'up', 'max'].includes(ch.kind) ? 'up' : ch.kind === 'down' ? 'down' : ''}">
    <span class="dot">${sign[ch.kind]}</span><div><p class="date">${ch.ex.name}</p><p class="muted small">${ch.text}</p></div></div>`).join('');
  show('result');
  if (ups || fresh.length) confetti();
}
$('#res-done').addEventListener('click', () => show('home'));

// ---------- Confetti ----------
function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cv = $('#confetti'); const ctx = cv.getContext('2d');
  const w = (cv.width = innerWidth), h = (cv.height = innerHeight);
  const colors = ['#C6F432', '#5EC8FF', '#FFC857', '#FF7A6B', '#F2F4F7'];
  const bits = Array.from({ length: 110 }, () => ({
    x: w / 2, y: h * 0.35, vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 15 - 3,
    s: 5 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: colors[(Math.random() * colors.length) | 0],
  }));
  const start = performance.now();
  (function frame(now) {
    const t = now - start;
    ctx.clearRect(0, 0, w, h);
    if (t > 2600) return;
    ctx.globalAlpha = Math.min(1, (2600 - t) / 600);
    for (const b of bits) {
      b.vy += 0.35; b.vx *= 0.99; b.x += b.vx; b.y += b.vy; b.r += b.vr;
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.r); ctx.fillStyle = b.c;
      ctx.fillRect(-b.s / 2, -b.s / 4, b.s, b.s / 2); ctx.restore();
    }
    requestAnimationFrame(frame);
  })(start);
}

// ---------- Start ----------
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
applyTheme();
if (state.onboarded) show('home'); else startWelcome();
