const xmur3 = (value: string): (() => number) => {
  let hash = 1779033703 ^ value.length;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  return () => {
    hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
    hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
    return (hash ^= hash >>> 16) >>> 0;
  };
};

export class SeededRandom {
  private state: number;

  constructor(seed: string) {
    this.state = xmur3(seed)();
  }

  next(): number {
    this.state += 0x6d2b79f5;
    let value = this.state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }

  int(maxExclusive: number): number {
    return Math.floor(this.next() * maxExclusive);
  }

  pick<T>(items: readonly T[]): T {
    const picked = items[this.int(items.length)];
    if (picked === undefined) throw new Error('Cannot pick from an empty list.');
    return picked;
  }

  shuffle<T>(items: readonly T[]): T[] {
    const result = items.slice();
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = this.int(index + 1);
      [result[index], result[swapIndex]] = [result[swapIndex]!, result[index]!];
    }
    return result;
  }
}

export const normalizeSeed = (seed: string): string => {
  const clean = seed
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  if (!clean) return createRandomSeed();
  const payload = clean.startsWith('BENTO') ? clean.slice(5) : clean;
  const padded = `${payload}BENTOKUJOY`.slice(0, 8);
  return `BENTO-${padded.slice(0, 4)}-${padded.slice(4, 8)}`;
};

export const createRandomSeed = (): string => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(8);
  if (typeof crypto !== 'undefined') crypto.getRandomValues(bytes);
  else bytes.forEach((_, index) => (bytes[index] = Math.floor(Math.random() * 256)));
  const chars = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
  return `BENTO-${chars.slice(0, 4)}-${chars.slice(4, 8)}`;
};

export const createDailySeed = (date = new Date()): string => {
  const yy = `${date.getFullYear()}`.slice(-2);
  const mm = `${date.getMonth() + 1}`.padStart(2, '0');
  const dd = `${date.getDate()}`.padStart(2, '0');
  return normalizeSeed(`D${yy}${mm}${dd}`);
};
