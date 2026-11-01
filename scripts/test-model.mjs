import assert from 'node:assert/strict';
import vm from 'node:vm';
import worker,{validateProject,applyEdits,normalizeResult,demoTurn,resultSchema,SYSTEM} from '../worker/index.js';
const empty=()=>({version:1,title:'Test',revision:0,nodes:[],edges:[]});
const node=(id,title,extra={})=>({id,title,type:'concept',kind:'entity',summary:'A domain concept.',aliases:[],attributes:[],responsibilities:[],markdown:'# '+title,properties:[],...extra});
const delta=(nodes=[],edges=[],intent='build')=>({intent,nodes,edges,answer:'',highlights:[],scenarioLabel:''});
const edge=(source,target,extra={})=>({source,target,label:'contains',kind:'composition',basis:'stated',reason:'The user described owned parts.',dependency:false,...extra});
let p=applyEdits(empty(),delta([node('order','Order',{aliases:['Purchase'],attributes:[{name:'createdAt',dataType:'datetime',description:'Creation date'}],properties:[{key:'currency',value:'GBP'}]}),node('item','Line item')],[edge('order','item',{targetMultiplicity:'1..*'})]));
const original=JSON.stringify(p);
const update=normalizeResult(p,delta([node('purchase','Purchase',{properties:[{key:'status',value:'paid'}]})],[edge('purchase','item',{targetMultiplicity:'*'})]));
assert.equal(update.nodes[0].id,'order');assert.equal(update.edges[0].source,'order');
const q=applyEdits(p,update);assert.equal(q.nodes.length,2);assert.equal(q.nodes[0].attributes[0].name,'createdAt');assert.equal(q.nodes[0].properties.currency,'GBP');assert.equal(q.nodes[0].properties.status,'paid');assert.equal(q.edges.length,1);assert.equal(q.edges[0].targetMultiplicity,'*');assert.equal(JSON.stringify(p),original);
assert.deepEqual(validateProject(JSON.parse(JSON.stringify(q))),q,'All model metadata survives export/import');
for(const intent of ['ask','clarify'])assert.deepEqual(applyEdits(p,delta([node('bad','Accidental edit')],[],intent)),p,'Questions must not commit edits');
assert.throws(()=>applyEdits(p,delta([],[edge('order','missing')])) ,/unknown concept/);
// Same name in a different role is not identity; ambiguous aliases must not auto-merge.
assert.equal(applyEdits(p,delta([node('order-service','Order',{kind:'service'})])).nodes.length,3);
const ambiguous=applyEdits(empty(),delta([node('a','Account',{aliases:['Profile']}),node('b','Person')]));ambiguous.nodes[1].aliases=['Profile'];
assert.equal(normalizeResult(ambiguous,delta([node('c','Profile')])).nodes[0].id,'c');
const sameTurn=applyEdits(empty(),delta([node('a','Order'),node('b','Order'),node('c','Item')],[edge('b','c')]));assert.equal(sameTurn.nodes.length,2);assert.equal(sameTurn.edges[0].source,'a');
const old=validateProject({...empty(),nodes:[{id:'legacy',title:'Legacy',type:'customer'}]});assert.equal(old.nodes[0].kind,'actor');assert.deepEqual(old.nodes[0].responsibilities,[]);
const food=applyEdits(empty(),demoTurn('Restaurants list surplus meals and students reserve them.',empty()));assert.equal(food.nodes.length,4);assert.equal(food.edges.length,3);assert(food.edges.some(e=>e.source==='student'&&e.target==='reservation'));assert(!food.nodes.some(n=>/and|them|I want/.test(n.title)));
const follow=applyEdits(food,demoTurn('Reservations have a pickup time',food));assert.equal(follow.nodes.length,4);assert(follow.nodes.find(n=>n.id==='reservation').responsibilities.includes('Record pickup time'));
assert.equal(demoTurn('I want a completely unknown business with fast purple things',empty()).nodes.length,0);
// Execute the actual browser model code, proving it uses the same normalization.
const html=await(await worker.fetch(new Request('http://localhost/'))).text();const script=html.split('<script>')[1].split('</script>')[0];new vm.Script(script);
const shared=script.slice(0,script.indexOf('const $='));const ctx={structuredClone,project:p,result:update};vm.runInNewContext(shared+';output=applyEdits(project,result)',ctx);assert.deepEqual(JSON.parse(JSON.stringify(ctx.output)),q);
// Exercise the HTTP boundary with a mocked provider. No key or network is used.
const fetchBefore=globalThis.fetch;let sent;
try{
 globalThis.fetch=async(url,options)=>{sent=JSON.parse(options.body);return new Response(JSON.stringify({output:[{content:[{type:'output_text',text:JSON.stringify(delta([node('purchase','Purchase')],[edge('purchase','item')]))}]}]}))};
 const response=await worker.fetch(new Request('http://localhost/api/turn',{method:'POST',body:JSON.stringify({project:p,utterance:'The purchase contains items.',selected:'order',history:[{utterance:'An order is a purchase.'}]})}),{OPENAI_API_KEY:'test-only'});
 assert.equal(response.status,200);const data=await response.json();assert.equal(data.result.nodes[0].id,'order');assert.equal(data.result.edges[0].source,'order');assert.equal(sent.instructions,SYSTEM);assert.deepEqual(sent.text.format.schema,resultSchema);assert.equal(JSON.parse(sent.input).selectedNode,'order');
}finally{globalThis.fetch=fetchBefore}
console.log('Passed: concept identity, attributes, typed edges, round trips, intent isolation, bounded demo, browser/server parity and API normalization.');
