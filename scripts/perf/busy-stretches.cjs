// Lists the uninterrupted busy stretches (long tasks) in a .cpuprofile and what runs in them:   node scripts/perf/busy-stretches.cjs NAME 100
const fs=require('fs');const p=JSON.parse(fs.readFileSync(process.argv[2]+'.cpuprofile'));const min=+process.argv[3]||120;
const nodes=new Map(p.nodes.map(n=>[n.id,n]));const parent=new Map();p.nodes.forEach(n=>(n.children||[]).forEach(c=>parent.set(c,n.id)));
const name=n=>{const f=n.callFrame;return (f.functionName||'(anon)')+' '+(f.url.split('/').pop()||'')+':'+f.lineNumber};
let t=p.startTime,segs=[],cur=null;
p.samples.forEach((id,i)=>{const d=(p.timeDeltas[i]||0)/1000;t+=p.timeDeltas[i]||0;const n=nodes.get(id);const idle=/\(idle\)|\(program\)/.test(n.callFrame.functionName);
 if(idle){if(cur){segs.push(cur);cur=null}}else{if(!cur)cur={start:(t-p.startTime)/1000,dur:0,fn:new Map(),top:new Map()};cur.dur+=d;
  cur.fn.set(name(n),(cur.fn.get(name(n))||0)+d);
  // top-level app function: walk up to find the outermost non-native frame
  let c=id,last=null;while(c!==undefined){const nn=nodes.get(c);if(/world-v7|world-v6|support\.js|Portfolio|audio/.test(nn.callFrame.url))last=name(nn);c=parent.get(c)}
  if(last)cur.top.set(last,(cur.top.get(last)||0)+d)}});
if(cur)segs.push(cur);
segs.filter(s=>s.dur>=min).sort((a,b)=>a.start-b.start).forEach(s=>{console.log('t='+s.start.toFixed(1)+'s busy '+s.dur.toFixed(0)+'ms  self:',[...s.fn].sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k,v])=>v.toFixed(0)+' '+k).join(' | '));console.log('     outer:',[...s.top].sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k,v])=>v.toFixed(0)+' '+k).join(' | '))});
