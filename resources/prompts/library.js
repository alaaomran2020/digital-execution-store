(()=>{
"use strict";
const search=document.getElementById("prompt-search");
const clearSearch=document.getElementById("clear-search");
const count=document.getElementById("result-count");
const empty=document.getElementById("empty-state");
const emptyMessage=document.getElementById("empty-message");
const resetFilters=document.getElementById("reset-filters");
const status=document.getElementById("copy-status");
const favoritesCount=document.getElementById("favorites-count");
const cards=[...document.querySelectorAll(".prompt-card")];
const filters=[...document.querySelectorAll("[data-filter]")];
if(!search||!clearSearch||!count||!empty||!emptyMessage||!resetFilters||!status||!favoritesCount||!cards.length)return;

let category="all";
const FAVORITES_KEY="de:prompt-favorites:v1";
const validIds=new Set(cards.map(card=>card.dataset.promptId));
const normalize=text=>String(text||"")
  .normalize("NFKC").toLocaleLowerCase("ar")
  .replace(/[\u064b-\u065f\u0670\u0640]/g,"")
  .replace(/[أإآ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه")
  .replace(/\s+/g," ").trim();

function readFavorites(){
  try{
    const saved=JSON.parse(localStorage.getItem(FAVORITES_KEY)||"[]");
    return new Set(Array.isArray(saved)?saved.filter(id=>validIds.has(id)):[]);
  }catch{return new Set()}
}
const favorites=readFavorites();
function saveFavorites(){
  try{
    localStorage.setItem(FAVORITES_KEY,JSON.stringify([...favorites]));
    return true;
  }catch{return false}
}
function updateFavoriteButton(card){
  const btn=card.querySelector(".favorite-btn");
  if(!btn)return;
  const selected=favorites.has(card.dataset.promptId);
  const title=card.querySelector("h3")?.textContent.trim()||"البرومبت";
  btn.textContent=selected?"★ محفوظ":"☆ احفظ";
  btn.classList.toggle("is-saved",selected);
  btn.setAttribute("aria-pressed",String(selected));
  btn.setAttribute("aria-label",(selected?"إزالة ":"حفظ ")+title+(selected?" من المفضلة":" في المفضلة"));
}
function setCategory(value){
  category=value;
  for(const btn of filters){
    const active=btn.dataset.filter===value;
    btn.classList.toggle("is-active",active);
    btn.setAttribute("aria-pressed",String(active));
  }
  update();
}
function update(){
  const needle=normalize(search.value);
  let visible=0;
  for(const card of cards){
    const matchCategory=category==="all"||(category==="favorites"?favorites.has(card.dataset.promptId):card.dataset.category===category);
    const matchSearch=!needle||normalize(card.textContent).includes(needle);
    card.hidden=!(matchCategory&&matchSearch);
    if(!card.hidden) visible++;
  }
  count.textContent=visible===1?"برومبت واحد":visible===2?"برومبتين":visible+" برومبت";
  favoritesCount.textContent=String(favorites.size);
  clearSearch.hidden=!search.value;
  empty.hidden=visible!==0;
  if(!visible){
    emptyMessage.textContent=category==="favorites"&&!needle
      ?"لسه مفيش برومبتات في المفضلة. اختار «الكل» واحفظ اللي يناسبك."
      :"مفيش برومبت مطابق. جرّب كلمة تانية أو اختار «الكل».";
  }
}
for(const btn of filters){
  btn.addEventListener("click",()=>setCategory(btn.dataset.filter||"all"));
}
search.addEventListener("input",update);
clearSearch.addEventListener("click",()=>{
  search.value="";
  update();
  search.focus();
});
resetFilters.addEventListener("click",()=>{
  search.value="";
  setCategory("all");
  search.focus();
});

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
  const previousFocus=document.activeElement;
  field.select();
  let ok=false;
  try{ok=Boolean(document.execCommand("copy"))}catch{}
  field.remove();
  if(previousFocus&&typeof previousFocus.focus==="function")previousFocus.focus();
  return ok;
}
for(const card of cards){
  const btn=card.querySelector(".copy-btn");
  const prompt=card.querySelector(".prompt-text");
  const favoriteBtn=card.querySelector(".favorite-btn");
  if(!btn||!prompt||!favoriteBtn||!validIds.has(card.dataset.promptId))continue;
  updateFavoriteButton(card);
  favoriteBtn.addEventListener("click",()=>{
    const id=card.dataset.promptId;
    if(favorites.has(id))favorites.delete(id);
    else favorites.add(id);
    const saved=saveFavorites();
    updateFavoriteButton(card);
    update();
    status.textContent=saved
      ?"تم تحديث المفضلة على الجهاز ده."
      :"المفضلة اتحدّثت مؤقتًا، لكن المتصفح مانع حفظها بعد إغلاق الصفحة.";
  });
  btn.addEventListener("click",async()=>{
    const text=prompt.textContent.trim();
    btn.disabled=true;
    try{
      const success=await copyText(text);
      status.textContent=success?"تم نسخ البرومبت. عدّل الكلمات بين الأقواس قبل الاستخدام.":"النسخ مش متاح من المتصفح حاليًا. افتح «عرض البرومبت» وحدّد النص وانسخه يدويًا.";
      if(!success)card.querySelector("details").open=true;
    }finally{
      btn.disabled=false;
    }
  });
}
update();
})();
