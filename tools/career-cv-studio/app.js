const STORAGE_KEY = "career-kit-cv-builder-v4";
const LEGACY_KEYS = ["career-kit-cv-builder-v3","career-kit-cv-builder-v2","career-kit-cv-builder-v1"];
const THEME_KEY = "career-kit-theme";
const DEFAULT_SECTION_ORDER = ["summary","experience","education","projects","skills"];

const state = {
  track: "fresh",
  language: "ar",
  template: "classic",
  pdfFormat: "a4",
  sectionOrder: [...DEFAULT_SECTION_ORDER],
  experience: [],
  education: [],
  projects: []
};

const I18N = {
  ar: {
    dir:"rtl",fullName:"اسمك الكامل",targetTitle:"المسمى الوظيفي",
    summary:"اكتب ملخصًا مهنيًا مختصرًا ومباشرًا.",
    experienceFresh:"التدريب والخبرة",experienceExperienced:"الخبرة المهنية",
    education:"التعليم",projects:"المشروعات",skills:"المهارات",
    emptyExperience:"أضف خبرة أو تدريبًا مرتبطًا بالوظيفة.",emptyEducation:"أضف بيانات التعليم.",
    emptyProjects:"أضف مشروعًا مرتبطًا بالوظيفة.",emptySkills:"أضف مهاراتك الأساسية.",
    role:"الدور",degree:"الدرجة",project:"المشروع",previewMeta:"العربية",
    sections:{summary:"الملخص المهني",experience:"الخبرة",education:"التعليم",projects:"المشروعات",skills:"المهارات"}
  },
  en: {
    dir:"ltr",fullName:"Your Full Name",targetTitle:"Target Job Title",
    summary:"Write a concise professional summary focused on value and relevant strengths.",
    experienceFresh:"Internships & Experience",experienceExperienced:"Professional Experience",
    education:"Education",projects:"Projects",skills:"Skills",
    emptyExperience:"Add relevant experience or an internship.",emptyEducation:"Add your education details.",
    emptyProjects:"Add a project relevant to your target role.",emptySkills:"Add your core skills.",
    role:"Role",degree:"Degree",project:"Project",previewMeta:"English",
    sections:{summary:"Professional Summary",experience:"Experience",education:"Education",projects:"Projects",skills:"Skills"}
  }
};

const TEMPLATE_NAMES = {
  classic:"Classic ATS",executive:"Executive ATS",minimal:"Minimal ATS",compact:"Compact ATS"
};

const PDF_FORMATS = {
  a4:{
    label:"A4 Standard",
    meta:"A4",
    pageSize:"A4",
    hint:"مناسب لمعظم التقديمات في مصر والمنطقة."
  },
  "a4-compact":{
    label:"A4 Compact",
    meta:"A4 Compact",
    pageSize:"A4",
    hint:"مناسب للـCV الأطول مع هوامش ومسافات أكثر كفاءة."
  },
  letter:{
    label:"US Letter",
    meta:"US Letter",
    pageSize:"Letter",
    hint:"مناسب للتقديمات التي تطلب المقاس الأمريكي."
  }
};

const ACTION_VERBS_EN = new Set([
  "achieved","accelerated","built","created","delivered","designed","developed","drove","enhanced","executed",
  "generated","implemented","improved","increased","launched","led","managed","optimized","reduced","resolved",
  "scaled","streamlined","supported","automated","coordinated","analyzed","negotiated","trained","grew","cut"
]);
const ACTION_VERBS_AR = new Set([
  "حققت","أنشأت","طورت","نفذت","حسنت","زادت","زدت","خفضت","قللت","قدت","أدرت","أطلقت","بنيت","صممت",
  "حللت","نسقت","دعمت","أتممت","أتمتت","رفعت","وسعت","دربت","ساهمت","أنجزت"
]);
const OUTCOME_WORDS = new Set([
  "result","resulting","revenue","sales","conversion","efficiency","time","cost","growth","accuracy","quality","retention",
  "نتيجة","مبيعات","إيرادات","تحويل","كفاءة","وقت","تكلفة","نمو","دقة","جودة","احتفاظ","إنتاجية","سرعة"
]);
const STOP = new Set([
  "and","the","with","for","from","your","you","our","are","this","that","into","have","has","will","job","role","team","work","using",
  "who","what","when","where","how","their","they","them","but","not","all","any","can","may","more","than","years","year","skills",
  "عن","في","من","على","إلى","مع","او","أو","هذه","هذا","التي","الذي","ذلك","تلك","يجب","يكون","تكون","لدى","لديه","لديها",
  "خبرة","سنوات","العمل","فريق","وظيفة","مهارات","المطلوب","مطلوب","جيد","جدا","جداً"
]);

