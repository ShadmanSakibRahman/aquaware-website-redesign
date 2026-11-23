(function(root,factory){
'use strict';
var api=factory();
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.Bronnenbeeld=Object.assign(root.Bronnenbeeld||{},api);
}(typeof window!=='undefined'?window:null,function(){
'use strict';
function initialState(){
return{tab:'overview',substance:null,category:null,priority:null,selected:null,actionType:null};
}
function hasSubstance(source,substanceId){
return source.substances.some(function(s){return s.id===substanceId;});
}
function filterSources(data,state){
var st=state||{};
return data.sources.filter(function(s){
if(st.substance&&!hasSubstance(s,st.substance))return false;
if(st.category&&s.category!==st.category)return false;
if(st.priority&&s.priority!==st.priority)return false;
return true;
}).map(function(s){return s.id;});
}
function relatedSources(data,substanceId){
return filterSources(data,{substance:substanceId});
}
function summaryCounts(data){
var n={substances:data.substances.length,sources:data.sources.length,high:0,medium:0,low:0};
data.sources.forEach(function(s){
if(s.priority==='high')n.high+=1;
else if(s.priority==='medium')n.medium+=1;
else if(s.priority==='low')n.low+=1;
});
return n;
}
function matrixRows(data){
return data.sources.map(function(s){
var cells={};
data.substances.forEach(function(sub){
var rel=s.substances.filter(function(r){return r.id===sub.id;})[0];
cells[sub.id]=rel?rel.level:null;
});
return{id:s.id,name:s.name,priority:s.priority,cells:cells};
});
}
function actionsFor(data,type){
return data.actions.filter(function(a){return!type||a.type===type;});
}
return{
initialState:initialState,
filterSources:filterSources,
relatedSources:relatedSources,
summaryCounts:summaryCounts,
matrixRows:matrixRows,
actionsFor:actionsFor
};
}));
(function(win){
'use strict';
if(!win||!win.document||!win.Bronnenbeeld)return;
var B=win.Bronnenbeeld,doc=win.document,mounts=0;
var TABS=['overview','sources','substances','actions'];
var PRIORITIES=['high','medium','low'];
var LEVELS=['possible','documented','demonstrated'];
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return'&#'+c.charCodeAt(0)+';';});}
function find(list,id){for(var i=0;i<list.length;i++)if(list[i].id===id)return list[i];return null;}
function colour(c){return/^#[0-9a-f]{3,8}$/i.test(c||'')?c:'#55657A';}
function pct(n){return Math.round(n*1000)/1000+'%';}
function r1(n){return Math.round(n*10)/10;}
function decap(s){s=String(s);return/^[A-ZÀ-Þ][^A-ZÀ-Þ]/.test(s)?s.charAt(0).toLowerCase()+s.slice(1):s;}
function listText(lang,items){
try{return new win.Intl.ListFormat(lang,{style:'long',type:'conjunction'}).format(items);}catch(e){return items.join(', ');}
}
function arrowed(s){
var m=/^([\s\S]*?)\s*([→↓])$/.exec(String(s));
return m?esc(m[1])+'<span aria-hidden="true">\u00a0'+m[2]+'</span>':esc(s);
}
function chipButton(attr,value,label,on){
return'<button type="button" class="bb-chip" '+attr+'="'+esc(value)+'" aria-pressed="'+on+'">'+esc(label)+'</button>';
}
function pathwayOf(d,source){return d.pathways.filter(function(p){return p.from===source.id;})[0]||null;}
function byPriority(d,ids){
return ids.map(function(id){return find(d.sources,id);}).sort(function(a,b){return PRIORITIES.indexOf(a.priority)-PRIORITIES.indexOf(b.priority);});
}
function smooth(p,closed){
var n=p.length,d='M'+p[0][0]+' '+p[0][1],i,a,b,c,e;
for(i=0;i<(closed?n:n-1);i++){
a=p[closed?(i+n-1)%n:Math.max(i-1,0)];b=p[i];c=p[(i+1)%n];e=p[closed?(i+2)%n:Math.min(i+2,n-1)];
d+='C'+r1(b[0]+(c[0]-a[0])/6)+' '+r1(b[1]+(c[1]-a[1])/6)+' '+r1(c[0]-(e[0]-b[0])/6)+' '+r1(c[1]-(e[1]-b[1])/6)+' '+c[0]+' '+c[1];
}
return d+(closed?'Z':'');
}
function points(p){return p.map(function(q){return q[0]+','+q[1];}).join(' ');}
function rects(list){return list.map(function(b){return'M'+b[0]+' '+b[1]+'h'+b[2]+'v'+b[3]+'h-'+b[2]+'z';}).join('');}
function plots(x,y,cols,rows,w,h,dx,dy,skip){
var out=[],r,c;
for(r=0;r<rows;r++)for(c=0;c<cols;c++)if((r*cols+c)%skip!==skip-2)out.push([x+c*dx+(r%2?4:0),y+r*dy,w,h]);
return out;
}
function nearest(line,p){
var best=null,i,a,b,t,q,far;
for(i=0;i<line.length-1;i++){
a=line[i];b=line[i+1];
t=((p[0]-a[0])*(b[0]-a[0])+(p[1]-a[1])*(b[1]-a[1]))/(Math.pow(b[0]-a[0],2)+Math.pow(b[1]-a[1],2));
t=Math.max(0,Math.min(1,t));q=[a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])];
far=Math.hypot(q[0]-p[0],q[1]-p[1]);
if(!best||far<best[2])best=[q[0],q[1],far];
}
return best;
}
function lineY(line,x){
for(var i=0;i<line.length-1;i++)if(x<=line[i+1][0])return line[i][1]+(x-line[i][0])/(line[i+1][0]-line[i][0])*(line[i+1][1]-line[i][1]);
return line[line.length-1][1];
}
function hull(pts){
var p=pts.slice().sort(function(a,b){return a[0]-b[0]||a[1]-b[1];}),lo=[],up=[],i;
var turn=function(o,a,b){return(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);};
for(i=0;i<p.length;i++){while(lo.length>1&&turn(lo[lo.length-2],lo[lo.length-1],p[i])<=0)lo.pop();lo.push(p[i]);}
for(i=p.length-1;i>=0;i--){while(up.length>1&&turn(up[up.length-2],up[up.length-1],p[i])<=0)up.pop();up.push(p[i]);}
return lo.slice(0,-1).concat(up.slice(0,-1));
}
var LAND={
river:[[-560,446],[-300,437],[-60,424],[140,407],[330,398],[500,392],[620,395],[760,391],[900,385],[1040,386],[1150,390],[1260,394],[1480,401],[1760,396]],
name:322,
brooks:[[[744,-420],[748,-160],[752,60],[766,240],[762,391]],[[272,474],[262,434],[258,402]],[[-250,846],[-262,610],[-236,436]]],
catchment:[[70,150],[300,70],[620,58],[900,88],[1108,180],[1124,390],[1088,548],[820,600],[480,606],[180,606],[62,510],[44,330]],
roads:[
[[-560,262],[-300,250],[-60,234],[160,222],[330,236],[520,226],[760,240],[1000,262],[1260,248],[1500,256],[1760,244]],
[[458,-420],[456,-160],[452,120],[440,228],[424,330],[410,400],[400,494],[382,800]],
[[794,-420],[798,-160],[810,242],[822,390],[840,516],[852,800]],
[[-560,468],[-300,484],[-60,476],[90,490],[250,478],[400,494],[560,470],[700,462],[840,516],[1000,540],[1260,522],[1500,534],[1760,516]],
[[-330,-420],[-322,-100],[-306,250],[-300,484],[-312,846]]
],
lanes:[
[[330,236],[338,200],[352,150]],[[620,231],[628,200],[640,120]],[[960,258],[955,236],[948,190]],[[700,462],[702,490],[690,540]],
[[60,228],[66,300],[150,314],[200,300],[196,224]],[[424,330],[470,337],[524,340]],[[-306,250],[-250,262],[-212,300]],[[1420,252],[1428,296],[1418,336]]
],
fields:[
[1,[[64,500],[396,487],[404,800],[40,800]]],[2,[[845,-420],[1760,-420],[1760,184],[872,124]]],[1,[[872,560],[1760,533],[1760,846],[860,846]]],
[1,[[-300,-420],[436,-420],[430,-160],[424,48],[250,96],[-300,185]]],[2,[[448,548],[640,536],[652,800],[436,800]]],[2,[[1016,292],[1760,262],[1760,350],[1022,362]]],
[2,[[466,-420],[724,-420],[720,-160],[716,-22],[474,-12],[470,-160]]],[2,[[-286,455],[40,442],[44,800],[-296,846]]],
[2,[[-560,-420],[-346,-420],[-330,222],[-560,236]]],[1,[[-560,504],[-326,508],[-336,846],[-560,846]]],[2,[[-286,276],[-120,264],[-116,380],[-282,404]]]
],
blocks:[
[296,150,34,22],[292,180,38,20],[300,206,30,16],[358,138,40,24],[352,168,48,26],[362,200,36,20],[404,150,26,30],[408,188,22,24],
[588,134,34,24],[584,164,38,22],[592,192,28,18],[648,128,40,26],[646,160,46,24],[652,190,34,18],[696,140,24,34],[700,182,22,22],
[466,246,30,16],[504,244,22,18],[534,246,34,16],[576,250,22,14],[466,270,20,14],[494,272,28,14],[548,270,26,14],[532,298,14,10],
[660,496,30,22],[712,500,34,24],[664,526,22,18],[708,532,40,18],[756,508,18,16],
[918,192,24,22],[966,186,34,24],[916,222,28,18],[968,218,30,22],[1004,200,18,16],[1004,224,20,14],
[1010,470,22,13],[1038,476,13,11],[896,56,20,13],[86,78,22,13],[556,584,20,13],[1100,116,18,12],[1150,470,16,12],[200,360,14,10],
[-246,306,22,13],[-216,324,13,11],[-476,296,20,13],[-430,640,18,12],[1396,304,22,13],[1424,322,13,11],[1560,452,20,13],[1330,96,20,13],
[150,512,56,14],[150,531,56,14],[150,550,56,14],[150,569,56,14],[216,508,64,13],[216,526,64,13],[216,544,64,13],[216,562,64,13],[290,514,52,14],[290,533,52,14],[290,552,52,14]
].concat(plots(472,104,5,6,16,11,22,18,7),plots(74,238,7,4,13,9,17,16,5)),
tanks:[[486,306,13],[516,314,10]],
dots:[[205,150],[250,340],[560,430],[905,300],[1085,250],[780,566],[980,440],[1120,560],[330,440],[40,360],[690,300],[1060,60],[415,580],[845,170],[600,330],[140,440],[1180,200],
[-180,150],[-420,330],[-140,600],[-460,40],[-200,-80],[1340,420],[1460,150],[1420,620],[1600,330],[1380,-60],[560,-120],[960,-200],[120,-240]]
};
function baseLayer(land,id){
var hatch=function(n,angle){
return'<pattern id="'+id+'-h'+n+'" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate('+angle+')"><path d="M0 3.5h7" stroke="#E0E5ED"/></pattern>';
};
var line=function(w){return function(p){return'<path d="'+smooth(p)+'" stroke-width="'+w+'"/>';};};
return'<defs>'+hatch(1,-9)+hatch(2,76)+'</defs>'+
'<rect x="-600" y="-460" width="2400" height="1340" fill="#F3F5F9"/>'+
land.fields.map(function(f){return'<polygon points="'+points(f[1])+'" fill="url(#'+id+'-h'+f[0]+')"/>';}).join('')+
'<g fill="none" stroke="#D6E0FB" stroke-linecap="round">'+land.brooks.map(line(7)).join('')+line(30)(land.river)+'</g>'+
'<g fill="none" stroke="#FFFFFF" stroke-linecap="round" stroke-linejoin="round">'+land.roads.map(line(9)).join('')+land.lanes.map(line(5)).join('')+'</g>'+
'<g fill="#E2E6EE"><path d="'+rects(land.blocks)+'"/>'+land.tanks.map(function(t){return'<circle cx="'+t[0]+'" cy="'+t[1]+'" r="'+t[2]+'"/>';}).join('')+'</g>'+
'<g fill="#C9CED8">'+land.dots.map(function(p){return'<circle cx="'+p[0]+'" cy="'+p[1]+'" r="2.4"/>';}).join('')+'</g>';
}
function pathwayLines(d,land){
return d.pathways.map(function(p){
var s=find(d.sources,p.from),t=p.to==='water'?null:find(d.sources,p.to),a=[s.x,s.y],b,len,nx,ny,path;
if(!t){
b=nearest(land.river,a);
if(b[2]<30)b=[a[0]-86,lineY(land.river,a[0]-86)];
path='M'+a[0]+' '+a[1]+'L'+r1(b[0])+' '+r1(b[1]);
}else{
b=[t.x,t.y];len=Math.hypot(b[0]-a[0],b[1]-a[1])||1;nx=(b[1]-a[1])/len;ny=(a[0]-b[0])/len;
if(ny<0){nx=-nx;ny=-ny;}
path='M'+a[0]+' '+a[1]+'Q'+r1((a[0]+b[0])/2+nx*len*.1)+' '+r1((a[1]+b[1])/2+ny*len*.1)+' '+b[0]+' '+b[1];
}
return{from:p.from,documented:!!p.documented,d:path,a:a,b:b,end:t?null:b};
});
}
function sewerAreas(d){
var by={};
d.pathways.forEach(function(p){if(p.to!=='water')(by[p.to]=by[p.to]||[]).push(p.from);});
return Object.keys(by).map(function(to){
var plant=find(d.sources,to);
return{colour:colour(find(d.categories,plant.category).colour),outline:hull([plant].concat(by[to].map(function(id){return find(d.sources,id);})).map(function(s){return[s.x,s.y];}))};
});
}
function overlayLayer(d,land){
return sewerAreas(d).map(function(a){
return'<g opacity=".12"><polygon points="'+points(a.outline)+'" fill="'+a.colour+'" stroke="'+a.colour+'" stroke-width="112" stroke-linejoin="round"/></g>';
}).join('')+
'<path class="bb-map__catchment" d="'+smooth(land.catchment,true)+'"/>'+
pathwayLines(d,land).map(function(p){
return'<path class="bb-route'+(p.documented?'':' bb-route--possible')+'" data-bb-from="'+esc(p.from)+'" d="'+p.d+'"/>'+
(p.end?'<circle class="bb-route__end" data-bb-from="'+esc(p.from)+'" cx="'+r1(p.end[0])+'" cy="'+r1(p.end[1])+'" r="4.5"/>':'');
}).join('');
}
function labelSides(d,land){
var taken=d.sources.map(function(s){return[s.x-20,s.y-20,s.x+20,s.y+20];})
.concat(d.monitoring.map(function(m){return[m.x-14,m.y-16,m.x+70,m.y+16];}));
var routes=pathwayLines(d,land);
return d.sources.map(function(s,i){
var w=s.name.length*9.5+22,x=s.x,y=s.y,side='r',k,n;
var own=[];
routes.forEach(function(p){
if(p.from===s.id)for(n=2;n<=10;n++)own.push([p.a[0]+(p.b[0]-p.a[0])*n/10-9,p.a[1]+(p.b[1]-p.a[1])*n/10-9,p.a[0]+(p.b[0]-p.a[0])*n/10+9,p.a[1]+(p.b[1]-p.a[1])*n/10+9]);
});
var places={
r:[x+22,y-15,x+22+w,y+15],l:[x-22-w,y-15,x-22,y+15],t:[x-w/2,y-54,x+w/2,y-24],b:[x-w/2,y+24,x+w/2,y+54],
te:[x+36-w,y-54,x+36,y-24],ts:[x-36,y-54,x-36+w,y-24]
};
var free=function(q){
var hits=function(t){return q[0]<t[2]&&q[2]>t[0]&&q[1]<t[3]&&q[3]>t[1];};
return q[0]>=8&&q[2]<=1192&&q[1]>=8&&q[3]<=632&&!own.some(hits)&&!taken.some(function(t,j){return j!==i&&hits(t);});
};
for(k in places)if(free(places[k])){side=k;break;}
taken.push(places[side]);
return side;
});
}
function legendMarkup(d){
var u=d.ui,sewer=sewerAreas(d)[0];
var svg=function(w,inner){return'<svg width="'+w+'" height="12" viewBox="0 0 '+w+' 12" aria-hidden="true" focusable="false">'+inner+'</svg>';};
var items=[
[svg(12,'<circle cx="6" cy="6" r="4.6" fill="#6B7383" stroke="#fff" stroke-width="1.5"/>'),u.legend_source],
[svg(12,'<circle cx="6" cy="6" r="3.8" fill="#E06666" stroke="#fff" stroke-width="1.2"/>'),u.legend_priority_high],
[svg(22,'<path d="M1 6h20" stroke="#3F4A5F" stroke-width="1.6"/>'),u.legend_pathway_documented],
[svg(22,'<path d="M1 6h20" stroke="#3F4A5F" stroke-width="1.6" stroke-dasharray="4.5 3.4"/>'),u.legend_pathway_possible],
[svg(12,'<path d="M6 1.2 11.3 10.8H.7z" fill="#10141B"/>'),u.legend_monitoring],
[svg(22,'<rect x="1.2" y="1.2" width="19.6" height="9.6" rx="3" fill="none" stroke="#6F8AE0" stroke-width="1.4" stroke-dasharray="3.6 2.6"/>'),u.legend_catchment]
];
if(sewer)items.push([svg(22,'<rect x="1" y="1" width="20" height="10" rx="3" fill="'+sewer.colour+'" fill-opacity=".24"/>'),u.legend_sewer_catchment]);
return'<ul class="bb-legend" data-bb-legend>'+items.map(function(i){return'<li>'+i[0]+'<span>'+esc(i[1])+'</span></li>';}).join('')+'</ul>';
}
function mapMarkup(d,options){
var o=options||{},u=d.ui,land=o.land||LAND,sides=labelSides(d,land),priority=decap(u.filter_priority);
var nameY=lineY(land.river,land.name),tilt=Math.atan2(lineY(land.river,land.name+60)-lineY(land.river,land.name-60),120)*180/Math.PI;
return'<div class="bb-map__view"><div class="bb-map__stage">'+
'<svg class="bb-map__svg" viewBox="0 0 1200 640" aria-hidden="true" focusable="false">'+baseLayer(land,o.id||'bb')+overlayLayer(d,land)+'</svg>'+
'<span class="bb-map__water" aria-hidden="true" style="left:'+pct(land.name/12)+';top:'+pct(nameY/6.4)+';transform:translate(-50%,-50%) rotate('+r1(tilt)+'deg)">'+esc(u.map_label_waterbody)+'</span>'+
d.monitoring.map(function(m){
return'<span class="bb-point" data-bb-monitor="'+esc(m.id)+'" role="img" aria-label="'+esc(m.note)+'" title="'+esc(m.note)+'" style="left:'+pct(m.x/12)+';top:'+pct(m.y/6.4)+'">'+
'<svg viewBox="0 0 14 13" aria-hidden="true" focusable="false"><path d="M7 .8 13.4 12.2H.6z"/></svg><span aria-hidden="true">'+esc(m.id)+'</span></span>';
}).join('')+
d.sources.map(function(s,i){
var cat=find(d.categories,s.category),tag=o.readOnly?'span':'button';
var name=s.name+', '+decap(cat.label)+', '+priority+' '+decap(u['priority_'+s.priority]);
return'<'+tag+(o.readOnly?' aria-hidden="true"':' type="button" aria-pressed="false" aria-label="'+esc(name)+'" data-bb-key="marker-'+esc(s.id)+'"')+
' class="bb-marker bb-marker--'+sides[i]+(s.y>320?' bb-marker--low':'')+'" data-bb-marker="'+esc(s.id)+'" style="left:'+pct(s.x/12)+';top:'+pct(s.y/6.4)+';--bb-c:'+colour(cat.colour)+'">'+
'<span class="bb-marker__ring"></span><span class="bb-marker__dot"></span>'+(s.priority==='high'?'<span class="bb-marker__high"></span>':'')+
'<span class="bb-marker__name" aria-hidden="true">'+esc(s.name)+'</span></'+tag+'>';
}).join('')+
'</div></div>'+(o.legend===false?'':legendMarkup(d));
}
function levelTag(d,level,full){
return'<span class="bb-level bb-level--'+esc(level)+'" data-bb-level="'+esc(level)+'"><span class="bb-level__symbol" data-bb-symbol aria-hidden="true">'+esc(d.ui['level_symbol_'+level])+'</span>'+
'<span class="bb-level__word" data-bb-word>'+esc(d.ui['level_'+level+(full?'':'_short')])+'</span></span>';
}
function priorityBadge(d,priority,spoken){
return'<span class="bb-priority bb-priority--'+esc(priority)+'" data-bb-prio>'+(spoken?'<span class="bb-sr">'+esc(d.ui.filter_priority)+': </span>':'')+esc(d.ui['priority_'+priority])+'</span>';
}
function dot(d,source){return'<span class="bb-dot" style="background:'+colour(find(d.categories,source.category).colour)+'" aria-hidden="true"></span>';}
function categoryTag(d,source){return'<span class="bb-category">'+dot(d,source)+esc(find(d.categories,source.category).label)+'</span>';}
function substanceChips(d,source){
return'<ul class="bb-relations">'+source.substances.map(function(r){
return'<li class="bb-relation"><span class="bb-relation__name">'+esc(find(d.substances,r.id).name)+'</span>'+levelTag(d,r.level)+'</li>';
}).join('')+'</ul>';
}
function relationGroups(d,source){
var levels=[];
source.substances.forEach(function(r){if(levels.indexOf(r.level)<0)levels.push(r.level);});
return levels.map(function(level){
var names=source.substances.filter(function(r){return r.level===level;}).map(function(r){return find(d.substances,r.id).name;});
return'<span class="bb-group"><span class="bb-group__names">'+esc(names.join(', '))+'</span> '+levelTag(d,level)+'</span>';
}).join('');
}
function evidenceList(d,source){
return'<ul class="bb-evidence">'+source.evidence.map(function(e){return'<li>'+levelTag(d,e.level)+'<span class="bb-evidence__text">'+esc(e.text)+'</span></li>';}).join('')+'</ul>';
}
function gapBox(d,source){
return'<p class="bb-gap"><strong>'+esc(d.ui.knowledge_gap)+'</strong> '+source.gaps.map(function(g){return'<span>'+esc(g)+'</span>';}).join(' ')+'</p>';
}
function pathwayText(d,source){
var p=pathwayOf(d,source);
return esc(source.pathway_label||source.connection)+(p?' '+levelTag(d,p.documented?'documented':'possible'):'');
}
function connectionText(d,source){
var p=pathwayOf(d,source);
return esc(source.connection)+(p?' '+levelTag(d,p.documented?'documented':'possible'):'');
}
function nextStepMarkup(d,action,attrs){
return'<div class="bb-next"'+(attrs||'')+'><p class="bb-label">'+esc(d.ui.next_step)+'</p><p class="bb-next__action">'+esc(action.action)+'</p>'+
'<p class="bb-next__reason">'+esc(d.ui.reason)+': '+esc(action.reason)+'</p></div>';
}
function closeButton(d,attrs){
return'<button type="button" class="bb-close"'+attrs+' aria-label="'+esc(d.ui.close)+'"><svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3.5 3.5l9 9m0-9l-9 9"/></svg></button>';
}
function priorityListMarkup(d,ids,options){
var o=options||{};
return byPriority(d,ids).map(function(s){
var on=s.id===o.selected,inner=dot(d,s)+'<span class="bb-row__name">'+esc(s.name)+'</span><span class="bb-row__category">'+esc(find(d.categories,s.category).label)+'</span>'+priorityBadge(d,s.priority,true);
return'<li class="bb-row'+(on?' is-selected':'')+'" data-bb-row="'+esc(s.id)+'"'+(on?' aria-current="true"':'')+'>'+
(o.readOnly?'<div class="bb-row__main">'+inner+'</div>':'<button type="button" class="bb-row__main" data-bb-select="'+esc(s.id)+'" data-bb-key="row-'+esc(s.id)+'">'+inner+'</button>')+'</li>';
}).join('');
}
function sourceListMarkup(d,ids,options){
var o=options||{},u=d.ui;
return ids.map(function(id){
var s=find(d.sources,id),on=id===o.selected,more=(o.id||'bb')+'-more-'+id;
return'<li class="bb-source'+(on?' is-selected':'')+'" data-bb-row="'+esc(id)+'"'+(on?' aria-current="true"':'')+'>'+
'<div class="bb-source__main">'+
'<h4 class="bb-source__name"><button type="button" data-bb-select="'+esc(id)+'" data-bb-key="row-'+esc(id)+'" aria-expanded="'+on+'" aria-controls="'+esc(more)+'">'+dot(d,s)+'<span>'+esc(s.name)+'</span><span class="bb-source__mark" aria-hidden="true"></span></button></h4>'+
priorityBadge(d,s.priority,true)+
'<p class="bb-source__category">'+esc(find(d.categories,s.category).label)+'</p>'+
'<p class="bb-source__activity">'+esc(s.activity)+'</p>'+
'<dl class="bb-source__facts"><div><dt>'+esc(u.col_substances)+'</dt><dd>'+relationGroups(d,s)+'</dd></div>'+
'<div><dt>'+esc(u.col_pathway)+'</dt><dd>'+pathwayText(d,s)+'</dd></div></dl>'+
'</div>'+
'<div class="bb-source__more" data-bb-more id="'+esc(more)+'"'+(on?'':' hidden')+'>'+
'<p class="bb-label">'+esc(u.why_priority)+'</p><p class="bb-why">'+esc(s.priority_reason)+'</p>'+
'<p class="bb-label">'+esc(u.evidence)+'</p>'+evidenceList(d,s)+gapBox(d,s)+
'</div></li>';
}).join('');
}
function detailMarkup(d,s,id){
var u=d.ui,action=s.action_id?find(d.actions,s.action_id):null,about=id+'-about';
return'<div id="'+about+'-a" class="bb-detail__tags"><span data-bb-part="category">'+categoryTag(d,s)+'</span> <span data-bb-part="priority">'+priorityBadge(d,s.priority,true)+'</span></div>'+
'<div class="bb-detail__why" id="'+about+'-b" data-bb-part="why"><p class="bb-label">'+esc(u.why_priority)+'</p><p class="bb-why">'+esc(s.priority_reason)+'</p></div>'+
'<h3 class="bb-detail__name" id="'+id+'-detail" data-bb-part="name" data-bb-detail-title data-bb-key="detail-title" tabindex="-1" aria-describedby="'+about+'-a '+about+'-b">'+esc(s.name)+'</h3>'+
'<dl class="bb-facts"><div><dt class="bb-sr">'+esc(u.activity)+'</dt><dd data-bb-part="activity">'+esc(s.activity)+'</dd></div>'+
'<div><dt class="bb-sr">'+esc(u.connection)+'</dt><dd data-bb-part="connection">'+connectionText(d,s)+'</dd></div></dl>'+
'<div class="bb-detail__block" data-bb-part="substances"><p class="bb-label">'+esc(u.related_substances)+'</p>'+substanceChips(d,s)+'</div>'+
'<div class="bb-detail__block" data-bb-part="evidence"><p class="bb-label">'+esc(u.evidence)+'</p>'+evidenceList(d,s)+'</div>'+
'<div data-bb-part="gap">'+gapBox(d,s)+'</div>'+
(action?nextStepMarkup(d,action,' data-bb-part="next"'):'')+
'<p class="bb-small" data-bb-part="disclaimer">'+esc(u.disclaimer)+'</p>'+
closeButton(d,' data-bb-close data-bb-key="close"');
}
function matrixMarkup(d,state,id){
var u=d.ui;
return'<table class="bb-matrix" data-bb-matrix aria-label="'+esc(u.tab_substances)+'" aria-describedby="'+id+'-caption"><thead><tr><th scope="col">'+esc(u.source_card_label)+'</th>'+
d.substances.map(function(sub){
var on=state.substance===sub.id;
return'<th scope="col" class="bb-matrix__substance'+(on?' is-active':'')+'" data-bb-colhead="'+esc(sub.id)+'"><button type="button" data-bb-col="'+esc(sub.id)+'" data-bb-key="col-'+esc(sub.id)+'" aria-pressed="'+on+'">'+esc(sub.name)+'</button></th>';
}).join('')+'<th scope="col">'+esc(u.col_priority)+'</th></tr></thead><tbody>'+
B.matrixRows(d).map(function(row){
var on=state.selected===row.id,s=find(d.sources,row.id);
return'<tr'+(on?' class="is-selected" aria-current="true"':'')+' data-bb-mrow="'+esc(row.id)+'"><th scope="row">'+
'<button type="button" class="bb-matrix__source" data-bb-pick="'+esc(row.id)+'" data-bb-key="pick-'+esc(row.id)+'" aria-pressed="'+on+'">'+dot(d,s)+'<span>'+esc(row.name)+'</span></button>'+
(on?'<button type="button" class="bb-link" data-bb-view="'+esc(row.id)+'" data-bb-key="view-'+esc(row.id)+'">'+esc(u.view_on_map)+'</button>':'')+'</th>'+
d.substances.map(function(sub){
var level=row.cells[sub.id];
return'<td class="bb-matrix__cell'+(state.substance===sub.id?' is-active':'')+'" data-bb-cell="'+esc(sub.id)+'">'+(level?levelTag(d,level):'<span class="bb-matrix__none" aria-hidden="true">–</span>')+'</td>';
}).join('')+'<td>'+priorityBadge(d,row.priority)+'</td></tr>';
}).join('')+'</tbody></table>';
}
function substanceInfoMarkup(d,state,lang){
var u=d.ui,sub=state.substance?find(d.substances,state.substance):null,src=state.selected?find(d.sources,state.selected):null,h='';
if(src){
h+='<div class="bb-card" data-bb-source-info><p class="bb-label">'+esc(u.source_card_label)+'</p><h3 class="bb-h">'+esc(src.name)+'</h3>'+
'<p class="bb-card__tags">'+categoryTag(d,src)+' '+priorityBadge(d,src.priority,true)+'</p><p class="bb-label">'+esc(u.related_substances)+'</p>'+substanceChips(d,src)+'</div>';
}
h+='<div class="bb-info__substance" data-bb-substance-info>';
if(!sub)h+='<p class="bb-prompt" data-bb-substance-prompt>'+esc(u.substance_select)+'</p>';
else{
h+='<h3 class="bb-h" data-bb-substance-name>'+esc(sub.name)+'</h3>';
if(sub.exceedance_at.length)h+='<p class="bb-info__line">'+esc(u.substance_exceedance+' '+listText(lang,sub.exceedance_at))+'</p>';
h+='<p class="bb-label">'+esc(u.summary_sources)+'</p><ul class="bb-related">'+B.relatedSources(d,sub.id).map(function(sid){
var s=find(d.sources,sid);
return'<li data-bb-related="'+esc(sid)+'">'+dot(d,s)+'<span class="bb-related__name">'+esc(s.name)+'</span>'+levelTag(d,s.substances.filter(function(r){return r.id===sub.id;})[0].level)+'</li>';
}).join('')+'</ul>';
}
return h+'</div><div class="bb-info__levels" data-bb-levels><p class="bb-label">'+esc(u.evidence)+'</p><ul class="bb-levels">'+
LEVELS.map(function(l){return'<li>'+levelTag(d,l,true)+'</li>';}).join('')+'</ul></div>';
}
function actionListMarkup(d,actions,options){
var o=options||{},u=d.ui,id=o.id||'bb';
var head=function(label){return'<th scope="col" role="columnheader">'+esc(label)+'</th>';};
return'<table class="bb-actions" data-bb-actions role="table" aria-label="'+esc(u.tab_actions)+'"><thead role="rowgroup"><tr role="row">'+
head(u.col_priority)+head(u.col_source)+head(u.col_action)+head(u.col_reason)+head(u.col_type)+(o.readOnly?'':'<td role="cell"></td>')+'</tr></thead><tbody role="rowgroup">'+
actions.map(function(a){
var s=find(d.sources,a.source),on=o.selected===a.source;
return'<tr role="row"'+(on?' class="is-selected" aria-current="true"':'')+' data-bb-action="'+esc(a.id)+'">'+
'<td role="cell" class="bb-actions__priority">'+priorityBadge(d,a.priority)+'</td>'+
'<th scope="row" role="rowheader" class="bb-actions__source" id="'+id+'-source-'+esc(a.id)+'">'+esc(s.name)+'</th>'+
'<td role="cell" class="bb-actions__action">'+esc(a.action)+'</td>'+
'<td role="cell" class="bb-actions__reason" data-label="'+esc(u.col_reason)+'">'+esc(a.reason)+'</td>'+
'<td role="cell" class="bb-actions__type"><span class="bb-type">'+esc(u['action_type_'+a.type])+'</span></td>'+
(o.readOnly?'':'<td role="cell" class="bb-actions__view"><button type="button" class="bb-link" data-bb-view="'+esc(s.id)+'" data-bb-key="view-'+esc(a.id)+'" aria-describedby="'+id+'-source-'+esc(a.id)+'">'+arrowed(u.view_source)+'</button></td>')+'</tr>';
}).join('')+'</tbody></table>';
}
function cardListMarkup(d,ids,options){
var o=options||{},u=d.ui;
return ids.map(function(sid){
var s=find(d.sources,sid),on=sid===o.selected,more=(o.id||'bb')+'-card-'+sid,action=s.action_id?find(d.actions,s.action_id):null;
return'<li class="bb-pcard'+(on?' is-selected':'')+'" data-bb-row="'+esc(sid)+'"'+(on?' aria-current="true"':'')+'>'+
'<div class="bb-pcard__head">'+
'<h4 class="bb-pcard__name"><button type="button" class="bb-pcard__toggle" data-bb-select="'+esc(sid)+'" data-bb-key="row-'+esc(sid)+'" aria-expanded="'+on+'" aria-controls="'+esc(more)+'">'+
dot(d,s)+'<span class="bb-pcard__title">'+esc(s.name)+'</span>'+priorityBadge(d,s.priority,true)+'<span class="bb-pcard__mark" aria-hidden="true"></span></button></h4>'+
'<p class="bb-pcard__category">'+esc(find(d.categories,s.category).label)+'</p>'+
'<p class="bb-pcard__activity">'+esc(s.activity)+'</p>'+
'</div>'+
'<div class="bb-pcard__more" id="'+esc(more)+'"'+(on?'':' hidden')+'>'+(on?
'<p class="bb-label">'+esc(u.why_priority)+'</p><p class="bb-why">'+esc(s.priority_reason)+'</p>'+
'<dl class="bb-pcard__facts"><dt class="bb-label">'+esc(u.connection)+'</dt><dd>'+connectionText(d,s)+'</dd></dl>'+
'<div class="bb-detail__block"><p class="bb-label">'+esc(u.related_substances)+'</p>'+substanceChips(d,s)+'</div>'+
'<div class="bb-detail__block"><p class="bb-label">'+esc(u.evidence)+'</p>'+evidenceList(d,s)+'</div>'+
gapBox(d,s)+(action?nextStepMarkup(d,action):'')+
'<p class="bb-small">'+esc(u.disclaimer)+'</p>':'')+
'</div></li>';
}).join('');
}
function perSubstanceMarkup(d,state,options){
var o=options||{},u=d.ui,here=null;
if(state.selected){
d.substances.some(function(sub){
var ids=B.relatedSources(d,sub.id);
if(ids.indexOf(state.selected)>=0&&(!here||sub.id===o.picked))here=sub.id;
return here===o.picked&&here!==null;
});
}
return'<ul class="bb-pstof" data-bb-perstof aria-label="'+esc(u.tab_substances)+'">'+d.substances.map(function(sub){
var on=state.substance===sub.id;
return'<li class="bb-pstof__card'+(on?' is-active':'')+'" data-bb-pcard="'+esc(sub.id)+'">'+
'<h3 class="bb-pstof__head"><button type="button" data-bb-col="'+esc(sub.id)+'" data-bb-key="pcol-'+esc(sub.id)+'" aria-pressed="'+on+'">'+esc(sub.name)+'</button></h3>'+
(sub.exceedance_at.length?'<p class="bb-pstof__line">'+esc(u.substance_exceedance+' '+listText(o.lang,sub.exceedance_at))+'</p>':'')+
'<ul class="bb-pstof__list">'+B.relatedSources(d,sub.id).map(function(sid){
var s=find(d.sources,sid),sel=state.selected===sid,level=s.substances.filter(function(r){return r.id===sub.id;})[0].level;
return'<li class="bb-pstof__item'+(sel?' is-selected':'')+'"'+(sel?' aria-current="true"':'')+'>'+
'<button type="button" class="bb-pstof__source" data-bb-pick="'+esc(sid)+'" data-bb-key="ppick-'+esc(sub.id)+'-'+esc(sid)+'" aria-pressed="'+sel+'">'+dot(d,s)+'<span>'+esc(s.name)+'</span></button>'+
'<span class="bb-pstof__facts">'+levelTag(d,level)+priorityBadge(d,s.priority,true)+'</span>'+
(sel&&here===sub.id?'<button type="button" class="bb-link bb-pstof__view" data-bb-view="'+esc(sid)+'" data-bb-key="pview-'+esc(sid)+'">'+esc(u.view_on_map)+'</button>':'')+
'</li>';
}).join('')+'</ul></li>';
}).join('')+'</ul>';
}
function actionCardsMarkup(d,actions,options){
var o=options||{},u=d.ui,id=o.id||'bb';
var fact=function(part,label,value,quiet){
return'<div class="bb-acard__'+part+'"><dt'+(quiet?' class="bb-sr"':'')+'>'+esc(label)+'</dt><dd>'+value+'</dd></div>';
};
return'<ul class="bb-acards" data-bb-acards aria-label="'+esc(u.tab_actions)+'">'+actions.map(function(a){
var s=find(d.sources,a.source),on=o.selected===a.source,src=id+'-asource-'+esc(a.id);
return'<li class="bb-acard'+(on?' is-selected':'')+'" data-bb-action="'+esc(a.id)+'"'+(on?' aria-current="true"':'')+'><dl class="bb-acard__facts">'+
fact('priority',u.col_priority,priorityBadge(d,a.priority),true)+
fact('action',u.col_action,esc(a.action),true)+
fact('source',u.col_source,'<span id="'+src+'">'+esc(s.name)+'</span>')+
fact('reason',u.col_reason,esc(a.reason))+
fact('type',u.col_type,'<span class="bb-type">'+esc(u['action_type_'+a.type])+'</span>')+'</dl>'+
'<button type="button" class="bb-link" data-bb-view="'+esc(s.id)+'" data-bb-key="aview-'+esc(a.id)+'" aria-describedby="'+src+'">'+arrowed(u.view_source)+'</button></li>';
}).join('')+'</ul>';
}
function sourceSheetMarkup(d,s,id){
var u=d.ui;
return'<h3 class="bb-sheet__title" id="'+id+'-sheet-title" tabindex="-1" data-bb-sheet-title>'+esc(s.name)+'</h3>'+
'<p class="bb-sheet__category">'+categoryTag(d,s)+'</p>'+
'<div class="bb-sheet__block"><p class="bb-label">'+esc(u.related_substances)+'</p>'+substanceChips(d,s)+'</div>'+
'<button type="button" class="bb-more" data-bb-evidence="'+esc(s.id)+'" data-bb-key="sheet-evidence">'+arrowed(u.show_evidence)+'</button>'+
closeButton(d,' data-bb-sheet-close data-bb-key="sheet-close"');
}
function filterSheetMarkup(d,id){
var u=d.ui;
return'<h3 class="bb-sheet__title" id="'+id+'-sheet-title" tabindex="-1" data-bb-sheet-title>'+esc(u.filters)+'</h3>'+
'<div class="bb-sheet__field" role="group" aria-labelledby="'+id+'-fsub"><p class="bb-label" id="'+id+'-fsub">'+esc(u.col_substances)+'</p>'+
'<div class="bb-chips">'+chipButton('data-bb-substance','',u.filter_all,false)+d.substances.map(function(s){return chipButton('data-bb-substance',s.id,s.name,false);}).join('')+'</div></div>'+
'<div class="bb-sheet__field"><label class="bb-label" for="'+id+'-fcat">'+esc(u.filter_category)+'</label>'+
'<select class="bb-select" id="'+id+'-fcat" data-bb-category><option value="">'+esc(u.filter_all)+'</option>'+
d.categories.map(function(c){return'<option value="'+esc(c.id)+'">'+esc(c.label)+'</option>';}).join('')+'</select></div>'+
'<div class="bb-sheet__field"><label class="bb-label" for="'+id+'-fprio">'+esc(u.filter_priority)+'</label>'+
'<select class="bb-select" id="'+id+'-fprio" data-bb-priority><option value="">'+esc(u.filter_all)+'</option>'+
PRIORITIES.map(function(p){return'<option value="'+p+'">'+esc(u['priority_'+p])+'</option>';}).join('')+'</select></div>'+
closeButton(d,' data-bb-sheet-close data-bb-key="sheet-close"');
}
function shellMarkup(d,id,lang){
var u=d.ui,n=B.summaryCounts(d),all=decap(u.filter_all),types=[],chip=chipButton;
var line=[u.selector_value,n.substances+' '+u.summary_substances,n.sources+' '+u.summary_sources,
listText(lang,[n.high+' '+u.summary_high,n.medium+' '+u.summary_medium])+' '+u.summary_priorities].join(' · ');
d.actions.forEach(function(a){if(types.indexOf(a.type)<0)types.push(a.type);});
return'<div class="bb__head">'+
'<p class="bb__brand" data-bb-brand>'+esc(u.brand)+'</p>'+
'<div class="bb__water"><label class="bb-sr" for="'+id+'-water">'+esc(u.selector_label)+'</label>'+
'<select class="bb-select" id="'+id+'-water" data-bb-waterbody aria-describedby="'+id+'-note"><option>'+esc(u.selector_value)+'</option></select>'+
'<span class="bb__note" id="'+id+'-note" data-bb-note>'+esc(u.selector_note)+'</span></div>'+
'<span class="bb__fictional" data-bb-fictional>'+esc(u.chip_fictional)+'</span>'+
'<span class="bb__fictional bb__fictional--short" data-bb-fictional-short role="img" aria-label="'+esc(u.chip_fictional)+'">'+esc(u.chip_fictional_short)+'</span>'+
'<button type="button" class="bb-button bb__reset" data-bb-reset data-bb-key="reset">'+esc(u.reset)+'</button>'+
'</div>'+
'<div class="bb__tabs" role="tablist" aria-label="'+esc(u.brand)+'">'+TABS.map(function(t,i){
return'<button type="button" class="bb-tab" role="tab" id="'+id+'-tab-'+t+'" data-bb-tab="'+t+'" aria-controls="'+id+'-panel" aria-selected="'+(i===0)+'" tabindex="'+(i?-1:0)+'">'+esc(u['tab_'+t])+'</button>';
}).join('')+'</div>'+
'<div class="bb__panel" role="tabpanel" id="'+id+'-panel" aria-labelledby="'+id+'-tab-overview">'+
'<div class="bb__bar" data-bb-filters>'+
'<div class="bb-chips" role="group" aria-label="'+esc(u.substance_select)+'">'+chip('data-bb-substance','',u.filter_all,true)+d.substances.map(function(s){return chip('data-bb-substance',s.id,s.name,false);}).join('')+'</div>'+
'<select class="bb-select" data-bb-category aria-label="'+esc(u.filter_category)+'"><option value="">'+esc(u.filter_category+': '+all)+'</option>'+
d.categories.map(function(c){return'<option value="'+esc(c.id)+'">'+esc(c.label)+'</option>';}).join('')+'</select>'+
'<select class="bb-select" data-bb-priority aria-label="'+esc(u.filter_priority)+'"><option value="">'+esc(u.filter_priority+': '+all)+'</option>'+
PRIORITIES.map(function(p){return'<option value="'+p+'">'+esc(u.filter_priority+': '+decap(u['priority_'+p]))+'</option>';}).join('')+'</select>'+
'</div>'+
'<div class="bb__pbar" data-bb-pbar>'+
'<div class="bb-views" role="group" aria-label="'+esc(u.mobile_view)+'">'+
'<button type="button" class="bb-view" data-bb-viewmode="map" aria-pressed="true">'+esc(u.mobile_map)+'</button>'+
'<button type="button" class="bb-view" data-bb-viewmode="list" aria-pressed="false">'+esc(u.mobile_list)+'</button></div>'+
'<div class="bb__pfilters"><button type="button" class="bb-button bb__filters" data-bb-open-filters data-bb-key="open-filters" aria-haspopup="dialog" aria-expanded="false">'+esc(u.filters)+'</button>'+
'<span class="bb__active" data-bb-active></span></div>'+
'</div>'+
'<div class="bb__bar" data-bb-types hidden><span class="bb__barlabel" id="'+id+'-types">'+esc(u.action_type_label)+'</span>'+
'<div class="bb-chips" role="group" aria-labelledby="'+id+'-types">'+chip('data-bb-type','',u.filter_all,true)+types.map(function(t){return chip('data-bb-type',t,u['action_type_'+t],false);}).join('')+'</div></div>'+
'<p class="bb__summary" data-bb-summary><span data-bb-summary-line>'+esc(line)+'</span> <span class="bb-tag" data-bb-summary-note>'+esc(u.summary_note)+'</span></p>'+
'<div class="bb__body">'+
'<div class="bb__map" data-bb-map>'+mapMarkup(d,{id:id})+'</div>'+
'<div class="bb__main" data-bb-main hidden></div>'+
'<div class="bb__side" data-bb-side>'+
'<div class="bb__lists" data-bb-lists><h3 class="bb-h bb__listhead" data-bb-list-title></h3><ul class="bb-list" data-bb-list></ul><div class="bb-empty" data-bb-empty role="status"></div></div>'+
'<section class="bb-detail" data-bb-detail aria-labelledby="'+id+'-detail" hidden></section>'+
'<div class="bb-info" data-bb-info hidden></div>'+
'</div>'+
'</div>'+
'</div>'+
'<p class="bb__caption" data-bb-caption>'+esc(u.caption_fictional)+'</p>'+
'<div class="bb-layer" data-bb-layer hidden><div class="bb-backdrop" data-bb-backdrop></div>'+
'<div class="bb-sheet" data-bb-sheet role="dialog" aria-modal="true" aria-labelledby="'+id+'-sheet-title"></div></div>';
}
function mountFull(root,d,config){
var u=d.ui,id=config.id,lang=config.lang,state=B.initialState(),opener=null,alive=true;
var KEYS=Object.keys(state),hadClass=root.classList.contains('bb');
var phoneQuery=win.matchMedia?win.matchMedia('(max-width: 47.99em)'):null,phone=!!(phoneQuery&&phoneQuery.matches);
var VIEWS={overview:'map',sources:'list'},views=Object.assign({},VIEWS),picked=null;
var sheet=null,sheetFor=null,sheetOpener=null,isolated=[],pageOverflow='',hideLater=0,frame=0;
root.classList.add('bb');
root.setAttribute('role','group');root.setAttribute('aria-label',u.brand);root.setAttribute('data-bb-ready','full');
root.innerHTML=shellMarkup(d,id,lang);
var $=function(s){return root.querySelector(s);},$$=function(s){return[].slice.call(root.querySelectorAll(s));};
var el={
tabs:$$('[role=tab]'),tablist:$('[role=tablist]'),panel:$('[role=tabpanel]'),filters:$('[data-bb-filters]'),types:$('[data-bb-types]'),summary:$('[data-bb-summary]'),
map:$('[data-bb-map]'),main:$('[data-bb-main]'),side:$('[data-bb-side]'),lists:$('[data-bb-lists]'),title:$('[data-bb-list-title]'),
list:$('[data-bb-list]'),empty:$('[data-bb-empty]'),detail:$('[data-bb-detail]'),info:$('[data-bb-info]'),
markers:$$('[data-bb-marker]'),routes:$$('[data-bb-from]'),
pbar:$('[data-bb-pbar]'),viewButtons:$$('[data-bb-viewmode]'),openFilters:$('[data-bb-open-filters]'),active:$('[data-bb-active]'),
layer:$('[data-bb-layer]'),sheet:$('[data-bb-sheet]')
};
var keyed=function(key){return key?$('[data-bb-key="'+key+'"]'):null;};
var focus=function(node,options){
if(!node||node.disabled||!node.getClientRects().length)return false;
node.focus(options);
return true;
};
var calm=function(){return!!(win.matchMedia&&win.matchMedia('(prefers-reduced-motion: reduce)').matches);};
var show=function(node){
var r,tall=win.innerHeight;
if(!node||el.side.getBoundingClientRect().top<el.map.getBoundingClientRect().bottom-1)return;
r=node.getBoundingClientRect();
if(r.top<0||r.bottom>tall)node.scrollIntoView({block:r.height>tall*.8?'start':'nearest'});
};
var keepInView=function(node){
var pad=parseFloat(win.getComputedStyle(doc.documentElement).scrollPaddingTop)||0,r;
if(!node)return;
r=node.getBoundingClientRect();
if(r.top<pad||r.top>win.innerHeight-48)node.scrollIntoView({block:'start'});
};
var swap=function(node,html){
var active=doc.activeElement,key=active&&node.contains(active)?active.getAttribute('data-bb-key'):null,again;
node.innerHTML=html;
again=key?node.querySelector('[data-bb-key="'+key+'"]'):null;
if(again)again.focus({preventScroll:true});
};
function renderTabs(){
var t=state.tab,onMap=t==='overview'||t==='sources',on=el.tabs[TABS.indexOf(t)],lr,tr;
root.setAttribute('data-tab',t);
root.setAttribute('data-view',onMap?views[t]:'none');
el.tabs.forEach(function(b){var sel=b===on;b.setAttribute('aria-selected',String(sel));b.setAttribute('tabindex',sel?'0':'-1');});
el.panel.setAttribute('aria-labelledby',id+'-tab-'+t);
el.filters.hidden=!onMap;el.types.hidden=t!=='actions';el.summary.hidden=t!=='overview';
el.map.hidden=!onMap;el.main.hidden=onMap;el.side.hidden=t==='actions';
el.pbar.hidden=!onMap;
el.viewButtons.forEach(function(b){b.setAttribute('aria-pressed',String(onMap&&b.getAttribute('data-bb-viewmode')===views[t]));});
if(phone){
lr=el.tablist.getBoundingClientRect();tr=on.getBoundingClientRect();
if(on===el.tabs[0])el.tablist.scrollLeft=0;
else if(on===el.tabs[el.tabs.length-1])el.tablist.scrollLeft=el.tablist.scrollWidth;
else if(tr.width&&tr.left<lr.left+16)el.tablist.scrollLeft-=lr.left+16-tr.left;
else if(tr.width&&tr.right>lr.right-16)el.tablist.scrollLeft+=tr.right-lr.right+16;
}
}
function renderFilters(){
var chips=[],n;
$$('[data-bb-substance]').forEach(function(c){c.setAttribute('aria-pressed',String((c.getAttribute('data-bb-substance')||null)===state.substance));});
$$('[data-bb-type]').forEach(function(c){c.setAttribute('aria-pressed',String((c.getAttribute('data-bb-type')||null)===state.actionType));});
$$('select[data-bb-category]').forEach(function(s){s.value=state.category||'';});
$$('select[data-bb-priority]').forEach(function(s){s.value=state.priority||'';});
if(state.substance)chips.push(['substance',find(d.substances,state.substance).name]);
if(state.category)chips.push(['category',find(d.categories,state.category).label]);
if(state.priority)chips.push(['priority',u.filter_priority+': '+decap(u['priority_'+state.priority])]);
n=chips.length;
el.openFilters.textContent=n?u.filters+' ('+n+')':u.filters;
swap(el.active,chips.map(function(c){
return'<button type="button" class="bb-chip bb-chip--remove" data-bb-remove="'+c[0]+'" data-bb-key="remove-'+c[0]+'" aria-label="'+esc(u.filter_remove.replace('{name}',c[1]))+'">'+
'<span>'+esc(c[1])+'</span><svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4.5 4.5l7 7m0-7l-7 7"/></svg></button>';
}).join(''));
}
function renderMap(){
var ids=B.filterSources(d,state);
el.markers.forEach(function(m){
var sid=m.getAttribute('data-bb-marker'),shown=ids.indexOf(sid)>=0,on=state.selected===sid;
m.classList.toggle('is-faded',!shown);m.disabled=!shown;
m.classList.toggle('is-selected',on);m.setAttribute('aria-pressed',String(on));
});
el.routes.forEach(function(r){
var from=r.getAttribute('data-bb-from');
r.classList.toggle('is-faded',ids.indexOf(from)<0);r.classList.toggle('is-selected',state.selected===from);
});
placeNames();
}
function placeNames(){
var v=el.map.querySelector('.bb-map__view').getBoundingClientRect();
var hits=function(r,m){
return el.markers.some(function(o){
var b=o.querySelector('.bb-marker__dot').getBoundingClientRect();
return o!==m&&!o.disabled&&r.left<b.right&&r.right>b.left&&r.top<b.bottom&&r.bottom>b.top;
});
};
var inside=function(r){return r.top>=v.top+2&&r.bottom<=v.bottom-2;};
el.markers.forEach(function(m){
var name=m.querySelector('.bb-marker__name'),r,shift=0;
name.style.marginLeft='';m.classList.remove('is-flip');
if(!phone||!v.width||!(m.classList.contains('is-selected')||m===doc.activeElement))return;
r=name.getBoundingClientRect();
if(hits(r,m)||!inside(r)){
m.classList.add('is-flip');
var f=name.getBoundingClientRect();
if(!inside(f)||(hits(f,m)&&inside(r)))m.classList.remove('is-flip');else r=f;
}
if(r.right>v.right-6)shift=v.right-6-r.right;
if(r.left+shift<v.left+6)shift=v.left+6-r.left;
if(shift)name.style.marginLeft=Math.round(shift)+'px';
});
}
function renderSide(prev){
var t=state.tab,ids,detail=!phone&&t==='overview'&&!!state.selected;
if(t==='overview'||t==='sources'){
ids=B.filterSources(d,state);
el.title.textContent=t==='overview'?u.priority_list_title:u.summary_sources;
if(phone){
el.list.className='bb-list bb-list--cards';
swap(el.list,cardListMarkup(d,t==='overview'?byPriority(d,ids).map(function(s){return s.id;}):ids,{selected:state.selected,id:id}));
}else{
el.list.className='bb-list bb-list--'+t;
swap(el.list,t==='overview'?priorityListMarkup(d,ids,{selected:state.selected}):sourceListMarkup(d,ids,{selected:state.selected,id:id}));
}
swap(el.empty,ids.length?'':'<p data-bb-empty-text>'+esc(u.empty)+'</p><button type="button" class="bb-button" data-bb-reset data-bb-key="reset-empty">'+esc(u.reset)+'</button>');
}
el.lists.hidden=detail||t==='substances';
if(detail){
swap(el.detail,detailMarkup(d,find(d.sources,state.selected),id));
if(state.selected!==prev.selected)el.side.scrollTop=0;
if(el.detail.hidden){
el.detail.hidden=false;
void el.detail.offsetWidth;
el.detail.classList.add('is-open');
}
}else{el.detail.classList.remove('is-open');el.detail.hidden=true;el.detail.innerHTML='';}
el.info.hidden=t!=='substances';
swap(el.info,t==='substances'?substanceInfoMarkup(d,state,lang):'');
}
function renderMain(){
var html='';
if(state.tab==='substances'){
html='<div class="bb-scroll bb-scroll--matrix" data-bb-scroll>'+matrixMarkup(d,state,id)+'</div>'+
(phone?perSubstanceMarkup(d,state,{lang:lang,picked:picked}):'')+
'<p class="bb-small" id="'+id+'-caption" data-bb-matrix-caption>'+esc(u.matrix_caption)+'</p>';
}else if(state.tab==='actions'){
html=(phone?actionCardsMarkup(d,B.actionsFor(d,state.actionType),{selected:state.selected,id:id})
:'<div class="bb-scroll" data-bb-scroll>'+actionListMarkup(d,B.actionsFor(d,state.actionType),{selected:state.selected,id:id})+'</div>')+
'<p class="bb-small" data-bb-actions-note>'+esc(u.actions_note)+'</p>';
}
swap(el.main,html);
}
function render(prev){
renderTabs();renderFilters();renderMap();renderSide(prev);renderMain();
if(sheet==='source'&&state.selected!==sheetFor)closeSheet();
}
function refresh(){render(state);}
function reveal(sid){
var row=$('[data-bb-list] [data-bb-row="'+sid+'"]'),side=el.side,top;
if(!row||side.scrollHeight<=side.clientHeight+1)return;
top=row.getBoundingClientRect().top-side.getBoundingClientRect().top;
if(top<el.title.offsetHeight||top+row.offsetHeight>side.clientHeight)side.scrollTop+=top-el.title.offsetHeight;
}
function isolate(){
var n,mark=function(c){
if(c===n||c.nodeType!==1||/^(SCRIPT|STYLE|LINK|TEMPLATE|NOSCRIPT)$/.test(c.tagName)||c.hasAttribute('inert'))return;
c.setAttribute('inert','');isolated.push(c);
};
for(n=el.layer;n&&n.parentNode&&n!==doc.body;n=n.parentNode)[].forEach.call(n.parentNode.children,mark);
}
function release(){isolated.forEach(function(n){n.removeAttribute('inert');});isolated=[];}
function openSheet(kind,from){
var html=doc.documentElement;
if(!phone)return;
if(sheet)closeSheet();
win.clearTimeout(hideLater);
sheet=kind;sheetOpener=from;sheetFor=kind==='source'?state.selected:null;
el.sheet.setAttribute('data-bb-sheet',kind);
el.sheet.innerHTML=kind==='source'?sourceSheetMarkup(d,find(d.sources,state.selected),id):filterSheetMarkup(d,id);
if(kind==='filters')renderFilters();
el.layer.removeAttribute('aria-hidden');
el.layer.hidden=false;
isolate();
pageOverflow=html.style.overflow;html.style.overflow='hidden';
html.setAttribute('data-bb-sheet-open',kind);
el.openFilters.setAttribute('aria-expanded',String(kind==='filters'));
void el.sheet.offsetWidth;
el.layer.classList.add('is-open');
el.sheet.querySelector('[data-bb-sheet-title]').focus({preventScroll:true});
}
function closeSheet(){
var html=doc.documentElement,done;
if(!sheet)return;
sheet=null;sheetFor=null;
el.layer.classList.remove('is-open');
el.layer.setAttribute('aria-hidden','true');
release();
html.style.overflow=pageOverflow;
html.removeAttribute('data-bb-sheet-open');
el.openFilters.setAttribute('aria-expanded','false');
done=function(){if(!sheet){el.layer.hidden=true;el.sheet.innerHTML='';el.sheet.removeAttribute('data-bb-sheet');}};
win.clearTimeout(hideLater);
if(calm()||!phone)done();else hideLater=win.setTimeout(done,240);
}
function dismiss(){
var kind=sheet,from=sheetOpener;
closeSheet();
if(kind==='source'){opener=from;setState({selected:null},{closed:true});}
else focus(el.openFilters);
}
function toEvidence(sid){
var t=state.tab==='sources'?'sources':'overview',card;
closeSheet();
views[t]='list';
if(state.tab!==t||state.selected!==sid)setState({tab:t,selected:sid});
refresh();
card=$('[data-bb-list] [data-bb-row="'+sid+'"]');
focus(keyed('row-'+sid),{preventScroll:true});
if(card)card.scrollIntoView({block:'start'});
}
function setState(partial,how){
var prev=state,next=Object.assign({},state,partial),h=how||{},sel;
if((next.tab==='overview'||next.tab==='sources')&&next.selected&&B.filterSources(d,next).indexOf(next.selected)<0)next.selected=null;
if(KEYS.every(function(k){return next[k]===prev[k];}))return;
state=next;sel=state.selected;
render(prev);
if(sel&&state.tab==='sources'&&(sel!==prev.selected||prev.tab!=='sources'))reveal(sel);
if(h.focus&&sel&&(sel!==prev.selected||state.tab!==prev.tab)){
if(state.tab==='overview'){focus($('[data-bb-detail-title]'));show(el.detail);}
else if(state.tab==='sources'&&h.from==='marker-'+sel){focus(keyed('row-'+sel));show($('[data-bb-list] [data-bb-row="'+sel+'"]'));}
}else if(h.closed&&!sel&&prev.selected){
if(!focus(keyed(opener)))focus(keyed('marker-'+prev.selected));
}
}
function select(sid,key){
opener=key;
if(phone&&key==='marker-'+sid){
setState({selected:sid});
openSheet('source',key);
return;
}
if(state.selected===sid)close();
else{
setState({selected:sid},{focus:!phone,from:key});
if(phone&&/^row-/.test(key))keepInView($('[data-bb-list] [data-bb-row="'+sid+'"]'));
}
}
function close(){if(state.selected)setState({selected:null},{closed:true});}
function view(sid){
var next={tab:'overview',selected:sid};
if(B.filterSources(d,state).indexOf(sid)<0){next.substance=null;next.category=null;next.priority=null;}
opener='marker-'+sid;
if(!phone){setState(next,{focus:true});return;}
views.overview='map';
setState(next);refresh();
keepInView(el.tablist);
openSheet('source',opener);
}
function reset(){
guideOff();
opener=null;picked=null;views=Object.assign({},VIEWS);
if(sheet)closeSheet();
setState(B.initialState());refresh();
}
function clean(partial){
var out={},p=partial||{};
KEYS.forEach(function(k){if(k in p&&(p[k]===null||typeof p[k]==='string'))out[k]=p[k]||null;});
if('tab'in out&&TABS.indexOf(out.tab)<0)delete out.tab;
return out;
}
var GUIDE_AT=[0,1200,2600,4200,5600],GUIDE_END=7000,GUIDE_SUBSTANCE='zink',GUIDE_SOURCE='S2';
var g={mode:null,step:0,reached:0,t0:0,held:0,timer:0,on:false};
function guideSetup(){
var head=$('.bb__head');
if(!u.guide_start||!find(d.substances,GUIDE_SUBSTANCE)||!find(d.sources,GUIDE_SOURCE))return;
g.on=true;
g.button=doc.createElement('button');
g.button.type='button';g.button.className='bb-button bb__guide';
g.button.setAttribute('data-bb-guide-start','');g.button.setAttribute('data-bb-key','guide-start');
g.button.innerHTML=arrowed(u.guide_start);
head.insertBefore(g.button,head.querySelector('[data-bb-reset]'));
g.bar=doc.createElement('div');
g.bar.className='bb-guide';g.bar.setAttribute('data-bb-guide','');
g.bar.innerHTML='<ol class="bb-guide__steps" data-bb-guide-steps aria-label="'+esc(u.guide_start.replace(/\s*[→↓]$/,''))+'" hidden>'+
[1,2,3,4,5].map(function(n){
return'<li class="bb-guide__step" data-bb-guide-step="'+n+'"><span class="bb-guide__num" aria-hidden="true">'+n+'</span><span class="bb-guide__name">'+esc(u['guide_step_'+n])+'</span></li>';
}).join('')+'</ol>'+
'<p class="bb-guide__caption" data-bb-guide-caption aria-live="polite" aria-atomic="true"></p>'+
'<div class="bb-guide__controls" data-bb-guide-controls></div>';
g.steps=g.bar.querySelector('[data-bb-guide-steps]');g.caption=g.bar.querySelector('[data-bb-guide-caption]');g.controls=g.bar.querySelector('[data-bb-guide-controls]');
g.foot=$('[data-bb-caption]');
guidePlace();
root.addEventListener('click',guideClick,true);
root.addEventListener('keydown',guideKey,true);
root.addEventListener('change',guideChange,true);
}
function guidePlace(){
if(!g.on)return;
if(phone){if(g.bar.nextSibling!==el.summary)el.panel.insertBefore(g.bar,el.summary);}
else if(g.bar.nextSibling!==g.foot)root.insertBefore(g.bar,g.foot);
}
function guideNow(){return win.performance&&win.performance.now?win.performance.now():Date.now();}
function guideRunning(){return g.mode==='run'||g.mode==='paused'||g.mode==='manual';}
function guideMode(mode){
g.mode=mode;
if(mode)root.setAttribute('data-guide',mode);else root.removeAttribute('data-guide');
}
function guideApply(n){
setState({tab:'overview',substance:GUIDE_SUBSTANCE,category:null,priority:null,selected:n>=3?GUIDE_SOURCE:null,actionType:null});
}
function guideRender(){
var ended=g.mode==='end'||g.mode==='done',text=g.mode?(ended?u.guide_end:u['guide_caption_'+g.step]):'';
var m=/^([^:]+:)\s+([\s\S]*)$/.exec(text),had=g.controls.contains(doc.activeElement);
var button=function(what,key,label){return'<button type="button" class="bb-button bb-guide__button" data-bb-guide-do="'+what+'" data-bb-key="guide-'+key+'">'+esc(label)+'</button>';};
g.steps.hidden=!g.mode;
[].forEach.call(g.steps.children,function(li,i){
var n=i+1,now=!ended&&n===g.step;
li.classList.toggle('is-done',ended?n<=g.reached:n<g.step);
li.classList.toggle('is-current',now);
if(now)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');
});
g.caption.innerHTML=m?'<strong>'+esc(m[1])+'</strong> '+esc(m[2]):esc(text);
swap(g.controls,!g.mode?'':ended?button('again','again',u.guide_again)+button('reset','reset',u.reset):
(g.mode==='manual'?'':button(g.mode==='paused'?'resume':'pause','toggle',u[g.mode==='paused'?'guide_resume':'guide_pause']))+
button('next','next',u.guide_next)+button('skip','skip',u.guide_skip));
if(had&&!g.controls.contains(doc.activeElement))focus(g.controls.querySelector('button'),{preventScroll:true});
}
function guideShow(n){
g.step=n;g.reached=Math.max(g.reached,n);
guideApply(n);
root.setAttribute('data-guide-step',String(n));
guideRender();
guideReveal(n);
}
function guideSchedule(){
win.clearTimeout(g.timer);
if(g.mode!=='run')return;
g.timer=win.setTimeout(function(){
if(g.mode!=='run')return;
if(g.step<5){guideShow(g.step+1);guideSchedule();}else guideEnd(false);
},Math.max(0,(g.step<5?GUIDE_AT[g.step]:GUIDE_END)-(guideNow()-g.t0)));
}
function guideStart(){
reset();
if(phone){views.overview='list';refresh();}
g.reached=0;g.t0=guideNow();
guideMode(calm()?'manual':'run');
guideShow(1);
guideSchedule();
guideInto();
focus(g.controls.querySelector('button'),{preventScroll:true});
}
function guideEnd(jump){
win.clearTimeout(g.timer);
if(jump){guideApply(5);g.reached=5;}
guideMode('end');
root.removeAttribute('data-guide-step');
guideRender();
}
function guideStop(){
if(g.mode==='end'){guideMode('done');return;}
if(!guideRunning())return;
win.clearTimeout(g.timer);
guideMode('done');
root.removeAttribute('data-guide-step');
guideRender();
}
function guideOff(){
if(!g.on||!g.mode)return;
win.clearTimeout(g.timer);
g.step=0;g.reached=0;
guideMode(null);
root.removeAttribute('data-guide-step');
guideRender();
}
function guideDo(what){
var n=g.step+1;
if(what==='pause'&&g.mode==='run'){win.clearTimeout(g.timer);g.held=guideNow()-g.t0;guideMode('paused');guideRender();}
else if(what==='resume'&&g.mode==='paused'){g.t0=guideNow()-g.held;guideMode('run');guideRender();guideSchedule();}
else if(what==='next'&&guideRunning()){
if(n>5){guideEnd(false);return;}
if(g.mode==='paused')g.held=GUIDE_AT[n-1];else g.t0=guideNow()-GUIDE_AT[n-1];
guideShow(n);guideSchedule();
}
else if(what==='skip'&&guideRunning())guideEnd(true);
else if(what==='again')guideStart();
else if(what==='reset'){reset();if(phone)focus(el.tabs[0]);else focus(keyed('reset'));}
}
function guidePad(){return parseFloat(win.getComputedStyle(doc.documentElement).scrollPaddingTop)||0;}
function guideScroll(node,block,top,bottom){
node.style.scrollMarginTop=top?Math.round(top)+'px':'';
node.style.scrollMarginBottom=bottom?Math.round(bottom)+'px':'';
node.scrollIntoView({block:block,behavior:calm()?'auto':'smooth'});
node.style.scrollMarginTop='';node.style.scrollMarginBottom='';
}
function guideInto(){
var r=root.getBoundingClientRect();
if(phone)guideScroll(el.pbar,'start',-parseFloat(win.getComputedStyle(doc.documentElement).fontSize));
else if(r.top<guidePad()-1||r.bottom>win.innerHeight+1)guideScroll(el.filters,'start');
}
function guideReveal(n){
var bar=g.bar.getBoundingClientRect(),pad=guidePad(),scope,node,r,under,box,dy;
if(phone){
scope=$('[data-bb-list] .bb-pcard.is-selected');
if(n<3||!scope)return;
node=n===5?scope.querySelector('.bb-next'):scope;
if(!node)return;
r=(n===4?scope.querySelector('.bb-why')||scope:node).getBoundingClientRect();
under=(parseFloat(win.getComputedStyle(g.bar).top)||0)+bar.height+8;
if(r.top<under-1||r.bottom>win.innerHeight-64)guideScroll(node,'start',under-pad);
return;
}
if(n===2){
box=el.markers.filter(function(m){return!m.classList.contains('is-faded');}).map(function(m){return m.querySelector('.bb-marker__dot').getBoundingClientRect();});
if(!box.length)return;
r={top:Math.min.apply(null,box.map(function(b){return b.top;})),bottom:Math.max.apply(null,box.map(function(b){return b.bottom;}))};
dy=Math.min(r.bottom-(bar.top-12),r.top-pad-4);
if(dy>0)win.scrollBy({top:dy,behavior:calm()?'auto':'smooth'});
return;
}
node=n===3?$('[data-bb-detail-title]'):n===4?$('[data-bb-detail] [data-bb-part="why"]'):n===5?$('[data-bb-detail] .bb-next'):null;
if(!node)return;
r=node.getBoundingClientRect();
if(r.top<pad||r.bottom>Math.min(win.innerHeight,bar.top)-4)guideScroll(node,'nearest',0,bar.height+8);
}
function guideClick(e){
var t=e.target&&e.target.closest?e.target.closest('button'):null,what;
if(!g.on)return;
if(t&&t===g.button){guideStart();return;}
if(g.bar.contains(e.target)){if(t&&(what=t.getAttribute('data-bb-guide-do')))guideDo(what);return;}
if(t&&t.hasAttribute('data-bb-reset'))return;
if(g.mode)guideStop();
}
function guideKey(e){
if(!g.mode||g.bar.contains(e.target))return;
if(e.key==='Escape'||e.key==='Esc'||(/^(ArrowLeft|ArrowRight|Home|End)$/.test(e.key)&&e.target.getAttribute&&e.target.getAttribute('role')==='tab'))guideStop();
}
function guideChange(e){if(g.mode&&!g.bar.contains(e.target))guideStop();}
function guideLayout(){
if(!g.on)return;
guidePlace();
if(phone&&guideRunning()&&views.overview!=='list'){views.overview='list';refresh();}
}
function guideDestroy(){
if(!g.on)return;
win.clearTimeout(g.timer);
root.removeEventListener('click',guideClick,true);root.removeEventListener('keydown',guideKey,true);root.removeEventListener('change',guideChange,true);
root.removeAttribute('data-guide');root.removeAttribute('data-guide-step');
}
guideSetup();
function onClick(e){
var t=e.target&&e.target.closest?e.target.closest('button'):null,row,v,left,i;
var attr=function(name){return t.hasAttribute(name)?t.getAttribute(name):null;};
if(e.target&&e.target.closest&&e.target.closest('[data-bb-backdrop]')){if(sheet)dismiss();return;}
if(!t||!root.contains(t)){
row=e.target&&e.target.closest?e.target.closest('[data-bb-mrow]'):null;
if(row&&root.contains(row))select(row.getAttribute('data-bb-mrow'),'pick-'+row.getAttribute('data-bb-mrow'));
return;
}
if(t.disabled)return;
if((v=attr('data-bb-tab'))!==null)setState({tab:v});
else if((v=attr('data-bb-substance'))!==null)setState({substance:v&&v!==state.substance?v:null});
else if((v=attr('data-bb-col'))!==null)setState({substance:v!==state.substance?v:null});
else if((v=attr('data-bb-type'))!==null)setState({actionType:v&&v!==state.actionType?v:null});
else if(attr('data-bb-reset')!==null){
v=!!t.closest('[data-bb-empty]');reset();
if(phone)focus(el.tabs[0]);else if(v)focus(keyed('reset'));
}
else if((v=attr('data-bb-marker'))!==null)select(v,'marker-'+v);
else if((v=attr('data-bb-select'))!==null)select(v,'row-'+v);
else if((v=attr('data-bb-pick'))!==null){
picked=t.closest('[data-bb-pcard]')?t.closest('[data-bb-pcard]').getAttribute('data-bb-pcard'):null;
select(v,attr('data-bb-key')||'pick-'+v);
}
else if((v=attr('data-bb-view'))!==null)view(v);
else if(attr('data-bb-close')!==null)close();
else if((v=attr('data-bb-viewmode'))!==null){if(views[state.tab]){views[state.tab]=v;refresh();}}
else if(attr('data-bb-open-filters')!==null)openSheet('filters','open-filters');
else if(attr('data-bb-sheet-close')!==null)dismiss();
else if((v=attr('data-bb-evidence'))!==null)toEvidence(v);
else if((v=attr('data-bb-remove'))!==null){
left=$$('[data-bb-remove]');i=left.indexOf(t);
setState(v==='substance'?{substance:null}:v==='category'?{category:null}:{priority:null});
left=$$('[data-bb-remove]');
if(!focus(left[i]||left[i-1]))focus(el.openFilters);
}
}
function onChange(e){
if(e.target.hasAttribute('data-bb-category'))setState({category:e.target.value||null});
else if(e.target.hasAttribute('data-bb-priority'))setState({priority:e.target.value||null});
}
function trap(e){
var list=[].slice.call(el.sheet.querySelectorAll('button, select, [href], input, [tabindex="0"]')).filter(function(n){return!n.disabled&&n.getClientRects().length;});
var a=doc.activeElement,first=list[0],last=list[list.length-1];
if(!list.length){e.preventDefault();return;}
if(e.shiftKey&&(a===first||!el.sheet.contains(a)||a===el.sheet.querySelector('[data-bb-sheet-title]'))){e.preventDefault();last.focus();}
else if(!e.shiftKey&&(a===last||!el.sheet.contains(a))){e.preventDefault();first.focus();}
}
function onKey(e){
var i,n=TABS.length,to=-1;
if(e.key==='Escape'||e.key==='Esc'){
if(sheet){e.preventDefault();dismiss();}
else if(state.selected&&e.target.tagName!=='SELECT'){e.preventDefault();close();}
return;
}
if(sheet&&e.key==='Tab'){trap(e);return;}
if(!e.target.getAttribute||e.target.getAttribute('role')!=='tab')return;
i=TABS.indexOf(state.tab);
if(e.key==='ArrowRight')to=(i+1)%n;
else if(e.key==='ArrowLeft')to=(i+n-1)%n;
else if(e.key==='Home')to=0;
else if(e.key==='End')to=n-1;
if(to<0)return;
e.preventDefault();
setState({tab:TABS[to]});
el.tabs[to].focus();
}
function onLayout(){
var now=!!(phoneQuery&&phoneQuery.matches);
if(now===phone)return;
phone=now;
if(sheet)closeSheet();
refresh();
guideLayout();
}
function onResize(){
win.cancelAnimationFrame(frame);
frame=win.requestAnimationFrame(placeNames);
}
function onFocus(e){if(phone&&e.target.hasAttribute&&e.target.hasAttribute('data-bb-marker'))placeNames();}
root.addEventListener('click',onClick);
root.addEventListener('change',onChange);
root.addEventListener('keydown',onKey);
root.addEventListener('focusin',onFocus);
win.addEventListener('resize',onResize);
if(phoneQuery){if(phoneQuery.addEventListener)phoneQuery.addEventListener('change',onLayout);else phoneQuery.addListener(onLayout);}
render(state);
return{
state:function(){return Object.assign({},state);},
set:function(partial){if(alive){guideStop();setState(clean(partial));}},
reset:function(){if(alive)reset();},
destroy:function(){
if(!alive)return;
alive=false;
guideDestroy();
if(sheet)closeSheet();
win.clearTimeout(hideLater);win.cancelAnimationFrame(frame);
root.removeEventListener('click',onClick);root.removeEventListener('change',onChange);root.removeEventListener('keydown',onKey);root.removeEventListener('focusin',onFocus);
win.removeEventListener('resize',onResize);
if(phoneQuery){if(phoneQuery.removeEventListener)phoneQuery.removeEventListener('change',onLayout);else phoneQuery.removeListener(onLayout);}
root.innerHTML='';
['role','aria-label','data-bb-ready','data-tab','data-view'].forEach(function(a){root.removeAttribute(a);});
if(!hadClass)root.classList.remove('bb');
}
};
}
function swatch(priority){return'<i class="bb-pv__swatch bb-pv__swatch--'+esc(priority)+'"></i>';}
function previewMarkup(d,id,s,land){
var u=d.ui,action=s.action_id?find(d.actions,s.action_id):null,way=pathwayOf(d,s);
var target=way&&way.to!=='water'?find(d.sources,way.to):null;
var line=pathwayLines(d,land).filter(function(p){return p.from===s.id;})[0];
var point=null,box=[s],frac=function(n){return Math.round(n*10000)/10000;};
d.monitoring.some(function(m){
var rel=s.substances.filter(function(r){return find(d.substances,r.id).exceedance_at.indexOf(m.id)>=0;})[0];
if(rel)point={at:m,text:u.legend_monitoring+' '+m.id+' · '+decap(find(d.substances,rel.id).name)};
return!!rel;
});
if(target)box.push(target);
if(point)box.push(point.at);
var xs=box.map(function(p){return p.x;}),ys=box.map(function(p){return p.y;});
var place=function(p){return'left:'+pct(p.x/12)+';top:'+pct(p.y/6.4);};
var fact=function(label,value){return'<p class="bb-pv__fact"><span class="bb-pv__label">'+esc(label)+'</span> <span class="bb-pv__value">'+esc(value)+'</span></p>';};
var rows=s.substances.map(function(r){return[find(d.substances,r.id).name,r.level];});
if(way)rows.push([u.route,way.documented?'documented':'possible']);
return'<div class="bb-pv__top">'+
'<span class="bb-pv__pill bb-pv__title" data-bb-pv="title">'+esc(u.pill_title)+'</span> '+
'<span class="bb-pv__chip bb-pv__fictional" data-bb-pv="fictional">'+esc(u.chip_fictional_short)+'</span> '+
'<span class="bb-pv__pill bb-pv__legend" data-bb-pv="legend"><span>'+esc(u.legend_priority)+'</span> '+
PRIORITIES.map(function(p){return'<span>'+swatch(p)+esc(u['priority_'+p])+'</span>';}).join(' ')+'</span>'+
'</div>'+
'<div class="bb-pv__free">'+
'<div class="bb-pv__map" data-bb-pv="map" style="--bb-x0:'+frac(Math.min.apply(null,xs)/1200)+';--bb-x1:'+frac(Math.max.apply(null,xs)/1200)+
';--bb-y1:'+frac(Math.max.apply(null,ys)/640)+'">'+
'<svg class="bb-pv__svg" viewBox="0 0 1200 640" focusable="false">'+baseLayer(land,id)+
(line?'<path class="bb-pv__route" data-bb-pv="route" d="'+line.d+'"/>':'')+'</svg>'+
'<span class="bb-pv__ring bb-pv__ring--'+esc(s.priority)+'" data-bb-pv="ring" style="'+place(s)+'"></span>'+
d.sources.map(function(x){
return'<span class="bb-pv__dot bb-pv__dot--'+esc(x.priority)+(x.id===s.id?' is-selected':'')+'" data-bb-dot="'+esc(x.id)+'" style="'+place(x)+'"></span>';
}).join('')+
(target?'<span class="bb-pv__tag" data-bb-pv="target" style="'+place(target)+'">'+esc(target.name)+'</span>':'')+
(point?'<span class="bb-pv__point" data-bb-pv="monitor" style="'+place(point.at)+'"><svg viewBox="0 0 14 13" focusable="false"><path d="M7 .8 13.4 12.2H.6z"/></svg>'+
'<span class="bb-pv__label" data-bb-pv="monitor-label">'+esc(point.text)+'</span></span>':'')+
'</div>'+
'</div>'+
'<div class="bb-pv__card bb-pv__card--source" data-bb-pv="source">'+
'<div class="bb-pv__facts" data-bb-pv="facts">'+
'<p class="bb-pv__head"><span class="bb-pv__label">'+esc(u.source_card_label)+'</span> <span class="bb-pv__value bb-pv__priority" data-bb-pv="source-priority">'+swatch(s.priority)+esc(u['priority_'+s.priority])+'</span></p>'+
'<p class="bb-pv__name">'+esc(s.name)+'</p>'+
'<p class="bb-pv__label bb-pv__category">'+esc(find(d.categories,s.category).label)+'</p>'+
'<div class="bb-pv__pair">'+fact(u.connection,target?u.pathway_via.replace('{name}',target.name):s.pathway_label||s.connection)+fact(u.knowledge_gap,s.gaps[0])+'</div>'+
(action?'<span class="bb-pv__divider" data-bb-pv="divider"></span><p class="bb-pv__label">'+esc(u.next_step)+'</p><p class="bb-pv__value bb-pv__next" data-bb-pv="next">'+esc(action.action)+'</p>':'')+
'</div>'+
'<div class="bb-pv__evidence" data-bb-pv="evidence"><p class="bb-pv__label">'+esc(u.evidence)+'</p>'+
rows.map(function(r){return'<p class="bb-pv__row" data-bb-pv="evidence-row"><span class="bb-pv__value">'+esc(r[0])+'</span> '+levelTag(d,r[1])+'</p>';}).join('')+
'</div>'+
'</div>'+
'<div class="bb-pv__card bb-pv__card--priorities" data-bb-pv="priorities"><p class="bb-pv__label" data-bb-pv="priorities-title">'+esc(u.priorities_title)+'</p>'+
byPriority(d,d.sources.map(function(x){return x.id;})).slice(0,3).map(function(x){
var a=x.action_id?find(d.actions,x.action_id):null;
return'<p class="bb-pv__row" data-bb-pv="priority-row">'+swatch(x.priority)+'<span class="bb-pv__value" data-bb-pv="priority-name">'+esc(x.name)+'</span> '+
(a?'<span class="bb-pv__chip bb-pv__chip--'+esc(x.priority)+'" data-bb-pv="action">'+esc(u['action_chip_'+a.type]||u['action_type_'+a.type])+'</span>':'')+'</p>';
}).join('')+
'</div>';
}
function mountPreview(root,d,config){
var u=d.ui,s=find(d.sources,config.selected)||byPriority(d,d.sources.map(function(x){return x.id;}))[0];
var action=s.action_id?find(d.actions,s.action_id):null,alive=true;
var had=['bb','bb--preview'].filter(function(c){return root.classList.contains(c);});
root.classList.add('bb');root.classList.add('bb--preview');
root.setAttribute('role','img');
root.setAttribute('aria-label',(u.preview_label||u.pill_title||'').replace('{waterbody}',d.waterbody.name).replace('{source}',s.name).replace('{priority}',decap(u['priority_'+s.priority]))+
(action?' '+u.next_step+': '+action.action+'.':''));
root.setAttribute('data-bb-ready','preview');
root.innerHTML='<div class="bb-pv" aria-hidden="true">'+previewMarkup(d,config.id,s,LAND)+'</div>';
var way=pathwayOf(d,s),story=[s.id,way?way.to:''];
var dots=[].slice.call(root.querySelectorAll('[data-bb-dot]')).filter(function(dot){return story.indexOf(dot.getAttribute('data-bb-dot'))<0;});
var parts=[].slice.call(root.querySelectorAll('.bb-pv__card, .bb-pv__pill, .bb-pv__chip'));
var tidy=function(){
var f=root.getBoundingClientRect(),covers=parts.map(function(part){return part.getBoundingClientRect();});
dots.forEach(function(dot){
var r=dot.getBoundingClientRect();
var edge=r.left<f.left+3||r.right>f.right-3||r.top<f.top+3||r.bottom>f.bottom-3;
var half=covers.some(function(c){
return r.left<c.right&&r.right>c.left&&r.top<c.bottom&&r.bottom>c.top&&!(r.left>=c.left&&r.right<=c.right&&r.top>=c.top&&r.bottom<=c.bottom);
});
dot.style.visibility=edge||half?'hidden':'';
});
};
var watch=win.ResizeObserver?new win.ResizeObserver(tidy):null;
if(watch)[root].concat(parts).forEach(function(part){watch.observe(part);});
else win.addEventListener('resize',tidy);
tidy();
var unreveal=revealPreview(root,config.id);
return{
state:function(){return{selected:s.id};},
set:function(){},
reset:function(){},
destroy:function(){
if(!alive)return;
alive=false;
if(unreveal)unreveal();
if(watch)watch.disconnect();else win.removeEventListener('resize',tidy);
root.innerHTML='';
['role','aria-label','data-bb-ready'].forEach(function(a){root.removeAttribute(a);});
['bb','bb--preview'].forEach(function(c){if(had.indexOf(c)<0)root.classList.remove(c);});
}
};
}
function revealPreview(root,id){
var mm=win.matchMedia,perf=win.performance;
if(!mm||!mm('(prefers-reduced-motion: no-preference)').matches||!win.requestAnimationFrame||!perf||!perf.now)return null;
var paint=(perf.getEntriesByType?perf.getEntriesByType('paint'):[]).filter(function(e){return e.name==='first-contentful-paint';})[0];
var since=perf.now()-(paint?paint.startTime:0),box=root.getBoundingClientRect();
if(since>4000||box.bottom<=0||box.top>=win.innerHeight)return null;
var at=Math.max(0,Math.round(1100-since)),NS='http://www.w3.org/2000/svg';
var route=mm('(min-width: 48em)').matches?root.querySelector('[data-bb-pv="route"]'):null,mask=null,frame,timer;
if(route&&route.ownerSVGElement){
mask=doc.createElementNS(NS,'mask');
[['id',id+'-draw'],['maskUnits','userSpaceOnUse'],['x','0'],['y','0'],['width','1200'],['height','640']].forEach(function(a){mask.setAttribute(a[0],a[1]);});
var draw=doc.createElementNS(NS,'path');
draw.setAttribute('class','bb-pv__draw');
draw.setAttribute('d',route.getAttribute('d'));
draw.setAttribute('pathLength','1');
mask.appendChild(draw);
route.ownerSVGElement.appendChild(mask);
route.setAttribute('mask','url(#'+id+'-draw)');
}
root.style.setProperty('--bb-pv-at',at+'ms');
root.setAttribute('data-bb-reveal','wait');
var done=function(){
win.cancelAnimationFrame(frame);
win.clearTimeout(timer);
root.removeAttribute('data-bb-reveal');
root.style.removeProperty('--bb-pv-at');
if(route)route.removeAttribute('mask');
if(mask&&mask.parentNode)mask.parentNode.removeChild(mask);
};
frame=win.requestAnimationFrame(function(){
frame=win.requestAnimationFrame(function(){
root.setAttribute('data-bb-reveal','play');
timer=win.setTimeout(done,at+950);
});
});
return done;
}
function setting(root,name,fallback){
var v=root.getAttribute('data-'+name);
return v===null||v===''?fallback:v;
}
function rowCount(root,fallback){var n=parseInt(setting(root,'rows',''),10);return n>0?n:fallback;}
function fragmentMapMarkup(d,o){
var u=d.ui,shown=o.ids.map(function(id){return find(d.sources,id);});
var at=function(p){return'left:'+pct(p.x/12)+';top:'+pct(p.y/6.4);};
var xs=shown.map(function(p){return p.x;}),ys=shown.map(function(p){return p.y;});
var x0=Math.min.apply(null,xs)-70,x1=Math.max.apply(null,xs)+70,y0=Math.min.apply(null,ys)-60,y1=Math.max.apply(null,ys)+60;
return'<div class="bb-fr__stage" style="--bb-fr-x0:'+x0+';--bb-fr-y0:'+y0+';--bb-fr-w:'+(x1-x0)+';--bb-fr-h:'+(y1-y0)+'">'+
'<svg class="bb-fr__svg" viewBox="0 0 1200 640" aria-hidden="true" focusable="false">'+baseLayer(LAND,o.id)+'</svg>'+
shown.map(function(s){
return'<span class="bb-fr__marker'+(s.id===o.gap?' is-gap':'')+'" data-bb-fr-marker="'+esc(s.id)+'" style="'+at(s)+';--bb-c:'+colour(find(d.categories,s.category).colour)+'">'+
'<span class="bb-fr__dot"></span>'+(o.high&&s.priority==='high'?'<span class="bb-fr__high"></span>':'')+'</span>';
}).join('')+
(o.gap?'<span class="bb-fr__gap" data-bb-fr-gap="'+esc(o.gap)+'" style="'+at(find(d.sources,o.gap))+'">'+esc(u.knowledge_gap)+'</span>':'')+
'</div>'+
(o.chip?'<span class="bb-fr__chip" data-bb-fr-chip>'+esc(o.chip)+'</span>':'');
}
var FRAGMENTS={
priorities:function(root,d,config){
var ids=byPriority(d,d.sources.map(function(s){return s.id;})).slice(0,rowCount(root,5)).map(function(s){return s.id;});
var selected=config.selected||setting(root,'selected',null);
return{html:'<ul class="bb-list bb-fr__rows">'+priorityListMarkup(d,ids,{selected:selected,readOnly:true})+'</ul>',state:{selected:selected,rows:ids}};
},
'filtered-map':function(root,d,config){
var sub=find(d.substances,setting(root,'substance',''))||d.substances[0],ids=B.filterSources(d,{substance:sub.id});
var gap=setting(root,'gap',ids[0]);
if(ids.indexOf(gap)<0)gap=ids[0]||null;
return{html:fragmentMapMarkup(d,{id:config.id,ids:ids,high:true,gap:gap,chip:sub.name}),state:{substance:sub.id,gap:gap,sources:ids}};
},
actions:function(root,d,config){
var list=B.actionsFor(d).slice(0,rowCount(root,4));
var selected=config.selected||setting(root,'selected',null);
return{
html:'<ul class="bb-fr__actions">'+list.map(function(a){
return'<li class="bb-fr__arow'+(a.source===selected?' is-selected':'')+'" data-bb-fr-action="'+esc(a.id)+'"><span class="bb-fr__atext"><span class="bb-fr__action">'+esc(a.action)+'</span>'+
'<span class="bb-fr__source">'+esc(find(d.sources,a.source).name)+'</span></span>'+priorityBadge(d,a.priority,true)+'</li>';
}).join('')+'</ul>',
state:{actions:list.map(function(a){return a.id;}),selected:selected}
};
},
'categories-map':function(root,d,config){
var ids=d.sources.map(function(s){return s.id;});
return{html:fragmentMapMarkup(d,{id:config.id,ids:ids}),state:{sources:ids}};
},
'step-map':function(root,d,config){
var ids=d.sources.map(function(s){return s.id;});
return{html:fragmentMapMarkup(d,{id:config.id,ids:ids,high:true}),state:{sources:ids}};
},
selector:function(root,d){
return{
html:'<p class="bb-fr__select" data-bb-fr-select><span>'+esc(d.ui.selector_value)+'</span><svg viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M2 3.5 5 6.5 8 3.5"/></svg></p>'+
'<ul class="bb-fr__chips" data-bb-fr-chips>'+d.substances.map(function(s){return'<li>'+esc(s.name)+'</li>';}).join('')+'</ul>',
state:{waterbody:d.waterbody.name,substances:d.substances.map(function(s){return s.id;})}
};
}
};
Object.keys(FRAGMENTS).forEach(function(kind){
var draw=FRAGMENTS[kind];
FRAGMENTS[kind]=function(root,d,config){
var had=['bb','bb--fragment'].filter(function(c){return root.classList.contains(c);}),alive=true,out=draw(root,d,config);
root.classList.add('bb');root.classList.add('bb--fragment');
root.setAttribute('data-bb-ready',kind);
root.innerHTML='<div class="bb-fr bb-fr--'+kind+'">'+out.html+'</div>';
return{
state:function(){return JSON.parse(JSON.stringify(out.state));},
set:function(){},
reset:function(){},
destroy:function(){
if(!alive)return;
alive=false;
root.innerHTML='';
root.removeAttribute('data-bb-ready');
['bb','bb--fragment'].forEach(function(c){if(had.indexOf(c)<0)root.classList.remove(c);});
}
};
};
});
var MODES={full:mountFull,preview:mountPreview};
Object.assign(MODES,FRAGMENTS);
var loads={};
function mount(root,options){
var o=options||{},mode=o.mode||'full',load;
if(!root||!MODES[mode])return Promise.reject(new Error('Bronnenbeeld: no view "'+mode+'"'));
if(typeof o.data==='string'){
load=loads[o.data]||(loads[o.data]=win.fetch(o.data).then(function(r){if(!r.ok)throw new Error('Bronnenbeeld: data not found ('+r.status+')');return r.json();}));
load.catch(function(){if(loads[o.data]===load)delete loads[o.data];});
}else load=Promise.resolve(o.data);
return load.then(function(data){
if(!data||!data.sources||!data.ui)throw new Error('Bronnenbeeld: no data');
return MODES[mode](root,data,{id:'bb'+(++mounts),lang:o.lang||doc.documentElement.lang||'nl',readOnly:!!o.readOnly,selected:o.selected||null});
});
}
B.mount=mount;
}(typeof window!=='undefined'?window:null));
