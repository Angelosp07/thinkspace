// Synthetic long dictation regression: no user audio or saved graph is used.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import worker,{applyEdits} from '../worker/index.js';
const env={...process.env};for(const line of readFileSync(new URL('../.env.local',import.meta.url),'utf8').split('\n')){const m=line.match(/^([A-Z_]+)=(.*)$/);if(m)env[m[1]]=m[2].replace(/^['"]|['"]$/g,'')}
const text=`I'm building LoopGarden, a neighbourhood food business. LoopGarden connects rooftop gardens, local cafés, and residents. The gardens grow herbs and vegetables. Cafés buy ingredients from the gardens, and residents subscribe to weekly harvest boxes.
Cafés send suitable food scraps to a compost hub. The compost hub produces compost for the rooftop gardens. The gardens supply produce back to the cafés. A cargo-bike delivery service collects scraps and delivers harvest boxes to residents. Each harvest box contains produce from several gardens.
Building owners provide rooftop space to LoopGarden. Garden stewards maintain the gardens and coordinate harvests. Residents can volunteer alongside the stewards. Volunteers earn credits that reduce the price of their harvest subscriptions. Subscription revenue pays the stewards and funds garden supplies.
A neighbourhood seed library supplies seeds to the gardens. Garden stewards return saved seeds to the library. Local schools book gardening workshops led by the stewards. Workshop income supports a community harvest fund, which buys discounted harvest boxes for participating households.`;
let p={version:1,title:'Synthetic LoopGarden',revision:0,nodes:[],edges:[]};
async function turn(utterance){const response=await worker.fetch(new Request('http://localhost/api/turn',{method:'POST',body:JSON.stringify({project:p,utterance,interactionMode:'create'})}),env);const data=await response.json();assert.equal(response.status,200,data.error);assert.equal(data.result.intent,'build');p=applyEdits(p,data.result)}
await turn(text);
const expected=[/loopgarden/i,/rooftop garden/i,/caf[eé]/i,/resident/i,/harvest box/i,/compost hub/i,/cargo.?bike|delivery service/i,/building owner/i,/garden steward/i,/volunteer/i,/seed library/i,/school/i,/workshop/i,/community harvest fund/i];
const names=p.nodes.map(n=>[n.title,...n.aliases].join(' | '));const missing=expected.filter(pattern=>!names.some(name=>pattern.test(name)));
console.log(JSON.stringify({concepts:p.nodes.map(n=>n.title),edges:p.edges.length,missing:missing.map(String)}));assert.equal(missing.length,0,'Explicit durable concepts were omitted from a long dictation');assert(p.nodes.length>12);assert(p.edges.length>=14);
const ids=p.nodes.map(n=>n.id);await turn('The seed library also supplies seeds directly to the local schools.');assert(ids.every(id=>p.nodes.some(n=>n.id===id)),'Later speech removed an earlier concept');
console.log('Live long dictation coverage and subsequent-node retention passed.');
