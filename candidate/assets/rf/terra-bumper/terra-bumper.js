/*! Terra Games studio bumper — v3 (designer's wordmark + the Terra wireframe sphere)
 *  Design space: 852 x 1846 (the designer's file), cover-scaled to the viewport.
 */
const DESIGN = { W: 852, H: 1846 };
const BAND = { y: 874, h: 90 };                     // wordmark layer band (design px)
const A = (f) => new URL("./assets/" + f, import.meta.url).href;   // assets live next to this module
const TILES = [{name:"T",x:24,w:96,src:A("tile_00_T.png")},{name:"E",x:108,w:72,src:A("tile_01_E.png")},{name:"R",x:168,w:76,src:A("tile_02_R.png")},{name:"R2",x:232,w:74,src:A("tile_03_R2.png")},{name:"A",x:294,w:92,src:A("tile_04_A.png")},{name:"G",x:374,w:90,src:A("tile_05_G.png")},{name:"A2",x:452,w:83,src:A("tile_06_A2.png")},{name:"M",x:523,w:101,src:A("tile_07_M.png")},{name:"E2",x:612,w:71,src:A("tile_08_E2.png")},{name:"S",x:671,w:76,src:A("tile_09_S.png")}];                            // 10 letter tiles: {name,x,w,src}
const LOCKUP_CY = 916.5;                            // wordmark ink centre line (design px)
// The sphere: full great circles, exact Bezier projection. Same construction as terra-bumper v12.
const SPH = { cx: 780, cy: 918, box: 64.3, R: 46, KB: 0.5522847498, SW: 3.8, RW: 5.4, DLT: 18, AXIS: -16, LAND: 42, CLIP: 43.5,
              MERS: [0, 48, 96], PARS: [30, 0, -30], LINE: "#F4F5E9", RING: "#F4F5E9", SHADOW: {"dx": 1.3, "dy": 6.5, "color": "#0225C8"} };
const FIELD_SRC = A("field_852x1846.png");
const NOISE_SRC = "data:image/png;base64,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";
const FALLBACK_FIELD = "radial-gradient(ellipse 103.2% 57.16% at 50% 50%,#0044FC 0%,#0044FB 12%,#0042FB 20%,#003CF9 30%,#0035F6 40%,#002FF2 50%,#0029EB 60%,#0023E0 70%,#001FD4 80%,#001CCC 90%,#001CC8 100%)";
export const BUMPER_DURATION = 2.6;
const CSS = `
.terra-bumper{position:fixed;inset:0;overflow:hidden;z-index:2147483000;background:${FALLBACK_FIELD};transition:opacity .25s ease-out}
.terra-bumper img{position:absolute;display:block;pointer-events:none;user-select:none;-webkit-user-drag:none}
.terra-bumper .tb-tile{will-change:transform,opacity}
.terra-bumper svg{position:absolute;overflow:visible;will-change:transform,opacity;transform-origin:50% 50%}
.terra-bumper .tb-noise{position:absolute;inset:0;background:url(${NOISE_SRC}) repeat;mix-blend-mode:overlay;pointer-events:none}`;
const mkBez = (x1, y1, x2, y2) => {
  const A = (a1, a2) => 1 - 3 * a2 + 3 * a1, B = (a1, a2) => 3 * a2 - 6 * a1, C = (a1) => 3 * a1;
  const calc = (t, a1, a2) => ((A(a1, a2) * t + B(a1, a2)) * t + C(a1)) * t;
  const slope = (t, a1, a2) => 3 * A(a1, a2) * t * t + 2 * B(a1, a2) * t + C(a1);
  return (x) => { if (x <= 0) return 0; if (x >= 1) return 1; let t = x; for (let i = 0; i < 8; i++) { const s = slope(t, x1, x2); if (s < 1e-6) break; t -= (calc(t, x1, x2) - x) / s; } return calc(t, y1, y2); };
};
const OUT = mkBez(.16, .84, .24, 1), EASE = mkBez(.2, .8, .2, 1);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const PR = Math.PI / 180, NS = "http://www.w3.org/2000/svg";
let UID = 0;
// ---- sphere maths (viewBox 0..100, centre 50,50)
const rx3 = (p, t) => { const c = Math.cos(t * PR), z = Math.sin(t * PR); return [p[0], p[1] * c - p[2] * z, p[1] * z + p[2] * c]; };
const n2 = (x) => Math.round(x * 100) / 100;
/* Hidden-line removal: a wireframe sphere only shows the FRONT of each circle.
   Orthographic view down +z, so a point is visible when its rotated z > 0.
   For P(a) = c + r(cos a·U + sin a·V), z(a) = c_z + M·cos(a - psi) — solvable in closed form.
   The visible arc is then emitted exactly: cubic segments with k = (4/3)tan(d/4), which stays
   exact for the projected ellipse because projection is affine. */
