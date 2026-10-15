const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
(async()=>{
 const events={},stored=new Map(),deleted=[],requests=[];let fail=false,responseStatus=200;
 const response=(status=200)=>({status,ok:status>=200&&status<300,clone:()=>response(status)});
 const cache={addAll:async urls=>{for(const url of urls)stored.set(url,response());},put:async(key,res)=>{assert.notEqual(res.status,206,'never put partial responses');stored.set(typeof key==='string'?key:key.url,res);}};
 const scope={URL,Promise,self:{location:{origin:'https://example.test'},clients:{claim(){}},skipWaiting(){},addEventListener:(name,fn)=>events[name]=fn},caches:{open:async()=>cache,keys:async()=>['liori-studio-v1','unrelated-app'],delete:async name=>{deleted.push(name);return true;},match:async key=>stored.get(typeof key==='string'?key:key.url)},fetch:async(req,opts)=>{requests.push({req,opts});if(fail)throw Error('offline');return response(responseStatus);}};
 vm.runInNewContext(fs.readFileSync('public/sw.js','utf8'),scope);
 const run=async name=>{let pending;events[name]({waitUntil:p=>pending=p});await pending;};
 await run('install');assert(stored.has('./studio-music.wav'),'offline install includes original music');
 await run('activate');assert.deepEqual(deleted,['liori-studio-v1'],'only game cache is replaced');
 const request=async(mode,url)=>{let pending;events.fetch({request:{method:'GET',mode,url},respondWith:p=>pending=p});return await pending;};
 await request('navigate','https://example.test/KEFEL-GAME/');assert.equal(requests[0].opts?.cache,'no-store');
 fail=true;assert.equal((await request('navigate','https://example.test/KEFEL-GAME/')).status,200);fail=false;
 responseStatus=206;await request('cors','https://example.test/KEFEL-GAME/music-range.wav');
 console.log('Offline update, music caching and partial-response checks passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
