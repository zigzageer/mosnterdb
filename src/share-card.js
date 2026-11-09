import QRCode from 'qrcode';
import { SITE_URL, trackingLink, normalizeProfile } from './tracking.js';

const imageCache = new Map();
function loadImage(src) {
  if (!imageCache.has(src)) imageCache.set(src, new Promise((resolve,reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => { imageCache.delete(src); reject(new Error('A can photo could not load. Check your connection and try again.')); };
    image.src = new URL(src, document.baseURI).href;
  }));
  return imageCache.get(src);
}
function text(ctx, value, x, y, font, color='#eeeede') {
  ctx.font=font;ctx.fillStyle=color;ctx.fillText(value,x,y);
}
function fit(ctx, value, x, y, maxWidth, size, color) {
  while(size>24) { ctx.font=`${size}px Anton`;if(ctx.measureText(value).width<=maxWidth)break;size--; }
  text(ctx,value,x,y,`${size}px Anton`,color);
}
function wrapped(ctx, value, x, y, width, lineHeight) {
  const words=value.split(/\s+/);let line='';const lines=[];
  for(const word of words) { const test=line?`${line} ${word}`:word;if(ctx.measureText(test).width>width&&line){lines.push(line);line=word;}else line=test; }
  if(line)lines.push(line);
  lines.slice(0,2).forEach((value,index)=>{
    if(index===1&&lines.length>2){while(ctx.measureText(value+'…').width>width)value=value.slice(0,-1);value+='…';}
    ctx.fillText(value,x,y+index*lineHeight);
  });
}
function star(ctx,x,y,r) {
  ctx.save();ctx.translate(x,y);ctx.rotate(.16);ctx.beginPath();
  for(let i=0;i<16;i++){const a=i*Math.PI/8-Math.PI/2;const d=i%2?r*.27:r;i?ctx.lineTo(Math.cos(a)*d,Math.sin(a)*d):ctx.moveTo(Math.cos(a)*d,Math.sin(a)*d);}
  ctx.closePath();const g=ctx.createLinearGradient(-r,-r,r,r);g.addColorStop(0,'#fff');g.addColorStop(.4,'#777');g.addColorStop(.52,'#fff');g.addColorStop(1,'#777');ctx.fillStyle=g;ctx.fill();ctx.restore();
}

function ratingStar(ctx,x,y,r,filled) {
  ctx.save();ctx.translate(x,y);ctx.beginPath();
  for(let i=0;i<10;i++) {
    const angle=i*Math.PI/5-Math.PI/2, radius=i%2?r*.44:r;
    i?ctx.lineTo(Math.cos(angle)*radius,Math.sin(angle)*radius):ctx.moveTo(Math.cos(angle)*radius,Math.sin(angle)*radius);
  }
  ctx.closePath();ctx.strokeStyle=filled?'#b6ff00':'#586047';ctx.lineWidth=1.3;
  if(filled){ctx.fillStyle='#b6ff00';ctx.fill();}ctx.stroke();ctx.restore();
}