function arcVisible(c, u, v, r) {
  const C = rx3(c, SPH.DLT), U = rx3(u, SPH.DLT), V = rx3(v, SPH.DLT);
  const pt = (a) => { const ca = Math.cos(a), sa = Math.sin(a); return [C[0] + r * (ca * U[0] + sa * V[0]), C[1] + r * (ca * U[1] + sa * V[1])]; };
  const tg = (a) => { const ca = Math.cos(a), sa = Math.sin(a); return [r * (-sa * U[0] + ca * V[0]), r * (-sa * U[1] + ca * V[1])]; };
  const P = (p) => [50 + p[0], 50 - p[1]], D = (d) => [d[0], -d[1]];
  const M = r * Math.hypot(U[2], V[2]);
  let a0, a1;
  if (M < 1e-9) { if (C[2] <= 0) return ""; a0 = 0; a1 = 2 * Math.PI; }
  else {
    const ratio = -C[2] / M;
    if (ratio >= 1) return "";                       // wholly behind
    if (ratio <= -1) { a0 = 0; a1 = 2 * Math.PI; }   // wholly in front
    else { const psi = Math.atan2(V[2], U[2]), al = Math.acos(ratio); a0 = psi - al; a1 = psi + al; }
  }
  const n = Math.max(1, Math.ceil((a1 - a0) / (Math.PI / 2))), step = (a1 - a0) / n, k = 4 / 3 * Math.tan(step / 4);
  let p0 = P(pt(a0)), d = `M${n2(p0[0])} ${n2(p0[1])}`;
  for (let i = 0; i < n; i++) {
    const s0 = a0 + i * step, s1 = s0 + step;
    const A = P(pt(s0)), B = P(pt(s1)), TA = D(tg(s0)), TB = D(tg(s1));
    d += ` C${n2(A[0] + k * TA[0])} ${n2(A[1] + k * TA[1])},${n2(B[0] - k * TB[0])} ${n2(B[1] - k * TB[1])},${n2(B[0])} ${n2(B[1])}`;
  }
  return d;
}
const meridian = (lam) => { const L = lam * PR; return arcVisible([0, 0, 0], [Math.cos(L), 0, -Math.sin(L)], [0, 1, 0], SPH.R); };
const parallel = (phi) => { const p = phi * PR; return arcVisible([0, SPH.R * Math.sin(p), 0], [1, 0, 0], [0, 0, 1], SPH.R * Math.cos(p)); };
function buildSphere() {
  const svg = document.createElementNS(NS, "svg"); svg.setAttribute("viewBox", "0 0 100 100"); svg.setAttribute("aria-hidden", "true");
  const mk = (tag) => document.createElementNS(NS, tag);
  if (SPH.SHADOW) {
    /* Hard shadow, same offset family as the letters. The ring is a STROKE, so a plain offset copy
       would also show INSIDE the sphere as a stray sliver — mask it to outside the silhouette so it
       reads as a cast shadow and nothing crosses the wireframe. */
    const id = "tbsh" + (++UID);
    const defs = mk("defs"), m = mk("mask"); m.setAttribute("id", id);
    const r0 = mk("rect"); r0.setAttribute("x", -30); r0.setAttribute("y", -30); r0.setAttribute("width", 160); r0.setAttribute("height", 160); r0.setAttribute("fill", "#fff");
    const hole = mk("circle"); hole.setAttribute("cx", 50); hole.setAttribute("cy", 50); hole.setAttribute("r", SPH.R + SPH.RW / 2); hole.setAttribute("fill", "#000");
    m.append(r0, hole); defs.appendChild(m); svg.appendChild(defs);
    const sh = mk("circle"); sh.setAttribute("cx", 50 + SPH.SHADOW.dx); sh.setAttribute("cy", 50 + SPH.SHADOW.dy); sh.setAttribute("r", SPH.R);
    sh.setAttribute("fill", "none"); sh.setAttribute("stroke", SPH.SHADOW.color); sh.setAttribute("stroke-width", SPH.RW); sh.setAttribute("mask", `url(#${id})`);
    svg.appendChild(sh);
  }
  const g = mk("g"); g.setAttribute("transform", `rotate(${SPH.AXIS} 50 50)`);
  if (SPH.CLIP) {   /* stop the wireframe short of the ring so nothing fuses with the limb */
    const cid = "tbclip" + (++UID), defs2 = mk("defs"), cp = mk("clipPath"); cp.setAttribute("id", cid);
    const cc = mk("circle"); cc.setAttribute("cx", 50); cc.setAttribute("cy", 50); cc.setAttribute("r", SPH.CLIP);
    cp.appendChild(cc); defs2.appendChild(cp); svg.appendChild(defs2); g.setAttribute("clip-path", `url(#${cid})`);
  }
  const mers = SPH.MERS.map(() => { const p = mk("path"); p.setAttribute("fill", "none"); p.setAttribute("stroke", SPH.LINE); p.setAttribute("stroke-width", SPH.SW); g.appendChild(p); return p; });
  SPH.PARS.forEach(q => { const p = mk("path"); p.setAttribute("d", parallel(q)); p.setAttribute("fill", "none"); p.setAttribute("stroke", SPH.LINE); p.setAttribute("stroke-width", SPH.SW); g.appendChild(p); });
  svg.appendChild(g);
  const ring = mk("circle"); ring.setAttribute("cx", 50); ring.setAttribute("cy", 50); ring.setAttribute("r", SPH.R); ring.setAttribute("fill", "none"); ring.setAttribute("stroke", SPH.RING); ring.setAttribute("stroke-width", SPH.RW); svg.appendChild(ring);
  return { svg, setAngle(a) { mers.forEach((p, i) => p.setAttribute("d", meridian(SPH.MERS[i] + a))); } };
}
export function __setLand(v){ SPH.LAND = v; }
export function __tune(o){ Object.assign(SPH, o); }
function injectCSS() { if (document.getElementById("terra-bumper-css")) return; const s = document.createElement("style"); s.id = "terra-bumper-css"; s.textContent = CSS; document.head.appendChild(s); }

