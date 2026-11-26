import './style.css';
import { planParts, allClipsSafe, resolveDuration, clipTimingArgs } from './export-planner.js';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const root = document.querySelector('#app');
root.innerHTML = `
<div class="wrap"><nav><div class="logo">🎬 StoryForge<span>WS</span></div><a class="navlink" href="https://github.com/afuqaero/storyforgeWS" target="_blank" rel="noopener">GitHub ↗</a></nav>
<div class="tag">Private • Browser-based • No video uploads</div>
<h1>Convert on the web.<br><span>Keep your footage private.</span></h1>
<p class="subtitle">Prepare 1080 × 1920 WhatsApp Status clips directly in your browser. Nothing is uploaded to a server. No localhost, Tailscale, or Cloudflare Tunnel required.</p>
<div class="shell">
<label id="drop" class="drop" tabindex="0"><input id="video" type="file" accept="video/*,.mov,.mp4" /><div style="font-size:34px">📁</div><strong id="filelabel">Choose your original video</strong><small>MP4 / MOV • iPhone HDR/HLG supported where browser memory allows</small></label>
<div class="controls"><label class="field">Frame rate<select id="fps"><option value="60">60 FPS · smoother motion</option><option value="30">30 FPS · smaller and faster</option></select><span class="hint">Choose only motion smoothness. Everything else is optimized automatically.</span></label>
<div class="auto-quality"><div class="auto-title">✨ Automatic quality optimization <span class="auto-check">Enabled ✓</span></div><p>StoryForge preserves detail, converts iPhone HDR to SDR when needed, and automatically splits videos into consecutive parts of at most 30 seconds. A 60-second video becomes two 30-second downloads.</p><div class="auto-details"><span>1080 × 1920</span><span>H.264 · AAC</span><span>≤ 31.5 MB / clip</span><span>≤ 30 seconds / part</span></div></div></div>
<div class="notice" id="warning">🎨 iPhone HDR/HLG/PQ input: StoryForge detects transfer metadata and uses the Hable tone-mapping pipeline to create BT.709 SDR. Browser processing can be slow or run out of memory on long 60 FPS recordings. Test short clips first.</div>
<div class="actions"><button class="btn" id="convert">Convert video</button><button class="btn outline" id="cancel" disabled>Cancel</button></div>
<div class="progress"><div class="bar" id="bar"></div></div><div class="status" id="status" role="status" aria-live="polite">Ready. The browser loads its FFmpeg engine on first conversion (about 30 MB, hosted with StoryForge).</div>
<div id="results" class="results"></div>
</div><div class="foot">🔒 Video is processed in your browser's memory. It is never uploaded to StoryForge or GitHub. <br>📱 On mobile, tap Download or Share, then choose WhatsApp → Message yourself and enable HD if WhatsApp offers it. The browser cannot force WhatsApp HD or select your recipient.<br>💡 iPhone Safari and low-memory phones may struggle with large videos. WhatsApp may recompress Status posts.</div></div>`;
const $ = id => document.getElementById(id);
let ffmpeg, currentFile, running=false, outputUrls=[], stopped=false;
let probeLogs=[];
const status = s => $('status').textContent=s;
const bar = p => $('bar').style.width=Math.max(0,Math.min(100,Math.round(p)))+'%';
const bytes = n => (n/1e6).toFixed(2)+' MB';
$('video').addEventListener('change',e=>selectFile(e.target.files[0]));
const drop=$('drop');
drop.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('drag')});
drop.addEventListener('dragleave',()=>drop.classList.remove('drag'));
drop.addEventListener('drop',e=>{e.preventDefault();drop.classList.remove('drag');selectFile(e.dataTransfer.files[0])});
drop.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('video').click()}});
function selectFile(f){if(!f)return;currentFile=f;$('filelabel').textContent=f.name+' · '+bytes(f.size);status('Selected '+f.name+'. Ready to convert.');for(const url of outputUrls)URL.revokeObjectURL(url);outputUrls=[];$('results').replaceChildren();bar(0)}
function addResult(blob,name,index,total){
  const url=URL.createObjectURL(blob);outputUrls.push(url);
  const row=document.createElement('div');row.className='result';
  const label=document.createElement('div');const strong=document.createElement('strong');strong.textContent=name;const sub=document.createElement('div');sub.className='small';sub.textContent=bytes(blob.size)+' · Part '+index+' of '+total;label.append(strong,sub);
  const links=document.createElement('div');links.className='actions';links.style.margin='0';
  const download=document.createElement('a');download.href=url;download.download=name;download.textContent='⬇ Download Part '+index;
  const share=document.createElement('button');share.className='btn outline';share.style.padding='9px 12px';share.textContent='Share';
  share.addEventListener('click',async()=>{const file=new File([blob],name,{type:'video/mp4'});try{if(navigator.canShare?.({files:[file]}))await navigator.share({files:[file],title:name});else {download.click();status('File saved. Open WhatsApp and attach it from your gallery.') }}catch(e){if(e.name!=='AbortError')status('Sharing was unavailable. Please download and share manually.')}});
  links.append(download,share);row.append(label,links);$('results').append(row);
}
async function engine(){
 if(ffmpeg?.loaded)return ffmpeg;
 status('Loading FFmpeg WebAssembly… first load can take a while.');
 const inst=new FFmpeg();inst.on('log',({message})=>{if(probeLogs.length<2000)probeLogs.push(message)});
 inst.on('progress',({progress})=>{if(running&&Number.isFinite(progress))bar(Math.min(93, Math.max(0,progress*65)))});
 const base=import.meta.env.BASE_URL+'ffmpeg';
 await inst.load({coreURL:await toBlobURL(base+'/ffmpeg-core.js','text/javascript'),wasmURL:await toBlobURL(base+'/ffmpeg-core.wasm','application/wasm')});
 ffmpeg=inst;return inst;
}
function probeDuration(file){return new Promise(resolve=>{const el=document.createElement('video');el.preload='metadata';el.muted=true;const url=URL.createObjectURL(file);el.onloadedmetadata=()=>{let duration=el.duration;URL.revokeObjectURL(url);resolve(duration)};el.onerror=()=>{URL.revokeObjectURL(url);resolve(NaN)};el.src=url})}
async function exec(args){const r=await ffmpeg.exec(args);if(r!==0)throw Error('FFmpeg exited with code '+r)}
const fullFrame='scale=1080:1920:force_original_aspect_ratio=decrease:flags=lanczos,pad=1080:1920:(ow-iw)/2:(oh-ih)/2';
const hdrToSdr='zscale=transfer=linear:npl=100,format=gbrpf32le,tonemap=tonemap=hable:desat=0,zscale=primaries=bt709:transfer=bt709:matrix=bt709:range=limited,format=yuv420p';
function vf(hdr){return (hdr ? hdrToSdr+',' : '')+fullFrame+',format=yuv420p'}
function detectHdr(log){
  // iPhone Dolby Vision profile 8.4 uses the HLG-compatible base layer.
  // Require HDR transfer signalling rather than guessing from .mov or HEVC.
  const transfer=/arib-std-b67|smpte2084|smpte-2084|\bhlg\b|\bpq\b/i;
  const hdr=log.split('\n').some(line=>/video:|Stream #|color_|side data|DOVI|Dolby Vision/i.test(line)&&transfer.test(line));
  return {hdr, transfer:hdr?(log.match(transfer)||[])[0]:'SDR/unknown'};
}
async function verifyHdrFilters(f) {
  probeLogs=[];
  await f.exec(['-hide_banner','-filters']);
  const listing=probeLogs.join('\n');
  if(!/\bzscale\b/.test(listing)||!/\btonemap\b/.test(listing))
    throw Error('This browser FFmpeg engine lacks zscale/tonemap, so it cannot safely convert iPhone HDR. Use StoryForge Desktop for this video.');
}

async function convertAll(){
 if(!currentFile||running){if(!currentFile)status('Choose a video first.');return}
 running=true;stopped=false;$('convert').disabled=true;$('cancel').disabled=false;$('results').replaceChildren();outputUrls.forEach(u=>URL.revokeObjectURL(u));outputUrls=[];
 try{
   let duration=await probeDuration(currentFile);
   if(currentFile.size>350*1024*1024)throw Error('For browser safety, please use a video smaller than 350 MiB, or use the desktop version.');
   const f=await engine();
   status('Loading video into browser memory…');
   const name='input'+(currentFile.name.toLowerCase().endsWith('.mov')?'.mov':'.mp4');await f.writeFile(name,await fetchFile(currentFile));
   status('Checking source video properties…');
   probeLogs=[];
   await f.exec(['-hide_banner','-i',name]);
   const sourceInfo=probeLogs.join('\n');
   // Use the video stream's precise duration: audio padding can extend the container.
   let videoDuration;
   const probeFile='duration.json';
   try {
     await f.ffprobe(['-v','error','-select_streams','v:0','-show_entries','stream=duration','-of','json',name,'-o',probeFile]);
     // This WASM build can retain the preceding input-only probe's exit code.
     // Read the structured result rather than discarding valid duration data.
     videoDuration=Number(JSON.parse(await f.readFile(probeFile,'utf8')).streams?.[0]?.duration);
   } finally {try{await f.deleteFile(probeFile)}catch{}}
   duration=resolveDuration(duration,sourceInfo,videoDuration);

   const {hdr,transfer}=detectHdr(sourceInfo);
   if(hdr) {
     status('iPhone HDR detected ('+transfer+'). Checking tone-mapping filters…');
     await verifyHdrFilters(f);
     status('HDR confirmed. Hable tone mapping will convert highlights to BT.709 SDR.');
   } else if (/bt2020|bt\.2020/i.test(sourceInfo)) {
     throw Error('BT.2020 source detected without recognizable HLG/PQ transfer. Refusing unsafe colour conversion. Try the desktop edition.');
   }
   const fps=$('fps').value==='60'?'60':'30';
   const audio=['-c:a','aac','-b:a','128k','-ar','44100','-ac','2'];
   // Quality-first automatic mode.
   // Try a 30-second CRF 20 export first. If it's too large, retry the
   // complete set at a lower bitrate, keeping the same 30-second boundaries.
   let files=[], complete=false;
   const profiles=[
     {label:'High quality (CRF 20)',crf:20},
     ...[8200,7800,7400,6600,5800].map(kbps=>({label:kbps+' kbps',kbps}))
   ];
   const seconds=30;
   const clips=planParts(duration);
   for(const profile of profiles){
     if(stopped)throw Error('Conversion cancelled.');
     const trial=[];
     try{
       for(const clip of clips){
         const dest='clip_'+clip.index+'.mp4';
         const v=['-c:v','libx264','-preset','ultrafast','-profile:v','high','-level:v',fps==='60'?'4.2':'4.0','-pix_fmt','yuv420p','-r',fps,'-vf',vf(hdr)+',fps='+fps,'-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-color_range','tv'];
         const rateArgs=profile.crf!==undefined?['-crf',String(profile.crf)]:['-b:v',profile.kbps+'k','-maxrate','9500k','-bufsize','19000k'];
         status((hdr?'HDR → SDR · ':'')+'Optimizing clip '+(clip.index+1)+'/'+clips.length+' · '+profile.label+' · '+seconds+'s max');
         await exec(['-hide_banner','-y','-ss',String(clip.start),'-i',name,'-map','0:v:0','-map','0:a:0?','-sn','-dn',...v,...rateArgs,...audio,...clipTimingArgs(clip),'-movflags','+faststart','-map_metadata','-1','-fps_mode','cfr',dest]);
         const data=await f.readFile(dest);
         trial.push({name:dest,data});
         bar(10+Math.min(79,79*(clip.index+1)/clips.length));
       }
       if(allClipsSafe(trial)){files=trial;complete=true;break}
       const biggest=Math.max(...trial.map(item=>item.data.byteLength));
       status('Output reached '+bytes(biggest)+', above 31.5 MB. Retrying with a smaller bitrate…');
     }finally{
       if(!complete){
         for(const item of trial){try{await f.deleteFile(item.name)}catch{}}
       }
     }
   }
   if(!complete)throw Error('Could not fit the clips under 31.5 MB using safe presets. Try 30 FPS or StoryForge Desktop.');
   for(let i=0;i<files.length;i++)addResult(new Blob([files[i].data],{type:'video/mp4'}),'StoryForge_Part'+String(i+1).padStart(2,'0')+'of'+String(files.length).padStart(2,'0')+'.mp4',i+1,files.length);
   status('✅ Finished! '+files.length+' clip(s) optimized in your browser with automatic quality. Check them before posting to WhatsApp.');bar(100);
   try{await f.deleteFile(name);for(const x of files)await f.deleteFile(x.name)}catch{}
 }catch(e){status('⚠️ '+(e?.message||String(e)));console.error(e)}
 finally{running=false;$('convert').disabled=false;$('cancel').disabled=true}
}
$('convert').addEventListener('click',convertAll);
$('cancel').addEventListener('click',async()=>{stopped=true;status('Cancelling…');if(ffmpeg?.loaded){await ffmpeg.terminate();ffmpeg=null;}running=false;$('convert').disabled=false;$('cancel').disabled=true;status('Conversion cancelled. You can try again.')});

if (new URLSearchParams(location.search).has('ffmpeg-diagnostic')) {
  window.__storyforgeFilterCheck = async () => {
    const f=await engine();
    probeLogs=[];
    await f.exec(['-hide_banner','-filters']);
    const lines=probeLogs.join('\n');
    const result={zscale:/\bzscale\b/.test(lines),tonemap:/\btonemap\b/.test(lines),lines:lines.slice(0,2000)};
    if(result.zscale&&result.tonemap){
      probeLogs=[];
      const testFilter='format=yuv420p10le,setparams=range=tv:color_primaries=bt2020:color_trc=arib-std-b67:colorspace=bt2020nc,'+hdrToSdr;
      result.testExitCode=await f.exec(['-hide_banner','-f','lavfi','-i','testsrc2=size=64x64:rate=1:duration=1','-vf',testFilter,'-frames:v','1','-c:v','libx264','-pix_fmt','yuv420p','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-f','mp4','diagnostic.mp4']);
      result.testLog=probeLogs.slice(-20).join('\n');
      if(result.testExitCode===0){const out=await f.readFile('diagnostic.mp4');result.outputBytes=out.byteLength;await f.deleteFile('diagnostic.mp4')}
    }
    return result;
  };
}
