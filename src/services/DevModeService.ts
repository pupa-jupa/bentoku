const DEV_MODE_STORAGE_KEY = 'bentoku.dev-mode';

export class DevModeService {
  private memoryEnabled = false;

  get enabled(): boolean {
    try {
      const stored = sessionStorage.getItem(DEV_MODE_STORAGE_KEY);
      if (stored !== null) this.memoryEnabled = stored === '1';
    } catch {
      // The current-page fallback still works when session storage is unavailable.
    }
    return this.memoryEnabled;
  }

  setEnabled(enabled: boolean): boolean {
    this.memoryEnabled = enabled;
    try {
      sessionStorage.setItem(DEV_MODE_STORAGE_KEY, enabled ? '1' : '0');
    } catch {
      // The current-page fallback still works when session storage is unavailable.
    }
    return this.memoryEnabled;
  }

  toggle(): boolean {
    return this.setEnabled(!this.enabled);
  }
}
