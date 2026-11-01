import assert from 'node:assert/strict';
import vm from 'node:vm';
import worker,{validateProject,mergeConcepts,mergeDuplicateConcepts,editConceptDocument,applyEdits,canonicalConceptId,constrainTurn} from '../worker/index.js';
const base=validateProject({version:1,title:'Subscription identity',revision:1,nodes:[
{id:'harvest',title:'Harvest subscription',kind:'entity',markdown:'# Harvest subscription\nWeekly produce boxes.',responsibilities:['Provide weekly boxes'],properties:{frequency:'weekly'}},
{id:'holiday',title:'Holiday subscription',kind:'entity',markdown:'# Holiday subscription\nAllows gifting to neighbours.',responsibilities:['Enable gifting'],properties:{giftable:'yes'}},
{id:'resident',title:'Resident',kind:'actor'}, {id:'gift',title:'Gift delivery',kind:'service'},
{id:'plan',title:'Pilot plan',type:'artifact',kind:'artifact',dependsOn:['holiday']}],edges:[
{source:'resident',target:'harvest',label:'subscribes to',basis:'stated',reason:'Original subscription'},
{source:'resident',target:'holiday',label:'subscribes to',basis:'inferred',reason:'Second mention'},
{source:'gift',target:'holiday',label:'depends on',kind:'dependency',dependency:true},
{source:'holiday',target:'gift',label:'permits'},
{source:'holiday',target:'harvest',label:'same as'}]});
const before=JSON.stringify(base),edited=editConceptDocument(base,'holiday','Harvest subscription','Corrected wording. Allows gifting to neighbours.');
assert.equal(edited.nodes.length,4);const survivor=edited.nodes.find(n=>n.id==='harvest');assert(survivor);assert.deepEqual(survivor.properties,{frequency:'weekly',giftable:'yes'});assert(survivor.aliases.includes('Holiday subscription'));assert(survivor.markdown.includes('Weekly produce boxes'));assert(survivor.markdown.includes('Allows gifting'));assert.deepEqual(survivor.responsibilities,['Provide weekly boxes','Enable gifting']);assert.equal(canonicalConceptId(edited,'holiday'),'harvest');
assert.equal(edited.edges.length,3);assert(edited.edges.every(e=>e.source!==e.target&&e.source!=='holiday'&&e.target!=='holiday'));assert(edited.edges.some(e=>e.source==='gift'&&e.target==='harvest'));assert(edited.edges.some(e=>e.source==='harvest'&&e.target==='gift'));assert.equal(edited.edges.find(e=>e.source==='resident').basis,'stated');assert.deepEqual(edited.nodes.find(n=>n.id==='plan').dependsOn,['harvest']);assert(edited.nodes.find(n=>n.id==='plan').stale);assert.equal(JSON.stringify(base),before);
const duplicate=structuredClone(base);duplicate.nodes[1].title='Harvest subscription';assert.equal(mergeDuplicateConcepts(duplicate).nodes.length,4);assert.deepEqual(mergeDuplicateConcepts(edited),edited);
const request={source:'holiday',target:'harvest',reason:'User corrected the meaning'},delta={intent:'edit',nodes:[],edges:[],merges:[request],highlights:[]};assert.equal(applyEdits(base,constrainTurn(base,delta,'edit','holiday')).nodes.length,4);assert.equal(constrainTurn(base,delta,'edit','resident').merges.length,0);
for(const intent of ['ask','clarify','evaluate'])assert.equal(applyEdits(base,{...delta,intent}).nodes.length,5);assert.equal(constrainTurn(base,{...delta,intent:'scenario'},'advice').merges.length,0);
assert.equal(applyEdits(base,{...delta,intent:'scenario'}).nodes.length,4);assert.equal(JSON.stringify(base),before);
const rename={...base.nodes[1],title:'Harvest subscription',properties:[]};assert.equal(applyEdits(base,{intent:'edit',nodes:[rename],edges:[]}).nodes.length,4);
const otherRole=structuredClone(base);otherRole.nodes[1].kind='service';assert.equal(editConceptDocument(otherRole,'holiday','Harvest subscription','A distinct service.').nodes.length,5);
assert.throws(()=>mergeConcepts(base,[{source:'holiday',target:'missing'}]),/unknown concept/);assert.throws(()=>mergeConcepts(base,[request,{source:'harvest',target:'holiday'}]),/cycle/);assert.equal(JSON.stringify(base),before);
assert.deepEqual(mergeConcepts(edited,[request]),edited,'Replaying a merge cannot delete the surviving entity');
const conflict=structuredClone(base);conflict.nodes[0].properties.price=20;conflict.nodes[1].properties.price=30;const unresolved=mergeConcepts(conflict,[request]);assert(!('price' in unresolved.nodes[0].properties));assert(unresolved.nodes[0].unresolvedProperties.includes('price'));assert.match(unresolved.nodes[0].markdown,/20/);assert.match(unresolved.nodes[0].markdown,/30/);
const third=validateProject({...unresolved,nodes:[...unresolved.nodes,{id:'third',title:'Meal pass',properties:{price:20}}]});assert(!('price' in mergeConcepts(third,[{source:'third',target:'harvest'}]).nodes[0].properties),'A later duplicate cannot silently resolve conflicting values');
const resolved=applyEdits(unresolved,{intent:'edit',nodes:[{id:'harvest',title:'Harvest subscription',properties:[{key:'price',value:25}]}],edges:[]});assert.equal(resolved.nodes[0].properties.price,25);assert(!resolved.nodes[0].unresolvedProperties.includes('price'));
// Exercise the actual document Save and Undo handlers with the shared model code.
const html=await(await worker.fetch(new Request('http://localhost/'))).text(),script=html.split('<script>')[1].split('</script>')[0],shared=script.slice(0,script.indexOf('const $='));
const save=script.slice(script.indexOf("$('#editor').onsubmit="),script.indexOf("\n",script.indexOf("$('#editor').onsubmit="))),undoHandler=script.slice(script.indexOf("$('#undo').onclick="),script.indexOf('\n',script.indexOf("$('#undo').onclick=")));
vm.runInNewContext(shared+`
let p=structuredClone(base),selected='holiday',scenario=null,review=null,editingDocument=true,highlights={},draft={},busy=false;const undo=[],elements={};const $=key=>elements[key]||(elements[key]={});function checkpoint(){undo.push({project:structuredClone(p),review})}function ui(){}function select(id){selected=id}function notice(text){$('#notice').textContent=text}function remapConceptReferences(){selected=canonicalConceptId(p,selected)}
`+save+undoHandler+`
$('#edit-title').value='Harvest subscription';$('#edit-markdown').value='Gifts are included.';$('#editor').onsubmit({preventDefault(){}});assert.equal(p.nodes.length,4);assert.equal(selected,'harvest');assert.match($('#notice').textContent,/merged/);$('#undo').onclick();assert.deepEqual(p,base);
`,{structuredClone,base,assert});
console.log('Passed: manual and semantic merges, all edge directions, duplicate-edge removal, notes/aliases/facts, dependencies, conflicts, mode isolation, legacy references and Undo.');
