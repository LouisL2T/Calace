/**
 * Demo mode – detected automatically when no backend is reachable.
 * Can also be forced via ?demo=true in the URL.
 */

let _isDemoMode: boolean | null = null;

export async function isDemoMode(): Promise<boolean> {
  if (_isDemoMode !== null) return _isDemoMode;

  // Check URL param
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    if (params.get("demo") === "true") {
      _isDemoMode = true;
      return true;
    }
  }

  // Try to reach backend
  try {
    const res = await fetch("/health", { signal: AbortSignal.timeout(2000) });
    _isDemoMode = !res.ok;
  } catch {
    _isDemoMode = true;
  }

  return _isDemoMode;
}

export function forceDemoMode() {
  _isDemoMode = true;
}

export function isDemoModeSync(): boolean {
  return _isDemoMode ?? true;
}
