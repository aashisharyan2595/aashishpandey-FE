// Drives the bike with real key presses in explore mode (with a road-following autopilot) and prints acceleration, steering, braking, coasting and jump numbers.
//   node scripts/perf/physics-test.cjs "http://localhost:8775/Portfolio.dc.html?perf"      (needs: npm install --no-save puppeteer-core; ?perf exposes window.__apW.probe)
// Drives the bike with real key presses in explore mode and prints physics numbers.   node phys-test.cjs URL
const puppeteer=require('puppeteer-core');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new',args:['--no-sandbox','--ignore-gpu-blocklist']});
const p=await b.newPage();await p.setViewport({width:1200,height:800});const errs=[];p.on('pageerror',e=>errs.push(String(e).slice(0,140)));
await p.goto(process.argv[2],{waitUntil:'domcontentloaded'});await sleep(14000);
await p.evaluate(()=>{window.__ap.toggleFree();window.__rec=[];(function f(){const q=__apW.probe;__rec.push([performance.now(),q.fs,q.fh,q.lean,q.bike.rotation.x,q.bike.rotation.z,q.bike.position.y,q.grounded?1:0,q.PH?q.PH.steerVis:0]);requestAnimationFrame(f)})()});
await p.evaluate(()=>{window.__dir=()=>{const q=__apW.probe;const look=Math.max(8,q.fs*0.9),tz=q.fz-look,tx=q.roadX(tz);let hd=Math.atan2(-(tx-q.fx),-(tz-q.fz)),e=hd-q.fh;e=Math.atan2(Math.sin(e),Math.cos(e));return e>0.04?-1:e<-0.04?1:0}});
let ap=false,held=0,done=false;(async()=>{while(!done){if(ap){const d=await p.evaluate(()=>__dir());if(d!==held){if(held===-1)await p.keyboard.up('ArrowLeft');if(held===1)await p.keyboard.up('ArrowRight');if(d===-1)await p.keyboard.down('ArrowLeft');if(d===1)await p.keyboard.down('ArrowRight');held=d}}else if(held){if(held===-1)await p.keyboard.up('ArrowLeft');else await p.keyboard.up('ArrowRight');held=0}await sleep(35)}})();
await sleep(1500);
const mark=async(name,fn)=>{await p.evaluate(n=>{__rec.mark=__rec.length;__rec.name=n},name);await fn();return p.evaluate(()=>__rec.slice(__rec.mark))};
const kd=k=>p.keyboard.down(k),ku=k=>p.keyboard.up(k);
const out={};
const sum=(r,fn)=>fn(r.map(a=>({t:a[0]/1000,fs:a[1],fh:a[2],lean:a[3],pitch:a[4],roll:a[5],y:a[6],gr:a[7],sv:a[8]})));
// S1 accelerate
let r=await mark('accel',async()=>{ap=true;await kd('ArrowUp');await sleep(9000)});
out.accel=sum(r,a=>{const t0=a[0].t,at=s=>{const x=a.find(q=>q.t-t0>=s);return x?+x.fs.toFixed(1):null};return{'1s':at(1),'2s':at(2),'4s':at(4),'6s':at(6),'8s':at(8),top:+Math.max(...a.map(q=>q.fs)).toFixed(1)}});
// S2 steer right at speed
r=await mark('steer',async()=>{ap=false;await sleep(80);await kd('ArrowRight');await sleep(1500);await ku('ArrowRight');ap=true;await sleep(1200)});
out.steer=sum(r,a=>{let maxYr=0,maxLat=0,maxLean=0,tLean=null,t0=a[0].t;for(let i=1;i<a.length;i++){const dt=a[i].t-a[i-1].t;if(dt<=0)continue;let dy=a[i].fh-a[i-1].fh;dy=Math.atan2(Math.sin(dy),Math.cos(dy));const yr=Math.abs(dy/dt);if(yr>maxYr)maxYr=yr;const lat=yr*a[i].fs;if(lat>maxLat)maxLat=lat;if(Math.abs(a[i].lean)>maxLean){maxLean=Math.abs(a[i].lean)}}
 const lt=a.find(q=>Math.abs(q.lean)>0.5*maxLean);return{maxYawRate:+maxYr.toFixed(2),maxLatAcc:+maxLat.toFixed(1),maxLean:+maxLean.toFixed(2),timeToHalfLean:lt?+(lt.t-t0).toFixed(2):null,speedAfter:+a[a.length-1].fs.toFixed(1),maxSteerVis:+Math.max(...a.map(q=>Math.abs(q.sv))).toFixed(2)}});
// S3 brake
await sleep(300);
r=await mark('brake',async()=>{await ku('ArrowUp');await kd('ArrowDown');await sleep(3500);await ku('ArrowDown')});ap=true;
out.brake=sum(r,a=>{let pk=0,minPitch=0;const base=a[0].pitch;for(let i=1;i<a.length;i++){const dt=a[i].t-a[i-1].t;if(dt>0){const d=(a[i-1].fs-a[i].fs)/dt;if(d>pk&&d<60)pk=d}minPitch=Math.min(minPitch,a[i].pitch-base)}const z=a.find(q=>q.fs<0.3);return{startSpeed:+a[0].fs.toFixed(1),peakDecel:+pk.toFixed(1),stopTime:z?+(z.t-a[0].t).toFixed(2):null,pitchDelta:+minPitch.toFixed(3)}});
// S4 coast
await sleep(500);ap=true;await kd('ArrowUp');await sleep(7000);
r=await mark('coast',async()=>{await ku('ArrowUp');await sleep(4000)});
out.coast=sum(r,a=>({from:+a[0].fs.toFixed(1),after2s:+(a.find(q=>q.t-a[0].t>=2)||a[a.length-1]).fs.toFixed(1),after4s:+a[a.length-1].fs.toFixed(1)}));
// S5 jump
ap=true;await kd('ArrowUp');await sleep(3000);
r=await mark('jump',async()=>{await kd(' ');await sleep(120);await ku(' ');await sleep(2200)});
out.jump=sum(r,a=>{const air=a.filter(q=>!q.gr);const y0=a[0].y;return{airTime:air.length?+(air[air.length-1].t-air[0].t).toFixed(2):0,peakRise:+(Math.max(...a.map(q=>q.y))-y0).toFixed(2),maxPitchAir:+Math.max(...a.map(q=>Math.abs(q.pitch))).toFixed(2)}});
ap=false;await ku('ArrowUp');
console.log(JSON.stringify(out,null,1));console.log('errors:',JSON.stringify(errs));done=true;await sleep(200);await b.close()})();
