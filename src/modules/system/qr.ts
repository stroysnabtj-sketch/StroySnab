/**
 * Minimal ISO/IEC 18004 Byte-mode QR Code matrix generator (Versions 1-6, ECC Level L).
 * Used to embed scannable order status links in printable PDFs without native dependencies.
 */

type VersionSpec = {
  version: number;
  size: number;
  dataCodewords: number;
  ecPerBlock: number;
  blocks: number;
  align: number[];
};

const VERSIONS: VersionSpec[] = [
  { version: 1, size: 21, dataCodewords: 19, ecPerBlock: 7, blocks: 1, align: [] },
  { version: 2, size: 25, dataCodewords: 34, ecPerBlock: 10, blocks: 1, align: [6, 18] },
  { version: 3, size: 29, dataCodewords: 55, ecPerBlock: 15, blocks: 1, align: [6, 22] },
  { version: 4, size: 33, dataCodewords: 80, ecPerBlock: 20, blocks: 1, align: [6, 26] },
  { version: 5, size: 37, dataCodewords: 108, ecPerBlock: 26, blocks: 1, align: [6, 30] },
  { version: 6, size: 41, dataCodewords: 136, ecPerBlock: 18, blocks: 2, align: [6, 34] },
];

// GF(256) log/antilog tables with primitive polynomial 0x11d
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
{
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
}

function gfMul(a: number, b: number): number {
  return a === 0 || b === 0 ? 0 : GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsGenerator(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array<number>(poly.length + 1).fill(0);
    const root = GF_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], root);
    }
    poly = next;
  }
  return poly;
}

function rsRemainder(data: number[], ecLen: number): number[] {
  const gen = rsGenerator(ecLen);
  const res = [...data, ...new Array<number>(ecLen).fill(0)];
  for (let i = 0; i < data.length; i++) {
    const factor = res[i];
    if (factor !== 0) {
      for (let j = 0; j < gen.length; j++) {
        res[i + j] ^= gfMul(gen[j], factor);
      }
    }
  }
  return res.slice(data.length);
}

function encodeBytes(payload: Uint8Array, spec: VersionSpec): number[] {
  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1);
  };
  // Mode indicator 0100 (Byte), 8-bit character count for versions 1-9
  pushBits(0b0100, 4);
  pushBits(payload.length, 8);
  for (const byte of payload) pushBits(byte, 8);

  const totalBits = spec.dataCodewords * 8;
  const terminator = Math.min(4, totalBits - bits.length);
  pushBits(0, terminator);
  while (bits.length % 8 !== 0) bits.push(0);

  const codewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
    codewords.push(b);
  }
  const padBytes = [0xec, 0x11];
  let p = 0;
  while (codewords.length < spec.dataCodewords) {
    codewords.push(padBytes[p++ % 2]);
  }

  const blockSize = Math.floor(spec.dataCodewords / spec.blocks);
  const dataBlocks: number[][] = [];
  const ecBlocks: number[][] = [];
  for (let b = 0; b < spec.blocks; b++) {
    const slice = codewords.slice(b * blockSize, (b + 1) * blockSize);
    dataBlocks.push(slice);
    ecBlocks.push(rsRemainder(slice, spec.ecPerBlock));
  }

  const out: number[] = [];
  for (let i = 0; i < blockSize; i++) for (let b = 0; b < spec.blocks; b++) out.push(dataBlocks[b][i]);
  for (let i = 0; i < spec.ecPerBlock; i++) for (let b = 0; b < spec.blocks; b++) out.push(ecBlocks[b][i]);
  return out;
}

function formatBits(maskId: number): number {
  // ECC Level L = 01
  const data = (0b01 << 3) | maskId;
  let rem = data << 10;
  for (let i = 14; i >= 10; i--) {
    if ((rem >>> i) & 1) rem ^= 0b10100110111 << (i - 10);
  }
  return ((data << 10) | rem) ^ 0b101010000010010;
}

