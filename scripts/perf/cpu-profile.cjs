// Records a Chrome CPU profile of the page load into <name>.cpuprofile.   LOWEND=1 node scripts/perf/cpu-profile.cjs URL SLOWDOWN SECONDS NAME [sw]
// "sw" forces software GL (SwiftShader), a stand-in for a machine with no usable GPU. Needs: npm install --no-save puppeteer-core
const puppeteer=require('puppeteer-core'),fs=require('fs');
(async()=>{
 const url=process.argv[2]||'http://localhost:8775/', rate=+process.argv[3]||4, secs=+process.argv[4]||14, out=process.argv[5]||'prof', sw=process.argv[6]==='sw';
 const args=['--no-sandbox','--ignore-gpu-blocklist']; if(process.env.LOWEND) {} if(sw) args.push('--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader');
 const b=await puppeteer.launch({executablePath:process.env.CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:'new',args});
 const p=await b.newPage(); if(process.env.LOWEND) await p.evaluateOnNewDocument(()=>{Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>4});Object.defineProperty(navigator,'deviceMemory',{get:()=>4})}); await p.setViewport({width:412,height:823,deviceScaleFactor:1});
 const c=await p.createCDPSession(); await c.send('Emulation.setCPUThrottlingRate',{rate}); await c.send('Profiler.enable'); await c.send('Profiler.setSamplingInterval',{interval:500});
 await p.evaluateOnNewDocument(()=>{
  const S={links:0,stallMs:0,stalls:[],parallelExt:null,firstFrame:null,compileMs:0};window.__S=S;
  for(const C of [WebGLRenderingContext,WebGL2RenderingContext]){
   const gp=C.prototype.getProgramParameter, lp=C.prototype.linkProgram, ge=C.prototype.getExtension;
   C.prototype.linkProgram=function(p){S.links++;return lp.call(this,p)};
   C.prototype.getProgramParameter=function(p,k){const t=performance.now();const r=gp.call(this,p,k);const d=performance.now()-t;if(k===this.LINK_STATUS&&d>5){S.stallMs+=d;S.stalls.push(Math.round(d))}return r};
   C.prototype.getExtension=function(n){const r=ge.call(this,n);if(n==='KHR_parallel_shader_compile')S.parallelExt=!!r;return r};
  }
  requestAnimationFrame(function f(){S.frames=(S.frames||0)+1;if(S.frames===1)S.firstFrame=Math.round(performance.now());requestAnimationFrame(f)});
 });
 await c.send('Profiler.start');
 await p.goto(url,{waitUntil:'domcontentloaded'});
 await new Promise(r=>setTimeout(r,secs*1000));
 const {profile}=await c.send('Profiler.stop'); fs.writeFileSync(out+'.cpuprofile',JSON.stringify(profile));
 const m=await p.evaluate(()=>({S:{links:__S.links,stallMs:Math.round(__S.stallMs),stallCount:__S.stalls.length,top:__S.stalls.sort((a,b)=>b-a).slice(0,8),parallelExt:__S.parallelExt,frames:__S.frames},gl:(()=>{const g=document.createElement('canvas').getContext('webgl2');const e=g&&g.getExtension('WEBGL_debug_renderer_info');return e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):'?'})()}));
 console.log(JSON.stringify(m)); await b.close();
})();
