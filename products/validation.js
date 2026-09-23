(()=> {
  const WA_NUMBER="201011673107";
  const form=document.getElementById("candidateInterestForm");
  const candidateSelect=document.getElementById("candidate");
  const status=document.getElementById("validationFormStatus");
  const params=new URLSearchParams(window.location.search);
  const candidateMap={
    "order-desk":"Order Desk",
    "cash-desk":"Cash Desk",
    "supplier-desk":"Supplier Desk"
  };
  const requestedCandidate=candidateMap[params.get("candidate")||""]||"";
  const campaignSource=(params.get("utm_source")||params.get("source")||"direct").slice(0,80);
  const campaignName=(params.get("utm_campaign")||"validation-sprint").slice(0,80);
  const campaignMedium=(params.get("utm_medium")||"").slice(0,80);

  function track(eventName,metadata={}){
    const detail={
      event:eventName,
      ...metadata,
      source:"validation_sprint",
      campaign_source:campaignSource,
      campaign_name:campaignName,
      campaign_medium:campaignMedium
    };
    window.dataLayer=window.dataLayer||[];
    window.dataLayer.push(detail);
    window.dispatchEvent(new CustomEvent("digital-execution:event",{detail}));
  }

  if(requestedCandidate&&candidateSelect){
    candidateSelect.value=requestedCandidate;
    track("candidate_landing_view",{
      candidate_name:requestedCandidate,
      entry_mode:"direct_candidate_link"
    });
  }

  const seen=new Set();
  if("IntersectionObserver" in window){
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting) return;
        const candidate=entry.target.dataset.candidate;
        if(!candidate||seen.has(candidate)) return;
        seen.add(candidate);
        track("product_candidate_view",{candidate_name:candidate});
        observer.unobserve(entry.target);
      });
    },{threshold:.35});
    document.querySelectorAll("[data-validation-card]").forEach(card=>observer.observe(card));
  }

  document.querySelectorAll("[data-interest-candidate]").forEach(button=>{
    button.addEventListener("click",()=>{
      const candidate=button.dataset.interestCandidate||"";
      if(candidateSelect) candidateSelect.value=candidate;
      track("product_candidate_interest",{
        candidate_name:candidate,
        cta_location:"candidate_card"
      });
      document.getElementById("interest-form")?.scrollIntoView({behavior:"smooth",block:"start"});
      window.setTimeout(()=>document.getElementById("leadName")?.focus(),350);
    });
  });

  form?.addEventListener("submit",event=>{
    event.preventDefault();
    if(!form.reportValidity()) return;

    const data=new FormData(form);
    const candidate=String(data.get("candidate")||"");
    const leadName=String(data.get("leadName")||"").trim();
    const leadWhatsapp=String(data.get("leadWhatsapp")||"").trim();
    const businessType=String(data.get("businessType")||"").trim();
    const currentMethod=String(data.get("currentMethod")||"").trim();
    const biggestProblem=String(data.get("biggestProblem")||"").trim();

    track("candidate_lead",{
      candidate_name:candidate,
      business_type:businessType,
      has_current_method:Boolean(currentMethod),
      has_problem_detail:Boolean(biggestProblem)
    });

    const message=[
      "مرحبًا Digital Execution، أنا مهتم بالمنتج ده.",
      "",
      "المنتج: "+candidate,
      "الاسم: "+leadName,
      "واتساب: "+leadWhatsapp,
      "نوع النشاط: "+businessType,
      "الطريقة الحالية: "+(currentMethod||"غير مذكور"),
      "أكبر مشكلة: "+(biggestProblem||"غير مذكور"),
    ].join("\n");

    if(status){
      status.hidden=false;
      status.textContent="هتفتح واتساب دلوقتي لإرسال رسالتك."
    }
    window.location.href="https://wa.me/"+WA_NUMBER+"?text="+encodeURIComponent(message);
  });
})();
