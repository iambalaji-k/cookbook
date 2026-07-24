/**
 * Screen Wake Lock API Utility
 * Prevents the phone/tablet screen from dimming or sleeping during kitchen cooking mode.
 */

export interface WakeLockState {
  isSupported: boolean;
  isActive: boolean;
  error: string | null;
}

export class ScreenWakeLockController {
  private sentinel: any = null;

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'wakeLock' in navigator;
  }

  public async requestWakeLock(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    try {
      this.sentinel = await (navigator as any).wakeLock.request('screen');
      
      this.sentinel.addEventListener('release', () => {
        this.sentinel = null;
      });

      return true;
    } catch (err: any) {
      console.warn('Wake Lock request failed:', err.message);
      this.sentinel = null;
      return false;
    }
  }

  public async releaseWakeLock(): Promise<void> {
    if (this.sentinel) {
      try {
        await this.sentinel.release();
      } catch (_) {}
      this.sentinel = null;
    }
  }

  public isActive(): boolean {
    return this.sentinel !== null && !this.sentinel.released;
  }
}

export const wakeLockController = new ScreenWakeLockController();
