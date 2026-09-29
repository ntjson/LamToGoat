// Static checks for a chapter module against docs/ANIMATION_GUIDE.md.
//   node tools/lint_scene.mjs scenes/ch03.js [more files]
// ERROR: breaks a hard rule (render purity, NFC text, cross-chapter imports, film-absolute time, CSS motion).
// WARN: usually wrong, justify it if you keep it (opacity, visibility 'visible', small font literals).
import fs from 'node:fs';

const rules = [
  ['error', /Math\.random|Date\.now|new Date|performance\.now/, 'nondeterministic: use hash()/rng() from lib/motion.js at build time'],
  ['error', /setTimeout|setInterval|requestAnimationFrame/, 'timers are banned: render(t) must be a pure function of t'],
  ['error', /\btransition\s*:|\banimation\s*:|\.animate\(|@keyframes/, 'CSS transitions/animations are banned: drive everything from render(t)'],
  ['error', /from\s+['"]\.\/ch\d\d/, 'chapters may not import each other'],
  ['error', /ctx\.start|ctx\.end\b/, 'film-absolute time: use ctx.line()/ctx.syl()/ctx.dur'],
  ['error', /fetch\(|XMLHttpRequest/, 'no network access from scenes: facts are in the code, crops come via ctx.crop()'],
  ['error', /assets\/screens\/[^'"`]*['"`]/, 'screenshots only through plate(ctx, shot) / ctx.crop(shot), never by path'],
  ['error', /assets\/team\/[^'"`]*['"`]/, 'team photos only through ctx.portrait(k) (docs/team.json), never by path'],
  ['warn', /opacity/, 'nothing fades: appear by visibility plus scale/translate/clip'],
  ['warn', /['"]visible['"]/, "use vis(el, on) (visibility 'inherit'), not 'visible'"],
  ['warn', /filter\s*:\s*['"`][^'"`]*(blur|drop-shadow\([^)]*\b(1[5-9]|[2-9]\d)px)/, 'no blur/glow; paper shadows stay small and hard'],
];

let errors = 0;
for (const file of process.argv.slice(2)) {
  const src = fs.readFileSync(file, 'utf8');
  if (src.normalize('NFC') !== src) {
    const i = [...src].findIndex((c, k, a) => c.normalize('NFC') !== c || (a[k + 1] && (c + a[k + 1]).normalize('NFC').length === 1));
    console.log(`${file}: ERROR text is not NFC (first at char ${i})`);
    errors++;
  }
  src.split('\n').forEach((line, n) => {
    const code = line.replace(/\/\/.*$/, '');
    for (const [level, re, why] of rules) {
      if (re.test(code)) {
        console.log(`${file}:${n + 1}: ${level.toUpperCase()} ${why}\n    ${line.trim()}`);
        if (level === 'error') errors++;
      }
    }
    for (const m of code.matchAll(/(?:fontSize\s*:\s*[`'"]?|\bsize\s*:\s*)(\d+(?:\.\d+)?)/g)) {
      if (Number(m[1]) < 28) console.log(`${file}:${n + 1}: WARN font size ${m[1]} px is under 28 (fine only if it is scaled up on screen)`);
    }
  });
}
console.log(errors ? `${errors} error(s)` : 'lint ok');
process.exitCode = errors ? 1 : 0;
