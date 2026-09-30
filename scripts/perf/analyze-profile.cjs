// Top functions by self and inclusive time from a .cpuprofile:   node scripts/perf/analyze-profile.cjs NAME
const fs=require('fs');const p=JSON.parse(fs.readFileSync(process.argv[2]+'.cpuprofile'));
const nodes=new Map(p.nodes.map(n=>[n.id,n])); const parent=new Map(); p.nodes.forEach(n=>(n.children||[]).forEach(c=>parent.set(c,n.id)));
const dt=p.timeDeltas; const self=new Map(); let total=0;
p.samples.forEach((id,i)=>{const d=(dt[i]||0)/1000; total+=d; self.set(id,(self.get(id)||0)+d)});
const key=n=>{const f=n.callFrame;return (f.functionName||'(anon)')+' '+(f.url.split('/').pop()||'')+':'+f.lineNumber};
const selfBy=new Map(),incBy=new Map();
for(const [id,t] of self){const n=nodes.get(id);const k=key(n);selfBy.set(k,(selfBy.get(k)||0)+t);
  const seen=new Set();let cur=id;while(cur!==undefined){const kk=key(nodes.get(cur));if(!seen.has(kk)){seen.add(kk);incBy.set(kk,(incBy.get(kk)||0)+t)}cur=parent.get(cur)}}
const top=(m,n)=>[...m].sort((a,b)=>b[1]-a[1]).slice(0,n).map(([k,v])=>v.toFixed(0).padStart(6)+' ms  '+k).join('\n');
console.log('total sampled',total.toFixed(0),'ms; idle',(selfBy.get('(idle) :0')||0).toFixed(0),'ms; program',(selfBy.get('(program) :0')||0).toFixed(0),'gc',(selfBy.get('(garbage collector) :0')||0).toFixed(0));
console.log('\nTOP SELF:\n'+top(selfBy,22)); console.log('\nTOP INCLUSIVE (world/app functions):\n'+top(new Map([...incBy].filter(([k])=>/world-v6|Portfolio|tpl\/|audio|support/.test(k))),34));
