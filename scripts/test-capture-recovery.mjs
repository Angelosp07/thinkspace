import assert from 'node:assert/strict';
import vm from 'node:vm';
import worker from '../worker/index.js';
const html=await(await worker.fetch(new Request('http://localhost/'))).text(),script=html.split('<script>')[1].split('</script>')[0];
const shared=script.slice(0,script.indexOf('const $='));
const turn=script.slice(script.indexOf('async function turn('),script.indexOf("$('.composer').onsubmit"));
const reconcile=script.slice(script.indexOf('function reconcileVisuals('),script.indexOf('function graphView('));
const speech=script.slice(script.indexOf('function refreshDraft('),script.indexOf('function voiceState('));
const storage=new Map(),sandbox={assert,structuredClone,Date,Map,Set,localStorage:{setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k)},setTimeout:()=>1,clearTimeout:()=>{},settle:()=>new Promise(resolve=>setImmediate(resolve))};
await vm.runInNewContext(shared+`
let p={version:1,title:'Test',revision:0,nodes:[],edges:[]},busy=false,epoch=0,history=[],highlights={},scenario=null,review=null,recording=true,interactionMode='create',selected=null;
let draft={nodes:[],edges:[]},inFlightText='',inFlightThought=null,retryThought=null,pendingSpeech='',liveInterim='',pendingContext=null,flushTimer=null,speechCapture=[];const speechQueue=[],visuals=new Map(),edgeBirths=new Map(),elements={};
const $=key=>elements[key]||(elements[key]={value:'live',textContent:'',dataset:{}});function context(){return {mode:interactionMode,selected,epoch}}function draw(){}function notice(text){$('#notice').textContent=text}function workState(text){$('#status').textContent=text}function answer(){}function download(){}function checkpoint(){}function select(){}function persist(){saveSpeechState()}function ui(){persist()}
let shouldFail=true;const calls=[];async function post(path,body){calls.push(body.utterance);if(shouldFail)throw Error('Temporary connection failure');const titles=body.utterance.startsWith('Restaurants')?['Restaurant','Student']:['Compost hub','Garden'];return {result:{intent:'build',answer:'Saved',nodes:titles.map(title=>({id:title.toLowerCase().replaceAll(' ','-'),title,properties:[]})),edges:[],highlights:[]}}}
`+script.slice(script.indexOf('function remapConceptReferences('),script.indexOf('function closeCard('))+turn+reconcile+speech+`
(async()=>{
refreshDraft('A rest');const initial=draft.nodes[0],visual={node:initial,world:[30,40,50],element:{dataset:{}}};initial.position=[30,40,50];visuals.set(initial.id,visual);
refreshDraft('A restaurant');assert.equal(visuals.get(draft.nodes[0].id),visual,'Finishing a partial word keeps the same sphere');assert.deepEqual(draft.nodes[0].position,[30,40,50]);
reconcileVisuals([{id:'confirmed-restaurant',title:'Restaurant',aliases:['restaurants']}]);assert.equal(visuals.get('confirmed-restaurant'),visual,'Confirmation adopts the existing sphere');visuals.clear();draft={nodes:[],edges:[]};
acceptSpeech('Restaurants connect students.');flushSpeech();await settle();assert(retryThought);assert.equal(p.nodes.length,0);assert.equal($('#retry-thought').hidden,false);
acceptSpeech('A compost hub supplies gardens.');flushSpeech();await settle();assert.equal(calls.length,1,'Later speech must wait for failed earlier speech');assert.equal(speechQueue.length,1);assert(draft.nodes.some(n=>/restaurant/i.test(n.title)),'Failed thought must remain in the preview');assert(draft.nodes.some(n=>/compost/i.test(n.title)));
// Simulate reloading the same saved graph. Both unfinished chunks survive.
const capturedText=speechCapture.map(x=>x.text);retryThought=null;speechQueue.length=0;speechCapture=[];epoch=7;restoreSpeechState();assert.equal(retryThought.ctx.epoch,7);assert.equal(speechQueue.length,1);assert.deepEqual(speechCapture.map(x=>x.text),capturedText);
shouldFail=false;$('#retry-thought').onclick();await settle();await settle();assert.equal(p.nodes.length,4);assert.equal(retryThought,null);assert.equal(speechQueue.length,0);assert.equal(draft.nodes.length,0);assert.equal($('#retry-thought').hidden,true);assert.equal(calls[1],'Restaurants connect students.');assert.equal(calls[2],'A compost hub supplies gardens.');
const saved=JSON.parse(localStorage.getItem('thinkspace-speech'));assert.equal(saved.work.length,0);assert.equal(saved.captured.length,2);
})()
`,sandbox);
const oversized=await worker.fetch(new Request('http://localhost/api/turn',{method:'POST',body:JSON.stringify({project:{version:1,title:'Test',revision:0,nodes:[],edges:[]},utterance:'x'.repeat(6001)})}),{OPENAI_API_KEY:'test'});assert.equal(oversized.status,400);assert.match((await oversized.json()).error,/not been truncated/);
console.log('Passed: failed-chunk retention, later-speech ordering, preview survival, reload recovery, successful retry and no silent text truncation.');
