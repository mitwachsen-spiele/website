const { chromium } = require('@playwright/test');
const fs = require('fs');
const b64 = (f) => fs.readFileSync(f).toString('base64');
const html = `<!doctype html><html><head><style>
@font-face{font-family:Px;src:url(data:font/woff2;base64,${b64('/Users/lmichaelis/projects/github.com/mitwachsen-spiele/website/node_modules/@fontsource/pixelify-sans/files/pixelify-sans-latin-700-normal.woff2')})}
@font-face{font-family:Nu;src:url(data:font/woff2;base64,${b64('/Users/lmichaelis/projects/github.com/mitwachsen-spiele/website/node_modules/@fontsource/nunito/files/nunito-latin-800-normal.woff2')})}
body{margin:0}</style></head><body><canvas id=c width=3600 height=1200></canvas>
<img id=wb src="data:image/png;base64,${b64('wb.png')}"><img id=ks src="data:image/png;base64,${b64('ks.png')}">
</body></html>`;
(async () => {
  const br = await chromium.launch(); const p = await br.newPage({ viewport: { width: 3600, height: 1200 } });
  await p.setContent(html); await p.evaluate(() => document.fonts.ready);
  await p.evaluate(async () => { await document.fonts.load('100px Px'); await document.fonts.load('40px Nu'); });
  const data = await p.evaluate(() => {
    const c = document.getElementById('c'), x = c.getContext('2d');
    const wb = document.getElementById('wb'), ks = document.getElementById('ks');
    // links Wiese, rechts Kai, schräge Naht
    const top = 1980, bot = 1620;
    x.save(); x.beginPath(); x.moveTo(0,0); x.lineTo(top,0); x.lineTo(bot,1200); x.lineTo(0,1200); x.clip(); x.drawImage(wb, 0, 0, 2000, 1200); x.restore();
    x.save(); x.beginPath(); x.moveTo(top,0); x.lineTo(3600,0); x.lineTo(3600,1200); x.lineTo(bot,1200); x.clip(); x.drawImage(ks, 1600, 0, 2000, 1200); x.restore();
    // Naht: helle Kante mit dunkler Kontur
    x.lineCap='butt'; x.strokeStyle='#1d2838'; x.lineWidth=22; x.beginPath(); x.moveTo(top,-10); x.lineTo(bot,1210); x.stroke();
    x.strokeStyle='#fffdf7'; x.lineWidth=12; x.stroke();
    // leichte Vignette unten, damit das Schild steht
    const vg = x.createLinearGradient(0,700,0,1200); vg.addColorStop(0,'rgba(20,24,34,0)'); vg.addColorStop(1,'rgba(20,24,34,.25)'); x.fillStyle=vg; x.fillRect(0,700,3600,500);
    // Schild in der Mitte
    const cx = 1800, cy = 560, w = 1240, h = 330, ang = -0.025;
    x.save(); x.translate(cx, cy); x.rotate(ang);
    // Pfosten
    for (const px of [-430, 430]) { x.fillStyle='#5b3a22'; x.fillRect(px-24, 100, 48, 600); x.fillStyle='rgba(0,0,0,.18)'; x.fillRect(px+8,100,16,600); x.strokeStyle='#1d2838'; x.lineWidth=8; x.strokeRect(px-24,100,48,600); }
    // Schatten
    x.fillStyle='rgba(20,12,6,.35)'; roundRect(x, -w/2+22, -h/2+26, w, h, 26); x.fill();
    // Holz
    const g = x.createLinearGradient(0,-h/2,0,h/2); g.addColorStop(0,'#dcae74'); g.addColorStop(.5,'#c99456'); g.addColorStop(1,'#b37b42');
    x.fillStyle=g; roundRect(x,-w/2,-h/2,w,h,26); x.fill();
    // Fuge zwischen zwei Brettern
    x.fillStyle='rgba(90,55,25,.55)'; x.fillRect(-w/2+14, 28, w-28, 6); x.fillStyle='rgba(255,230,190,.35)'; x.fillRect(-w/2+14, 34, w-28, 4);
    // Maserung
    let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    x.strokeStyle='rgba(110,70,35,.28)'; x.lineWidth=4;
    for (let i=0;i<14;i++){ const y=-h/2+30+r()*(h-60); const x0=-w/2+40+r()*w*.5; const l=200+r()*500; x.beginPath(); x.moveTo(x0,y); x.bezierCurveTo(x0+l*.3,y-6,x0+l*.7,y+6,x0+l,y); x.stroke(); }
    // Licht oben
    const lg = x.createLinearGradient(0,-h/2,0,-h/2+60); lg.addColorStop(0,'rgba(255,240,210,.45)'); lg.addColorStop(1,'rgba(255,240,210,0)'); x.fillStyle=lg; roundRect(x,-w/2,-h/2,w,h,26); x.fill();
    // Rahmen
    x.strokeStyle='#1d2838'; x.lineWidth=12; roundRect(x,-w/2,-h/2,w,h,26); x.stroke();
    // Nägel
    for (const [nx,ny] of [[-w/2+40,-h/2+40],[w/2-40,-h/2+40],[-w/2+40,h/2-40],[w/2-40,h/2-40]]) { x.fillStyle='#4a4f57'; x.beginPath(); x.arc(nx,ny,15,0,7); x.fill(); x.strokeStyle='#1d2838'; x.lineWidth=5; x.stroke(); x.fillStyle='rgba(255,255,255,.5)'; x.beginPath(); x.arc(nx-4,ny-4,5,0,7); x.fill(); }
    // Titel: Gold mit Verlauf, dunkle Kontur, Schatten
    x.textAlign='center'; x.textBaseline='alphabetic'; x.font='700 124px Px';
    const t='Mitwachsen-Spiele', ty=-12;
    x.fillStyle='rgba(40,22,8,.55)'; x.fillText(t, 8, ty+10);
    x.lineJoin='round'; x.strokeStyle='#1d2838'; x.lineWidth=22; x.strokeText(t,0,ty);
    const tg = x.createLinearGradient(0,ty-120,0,ty); tg.addColorStop(0,'#fff3c4'); tg.addColorStop(.45,'#ffd47e'); tg.addColorStop(1,'#f0a531'); x.fillStyle=tg; x.fillText(t,0,ty);
    // Unterzeile
    x.font='700 52px Px'; const u='www.mitwachsen-spiele.de';
    x.fillStyle='rgba(255,236,200,.5)'; x.fillText(u,0,106);
    x.fillStyle='#3b2412'; x.fillText(u,0,102);
    x.restore();
    function roundRect(x,a,b,w,h,r){x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath();}
    return c.toDataURL('image/png');
  });
  fs.writeFileSync('banner.png', Buffer.from(data.split(',')[1], 'base64'));
  await br.close(); console.log('ok');
})();
