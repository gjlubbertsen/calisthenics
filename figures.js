/* Geanimeerde oefenfiguren.
   Elke figuur heeft twee houdingen (a en b); de app beweegt daartussen heen en weer.
   Een houding geeft alleen heup, schouder, handen en voeten; ellebogen en knieën
   worden berekend. Tekenvlak: 120 breed, 104 hoog, vloer op y = 92. */

const FIG_FLOOR = 92;
const FIG_LEN = { arm: 13, leg: 19, head: 6.2, neck: 10 };

// props: ['floor'] ['bar',x,y] ['box',x,y,w,h] ['wall',x] ['rail',x1,x2,y] ['rings',x,y] ['post',x,y1] ['pad',x,y]
const FIGS = {
  // ----- Squat -----
  squat_box: {
    props: [['floor'], ['box', 26, 70, 22, 22]],
    a: { hip: [57, 54], sh: [57, 27], h: [61, 52], f: [57, 92] },
    b: { hip: [44, 66], sh: [52, 41], h: [74, 46], f: [57, 92] },
  },
  squat: {
    props: [['floor']],
    a: { hip: [55, 54], sh: [55, 27], h: [59, 52], f: [56, 92] },
    b: { hip: [45, 77], sh: [56, 53], h: [80, 55], f: [56, 92] },
  },
  split_squat: {
    props: [['floor']],
    a: { hip: [54, 59], sh: [54, 32], h: [59, 57], f: [72, 92], f2: [34, 92] },
    b: { hip: [54, 73], sh: [54, 46], h: [59, 71], f: [72, 92], f2: [34, 92] },
  },
  bulgarian: {
    props: [['floor'], ['box', 12, 70, 22, 22]],
    a: { hip: [52, 58], sh: [53, 31], h: [57, 56], f: [70, 92], f2: [30, 68] },
    b: { hip: [50, 71], sh: [53, 45], h: [56, 69], f: [70, 92], f2: [30, 68] },
  },
  pistol_assist: {
    props: [['floor'], ['post', 76, 24]],
    a: { hip: [52, 54], sh: [52, 27], h: [76, 40], f: [52, 92], f2: [64, 90] },
    b: { hip: [42, 78], sh: [53, 55], h: [76, 50], f: [52, 92], f2: [79, 80] },
  },
  pistol: {
    props: [['floor']],
    a: { hip: [52, 54], sh: [52, 27], h: [57, 52], f: [52, 92], f2: [64, 90] },
    b: { hip: [42, 78], sh: [54, 56], h: [79, 58], f: [52, 92], f2: [79, 79] },
  },

  // ----- Push-up -----
  pushup_wall: {
    props: [['floor'], ['wall', 98]],
    a: { hip: [60, 55], sh: [70, 30], h: [97, 33], f: [50, 92] },
    b: { hip: [65, 56], sh: [82, 33], h: [97, 36], f: [50, 92] },
  },
  pushup_bar: {
    props: [['floor'], ['bar', 88, 62]],
    a: { hip: [54, 63], sh: [72, 42], h: [88, 62], f: [30, 92] },
    b: { hip: [60, 69], sh: [81, 52], h: [88, 62], f: [30, 92] },
  },
  pushup_chair: {
    props: [['floor'], ['box', 72, 70, 24, 22]],
    a: { hip: [55, 65], sh: [74, 46], h: [80, 70], f: [28, 92] },
    b: { hip: [62, 75], sh: [86, 62.5], h: [80, 70], f: [28, 92] },
  },
  pushup: {
    props: [['floor']],
    a: { hip: [54, 76], sh: [80, 66], h: [80, 92], f: [18, 90] },
    b: { hip: [55, 85], sh: [80, 84], h: [80, 92], f: [18, 90] },
  },
  pushup_planche: {
    props: [['floor']],
    a: { hip: [45, 74], sh: [72, 67], h: [64, 92], f: [10, 89] },
    b: { hip: [47, 85], sh: [74, 84], h: [64, 92], f: [10, 90] },
  },

  // ----- Trekken -----
  row_high: {
    props: [['floor'], ['bar', 60, 30]],
    a: { hip: [46, 58], sh: [35, 33], h: [60, 30], f: [62, 92], eb: -1 },
    b: { hip: [55, 55], sh: [50, 28], h: [60, 30], f: [62, 92], eb: -1 },
  },
  row_bent: {
    props: [['floor'], ['bar', 70, 48]],
    a: { hip: [43, 79], sh: [68, 73], h: [70, 48], f: [20, 92], kb: 1 },
    b: { hip: [41, 68], sh: [63, 57], h: [70, 48], f: [20, 92], kb: 1 },
  },
  row: {
    props: [['floor'], ['bar', 70, 48]],
    a: { hip: [43, 80], sh: [68, 73], h: [70, 48], f: [6, 90] },
    b: { hip: [39, 71], sh: [62, 57.5], h: [70, 48], f: [6, 90] },
  },
  row_feet_up: {
    props: [['floor'], ['box', 0, 72, 18, 20], ['bar', 72, 44]],
    a: { hip: [46, 73], sh: [72, 70], h: [72, 44], f: [10, 70] },
    b: { hip: [45, 62], sh: [68, 54], h: [72, 44], f: [10, 70] },
  },
  pullup: {
    props: [['bar', 60, 12]],
    a: { hip: [60, 65], sh: [60, 38], h: [60, 12], f: [50, 96], kb: 1 },
    b: { hip: [52, 48], sh: [50, 21], h: [60, 12], f: [43, 79], kb: 1 },
  },

  // ----- Dip -----
  dip_bench: {
    props: [['floor'], ['box', 28, 66, 22, 26]],
    a: { hip: [54, 64], sh: [46, 40], h: [46, 66], f: [80, 92] },
    b: { hip: [55, 78], sh: [47, 54], h: [46, 66], f: [80, 92] },
  },
  dip_bench_up: {
    props: [['floor'], ['box', 28, 66, 22, 26], ['box', 80, 70, 22, 22]],
    a: { hip: [54, 64], sh: [46, 40], h: [46, 66], f: [88, 68] },
    b: { hip: [55, 80], sh: [47, 55], h: [46, 66], f: [88, 68] },
  },
  dip_half: {
    props: [['floor'], ['rail', 42, 80, 58]],
    a: { hip: [60, 59], sh: [60, 32], h: [60, 58], f: [50, 87], kb: 1 },
    b: { hip: [59, 68], sh: [62, 42], h: [60, 58], f: [47, 89], kb: 1 },
  },
  dip: {
    props: [['floor'], ['rail', 42, 80, 58]],
    a: { hip: [60, 59], sh: [60, 32], h: [60, 58], f: [50, 87], kb: 1 },
    b: { hip: [57, 76], sh: [65, 51], h: [60, 58], f: [41, 88], kb: 1 },
  },
  dip_rings: {
    props: [['floor'], ['rings', 60, 58]],
    a: { hip: [60, 59], sh: [60, 32], h: [60, 58], f: [50, 87], kb: 1 },
    b: { hip: [57, 76], sh: [65, 51], h: [60, 58], f: [41, 88], kb: 1 },
  },

  // ----- Glute bridge en nordic -----
  bridge: {
    props: [['floor']],
    a: { hip: [56, 86], sh: [30, 87], h: [54, 90], f: [84, 92] },
    b: { hip: [54, 71], sh: [30, 87], h: [54, 90], f: [84, 92] },
  },
  bridge_feet_up: {
    props: [['floor'], ['box', 78, 70, 24, 22]],
    a: { hip: [58, 85], sh: [32, 87], h: [56, 90], f: [86, 68] },
    b: { hip: [57, 68], sh: [32, 87], h: [56, 90], f: [86, 68] },
  },
  bridge_single: {
    props: [['floor']],
    a: { hip: [56, 86], sh: [30, 87], h: [54, 90], f: [84, 92], f2: [88, 64] },
    b: { hip: [54, 71], sh: [30, 87], h: [54, 90], f: [84, 92], f2: [86, 50] },
  },
  nordic: {
    props: [['floor'], ['pad', 30, 84]],
    a: { hip: [50, 71], sh: [50, 44], h: [60, 56], f: [31, 90], kb: -1 },
    b: { hip: [64.5, 78], sh: [85, 60.5], h: [96, 80], f: [31, 90], kb: -1 },
  },

  // ----- Core -----
  plank_knee: {
    hold: true,
    props: [['floor']],
    a: { hip: [54, 78], sh: [78, 72], h: [90, 90], f: [26, 80], eb: -1, kb: -1 },
    b: { hip: [54, 77], sh: [78, 71.5], h: [90, 90], f: [26, 80], eb: -1, kb: -1 },
  },
  plank: {
    hold: true,
    props: [['floor']],
    a: { hip: [50, 78], sh: [76, 72], h: [88, 90], f: [14, 90], eb: -1 },
    b: { hip: [50, 77], sh: [76, 71.5], h: [88, 90], f: [14, 90], eb: -1 },
  },
  hollow_tuck: {
    hold: true,
    props: [['floor']],
    a: { hip: [56, 88], sh: [32, 81], h: [56, 78], f: [80, 72] },
    b: { hip: [56, 88], sh: [32, 80], h: [57, 77], f: [80, 71] },
  },
  hollow: {
    hold: true,
    props: [['floor']],
    a: { hip: [58, 88], sh: [33, 82], h: [9, 73], f: [95, 77] },
    b: { hip: [58, 88], sh: [33, 81], h: [9, 71], f: [95, 75] },
  },
  lsit_tuck: {
    hold: true,
    props: [['floor'], ['rail', 46, 68, 71]],
    a: { hip: [53, 70], sh: [56, 45], h: [57, 71], f: [74, 82] },
    b: { hip: [53, 69], sh: [56, 44], h: [57, 71], f: [74, 80] },
  },
  lsit: {
    hold: true,
    props: [['floor'], ['rail', 46, 68, 71]],
    a: { hip: [53, 70], sh: [56, 45], h: [57, 71], f: [91, 70] },
    b: { hip: [53, 69], sh: [56, 44], h: [57, 71], f: [91, 68] },
  },

  // ----- Hangen -----
  hang: {
    hold: true,
    props: [['bar', 60, 9]],
    a: { hip: [59, 62], sh: [60, 35], h: [60, 9], f: [57, 100] },
    b: { hip: [61, 62], sh: [60, 35], h: [60, 9], f: [63, 100] },
  },
  hang_active: {
    props: [['bar', 60, 9]],
    a: { hip: [60, 62], sh: [60, 35], h: [60, 9], f: [60, 100] },
    b: { hip: [60, 56], sh: [60, 29], h: [60, 9], f: [60, 94] },
  },
  knee_raise: {
    props: [['bar', 60, 9]],
    a: { hip: [60, 62], sh: [60, 35], h: [60, 9], f: [61, 100] },
    b: { hip: [59, 62], sh: [60, 35], h: [60, 9], f: [76, 74] },
  },
  leg_raise: {
    props: [['bar', 60, 9]],
    a: { hip: [60, 62], sh: [60, 35], h: [60, 9], f: [60, 100] },
    b: { hip: [58, 62], sh: [60, 35], h: [60, 9], f: [96, 61] },
  },
  toes_to_bar: {
    props: [['bar', 60, 9]],
    a: { hip: [60, 62], sh: [60, 35], h: [60, 9], f: [60, 100] },
    b: { hip: [45, 49], sh: [57, 34], h: [60, 9], f: [61, 13] },
  },
};

