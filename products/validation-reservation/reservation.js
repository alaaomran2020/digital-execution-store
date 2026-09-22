(()=> {
  const WA_NUMBER="201011673107";
  const params=new URLSearchParams(window.location.search);
  const products={
    "order-desk":{name:"Order Desk",price:499},
    "cash-desk":{name:"Cash Desk",price:399},
    "supplier-desk":{name:"Supplier Desk",price:449}
  };
  const slug=params.get("candidate")||"";
  const product=products[slug];
  const name=document.getElementById("productName");
  const title=document.getElementById("reservationTitle");
  const expected=document.getElementById("expectedPrice");
  const remaining=document.getElementById("remainingPrice");
  const button=document.getElementById("reservationWhatsApp");

  function track(eventName,metadata={}){
    const detail={event:eventName,...metadata,source:"founding_customer_reservation"};
    window.dataLayer=window.dataLayer||[];
    window.dataLayer.push(detail);
    window.dispatchEvent(new CustomEvent("digital-execution:event",{detail}));
  }

  if(!product){
    if(name) name.textContent="رابط الحجز غير مكتمل";
    if(title) title.textContent="اختار المنتج من رابط الدعوة المرسل لك";
    if(expected) expected.textContent="غير متاح";
    if(remaining) remaining.textContent="الحجز متاح فقط عبر رابط مخصص بعد اجتياز المنتج لمرحلة التحقق.";
    if(button){button.hidden=true}
    return;
  }

  const fee=50;
  const rest=product.price-fee;
  if(name) name.textContent=product.name;
  if(title) title.textContent="حجز "+product.name;
  if(expected) expected.textContent=product.price+" جنيه متوقع";
  if(remaining) remaining.textContent="50 جنيه حجز + "+rest+" جنيه عند جاهزية النسخة واستكمال الشراء.";

  track("reservation_page_view",{candidate_name:product.name,expected_price:product.price,reservation_fee:fee});

  if(button){
    const message=[
      "مرحبًا Digital Execution، أريد حجز نسخة Founding Customer.",
      "",
      "المنتج: "+product.name,
      "السعر المتوقع: "+product.price+" جنيه",
      "رسوم الحجز: "+fee+" جنيه",
      "المتبقي عند جاهزية النسخة: "+rest+" جنيه",
      "",
      "أفهم أن المنتج ما زال قيد التحقق/التطوير، وأن مبلغ الحجز يُرد بالكامل إذا قررت Digital Execution عدم تطوير المنتج."
    ].join("\n");
    button.href="https://wa.me/"+WA_NUMBER+"?text="+encodeURIComponent(message);
    button.addEventListener("click",()=>{
      track("reservation_intent",{candidate_name:product.name,expected_price:product.price,reservation_fee:fee});
    });
  }
})();