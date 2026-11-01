// Live contract check using synthetic speech only; no saved user project is sent.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import worker,{applyEdits,sampleProject} from '../worker/index.js';
const env={...process.env};for(const line of readFileSync(new URL('../.env.local',import.meta.url),'utf8').split('\n')){const m=line.match(/^([A-Z_]+)=(.*)$/);if(m)env[m[1]]=m[2].replace(/^['"]|['"]$/g,'')}
async function turn(project,utterance,interactionMode='create',selected=''){
 const response=await worker.fetch(new Request('http://localhost/api/turn',{method:'POST',body:JSON.stringify({project,utterance,interactionMode,selected})}),env),data=await response.json();if(!response.ok)throw Error(data.error);return data.result;
}
if(process.argv.includes('--edit-only')){
 const project=sampleProject(),r=await turn(project,'Rename this concept to Campus food network. Preserve its other details.','edit','core');assert.equal(r.intent,'edit');assert.equal(r.nodes.length,1);assert.equal(r.nodes[0].id,'core');assert.equal(r.nodes[0].title,'Campus food network');assert.equal(r.edges.length,0);console.log('Live focused Edit passed.');process.exit(0);
}
const empty={version:1,title:'Synthetic marketplace',revision:0,nodes:[],edges:[]};
const build=await turn(empty,'I’m building a marketplace connecting students with restaurants that have surplus food. Students get cheaper meals, and restaurants recover money from food they would otherwise waste. We’re considering delivery and campus collection.');
assert.equal(build.intent,'build');let project=applyEdits(empty,build);assert(project.nodes.length>=4);assert(project.edges.length>=3);assert(!project.nodes.some(n=>n.type==='concern'||/affordability|profitability|food waste/i.test(n.title)));
console.log('Create:',project.nodes.map(n=>n.title).join(', '));const baseline=JSON.stringify(project),selected=project.nodes.find(n=>/marketplace/i.test(n.title))||project.nodes[0];
const [advice,edit]=await Promise.all([
 turn(project,'Evaluate this plan. Identify possible concerns, evidence, unknowns and a small test for each.','advice'),
 turn(project,'Rename this concept to Campus food network. Preserve its other details.','edit',selected.id)
]);
assert.equal(advice.intent,'evaluate');assert(advice.nodes.length>=1&&advice.nodes.length<=4);assert(advice.nodes.every(n=>n.type==='concern'&&n.markdown.length>120));assert(advice.edges.every(e=>advice.nodes.some(n=>n.id===e.source||n.id===e.target)));assert.equal(JSON.stringify(project),baseline);
const overlay=applyEdits(project,advice);assert(project.nodes.every(n=>JSON.stringify(overlay.nodes.find(x=>x.id===n.id))===JSON.stringify(n)));
assert.equal(edit.intent,'edit');assert.equal(edit.nodes.length,1);assert.equal(edit.nodes[0].id,selected.id);assert.equal(edit.nodes[0].title,'Campus food network');assert.equal(edit.edges.length,0);
console.log('Advice:',advice.nodes.map(n=>n.title).join(', '));console.log('Edit: selected concept renamed; other concepts unchanged.');console.log('Live voice-mode contract passed.');
