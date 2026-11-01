import assert from 'node:assert/strict';
import vm from 'node:vm';
import worker,{illustrationKey} from '../worker/index.js';
const node={title:'Restaurant',kind:'actor',summary:'Surplus meals'};
assert.equal(illustrationKey(node),illustrationKey({...node,title:' RESTAURANT ',summary:'Updated details'}));
assert.notEqual(illustrationKey(node),illustrationKey({...node,title:'Kitchen'}));
const original=globalThis.fetch,env={OPENAI_API_KEY:'test-image-key'};let calls=0,release;
const req=(node,origin='http://localhost')=>new Request('http://localhost/api/illustrate',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({node})});
try{
 globalThis.fetch=async(url,options)=>{calls++;assert.equal(url,'https://api.openai.com/v1/images/generations');assert.equal(options.headers.Authorization,'Bearer test-image-key');const b=JSON.parse(options.body);assert.equal(b.quality,'medium');assert.equal(b.n,1);assert.equal(b.model,'gpt-image-2.5-flare');await new Promise(r=>release=r);return new Response(JSON.stringify({data:[{b64_json:'aW1hZ2U='}]}))};
 const a=worker.fetch(req(node),env),b=worker.fetch(req(node),env);await new Promise(r=>setTimeout(r,0));assert.equal(calls,1,'Concurrent identical concepts must share a generation');release();const results=await Promise.all([a,b]);assert.deepEqual(await results[0].json(),await results[1].json());
 const cached=await(await worker.fetch(req(node),env)).json();assert.equal(cached.cached,true);assert.equal(calls,1);
 const releaseBatch=[];globalThis.fetch=async()=>{await new Promise(r=>releaseBatch.push(r));return new Response(JSON.stringify({data:[{b64_json:'YQ=='}]}))};
 const batch=['First','Second','Third'].map(title=>worker.fetch(req({title}),env));await new Promise(r=>setTimeout(r,0));assert.equal(releaseBatch.length,3,'Distinct images must all reach OpenAI before any completes');releaseBatch.forEach(r=>r());assert((await Promise.all(batch)).every(r=>r.status===200));
 assert.equal((await worker.fetch(req({...node,provisional:true}),env)).status,400);assert.equal((await worker.fetch(req({title:''}),env)).status,400);assert.equal((await worker.fetch(req(node,'https://elsewhere.test'),env)).status,403);assert.equal((await worker.fetch(req(node),{})).status,503);
 globalThis.fetch=async()=>new Response(JSON.stringify({error:{message:'Quota unavailable test-image-key'}}),{status:429});const failure=await worker.fetch(req({title:'Other'}),env);assert.equal(failure.status,502);assert(!(await failure.text()).includes(env.OPENAI_API_KEY));
 globalThis.fetch=async()=>new Response(JSON.stringify({data:[{b64_json:'YQ=='}]}));assert.equal((await worker.fetch(req({title:'Other'}),env)).status,200,'A failed image must be retryable');
}finally{globalThis.fetch=original}
const html=await(await worker.fetch(new Request('http://localhost/'))).text(),script=html.split('<script>')[1].split('</script>')[0];
const client=script.slice(script.indexOf("let imageModel='"),script.indexOf('function resetConversation'));
const context=vm.createContext({assert,illustrationKey,Map,Set,setTimeout:()=>0,clearTimeout:()=>{},localStorage:{getItem:()=>null},window:{},conceptKind:n=>n.kind||'entity'});
await vm.runInContext(`
let p={nodes:[{title:'Restaurant',kind:'actor'}]},review=null,configured=true;const elements={},saved=new Map(),calls=[];const $=s=>elements[s]||(elements[s]={dataset:{}});function draw(){}async function post(path,body){calls.push(body.node.title);return {image:'data:image/jpeg;base64,YQ=='}}
`+client+`
readImage=async key=>saved.get(key);writeImage=(key,image)=>saved.set(key,image);smallImage=async s=>s;imageReady=true;
(async()=>{await fillImages();await fillImages();assert.equal(calls.length,1);nodeImages.clear();await fillImages();assert.equal(calls.length,1,'Reloaded thumbnails must not regenerate');p.nodes[0].title='Kitchen';await fillImages();assert.equal(calls.length,2);p.nodes=[{title:'Tentative',provisional:true}];await fillImages();assert.equal(calls.length,2);p.nodes=[{title:'Paused'}];imagesEnabled=false;await fillImages();assert.equal(calls.length,2);imagesEnabled=true;post=async()=>{throw Error('No quota')};await fillImages();await fillImages();assert.equal(imageFailures.size,1);assert.equal($('#image-panel').dataset.state,'error');assert.equal($('#retry-images').hidden,false);
p.nodes=[{title:'Parallel A'},{title:'Parallel B'},{title:'Parallel C'}];const started=[],releases=[];post=async(path,body)=>{started.push(body.node.title);return new Promise(resolve=>releases.push(()=>resolve({image:'data:image/jpeg;base64,YQ=='})))};
const first=fillImages();await Promise.resolve();await Promise.resolve();assert.equal(started.length,3,'All missing illustrations must start together');p.nodes.push({title:'Arrived later'});const second=fillImages();await Promise.resolve();await Promise.resolve();assert.equal(started.length,4,'New concepts must not wait for existing image jobs');releases.forEach(r=>r());await Promise.all([first,second]);assert.equal(imagePending.size,0);
})()
`,context);
console.log('Passed: medium-quality image parameters, simultaneous distinct generations, shared duplicates, cached thumbnails, rename invalidation, no draft generation, pause, retry and API key isolation.');
