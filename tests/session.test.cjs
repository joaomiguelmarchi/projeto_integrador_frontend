const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function setup() {
  let now = 1000000;
  const data = new Map();
  const events = [];
  const context = { exports: {}, Date: { now: () => now }, crypto: { randomUUID: () => 'session-id' },
    localStorage: { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) },
    window: { dispatchEvent: event => events.push(event) }, CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } } };
  const source = fs.readFileSync('src/infrastructure/services/SessionStore.ts', 'utf8').replace('import.meta.env.VITE_SESSION_IDLE_MINUTES', '30');
  vm.runInNewContext(ts.transpile(source, { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }), context);
  return { ...context.exports, data, events, advance: ms => { now += ms; } };
}
test('legacy marker does not authenticate; session stores no token', () => {
 const s = setup(); s.data.set('usuario_logado', 'token'); assert.equal(s.SessionStore.valid(), false);
 s.SessionStore.start(7200); assert.equal(s.SessionStore.valid(), true); assert.equal(s.data.has('usuario_logado'), false);
 assert.deepEqual(Object.keys(s.SessionStore.read()).sort(), ['expiresAt','id','lastActivity']);
});
test('expires exactly at the idle deadline and cannot be revived by activity', () => {
 const s = setup(); s.SessionStore.start(7200); s.advance(s.IDLE_TIMEOUT - 1); assert.equal(s.SessionStore.valid(), true);
 s.advance(1); s.SessionStore.touch(); assert.equal(s.SessionStore.read(), null); assert.equal(s.events[0].detail, 'inactivity');
});
test('activity extends idle time but never absolute expiry', () => {
 const s = setup(); s.SessionStore.start(3600); s.advance(1700000); s.SessionStore.touch();
 s.advance(1700000); s.SessionStore.touch(); assert.equal(s.SessionStore.valid(), true);
 s.advance(200000); assert.equal(s.SessionStore.valid(), false); assert.equal(s.events[0].detail, 'expired');
});
test('logout clears state and malformed storage fails closed', () => {
 const s = setup(); s.SessionStore.start(7200); s.SessionStore.end('logout'); assert.equal(s.SessionStore.valid(), false);
 s.data.set(s.SESSION_KEY, '{broken'); assert.equal(s.SessionStore.valid(), false);
 s.data.set(s.SESSION_KEY, JSON.stringify({id:'x', lastActivity:'invalid', expiresAt:3})); assert.equal(s.SessionStore.valid(), false);
});
