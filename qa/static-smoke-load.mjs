// Bounded localhost smoke/load test. This does not benchmark the CDN or
// generate any traffic toward the production domain.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {performance} from 'node:perf_hooks';

const root=process.cwd();
const routes=['/','/tools/','/services/graphic-design/','/guides/','/products/','/script.js','/sitemap.xml'];
const server=http.createServer(async(req,res)=>{
  try{
    const pathname=new URL(req.url,'http://localhost').pathname;
    const safe=pathname.endsWith('/')?pathname+'index.html':pathname;
    const target=path.resolve(root,'.'+safe);
    if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return}
    const contents=await fs.readFile(target);
    res.writeHead(200,{'Content-Type':target.endsWith('.html')?'text/html; charset=utf-8':'application/octet-stream'});
    res.end(contents);
  }catch{res.writeHead(404).end()}
});

await new Promise((resolve,reject)=>{
  server.once('error',reject);
  server.listen(0,'127.0.0.1',resolve);
});
try{
  const origin='http://127.0.0.1:'+server.address().port;
  const durations=[];
  const results=[];
  const work=Array.from({length:4},(_,worker)=>async()=>{
    for(let index=worker;index<48;index+=4){
      const route=routes[index%routes.length];
      const started=performance.now();
      const response=await fetch(origin+route,{signal:AbortSignal.timeout(5000)});
      const html=await response.text();
      durations.push(performance.now()-started);
      results.push({route,status:response.status});
      assert.equal(response.status,200,route+' must return 200');
      if(route==='/products/'){
        assert.match(html,/عرض المنتجات متوقف حاليًا/,'Paused catalog notice must survive HTTP delivery');
        assert.match(html,/noindex,nofollow/,'Paid catalog must stay noindex');
      }
      if(route==='/')assert.match(html,/href="\/tools\/"/,'Free tools must remain reachable');
    }
  });
  await Promise.all(work.map(run=>run()));
  durations.sort((a,b)=>a-b);
  const p95=durations[Math.ceil(durations.length*.95)-1];
  console.log('PASS '+results.length+' localhost smoke/load responses, concurrency=4, HTTP errors=0, p95='+p95.toFixed(1)+'ms (local only)');
}finally{
  await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
}
