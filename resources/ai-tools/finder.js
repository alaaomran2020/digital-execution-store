(()=>{
"use strict";
const form=document.getElementById("ai-finder");
const result=document.getElementById("ai-result");
const title=document.getElementById("ai-result-title");
const description=document.getElementById("ai-result-description");
const examples=document.getElementById("ai-result-examples");
const tip=document.getElementById("ai-result-tip");
const link=document.getElementById("ai-result-link");
if(!form||!result||!title||!description||!examples||!tip||!link)return;

// Fixed examples and on-site links only: no network requests, accounts, or AI API.
const categories=Object.freeze({
  writing:{
    title:"الكتابة والتسويق",
    description:"ابدأ بمساعد كتابة عشان ترتب الفكرة، وبعدها راجع النص بنفسك.",
    examples:"أمثلة: ChatGPT، Claude، Gemini."
  },
  visual:{
    title:"التصميم والصور",
    description:"ابدأ بفكرة بصرية واضحة، وجرب أداة صور أو تصميم ثم راجع التفاصيل.",
    examples:"أمثلة: Canva، Adobe Firefly."
  },
  research:{
    title:"البحث والتعلّم",
    description:"ابدأ بأداة بحث أو شرح، وافتح المصادر الأصلية قبل الاعتماد على المعلومة.",
    examples:"أمثلة: Perplexity، Gemini."
  },
  coding:{
    title:"البرمجة والمواقع",
    description:"استخدم مساعد كود لشرح الفكرة أو كتابة مسودة، ثم اختبرها قبل النشر.",
    examples:"أمثلة: GitHub Copilot، ChatGPT."
  },
  business:{
    title:"الإدارة والتحليل",
    description:"استخدم المساعد لترتيب البيانات والخطوات، واحسب الأرقام بأداة مخصصة.",
    examples:"أمثلة للمساعدة النصية: ChatGPT، Gemini."
  }
});
const startTips={
  quick:"ابدأ بطلب واحد واضح وراجع النتيجة قبل ما تكمل.",
  learn:"اطلب شرح الخطوات بمثال صغير، واسأل عن المصادر عند الحاجة.",
  detailed:"اكتب الهدف والقيود وشكل النتيجة، وراجع كل جزء قبل الاعتماد عليه."
};
function categoryFor(goal,format){
  if(format==="code")return "coding";
  if(format==="image")return "visual";
  if(goal==="writing"&&format==="numbers")return "business";
  return goal;
}
form.addEventListener("submit",event=>{
  event.preventDefault();
  if(!form.reportValidity())return;
  const goal=form.elements.namedItem("goal").value;
  const format=form.elements.namedItem("format").value;
  const mode=form.elements.namedItem("mode").value;
  if(!categories[goal]||!["text","image","code","numbers"].includes(format)||!startTips[mode]){
    result.hidden=true;
    return;
  }
  const key=categoryFor(goal,format);
  const selected=categories[key];
  title.textContent=selected.title;
  description.textContent=selected.description;
  examples.textContent=selected.examples;
  tip.textContent=startTips[mode];
  link.href="#category-"+key;
  result.hidden=false;
});
form.addEventListener("reset",()=>{result.hidden=true});
})();