const $ = (id) => document.getElementById(id);
const fields = ["fullName","targetTitle","email","phone","location","linkedin","summary","skills","jobDescription"];

function trackEvent(eventName,metadata={}){
  const detail={timestamp:new Date().toISOString(),event:eventName,path:window.location.pathname,referrer:document.referrer||"",tool:"career-cv-studio",...metadata};
  window.dataLayer=window.dataLayer||[];
  window.dataLayer.push(detail);
  window.dispatchEvent(new CustomEvent("digital-execution:event",{detail}));
}

function uid(){ return Math.random().toString(36).slice(2,9); }
function safe(v=""){ return String(v).trim(); }
function t(){ return I18N[state.language] || I18N.ar; }
function escapeHtml(value){
  return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}
function normalizeOrder(order){
  const valid = Array.isArray(order) ? order.filter(x=>DEFAULT_SECTION_ORDER.includes(x)) : [];
  return [...new Set([...valid,...DEFAULT_SECTION_ORDER])].filter(x=>DEFAULT_SECTION_ORDER.includes(x));
}
function normalizePdfFormat(format){ return PDF_FORMATS[format] ? format : "a4"; }

function createExperience(data={}) {
  const node = $("experienceTemplate").content.firstElementChild.cloneNode(true);
  node.dataset.id = data.id || uid();
  ["role","company","period","bullets"].forEach(k=>node.querySelector(`[data-field="${k}"]`).value=data[k]||"");
  wireEntry(node);
  $("experienceList").appendChild(node);
  renderBulletCoach(node);
}
function createEducation(data={}) {
  const node = $("educationTemplate").content.firstElementChild.cloneNode(true);
  node.dataset.id = data.id || uid();
  ["degree","school","period"].forEach(k=>node.querySelector(`[data-field="${k}"]`).value=data[k]||"");
  wireEntry(node);
  $("educationList").appendChild(node);
}
function createProject(data={}) {
  const node = $("projectTemplate").content.firstElementChild.cloneNode(true);
  node.dataset.id = data.id || uid();
  ["name","meta","description"].forEach(k=>node.querySelector(`[data-field="${k}"]`).value=data[k]||"");
  wireEntry(node);
  $("projectList").appendChild(node);
}
function wireEntry(node){
  node.addEventListener("input",()=>{
    if(node.dataset.entry==="experience") renderBulletCoach(node);
    markDirty();
    onChange();
  });
  node.querySelector(".remove-entry").addEventListener("click",()=>{node.remove();markDirty();onChange();});
}
function collectEntries(selector){
  return [...document.querySelectorAll(selector)].map(card=>{
    const obj={id:card.dataset.id};
    card.querySelectorAll("[data-field]").forEach(el=>obj[el.dataset.field]=el.value);
    return obj;
  });
}
function getData(){
  const data={...state,sectionOrder:[...state.sectionOrder]};
  fields.forEach(id=>data[id]=$(id).value);
  data.experience=collectEntries('[data-entry="experience"]');
  data.education=collectEntries('[data-entry="education"]');
  data.projects=collectEntries('[data-entry="project"]');
  return data;
}
function setSaveStatus(mode){
  const el=$("saveStatus");
  if(!el) return;
  el.classList.remove("dirty","saved");
  if(mode==="dirty"){
    el.textContent="تغييرات غير محفوظة";
    el.classList.add("dirty");
  }else{
    el.textContent="محفوظ محليًا";
    el.classList.add("saved");
  }
}
function markDirty(){ setSaveStatus("dirty"); }
function persist(){
  localStorage.setItem(STORAGE_KEY,JSON.stringify(getData()));
  setSaveStatus("saved");
}
function save(){ persist();flashButton($("saveBtn"),state.language==="ar"?"تم الحفظ":"Saved"); }

