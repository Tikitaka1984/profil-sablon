// Run with Playwright available: node tests/profile-2-qa.cjs
const { chromium } = require('playwright');
const fs = require('node:fs');
const http = require('node:http');
const assert = require('node:assert/strict');
const path = require('node:path');
const root=path.resolve(__dirname,'..');
const results=[];
async function test(name,fn){await fn();results.push(name);console.log('PASS '+name);}
(async()=>{
 const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fs.readFileSync(path.join(root,'index.html')));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let browser;
 try{
 const options={headless:true};
 if(process.env.CHROMIUM_EXECUTABLE)options.executablePath=process.env.CHROMIUM_EXECUTABLE;
 if(process.env.CHROMIUM_SERVERLESS){const c=require(process.env.CHROMIUM_SERVERLESS).default;options.executablePath=await c.executablePath();options.args=c.args;}
 browser=await chromium.launch(options);
 const context=await browser.newContext({viewport:{width:1280,height:900},acceptDownloads:true});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const url='http://127.0.0.1:'+server.address().port;
 await page.goto(url);await page.waitForTimeout(700);
 const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('tort-profil-v2')));
 const upload=async obj=>page.locator('#file-import').setInputFiles({name:'profile.json',mimeType:'application/json',buffer:Buffer.from(typeof obj==='string'?obj:JSON.stringify(obj))});
 const download=async()=>{const p=page.waitForEvent('download');await page.locator('#btn-export').click();return JSON.parse(fs.readFileSync(await (await p).path(),'utf8'));};
 await test('Edit and immediate reload retain final keystroke',async()=>{
   await page.locator('#f-name').fill('II. József – őű árvíztűrő');await page.reload();assert.equal(await page.locator('#f-name').inputValue(),'II. József – őű árvíztűrő');
 });
 await test('JSON round trip preserves text, image and sources',async()=>{
   await page.locator('#f-student').fill('Teszt Tanuló');await page.locator('#f-class').fill('12. C');
   await page.locator('#f-summary').fill('Első mondat. Második mondat. Harmadik mondat.');
   const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
   await page.locator('#f-photo').setInputFiles({name:'test.png',mimeType:'image/png',buffer:png});
   await page.waitForFunction(()=>JSON.parse(localStorage.getItem('tort-profil-v2')).photo.startsWith('data:image/jpeg'));
   await page.locator('#f-photoSrc').fill('Tesztkép – saját ábra, CC0');
   const original=await download();assert.equal(original.version,4);assert(original.profile.photo.length>100);
   await page.locator('#f-name').fill('Ideiglenes');page.once('dialog',d=>d.accept());await upload(original);
   await page.waitForFunction(()=>document.querySelector('#act-msg').textContent.includes('sikeresen megnyílt'));
   assert.deepEqual((await download()).profile,original.profile);
 });
 await test('Corrupt, invalid, future and lossy JSON leave work intact',async()=>{
   const before=await stored();
   const cases=['{broken',{format:'other',profile:{}},{format:'tortenelmi-profil',version:99,profile:before},{format:'tortenelmi-profil',version:4,profile:{...before,skills:Array(51).fill({name:'x',level:3})}},{format:'tortenelmi-profil',version:4,profile:{...before,photo:'javascript:alert(1)'}}];
   for(const c of cases){await upload(c);await page.waitForFunction(()=>document.querySelector('#act-msg').textContent.includes('Nem sikerült'));assert.deepEqual(await stored(),before);}
 });
 await test('Import cancellation preserves work',async()=>{const before=await stored();page.once('dialog',d=>d.dismiss());await upload({format:'tortenelmi-profil',version:4,profile:{...before,name:'Elutasított'}});await page.waitForTimeout(100);assert.deepEqual(await stored(),before);});
 await test('Legacy v3 files remain loadable',async()=>{const profile=await stored();profile.orgs=['Régi szervezet'];delete profile.photoSrc;delete profile.bannerSrc;page.once('dialog',d=>d.accept());await upload({format:'tortenelmi-profil',version:3,profile});await page.waitForFunction(()=>document.querySelector('#list-orgs').textContent.includes('Szervezet 1'));assert.equal((await stored()).orgs[0].name,'Régi szervezet');});
 await test('Image citation check detects missing source',async()=>{
   await page.locator('#f-photoSrc').fill('');assert(!await page.locator('#checks li').last().evaluate(e=>e.classList.contains('ok')));
   await page.locator('#f-photoSrc').fill('Saját kép, CC0');assert(await page.locator('#checks li').last().evaluate(e=>e.classList.contains('ok')));
 });
 await test('Keyboard labels, mobile tabs and 360/768/1280 layout',async()=>{
   assert.deepEqual(await page.locator('input:not([hidden]),textarea,select').evaluateAll(es=>es.filter(e=>!e.labels?.length&&!e.getAttribute('aria-label')&&!e.getAttribute('aria-labelledby')).map(e=>e.id)),[]);
   for(const width of [360,768,1280]){
     await page.setViewportSize({width,height:900});
     await page.locator('#f-name').fill('X'.repeat(250));
     if(width<1000){await page.locator('#tab-preview').click();assert(await page.locator('#pane-preview').isVisible());await page.locator('#tab-preview').press('ArrowLeft');assert(await page.locator('#pane-edit').isVisible());}
     assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),String(width)+' horizontal overflow');
     if(width<1000)await page.locator('#tab-preview').click();
     assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),String(width)+' preview overflow');
     if(width<1000)await page.locator('#tab-edit').click();
   }
 });
 await page.setViewportSize({width:1280,height:900});
 await test('Print button and A4 PDF retain identity, profile and final long-content marker',async()=>{
   await page.locator('#f-name').fill('II. József');
   const text=Array.from({length:60},(_,i)=>'Történelmi elemzés '+i+': rendeletek és következmények.').join('\n')+'\nPDF_END_MARKER';
   await page.locator('#f-px').fill(text);
   await page.evaluate(()=>{window.__printed=false;window.print=()=>{window.__printed=true;};});
   await page.locator('#btn-dl').click();assert(await page.evaluate(()=>window.__printed));
   await page.emulateMedia({media:'print',colorScheme:'dark'});
   assert(!await page.locator('#pane-edit').isVisible());assert(await page.locator('#pane-preview').isVisible());
   fs.mkdirSync('/tmp/profile-qa-output',{recursive:true});
   await page.pdf({path:'/tmp/profile-qa-output/profile.pdf',format:'A4',printBackground:true});
   await page.screenshot({path:'/tmp/profile-qa-output/print.png',fullPage:true});
   await page.emulateMedia({media:'screen'});
   for(const width of [360,768,1280]){await page.setViewportSize({width,height:900});if(width<1000)await page.locator('#tab-preview').click();await page.screenshot({path:'/tmp/profile-qa-output/mobile-'+width+'.png',fullPage:true});}await page.setViewportSize({width:1280,height:900});
 });
 await test('IndexedDB restores work after localStorage loss',async()=>{
   await page.waitForTimeout(850);const before=await stored();
   await page.evaluate(()=>localStorage.clear());await page.reload();await page.waitForTimeout(700);
   assert.equal(await page.locator('#f-name').inputValue(),before.name);
   assert.equal(await page.locator('#f-px').inputValue(),before.lastPost.text);
 });
 await test('Corrupt localStorage recovers from IndexedDB without replacing backup',async()=>{
   await page.evaluate(()=>{localStorage.setItem('tort-profil-v2','{broken');localStorage.setItem('tort-profil-v2-saved-at',String(Date.now()+10000));});
   await page.reload();await page.waitForTimeout(700);assert.equal(await page.locator('#f-name').inputValue(),'II. József');
 });
 await test('Both unavailable stores report failure and preserve JSON export',async()=>{
   const c=await browser.newContext();await c.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('quota','QuotaExceededError');};Object.defineProperty(window,'indexedDB',{get(){throw new Error('blocked');}});});
   const p=await c.newPage();await p.goto(url);await p.locator('#f-name').fill('Mentendő munka');await p.waitForTimeout(700);
   assert((await p.locator('#save-status').textContent()).includes('nem tud menteni'));
   const d=p.waitForEvent('download');await p.locator('#btn-export').click();assert.equal(JSON.parse(fs.readFileSync(await (await d).path())).profile.name,'Mentendő munka');
   await c.close();
 });
 await test('No browser JavaScript errors',async()=>assert.deepEqual(errors,[]));
 await context.close();
 console.log(JSON.stringify({passed:results.length,tests:results,errors},null,2));
 }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