// ---------- Rekenwerk ----------
function figLerp(p, q, t) { return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]; }

// Tweedelige ledemaat: geeft het gewricht tussen wortel en eindpunt.
function figJoint(root, end, len, bend) {
  const dx = end[0] - root[0], dy = end[1] - root[1];
  const d = Math.max(0.001, Math.hypot(dx, dy));
  const ux = dx / d, uy = dy / d;
  const half = Math.min(d, len * 2) / 2;
  const h = Math.sqrt(Math.max(0, len * len - half * half));
  return [root[0] + ux * half - uy * h * bend, root[1] + uy * half + ux * h * bend];
}

function figPose(fig, t) {
  const a = fig.a, b = fig.b;
  const pick = (k, fallback) => figLerp(a[k] || a[fallback], b[k] || b[fallback], t);
  return {
    hip: pick('hip'), sh: pick('sh'),
    h1: pick('h'), h2: pick('h2', 'h'),
    f1: pick('f'), f2: pick('f2', 'f'),
    eb: a.eb ?? 1, kb: a.kb ?? -1, twoArms: !!a.h2, twoLegs: !!a.f2,
  };
}

const figN = (v) => Math.round(v * 10) / 10;
const figPath = (pts, cls) => `<path class="${cls}" d="M${pts.map((p) => `${figN(p[0])} ${figN(p[1])}`).join('L')}"/>`;

