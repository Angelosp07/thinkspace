import assert from 'node:assert/strict';
import vm from 'node:vm';
import worker,{createTranscriptCollector,transcriptionSession} from '../worker/index.js';
const finals=[],previews=[],errors=[];
const c=createTranscriptCollector({onPreview:t=>previews.push(t),onFinal:(text,ctx)=>finals.push({text,ctx}),onError:t=>errors.push(t)});
const receive=(type,item_id,extra={})=>c.receive({type,item_id,...extra});
const prefix='conversation.item.input_audio_transcription.';
const ctx={mode:'create',selected:null,epoch:1};
receive(prefix+'delta','a',{delta:'A market',event_id:'delta-a'});
receive(prefix+'delta','a',{delta:'A market',event_id:'delta-a'});
assert.equal(c.partial,'A market');assert.equal(previews[0],'A market');assert.equal(finals.length,0);
c.commit(ctx);ctx.mode='advice';receive('input_audio_buffer.committed','a');
c.commit({mode:'edit',selected:'restaurant',epoch:1});receive('input_audio_buffer.committed','b');
receive(prefix+'completed','b',{transcript:'Add pickup times.'});assert.equal(finals.length,0,'Later completion must wait for earlier audio');
receive(prefix+'completed','a',{transcript:'A marketplace connects students.'});
assert.deepEqual(finals.map(x=>x.text),['A marketplace connects students.','Add pickup times.']);assert.equal(finals[0].ctx.mode,'create');assert.equal(finals[1].ctx.selected,'restaurant');assert.equal(c.pending,0);assert.equal(c.partial,'');
receive(prefix+'completed','a',{transcript:'duplicate'});assert.equal(finals.length,2);
c.commit({mode:'advice'});receive(prefix+'completed','c',{transcript:'Evaluate the plan.'});assert.equal(finals.length,2);receive('input_audio_buffer.committed','c');assert.equal(finals[2].ctx.mode,'advice');
c.commit({mode:'create'});receive('input_audio_buffer.committed','d');receive(prefix+'failed','d',{error:{message:'Unable to transcribe'}});assert.deepEqual(errors,['Unable to transcribe']);assert.equal(c.pending,0);
const configured=transcriptionSession(['LoopGarden','AC<42>\n','LoopGarden',null]);assert.equal(configured.audio.input.transcription.delay,'medium');assert.deepEqual(configured.audio.input.transcription.keywords,['LoopGarden','AC 42']);
const original=globalThis.fetch,key='test-server-key';let calls=0;
const req=(body='v=0\r\n',origin='http://localhost')=>new Request('http://localhost/api/realtime',{method:'POST',headers:{Origin:origin,'Content-Type':'application/sdp'},body});
try{
 globalThis.fetch=async(url,options)=>{calls++;assert.equal(url,'https://api.openai.com/v1/realtime/calls');assert.equal(options.headers.Authorization,'Bearer '+key);assert.equal(options.body.get('sdp'),'v=0\r\n');assert.deepEqual(JSON.parse(options.body.get('session')),transcriptionSession());return new Response('v=0\r\nanswer')};
 let r=await worker.fetch(req(),{OPENAI_API_KEY:key});assert.equal(r.status,200);assert.equal(r.headers.get('Content-Type'),'application/sdp');assert.equal(r.headers.get('Cache-Control'),'no-store');assert.equal(await r.text(),'v=0\r\nanswer');
 assert.equal((await worker.fetch(req('v=0','https://unrelated.example'),{OPENAI_API_KEY:key})).status,403);
 assert.equal((await worker.fetch(req('invalid'),{OPENAI_API_KEY:key})).status,400);
 assert.equal((await worker.fetch(req('v=0'+'.'.repeat(64000)),{OPENAI_API_KEY:key})).status,400);
 assert.equal((await worker.fetch(req(),{})).status,503);assert.equal(calls,1);
 globalThis.fetch=async(url,options)=>{assert.deepEqual(JSON.parse(options.body.get('session')),transcriptionSession(['LoopGarden']));return new Response('v=0\r\nanswer')};assert.equal((await worker.fetch(new Request('http://localhost/api/realtime',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sdp:'v=0',vocabulary:['LoopGarden']})}),{OPENAI_API_KEY:key})).status,200);
 globalThis.fetch=async()=>new Response(JSON.stringify({error:{message:'Denied '+key}}),{status:401});r=await worker.fetch(req(),{OPENAI_API_KEY:key});assert.equal(r.status,502);assert(!(await r.text()).includes(key));
 globalThis.fetch=async()=>{throw Error('offline')};assert.equal((await worker.fetch(req(),{OPENAI_API_KEY:key})).status,502);
}finally{globalThis.fetch=original}
// Exercise the actual browser Stop logic: hold the connection open until final
// text arrives, and cancel a connection attempt without leaving the mic running.
const html=await(await worker.fetch(new Request('http://localhost/'))).text();const script=html.split('<script>')[1].split('</script>')[0];
const voiceFunctions=script.slice(script.indexOf('function voiceState'),script.indexOf('async function startOpenAISpeech'));
const timers=new Map();let nextTimer=0;
vm.runInNewContext(`
let recording=true,voice,retryThought=null,session=0,liveInterim='',pendingSpeech='',flushed=0,stopped=0,closed=0;const elements={};const $=s=>elements[s]||(elements[s]={dataset:{},setAttribute(){}});function context(){return {mode:'create',epoch:0}}function notice(){}function flushSpeech(){flushed++}
`+voiceFunctions+`
voiceState('Connecting to OpenAI…','connecting');assert.equal($('#talk').textContent,'Cancel connection');voiceState('Listening','listening');assert.equal($('#talk').textContent,'Stop talking');
const sent=[];voice={ready:true,dirty:true,utteranceContext:context(),abort:{abort(){}},stream:{getTracks:()=>[{stop(){stopped++}}]},channel:{readyState:'open',send:v=>sent.push(JSON.parse(v)),close(){closed++}},pc:{close(){}},collector:createTranscriptCollector()};const state=voice;
stopListening();assert.equal(recording,false);assert.equal($('#talk').textContent,'Finishing…');assert.equal(stopped,1);assert.equal(closed,0);runDelay(200);assert.equal(sent[0].type,'input_audio_buffer.commit');assert.equal(state.collector.pending,1);assert.equal(voice,state);
state.collector.receive({type:'input_audio_buffer.committed',item_id:'final'});state.collector.receive({type:'conversation.item.input_audio_transcription.completed',item_id:'final',transcript:'last words'});maybeFinishVoice(state);runDelay(250);assert.equal(voice,null);assert.equal(closed,1);assert.equal($('#talk').textContent,'Start talking');assert.equal(flushed,1);
recording=true;voice={ready:false,abort:{abort(){}},stream:{getTracks:()=>[{stop(){stopped++}}]}};stopListening();assert.equal(voice,null);assert.equal(recording,false);
`,{createTranscriptCollector,assert,setTimeout:(fn,ms)=>{timers.set(++nextTimer,{fn,ms});return nextTimer},clearTimeout:id=>timers.delete(id),clearInterval:()=>{},runDelay:ms=>{for(const [id,t]of [...timers])if(t.ms===ms){timers.delete(id);t.fn()}}});
console.log('Passed: live transcript deltas, correction, ordered completions, duplicate events, captured mode, speech errors, secure SDP relay and final-word drain.');
