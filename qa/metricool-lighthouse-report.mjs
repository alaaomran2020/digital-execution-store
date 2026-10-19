import fs from "node:fs";
import path from "node:path";
const dir=process.argv[2];
const md=a=>{a=a.sort((x,y)=>x-y);return (a[0]+a[1])/2;};
const format=(v,d=0)=>Number.isFinite(v)?v.toFixed(d):"N/A";
const result={};
for(const device of ["mobile","desktop"])for(const type of ["baseline","candidate"]){
 const runs=[1,2].map(n=>{
  const l=JSON.parse(fs.readFileSync(path.join(dir,type+"-"+device+"-"+n+".json"),"utf8"));
  if(l.runtimeError)throw Error(l.runtimeError.message);
  const r=l.audits?.["network-requests"]?.details?.items||[];
  const m=r.filter(x=>x.url?.includes("metricool.com"));
  return {score:(l.categories.performance.score||0)*100,lcp:l.audits["largest-contentful-paint"].numericValue,fcp:l.audits["first-contentful-paint"].numericValue,tbt:l.audits["total-blocking-time"].numericValue,cls:l.audits["cumulative-layout-shift"].numericValue,speed:l.audits["speed-index"].numericValue,bytes:r.reduce((s,x)=>s+(x.transferSize||0),0),metricool:m.map(x=>({url:x.url,status:x.statusCode})),script:m.filter(x=>x.url.includes("tracker.metricool.com/resources/be.js")).length};
 });
 result[type+"-"+device]={runs,score:md(runs.map(x=>x.score)),lcp:md(runs.map(x=>x.lcp)),fcp:md(runs.map(x=>x.fcp)),tbt:md(runs.map(x=>x.tbt)),cls:md(runs.map(x=>x.cls)),speed:md(runs.map(x=>x.speed)),bytes:md(runs.map(x=>x.bytes))};
}
const lines=["# Actual Lighthouse — main vs Metricool draft","","Real Chrome audits with Lighthouse 12, on two separate local web servers under identical GitHub Actions runner conditions. 2 runs per combination. Mobile/desktop simulated throttling. Not live-site field data.","","| Device | Before | After | Δ score | LCP before | LCP after | Δ LCP |","|---|---:|---:|---:|---:|---:|---:|"];
for(const d of ["mobile","desktop"]){const b=result["baseline-"+d],a=result["candidate-"+d];lines.push("| "+d+" | "+format(b.score,1)+" | "+format(a.score,1)+" | "+format(a.score-b.score,1)+" | "+format(b.lcp)+" ms | "+format(a.lcp)+" ms | "+format(a.lcp-b.lcp)+" ms |");}
lines.push("","| Device | Variant | FCP ms | TBT ms | CLS | Speed Index ms | Transfer bytes |","|---|---|---:|---:|---:|---:|---:|");
for(const d of ["mobile","desktop"])for(const v of ["baseline","candidate"]){const r=result[v+"-"+d];lines.push("| "+d+" | "+v+" | "+format(r.fcp)+" | "+format(r.tbt)+" | "+format(r.cls,3)+" | "+format(r.speed)+" | "+format(r.bytes)+" |");}
let detected=true;lines.push("","## Metricool requests detected");
for(const d of ["mobile","desktop"]){const r=result["candidate-"+d];const n=r.runs.map(x=>x.script);if(!n.every(x=>x===1))detected=false;lines.push("- "+d+": exact vendor script fetches per run "+n.join("/")+".");for(const run of r.runs)lines.push("  - "+(run.metricool.map(x=>x.url+" (HTTP "+x.status+")").join("; ")||"No vendor request detected"));}
lines.push("","This is a lab comparison on localhost: actual deployment-specific field data and privacy/consent remain unverified.");
if(!detected)lines.push("**INCONCLUSIVE: vendor be.js not loaded exactly once in all candidate runs.**");
const out=lines.join("\n")+"\n";
fs.writeFileSync(path.join(dir,"summary.md"),out);
fs.writeFileSync(path.join(dir,"summary.json"),JSON.stringify({result,detected},null,2));
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,out);
console.log(out);if(!detected)process.exitCode=2;
