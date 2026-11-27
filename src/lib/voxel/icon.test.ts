import { describe, expect, it } from 'vitest';
import { framedIconSvg, iconIco, iconPng, iconSvg } from './icon';

describe('Seiten-Icon', () => {
  it('ist ein SVG, mit Größe nur auf Wunsch', () => {
    expect(iconSvg()).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" viewBox="[^"]+">.+<\/svg>$/);
    expect(iconSvg(32)).toContain(' width="32" height="32"');
  });

  it('packt ein 32×32-PNG in einen gültigen ICO-Container', async () => {
    const ico = await iconIco();
    expect([ico.readUInt16LE(2), ico.readUInt16LE(4), ico[6], ico[7]]).toEqual([1, 1, 32, 32]);
    expect(ico.readUInt32LE(14)).toBe(ico.length - 22);
    expect(ico.subarray(22, 26).toString('latin1')).toBe('\x89PNG');
  });

  it('setzt den Würfel für Icons der App kleiner mittig auf eine Fläche', async () => {
    const svg = framedIconSvg(100, '#8dd0ee', 0.6);
    expect(svg).toContain('<rect width="100" height="100" fill="#8dd0ee"/>');
    expect(svg).toContain('<svg x="20" y="20" width="60" height="60"');
    expect(framedIconSvg(100, '#fff', 2)).toContain('x="0" y="0" width="100" height="100"');
    const png = await iconPng(64, '#8dd0ee', 0.6);
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([64, 64]);
  });
});