function load(){
  let raw=localStorage.getItem(STORAGE_KEY);
  if(!raw){
    for(const key of LEGACY_KEYS){ raw=localStorage.getItem(key); if(raw) break; }
  }
  if(!raw) return;
  try{
    const data=JSON.parse(raw);
    state.track=data.track||"fresh";
    state.language=data.language||"ar";
    state.template=TEMPLATE_NAMES[data.template]?data.template:"classic";
    state.pdfFormat=normalizePdfFormat(data.pdfFormat);
    state.sectionOrder=normalizeOrder(data.sectionOrder);
    fields.forEach(id=>$(id).value=data[id]||"");
    (data.experience||[]).forEach(createExperience);
    (data.education||[]).forEach(createEducation);
    (data.projects||[]).forEach(createProject);
  }catch{}
}

function setTrack(track){
  state.track=track==="experienced"?"experienced":"fresh";
  document.querySelectorAll("[data-track]").forEach(btn=>btn.classList.toggle("active",btn.dataset.track===state.track));
  $("experienceHeading").textContent=state.track==="fresh"?"التدريب / الخبرة":"الخبرة المهنية";
  updateAll();persist();
}
function setLanguage(language){
  state.language=language==="en"?"en":"ar";
  $("languageSelect").value=state.language;
  const cv=$("cvPreview");cv.lang=state.language;cv.dir=t().dir;
  updateAll();renderSectionOrder();persist();
}
function applyPreviewClasses(){
  const cv=$("cvPreview");
  cv.className=`cv-page template-${state.template} format-${state.pdfFormat}`;
}
function setTemplate(template){
  state.template=TEMPLATE_NAMES[template]?template:"classic";
  $("templateSelect").value=state.template;
  applyPreviewClasses();
  document.querySelectorAll("[data-template-quick]").forEach(btn=>btn.classList.toggle("active",btn.dataset.templateQuick===state.template));
  updatePreviewMeta();persist();
}
function setPdfFormat(format){
  state.pdfFormat=normalizePdfFormat(format);
  $("pdfFormatSelect").value=state.pdfFormat;
  document.querySelectorAll("[data-pdf-format]").forEach(btn=>btn.classList.toggle("active",btn.dataset.pdfFormat===state.pdfFormat));
  applyPreviewClasses();
  const config=PDF_FORMATS[state.pdfFormat];
  $("exportFormatLabel").textContent=config.label;
  $("exportHint").textContent=config.hint;
  updatePreviewMeta();
  persist();
}
function updatePreviewMeta(){
  $("previewMeta").textContent=PDF_FORMATS[state.pdfFormat].meta+" / "+t().previewMeta+" / "+TEMPLATE_NAMES[state.template];
}

function renderSectionOrder(){
  const labels=t().sections;
  const host=$("sectionOrderList");
  host.innerHTML="";
  state.sectionOrder.forEach(key=>{
    const item=document.createElement("div");
    item.className="order-item";
    item.draggable=true;
    item.dataset.sectionKey=key;
    item.innerHTML=`<span class="order-handle" aria-hidden="true">⋮⋮</span><strong>${escapeHtml(labels[key])}</strong><div class="order-actions"><button type="button" class="order-btn" data-move="-1" aria-label="Move up">↑</button><button type="button" class="order-btn" data-move="1" aria-label="Move down">↓</button></div>`;
    item.addEventListener("dragstart",e=>{
      item.classList.add("dragging");
      e.dataTransfer.effectAllowed="move";
      e.dataTransfer.setData("text/plain",key);
    });
    item.addEventListener("dragend",()=>item.classList.remove("dragging"));
    item.addEventListener("dragover",e=>{e.preventDefault();e.dataTransfer.dropEffect="move";});
    item.addEventListener("drop",e=>{
      e.preventDefault();
      const source=e.dataTransfer.getData("text/plain");
      if(!source||source===key) return;
      const next=[...state.sectionOrder];
      const from=next.indexOf(source),to=next.indexOf(key);
      if(from<0||to<0) return;
      next.splice(from,1);next.splice(to,0,source);
      state.sectionOrder=next;
      renderSectionOrder();applySectionOrder();persist();
    });
    item.querySelectorAll("[data-move]").forEach(btn=>btn.addEventListener("click",()=>moveSection(key,Number(btn.dataset.move))));
    host.appendChild(item);
  });
}
function moveSection(key,delta){
  const next=[...state.sectionOrder];
  const index=next.indexOf(key),target=index+delta;
  if(index<0||target<0||target>=next.length) return;
  [next[index],next[target]]=[next[target],next[index]];
  state.sectionOrder=next;
  renderSectionOrder();applySectionOrder();persist();
}
function applySectionOrder(){
  const host=$("cvSections");
  state.sectionOrder.forEach(key=>{
    const section=host.querySelector(`[data-section="${key}"]`);
    if(section) host.appendChild(section);
  });
}

