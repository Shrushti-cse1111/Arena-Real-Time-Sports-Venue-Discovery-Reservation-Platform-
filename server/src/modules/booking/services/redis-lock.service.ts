import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class RedisLockService {
  private readonly logger = new Logger(RedisLockService.name);
  private readonly localLocks = new Map<string, { token: string; expiresAt: number }>();

  /**
   * Acquire distributed lock with TTL (milliseconds)
   */
  async acquireLock(key: string, ttlMs = 10000): Promise<string | null> {
    const now = Date.now();
    const existing = this.localLocks.get(key);

    if (existing && existing.expiresAt > now) {
      // Lock is currently held
      return null;
    }

    const token = `lock-token-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    this.localLocks.set(key, { token, expiresAt: now + ttlMs });
    return token;
  }

  /**
   * Release lock securely using token
   */
  async releaseLock(key: string, token: string): Promise<boolean> {
    const existing = this.localLocks.get(key);
    if (!existing) return false;

    if (existing.token === token) {
      this.localLocks.delete(key);
      return true;
    }
    return false;
  }
}
