// Avvio dell'app Mac (Electron) su Linux per le prove automatiche.
// Variabili: DCVT_ELECTRON (eseguibile electron), DCVT_PLAYWRIGHT (modulo playwright), DCVT_TEST_HOME (cartella home finta)
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { _electron: electron } = require(process.env.DCVT_PLAYWRIGHT || 'playwright');
exports.ROOT = ROOT;
exports.open = async (extraEnv) => {
  const app = await electron.launch({ executablePath: process.env.DCVT_ELECTRON || require('electron'), args: ['--no-sandbox', path.join(ROOT, 'build', 'mac-app')],
    env: Object.assign({}, process.env, { HOME: process.env.DCVT_TEST_HOME || path.join(ROOT, 'build', 'test-home'), DCVT_FFMPEG_BASE: 'http://127.0.0.1:8765' }, extraEnv || {}) });
  const w = await app.firstWindow();
  w.errs = []; w.on('console', m => { if (m.type() === 'error') w.errs.push(m.text()); }); w.on('pageerror', e => w.errs.push('PAGEERR ' + e.message));
  await w.waitForTimeout(1500);
  await w.evaluate(() => { window.confirm = () => true; window.alert = () => {}; });
  return { app, w };
};
exports.waitIdle = async (w, ms) => { const t0 = Date.now(); await w.waitForTimeout(800); while (Date.now() - t0 < ms) { if (!(await w.evaluate(() => state.busy))) return true; await w.waitForTimeout(500); } return false; };