export async function makeShareCard(value, catalog) {
  const profile=normalizeProfile(value);
  const selected=new Set(profile.tried);
  const cans=catalog.filter(can=>selected.has(can.id));
  const columns=cans.length<=4?4:cans.length<=15?5:cans.length<=36?6:8;
  const width=1080,padding=48,cell=(width-padding*2)/columns;
  const photoHeight=columns===8?150:columns===6?180:220;
  const hasRatings=Boolean(profile.ratings);
  const rowHeight=photoHeight+(hasRatings?126:92);
  const rows=Math.max(1,Math.ceil(cans.length/columns));
  const height=Math.max(1350,500+rows*rowHeight+250);
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  canvas.id='share-canvas';canvas.setAttribute('role','img');canvas.setAttribute('aria-label',`Share graphic with ${cans.length} tried cans and a QR code linking to this list`);
  const ctx=canvas.getContext('2d');
  if(!ctx)throw new Error('Your browser could not create the share graphic. You can still copy your tracking link.');
  await Promise.all([document.fonts.load('80px Anton'),document.fonts.load('20px "Space Mono"'),document.fonts.load('20px "DM Sans"')]);
  const [images,qr]=await Promise.all([
    Promise.all(cans.map(can=>loadImage(can.image))),
    QRCode.toDataURL(trackingLink(profile),{width:164,margin:2,errorCorrectionLevel:'M',color:{dark:'#090909',light:'#b6ff00'}}).then(loadImage),
  ]);
  ctx.fillStyle='#0a0a0a';ctx.fillRect(0,0,width,height);
  ctx.strokeStyle='#ffffff09';ctx.lineWidth=1;
  for(let x=0;x<width;x+=54){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,height);ctx.stroke();}
  for(let y=0;y<height;y+=54){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke();}
  ctx.fillStyle='#b6ff00';ctx.fillRect(0,0,width,18);
  text(ctx,'THE UNOFFICIAL MONSTER FLAVOR PASSPORT',padding,60,'17px "Space Mono"','#b6ff00');
  text(ctx,'MONSTER//DB',padding,117,'35px Anton');
  star(ctx,980,118,53);
  fit(ctx,profile.name?`${profile.name.toUpperCase()}’S`:'MY MONSTER',padding,218,850,80,'#eeeede');
  text(ctx,'TRIED LIST.',padding,312,'86px Anton','#b6ff00');
  const percent=Math.round(cans.length/catalog.length*100);
  ctx.fillStyle='#22251b';ctx.fillRect(padding,342,width-padding*2,104);
  text(ctx,String(cans.length).padStart(2,'0'),padding+20,424,'74px Anton','#b6ff00');
  text(ctx,`OF ${catalog.length} FLAVORS TRIED`,padding+166,387,'20px "Space Mono"');
  text(ctx,`${catalog.length-cans.length} STILL ON THE HIT LIST`,padding+166,422,'14px "Space Mono"','#a8ae9d');
  text(ctx,`${percent}% EXPLORED`,width-300,385,'17px "Space Mono"','#b6ff00');
  ctx.fillStyle='#424735';ctx.fillRect(width-300,408,226,8);ctx.fillStyle='#b6ff00';ctx.fillRect(width-300,408,226*percent/100,8);
  text(ctx,'THE LINEUP // EVERY CAN BELOW IS MARKED AS TRIED',padding,480,'12px "Space Mono"','#a8ae9d');
  if(hasRatings) text(ctx,'STARS = MY RATINGS',width-272,480,'12px "Space Mono"','#b6ff00');
  if(!cans.length){text(ctx,'FIRST CAN.',padding+150,690,'85px Anton','#b6ff00');text(ctx,'NEXT CHAPTER.',padding+150,790,'85px Anton');text(ctx,'YOUR FLAVOR HUNT STARTS AT MONSTERDB.',padding+150,850,'16px "Space Mono"','#aaa');}
  cans.forEach((can,index)=>{
    const row=Math.floor(index/columns),col=index%columns;
    const remaining=Math.min(columns,cans.length-row*columns);
    const x=padding+col*cell+(columns-remaining)*cell/2,y=504+row*rowHeight;
    ctx.fillStyle='#181a15';ctx.fillRect(x+3,y,cell-6,rowHeight-12);
    ctx.fillStyle=can.color;ctx.fillRect(x+3,y,cell-6,3);
    text(ctx,`M//${can.number}`,x+12,y+23,'10px "Space Mono"','#a6ac98');
    const image=images[index];const scale=Math.min((cell-32)/image.width,photoHeight/image.height);
    const iw=image.width*scale,ih=image.height*scale;
    ctx.save();ctx.shadowColor='#0009';ctx.shadowBlur=8;ctx.shadowOffsetX=6;ctx.shadowOffsetY=7;ctx.drawImage(image,x+(cell-iw)/2,y+35+(photoHeight-ih)/2,iw,ih);ctx.restore();
    ctx.font=`${columns===8?15:19}px "DM Sans"`;ctx.fillStyle='#f0f1e8';ctx.textAlign='center';
    wrapped(ctx,can.name,x+cell/2,y+photoHeight+58,cell-18,columns===8?18:22);
    ctx.textAlign='left';
    if(hasRatings) {
      const rating=profile.ratings[can.id] || 0;
      if(rating) for(let i=0;i<5;i++) ratingStar(ctx,x+cell/2+(i-2)*17,y+photoHeight+105,7,i<rating);
      else {ctx.textAlign='center';text(ctx,'UNRATED',x+cell/2,y+photoHeight+110,'10px "Space Mono"','#8d977f');ctx.textAlign='left';}
    }
  });
  const footer=height-220;
  ctx.fillStyle='#b6ff00';ctx.fillRect(0,footer,width,220);
  text(ctx,'YOUR TASTE. YOUR RULES.',padding,footer+64,'39px Anton','#090909');
  text(ctx,'BUILD YOUR OWN TRIED LIST',padding,footer+106,'17px "Space Mono"','#090909');
  text(ctx,SITE_URL.replace(/^https:\/\//,'').replace(/\/$/,''),padding,footer+154,'27px "DM Sans"','#090909');
  text(ctx,'FAN-MADE. NOT AFFILIATED WITH MONSTER ENERGY.',padding,footer+192,'10px "Space Mono"','#344711');
  ctx.drawImage(qr,width-212,footer+24,164,164);
  text(ctx,'SCAN MY TRIED LIST',width-212,footer+205,'10px "Space Mono"','#090909');
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
  if(!blob)throw new Error('The PNG could not be created. Try again or copy your link.');
  return {canvas,blob,link:trackingLink(profile),count:cans.length};
}
