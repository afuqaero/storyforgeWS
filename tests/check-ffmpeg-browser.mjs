import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try {
 const page=await browser.newPage();
 page.on('console',m=>console.log('console:',m.type(),m.text()));
 page.on('pageerror',e=>console.log('page-error:',e.message));
 await page.goto('http://127.0.0.1:4173/storyforgeWS/?ffmpeg-diagnostic',{waitUntil:'load'});
 await page.waitForFunction(()=>typeof window.__storyforgeFilterCheck==='function',{timeout:10000});
 if(await page.locator('#quality').count()!==0)throw new Error('Old quality dropdown is still present');
 if(await page.locator('#fps option').count()!==2)throw new Error('30/60 FPS choice missing');
 if(await page.locator('.auto-quality').count()!==1)throw new Error('Automatic quality panel missing');
 console.log('AUTO_QUALITY_UI=PASS');
 const result=await page.evaluate(()=>window.__storyforgeFilterCheck());
 console.log('FFMPEG_HDR_CAPABILITIES='+JSON.stringify(result));
 if(!result.zscale || !result.tonemap || result.testExitCode!==0 || !(result.outputBytes>0))process.exitCode=1;
}finally{await browser.close();}
