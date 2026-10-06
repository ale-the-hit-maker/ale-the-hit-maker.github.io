(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ================= Generative covers ================= */

  // Artwork colors stay fixed in light and dark mode, like a print would.
  const C = {
    ultra: "#2a36c8",
    deep: "#161d7a",
    night: "#0c1150",
    paper: "#f3f4f6",
    ink: "#12163a",
    sun: "#f5c53a",
    sky: "#d7ddff",
  };

  function rng(seed) {
    let s = seed * 9301 + 49297;
    return () => {
      s |= 0; s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const covers = {
    // CO2 readings as stacked traces; one sensor drifts upward.
    co2(ctx, w, h, r) {
      ctx.fillStyle = C.ultra; ctx.fillRect(0, 0, w, h);
      const n = 30, top = h * 0.14, span = h * 0.74, hot = Math.floor(n * 0.62);
      for (let i = 0; i < n; i++) {
        const y0 = top + (i * span) / n, phase = r() * 6, amp = 0.4 + 0.6 * r();
        ctx.beginPath();
        for (let x = 0; x <= w; x += 3) {
          const t = x / w;
          let y = y0 + Math.sin(t * 7 + phase) * h * 0.008 + Math.sin(t * 23 + i) * h * 0.003;
          y -= Math.exp(-(((t - 0.42) / 0.07) ** 2)) * h * 0.07 * amp;
          if (i === hot) y -= Math.max(0, t - 0.55) ** 1.4 * h * 0.42;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = i === hot ? C.sun : "rgba(243,244,246,0.5)";
        ctx.lineWidth = i === hot ? 3 : 1;
        ctx.stroke();
      }
    },

    // Isometric voxels rising out of a scattered point cloud.
    voxels(ctx, w, h, r) {
      ctx.fillStyle = C.night; ctx.fillRect(0, 0, w, h);
      const N = 13, maxK = 5;
      const p1 = r() * 6, p2 = r() * 6;
      const height = (i, j) => {
        const v = Math.sin(i * 0.55 + p1) * Math.cos(j * 0.48 + p2) * 2.6 + 1.6 + (r() - 0.5) * 1.4;
        return Math.max(0, Math.min(maxK, Math.round(v)));
      };
      const H = [];
      for (let i = 0; i < N; i++) { H.push([]); for (let j = 0; j < N; j++) H[i].push(height(i, j)); }

      let s = Math.min((w * 0.86) / (2 * N * 0.866), (h * 0.84) / (N + maxK + 1));
      const a = s * 0.866;
      const x0 = w / 2, y0 = (h - (N + 1 + maxK) * s) / 2 + maxK * s;

      // point cloud dust behind the cubes
      for (let k = 0; k < 900; k++) {
        ctx.fillStyle = `rgba(215,221,255,${0.15 + r() * 0.35})`;
        ctx.fillRect(r() * w, r() * h, 1.4, 1.4);
      }

      const face = (pts, fill) => {
        ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
        for (let q = 2; q < pts.length; q += 2) ctx.lineTo(pts[q], pts[q + 1]);
        ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
        ctx.strokeStyle = "rgba(12,17,80,0.55)"; ctx.lineWidth = 0.8; ctx.stroke();
      };

      for (let sum = 0; sum <= 2 * (N - 1); sum++) {
        for (let i = 0; i < N; i++) {
          const j = sum - i;
          if (j < 0 || j >= N) continue;
          for (let k = 0; k < H[i][j]; k++) {
            const X = x0 + (i - j) * a, Y = y0 + ((i + j) * s) / 2 - k * s;
            const lit = k === H[i][j] - 1 && r() < 0.06;
            face([X, Y, X + a, Y + s / 2, X, Y + s, X - a, Y + s / 2], lit ? C.sun : k % 2 ? C.sky : C.paper);
            face([X - a, Y + s / 2, X, Y + s, X, Y + 2 * s, X - a, Y + 1.5 * s], C.ultra);
            face([X, Y + s, X + a, Y + s / 2, X + a, Y + 1.5 * s, X, Y + 2 * s], C.deep);
          }
        }
      }
    },

    // Ten clients around a server; each client holds only a few classes.
    federated(ctx, w, h, r) {
      ctx.fillStyle = C.deep; ctx.fillRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.34;

      ctx.setLineDash([3, 6]); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(215,221,255,0.35)";
      for (let k = 1; k <= 3; k++) { ctx.beginPath(); ctx.arc(cx, cy, R * (0.3 + k * 0.22), 0, Math.PI * 2); ctx.stroke(); }
      ctx.setLineDash([]);

      for (let c = 0; c < 10; c++) {
        const ang = -Math.PI / 2 + (c * Math.PI * 2) / 10;
        const x = cx + Math.cos(ang) * R, y = cy + Math.sin(ang) * R;
        ctx.strokeStyle = "rgba(215,221,255,0.7)"; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke();

        const nClasses = c % 3 === 0 ? 5 : 2, classes = [];
        while (classes.length < nClasses) { const k = Math.floor(r() * 10); if (!classes.includes(k)) classes.push(k); }
        for (let d = 0; d < 46; d++) {
          const k = classes[Math.floor(r() * classes.length)];
          const a2 = (k * Math.PI * 2) / 10 + (r() - 0.5) * 0.45;
          const rad = 10 + r() * R * 0.22;
          ctx.fillStyle = k % 2 ? C.paper : C.sky;
          ctx.beginPath(); ctx.arc(x + Math.cos(a2) * rad, y + Math.sin(a2) * rad, 1.8, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = C.deep; ctx.strokeStyle = C.paper; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
      ctx.fillStyle = C.sun; ctx.strokeStyle = C.paper; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    },

    // Many tiny WebAssembly pods against three heavy containers.
    density(ctx, w, h, r) {
      ctx.fillStyle = C.sky; ctx.fillRect(0, 0, w, h);
      const pad = Math.min(w, h) * 0.07, split = w * 0.6;
      const cell = Math.max(6, w / 56), gap = cell * 0.35;
      for (let y = pad; y + cell <= h - pad; y += cell + gap) {
        for (let x = pad; x + cell <= split; x += cell + gap) {
          if (r() < 0.1) continue;
          ctx.fillStyle = r() < 0.02 ? C.sun : C.ultra;
          ctx.fillRect(x, y, cell, cell);
        }
      }
      const bx = split + pad * 0.6, bw = w - bx - pad, bh = (h - 2 * pad - 2 * gap * 3) / 3;
      for (let i = 0; i < 3; i++) {
        const y = pad + i * (bh + gap * 3);
        ctx.fillStyle = C.deep; ctx.fillRect(bx, y, bw, bh);
        ctx.strokeStyle = C.sky; ctx.lineWidth = 1;
        for (let l = 1; l < 5; l++) { ctx.beginPath(); ctx.moveTo(bx + 10, y + (bh * l) / 5); ctx.lineTo(bx + bw - 10, y + (bh * l) / 5); ctx.stroke(); }
      }
    },

    // Plan of the cargo hold: four slots, the marking slot, the input port and the robot's path.
    hold(ctx, w, h, r) {
      ctx.fillStyle = C.paper; ctx.fillRect(0, 0, w, h);
      const m = Math.min(w, h) * 0.1, iw = w - 2 * m, ih = h - 2 * m;
      ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.strokeRect(m, m, iw, ih);

      const sl = ih * 0.3, gx = m + iw * 0.56, gp = sl * 0.25;
      const slots = [[gx, m + gp], [gx + sl + gp, m + gp], [gx, m + ih - gp - sl], [gx + sl + gp, m + ih - gp - sl]];
      const full = [true, false, true, false];
      slots.forEach(([x, y], i) => {
        if (full[i]) { ctx.fillStyle = C.ultra; ctx.fillRect(x, y, sl, sl); }
        else { ctx.setLineDash([5, 5]); ctx.strokeStyle = C.ultra; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, sl, sl); ctx.setLineDash([]); }
      });

      const s5x = m + iw * 0.28, s5y = m + ih / 2 - sl / 2;
      ctx.fillStyle = C.ultra; ctx.fillRect(s5x, s5y, sl, sl);
      ctx.fillStyle = C.sun;
      for (let b = 0, x = s5x + sl * 0.15; x < s5x + sl * 0.85; b++) {
        const bw = 1 + Math.floor(r() * 4);
        if (b % 2 === 0) ctx.fillRect(x, s5y + sl * 0.3, bw, sl * 0.4);
        x += bw + 2;
      }

      const px = m + iw * 0.1;
      ctx.fillStyle = C.sun; ctx.fillRect(px - 14, m + ih - 8, 28, 16);
      ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.strokeRect(px - 14, m + ih - 8, 28, 16);

      const path = [[px, m + ih - 12], [px, s5y + sl / 2], [s5x - 8, s5y + sl / 2], [s5x - 8, s5y - 18],
        [gx + sl + gp + sl / 2, s5y - 18], [gx + sl + gp + sl / 2, m + gp + sl + 6]];
      ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.setLineDash([2, 6]); ctx.lineCap = "round";
      ctx.beginPath(); path.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
      ctx.setLineDash([]);
      const [rx, ry] = path[3];
      ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(rx + (path[4][0] - rx) * 0.4, ry, 9, 0, Math.PI * 2); ctx.fill();
    },

    // Default: wind streamlines, for works without their own drawing.
    air(ctx, w, h, r) {
      ctx.fillStyle = C.ultra; ctx.fillRect(0, 0, w, h);
      const field = (x, y) => Math.sin(x * 0.006 + y * 0.004) * 0.6 + Math.cos(y * 0.01) * 0.3;
      for (let k = 0; k < 160; k++) {
        let x = -20, y = r() * h;
        ctx.beginPath(); ctx.moveTo(x, y);
        for (let step = 0; step < 220 && x < w + 20; step++) {
          const a = field(x, y);
          x += Math.cos(a) * 4; y += Math.sin(a) * 4;
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = k % 37 === 0 ? C.sun : "rgba(243,244,246,0.35)";
        ctx.lineWidth = k % 37 === 0 ? 2.5 : 1;
        ctx.stroke();
      }
    },
  };

  function drawCover(canvas) {
    const kind = covers[canvas.dataset.cover] ? canvas.dataset.cover : "air";
    // Layout size, not the rotated bounding box of the taped print.
    const rect = { width: canvas.clientWidth, height: canvas.clientHeight };
    if (!rect.width) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    covers[kind](ctx, rect.width, rect.height, rng(Number(canvas.dataset.seed) || 1));
  }

  const canvases = [...document.querySelectorAll("canvas[data-cover]")];
  if ("ResizeObserver" in window) {
    const ro = new ResizeObserver((entries) => entries.forEach((e) => drawCover(e.target)));
    canvases.forEach((c) => ro.observe(c));
  } else {
    canvases.forEach(drawCover);
  }

  /* ================= Cracks in the wall ================= */

  document.querySelectorAll("svg.crack").forEach((svg) => {
    const r = rng(Number(svg.dataset.crack) || 1);
    const W = svg.clientWidth || 240, H = svg.clientHeight || 320;
    const NS = "http://www.w3.org/2000/svg";
    const branches = [];
    (function walk(x, y, ang, len, width, depth) {
      const pts = [[x, y]];
      let done = 0;
      while (done < len) {
        ang += (r() - 0.5) * 0.9;
        ang += (Math.PI / 2 - ang) * 0.08; // gravity keeps it heading down
        const seg = 5 + r() * 11;
        x += Math.cos(ang) * seg; y += Math.sin(ang) * seg; done += seg;
        pts.push([x, y]);
        if (depth < 2 && r() < 0.07) walk(x, y, ang + (r() < 0.5 ? -1 : 1) * (0.6 + r() * 0.7), len * 0.35, width * 0.6, depth + 1);
      }
      branches.push({ pts, width });
    })(W * 0.5, 0, Math.PI / 2 + (r() - 0.5) * 0.8, H * 1.05, 1.6, 0);

    branches.forEach(({ pts, width }) => {
      const d = "M" + pts.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" L");
      const lit = document.createElementNS(NS, "path");
      lit.setAttribute("d", d); lit.setAttribute("stroke", "rgba(235,234,228,0.45)");
      lit.setAttribute("stroke-width", width); lit.setAttribute("transform", "translate(1 1.2)");
      const dark = document.createElementNS(NS, "path");
      dark.setAttribute("d", d); dark.setAttribute("stroke", "rgba(48,46,42,0.72)");
      dark.setAttribute("stroke-width", width);
      svg.append(lit, dark);
    });
  });

  /* ================= Wind on the name ================= */

  const wind = document.querySelector(".wind");
  const letters = [];
  const REST = { w: 64, g: 600 }, GUST = { w: 125, g: 880 };
  const fitGust = () => { GUST.w = window.innerWidth < 640 ? 84 : 125; };

  if (wind) {
    wind.querySelectorAll(".wl").forEach((line) => {
      const text = line.textContent;
      line.textContent = "";
      for (const ch of text) {
        const s = document.createElement("span");
        s.textContent = ch;
        line.appendChild(s);
        letters.push({ el: s, w: REST.w, g: REST.g, cx: 0, cy: 0 });
      }
    });
  }

  const setLetter = (l) => { l.el.style.fontVariationSettings = `"wdth" ${l.w.toFixed(1)}, "wght" ${l.g.toFixed(0)}`; };

  function measureLetters() {
    letters.forEach((l) => { l.el.style.fontVariationSettings = ""; });
    letters.forEach((l) => {
      const b = l.el.getBoundingClientRect();
      l.cx = b.left + b.width / 2;
      l.cy = b.top + b.height / 2 + window.scrollY;
    });
    letters.forEach(setLetter);
  }

  let px = null, py = null, windRunning = false;

  function windFrame() {
    let moving = false;
    const R = Math.max(140, window.innerWidth * 0.12);
    for (const l of letters) {
      let t = 0;
      if (px !== null) {
        const dx = px - l.cx, dy = (py - l.cy) * 0.5;
        t = Math.exp(-(dx * dx + dy * dy) / (R * R));
      }
      const tw = REST.w + (GUST.w - REST.w) * t, tg = REST.g + (GUST.g - REST.g) * t;
      l.w += (tw - l.w) * 0.14; l.g += (tg - l.g) * 0.14;
      if (Math.abs(tw - l.w) > 0.2 || Math.abs(tg - l.g) > 1) moving = true;
      setLetter(l);
    }
    windRunning = moving || px !== null;
    if (windRunning) requestAnimationFrame(windFrame);
  }
  const kickWind = () => { if (!windRunning) { windRunning = true; requestAnimationFrame(windFrame); } };

  function gust() {
    const start = performance.now(), dur = 2200, from = -200, to = window.innerWidth + 200;
    const mid = letters.length ? (letters[0].cy + letters[letters.length - 1].cy) / 2 : 0;
    (function step(now) {
      const t = Math.min(1, (now - start) / dur);
      const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      px = from + (to - from) * e; py = mid;
      kickWind();
      if (t < 1) requestAnimationFrame(step); else px = null;
    })(start);
  }

  if (wind && !reduceMotion) {
    fitGust();
    const hero = document.querySelector(".hero");
    hero.addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch") return;
      px = e.clientX; py = e.clientY + window.scrollY; kickWind();
    });
    hero.addEventListener("pointerleave", () => { px = null; kickWind(); });
  }

  /* ================= The thread ================= */
  // One continuous line of blue spray paint: it leaves the name, passes
  // through every yellow pin in reading order, and ends circling the email.

  const thread = document.querySelector(".thread");
  const paths = thread ? [...thread.querySelectorAll("path")] : [];
  let total = 0, samples = [], drawn = 0, target = 0, threadTicking = false;

  const fmt = (p) => p[0].toFixed(1) + "," + p[1].toFixed(1);
  function smooth(P) {
    let d = "M" + fmt(P[0]);
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += " C" + fmt(c1) + " " + fmt(c2) + " " + fmt(p2);
    }
    return d;
  }

  function buildThread() {
    if (!thread) return;
    thread.style.height = "0px";
    const docW = document.documentElement.clientWidth;
    const docH = document.documentElement.scrollHeight;
    thread.style.height = docH + "px";
    const r = rng(42);
    const sx = window.scrollX, sy = window.scrollY;
    const clampX = (x) => Math.max(10, Math.min(docW - 10, x));

    const anchors = [...document.querySelectorAll("[data-thread]")]
      .map((el) => el.getBoundingClientRect())
      .filter((b) => b.width > 0)
      .map((b) => [b.left + b.width / 2 + sx, b.top + b.height / 2 + sy]);
    if (!anchors.length) return;

    const P = [];
    const lastLine = document.querySelector(".wl:last-of-type");
    if (lastLine) {
      const spans = lastLine.querySelectorAll("span");
      const b = (spans[spans.length - 1] || lastLine).getBoundingClientRect();
      P.push([b.right + 14 + sx, b.top + b.height * 0.62 + sy]);
      // On phones, run to the edge first so the line stays clear of the text.
      if (docW < 700) P.push([docW - 18, b.top + b.height * 0.9 + sy]);
    }

    const loopAt = new Set([2, 5]);
    anchors.forEach((b, i) => {
      const a = i === 0 ? P[P.length - 1] : anchors[i - 1];
      if (a) {
        const dx = b[0] - a[0], dy = b[1] - a[1], dist = Math.hypot(dx, dy) || 1;
        let nx = -dy / dist, ny = dx / dist;
        const half = docW / 2, same = (a[0] > half) === (b[0] > half);
        if (same) {
          const toEdge = a[0] > half ? 1 : -1;
          if (Math.sign(nx) !== toEdge) { nx = -nx; ny = -ny; }
          const amt = Math.min(dist * 0.2, 170) * (0.6 + r() * 0.6);
          P.push([clampX(a[0] + dx * 0.35 + nx * amt), a[1] + dy * 0.35 + ny * amt]);
          if (loopAt.has(i)) addLoop(P, a[0] + dx * 0.55 + nx * amt, a[1] + dy * 0.55 + ny * amt, Math.atan2(dy, dx), r);
          P.push([clampX(a[0] + dx * 0.72 + nx * amt * 0.7), a[1] + dy * 0.72 + ny * amt * 0.7]);
        } else {
          const amt = dist * 0.07 * (r() < 0.5 ? -1 : 1);
          P.push([clampX(a[0] + dx * 0.33 + nx * amt), a[1] + dy * 0.33 + ny * amt]);
          if (loopAt.has(i)) addLoop(P, a[0] + dx * 0.5, a[1] + dy * 0.5, Math.atan2(dy, dx), r);
          P.push([clampX(a[0] + dx * 0.67 - nx * amt), a[1] + dy * 0.67 - ny * amt]);
        }
      }
      P.push(b);
    });

    // Finale: a hand-sprayed ring around the email address.
    const end = document.querySelector("[data-thread-end]");
    if (end) {
      const e = end.getBoundingClientRect();
      const cx = e.left + e.width / 2 + sx, cy = e.top + e.height / 2 + sy;
      const rx = e.width / 2 + 34, ry = e.height / 2 + 26;
      const last = P[P.length - 1];
      P.push([clampX(Math.max(cx + rx + 40, docW < 700 ? docW - 14 : 0)), (last[1] + cy) / 2]);
      for (let t = 0; t <= Math.PI * 2.2; t += Math.PI / 9) {
        const ang = -t;
        const k = 1 + (r() - 0.5) * 0.07 + t * 0.012;
        P.push([clampX(cx + Math.cos(ang) * rx * k), cy + Math.sin(ang) * ry * k]);
      }
    }

    const d = smooth(P);
    const core = smooth(P.map((p) => [p[0] + 0.8 + (r() - 0.5) * 3, p[1] - 0.6 + (r() - 0.5) * 3]));
    paths.forEach((p) => p.setAttribute("d", p.classList.contains("thread-core") ? core : d));

    paths.forEach((p) => { p._len = p.getTotalLength(); p.style.strokeDasharray = p._len + 1 + " " + (p._len + 1); });
    const main = paths.find((p) => p.classList.contains("thread-paint")) || paths[0];
    total = main._len;
    samples = [];
    for (let l = 0; l <= total; l += 16) samples.push([l, main.getPointAtLength(l).y]);
    samples.push([total, main.getPointAtLength(total).y]);
    if (reduceMotion) drawn = total;
    updateTarget(true);
  }

  function addLoop(P, x, y, dir, r) {
    const R = 22 + r() * 16, side = r() < 0.5 ? 1 : -1;
    const ox = x + Math.cos(dir + side * Math.PI / 2) * R, oy = y + Math.sin(dir + side * Math.PI / 2) * R;
    const start = Math.atan2(y - oy, x - ox);
    for (let k = 1; k <= 7; k++) {
      const a = start + side * -(k / 7) * Math.PI * 2;
      P.push([ox + Math.cos(a) * R, oy + Math.sin(a) * R]);
    }
  }

  function applyThread() {
    const f = total ? drawn / total : 1;
    paths.forEach((p) => { p.style.strokeDashoffset = (p._len * (1 - f)).toFixed(1); });
  }

  function updateTarget(force) {
    if (!total) return;
    const docH = document.documentElement.scrollHeight;
    if (reduceMotion || window.scrollY + window.innerHeight >= docH - 8) {
      target = total;
    } else {
      const y = window.scrollY + window.innerHeight * 0.72;
      let L = 0;
      for (const [l, sy] of samples) { if (sy > y) break; L = l; }
      target = L;
    }
    if (reduceMotion) { drawn = target; applyThread(); return; }
    if (force) applyThread();
    if (!threadTicking) { threadTicking = true; requestAnimationFrame(threadFrame); }
  }

  function threadFrame() {
    drawn += (target - drawn) * 0.09;
    if (Math.abs(target - drawn) < 0.5) drawn = target;
    applyThread();
    if (drawn !== target) requestAnimationFrame(threadFrame); else threadTicking = false;
  }

  window.addEventListener("scroll", () => updateTarget(false), { passive: true });

  /* ================= Layout changes ================= */

  let rebuildTimer = 0;
  const rebuild = () => { clearTimeout(rebuildTimer); rebuildTimer = setTimeout(() => { measureLetters(); buildThread(); }, 120); };
  if ("ResizeObserver" in window) new ResizeObserver(rebuild).observe(document.body);
  window.addEventListener("resize", () => { fitGust(); rebuild(); });
  window.addEventListener("load", rebuild);

  const ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  ready.then(() => {
    measureLetters();
    buildThread();
    if (wind && !reduceMotion) setTimeout(gust, 250);
  });
})();
