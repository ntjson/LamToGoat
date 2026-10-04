// Record the real LamTo app for ch05, as real-time screen recordings with every tap, key, cursor move, click and
// scroll logged:
//   app  the resident's report on a phone: the Flutter web build (~/Projects/LamTo/app/build/web) at 390 x 844, DPR 3
//   web  the manager's triage on a laptop: the Django workspace at 1440 x 900, DPR 2, signed in as Kawaibu
//
//   node tools/record_app.mjs [--only app|web]
//   node tools/record_app.mjs --marks          (recompute the marks read from the frames; no sandbox needed)
//
// Needs ~/Projects/LamTo (its .venv, app/build/web and .scratch/design, the design sandbox) and its lamto-db-1
// Postgres container. The script:
// 1. Starts lamto-db-1 if it is stopped, copies the design database to a throwaway lamto_design_rec, and runs the
//    design API (manage.py runserver with .scratch/design's settings) on :8765 against that copy, plus a static server
//    for the web build on :8770 (the build calls :8765). lamto_design itself is only ever used as the copy's template.
// 2. Records the phone (pilot-resident-2): "Việc của tôi"; "+ Phản ánh"; the report box; the hook's words typed;
//    "Chọn vị trí" → "Tầng 3" → "Thang máy B"; "Gửi phản ánh"; the app's confirmation; back to "Việc của tôi".
//    No photo: the web build can't attach one (the app copies photos with dart:io/path_provider; decision 2026-10-04).
// 3. Records the laptop (pilot-management-1, shown as "Kawaibu"): report #7 with its AI suggestion; the cursor reads
//    it, picks Vị trí (Tầng 1 / Thang máy A), clicks "Xác nhận phân loại"; the case page; a scroll to the chain.
// 4. Stops both servers, drops the copy, and stops lamto-db-1 again if it was stopped before. The sandbox ends exactly
//    as it started.
//
// Frames come from a CDP screencast: Chromium sends a frame each time the page repaints (about 20-30 fps while
// something moves, nothing while the screen is still), and each is saved as the JPEG it sent, with its capture time.
// Logged events use the page's own event times (performance.timeOrigin + event.timeStamp), the same wall clock as
// the frames. All times in the output are seconds from the recording's first frame.
// Output: assets/recordings/{app,web}/NNNN.jpg and assets/recordings/{app,web}.json.
// The engine serves the JSON to scenes as ctx.recording('app' | 'web'); scenes never name the frames' paths.
import { chromium } from 'playwright-core';
import { execFileSync, spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { ROOT } from './serve.mjs';

const LAMTO = path.join(os.homedir(), 'Projects/LamTo');
const DB = 'lamto-db-1';
const COPY = 'lamto_design_rec';
const API = 'http://127.0.0.1:8765';
const APP = 'http://127.0.0.1:8770';
const OUT = path.join(ROOT, 'assets/recordings');
const LOGS = path.join(ROOT, 'out/tmp/record');
const PASSWORD = 'pilot-test-secret';
const RESIDENT = 'pilot-resident-2@pilot.lamto.test';
const MANAGER = 'pilot-management-1@pilot.lamto.test';
const HOOK = 'Thang máy B kẹt cửa ở tầng 3, phải bấm nhiều lần mới mở được.';
const CHROMIUM = '/usr/bin/chromium';

const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const r3 = (v) => Math.round(v * 1000) / 1000;
const sh = (cmd, a, opts = {}) => execFileSync(cmd, a, { encoding: 'utf8', ...opts }).trim();
const psql = (...cmds) => sh('docker', ['exec', DB, 'psql', '-U', 'lamto_bootstrap', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', ...cmds.flatMap((c) => ['-c', c])]);

function portFree(port) {
  return new Promise((resolve) => {
    const s = net.createServer().once('error', () => resolve(false)).once('listening', () => s.close(() => resolve(true)));
    s.listen(port, '127.0.0.1');
  });
}
async function waitHttp(url, ms = 30000) {
  const t0 = Date.now();
  for (;;) {
    try {
      const r = await fetch(url);
      if (r.status < 500) return;
    } catch {}
    if (Date.now() - t0 > ms) throw new Error(`timed out waiting for ${url}`);
    await sleep(300);
  }
}

// ------------------------------------------------------------------------------------------------ the sandbox
async function sandboxUp(state) {
  for (const p of [8765, 8770]) if (!(await portFree(p))) throw new Error(`port ${p} is busy: stop whatever runs there first`);
  state.wasRunning = sh('docker', ['inspect', '-f', '{{.State.Running}}', DB]) === 'true';
  if (!state.wasRunning) {
    sh('docker', ['start', DB]);
    state.started = true;
  }
  for (let i = 0; ; i++) {
    try {
      sh('docker', ['exec', DB, 'pg_isready', '-U', 'lamto_bootstrap', '-d', 'postgres']);
      break;
    } catch (e) {
      if (i > 60) throw e;
      await sleep(500);
    }
  }
  psql(`DROP DATABASE IF EXISTS ${COPY}`, `CREATE DATABASE ${COPY} TEMPLATE lamto_design OWNER lamto_owner`,
    `REVOKE ALL ON DATABASE ${COPY} FROM PUBLIC`, `GRANT TEMPORARY, CONNECT ON DATABASE ${COPY} TO PUBLIC`,
    `GRANT CONNECT ON DATABASE ${COPY} TO lamto_app, lamto_writer`);
  state.copy = true;
  fs.mkdirSync(LOGS, { recursive: true });
  const log = (name) => fs.openSync(path.join(LOGS, name), 'w');
  state.api = spawn('bash', ['-c', `source .scratch/design/env.sh && export POSTGRES_DB=${COPY} && exec .venv/bin/python manage.py runserver 127.0.0.1:8765 --noreload`],
    { cwd: LAMTO, stdio: ['ignore', log('api.log'), log('api.log')] });
  state.web = spawn('python3', ['-m', 'http.server', '8770', '--bind', '127.0.0.1', '--directory', path.join(LAMTO, 'app/build/web')],
    { stdio: ['ignore', log('web.log'), log('web.log')] });
  await waitHttp(`${API}/accounts/login/`);
  await waitHttp(`${APP}/`);
}

async function sandboxDown(state) {
  for (const k of ['api', 'web']) {
    const p = state[k];
    if (p && p.exitCode === null) {
      p.kill('SIGTERM');
      await new Promise((r) => { p.once('exit', r); setTimeout(r, 5000); });
    }
  }
  if (state.copy) psql(`DROP DATABASE IF EXISTS ${COPY}`);
  if (state.started) sh('docker', ['stop', DB]);
  for (const p of [8765, 8770]) if (!(await portFree(p))) console.warn(`warning: port ${p} still busy after teardown`);
}

// ------------------------------------------------------------------------------------------------ recording
// Page-side log, installed before any page script: pointer and key events with the page's own times, and the first
// time each landmark text appears in the accessibility tree (Flutter) or the DOM (Django).
function pageLog(marks) {
  window.__rec = { ev: [], marks: {} };
  const T = (e) => performance.timeOrigin + (e ? e.timeStamp : performance.now());
  const push = (o) => window.__rec.ev.push(o);
  for (const k of ['pointerdown', 'pointerup']) {
    addEventListener(k, (e) => push({ k, t: T(e), x: e.clientX, y: e.clientY, pt: e.pointerType }), true);
  }
  addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') push({ k: 'move', t: T(e), x: e.clientX, y: e.clientY }); }, true);
  addEventListener('input', (e) => push({ k: 'input', t: T(e), n: (e.target && e.target.value || '').length }), true);
  addEventListener('keydown', (e) => push({ k: 'keydown', t: T(e), key: e.key }), true);
  addEventListener('wheel', (e) => push({ k: 'wheel', t: T(e), dy: e.deltaY, x: e.clientX, y: e.clientY }), true);
  addEventListener('scroll', () => push({ k: 'scroll', t: T(), y: scrollY }), true);
  const check = () => {
    const text = document.body ? document.body.innerText + ' ' + [...document.querySelectorAll('[aria-label]')].map((n) => n.getAttribute('aria-label')).join(' ') : '';
    for (const [name, needles] of Object.entries(marks)) {
      if (!window.__rec.marks[name] && needles.every((s) => text.includes(s))) window.__rec.marks[name] = T();
    }
  };
  new MutationObserver(check).observe(document, { subtree: true, childList: true, characterData: true, attributes: true });
}

async function launch(dpr, viewport, mobile) {
  const browser = await chromium.launch({
    executablePath: CHROMIUM,
    args: ['--disable-web-security', '--lang=vi-VN', `--force-device-scale-factor=${dpr}`, '--font-render-hinting=none', '--force-color-profile=srgb', '--hide-scrollbars'],
  });
  const ctx = await browser.newContext({
    viewport, deviceScaleFactor: dpr, locale: 'vi-VN', colorScheme: 'light', isMobile: mobile, hasTouch: mobile,
    ...(mobile ? { userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36' } : {}),
  });
  return { browser, ctx };
}

// A screencast into dir: every frame Chromium sends, as JPEG, with its capture time (s, wall clock).
async function screencast(ctx, page, dir, size, quality) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const cdp = await ctx.newCDPSession(page);
  const frames = [];
  const writes = [];
  cdp.on('Page.screencastFrame', (f) => {
    cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
    const file = `${String(frames.length).padStart(4, '0')}.jpg`;
    frames.push({ t: f.metadata.timestamp, file });
    writes.push(fs.promises.writeFile(path.join(dir, file), Buffer.from(f.data, 'base64')));
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality, maxWidth: size[0], maxHeight: size[1], everyNthFrame: 1 });
  return {
    cdp,
    async stop() {
      await cdp.send('Page.stopScreencast');
      await sleep(300);
      await Promise.all(writes);
      return frames;
    },
  };
}

function sha(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 16);
}

// ------------------------------------------------------------------------------------------------ the phone
async function recordApp() {
  const { browser, ctx } = await launch(3, { width: 390, height: 844 }, true);
  await ctx.addInitScript(pageLog, {
    form: ['Đã xảy ra chuyện gì?', 'Gửi phản ánh'],
    picker: ['Sự cố ở đâu?'],
    floor: ['Chọn khu vực này'],
    confirm: ['Phản ánh của bạn đã được ghi nhận'],
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const cdpIn = await ctx.newCDPSession(page);
  // The helpers below follow ~/Projects/LamTo/.scratch/design/appflow.mjs and appshots.mjs: turn on Flutter's
  // semantics tree, find a node by its label, type into the field by its aria-label.
  const sem = async () => {
    const b = await page.evaluate(() => {
      const p = document.querySelector('flt-semantics-placeholder');
      if (!p) return null;
      const r = p.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width };
    });
    if (!b) return;
    if (b.w > 10) await page.touchscreen.tap(b.x, b.y);
    else await page.evaluate(() => document.querySelector('flt-semantics-placeholder')?.click());
    await sleep(1200);
  };
  const find = async (re) => {
    const h = await page.evaluateHandle((src) => {
      const rx = new RegExp(src);
      const text = (n) => ((n.getAttribute('aria-label') || '') + ' ' + (n.textContent || '')).trim();
      const all = [...document.querySelectorAll('flt-semantics')].filter((n) => rx.test(text(n)) && n.getBoundingClientRect().width > 0);
      const btn = all.filter((n) => ['button', 'tab', 'link', 'menuitem', 'radio', 'checkbox', 'switch'].includes(n.getAttribute('role')));
      const pool = btn.length ? btn : all;
      const area = (n) => { const r = n.getBoundingClientRect(); return r.width * r.height; };
      pool.sort((a, b) => area(a) - area(b));
      // A text field is a DOM input under its semantics node, labelled by aria-label (appflow.mjs's type()).
      const field = [...document.querySelectorAll('input[aria-label], textarea[aria-label]')].find((e) => rx.test(e.getAttribute('aria-label')));
      return pool[0] || (field && (field.closest('flt-semantics') || field)) || null;
    }, re.source);
    const el = h.asElement();
    if (!el) throw new Error(`no node ${re}`);
    return el.boundingBox();
  };
  // A real touch held for 90 ms (so the app's ink ripple grows under the finger), at a chosen point of the target.
  const taps = [];
  const tap = async (label, re, fx = 0.5, fy = 0.5) => {
    const b = await find(re);
    const x = r3(b.x + b.width * fx);
    const y = r3(b.y + b.height * fy);
    const t0 = Date.now() / 1000;
    await cdpIn.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, radiusX: 6, radiusY: 6, force: 1 }] });
    await sleep(90);
    await cdpIn.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    taps.push({ label, x, y, node: t0, box: [b.x, b.y, b.width, b.height].map(r3) });
  };
  const waitText = async (s, ms = 10000) => {
    await page.waitForFunction((needle) => document.body.innerText.includes(needle)
      || [...document.querySelectorAll('[aria-label]')].some((n) => n.getAttribute('aria-label').includes(needle)), s, { timeout: ms });
  };

  // Sign in and open "Việc của tôi" (not recorded).
  await page.goto(`${APP}/`, { waitUntil: 'networkidle' });
  await sleep(2500);
  await sem();
  for (const [label, v] of [['Số điện thoại hoặc email', RESIDENT], ['Mật khẩu', PASSWORD]]) {
    const sel = `input[aria-label="${label}"]`;
    await page.waitForSelector(sel, { timeout: 8000 });
    await page.click(sel);
    await sleep(300);
    await page.type(sel, v, { delay: 20 });
  }
  const login = await find(/^Đăng nhập$/);
  await page.touchscreen.tap(login.x + login.width / 2, login.y + login.height / 2);
  await sleep(3500);
  await sem();
  const tab = await find(/^Việc của tôi/);
  await page.touchscreen.tap(tab.x + tab.width / 2, tab.y + tab.height / 2);
  await sleep(2000);
  // Chromium's mobile emulation paints its tap highlight (a translucent blue box) over the element it treats as
  // tapped, which in a Flutter app is the full-screen host, so every tap would flash the whole screen. It is the
  // browser's, not the app's (the app's own ink ripples are drawn on its canvas), so it is turned off for the capture.
  await page.addStyleTag({ content: '* { -webkit-tap-highlight-color: transparent !important; }' });
  await page.evaluate(() => { window.__rec.ev = []; window.__rec.marks = {}; });

  // Record.
  const cast = await screencast(ctx, page, path.join(OUT, 'app'), [1170, 2532], 92);
  await sleep(1300);
  await tap('Phản ánh', /^Phản ánh$/, 0.17, 0.5); // the FAB's "+": the finger leaves its label clear
  await sleep(1400);
  const field = await find(/Đã xảy ra chuyện gì/);
  await tap('Đã xảy ra chuyện gì?', /Đã xảy ra chuyện gì/, 0.32, 0.42);
  await sleep(700);
  await page.keyboard.type(HOOK, { delay: 45 });
  await sleep(1000);
  await tap('Chọn vị trí', /^Chọn vị trí/, 0.62, 0.5);
  await sleep(1300);
  await tap('Tầng 3', /^Tầng 3$/, 0.62, 0.5);
  await sleep(1300);
  await tap('Thang máy B', /^Thang máy B$/, 0.62, 0.5);
  await sleep(1700);
  const send = await find(/^Gửi phản ánh$/);
  await tap('Gửi phản ánh', /^Gửi phản ánh$/, 0.84, 0.5);
  await waitText('Phản ánh của bạn đã được ghi nhận');
  await sleep(1600);
  const banner = await page.evaluate(() => {
    const n = [...document.querySelectorAll('flt-semantics')].filter((e) => (e.textContent || e.getAttribute('aria-label') || '').trim().startsWith('Phản ánh của bạn đã được ghi nhận'))
      .sort((a, b) => a.getBoundingClientRect().height - b.getBoundingClientRect().height)[0];
    if (!n) return null;
    const r = n.getBoundingClientRect();
    return [r.x, r.y, r.width, r.height];
  });
  await tap('Quay lại', /Quay lại/, 0.5, 0.5);
  await page.waitForFunction((s) => [...document.querySelectorAll('flt-semantics')].some((n) => (n.textContent || '').includes(s)), HOOK.slice(0, 24), { timeout: 10000 });
  const listT = await page.evaluate(() => performance.timeOrigin + performance.now());
  await sleep(1600);
  const frames = await cast.stop();
  const rec = await page.evaluate(() => window.__rec);
  await browser.close();
  if (errors.length) console.warn('page errors while recording the app:\n' + errors.join('\n'));

  // Times relative to the first frame.
  const t0 = frames[0].t;
  const rel = (ms) => r3(ms / 1000 - t0);
  const downs = rec.ev.filter((e) => e.k === 'pointerdown' && e.pt === 'touch');
  const ups = rec.ev.filter((e) => e.k === 'pointerup' && e.pt === 'touch');
  if (downs.length !== taps.length) console.warn(`warning: ${taps.length} taps sent, ${downs.length} touch pointerdowns seen`);
  const out = {
    generated_by: 'tools/record_app.mjs',
    what: 'The resident files the hook\'s report in the real LamTo app (Flutter web build) and finds it under "Việc của tôi".',
    recorded: new Date().toISOString(),
    source: {
      app: 'LamTo app/build/web against the design sandbox API (a throwaway copy of lamto_design)',
      main_dart_js: sha(path.join(LAMTO, 'app/build/web/main.dart.js')),
      lamto_commit: sh('git', ['-C', LAMTO, 'rev-parse', '--short', 'HEAD']),
      account: RESIDENT,
    },
    viewport: [390, 844], dpr: 3, size: [1170, 2532],
    note: 'Times in s from frame 0. Positions in CSS px of the 390 x 844 viewport (frame px = 3x). No photo: the web build cannot attach one. '
      + 'Chromium\'s tap highlight (a browser overlay, not the app\'s) is turned off for the capture; the app\'s own ripples are in the frames.',
    text: HOOK,
    frames: frames.map((f) => [r3(f.t - t0), f.file]),
    taps: taps.map((tp, i) => ({
      label: tp.label, x: tp.x, y: tp.y, box: tp.box,
      down: downs[i] ? rel(downs[i].t) : r3(tp.node - t0), up: ups[i] ? rel(ups[i].t) : null,
    })),
    keys: rec.ev.filter((e) => e.k === 'input').map((e) => [rel(e.t), e.n]),
    marks: { ...Object.fromEntries(Object.entries(rec.marks).map(([k, v]) => [k, rel(v)])), list: rel(listT) },
    boxes: { field: field && [field.x, field.y, field.width, field.height].map(r3), send: [send.x, send.y, send.width, send.height].map(r3), banner: banner && banner.map(r3) },
  };
  fs.writeFileSync(path.join(OUT, 'app.json'), JSON.stringify(out, null, 1));
  console.log(`app: ${frames.length} frames over ${out.frames.at(-1)[0]} s, ${out.taps.length} taps, ${out.keys.length} keys`);
}

