import assert from 'node:assert/strict';
import worker,{sampleProject,calculateProfit,applyEdits,validateProject,demoTurn} from '../worker/index.js';
const p=sampleProject(),before=JSON.stringify(p),c=calculateProfit(p);assert.equal(c.revenue,6);assert.equal(c.profit,1.5);assert.equal(c.margin,.25);
const scenario=applyEdits(p,demoTurn('What if delivery costs rise to £6?',p));assert.equal(calculateProfit(scenario).profit,-.5);assert.equal(JSON.stringify(p),before);
assert.throws(()=>validateProject({...p,nodes:[p.nodes[0],p.nodes[0]]}));assert.equal(calculateProfit({...p,nodes:[]}).ready,false);
const a=demoTurn('Why would students use this?',p);assert.equal(a.intent,'ask');assert.equal(a.nodes.length,0);
assert.equal(demoTurn('Create a plan',p).nodes[0].type,'artifact');
for(const path of ['/','/api/status','/api/sample']){const r=await worker.fetch(new Request('http://localhost'+path));assert.equal(r.status,200)}
const r=await worker.fetch(new Request('http://localhost/api/calculate',{method:'POST',body:JSON.stringify({project:p})}));assert.equal((await r.json()).margin,.25);
console.log('Passed: calculation, immutable scenario, duplicate import rejection, missing inputs, ask isolation, plan artifact and HTTP routes.');
