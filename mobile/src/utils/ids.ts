import * as Crypto from 'expo-crypto';

export function createRandomId(): string {
  return Crypto.randomUUID();
}

export function createStableWorkerId(identifier: string): string {
  let hash = 5381;
  for (let i = 0; i < identifier.length; i += 1) {
    hash = (hash * 33) ^ identifier.charCodeAt(i);
  }

  const partA = (hash >>> 0).toString(16).padStart(8, '0');
  let hashB = 0;
  for (let i = 0; i < identifier.length; i += 1) {
    hashB = (hashB << 5) - hashB + identifier.charCodeAt(i);
    hashB |= 0;
  }
  const partB = (hashB >>> 0).toString(16).padStart(8, '0');

  return `${partA}-${partB.slice(0, 4)}-4000-8000-${partB}${partA}`.slice(0, 36);
}