// ------------------------------------------------------------------------------------------------ the laptop
async function recordWeb() {
  const { browser, ctx } = await launch(2, { width: 1440, height: 900 }, false);
  await ctx.addInitScript(pageLog, { confirmed: ['Đã xác nhận phân loại'] });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`${API}/accounts/login/`);
  await page.fill('input[name="username"]', MANAGER);
  await page.fill('input[type="password"]', PASSWORD);
  await Promise.all([page.waitForNavigation(), page.click('button[type="submit"]')]);
  await page.goto(`${API}/s/reports/7/`);
  await page.waitForLoadState('networkidle');
  // Boxes of what the scene points at, in CSS px of the page (scrollY 0).
  const boxes = (when) => page.evaluate((w) => {
    const box = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return [r.x, r.y + scrollY, r.width, r.height].map((v) => Math.round(v * 10) / 10); };
    const area = (e) => { const r = e.getBoundingClientRect(); return r.width * r.height; };
    const norm = (e) => e.textContent.replace(/\s+/g, ' ').trim();
    // The smallest element whose text starts with s (or, with all, contains every string of it).
    const byText = (s, all) => [...document.querySelectorAll('body *')]
      .filter((e) => e.getBoundingClientRect().width > 0 && (all ? all.every((x) => norm(e).includes(x)) && !(all.not || []).some((x) => norm(e).includes(x)) : norm(e).startsWith(s)))
      .sort((a, b) => area(a) - area(b))[0];
    const btn = [...document.querySelectorAll('button')].find((b) => /Xác nhận phân loại/.test(b.textContent));
    if (w === 'triage') {
      const line = byText('Gợi ý Thang máy');
      return {
        heading: box(byText('Gợi ý trợ lý phân loại')), line: box(line),
        values: line ? [...line.querySelectorAll('strong, b')].map((s) => ({ text: s.textContent.trim(), box: box(s) })) : [],
        location: box(document.querySelector('select[name="location"]')), confirm: box(btn), panel: box(btn && btn.closest('form')),
        manager: box(byText('Kawaibu')),
      };
    }
    const chainAll = ['Báo cáo', 'Phân loại', 'Thanh toán', 'Hoàn tất'];
    chainAll.not = ['Chuỗi trách nhiệm'];
    return {
      banner: box(byText('Đã xác nhận phân loại')), decision_heading: box(byText('Quyết định phân loại')),
      decision: box(byText('Kawaibu đã chấp nhận')), chain_heading: box(byText('Chuỗi trách nhiệm')),
      chain: box(byText(null, chainAll)), manager: box(byText('Kawaibu')),
    };
  }, when);
  const before = await boxes('triage');
  if (!before.line || !before.location || !before.confirm) throw new Error(`triage page not as expected: ${JSON.stringify(before)}`);
  const mouse = [];
  let cur = { x: 724, y: 862 };
  await page.mouse.move(cur.x, cur.y);
  await page.evaluate(() => { window.__rec.ev = []; window.__rec.marks = {}; });
  // A smooth cursor move: ease in and out, about 60 Hz, logged as it is sent.
  const move = async (x, y, ms) => {
    const n = Math.max(2, Math.round(ms / 16));
    const a = { ...cur };
    for (let i = 1; i <= n; i++) {
      const u = i / n;
      const e = u * u * (3 - 2 * u);
      const p = { x: a.x + (x - a.x) * e, y: a.y + (y - a.y) * e };
      await page.mouse.move(p.x, p.y);
      mouse.push([Date.now() / 1000, r3(p.x), r3(p.y)]);
      await sleep(16);
    }
    cur = { x, y };
  };
  const clicks = [];
  const click = async (label) => {
    const t = Date.now() / 1000;
    await page.mouse.down();
    await sleep(90);
    await page.mouse.up();
    clicks.push({ label, x: r3(cur.x), y: r3(cur.y), node: t });
  };

  const cast = await screencast(ctx, page, path.join(OUT, 'web'), [2880, 1800], 90);
  await sleep(1000);
  const ly = before.line[1] + before.line[3] * 0.62;
  await move(before.line[0] + 12, ly + 16, 700); // to the start of the suggestion
  await move(before.line[0] + before.line[2] - 6, ly + 16, 1800); // along it, reading
  await sleep(600);
  const L = before.location;
  await move(L[0] + L[2] * 0.62, L[1] + L[3] * 0.5, 800);
  await sleep(250);
  await click('Vị trí');
  await sleep(450);
  // The native list opens (headless Chromium draws it outside the page, so it is not in the frames): choose
  // Tầng 1 / Thang máy A with the keyboard, as a user can.
  const target = await page.evaluate(() => [...document.querySelectorAll('select[name="location"] option')].findIndex((o) => o.value === '49'));
  for (let i = 0; i < target; i++) {
    await page.keyboard.press('ArrowDown');
    await sleep(35);
  }
  await page.keyboard.press('Enter');
  await sleep(500);
  let picked = await page.evaluate(() => document.querySelector('select[name="location"]').value);
  const via = picked === '49' ? 'keyboard' : 'selectOption';
  if (picked !== '49') {
    await page.selectOption('select[name="location"]', '49');
    picked = '49';
  }
  const B = before.confirm;
  await move(B[0] + B[2] * 0.66, B[1] + B[3] * 0.56, 700);
  await sleep(380);
  // The form submits to a new document, which starts a fresh page log: keep this page's log first.
  const pre = await page.evaluate(() => window.__rec);
  await Promise.all([page.waitForNavigation(), click('Xác nhận phân loại')]);
  await page.waitForLoadState('networkidle');
  await sleep(1200);
  const after = await boxes('case');
  await move(700, 600, 600);
  await sleep(150);
  for (let i = 0; i < 7; i++) {
    await page.mouse.wheel(0, 49);
    await sleep(45);
  }
  await sleep(1800);
  const scrolled = await page.evaluate(() => scrollY);
  const frames = await cast.stop();
  const rec = await page.evaluate(() => window.__rec);
  await browser.close();
  if (errors.length) console.warn('page errors while recording the web:\n' + errors.join('\n'));

  const t0 = frames[0].t;
  const rel = (ms) => r3(ms / 1000 - t0);
  // The page's own events from both documents (the triage page's and the case page's), and the node-side log of
  // what was sent (cursor moves and clicks); all in s from frame 0.
  const out = {
    generated_by: 'tools/record_app.mjs',
    what: 'Kawaibu confirms the AI suggestion\'s triage of report #7 in the real LamTo workspace and scrolls to the chain.',
    recorded: new Date().toISOString(),
    source: { app: 'LamTo Django workspace, design settings, on a throwaway copy of lamto_design', lamto_commit: sh('git', ['-C', LAMTO, 'rev-parse', '--short', 'HEAD']), account: MANAGER },
    viewport: [1440, 900], dpr: 2, size: [2880, 1800],
    note: 'Times in s from frame 0. Positions in CSS px of the 1440 x 900 viewport (frame px = 2x); boxes in page px (add scroll to map to the viewport). The location list is native and not in the frames; it was chosen ' + (via === 'keyboard' ? 'with the keyboard.' : 'with selectOption after the keyboard failed.'),
    frames: frames.map((f) => [r3(f.t - t0), f.file]),
    mouse: mouse.map(([t, x, y]) => [r3(t - t0), x, y]),
    clicks: clicks.map(({ node, ...c }) => ({ ...c, down: r3(node - t0) })),
    page_events: [...pre.ev, ...rec.ev].filter((e) => e.k !== 'move').map((e) => ({ ...e, t: rel(e.t) })),
    marks: Object.fromEntries(Object.entries({ ...pre.marks, ...rec.marks }).map(([k, v]) => [k, rel(v)])),
    location: { value: picked, label: 'Tầng 1 / Thang máy A', via },
    scroll: scrolled,
    boxes: { triage: before, case: after },
  };
  fs.writeFileSync(path.join(OUT, 'web.json'), JSON.stringify(out, null, 1));
  console.log(`web: ${frames.length} frames over ${out.frames.at(-1)[0]} s, ${out.clicks.length} clicks, scrolled to ${scrolled}`);
}