function updateContact(){
  const values=[$("email").value,$("phone").value,$("location").value,$("linkedin").value].map(safe).filter(Boolean);
  $("previewContact").textContent=values.length?values.join(" · "):"email@example.com · +20... · Egypt · LinkedIn";
}
function linesToBullets(value){
  return safe(value).split(/\n+/).map(x=>x.replace(/^[-•]\s*/,"").trim()).filter(Boolean);
}
function renderEntries(){
  const exps=collectEntries('[data-entry="experience"]');
  $("previewExperience").innerHTML=exps.length?exps.map(x=>{
    const bullets=linesToBullets(x.bullets),role=safe(x.role)||t().role;
    return `<div class="cv-entry"><div class="cv-entry-head"><strong>${escapeHtml(role)}${safe(x.company)?" — "+escapeHtml(safe(x.company)):""}</strong><small>${escapeHtml(safe(x.period))}</small></div>${bullets.length?"<ul>"+bullets.map(b=>"<li>"+escapeHtml(b)+"</li>").join("")+"</ul>":""}</div>`;
  }).join(""):`<p class="placeholder">${t().emptyExperience}</p>`;

  const edu=collectEntries('[data-entry="education"]');
  $("previewEducation").innerHTML=edu.length?edu.map(x=>`<div class="cv-entry"><div class="cv-entry-head"><strong>${escapeHtml(safe(x.degree)||t().degree)}</strong><small>${escapeHtml(safe(x.period))}</small></div><p>${escapeHtml(safe(x.school))}</p></div>`).join(""):`<p>${t().emptyEducation}</p>`;

  const projects=collectEntries('[data-entry="project"]');
  $("previewProjects").innerHTML=projects.length?projects.map(x=>`<div class="cv-entry"><div class="cv-entry-head"><strong>${escapeHtml(safe(x.name)||t().project)}</strong><small>${escapeHtml(safe(x.meta))}</small></div><p>${escapeHtml(safe(x.description))}</p></div>`).join(""):`<p>${t().emptyProjects}</p>`;
  $("previewProjectsSection").hidden=state.track==="experienced"&&!projects.some(p=>safe(p.name)||safe(p.description));
}
function updatePreview(){
  const copy=t(),fallback={fullName:copy.fullName,targetTitle:copy.targetTitle,summary:copy.summary};
  document.querySelectorAll("[data-preview]").forEach(el=>{const id=el.dataset.preview;el.textContent=safe($(id).value)||fallback[id]||"";});
  $("summaryHeading").textContent=copy.sections.summary;
  $("previewExperienceTitle").textContent=state.track==="fresh"?copy.experienceFresh:copy.experienceExperienced;
  $("educationHeading").textContent=copy.education;
  $("projectsHeading").textContent=copy.projects;
  $("skillsHeading").textContent=copy.skills;
  updateContact();renderEntries();
  const skills=safe($("skills").value).split(",").map(s=>s.trim()).filter(Boolean);
  $("previewSkills").textContent=skills.length?skills.join(" · "):copy.emptySkills;
  updatePreviewMeta();applySectionOrder();applyPreviewClasses();
}

