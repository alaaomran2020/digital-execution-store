const phone="01011673107";
const wa="201011673107";
const price="399";
const msg=[
  "مرحبًا، أريد شراء ReStock Desk v1.0.0 من Digital Execution.",
  "",
  "السعر: "+price+" جنيه",
  "رقم Vodafone Cash: "+phone,
  "وسأرسل صورة أو رقم عملية الدفع هنا للتأكيد."
].join("\n");

document.getElementById("waBtn").href="https://wa.me/"+wa+"?text="+encodeURIComponent(msg);
document.getElementById("copyBtn").addEventListener("click",async()=>{
  try{
    await navigator.clipboard.writeText(phone);
    const b=document.getElementById("copyBtn"),old=b.textContent;
    b.textContent="تم النسخ";
    setTimeout(()=>b.textContent=old,1400);
  }catch{alert("رقم Vodafone Cash: "+phone)}
});
