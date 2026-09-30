// Frame rate, draw calls, shader programs and long tasks of the ride, on a low-end profile (4 cores, 4 GB) with a CPU slowdown.
//   node scripts/perf/frame-stats.cjs "http://localhost:8775/?perf" 6 18 1366x768 low     (url, slowdown, seconds, viewport, low|hi)
// The ?perf query makes world-v7.js expose window.__apW for the scene statistics. Needs: npm install --no-save puppeteer-core
const puppeteer=require('puppeteer-core');
(async()=>{
 const url=process.argv[2], rate=+process.argv[3]||4, secs=+process.argv[4]||14, vp=(process.argv[5]||'1366x768').split('x').map(Number), low=process.argv[6]!=='hi';
 const b=await puppeteer.launch({executablePath:process.env.CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new',args:['--no-sandbox','--ignore-gpu-blocklist']});
 const p=await b.newPage(); await p.setViewport({width:vp[0],height:vp[1]});
 const c=await p.createCDPSession(); await c.send('Emulation.setCPUThrottlingRate',{rate});
 if(low) await p.evaluateOnNewDocument(()=>{Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>4});Object.defineProperty(navigator,'deviceMemory',{get:()=>4})});
 await p.evaluateOnNewDocument(()=>{const S=window.__S={links:0,draws:0,ft:[],pf:[],long:[],firstDraw:null};
  for(const C of [WebGLRenderingContext,WebGL2RenderingContext]){const lp=C.prototype.linkProgram;C.prototype.linkProgram=function(p){S.links++;return lp.call(this,p)};
   for(const f of ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced']){const o=C.prototype[f];C.prototype[f]=function(){if(S.firstDraw===null)S.firstDraw=Math.round(performance.now());S.draws++;return o.apply(this,arguments)}}}
  let last=performance.now(),d0=0;requestAnimationFrame(function f(){const n=performance.now();S.ft.push(n-last);S.pf.push(S.draws-d0);d0=S.draws;last=n;requestAnimationFrame(f)});
  new PerformanceObserver(l=>l.getEntries().forEach(e=>S.long.push([Math.round(e.startTime),Math.round(e.duration)]))).observe({entryTypes:['longtask']});});
 await p.goto(url,{waitUntil:'domcontentloaded'}); await new Promise(r=>setTimeout(r,secs*1000));
 const r=await p.evaluate(()=>{const S=__S,avg=a=>a.reduce((x,y)=>x+y,0)/(a.length||1),sc=(window.__apW||{}).scene,R=(window.__apW||{}).renderer;
  let objs=0,meshes=0,inst=0,instCount=0,vis=0,lights=0,shadowCasters=0,skinned=0,pts=0,sprites=0,lines=0;const mats=new Set(),geos=new Set();
  if(sc)sc.traverse(o=>{objs++;if(o.isLight)lights++;if(o.isMesh||o.isPoints||o.isLine||o.isSprite){meshes++;if(o.isPoints)pts++;if(o.isSprite)sprites++;if(o.isLine)lines++;if(o.visible)vis++;if(o.castShadow)shadowCasters++;if(o.isInstancedMesh){inst++;instCount+=o.count}if(o.isSkinnedMesh)skinned++;(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m&&mats.add(m.uuid));o.geometry&&geos.add(o.geometry.uuid)}});
  return {firstDrawMs:S.firstDraw,lowPathActive:(window.__apW||{}).lowPower,links:S.links,steadyFps:+(1000/avg(S.ft.slice(-90))).toFixed(1),drawsPerFrame:Math.round(avg(S.pf.slice(-90))),worst:S.ft.slice().sort((a,b)=>b-a).slice(0,5).map(Math.round),longMs:S.long.reduce((a,b)=>a+b[1],0),longN:S.long.length,
   scene:{objs,meshes,visibleMeshes:vis,instancedMeshes:inst,instances:instCount,lights,shadowCasters,skinned,points:pts,sprites,lines,uniqueMaterials:mats.size,uniqueGeometries:geos.size},programs:R&&R.info.programs.length,mem:R&&R.info.memory,pr:R&&R.getPixelRatio(),canvas:R&&[R.domElement.width,R.domElement.height]}});
 console.log(JSON.stringify(r)); await b.close();
})();
