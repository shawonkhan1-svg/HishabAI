let registration: ServiceWorkerRegistration | undefined;

export const APP_VERSION = process.env.NEXT_PUBLIC_BUILD_ID ?? 'dev';

/**
 * Registers /sw.js and wires OTA updates:
 *  - checks for a new deploy on load, hourly, and whenever the app regains focus
 *  - calls onUpdate(apply) when a new version is installed and waiting
 *  - apply() activates it; the page reloads once the new worker takes control
 */
export async function registerServiceWorker(onUpdate: (apply: () => void) => void) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  registration = await navigator.serviceWorker.register('/sw.js');
  const reg = registration;

  const offer = (w: ServiceWorker) => onUpdate(() => w.postMessage({ type: 'SKIP_WAITING' }));

  if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);

  reg.addEventListener('updatefound', () => {
    const w = reg.installing;
    if (!w) return;
    w.addEventListener('statechange', () => {
      if (w.state === 'installed' && navigator.serviceWorker.controller) offer(w);
    });
  });

  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded) return;
    reloaded = true;
    window.location.reload();
  });

  setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') reg.update().catch(() => {});
  });
}

/** Manual "check for update". Resolves true if a new version was found. */
export async function checkForUpdate(): Promise<boolean> {
  if (!registration) return false;
  await registration.update();
  return !!registration.waiting || !!registration.installing;
}
