// Optional live semantic smoke test. Uses only this synthetic example, never saved projects.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import worker,{applyEdits} from '../worker/index.js';
const env={...process.env};
for(const line of readFileSync(new URL('../.env.local',import.meta.url),'utf8').split('\n')){const m=line.match(/^([A-Z_]+)=(.*)$/);if(m)env[m[1]]=m[2].replace(/^['"]|['"]$/g,'')}
if(!env.OPENAI_API_KEY)throw Error('A configured server API key is required.');
let project={version:1,title:'Synthetic reservation example',revision:0,nodes:[],edges:[]},history=[];
for(const utterance of [
 'I want restaurants to list leftover meals, and students can reserve them. Each reservation has a pickup time.',
 'Reservations can be cancelled before 6 pm. A reservation also has a confirmation code.'
]){
 const response=await worker.fetch(new Request('http://localhost/api/turn',{method:'POST',body:JSON.stringify({project,utterance,history})}),env);
 const data=await response.json();if(!response.ok)throw Error(data.error);
 assert.equal(data.result.intent,'build');const before=project;project=applyEdits(project,data.result);
 console.log(JSON.stringify({concepts:project.nodes.map(n=>({id:n.id,title:n.title,kind:n.kind,attributes:n.attributes,properties:n.properties,responsibilities:n.responsibilities})),relationships:project.edges.map(e=>({source:e.source,label:e.label,target:e.target,kind:e.kind}))},null,2));
 assert(project.nodes.every(n=>n.title.split(/\s+/).length<=6),'Titles should be short concepts');
 assert(!project.nodes.some(n=>/pickup time|confirmation code|6 pm/i.test(n.title)),'Attributes should not become standalone concepts');
 if(before.nodes.length&&project.nodes.length!==before.nodes.length)console.log('Unexpected new concepts:',project.nodes.filter(n=>!before.nodes.some(old=>old.id===n.id)).map(n=>({title:n.title,kind:n.kind,summary:n.summary})));
 if(before.nodes.length){assert.equal(project.nodes.length,before.nodes.length,'A follow-up should enrich existing concepts');}
 assert(project.nodes.every(n=>!Object.hasOwn(n.properties,'pickupTime')&&!Object.hasOwn(n.properties,'confirmationCode')),'Unspecified attribute values must not be invented');
 assert(project.nodes.some(n=>n.attributes.some(a=>a.name.toLowerCase().includes('pickup'))),'Pickup time should be an attribute definition');
 assert(project.edges.length>=3,'The model should link the concepts directly');
 history.push({utterance,answer:data.result.answer});

}
console.log('Live semantic smoke test passed.');
