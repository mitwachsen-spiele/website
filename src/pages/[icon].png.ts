// PNG-Icon: das apple-touch-icon (180 × 180, mit Himmel als Hintergrund), beim Build gerendert. Eine App ist die
// Homepage nicht; die Icons der App liefert das Spiel auf seiner eigenen Adresse.
import { iconPng } from '../lib/voxel/icon';
import { SKY_2 } from '../data/site';

const ICONS: Record<string, { size: number; background?: string }> = {
  'apple-touch-icon': { size: 180, background: SKY_2 },
};

export function getStaticPaths() {
  return Object.keys(ICONS).map((icon) => ({ params: { icon } }));
}

export async function GET({ params }: { params: { icon: string } }) {
  const icon = ICONS[params.icon];
  if (!icon) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(await iconPng(icon.size, icon.background)), {
    headers: { 'Content-Type': 'image/png' },
  });
}
