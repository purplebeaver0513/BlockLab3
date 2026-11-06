/* Block Lab: project format, block compiler, and isolated execution runtime. */
(function(root){
'use strict';
const uid=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);
const cats=[['motion','Motion','#527ef0'],['looks','Looks','#9460df'],['sound','Sound','#ce57ac'],['events','Events','#dfa836'],['control','Control','#e9913a'],['sensing','Sensing','#42aab7'],['operators','Operators','#65a758'],['variables','Variables','#e8754e'],['pen','Pen','#37a18b']];
const field=(name,value,type='text',options)=>({name,value,type,options});
const defs={};
function d(id,cat,parts,extra={}){defs[id]={id,cat,parts,...extra};}
d('flag','events',['when','⚑','clicked'],{hat:true});
d('keyevent','events',['when',field('key','ArrowRight','select',[['ArrowRight','right arrow'],['ArrowLeft','left arrow'],['ArrowUp','up arrow'],['ArrowDown','down arrow'],[' ','space'],['a','a'],['d','d'],['w','w'],['s','s'],['any','any key']]),'key pressed'],{hat:true});
d('clickevent','events',['when this sprite clicked'],{hat:true});
d('receive','events',['when I receive',field('message','hello')],{hat:true});
d('broadcast','events',['broadcast',field('message','hello')]);
d('move','motion',['move',field('n',10),'steps']);
d('turn','motion',['turn ↻',field('n',15),'degrees']);
d('turnleft','motion',['turn ↺',field('n',15),'degrees']);
d('goto','motion',['go to x:',field('x',0),'y:',field('y',0)]);
d('glide','motion',['glide',field('seconds',1),'secs to x:',field('x',100),'y:',field('y',0)]);
d('point','motion',['point in direction',field('n',90)]);
d('changex','motion',['change x by',field('n',10)]);
d('changey','motion',['change y by',field('n',10)]);
d('setx','motion',['set x to',field('n',0)]);
d('sety','motion',['set y to',field('n',0)]);
d('bounce','motion',['if on edge, bounce']);
d('rotation','motion',['rotation style',field('style','left-right','select',[['left-right','left–right'],['all','all around'],['none','don’t rotate']])]);
d('say','looks',['say',field('text','Hello, world!'),'for',field('seconds',2),'secs']);
d('think','looks',['think',field('text','Hmm…'),'for',field('seconds',2),'secs']);
d('show','looks',['show']);d('hide','looks',['hide']);
d('size','looks',['set size to',field('n',100),'%']);
d('changesize','looks',['change size by',field('n',10)]);
d('nextcostume','looks',['next costume']);
d('costume','looks',['switch costume to',field('name','1','costume')]);
d('backdrop','looks',['switch backdrop to',field('name','Moonlit hills','backdrop')]);
d('opacity','looks',['set opacity to',field('n',100),'%']);
d('front','looks',['go to front']);
d('play','sound',['play sound',field('name','pop','sound')]);
d('note','sound',['play note',field('note',60),'for',field('seconds',.25),'secs']);
d('volume','sound',['set volume to',field('n',70),'%']);
d('wait','control',['wait',field('seconds',1),'seconds']);
d('repeat','control',['repeat',field('times',10)],{container:true});
d('forever','control',['forever'],{container:true});
d('if','control',['if',field('condition','=key(" ")'),'then'],{container:true});
d('ifelse','control',['if',field('condition','=get("score") > 5'),'then'],{container:true,else:true});
d('until','control',['repeat until',field('condition','=touching("edge")')],{container:true});
d('waituntil','control',['wait until',field('condition','=key(" ")')]);
d('stop','control',['stop this script']);
d('key','sensing',['key',field('key','ArrowRight','select',[['ArrowRight','right arrow'],['ArrowLeft','left arrow'],['ArrowUp','up arrow'],['ArrowDown','down arrow'],[' ','space'],['a','a'],['d','d'],['w','w'],['s','s']]),'pressed?'],{reporter:true});
d('touching','sensing',['touching',field('name','edge','sprite'),' ?'],{reporter:true});
d('xpos','sensing',['x position'],{reporter:true});d('ypos','sensing',['y position'],{reporter:true});d('mousex','sensing',['mouse x'],{reporter:true});d('mousey','sensing',['mouse y'],{reporter:true});d('mousedown','sensing',['mouse down?'],{reporter:true});
d('add','operators',[field('a',1),'+',field('b',2)],{reporter:true});
d('subtract','operators',[field('a',10),'−',field('b',1)],{reporter:true});
d('multiply','operators',[field('a',2),'×',field('b',3)],{reporter:true});
d('divide','operators',[field('a',10),'÷',field('b',2)],{reporter:true});
d('random','operators',['pick random',field('a',1),'to',field('b',10)],{reporter:true});
d('compare','operators',[field('a','=get("score")'),field('op','>','select',['>','<','===','>=','<=','!==']),field('b',10)],{reporter:true});
d('and','operators',[field('a','=true'),'and',field('b','=true')],{reporter:true});
d('not','operators',['not',field('a','=false')],{reporter:true});
d('setvar','variables',['set',field('name','score','variable'),'to',field('value',0)]);
d('changevar','variables',['change',field('name','score','variable'),'by',field('value',1)]);
d('getvar','variables',[field('name','score','variable')],{reporter:true});
d('log','variables',['print',field('value','Hello!'),'to console']);
d('pendown','pen',['pen down']);d('penup','pen',['pen up']);d('clearpen','pen',['erase all']);
d('pencolor','pen',['set pen color',field('color','#a58cff','color')]);d('pensize','pen',['set pen size to',field('n',3)]);
function block(type,args={},body=[],otherwise=[]){const def=defs[type];const values={};for(const p of def.parts)if(typeof p==='object')values[p.name]=p.value;return{id:uid(),type,args:{...values,...args},...(def.container?{body}:{}),...(def.else?{otherwise}:{} )};}
function expr(v){const s=String(v??'0').trim();if(s.startsWith('='))return '('+(s.slice(1).trim()||'0')+')';if(s!==''&&Number.isFinite(Number(s)))return String(Number(s));return JSON.stringify(s);}
const quote=v=>JSON.stringify(String(v??''));
function reporter(b){const a=b.args||{};const e=k=>expr(a[k]);switch(b.type){case'key':return 'key('+quote(a.key)+')';case'touching':return 'touching('+quote(a.name)+')';case'xpos':return 'x()';case'ypos':return 'y()';case'mousex':return 'mouseX()';case'mousey':return 'mouseY()';case'mousedown':return 'mouseDown()';case'getvar':return 'get('+quote(a.name)+')';case'random':return'random('+e('a')+', '+e('b')+')';case'add':return e('a')+' + '+e('b');case'subtract':return e('a')+' - '+e('b');case'multiply':return e('a')+' * '+e('b');case'divide':return e('a')+' / '+e('b');case'compare':return e('a')+' '+(['>','<','===','>=','<=','!=='].includes(a.op)?a.op:'>')+' '+e('b');case'and':return e('a')+' && '+e('b');case'not':return '!'+e('a');default:return '0';}}
function compileBody(list,level=1){return list.map(b=>compileBlock(b,level)).join('\n');}
function compileBlock(b,level=1){const a=b.args||{},e=k=>expr(a[k]),q=k=>quote(a[k]),i='  '.repeat(level),body=()=>compileBody(b.body||[],level+1);let s='';
switch(b.type){
case'move':s=`await move(${e('n')});`;break;case'turn':s=`await turn(${e('n')});`;break;case'turnleft':s=`await turn(-${e('n')});`;break;case'goto':s=`await goTo(${e('x')}, ${e('y')});`;break;case'glide':s=`await glide(${e('seconds')}, ${e('x')}, ${e('y')});`;break;case'point':s=`await point(${e('n')});`;break;case'changex':s=`await changeX(${e('n')});`;break;case'changey':s=`await changeY(${e('n')});`;break;case'setx':s=`await setX(${e('n')});`;break;case'sety':s=`await setY(${e('n')});`;break;case'bounce':s='await bounce();';break;case'rotation':s=`await rotation(${q('style')});`;break;
case'say':case'think':s=`await ${b.type}(${String(a.text).startsWith('=')?e('text'):q('text')}, ${e('seconds')});`;break;
case'show':case'hide':case'nextcostume':case'front':s='await '+({nextcostume:'nextCostume',front:'toFront'}[b.type]||b.type)+'();';break;
case'size':s=`await size(${e('n')});`;break;case'changesize':s=`await changeSize(${e('n')});`;break;case'opacity':s=`await opacity(${e('n')});`;break;case'costume':s=`await costume(${q('name')});`;break;case'backdrop':s=`await backdrop(${q('name')});`;break;
case'play':s=`await playSound(${q('name')});`;break;case'note':s=`await note(${e('note')}, ${e('seconds')});`;break;case'volume':s=`await volume(${e('n')});`;break;
case'wait':s=`await wait(${e('seconds')});`;break;
case'repeat':s=`for (let i${level} = 0, count${level} = Math.max(0, Number(${e('times')})); i${level} < count${level}; i${level}++) {\n${body()}\n${i}  await tick();\n${i}}`;break;
case'forever':s=`while (true) {\n${body()}\n${i}  await tick();\n${i}}`;break;
case'if':s=`if (${e('condition')}) {\n${body()}\n${i}}`;break;
case'ifelse':s=`if (${e('condition')}) {\n${body()}\n${i}} else {\n${compileBody(b.otherwise||[],level+1)}\n${i}}`;break;
case'until':s=`while (!${e('condition')}) {\n${body()}\n${i}  await tick();\n${i}}`;break;
case'waituntil':s=`while (!${e('condition')}) await tick();`;break;case'stop':s='return;';break;
case'broadcast':s=`broadcast(${q('message')});`;break;
case'setvar':s=`set(${q('name')}, ${e('value')});`;break;case'changevar':s=`change(${q('name')}, ${e('value')});`;break;case'log':s=`log(${String(a.value).startsWith('=')?e('value'):q('value')});`;break;
case'pendown':s='await penDown();';break;case'penup':s='await penUp();';break;case'clearpen':s='await clearPen();';break;case'pencolor':s=`await penColor(${q('color')});`;break;case'pensize':s=`await penSize(${e('n')});`;break;
default:if(defs[b.type]?.reporter)s=`log(${reporter(b)});`;else s='// Add action blocks below this event.';
}return i+s;}
function compile(scripts){let result='// Block Lab · JavaScript\n// Actions use await. Press Run to try your code.\n\n';for(const script of scripts){if(!script.blocks?.length)continue;const [head,...rest]=script.blocks;const a=head.args||{};let start='onFlag(async () => {';let body=script.blocks;if(defs[head.type]?.hat){body=rest;if(head.type==='keyevent')start=`onKey(${quote(a.key)}, async () => {`;else if(head.type==='clickevent')start='onClick(async () => {';else if(head.type==='receive')start=`onMessage(${quote(a.message)}, async () => {`;}
result+=start+'\n'+compileBody(body)+'\n});\n\n';}return result;}
function svgData(s){return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s);}
const svg=(content,bg='')=>svgData(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">${bg}${content}</svg>`);
const art={
pip:svg('<ellipse cx="60" cy="110" rx="29" ry="5" fill="#100a2a" opacity=".16"/><path d="M44 91v16h-13v-8l7-8m38 0v16h13v-8l-7-8" fill="#78bbae"/><rect x="31" y="60" width="58" height="38" rx="14" fill="#9ad7c2"/><rect x="22" y="67" width="13" height="23" rx="6" fill="#78bbae"/><rect x="85" y="67" width="13" height="23" rx="6" fill="#78bbae"/><path d="M60 26V15" stroke="#b5e9d4" stroke-width="5"/><circle cx="60" cy="12" r="6" fill="#f3acbb"/><rect x="23" y="26" width="74" height="47" rx="18" fill="#b9e9d5"/><rect x="31" y="34" width="58" height="30" rx="12" fill="#294e50"/><circle cx="46" cy="47" r="5" fill="#c3f7db"/><circle cx="74" cy="47" r="5" fill="#c3f7db"/><path d="M53 55q7 6 14 0" fill="none" stroke="#c3f7db" stroke-width="2.5" stroke-linecap="round"/><rect x="48" y="77" width="24" height="10" rx="5" fill="#d9f1d9"/><circle cx="54" cy="82" r="2.5" fill="#e4b960"/><path d="M65 82h3" stroke="#75ae99" stroke-width="3"/>'),
star:svg('<path d="M60 9l15 32 36 5-26 25 6 36-31-17-31 17 6-36L9 46l36-5z" fill="#ffce73" stroke="#edb358" stroke-width="3" stroke-linejoin="round"/><circle cx="47" cy="59" r="4" fill="#6a4f60"/><circle cx="73" cy="59" r="4" fill="#6a4f60"/><path d="M51 73q9 8 18 0" fill="none" stroke="#6a4f60" stroke-width="3" stroke-linecap="round"/>'),
frog:svg('<ellipse cx="60" cy="104" rx="40" ry="7" fill="#173c2b" opacity=".12"/><ellipse cx="60" cy="75" rx="40" ry="29" fill="#93c889"/><circle cx="38" cy="43" r="19" fill="#93c889"/><circle cx="82" cy="43" r="19" fill="#93c889"/><circle cx="38" cy="42" r="12" fill="#e6efd3"/><circle cx="82" cy="42" r="12" fill="#e6efd3"/><circle cx="40" cy="42" r="5" fill="#344f38"/><circle cx="80" cy="42" r="5" fill="#344f38"/><path d="M39 76q21 20 42 0" fill="none" stroke="#3d6546" stroke-width="4" stroke-linecap="round"/><ellipse cx="29" cy="74" rx="6" ry="4" fill="#e5af9c"/><ellipse cx="91" cy="74" rx="6" ry="4" fill="#e5af9c"/><ellipse cx="30" cy="101" rx="19" ry="8" fill="#78aa70"/><ellipse cx="90" cy="101" rx="19" ry="8" fill="#78aa70"/>'),
rocket:svg('<ellipse cx="60" cy="100" rx="12" ry="17" fill="#ffc75d"/><ellipse cx="60" cy="96" rx="6" ry="12" fill="#ffedb1"/><path d="M40 65L24 90l19-5m37-20l16 25-19-5" fill="#ac8de2"/><path d="M60 7Q28 31 40 88h40Q92 31 60 7" fill="#eae2ff"/><path d="M60 7Q44 19 39 40h42Q76 19 60 7" fill="#a58be4"/><circle cx="60" cy="52" r="14" fill="#b9dbed" stroke="#9981cf" stroke-width="5"/><circle cx="57" cy="49" r="5" fill="#e0f3ff"/><path d="M60 68v25" stroke="#a38bd4" stroke-width="8" stroke-linecap="round"/>'),
ball:svg('<circle cx="60" cy="60" r="43" fill="#e99eb7"/><path d="M20 47q40 24 79 0M27 86q33-38 66 0M60 17q-23 43 0 86M60 17q23 43 0 86" fill="none" stroke="#c67495" stroke-width="3"/><ellipse cx="44" cy="32" rx="12" ry="6" fill="#f7cada" transform="rotate(-25 44 32)"/>'),
cat:svg('<path d="M29 53V19l25 17h12l25-17v34" fill="#e9b27e"/><path d="M35 38V29l13 10m37-1v-9L72 39" fill="#d88889"/><ellipse cx="60" cy="65" rx="37" ry="32" fill="#f2c795"/><path d="M42 60h1m34 0h1" stroke="#634d54" stroke-width="7" stroke-linecap="round"/><path d="M55 70h10l-5 5z" fill="#cf8683"/><path d="M60 76q-5 8-11 0m11 0q5 8 11 0" fill="none" stroke="#73535a" stroke-width="2"/><path d="M22 68l-12-3m13 10H8m90-7l12-3m-13 10h15" stroke="#c38e70" stroke-width="2"/><ellipse cx="60" cy="100" rx="25" ry="11" fill="#e9b27e"/>')};
const backdropSvg=(content)=>svgData(`<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360">${content}</svg>`);
const backdrops=[
{name:'Moonlit hills',data:backdropSvg('<defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#292844"/><stop offset="1" stop-color="#565079"/></linearGradient><linearGradient id="h" x2="0" y2="1"><stop stop-color="#72799a"/><stop offset="1" stop-color="#525976"/></linearGradient></defs><path fill="url(#sky)" d="M0 0h480v360H0z"/><g fill="#c9c2e3" opacity=".65"><circle cx="40" cy="55" r="1.4"/><circle cx="105" cy="99" r="1"/><circle cx="156" cy="35" r="1"/><circle cx="254" cy="75" r="1.4"/><circle cx="319" cy="34" r="1.2"/><circle cx="423" cy="116" r="1"/><circle cx="47" cy="170" r="1"/><circle cx="284" cy="142" r="1"/><circle cx="443" cy="50" r="1.4"/><path d="M190 102v8m-4-4h8m-73 45v6m-3-3h6m226 7v6m-3-3h6" stroke="#c9c2e3" stroke-width="1.3"/></g><circle cx="377" cy="76" r="29" fill="#eae4d8"/><circle cx="389" cy="65" r="28" fill="#34314e"/><path d="M0 234Q65 164 150 228T318 213T480 210v150H0z" fill="#5b567e"/><path d="M0 277Q84 211 184 270T358 252T480 265v95H0z" fill="#676a8d"/><path d="M0 311Q74 269 176 313T333 306T480 300v60H0z" fill="url(#h)"/><path d="M0 349Q145 320 260 347T480 335v25H0z" fill="#8187a0"/><g fill="#a8a8ba" opacity=".5"><ellipse cx="73" cy="325" rx="3" ry="1.5"/><ellipse cx="337" cy="330" rx="4" ry="1.8"/><ellipse cx="190" cy="350" rx="3" ry="1.5"/></g>')},
{name:'Sunny meadow',data:backdropSvg('<rect width="480" height="360" fill="#d5edf0"/><circle cx="383" cy="70" r="33" fill="#f8d889"/><g fill="#fff" opacity=".8"><ellipse cx="95" cy="73" rx="47" ry="17"/><ellipse cx="105" cy="61" rx="25" ry="20"/><ellipse cx="277" cy="123" rx="45" ry="13"/></g><path d="M0 245Q100 150 240 236T480 217v143H0z" fill="#b6d4a3"/><path d="M0 283Q128 222 270 277T480 260v100H0z" fill="#8bb992"/><path d="M0 334Q140 274 290 330T480 307v53H0z" fill="#6da082"/><g fill="#f4d993"><circle cx="79" cy="298" r="3"/><circle cx="394" cy="313" r="3"/><circle cx="174" cy="336" r="3"/></g>')},
{name:'Graph paper',data:backdropSvg('<defs><pattern id="g" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0v20" fill="none" stroke="#ded7ed" stroke-width=".7"/></pattern></defs><rect width="480" height="360" fill="#faf7ff"/><rect width="480" height="360" fill="url(#g)"/><path d="M240 0v360M0 180h480" stroke="#b9a9d4" stroke-width="1"/>')},
{name:'Blank canvas',data:backdropSvg('<rect width="480" height="360" fill="#ffffff"/>')}
];
function sprite(name='Pip',key='pip'){return{id:uid(),name,x:0,y:-65,direction:90,size:75,visible:true,opacity:100,rotation:'left-right',costume:0,costumes:[{id:uid(),name:'Costume 1',data:art[key]||art.pip}],scripts:[],code:'',useText:false};}
function project(kind='moon'){let s=sprite(),sprites=[s];const vars={score:0};let title='Moonwalk',background=0;
if(kind==='moon'){s.scripts=[{id:uid(),blocks:[block('flag'),block('goto',{x:-75,y:-55}),block('say',{text:'Hey, coder! Let’s make something.',seconds:2}),block('repeat',{times:24},[block('move',{n:8}),block('turn',{n:15}),block('wait',{seconds:.04})]),block('say',{text:'Your turn. Try the arrow keys!',seconds:2})]},{id:uid(),blocks:[block('keyevent',{key:'ArrowRight'}),block('changex',{n:15})]},{id:uid(),blocks:[block('keyevent',{key:'ArrowLeft'}),block('changex',{n:-15})]}];}
if(kind==='blank'){title='My new project';s.x=0;s.y=0;s.scripts=[{id:uid(),blocks:[block('flag')]}];background=3;}
if(kind==='chase'){title='Catch the stars';background=1;s.x=0;s.y=-100;s.scripts=[{id:uid(),blocks:[block('flag'),block('setvar',{name:'score',value:0}),block('forever',{},[block('if',{condition:'=key("ArrowRight")'},[block('changex',{n:5})]),block('if',{condition:'=key("ArrowLeft")'},[block('changex',{n:-5})]),block('if',{condition:'=key("ArrowUp")'},[block('changey',{n:5})]),block('if',{condition:'=key("ArrowDown")'},[block('changey',{n:-5})]),block('bounce')])]}];let star=sprite('Star','star');star.x=120;star.y=50;star.size=40;star.scripts=[{id:uid(),blocks:[block('flag'),block('forever',{},[block('if',{condition:'=touching("Pip")'},[block('changevar',{name:'score',value:1}),block('note',{note:72,seconds:.08}),block('goto',{x:'=random(-190,190)',y:'=random(-125,125)'})])])]}];sprites.push(star);}
if(kind==='art'){title='Spiral studio';background=2;s.x=0;s.y=0;s.size=35;s.rotation='all';s.scripts=[{id:uid(),blocks:[block('flag'),block('clearpen'),block('goto',{x:0,y:0}),block('point',{n:90}),block('setvar',{name:'length',value:2}),block('pencolor',{color:'#8d68d3'}),block('pensize',{n:2}),block('pendown'),block('repeat',{times:100},[block('move',{n:'=get("length")'}),block('turn',{n:89}),block('changevar',{name:'length',value:1.5})]),block('penup')]}];vars.length=2;}
return{format:'blocklab',version:1,title,sprites,backdrops:JSON.parse(JSON.stringify(backdrops)),backdrop:background,sounds:[],variables:vars,selectedSprite:s.id};}
function validateProject(raw){if(!raw||typeof raw!=='object'||raw.format!=='blocklab'||raw.version!==1)throw new Error('Choose a Block Lab .blocklab project (version 1). Scratch .sb3 files are not supported.');
const safe=JSON.parse(JSON.stringify(raw));if(!Array.isArray(safe.sprites)||safe.sprites.length<1||safe.sprites.length>100)throw new Error('A project needs 1–100 sprites.');
const text=(v,max)=>typeof v==='string'&&v.length<=max;
const image=data=>typeof data==='string'&&data.length<15e6&&(/^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64,[A-Za-z0-9+/=]+$/i.test(data)||/^data:image\/svg\+xml;charset=utf-8,(?:%[0-9a-f]{2}|[A-Za-z0-9._~!*()-])+$/i.test(data));
const ids=new Set();let blockTotal=0;function checkBlocks(bs,depth=0){if(!Array.isArray(bs)||depth>25)throw new Error('Invalid or overly nested blocks.');for(const b of bs){if(++blockTotal>10000||!b||!Object.hasOwn(defs,b.type)||typeof b.args!=='object'||!b.args||Array.isArray(b.args))throw new Error('Invalid block in project.');b.id=uid();for(const val of Object.values(b.args))if(!['string','number','boolean'].includes(typeof val)||String(val).length>2000)throw new Error('Invalid block value.');if(b.body)checkBlocks(b.body,depth+1);if(b.otherwise)checkBlocks(b.otherwise,depth+1);}}
for(const s of safe.sprites){if(!text(s.id,100)||ids.has(s.id)||!text(s.name,60)||!Array.isArray(s.costumes)||!s.costumes.length||s.costumes.length>100)throw new Error('Invalid sprite or costume list.');ids.add(s.id);for(const c of s.costumes)if(!text(c.name,100)||!image(c.data))throw new Error('A costume image is missing or invalid.');for(const prop of ['x','y','direction','size'])if(!Number.isFinite(s[prop]))throw new Error('Invalid sprite position or size.');s.size=Math.max(5,Math.min(400,s.size));s.opacity=Number.isFinite(s.opacity)?Math.max(0,Math.min(100,s.opacity)):100;s.costume=Math.max(0,Math.min(s.costumes.length-1,Math.floor(Number(s.costume))||0));s.rotation=['all','left-right','none'].includes(s.rotation)?s.rotation:'left-right';s.visible=s.visible!==false;if(!Array.isArray(s.scripts)||s.scripts.length>500)throw new Error('Invalid scripts.');for(const script of s.scripts){script.id=uid();checkBlocks(script.blocks);}if(s.code!==undefined&&!text(s.code,250000))throw new Error('Code is too large.');s.code=s.code||'';s.useText=!!s.useText;}
if(!Array.isArray(safe.backdrops)||!safe.backdrops.length||safe.backdrops.length>100)throw new Error('No valid backdrop.');for(const b of safe.backdrops)if(!text(b.name,100)||!image(b.data))throw new Error('Invalid backdrop.');safe.backdrop=Math.max(0,Math.min(safe.backdrops.length-1,Math.floor(Number(safe.backdrop))||0));
if(!Array.isArray(safe.sounds)||safe.sounds.length>100)throw new Error('Invalid sound list.');for(const sound of safe.sounds)if(!text(sound.name,100)||typeof sound.data!=='string'||sound.data.length>8e6||!/^data:audio\/[\w.+-]+;base64,/.test(sound.data))throw new Error('Invalid audio asset.');
if(!safe.variables||typeof safe.variables!=='object'||Array.isArray(safe.variables)||Object.keys(safe.variables).length>100)throw new Error('Invalid variables.');for(const [key,val]of Object.entries(safe.variables))if(!text(key,40)||['__proto__','constructor','prototype'].includes(key)||!['string','number','boolean'].includes(typeof val)||String(val).length>2000)throw new Error('Invalid variable.');safe.title=String(safe.title||'Untitled project').slice(0,60);safe.selectedSprite=ids.has(safe.selectedSprite)?safe.selectedSprite:safe.sprites[0].id;return safe;}
function workerMain(){
'use strict';
let state={sprites:[],keys:{},mouse:{x:0,y:0,down:false}},variables=Object.create(null),handlers=[],ready=false;const busy=new Set(),pending=new Map();let seq=0;
const sleep=ms=>new Promise(r=>setTimeout(r,Math.max(0,Math.min(3600000,Number(ms)||0))));
const emit=(type,payload={})=>postMessage({type,...payload});
const safeText=v=>{try{return typeof v==='string'?v:JSON.stringify(v);}catch{return String(v);}};
function dispatch(type,key,spriteId){for(const h of handlers)if(h.type===type&&(!spriteId||h.id===spriteId)&&(h.key===undefined||h.key===key||(type==='key'&&h.key==='any'))&&!busy.has(h)){busy.add(h);Promise.resolve().then(h.fn).catch(e=>emit('error',{spriteId:h.id,text:e.message||String(e)})).finally(()=>busy.delete(h));}}
function makeAPI(id){const self=()=>state.sprites.find(s=>s.id===id)||{};const act=(action,...args)=>new Promise((resolve,reject)=>{const requestId=++seq;pending.set(requestId,{resolve,reject});emit('action',{spriteId:id,action,args,requestId});});const register=(type,key,fn)=>{if(typeof fn!=='function')throw new Error('Event handlers need a function.');handlers.push({type,key,fn,id});};
const api={onFlag:fn=>register('flag',undefined,fn),onKey:(key,fn)=>register('key',key,fn),onClick:fn=>register('click',undefined,fn),onMessage:(key,fn)=>register('message',key,fn),broadcast:key=>dispatch('message',String(key)),wait:s=>sleep(Number(s)*1000),tick:()=>sleep(16),random:(a,b)=>Math.floor(Math.random()*(Math.floor(Number(b))-Math.ceil(Number(a))+1))+Math.ceil(Number(a)),key:k=>!!state.keys[k],x:()=>self().x||0,y:()=>self().y||0,mouseX:()=>state.mouse.x||0,mouseY:()=>state.mouse.y||0,mouseDown:()=>!!state.mouse.down,get:name=>Object.hasOwn(variables,name)?variables[name]:0,set:(name,v)=>{if(String(name).length>40)throw new Error('Variable names must be under 40 characters.');if(!['string','number','boolean'].includes(typeof v))throw new Error('Variables hold a number, text, or true/false.');variables[name]=v;emit('variable',{name,value:v});return v;},change:(name,n)=>api.set(name,Number(api.get(name))+Number(n)),log:(...args)=>emit('log',{text:args.map(safeText).join(' ').slice(0,2000),spriteId:id}),touching:name=>{const a=self(),w=(a.width||60)/2,h=(a.height||60)/2;if(name==='edge')return a.x-w<=-240||a.x+w>=240||a.y-h<=-180||a.y+h>=180;if(name==='mouse')return Math.abs(a.x-state.mouse.x)<w&&Math.abs(a.y-state.mouse.y)<h;return state.sprites.some(b=>b.id!==id&&b.name===name&&b.visible&&a.visible&&Math.abs(a.x-b.x)<w+(b.width||60)/2&&Math.abs(a.y-b.y)<h+(b.height||60)/2);}};
for(const name of ['move','turn','goTo','glide','point','changeX','changeY','setX','setY','bounce','rotation','say','think','show','hide','size','changeSize','opacity','nextCostume','costume','backdrop','toFront','playSound','note','volume','penDown','penUp','clearPen','penColor','penSize'])api[name]=(...args)=>act(name,...args);return api;}
onmessage=async e=>{const m=e.data;if(m.type==='state'){state=m.state;return;}if(m.type==='reply'){const p=pending.get(m.requestId);if(p){pending.delete(m.requestId);m.error?p.reject(new Error(m.error)):p.resolve();}if(m.state)state=m.state;return;}if(m.type==='event'){if(ready)dispatch(m.event,m.key,m.spriteId);return;}if(m.type==='start'){state=m.state;variables=Object.assign(Object.create(null),m.variables);const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;const startup=[];for(const s of m.sprites){try{const api=makeAPI(s.id);const fn=new AsyncFunction(...Object.keys(api),'"use strict";\n'+s.code);startup.push(Promise.resolve(fn(...Object.values(api))).catch(e=>emit('error',{spriteId:s.id,text:e.message||String(e)})));}catch(e){emit('error',{spriteId:s.id,text:e.message||String(e)});}}ready=true;dispatch('flag');emit('ready');}};
}
const api={uid,cats,defs,block,expr,reporter,compile,art,backdrops,sprite,project,validateProject,workerMain,svgData};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.LabEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
