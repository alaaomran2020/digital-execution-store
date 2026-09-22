(() => {
const WA_NUMBER="201011673107";
const form=document.getElementById("healthForm");
const result=document.getElementById("result");
const formError=document.getElementById("formError");
if(!form||!result)return;

const bands=[
{min:80,key:"good",label:"80–100 · وضع جيد",title:"مؤشرات المخزون عندك جيدة.",description:"النواقص محدودة وتغطية إعادة الطلب جيدة نسبيًا. حافظ على نفس الانضباط وراقب أي زيادة في الأصناف أو ضغط التشغيل.",next:"الخطوة المناسبة: ثبّت نفس الروتين، ولو المتابعة اليدوية بتاخد وقت فـ ReStock Desk يساعدك تختصر التنفيذ."},
{min:50,key:"medium",label:"50–79 · يحتاج ضبط",title:"فيه فجوات واضحة في إدارة المخزون.",description:"الأرقام تشير إلى أن جزءًا من المخزون يحتاج متابعة أوضح، خصوصًا في النواقص وحدود إعادة الطلب.",next:"الخطوة المناسبة: ابدأ بالمؤشر الأضعف تحت. ولو النواقص وإعادة الطلب متكررين، شوف ReStock Desk كأداة تشغيل يومية."},
{min:0,key:"needs_work",label:"0–49 · يحتاج تأسيس",title:"المخزون محتاج نظام متابعة أبسط وثابت.",description:"النواقص أو ضعف تغطية إعادة الطلب أو النفاد الفعلي مرتفع نسبيًا. الأولوية هي تثبيت طريقة واضحة للمتابعة قبل زيادة التعقيد.",next:"الخطوة المناسبة: قلّل النواقص وثبّت حدود إعادة الطلب أولًا، ثم استخدم أداة تساعدك تحافظ على النظام باستمرار."}
];

function pct(part,total){return total>0?Math.min(100,Math.max(0,(part/total)*100)):0}
function read(){return{
total:Number(document.getElementById("totalSkus").value),
low:Number(document.getElementById("lowStockSkus").value),
reorder:Number(document.getElementById("reorderSkus").value),
stockout:Number(document.getElementById("stockoutSkus").value)
}}
function validate(v){
if(!Number.isFinite(v.total)||v.total<1)return"اكتب إجمالي عدد الأصناف أولًا.";
for(const key of ["low","reorder","stockout"])if(!Number.isFinite(v[key])||v[key]<0)return"كل القيم لازم تكون صفر أو أكبر.";
if(v.low>v.total)return"عدد الأصناف الناقصة لا يمكن يكون أكبر من إجمالي الأصناف.";
if(v.reorder>v.total)return"عدد الأصناف التي لها حد إعادة طلب لا يمكن يكون أكبر من إجمالي الأصناف.";
if(v.stockout>v.total)return"عدد الأصناف التي نفدت لا يمكن يكون أكبر من إجمالي الأصناف.";
return""
}
function calculate(v){
const lowRate=pct(v.low,v.total),reorderCoverage=pct(v.reorder,v.total),stockoutRate=pct(v.stockout,v.total);
const score=Math.round((100-lowRate)*.5+reorderCoverage*.3+(100-stockoutRate)*.2);
const issues=[
{value:100-reorderCoverage,label:`تغطية حد إعادة الطلب: ${Math.round(reorderCoverage)}% فقط من الأصناف`},
{value:lowRate,label:`النواقص الحالية: ${Math.round(lowRate)}% من الأصناف`},
{value:stockoutRate,label:`نفاد خلال 30 يوم: ${Math.round(stockoutRate)}% من الأصناف`}
].sort((a,b)=>b.value-a.value);
return{score,lowRate,reorderCoverage,stockoutRate,issues,band:bands.find(b=>score>=b.min)}
}
function render(data){
document.getElementById("scoreValue").innerHTML=`${data.score}<small>/100</small>`;
document.getElementById("resultBand").textContent=data.band.label;
document.getElementById("resultTitle").textContent=data.band.title;
document.getElementById("resultDescription").textContent=data.band.description;
document.getElementById("issueList").innerHTML=data.issues.map(x=>`<li>${x.label}</li>`).join("");
document.getElementById("metricSummary").innerHTML=`
<div><strong>${Math.round(data.lowRate)}%</strong><span>نواقص حالية</span></div>
<div><strong>${Math.round(data.reorderCoverage)}%</strong><span>تغطية إعادة الطلب</span></div>
<div><strong>${Math.round(data.stockoutRate)}%</strong><span>نفاد آخر 30 يوم</span></div>`;
document.getElementById("nextStep").textContent=data.band.next;
const message=["مرحبًا، استخدمت كشف صحة المخزون من Digital Execution.","",`نتيجتي التقديرية: ${data.score}/100`,`التصنيف: ${data.band.label}`,"",`النواقص الحالية: ${Math.round(data.lowRate)}%`,`تغطية حد إعادة الطلب: ${Math.round(data.reorderCoverage)}%`,`النفاد خلال 30 يوم: ${Math.round(data.stockoutRate)}%`,"","عايز أعرف أنسب خطوة لتحسين إدارة المخزون عندي."].join("\n");
document.getElementById("resultWhatsApp").href=`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
result.hidden=false;
result.focus({preventScroll:true});
result.scrollIntoView({behavior:"smooth",block:"start"});
window.dataLayer=window.dataLayer||[];
window.dataLayer.push({event:"health_check_complete",score:data.score,result_band:data.band.key,source:"health_check"});
}
form.addEventListener("submit",event=>{event.preventDefault();const values=read(),error=validate(values);if(error){formError.textContent=error;formError.hidden=false;return}formError.hidden=true;render(calculate(values))});
document.getElementById("restartCheck")?.addEventListener("click",()=>{form.reset();result.hidden=true;formError.hidden=true;document.getElementById("check")?.scrollIntoView({behavior:"smooth",block:"start"})});
})();