function figBody(key, t) {
  const fig = FIGS[key];
  if (!fig) return '';
  const p = figPose(fig, t);
  const tx = p.sh[0] - p.hip[0], ty = p.sh[1] - p.hip[1];
  const tl = Math.hypot(tx, ty) || 1;
  const head = [p.sh[0] + (tx / tl) * FIG_LEN.neck, p.sh[1] + (ty / tl) * FIG_LEN.neck];
  // De verre arm en het verre been staan een fractie anders, zodat je ze ziet.
  const off = (pt, d) => [pt[0] + d, pt[1]];
  const farArm = p.twoArms ? p.h2 : off(p.h1, 0);
  const farLeg = p.twoLegs ? p.f2 : off(p.f1, 0);
  const out = [];
  out.push(figPath([p.hip, figJoint(p.hip, farLeg, FIG_LEN.leg, p.kb), farLeg], 'fig-far'));
  out.push(figPath([p.sh, figJoint(p.sh, farArm, FIG_LEN.arm, p.eb), farArm], 'fig-far'));
  out.push(figPath([p.hip, p.sh], 'fig-torso'));
  out.push(`<circle class="fig-head" cx="${figN(head[0])}" cy="${figN(head[1])}" r="${FIG_LEN.head}"/>`);
  out.push(figPath([p.hip, figJoint(p.hip, p.f1, FIG_LEN.leg, p.kb), p.f1], 'fig-limb'));
  out.push(figPath([p.sh, figJoint(p.sh, p.h1, FIG_LEN.arm, p.eb), p.h1], 'fig-limb'));
  return out.join('');
}

