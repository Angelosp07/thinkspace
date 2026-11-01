import http from 'node:http';
import {readFileSync,existsSync} from 'node:fs';
import worker from '../worker/index.js';
const env={...process.env};if(existsSync('.env.local'))for(const line of readFileSync('.env.local','utf8').split('\n')){const m=line.match(/^([A-Z_]+)=(.*)$/);if(m)env[m[1]]=m[2].replace(/^['"]|['"]$/g,'')}
const port=Number(process.env.PORT||3000);
http.createServer(async(req,res)=>{try{let chunks=[];for await(const c of req)chunks.push(c);const body=Buffer.concat(chunks);const r=await worker.fetch(new Request('http://'+(req.headers.host||'localhost:'+port)+req.url,{method:req.method,headers:req.headers,...(body.length?{body}:{} )}),env);res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()))}catch{res.writeHead(500);res.end('Request failed')}}).listen(port,'127.0.0.1',()=>console.log('Thinkspace: http://localhost:'+port));
