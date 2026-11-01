import assert from 'node:assert/strict';
import {layoutConceptGraph,spreadGraphPoints,projectGraphPoint,zoomGraphCamera,fitGraphCamera} from '../worker/index.js';
const view={width:1000,top:140,bottom:650,distance:2000},camera={yaw:0,pitch:0,zoom:1,panX:0,panY:0,center:[0,0,0]};
const point=[140,50,80],start=projectGraphPoint(point,camera,view);
for(const axis of ['yaw','pitch']){const end=projectGraphPoint(point,{...camera,[axis]:Math.PI*2},view);assert(Math.abs(start.x-end.x)<1e-8);assert(Math.abs(start.y-end.y)<1e-8);const half=projectGraphPoint(point,{...camera,[axis]:Math.PI},view);assert(Math.hypot(start.x-half.x,start.y-half.y)>10)}
const moved=projectGraphPoint(point,{...camera,panX:200,panY:-100},view);assert(Math.abs(moved.x-start.x-200)<1e-8);assert(Math.abs(moved.y-start.y+100)<1e-8);
const anchored=zoomGraphCamera(camera,2,start,view),after=projectGraphPoint(point,anchored,view);assert(Math.abs(after.x-start.x)<1e-8);assert(Math.abs(after.y-start.y)<1e-8);assert.equal(anchored.zoom,2);
assert.equal(zoomGraphCamera(camera,100,start,view).zoom,5);assert.equal(zoomGraphCamera(camera,.001,start,view).zoom,.08);
const points=[[-400,-200,100],[800,300,-200],[1200,100,300],[-100,-700,100]];
for(const pitch of [0,1,Math.PI,5]){const c=fitGraphCamera(points,{...camera,pitch},view);for(const p of points){const q=projectGraphPoint(p,c,view);assert(q.x-90*q.s>=0);assert(q.x+90*q.s<=view.width);assert(q.y-48*q.s>=view.top);assert(q.y+105*q.s<=view.bottom)}}
const expanded=fitGraphCamera(points,camera,{...view,bottom:400}),collapsed=fitGraphCamera(points,camera,view);assert(collapsed.zoom>expanded.zoom,'Collapsing the card must allow a larger fitted graph');
const offscreen=projectGraphPoint(point,{...camera,panX:3000},view);assert(offscreen.x>view.width,'Panning must not clamp nodes to screen edges');
assert(points.every(p=>p.every(Number.isFinite)));
console.log('Passed: full horizontal/vertical rotation, free panning, cursor-anchored zoom, fit bounds and extra space after collapsing.');

const duplicates=[[0,0,0],[0,0,0],[0,0,0]],layout=spreadGraphPoints(duplicates);assert.deepEqual(duplicates,[[0,0,0],[0,0,0],[0,0,0]]);for(let i=0;i<layout.length;i++)for(let j=i+1;j<layout.length;j++)assert(Math.hypot(...layout[i].map((v,k)=>v-layout[j][k]))>319);

const crowded=Array.from({length:35},(_,i)=>[Math.sin(i)*20,Math.cos(i)*20,i*30]),spread=spreadGraphPoints(crowded);for(let i=0;i<spread.length;i++)for(let j=i+1;j<spread.length;j++)assert(Math.hypot(spread[i][0]-spread[j][0],spread[i][1]-spread[j][1])>319,'Depth must not hide an overlapping label');assert.deepEqual(spreadGraphPoints(crowded),spread,'Stable inputs give a stable layout');assert(spread.every((p,i)=>p[2]===crowded[i][2]));

// Topology drives placement. Leaves sit beside their own parent on the outer
// side of the connected core, and disconnected ideas have their own space.
const ids=['a','b','c','a-leaf','b-leaf','c-leaf'],nodes=ids.map(id=>({id})),edges=[['a','b'],['b','c'],['c','a'],['a','a-leaf'],['b','b-leaf'],['c','c-leaf']].map(([source,target])=>({source,target}));
const graphBefore=JSON.stringify({nodes,edges}),topology=layoutConceptGraph(nodes,edges),byId=new Map(ids.map((id,i)=>[id,topology[i]]));
const centre=[0,1,2].map(axis=>['a','b','c'].reduce((sum,id)=>sum+byId.get(id)[axis],0)/3),distance=(a,b)=>Math.hypot(...a.map((v,k)=>v-b[k]));
for(const id of ['a','b','c']){const parent=byId.get(id),leaf=byId.get(id+'-leaf');assert(distance(parent,leaf)<550,'One-connection nodes stay near their neighbour');assert(distance(leaf,centre)>distance(parent,centre)+100,'Leaves sit outside the core');for(const other of ['a','b','c'].filter(x=>x!==id))assert(distance(parent,leaf)<distance(byId.get(other),leaf),'Leaf stays beside its own parent');}
assert.equal(JSON.stringify({nodes,edges}),graphBefore);const reordered=layoutConceptGraph([...nodes].reverse(),[...edges].reverse());for(let i=0;i<ids.length;i++)assert.deepEqual(reordered[ids.length-i-1],topology[i],'Input order cannot shuffle the graph');
assert.notDeepEqual(layoutConceptGraph(nodes,edges.slice(0,3)),topology,'Changing relationships updates the layout with the same nodes');
const starNodes=Array.from({length:11},(_,i)=>({id:'star-'+i})),starEdges=starNodes.slice(1).map(n=>({source:'star-0',target:n.id})),star=layoutConceptGraph(starNodes,starEdges);for(let i=1;i<star.length;i++)assert(distance(star[i],star[0])>350);for(let i=0;i<star.length;i++)for(let j=i+1;j<star.length;j++)assert(distance(star[i],star[j])>=319,'Sibling labels must have room');
const separate=layoutConceptGraph([{id:'solo'},...nodes],[...edges]);for(const point of separate.slice(1))assert(distance(point,separate[0])>400);assert.deepEqual(layoutConceptGraph([],[]),[]);assert.deepEqual(layoutConceptGraph([{id:'alone'}],[]),[[0,0,0]]);
console.log('Passed: connected cores, peripheral one-connection nodes, adjacent parents, separated components, stable ordering and relationship-only layout updates.');

// A rotated graph must have genuine depth, not just a tilted plane.
for(const type of ['ring','star','dense']){
 const nodes=Array.from({length:12},(_,i)=>({id:'n'+i})),edges=type==='star'?nodes.slice(1).map(n=>({source:'n0',target:n.id})):nodes.flatMap((n,i)=>nodes.filter((_,j)=>type==='dense'?j>i:j===(i+1)%12).map(m=>({source:n.id,target:m.id})));
 const points=layoutConceptGraph(nodes,edges),range=[0,1,2].map(k=>Math.max(...points.map(p=>p[k]))-Math.min(...points.map(p=>p[k])));assert(Math.min(...range)/Math.max(...range)>.4,'All three dimensions carry substantial depth');
 const origin=points[0],vectors=points.slice(1).map(p=>p.map((v,k)=>v-origin[k]));let volume=0;for(let i=0;i<vectors.length;i++)for(let j=i+1;j<vectors.length;j++)for(let k=j+1;k<vectors.length;k++){const [a,b,c]=[vectors[i],vectors[j],vectors[k]];volume=Math.max(volume,Math.abs(a[0]*(b[1]*c[2]-b[2]*c[1])-a[1]*(b[0]*c[2]-b[2]*c[0])+a[2]*(b[0]*c[1]-b[1]*c[0])))}assert(volume>1e6,'Concepts cannot all lie in one plane');
}
console.log('Passed: spherical volume and real depth for loops, hubs and dense graphs.');