function figProps(key) {
  const fig = FIGS[key];
  if (!fig) return '';
  return fig.props.map((pr) => {
    const [kind, x, y, w, h] = pr;
    if (kind === 'floor') return `<path class="fig-floor" d="M4 ${FIG_FLOOR + 3}H116"/>`;
    if (kind === 'bar') return `<path class="fig-stand" d="M${x} ${y}V${FIG_FLOOR + 3}"/><circle class="fig-bar" cx="${x}" cy="${y}" r="3.2"/>`;
    if (kind === 'box') return `<rect class="fig-box" x="${x}" y="${y + 2.5}" width="${w}" height="${h - 2.5 + 3}" rx="3"/>`;
    if (kind === 'wall') return `<path class="fig-wall" d="M${x + 3} 6V${FIG_FLOOR + 3}"/>`;
    if (kind === 'post') return `<path class="fig-wall" d="M${x} ${y}V${FIG_FLOOR + 3}"/>`;
    if (kind === 'rail') return `<path class="fig-stand" d="M${x + 4} ${w + 3}V${FIG_FLOOR + 3}M${y - 4} ${w + 3}V${FIG_FLOOR + 3}"/><path class="fig-rail" d="M${x} ${w + 3}H${y}"/>`;
    if (kind === 'rings') return `<path class="fig-stand" d="M${x} 2V${y - 4}"/><circle class="fig-ring" cx="${x}" cy="${y + 1}" r="5"/>`;
    if (kind === 'pad') return `<rect class="fig-box" x="${x - 6}" y="${y - 3}" width="12" height="6" rx="3"/>`;
    return '';
  }).join('');
}

// Geeft een compleet svg-element als tekst. anim = true laat de figuur bewegen.
function figSVG(key, opts = {}) {
  if (!FIGS[key]) return '';
  const t = opts.t ?? (FIGS[key].hold ? 0 : 0.85);
  return `<svg class="fig${opts.anim ? ' anim' : ''}${opts.cls ? ' ' + opts.cls : ''}" viewBox="0 0 120 104" data-fig="${key}" role="img" aria-label="${opts.label || 'Voorbeeld van de oefening'}">${figProps(key)}<g class="fig-body">${figBody(key, t)}</g></svg>`;
}

// Eén lus beweegt alle zichtbare figuren met class "anim".
(function figLoop() {
  if (typeof window === 'undefined' || typeof requestAnimationFrame === 'undefined') return;
  const still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still) return;
  let last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden || now - last < 33) return;
    last = now;
    const paused = document.body.classList.contains('figs-paused');
    if (paused) return;
    document.querySelectorAll('svg.fig.anim').forEach((svg) => {
      if (!svg.getClientRects().length) return;
      const fig = FIGS[svg.dataset.fig];
      if (!fig) return;
      const period = fig.hold ? 3400 : 2600;
      const t = 0.5 - 0.5 * Math.cos((2 * Math.PI * (now % period)) / period);
      svg.querySelector('.fig-body').innerHTML = figBody(svg.dataset.fig, t);
    });
  }
  requestAnimationFrame(frame);
})();

if (typeof module !== 'undefined') module.exports = { FIGS, figSVG };
