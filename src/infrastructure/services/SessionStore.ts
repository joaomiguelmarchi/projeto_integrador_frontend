export const SESSION_KEY = 'smilehub.session.v1';
export const SESSION_ENDED = 'smilehub:session-ended';
const configuredMinutes = Number(import.meta.env.VITE_SESSION_IDLE_MINUTES);
export const IDLE_TIMEOUT = (Number.isFinite(configuredMinutes) && configuredMinutes > 0 ? configuredMinutes : 30) * 60_000;
export type EndReason = 'logout' | 'inactivity' | 'expired' | 'remote';
interface Session { id: string; lastActivity: number; expiresAt: number }
export const SessionStore = {
  read(): Session | null {
    try {
      const value = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      return value && typeof value.id === 'string' && Number.isFinite(value.lastActivity) && Number.isFinite(value.expiresAt) ? value : null;
    } catch { return null; }
  },
  start(expirationSeconds: number) {
    const now = Date.now();
    localStorage.removeItem('usuario_logado');
    localStorage.setItem(SESSION_KEY, JSON.stringify({ id: crypto.randomUUID(), lastActivity: now, expiresAt: now + expirationSeconds * 1000 }));
  },
  end(reason: EndReason) {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('usuario_logado');
    window.dispatchEvent(new CustomEvent(SESSION_ENDED, { detail: reason }));
  },
  valid() {
    const session = this.read();
    if (!session) return false;
    const now = Date.now();
    if (now >= session.expiresAt || now - session.lastActivity >= IDLE_TIMEOUT) {
      this.end(now >= session.expiresAt ? 'expired' : 'inactivity');
      return false;
    }
    return true;
  },
  touch() {
    if (!this.valid()) return;
    const session = this.read();
    if (session && Date.now() - session.lastActivity >= 1000) {
      session.lastActivity = Date.now();
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
  }
};
