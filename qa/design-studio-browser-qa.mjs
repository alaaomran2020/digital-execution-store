// Real-browser visual smoke tests for the isolated design studio.
// Runs against a local static preview of the PR, NOT production or remote Staging.
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { chromium } from "playwright";

const origin=process.env.PREVIEW_ORIGIN || "http://127.0.0.1:4173";
const path="/services/graphic-design/";
const widths=[320,390,768,1440];
const output="artifacts/design-visual-qa";
mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const results=[];
try {
  for(const width of widths) {
    const page=await browser.newPage({viewport:{width,height:850},deviceScaleFactor:1,reducedMotion:"reduce",isMobile:width<=390,hasTouch:width<=390});
    const errors=[];
    page.on("pageerror",error=>errors.push(error.message));
    await page.goto(origin+path,{waitUntil:"networkidle",timeout:30000});
    await page.locator(".ds-service-card").first().waitFor();
    const metrics=await page.evaluate(()=>{
      const cards=[...document.querySelectorAll(".ds-service-card")];
      const hero=document.querySelector(".ds-hero");
      const style=getComputedStyle(hero);
      const cardStyle=getComputedStyle(cards[0]);
      const bounds=hero.getBoundingClientRect();
      return {
        viewport:innerWidth,bodyScrollWidth:document.body.scrollWidth,documentScrollWidth:document.documentElement.scrollWidth,
        heroRight:bounds.right,heroLeft:bounds.left,background:style.backgroundImage,
        cardCount:cards.length,cardBackground:cardStyle.backgroundColor,
        categoryAnchors:[...document.querySelectorAll('.ds-quick-nav a')].map(a=>a.getAttribute("href")),
        emailAnchors:[...document.querySelectorAll('a[href^="mailto:"]')].length,
        projectBrief:!!document.querySelector("#ds-brief-form"),
        serviceBriefAnchors:document.querySelectorAll(".ds-card-link[data-design-type]").length,
        productAnchors:[...document.querySelectorAll('a[href^="/products/"]')].length,
        title:document.title, mainLandmarks:document.querySelectorAll("main").length,
        cssLoaded:[...document.styleSheets].some(s=>s.href?.includes("/services/graphic-design/studio.css"))
      };
    });
    const checks=[];
    const check=(pass,message)=>{checks.push({pass,message});assert.ok(pass,"width "+width+": "+message)};
    check(metrics.viewport===width,"Correct viewport width");
    check(metrics.cssLoaded,"Scoped studio CSS loaded");
    check(metrics.cardCount===8,"Eight design service cards displayed");
    check(metrics.categoryAnchors.length===8,"Eight category navigation shortcuts");
    check(metrics.categoryAnchors.every(h=>h?.startsWith("#ds-")),"Category links are valid in-page anchors");
    check(metrics.emailAnchors>=1,"Direct email fallback retained");
    check(metrics.projectBrief,"Accessible project brief form displayed");
    check(metrics.serviceBriefAnchors===8,"Eight service cards link to the brief builder");
    check(metrics.productAnchors===0,"Paused products not linked");
    check(metrics.mainLandmarks===1,"Single main landmark");
    check(metrics.documentScrollWidth<=width+1 && metrics.bodyScrollWidth<=width+1,
      "No horizontal overflow");
    check(metrics.heroLeft>=-1 && metrics.heroRight<=width+1,
      "Hero stays inside viewport");
    check(metrics.background.includes("linear-gradient"),
      "New studio gradient visibly applied");
    check(metrics.cardBackground==="rgb(248, 246, 252)",
      "Light creative studio cards rendered");
    await page.screenshot({path:output+"/studio-"+width+"-full.png",fullPage:true,animations:"disabled"});
    await page.screenshot({path:output+"/studio-"+width+"-top.png",fullPage:false,animations:"disabled"});
    await page.locator('.ds-quick-nav a[href="#ds-social"]').click();
    check(new URL(page.url()).hash==="#ds-social","Navigation jumps to selected category");
    await page.locator('#ds-social .ds-card-link').click();
    check(await page.locator("#ds-kind").inputValue()==="ds-social","Service click preselects design type");
    check(!(await page.locator("#ds-brief-result").isVisible()),"Brief preview starts hidden");
    await page.locator("#ds-project").fill("مشروع اختبار الواجهة");
    await page.locator("#ds-details").fill("نحتاج تصميمات اختبار للاستخدام الداخلي فقط");
    await page.locator("#ds-usage").fill("Instagram");
    await page.locator("#ds-contact-email").fill("test@example.com");
    await page.locator('#ds-brief-form button[type="submit"]').click();
    check(await page.locator("#ds-brief-result").isVisible(),"Generated project brief is displayed");
    const body=await page.locator("#ds-brief-preview").inputValue();
    const mail=await page.locator("#ds-brief-email").getAttribute("href");
    check(body.includes("مشروع اختبار الواجهة")&&body.includes("سوشيال ميديا")&&body.includes("Instagram"),
      "Generated content uses the entered values and selected service");
    check(mail?.startsWith("mailto:contact@digital-execution.cc?")&&mail.includes("body=")&&
      decodeURIComponent(mail).includes("test@example.com"),"Encoded mailto is ready without sending anything");
    const downloadPromise=page.waitFor("download");
    await page.locator("#ds-brief-download").click();
    const download=await downloadPromise;
    check(download.suggestedFilename()==="digital-execution-design-brief.txt",
      "Local download uses a consistent non-personal file name");
    const saved=readFileSync(await download.path(),"utf8").replace(/^\uFEFF/,"");
    check(saved===body,"Downloaded UTF-8 TXT preserves the full Arabic project brief");
    check((await page.locator("#ds-brief-status").textContent()).includes("لم يتم رفع"),
      "Download status explains that the brief is not uploaded");
    await page.locator("#ds-project").fill("مشروع اختبار محدّث");
    check(!(await page.locator("#ds-brief-result").isVisible()),"Stale brief hides after edits");
    if(width<=390){
      const toggle=page.locator(".site-header-menu-btn");
      check(await toggle.isVisible(),"Mobile header menu button is visible");
      await toggle.click();
      check((await toggle.getAttribute("aria-expanded"))==="true","Mobile navigation opens");
      check(await page.locator("#siteHeaderMobile").isVisible(),"Mobile navigation links are visible");
      await page.keyboard.press("Escape");
      check((await toggle.getAttribute("aria-expanded"))==="false","Escape closes mobile navigation");
    }
    await page.locator(".ds-service-card").last().scrollIntoViewIfNeeded();
    check(await page.locator(".ds-service-card").last().isVisible(),"Final category reachable");
    results.push({width,status:"PASS",checks,metrics,pageErrors:errors});
    console.log("PASS: "+width+"px ("+checks.length+" assertions), screenshot captured; page errors="+errors.length);
    await page.close();
  }
} catch(error) {
  results.push({status:"FAIL",error:String(error)});
  throw error;
} finally {
  writeFileSync(output+"/report.json",JSON.stringify({source:"local CI preview (not Cloudflare Staging)",origin,path,results},null,2));
  await browser.close();
}
