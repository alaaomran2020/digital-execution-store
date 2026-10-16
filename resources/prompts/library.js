(()=>{
"use strict";
const search=document.getElementById("prompt-search");
const count=document.getElementById("result-count");
const empty=document.getElementById("empty-state");
const status=document.getElementById("copy-status");
const cards=[...document.querySelectorAll(".prompt-card")];
const filters=[...document.querySelectorAll("[data-filter]")];
if(!search||!count||!empty||!status||!cards.length)return;

let category="all";
const normalize=text=>String(text||"").normalize("NFKC").toLocaleLowerCase("ar").replace(/[\u064b-\u065f\u0670]/g,"").trim();
function update(){
  const needle=normalize(search.value);
  let visible=0;
  for(const card of cards){
    const matchCategory=category==="all"||card.dataset.category===category;
    const matchSearch=!needle||normalize(card.textContent).includes(needle);
    card.hidden=!(matchCategory&&matchSearch);
    if(!card.hidden) visible++;
  }
  count.textContent=visible===1?"برومبت واحد":visible+" برومبتات";
  empty.hidden=visible!==0;
}
for(const btn of filters){
  btn.addEventListener("click",()=>{
    category=btn.dataset.filter||"all";
    for(const other of filters){
      const active=other===btn;
      other.classList.toggle("is-active",active);
      other.setAttribute("aria-pressed",String(active));
    }
    update();
  });
}
search.addEventListener("input",update);

async function copyText(text){
  if(navigator.clipboard&&typeof navigator.clipboard.writeText==="function"){
    try{await navigator.clipboard.writeText(text);return true}catch{}
  }
  const field=document.createElement("textarea");
  field.value=text;
  field.setAttribute("readonly","");
  field.style.position="fixed";
  field.style.opacity="0";
  document.body.appendChild(field);
  field.select();
  let ok=false;
  try{ok=Boolean(document.execCommand("copy"))}catch{}
  field.remove();
  return ok;
}
for(const card of cards){
  const btn=card.querySelector(".copy-btn");
  const prompt=card.querySelector(".prompt-text");
  if(!btn||!prompt)continue;
  btn.addEventListener("click",async()=>{
    const text=prompt.textContent.trim();
    btn.disabled=true;
    const success=await copyText(text);
    btn.disabled=false;
    status.textContent=success?"تم نسخ البرومبت. عدّل الكلمات بين الأقواس قبل الاستخدام.":"النسخ مش متاح من المتصفح حاليًا. افتح «عرض البرومبت» وحدّد النص وانسخه يدويًا.";
    if(!success)card.querySelector("details").open=true;
  });
}
update();
})();