function analyzeBullet(text){
  const clean=safe(text);
  if(!clean) return {score:0,issues:[]};
  const words=clean.split(/\s+/).filter(Boolean);
  const first=(words[0]||"").toLowerCase().replace(/[.,:;!?]/g,"");
  const action=ACTION_VERBS_EN.has(first)||ACTION_VERBS_AR.has(first);
  const metric=/(\d+[.,]?\d*\s*%|\b\d+[.,]?\d*\b|٪|جنيه|ريال|دولار|hours?|days?|weeks?|months?|ساعات?|أيام|أسابيع|شهور)/i.test(clean);
  const outcome=[...OUTCOME_WORDS].some(w=>clean.toLowerCase().includes(w));
  const lengthOk=words.length>=8&&words.length<=32;
  const score=(action?30:0)+(metric?30:0)+(outcome?20:0)+(lengthOk?20:0);
  const issues=[];
  if(!action) issues.push(state.language==="ar"?"ابدأ بفعل قوي يوضح ما فعلته.":"Start with a strong action verb.");
  if(!metric) issues.push(state.language==="ar"?"أضف رقمًا أو نسبة أو حجمًا للنتيجة إن أمكن.":"Add a number, percentage, scale, or measurable result.");
  if(!outcome) issues.push(state.language==="ar"?"وضح أثر الإنجاز على المبيعات أو الوقت أو التكلفة أو الجودة.":"Show the outcome on revenue, time, cost, quality, growth, or efficiency.");
  if(!lengthOk) issues.push(state.language==="ar"?"اجعل النقطة بين 8 و32 كلمة لتبقى واضحة.":"Keep the bullet between 8 and 32 words.");
  return {score,issues};
}
function renderBulletCoach(card){
  const coach=card.querySelector("[data-coach]");
  if(!coach) return;
  const bullets=linesToBullets(card.querySelector('[data-field="bullets"]').value);
  if(!bullets.length){
    coach.innerHTML=`<div class="coach-summary"><strong>Achievement Bullet Coach</strong><span class="coach-score">0%</span></div><div class="coach-item warn">${state.language==="ar"?"اكتب كل إنجاز في سطر مستقل لبدء التحليل.":"Write each achievement on a separate line to start coaching."}</div>`;
    return;
  }
  const analyses=bullets.map(analyzeBullet);
  const avg=Math.round(analyses.reduce((s,a)=>s+a.score,0)/analyses.length);
  const details=analyses.map((a,i)=>{
    const label=(state.language==="ar"?"النقطة ":"Bullet ")+(i+1);
    if(a.score>=80) return `<div class="coach-item good">✓ ${label}: ${state.language==="ar"?"صياغة قوية ومتوازنة.":"Strong, balanced achievement bullet."}</div>`;
    return `<div class="coach-item warn"><strong>${label} — ${a.score}%</strong><br>${escapeHtml(a.issues.slice(0,2).join(" "))}</div>`;
  }).join("");
  coach.innerHTML=`<div class="coach-summary"><strong>Achievement Bullet Coach</strong><span class="coach-score">${avg}%</span></div><div class="coach-list">${details}</div>`;
}
function renderAllBulletCoaches(){
  document.querySelectorAll('[data-entry="experience"]').forEach(renderBulletCoach);
}
function averageBulletScore(){
  const bullets=collectEntries('[data-entry="experience"]').flatMap(x=>linesToBullets(x.bullets));
  if(!bullets.length) return 0;
  return Math.round(bullets.reduce((sum,b)=>sum+analyzeBullet(b).score,0)/bullets.length);
}

function calculateATS(){
  const data=getData();let score=0;const ar=state.language==="ar";
  const bulletScore=averageBulletScore();
  const checks=[
    [safe(data.fullName).length>3,7,ar?"الاسم الكامل":"Full name"],
    [safe(data.targetTitle).length>3,9,ar?"مسمى وظيفي مستهدف":"Target job title"],
    [/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safe(data.email)),7,ar?"بريد إلكتروني صحيح":"Valid email"],
    [safe(data.phone).length>=8,5,ar?"رقم هاتف":"Phone number"],
    [safe(data.summary).length>=120,13,ar?"ملخص مهني كافٍ":"Strong professional summary"],
    [data.education.some(x=>safe(x.degree)&&safe(x.school)),9,ar?"بيانات التعليم":"Education details"],
    [data.experience.some(x=>safe(x.role)&&safe(x.bullets)),14,ar?"خبرة بإنجازات واضحة":"Experience with achievement bullets"],
    [bulletScore>=60,10,ar?"جودة نقاط الإنجاز 60%+":"Achievement bullets quality 60%+"],
    [safe(data.skills).split(",").filter(Boolean).length>=5,10,ar?"5 مهارات أساسية على الأقل":"At least 5 core skills"],
    [state.track==="experienced"||data.projects.some(x=>safe(x.name)&&safe(x.description)),7,ar?"مشروع موضح للخريج الجديد":"Relevant project for fresh graduate"],
    [!/\b(photo|image|picture|صورة)\b/i.test(JSON.stringify(data)),9,ar?"هيكل نصي بسيط وآمن للـATS":"Simple ATS-safe text structure"]
  ];
  checks.forEach(([ok,points])=>{if(ok)score+=points;});
  $("atsScore").textContent=score+"%";$("atsBar").style.width=score+"%";
  $("atsNotes").innerHTML=checks.map(([ok,,label])=>`<li>${ok?"✓":"○"} ${label}</li>`).join("");
}

