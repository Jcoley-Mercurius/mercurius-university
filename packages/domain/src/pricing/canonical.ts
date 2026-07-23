function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalize(entry)]),
    );
  }
  return value;
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

// Browser-safe synchronous SHA-256; no Node, network, or environment dependency.
export function sha256(message: string): string {
  const rotate = (value: number, amount: number): number =>
    (value >>> amount) | (value << (32 - amount));
  const maxWord = 2 ** 32;
  const words: number[] = [];
  const hash: number[] = [];
  const constants: number[] = [];
  const bytes = new TextEncoder().encode(message);
  const bitLength = bytes.length * 8;
  const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLength - 8, Math.floor(bitLength / maxWord), false);
  view.setUint32(paddedLength - 4, bitLength >>> 0, false);

  let candidate = 2;
  while (constants.length < 64) {
    let prime = true;
    for (let factor = 2; factor * factor <= candidate; factor += 1) {
      if (candidate % factor === 0) {
        prime = false;
        break;
      }
    }
    if (prime) {
      if (hash.length < 8) hash.push((Math.sqrt(candidate) * maxWord) | 0);
      constants.push((candidate ** (1 / 3) * maxWord) | 0);
    }
    candidate += 1;
  }

  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let index = 0; index < 16; index += 1) {
      words[index] = view.getUint32(offset + index * 4, false);
    }
    for (let index = 16; index < 64; index += 1) {
      const w15 = words[index - 15] ?? 0;
      const w2 = words[index - 2] ?? 0;
      const gamma0 = rotate(w15, 7) ^ rotate(w15, 18) ^ (w15 >>> 3);
      const gamma1 = rotate(w2, 17) ^ rotate(w2, 19) ^ (w2 >>> 10);
      words[index] =
        ((words[index - 16] ?? 0) +
          gamma0 +
          (words[index - 7] ?? 0) +
          gamma1) |
        0;
    }

    let [a, b, c, d, e, f, g, h] = hash;
    for (let index = 0; index < 64; index += 1) {
      const sigma1 =
        rotate(e ?? 0, 6) ^ rotate(e ?? 0, 11) ^ rotate(e ?? 0, 25);
      const choice = ((e ?? 0) & (f ?? 0)) ^ (~(e ?? 0) & (g ?? 0));
      const temp1 =
        ((h ?? 0) +
          sigma1 +
          choice +
          (constants[index] ?? 0) +
          (words[index] ?? 0)) |
        0;
      const sigma0 =
        rotate(a ?? 0, 2) ^ rotate(a ?? 0, 13) ^ rotate(a ?? 0, 22);
      const majority =
        ((a ?? 0) & (b ?? 0)) ^
        ((a ?? 0) & (c ?? 0)) ^
        ((b ?? 0) & (c ?? 0));
      const temp2 = (sigma0 + majority) | 0;
      h = g;
      g = f;
      f = e;
      e = ((d ?? 0) + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }
    hash[0] = ((hash[0] ?? 0) + (a ?? 0)) | 0;
    hash[1] = ((hash[1] ?? 0) + (b ?? 0)) | 0;
    hash[2] = ((hash[2] ?? 0) + (c ?? 0)) | 0;
    hash[3] = ((hash[3] ?? 0) + (d ?? 0)) | 0;
    hash[4] = ((hash[4] ?? 0) + (e ?? 0)) | 0;
    hash[5] = ((hash[5] ?? 0) + (f ?? 0)) | 0;
    hash[6] = ((hash[6] ?? 0) + (g ?? 0)) | 0;
    hash[7] = ((hash[7] ?? 0) + (h ?? 0)) | 0;
  }
  return hash
    .map((value) => (value >>> 0).toString(16).padStart(8, "0"))
    .join("");
}

export function deepFreeze<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
  }
  return value;
}
