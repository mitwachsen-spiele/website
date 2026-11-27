// Rebuilds the sign of the wallpaper with new text.
// usage: node render.cjs <old|new> <out.png> [bgonly]
// Works in the sign's own frame (u along the planks, v across), see geom.cjs.
const { chromium } = require('playwright');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const g = require('./geom.cjs');
const L = require('./layout.cjs');

const ORIG = path.join(__dirname, 'orig.png');
const CX = 2900, CY = 1700, CW = 930, CH = 400;
const mode = process.argv[2] || 'new';
const out = process.argv[3] || path.join(__dirname, 'weltenbummler.png');
const bgOnly = process.argv[4] === 'bgonly';
const b64 = (f) => fs.readFileSync(path.join(__dirname, f)).toString('base64');

(async () => {
  const crop = await sharp(ORIG).extract({ left: CX, top: CY, width: CW, height: CH }).png().toBuffer();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(`<style>@font-face{font-family:PX;font-weight:700;src:url(data:font/woff2;base64,${b64('pixelify-sans-latin-700-normal.woff2')})}</style><div style="font-family:PX;font-weight:700">a</div>`);
  await page.evaluate(() => document.fonts.load('700 40px PX'));
  const res = await page.evaluate(async ({ img, G, CX, CY, W, H, lay, bgOnly }) => {
    const im = new Image(); im.src = 'data:image/png;base64,' + img; await im.decode();
    const c0 = new OffscreenCanvas(W, H); const x0 = c0.getContext('2d'); x0.drawImage(im, 0, 0);
    const O = x0.getImageData(0, 0, W, H).data;
    const toXY = (u, v) => ({ x: G.O.x + u * G.cos - v * G.sin - CX, y: G.O.y + u * G.sin + v * G.cos - CY });
    const toUV = (X, Y) => { const dx = X + CX - G.O.x, dy = Y + CY - G.O.y; return { u: dx * G.cos + dy * G.sin, v: -dx * G.sin + dy * G.cos }; };
    const bil = (x, y, ch) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
      const p = (a, b) => O[(b * W + a) * 4 + ch];
      return (p(xi, yi) * (1 - fx) + p(xi + 1, yi) * fx) * (1 - fy) + (p(xi, yi + 1) * (1 - fx) + p(xi + 1, yi + 1) * fx) * fy; };

    // 1) profile of the unlit wood across the planks, from the clean strip at the left end
    const V0 = -165, V1 = 95, ST = 0.25, NP = Math.round((V1 - V0) / ST) + 1;
    const P = [new Float32Array(NP), new Float32Array(NP), new Float32Array(NP)];
    for (let k = 0; k < NP; k++) { const v = V0 + k * ST;
      for (let c = 0; c < 3; c++) { let s = 0, n = 0; for (let u = 32; u <= 62; u += 1) { const q = toXY(u, v); s += bil(q.x, q.y, c); n++; } P[c][k] = s / n; } }
    // remove the three grain lines that cross the strip: bridge linearly
    for (const [a, b] of [[-100.5, -93], [-51.5, -44], [27.5, 35]]) {
      const ka = Math.round((a - V0) / ST), kb = Math.round((b - V0) / ST);
      for (let c = 0; c < 3; c++) for (let k = ka; k <= kb; k++) P[c][k] = P[c][ka] + (P[c][kb] - P[c][ka]) * (k - ka) / (kb - ka); }
    const prof = (v, c) => { let k = (v - V0) / ST; if (k < 0) k = 0; if (k > NP - 1.001) k = NP - 1.001; const i = Math.floor(k), f = k - i; return P[c][i] * (1 - f) + P[c][i + 1] * f; };

    // 2) lighting: the sign is shaded towards the right by a navy-ish veil, out = flat*(1-a) + D*a per channel
    const D = [20, 26, 44];
    const GU0 = -20, GU1 = 860, GV0 = -160, GV1 = 95, CS = 8;
    const NU = Math.ceil((GU1 - GU0) / CS), NV = Math.ceil((GV1 - GV0) / CS);
    const edges = [-72.3, 0, 67];
    const near = (v) => edges.some((e) => Math.abs(v - e) < (e === 0 ? 4.5 : 2.5));
    const pix = [];
    for (let Y = 0; Y < H; Y++) for (let X = 0; X < W; X++) { const { u, v } = toUV(X, Y);
      if (u < -8 || u > 846 || v < -150 || v > 90 || near(v)) continue;
      const i = (Y * W + X) * 4; const a = [0, 0, 0];
      for (let c = 0; c < 3; c++) { const b = prof(v, c); a[c] = (b - O[i + c]) / (b - D[c]); }
      pix.push([u, v, a[0], a[1], a[2]]); }
    const grid = [new Float32Array(NU * NV), new Float32Array(NU * NV), new Float32Array(NU * NV)];
    let known = new Uint8Array(NU * NV);
    const sample = (gr, u, v) => { let fu = (u - GU0) / CS - 0.5, fv = (v - GV0) / CS - 0.5;
      fu = Math.max(0, Math.min(NU - 1.001, fu)); fv = Math.max(0, Math.min(NV - 1.001, fv));
      const iu = Math.floor(fu), iv = Math.floor(fv), du = fu - iu, dv = fv - iv, q = (a, b) => gr[b * NU + a];
      return (q(iu, iv) * (1 - du) + q(iu + 1, iv) * du) * (1 - dv) + (q(iu, iv + 1) * (1 - du) + q(iu + 1, iv + 1) * du) * dv; };
    function fit(test) {
      const buck = new Map();
      for (const p of pix) { if (!test(p)) continue; const k = Math.floor((p[1] - GV0) / CS) * NU + Math.floor((p[0] - GU0) / CS);
        let b = buck.get(k); if (!b) buck.set(k, (b = [[], [], []])); for (let c = 0; c < 3; c++) b[c].push(p[2 + c]); }
      known = new Uint8Array(NU * NV);
      for (const [k, b] of buck) { if (b[0].length < 12) continue; known[k] = 1;
        for (let c = 0; c < 3; c++) { const a = b[c].sort((x, y) => x - y); grid[c][k] = a[a.length >> 1]; } }
      // harmonic fill of unknown cells
      for (let c = 0; c < 3; c++) { const gr = grid[c]; let m = 0, n = 0; for (let k = 0; k < NU * NV; k++) if (known[k]) { m += gr[k]; n++; }
        for (let k = 0; k < NU * NV; k++) if (!known[k]) gr[k] = m / n;
        for (let it = 0; it < 4000; it++) for (let iv = 0; iv < NV; iv++) for (let iu = 0; iu < NU; iu++) { const k = iv * NU + iu; if (known[k]) continue;
          let s = 0, w = 0; if (iu > 0) { s += gr[k - 1]; w++; } if (iu < NU - 1) { s += gr[k + 1]; w++; } if (iv > 0) { s += gr[k - NU]; w++; } if (iv < NV - 1) { s += gr[k + NU]; w++; }
          gr[k] = gr[k] + 1.7 * (s / w - gr[k]); } }
    }
    fit((p) => { const a = p.slice(2); const mn = Math.min(...a), mx = Math.max(...a); return mn > -0.05 && mx < 0.4 && mx - mn < 0.08; });
    fit((p) => [0, 1, 2].every((c) => Math.abs(p[2 + c] - sample(grid[c], p[0], p[1])) < 0.025));
    fit((p) => [0, 1, 2].every((c) => Math.abs(p[2 + c] - sample(grid[c], p[0], p[1])) < 0.02));
    const light = (u, v, c) => sample(grid[c], u, v);

    // 3) flat (unlit) drawing of the sign in its own frame
    const F = new OffscreenCanvas(W, H); const f = F.getContext('2d');
    const FD = f.createImageData(W, H);
    for (let Y = 0; Y < H; Y++) for (let X = 0; X < W; X++) { const { v } = toUV(X, Y); const i = (Y * W + X) * 4;
      for (let c = 0; c < 3; c++) FD.data[i + c] = Math.round(prof(v, c)); FD.data[i + 3] = 255; }
    f.putImageData(FD, 0, 0);
    const o = toXY(0, 0); f.setTransform(G.cos, G.sin, -G.sin, G.cos, o.x, o.y);
    const rgb = (a) => `rgb(${a.join(',')})`;
    // grain lines (drawn in their plank colour, flat ends)
    for (const gl of lay.grain) { const p = gl.pts; f.strokeStyle = rgb(gl.color); f.lineWidth = gl.t; f.lineCap = 'round'; f.lineJoin = 'round';
      f.beginPath(); f.moveTo(p[0][0], p[0][1]);
      for (let i = 1; i < p.length - 1; i++) f.quadraticCurveTo(p[i][0], p[i][1], (p[i][0] + p[i + 1][0]) / 2, (p[i][1] + p[i + 1][1]) / 2);
      f.lineTo(p[p.length - 1][0], p[p.length - 1][1]); f.stroke(); }
    // knots
    for (const k of lay.knots) { f.beginPath(); f.ellipse(k.u, k.v, k.rx, k.ry, 0, 0, Math.PI * 2);
      if (k.fill) { f.fillStyle = rgb(k.fill); f.fill(); } f.lineWidth = k.lw; f.strokeStyle = rgb(lay.navy); f.stroke(); }
    let subEnd = null;
    if (!bgOnly) {
      const T = lay.title, S = lay.sub;
      // title: shadow, outline, gradient fill
      f.font = `700 ${T.size}px PX`; f.letterSpacing = T.ls + 'px'; f.textBaseline = 'alphabetic'; f.lineJoin = 'round';
      // shadow in its own layer so overlapping strokes do not double the alpha
      const SH = new OffscreenCanvas(W, H); const s = SH.getContext('2d'); s.setTransform(G.cos, G.sin, -G.sin, G.cos, o.x, o.y);
      s.font = f.font; s.letterSpacing = f.letterSpacing; s.lineJoin = 'round'; s.lineWidth = T.stroke; s.strokeStyle = s.fillStyle = rgb(T.shC);
      s.strokeText(T.text, T.u + T.sh[0], T.v + T.sh[1]); s.fillText(T.text, T.u + T.sh[0], T.v + T.sh[1]);
      f.save(); f.setTransform(1, 0, 0, 1, 0, 0); f.globalAlpha = T.shA; f.drawImage(SH, 0, 0); f.restore();
      f.lineWidth = T.stroke; f.strokeStyle = rgb(lay.navy); f.strokeText(T.text, T.u, T.v);
      const gr = f.createLinearGradient(0, T.v - T.asc, 0, T.v);
      for (const [p, col] of T.grad) gr.addColorStop(p, rgb(col));
      f.fillStyle = gr; f.fillText(T.text, T.u, T.v);
      // subtitle: light edge below, dark letters
      const pieces = S.text.split(/(\.)/).filter(Boolean);
      const subText = (ctx, u, v) => { let x = u; for (const p of pieces) { if (p === '.') x += S.dotGap || 0; ctx.fillText(p, x, v); x += ctx.measureText(p).width; if (p === '.') x += S.dotGap || 0; } return x; };
      f.font = `700 ${S.size}px PX`; f.letterSpacing = S.ls + 'px';
      const HL = new OffscreenCanvas(W, H); const h = HL.getContext('2d'); h.setTransform(G.cos, G.sin, -G.sin, G.cos, o.x, o.y);
      h.font = f.font; h.letterSpacing = f.letterSpacing; h.fillStyle = rgb(S.hlC); subText(h, S.u + S.hl[0], S.v + S.hl[1]);
      f.save(); f.setTransform(1, 0, 0, 1, 0, 0); f.globalAlpha = S.hlA; f.drawImage(HL, 0, 0); f.restore();
      f.fillStyle = rgb(S.color); subEnd = subText(f, S.u, S.v);
    }
    f.setTransform(1, 0, 0, 1, 0, 0);
    const FL = f.getImageData(0, 0, W, H).data;

    // 4) light it and cut it to the replaced region (feathered); everything else stays the original
    const R = lay.region; const outD = new ImageData(W, H); let se = 0, sn = 0;
    const ramp = (d) => Math.max(0, Math.min(1, d / R.feather));
    const skip = (u, v) => lay.keep.some((k) => (u - k.u) ** 2 + (v - k.v) ** 2 < k.r * k.r);
    for (let Y = 0; Y < H; Y++) for (let X = 0; X < W; X++) { const { u, v } = toUV(X, Y); const i = (Y * W + X) * 4;
      let al = Math.min(ramp(u - R.u0), ramp(R.u1 - u), ramp(v - R.v0), ramp(R.v1 - v));
      if (skip(u, v)) al = 0;
      for (let c = 0; c < 3; c++) { const a = light(u, v, c); outD.data[i + c] = Math.round(FL[i + c] * (1 - a) + D[c] * a); }
      outD.data[i + 3] = Math.round(al * 255);
      if (al > 0 && bgOnly) { let e = 0; for (let c = 0; c < 3; c++) e = Math.max(e, Math.abs(outD.data[i + c] - O[i + c])); if (e < 12) { se += e; sn++; } } }
    const oc = new OffscreenCanvas(W, H); oc.getContext('2d').putImageData(outD, 0, 0);
    const blob = await oc.convertToBlob({ type: 'image/png' }); const buf = new Uint8Array(await blob.arrayBuffer());
    let bin = ''; for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
    const T = lay.title; f.font = `700 ${T.size}px PX`; f.letterSpacing = T.ls + 'px'; const mt = f.measureText(T.text);
    const S = lay.sub; f.font = `700 ${S.size}px PX`; f.letterSpacing = S.ls + 'px'; const ms = f.measureText(S.text);
    return { png: btoa(bin), meanErrClean: sn ? se / sn : null,
      title: [T.u - mt.actualBoundingBoxLeft, T.u + mt.actualBoundingBoxRight], sub: [S.u - ms.actualBoundingBoxLeft, subEnd] };
  }, { img: crop.toString('base64'), G: { O: g.O, cos: g.cos, sin: g.sin }, CX, CY, W: CW, H: CH, lay: L[mode], bgOnly });
  await browser.close();
  console.log('mean |err| on clean wood:', res.meanErrClean, 'title u', res.title, 'sub u', res.sub);
  const layer = Buffer.from(res.png, 'base64');
  fs.writeFileSync(out.replace(/\.png$/, '-layer.png'), layer);
  await sharp(ORIG).composite([{ input: layer, left: CX, top: CY }]).png({ compressionLevel: 9 }).toFile(out);
  console.log('wrote', out);
})();