function rawTokens(text){
  return String(text).toLowerCase().match(/[a-z][a-z0-9+#.\/-]{2,}|[\u0600-\u06ff]{3,}/g)||[];
}
function tokens(text){ return rawTokens(text).filter(w=>!STOP.has(w)); }
function cvText(data){
  return [
    data.targetTitle,data.summary,data.skills,
    ...data.experience.flatMap(x=>[x.role,x.company,x.bullets]),
    ...data.projects.flatMap(x=>[x.name,x.meta,x.description]),
    ...data.education.flatMap(x=>[x.degree,x.school])
  ].join(" ").toLowerCase();
}
function getPriorityTerms(text){
  const freq=new Map();
  tokens(text).forEach(word=>freq.set(word,(freq.get(word)||0)+1));
  const priorityHints=/\b(required|requirements|must|essential|preferred|proficient|experience|knowledge)\b|مطلوب|يشترط|يفضل|خبرة|إجادة|معرفة/gi;
  const hinted=new Set();
  String(text).split(/[.\n;]+/).forEach(sentence=>{
    if(priorityHints.test(sentence)) tokens(sentence).forEach(word=>hinted.add(word));
    priorityHints.lastIndex=0;
  });
  return [...freq.entries()]
    .map(([term,count])=>({term,count,weight:count+(hinted.has(term)?2:0)}))
    .sort((a,b)=>b.weight-a.weight||b.count-a.count||a.term.localeCompare(b.term))
    .slice(0,20);
}
function renderChips(id,items,type){
  const host=$(id);
  if(!items.length){host.innerHTML='<span class="empty-chip">—</span>';return;}
  host.innerHTML=items.map(item=>`<span class="keyword-chip ${type}">${escapeHtml(typeof item==="string"?item:item.term)}</span>`).join("");
}
function updateAnalyzer(){
  const jd=safe($("jobDescription").value);
  if(!jd){
    $("matchScore").textContent="0%";$("keywordCoverage").textContent="0%";$("titleAlignment").textContent="0%";
    $("matchedCount").textContent="0";$("missingCount").textContent="0";
    renderChips("matchedKeywords",[],"matched");renderChips("missingKeywords",[],"missing");renderChips("priorityKeywords",[],"priority");
    return;
  }
  const data=getData(),text=cvText(data),priority=getPriorityTerms(jd);
  const matched=priority.filter(x=>text.includes(x.term));
  const missing=priority.filter(x=>!text.includes(x.term));
  const totalWeight=priority.reduce((s,x)=>s+x.weight,0)||1;
  const matchedWeight=matched.reduce((s,x)=>s+x.weight,0);
  const coverage=Math.round(matchedWeight/totalWeight*100);
  const titleTerms=tokens(data.targetTitle);
  const jdLower=jd.toLowerCase();
  const titleHits=titleTerms.filter(term=>jdLower.includes(term)).length;
  const titleAlignment=titleTerms.length?Math.round(titleHits/titleTerms.length*100):0;
  const overall=Math.round(coverage*.75+titleAlignment*.25);

  $("matchScore").textContent=overall+"%";
  $("keywordCoverage").textContent=coverage+"%";
  $("titleAlignment").textContent=titleAlignment+"%";
  $("matchedCount").textContent=String(matched.length);
  $("missingCount").textContent=String(missing.length);
  renderChips("matchedKeywords",matched.slice(0,12),"matched");
  renderChips("missingKeywords",missing.slice(0,12),"missing");
  renderChips("priorityKeywords",priority.slice(0,12),"priority");
}

function suggestedPdfFilename(){
  const name=safe($("fullName").value)||"career-cv";
  const title=safe($("targetTitle").value);
  const lang=state.language==="ar"?"AR":"EN";
  const raw=[name,title,lang].filter(Boolean).join("-");
  const slug=raw.replace(/[^a-zA-Z0-9\u0600-\u06FF]+/g,"-").replace(/^-+|-+$/g,"").slice(0,90);
  return (slug||"career-cv")+".pdf";
}
function estimatePages(){
  const cv=$("cvPreview");
  if(!cv) return 1;
  const width=Math.max(320,cv.getBoundingClientRect().width||760);
  const clone=cv.cloneNode(true);
  clone.removeAttribute("id");
  Object.assign(clone.style,{
    position:"fixed",visibility:"hidden",pointerEvents:"none",left:"-10000px",top:"0",
    width:width+"px",minHeight:"0",height:"auto",aspectRatio:"auto",maxWidth:"none"
  });
  document.body.appendChild(clone);
  const contentHeight=Math.max(1,clone.scrollHeight);
  clone.remove();
  const ratio=state.pdfFormat==="letter"?(11/8.5):(297/210);
  const pageHeight=Math.max(1,width*ratio);
  return Math.max(1,Math.ceil(contentHeight/pageHeight));
}
function updateExportReadiness(){
  const data=getData();
  const ar=state.language==="ar";
  const skillCount=safe(data.skills).split(",").map(x=>x.trim()).filter(Boolean).length;
  const checks=[
    [safe(data.fullName).length>3,ar?"الاسم مكتمل":"Full name is complete"],
    [safe(data.targetTitle).length>3,ar?"المسمى المستهدف محدد":"Target title is set"],
    [/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safe(data.email))||safe(data.phone).length>=8,ar?"وسيلة تواصل صالحة":"Valid contact method"],
    [safe(data.summary).length>=80,ar?"الملخص المهني جاهز":"Professional summary is ready"],
    [data.experience.some(x=>safe(x.role)&&safe(x.bullets))||data.education.some(x=>safe(x.degree)&&safe(x.school)),ar?"المحتوى المهني الأساسي موجود":"Core career content is present"],
    [skillCount>=5,ar?"المهارات الأساسية مكتملة":"Core skills are complete"]
  ];
  const missing=checks.filter(([ok])=>!ok).length;
  const status=$("exportReadyStatus");
  status.textContent=missing===0?(ar?"جاهز للتصدير":"Ready to export"):(ar?`${missing} نقاط ناقصة`:`${missing} items missing`);
  status.className="readiness-status "+(missing===0?"ready":"warn");
  $("exportReadyList").innerHTML=checks.map(([ok,label])=>`<li class="${ok?"ok":"warn"}">${ok?"✓":"○"} ${escapeHtml(label)}</li>`).join("");

  const pages=estimatePages();
  const target=state.track==="fresh"?1:2;
  $("pageEstimate").textContent=ar?`≈ ${pages} ${pages===1?"صفحة":"صفحات"}`:`≈ ${pages} page${pages===1?"":"s"}`;
  const fit=$("pageFitStatus");
  const fitOk=pages<=target;
  fit.textContent=fitOk?(ar?"الطول مناسب":"Good fit"):(ar?"راجع طول الـCV":"Review length");
  fit.className=fitOk?"readiness-status ready":"readiness-status warn";
  $("exportFilename").value=suggestedPdfFilename();
}
function onChange(){
  updateAll();clearTimeout(onChange.timer);onChange.timer=setTimeout(persist,350);
}
function updateAll(){
  updatePreview();renderAllBulletCoaches();calculateATS();updateAnalyzer();updateExportReadiness();
}
function flashButton(btn,text){
  const old=btn.textContent;btn.textContent=text;setTimeout(()=>btn.textContent=old,1000);
}
function applyTheme(theme){
  document.documentElement.dataset.theme=theme;localStorage.setItem(THEME_KEY,theme);
  $("themeToggle").textContent=theme==="dark"?"☀":"☾";
  $("themeToggle").setAttribute("aria-label",theme==="dark"?"تفعيل الوضع الفاتح":"تفعيل الوضع الداكن");
}
function initTheme(){
  const saved=localStorage.getItem(THEME_KEY);
  const preferred=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";
  applyTheme(saved||preferred);
}
function exportData(){
  const blob=new Blob([JSON.stringify(getData(),null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);
  a.download=(safe($("fullName").value)||"career-kit-cv").replace(/\s+/g,"-")+".json";a.click();URL.revokeObjectURL(a.href);
}
function applyPrintPageStyle(){
  let style=document.getElementById("dynamicPrintPage");
  if(!style){
    style=document.createElement("style");
    style.id="dynamicPrintPage";
    document.head.appendChild(style);
  }
  style.textContent=`@media print{@page{size:${PDF_FORMATS[state.pdfFormat].pageSize};margin:0}}`;
}
let printTitleBackup="";
function exportPdf(){
  trackEvent("cv_export",{language:state.language,template:state.template,pdf_format:state.pdfFormat,career_track:state.track});
  persist();
  updateExportReadiness();
  applyPrintPageStyle();
  document.body.dataset.printFormat=state.pdfFormat;
  printTitleBackup=document.title;
  document.title=suggestedPdfFilename().replace(/\.pdf$/i,"");
  requestAnimationFrame(()=>window.print());
}
function importData(file){
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const data=JSON.parse(reader.result);
      fields.forEach(id=>$(id).value=data[id]||"");
      ["experienceList","educationList","projectList"].forEach(id=>$(id).innerHTML="");
      (data.experience||[]).forEach(createExperience);(data.education||[]).forEach(createEducation);(data.projects||[]).forEach(createProject);
      state.track=data.track||"fresh";state.language=data.language||"ar";
      state.template=TEMPLATE_NAMES[data.template]?data.template:"classic";
      state.pdfFormat=normalizePdfFormat(data.pdfFormat);
      state.sectionOrder=normalizeOrder(data.sectionOrder);
      setTrack(state.track);setLanguage(state.language);setTemplate(state.template);setPdfFormat(state.pdfFormat);
      renderSectionOrder();applySectionOrder();onChange();
    }catch{alert("ملف البيانات غير صالح.");}
  };
  reader.readAsText(file);
}
function reset(){
  if(!confirm("سيتم مسح بيانات الـCV المحفوظة على هذا الجهاز. هل تريد المتابعة؟")) return;
  localStorage.removeItem(STORAGE_KEY);LEGACY_KEYS.forEach(k=>localStorage.removeItem(k));location.reload();
}

document.addEventListener("DOMContentLoaded",()=>{
  initTheme();load();
  trackEvent("cv_studio_open",{language:state.language,template:state.template,pdf_format:state.pdfFormat,career_track:state.track});
  if(!$("experienceList").children.length)createExperience();
  if(!$("educationList").children.length)createEducation();
  if(!$("projectList").children.length)createProject();

  fields.forEach(id=>$(id).addEventListener("input",()=>{markDirty();onChange();}));
  $("addExperienceBtn").addEventListener("click",()=>{createExperience();markDirty();onChange();});
  $("addEducationBtn").addEventListener("click",()=>{createEducation();markDirty();onChange();});
  $("addProjectBtn").addEventListener("click",()=>{createProject();markDirty();onChange();});
  document.querySelectorAll("[data-track]").forEach(btn=>btn.addEventListener("click",()=>setTrack(btn.dataset.track)));
  document.querySelectorAll("[data-template-quick]").forEach(btn=>btn.addEventListener("click",()=>setTemplate(btn.dataset.templateQuick)));
  document.querySelectorAll("[data-pdf-format]").forEach(btn=>btn.addEventListener("click",()=>setPdfFormat(btn.dataset.pdfFormat)));

  $("languageSelect").addEventListener("change",e=>setLanguage(e.target.value));
  $("templateSelect").addEventListener("change",e=>setTemplate(e.target.value));
  $("pdfFormatSelect").addEventListener("change",e=>setPdfFormat(e.target.value));
  $("resetOrderBtn").addEventListener("click",()=>{state.sectionOrder=[...DEFAULT_SECTION_ORDER];renderSectionOrder();applySectionOrder();persist();});
  $("themeToggle").addEventListener("click",()=>applyTheme(document.documentElement.dataset.theme==="dark"?"light":"dark"));
  $("saveBtn").addEventListener("click",save);
  $("printBtn").addEventListener("click",exportPdf);
  $("exportPdfBtn").addEventListener("click",exportPdf);
  $("exportDataBtn").addEventListener("click",exportData);
  $("importDataInput").addEventListener("change",e=>e.target.files[0]&&importData(e.target.files[0]));
  $("resetBtn").addEventListener("click",reset);

  window.addEventListener("afterprint",()=>{
    document.body.removeAttribute("data-print-format");
    if(printTitleBackup){document.title=printTitleBackup;printTitleBackup="";}
  });
  document.addEventListener("keydown",e=>{
    if(!(e.ctrlKey||e.metaKey)) return;
    const key=e.key.toLowerCase();
    if(key==="s"){e.preventDefault();save();}
    if(key==="p"){e.preventDefault();exportPdf();}
  });
  let resizeTimer;
  window.addEventListener("resize",()=>{
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(updateExportReadiness,140);
  });

  setTrack(state.track);setLanguage(state.language);setTemplate(state.template);setPdfFormat(state.pdfFormat);
  renderSectionOrder();applySectionOrder();updateAll();setSaveStatus("saved");
});