/** lockupY: vertical position of the lockup centre as a fraction of the screen (default = the approved static, 0.4965). */
export function mountTerraBumper(container = document.body, { lockupY = null } = {}) {
  injectCSS();
  const root = document.createElement("div"); root.className = "terra-bumper";
  const field = new Image(); field.src = FIELD_SRC; root.appendChild(field);
  const tiles = TILES.map(t => { const im = new Image(); im.src = t.src; im.className = "tb-tile"; im.style.opacity = "0"; root.appendChild(im); return { ...t, el: im }; });
  const sphere = buildSphere(); sphere.svg.style.opacity = "0"; root.appendChild(sphere.svg);
  const noise = document.createElement("div"); noise.className = "tb-noise"; root.appendChild(noise);
  container.appendChild(root);
  const L = {};
  function layout() {
    const W = root.clientWidth, H = root.clientHeight, s = Math.max(W / DESIGN.W, H / DESIGN.H);
    const ox = (W - DESIGN.W * s) / 2, oy = (H - DESIGN.H * s) / 2;
    const dy = lockupY == null ? 0 : (lockupY * DESIGN.H - LOCKUP_CY);          // design-px shift of the whole lockup
    Object.assign(field.style, { left: ox + "px", top: oy + "px", width: DESIGN.W * s + "px", height: DESIGN.H * s + "px" });
    for (const t of tiles) Object.assign(t.el.style, { left: ox + t.x * s + "px", top: oy + (BAND.y + dy) * s + "px", width: t.w * s + "px", height: BAND.h * s + "px" });
    const D = SPH.box * s;
    Object.assign(sphere.svg.style, { width: D + "px", height: D + "px", left: ox + SPH.cx * s - D / 2 + "px", top: oy + (SPH.cy + dy) * s - D / 2 + "px" });
    Object.assign(L, { s, rise: 19 * s });
  }
  function render(t) {
    for (let i = 0; i < tiles.length; i++) { const e = OUT(clamp((t - (0.18 + 0.055 * i)) / 0.34, 0, 1)); tiles[i].el.style.opacity = e; tiles[i].el.style.transform = `translateY(${(1 - e) * L.rise}px)`; }
    // planet: the site's spark (scale 0→1, .26 s) at 1.00, and one full turn decelerating over .90 s
    const pu = clamp((t - 1.00) / 0.26, 0, 1); sphere.svg.style.opacity = pu > 0 ? 1 : 0; sphere.svg.style.transform = `scale(${EASE(pu)})`;
    const su = clamp((t - 1.00) / 0.90, 0, 1); sphere.setAngle(SPH.LAND - 360 * (1 - OUT(su)));
  }
  const onResize = () => layout();
  window.addEventListener("resize", onResize);
  layout(); render(0);
  const ready = Promise.all([field, ...tiles.map(t => t.el)].map(im => im.decode().catch(() => {})));
  let raf = 0, destroyed = false;
  return {
    el: root, ready,
    seek(t) { layout(); render(t); },
    play({ hold = 0 } = {}) {
      return ready.then(() => new Promise(resolve => {
        layout(); const t0 = performance.now(), end = BUMPER_DURATION + hold;
        const loop = () => { if (destroyed) return resolve(); const t = (performance.now() - t0) / 1000; render(Math.min(t, BUMPER_DURATION)); if (t < end) raf = requestAnimationFrame(loop); else resolve(); };
        raf = requestAnimationFrame(loop);
      }));
    },
    destroy() { destroyed = true; cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); root.remove(); }
  };
}
export async function playTerraBumper({ container = document.body, hold = 0, fadeOut = true, onStart, lockupY = null } = {}) {
  const b = mountTerraBumper(container, { lockupY });
  await b.ready;
  if (onStart) requestAnimationFrame(() => onStart(b));
  await b.play({ hold });
  if (fadeOut) { b.el.style.opacity = "0"; await new Promise(r => setTimeout(r, 260)); }
  b.destroy();
}
export default playTerraBumper;
