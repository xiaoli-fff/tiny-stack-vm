import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

const IN = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const OUT = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const K = "#4d')-.2ssssssss,,,,,,,(,,,(,,,(,,,sssssssssssssCGGC#sssssssssss(+ssssssssssssss''$'";
const F = [
  (a,b) => (a + b) | 0, (a,b) => (a - b) | 0, Math.imul,
  (a,b) => (a / b) | 0, (a,b) => (b === -1 ? 0 : (a % b) | 0),
  (a,b) => Math.floor((a >>> 0) / (b >>> 0)) | 0, (a,b) => ((a >>> 0) % (b >>> 0)) | 0,
  0, (a,b) => a & b, (a,b) => a | b, (a,b) => a ^ b, 0,
  (a,b) => a << (b & 31), (a,b) => a >> (b & 31), (a,b) => (a >>> (b & 31)) | 0, 0,
  (a,b) => (a === b ? 1 : 0), (a,b) => (a < b ? 1 : 0), (a,b) => ((a >>> 0) < (b >>> 0) ? 1 : 0),
];
function run(p, inp) {
  const n = p.length, S = new Int32Array(256), C = new Int32Array(64), M = new Int32Array(256);
  const out = [];
  let sp = 0, cp = 0, pc = 0, ip = 0, st = 0, a, b, v, s, rel;
  for (;;) {
    if (st === 1e6) return [out, 10];
    if (pc < 0 || pc >= n) return [out, 9];
    const op = p[pc];
    if (op > 83 || K.charCodeAt(op) - 35 === 80) return [out, 5];
    const e = K.charCodeAt(op) - 35;
    const im = e >> 4, po = (e >> 2) & 3, pu = e & 3;
    if (pc + im >= n) return [out, 9];
    st++;
    const nx = pc + 1 + im;
    if (sp < po) return [out, 2];
    if (sp - po + pu > 256) return [out, 3];
    pc = nx;
    switch (op) {
      case 0: return [out, 0];
      case 1: S[sp++] = (p[nx - 1] << 24) >> 24; break;
      case 2: S[sp++] = p[nx - 4] | (p[nx - 3] << 8) | (p[nx - 2] << 16) | (p[nx - 1] << 24); break;
      case 3: sp--; break;
      case 4: S[sp] = S[sp - 1]; sp++; break;
      case 5: a = S[sp - 1]; S[sp - 1] = S[sp - 2]; S[sp - 2] = a; break;
      case 6: S[sp] = S[sp - 2]; sp++; break;
      case 7: a = S[sp - 3]; S[sp - 3] = S[sp - 2]; S[sp - 2] = S[sp - 1]; S[sp - 1] = a; break;
      case 23: S[sp - 1] = -S[sp - 1] | 0; break;
      case 27: S[sp - 1] = ~S[sp - 1]; break;
      case 16: case 17: case 18: case 19: case 20: case 21: case 22:
      case 24: case 25: case 26: case 28: case 29: case 30: case 32: case 33: case 34:
        b = S[sp - 1]; a = S[sp - 2];
        if (op >= 19 && op <= 22 && !b) return [out, 4];
        sp -= 2;
        S[sp++] = F[op - 16](a, b);
        break;
      case 48: case 49: case 50:
        rel = ((p[nx - 2] | (p[nx - 1] << 8)) << 16) >> 16;
        if (op === 48) { pc = nx + rel; break; }
        v = S[--sp];
        if ((op === 49) === (v === 0)) pc = nx + rel;
        break;
      case 51:
        if (cp === 64) return [out, 7];
        C[cp++] = nx;
        pc = p[nx - 2] | (p[nx - 1] << 8);
        break;
      case 52:
        if (!cp) return [out, 8];
        pc = C[--cp];
        break;
      case 64:
        a = S[sp - 1];
        if (a < 0 || a > 255) return [out, 6];
        S[sp - 1] = M[a];
        break;
      case 65:
        a = S[sp - 1]; v = S[sp - 2];
        if (a < 0 || a > 255) return [out, 6];
        sp -= 2;
        M[a] = v;
        break;
      case 80:
        s = String(S[sp - 1]);
        if (out.length + s.length > 65536) return [out, 11];
        sp--;
        for (const c of s) out.push(c.charCodeAt(0));
        break;
      case 81:
        if (out.length + 1 > 65536) return [out, 11];
        out.push(S[--sp] & 255);
        break;
      case 82: S[sp++] = ip < inp.length ? inp[ip++] : -1; break;
      case 83: return [out, S[--sp] & 255];
    }
  }
}

for (const id of readdirSync(IN).sort()) {
  const [o, c] = run(readFileSync(IN + '/' + id + '/program.bin'), readFileSync(IN + '/' + id + '/input.bin'));
  mkdirSync(OUT + '/' + id, { recursive: true });
  writeFileSync(OUT + '/' + id + '/stdout.bin', Uint8Array.from(o));
  writeFileSync(OUT + '/' + id + '/exit.txt', c + '\n');
}
