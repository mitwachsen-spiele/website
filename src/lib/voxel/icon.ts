// Das Seiten-Icon: ein Grasblock. Als SVG (favicon.svg) und gerastert für favicon.ico, PNG-Icons und apple-touch-icon.
import sharp from 'sharp';
import { CUBE_VIEWBOX } from './cube';
import { cubeFaces } from './render';
import { GRASS_SIDE, GRASS_TOP, PAL_GRASS } from './textures';

export function iconSvg(size?: number): string {
  const dims = size ? ` width="${size}" height="${size}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg"${dims} viewBox="${CUBE_VIEWBOX}">${cubeFaces(GRASS_TOP, GRASS_SIDE, GRASS_SIDE, PAL_GRASS)}</svg>`;
}

/**
 * Der Würfel mittig auf einer Fläche: Er nimmt den Anteil `fill` der Kantenlänge ein (z. B. 0,6 für Icons mit Maske,
 * deren sichere Zone ein Kreis über 80 % ist).
 */
export function framedIconSvg(size: number, background: string, fill: number): string {
  const inner = Math.round(size * Math.min(1, Math.max(0, fill)));
  const at = Math.round((size - inner) / 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="${background}"/><svg x="${at}" y="${at}" width="${inner}" height="${inner}" viewBox="${CUBE_VIEWBOX}">${cubeFaces(GRASS_TOP, GRASS_SIDE, GRASS_SIDE, PAL_GRASS)}</svg></svg>`;
}

/**
 * Quadratisches PNG; `background` z. B. für das apple-touch-icon, das keine Transparenz mag. Mit `fill` sitzt der
 * Würfel kleiner mittig auf dem Hintergrund (Icons der App).
 */
export function iconPng(size: number, background?: string, fill?: number): Promise<Buffer> {
  if (background && fill !== undefined)
    return sharp(Buffer.from(framedIconSvg(size, background, fill)))
      .png()
      .toBuffer();
  const img = sharp(Buffer.from(iconSvg(size)));
  return (background ? img.flatten({ background }) : img).png().toBuffer();
}

/** favicon.ico mit eingebettetem 32×32-PNG (ICO-Container: 6 Byte Kopf, 16 Byte Verzeichniseintrag, Bilddaten). */
export async function iconIco(): Promise<Buffer> {
  const png = await iconPng(32);
  const head = Buffer.alloc(22);
  head.writeUInt16LE(0, 0); // reserviert
  head.writeUInt16LE(1, 2); // Typ: Icon
  head.writeUInt16LE(1, 4); // ein Bild
  head.writeUInt8(32, 6); // Breite
  head.writeUInt8(32, 7); // Höhe
  head.writeUInt8(0, 8); // keine Farbpalette
  head.writeUInt8(0, 9); // reserviert
  head.writeUInt16LE(1, 10); // Farbebenen
  head.writeUInt16LE(32, 12); // Bit pro Pixel
  head.writeUInt32LE(png.length, 14); // Größe der Bilddaten
  head.writeUInt32LE(22, 18); // Beginn der Bilddaten
  return Buffer.concat([head, png]);
}
