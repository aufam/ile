export function writeVarint(v, out) {
  while (v > 127) {
    out.push((v & 0x7f) | 0x80);
    v >>>= 7;
  }
  out.push(v);
}

export function writeString(field, str, out) {
  const bytes = new TextEncoder().encode(str);
  out.push((field << 3) | 2);
  writeVarint(bytes.length, out);
  out.push(...bytes);
}

export function writeBytes(field, bytes, out) {
  out.push((field << 3) | 2);
  writeVarint(bytes.length, out);
  out.push(...bytes);
}

export function writeUInt32(field, value, out) {
  out.push((field << 3) | 0);
  writeVarint(value, out);
}
