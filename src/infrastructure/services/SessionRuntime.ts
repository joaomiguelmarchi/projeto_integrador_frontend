import { api } from '../http/api';
import type { Router } from 'vue-router';
import { AuthService } from './AuthService';
import { SESSION_ENDED, SESSION_KEY, SessionStore, type EndReason } from './SessionStore';

export function installSessionRuntime(router: Router) {
  localStorage.removeItem('usuario_logado');
  const redirect = (reason: string) => {
    void router.replace({ name: 'login', query: { reason } });
  };
  const ended = (event: Event) => {
    const reason = (event as CustomEvent<EndReason>).detail;
    // Only the initiating tab revokes the cookie; other tabs only clear their UI.
    if (reason === 'logout' || reason === 'inactivity') void AuthService.revoke().then(confirmed => {
      if (!confirmed && !SessionStore.read()) redirect('logout-unconfirmed');
    });
    redirect(reason);
  };
  const check = () => {
    const hadSession = !!SessionStore.read();
    if (!SessionStore.valid() && !hadSession && router.currentRoute.value.meta.requiresAuth) redirect('expired');
  };
  let lastServerActivity = 0;
  let syncing = false;
  const activity = (event: Event) => {
    if (!event.isTrusted || document.visibilityState !== 'visible') return;
    SessionStore.touch();
    if (import.meta.env.VITE_SESSION_ACTIVITY_SYNC === 'true' && SessionStore.valid() && !syncing && Date.now() - lastServerActivity >= 60_000) {
      lastServerActivity = Date.now();
      syncing = true;
      // Sent only after human activity, never by the idle-check timer.
      void api.post('/user/session/activity').catch(() => {}).finally(() => { syncing = false; });
    }
  };
  const storage = (event: StorageEvent) => {
    if (event.key !== SESSION_KEY && event.key !== null) return;
    if (!SessionStore.read()) redirect('remote');
    else {
      let previous: { id?: string } | null = null;
      try { previous = event.oldValue ? JSON.parse(event.oldValue) : null; } catch { /* Malformed old state is treated as a different session. */ }
      if (previous?.id !== SessionStore.read()?.id) window.location.reload();
      else check();
    }
  };
  const resume = () => { check(); };
  window.addEventListener(SESSION_ENDED, ended);
  window.addEventListener('storage', storage);
  window.addEventListener('focus', resume);
  window.addEventListener('pageshow', resume);
  document.addEventListener('visibilitychange', resume);
  const events = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart'];
  events.forEach(name => window.addEventListener(name, activity, { passive: true }));
  const interval = window.setInterval(check, 1000);
  return () => {
    clearInterval(interval);
    window.removeEventListener(SESSION_ENDED, ended);
    window.removeEventListener('storage', storage);
    window.removeEventListener('focus', resume);
    window.removeEventListener('pageshow', resume);
    document.removeEventListener('visibilitychange', resume);
    events.forEach(name => window.removeEventListener(name, activity));
  };
}