// ------------------------------------------------------------------------------------------------ marks from the frames
// Landmarks read from the frames themselves (pixels, in frame px), for the moments the page logs don't time exactly.
// listed: after the back tap, the first frame of "Việc của tôi" with the new report on it. The list fades in with its
// old two reports first and refreshes a moment later; its third row's card (white) only exists once the new report is
// listed, where the old list shows the page's grey.
function pixel(file, x, y) {
  return Number(sh('magick', [file, '-format', `%[fx:int(255*p{${x},${y}}.r)]`, 'info:']));
}
function frameMarks() {
  const file = path.join(OUT, 'app.json');
  const rec = JSON.parse(fs.readFileSync(file, 'utf8'));
  const back = rec.taps.find((tp) => tp.label === 'Quay lại').down;
  // CSS (350, 500): inside the third row's card, right of its text; CSS (10, 500): the page's margin beside it.
  const card = (name) => pixel(path.join(OUT, 'app', name), 350 * 3, 500 * 3);
  const margin = (name) => pixel(path.join(OUT, 'app', name), 10 * 3, 500 * 3);
  const f = rec.frames.find(([t, name]) => t > back && card(name) >= 254 && margin(name) <= 246);
  if (!f) throw new Error('no frame shows the new report listed');
  rec.marks.listed = f[0];
  fs.writeFileSync(file, JSON.stringify(rec, null, 1));
  console.log(`app marks: listed at ${f[0]} s`);
}

// ------------------------------------------------------------------------------------------------ main
if (args.includes('--marks')) { // recompute the frame marks only (no sandbox)
  frameMarks();
  process.exit(0);
}
const state = {};
const status0 = sh('git', ['-C', LAMTO, 'status', '--porcelain']);
try {
  await sandboxUp(state);
  if (!only || only === 'app') await recordApp();
  if (!only || only === 'web') await recordWeb();
  if (!only || only === 'app') frameMarks();
} finally {
  await sandboxDown(state);
  const status1 = sh('git', ['-C', LAMTO, 'status', '--porcelain']);
  if (status1 !== status0) console.warn(`warning: ~/Projects/LamTo's working tree changed:\n${status1}`);
  console.log(`sandbox restored (copy dropped${state.started ? ', lamto-db-1 stopped again' : ''})`);
}
