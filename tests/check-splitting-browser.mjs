import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
const dir=new URL('../.test-output/',import.meta.url);mkdirSync(dir,{recursive:true});
const input=new URL('sixty.mp4',dir).pathname.replace(/^\/(?:([A-Z]:))/, '$1');
execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','lavfi','-i','color=c=red:s=64x64:r=30:d=30','-f','lavfi','-i','color=c=blue:s=64x64:r=30:d=30','-f','lavfi','-i','sine=frequency=440:duration=60.2','-filter_complex','[0:v][1:v]concat=n=2:v=1:a=0[v]','-map','[v]','-map','2:a','-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac',input]);
const browser=await chromium.launch({headless:true});
try {
 for(const fps of (process.env.TEST_FPS ? [process.env.TEST_FPS] : ['30','60'])) {
  const page=await browser.newPage({acceptDownloads:true});
  page.on('pageerror',e=>console.error(e));
  await page.goto(process.env.SITE_URL || 'http://127.0.0.1:4173/storyforgeWS/');
  await page.locator('#video').setInputFiles(input);
  await page.locator('#fps').selectOption(fps);
  await page.locator('#convert').click();
  await page.waitForFunction(()=>document.querySelector('#convert').disabled===false,null,{timeout:600000});
  const status=await page.locator('#status').innerText();console.log(fps+' FPS: '+status);
  assert.match(status,/Finished/);
  const links=page.locator('.result a[download]');assert.equal(await links.count(),2);
  for(let i=0;i<2;i++) {
   const event=page.waitForEvent('download');await links.nth(i).click();const download=await event;
   const path=new URL(`${fps}-part${i+1}.mp4`,dir).pathname.replace(/^\/(?:([A-Z]:))/, '$1');
   await download.saveAs(path);
   const info=JSON.parse(execFileSync('ffprobe',['-v','error','-show_format','-show_streams','-of','json',path],{encoding:'utf8'}));
   assert.equal(Number(info.format.duration),30);assert.ok(Number(info.format.size)<=31500000);
   const video=info.streams.find(s=>s.codec_type==='video');assert.equal(video.width,1080);assert.equal(video.height,1920);assert.equal(video.avg_frame_rate,fps+'/1');assert.equal(Number(video.nb_frames),Number(fps)*30);
   assert.ok(info.streams.some(s=>s.codec_type==='audio'));
   // Verify both ends of each part: red source seconds 0–30, blue seconds 30–60.
   for(const t of ['0','29.9']) {
    const pixel=execFileSync('ffmpeg',['-v','error','-ss',t,'-i',path,'-vf','crop=2:2:540:960,scale=1:1','-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1']);
    assert.ok(i===0 ? pixel[0]>200 && pixel[2]<20 : pixel[2]>200 && pixel[0]<20);
   }
   console.log(`${fps} FPS part ${i+1}: 30.000s, ${info.format.size} bytes, correct source interval`);
  }
  await page.close();
 }
}finally {await browser.close();}
