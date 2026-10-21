// Ludo Arena server: no dependencies, Node 16+. Run: node server.js
const http=require('http'),fs=require('fs'),path=require('path');
const PORT=process.env.PORT||3000,AP=process.env.ADMIN_PASS||'admin123';
const F=path.join(process.env.DATA_DIR||__dirname,'data.json');
let D={users:{},settings:{fee:50,bonus:500},games:0};
try{D=Object.assign(D,JSON.parse(fs.readFileSync(F,'utf8')))}catch(e){}
const save=()=>{try{fs.writeFileSync(F,JSON.stringify(D))}catch(e){}};
const pending={},rooms={};
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'};
const clean=s=>String(s||'').replace(/[<>"'&\\]/g,'').trim().slice(0,16);
const J=(res,o,c=200)=>{res.writeHead(c,{'Content-Type':'application/json'});res.end(JSON.stringify(o))};
const body=req=>new Promise(r=>{let b='';req.on('data',c=>{b+=c;if(b.length>20000)req.destroy()});req.on('end',()=>{try{r(JSON.parse(b||'{}'))}catch(e){r({})}})});
const uo=n=>({name:n,...D.users[n]});
function bcast(code,o){const R=rooms[code];if(!R)return;const s='data: '+JSON.stringify(o)+'\n\n';Object.values(R.c).forEach(r=>r.write(s))}
const plist=code=>{const R=rooms[code],o={};Object.keys(R.c).forEach(p=>o[p]=R.p[p]||{});return o};
http.createServer(async(req,res)=>{
 const u=new URL(req.url,'http://x'),p=u.pathname;
 let m;
 if((m=p.match(/^\/api\/room\/([a-z0-9]{1,48})\/events$/))&&req.method=='GET'){
  const code=m[1],peer=u.searchParams.get('peer')||'';if(!/^[a-z0-9]{4,16}$/.test(peer))return J(res,{error:'peer'},400);
  const R=rooms[code]=rooms[code]||{c:{},p:{}};if(Object.keys(R.c).length>=8)return J(res,{error:'room full'},403);
  res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive','X-Accel-Buffering':'no'});
  R.c[peer]=res;R.p[peer]=R.p[peer]||{};res.write(': ok\n\n');bcast(code,{t:'peers',peers:plist(code)});
  const hb=setInterval(()=>res.write(': hb\n\n'),20000);
  req.on('close',()=>{clearInterval(hb);const R2=rooms[code];if(!R2)return;delete R2.c[peer];delete R2.p[peer];if(!Object.keys(R2.c).length)delete rooms[code];else bcast(code,{t:'peers',peers:plist(code)})});
  return}
 if(req.method=='POST'){
  const b=await body(req);
  if((m=p.match(/^\/api\/room\/([a-z0-9]{1,48})\/(emit|presence|leave)$/))){
   const R=rooms[m[1]];if(!R||!R.c[b.peer])return J(res,{error:'not in room'},403);
   if(m[2]=='emit'&&/^[a-z][a-z0-9_.-]{0,47}$/.test(b.topic))bcast(m[1],{t:'msg',topic:b.topic,data:b.data,peer:b.peer});
   if(m[2]=='presence'&&b.patch&&typeof b.patch=='object'){const q=R.p[b.peer]=R.p[b.peer]||{};for(const k in b.patch){if(b.patch[k]===null)delete q[k];else q[k]=b.patch[k]}bcast(m[1],{t:'peers',peers:plist(m[1])})}
   if(m[2]=='leave'){try{R.c[b.peer].end()}catch(e){}}
   return J(res,{ok:1})}
  if(p=='/api/login'){const n=clean(b.name);if(!n)return J(res,{error:'Naam likho'});
   let x=D.users[n];if(x&&x.banned)return J(res,{error:'Ye account ban hai.'});
   if(!x){x=D.users[n]={coins:D.settings.bonus,banned:false,games:0,wins:0,at:Date.now()};save()}
   return J(res,{user:uo(n),settings:D.settings})}
  if(p=='/api/start'){const n=clean(b.name),x=D.users[n];if(!x)return J(res,{error:'Login karo'});if(x.banned)return J(res,{error:'Ban hai'});
   const f=D.settings.fee,k=Math.min(4,Math.max(2,b.n|0));if(x.coins<f)return J(res,{error:'Coins kam hain. Admin se coins mangao.'});
   x.coins-=f;pending[n]=f*k;save();return J(res,{user:uo(n)})}
  if(p=='/api/finish'){const n=clean(b.name),x=D.users[n];if(!x)return J(res,{error:'x'});
   if(pending[n]!=null){x.games++;D.games++;if(b.won){x.coins+=pending[n];x.wins++}delete pending[n];save()}
   return J(res,{user:uo(n)})}
  if(p.startsWith('/api/admin/')){
   if(req.headers['x-admin']!==AP)return J(res,{error:'Galat password'},401);
   const a=p.slice(11),n=clean(b.name);
   if(a=='coins'&&D.users[n]){D.users[n].coins=Math.max(0,D.users[n].coins+(+b.delta||0));save()}
   if(a=='ban'&&D.users[n]){D.users[n].banned=!D.users[n].banned;save()}
   if(a=='settings'){D.settings.fee=Math.max(0,+b.fee||0);D.settings.bonus=Math.max(0,+b.bonus||0);save()}
   return J(res,{users:Object.entries(D.users).map(([k,v])=>({name:k,...v})),settings:D.settings,games:D.games,rooms:Object.keys(rooms).length,online:Object.values(rooms).reduce((s,r)=>s+Object.keys(r.c).length,0)})}
  return J(res,{error:'not found'},404)}
 let f=path.join(__dirname,'public',p=='/'?'index.html':p);
 if(!f.startsWith(path.join(__dirname,'public')))return J(res,{error:'x'},403);
 fs.readFile(f,(e,d)=>{if(e)return J(res,{error:'not found'},404);res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});res.end(d)})
}).listen(PORT,()=>console.log('Ludo server on :'+PORT));