export function generateQrMatrix(text: string): boolean[][] {
  const bytes = new TextEncoder().encode(text);
  const spec =
    VERSIONS.find((v) => v.dataCodewords - 2 >= bytes.length) ?? VERSIONS[VERSIONS.length - 1];
  const clipped = bytes.slice(0, spec.dataCodewords - 2);
  const stream = encodeBytes(clipped, spec);
  const size = spec.size;

  const grid: (boolean | null)[][] = Array.from({ length: size }, () =>
    new Array<boolean | null>(size).fill(null),
  );
  const reserved: boolean[][] = Array.from({ length: size }, () =>
    new Array<boolean>(size).fill(false),
  );

  const setModule = (r: number, c: number, dark: boolean, lock = true) => {
    if (r < 0 || r >= size || c < 0 || c >= size) return;
    grid[r][c] = dark;
    if (lock) reserved[r][c] = true;
  };

  const drawFinder = (r0: number, c0: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const inBox = r >= 0 && r <= 6 && c >= 0 && c <= 6;
        const dark =
          inBox &&
          (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
        setModule(r0 + r, c0 + c, dark);
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    setModule(6, i, i % 2 === 0);
    setModule(i, 6, i % 2 === 0);
  }

  // Alignment patterns
  for (const r of spec.align) {
    for (const c of spec.align) {
      if (reserved[r][c]) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const dark = Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0);
          setModule(r + dr, c + dc, dark);
        }
      }
    }
  }

  // Dark module & reserve format info areas
  setModule(size - 8, 8, true);
  for (let i = 0; i < 9; i++) {
    if (i !== 6) {
      reserved[8][i] = true;
      reserved[i][8] = true;
    }
  }
  for (let i = size - 8; i < size; i++) {
    reserved[8][i] = true;
    reserved[i][8] = true;
  }

  // Place data bits in zig-zag columns
  let bitIdx = 0;
  const totalBits = stream.length * 8;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    const upward = ((size - 1 - right) & 2) === 0;
    for (let step = 0; step < size; step++) {
      const r = upward ? size - 1 - step : step;
      for (const c of [right, right - 1]) {
        if (reserved[r][c]) continue;
        let dark = false;
        if (bitIdx < totalBits) {
          dark = ((stream[bitIdx >>> 3] >>> (7 - (bitIdx & 7))) & 1) === 1;
          bitIdx++;
        }
        grid[r][c] = dark;
      }
    }
  }

  const maskFn = (mask: number, r: number, c: number) => {
    switch (mask) {
      case 0:
        return (r + c) % 2 === 0;
      case 1:
        return r % 2 === 0;
      case 2:
        return c % 3 === 0;
      case 3:
        return (r + c) % 3 === 0;
      case 4:
        return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
      case 5:
        return ((r * c) % 2) + ((r * c) % 3) === 0;
      case 6:
        return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
      default:
        return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
    }
  };

  const applyFormat = (mGrid: boolean[][], mask: number) => {
    const bits = formatBits(mask);
    for (let i = 0; i < 6; i++) mGrid[8][i] = ((bits >>> (14 - i)) & 1) === 1;
    mGrid[8][7] = ((bits >>> 8) & 1) === 1;
    mGrid[8][8] = ((bits >>> 7) & 1) === 1;
    mGrid[7][8] = ((bits >>> 6) & 1) === 1;
    for (let i = 0; i < 6; i++) mGrid[5 - i][8] = ((bits >>> (5 - i)) & 1) === 1;
    for (let i = 0; i < 8; i++) mGrid[8][size - 1 - i] = ((bits >>> i) & 1) === 1;
    for (let i = 0; i < 7; i++) mGrid[size - 1 - i][8] = ((bits >>> (14 - i)) & 1) === 1;
  };

  const scorePenalty = (mGrid: boolean[][]) => {
    let score = 0;
    for (let r = 0; r < size; r++) {
      let run = 1;
      for (let c = 1; c < size; c++) {
        if (mGrid[r][c] === mGrid[r][c - 1]) run++;
        else {
          if (run >= 5) score += run - 2;
          run = 1;
        }
      }
      if (run >= 5) score += run - 2;
    }
    for (let c = 0; c < size; c++) {
      let run = 1;
      for (let r = 1; r < size; r++) {
        if (mGrid[r][c] === mGrid[r - 1][c]) run++;
        else {
          if (run >= 5) score += run - 2;
          run = 1;
        }
      }
      if (run >= 5) score += run - 2;
    }
    return score;
  };

  let bestMatrix: boolean[][] = [];
  let bestScore = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    const candidate = grid.map((row, r) =>
      row.map((val, c) => (reserved[r][c] ? Boolean(val) : Boolean(val) !== maskFn(mask, r, c))),
    );
    applyFormat(candidate, mask);
    const penalty = scorePenalty(candidate);
    if (penalty < bestScore) {
      bestScore = penalty;
      bestMatrix = candidate;
    }
  }

  return bestMatrix;
}
