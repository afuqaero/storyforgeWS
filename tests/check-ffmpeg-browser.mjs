import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try {
 const page=await browser.newPage();
 page.on('console',m=>console.log('console:',m.type(),m.text()));
 page.on('pageerror',e=>console.log('page-error:',e.message));
 await page.goto('http://127.0.0.1:4173/storyforgeWS/?ffmpeg-diagnostic',{waitUntil:'load'});
 await page.waitForFunction(()=>typeof window.__storyforgeFilterCheck==='function',{timeout:10000});
 const result=await page.evaluate(()=>window.__storyforgeFilterCheck());
 console.log('FFMPEG_HDR_CAPABILITIES='+JSON.stringify(result));
 if(!result.zscale || !result.tonemap)process.exitCode=1;
}finally{await browser.close();}
