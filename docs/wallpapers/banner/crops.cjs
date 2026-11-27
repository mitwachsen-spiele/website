const sharp = require('sharp');
const W = '/Users/lmichaelis/projects/github.com/mitwachsen-spiele/website/src/assets/wallpapers/';
(async () => {
  // je Hälfte 1800 × 1200 (3:2) aus der Bildmitte, ohne die Schilder unten rechts
  await sharp(W + 'weltenbummler.png').extract({ left: 1080, top: 370, width: 2333, height: 1400 }).resize(2000, 1200).png().toFile('wb.png');
  await sharp(W + 'kistenschieber.png').extract({ left: 540, top: 300, width: 2333, height: 1400 }).resize(2000, 1200).png().toFile('ks.png');
  console.log('ok');
})();
