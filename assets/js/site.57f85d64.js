(function(){
'use strict';
var EN=document.documentElement.lang==='en';
var header=document.querySelector('.site-header');
var toggle=document.querySelector('.menu-toggle');
if(header&&toggle){
var setOpen=function(open){
header.classList.toggle('is-open',open);
toggle.setAttribute('aria-expanded',String(open));
toggle.setAttribute('aria-label',open?(EN?'Close menu':'Menu sluiten'):(EN?'Open menu':'Menu openen'));
document.documentElement.style.overflow=open?'hidden':'';
document.querySelectorAll('main, footer').forEach(function(el){el.inert=open;});
};
toggle.addEventListener('click',function(){setOpen(!header.classList.contains('is-open'));});
document.addEventListener('keydown',function(e){
if(e.key==='Escape'&&header.classList.contains('is-open')){setOpen(false);toggle.focus();}
});
window.matchMedia('(min-width: 1200px)').addEventListener('change',function(e){if(e.matches)setOpen(false);});
}
document.querySelectorAll('.mock').forEach(function(mock){
var stage=mock.querySelector('.mock__stage');
var fit=function(){
var cw=+mock.dataset.compactWidth,compact=cw&&mock.clientWidth<cw;
var w=compact?cw:+mock.dataset.width;
var h=compact?+mock.dataset.compactHeight:+mock.dataset.height;
mock.classList.toggle('is-compact',!!compact);
if(mock.hasAttribute('data-fluid')&&!compact){
stage.style.width='100%';stage.style.height='100%';stage.style.transform='none';
mock.style.height='';mock.classList.remove('is-pannable');
return;
}
stage.style.width=w+'px';
stage.style.height=h?h+'px':'auto';
h=h||stage.offsetHeight;
var s=Math.min(+mock.dataset.maxScale||1,mock.clientWidth/w);
var min=+mock.dataset.minScale||0;
var pan=s<min;
if(pan)s=min;
mock.classList.toggle('is-pannable',pan);
stage.style.transform='scale('+s+')';
mock.style.height=(h*s)+'px';
mock.style.setProperty('--pan-width',(w*s)+'px');
};
var refit=new ResizeObserver(fit);
refit.observe(mock);
refit.observe(stage);
fit();
});
var MSG=EN?{naam:'Please enter your name.',email:'Please enter your email address.',emailBad:'Please enter a complete email address, such as name@organisation.eu.'}
:{naam:'Vul uw naam in.',email:'Vul uw e-mailadres in.',emailBad:'Vul een volledig e-mailadres in, zoals naam@organisatie.nl.'};
var OPENING=EN?'Opening your email app. Nothing happening? Email us at info@aquaware.nl.'
:'Uw e-mailprogramma wordt geopend. Gebeurt er niets? Mail dan naar info@aquaware.nl.';
var EMAIL=/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}$/;
var setError=function(input,text){
var out=document.getElementById(input.id+'-error'),box=input.closest('.form-field')||input.closest('.field');
input.setAttribute('aria-invalid',text?'true':'false');
if(box)box.classList.toggle('is-invalid',!!text);
if(out){out.textContent=text||'';out.hidden=!text;}
};
var check=function(input){
var v=input.value.trim();
if(input.required&&!v)return MSG[input.name];
if(input.type==='email'&&v&&!EMAIL.test(v))return MSG.emailBad;
return'';
};
var watch=function(input){
input.addEventListener('input',function(){if(input.getAttribute('aria-invalid')==='true')setError(input,check(input));});
input.addEventListener('blur',function(){if(input.value.trim())setError(input,check(input));});
};
document.querySelectorAll('[data-newsletter]').forEach(function(form){
var email=form.querySelector('input[type=email]');
watch(email);
form.addEventListener('submit',function(e){
e.preventDefault();
var text=check(email);
setError(email,text);
if(text){email.focus();return;}
var status=form.querySelector('[data-newsletter-status]');
if(status)status.textContent=OPENING;
location.href='mailto:info@aquaware.nl?subject='+encodeURIComponent(form.dataset.subject||(EN?'Newsletter sign-up':'Aanmelding nieuwsbrief'))+
'&body='+encodeURIComponent(email.value.trim());
});
});
document.querySelectorAll('a[href="#newsletter-email"]').forEach(function(a){
a.addEventListener('click',function(e){
var field=document.getElementById('newsletter-email');
if(!field)return;
e.preventDefault();
field.scrollIntoView({block:'center',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
field.focus({preventScroll:true});
});
});
document.querySelectorAll('[data-share-linkedin]').forEach(function(a){
a.href='https://www.linkedin.com/sharing/share-offsite/?url='+encodeURIComponent(location.href.split('#')[0]);
});
document.querySelectorAll('[data-copy-link]').forEach(function(button){
var status=document.querySelector(button.getAttribute('data-copy-link'));
var say=function(text){
if(!status)return;
status.textContent=text;
clearTimeout(button._t);
button._t=setTimeout(function(){status.textContent='';},3000);
};
button.addEventListener('click',function(){
var url=location.href.split('#')[0];
var done=function(){say(EN?'Link copied':'Link gekopieerd');};
var fail=function(){say(url);};
if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(url).then(done,fail);
else fail();
});
});
document.querySelectorAll('[data-contact]').forEach(function(form){
var pilot={agro:'Agro',pfas:'PFAS'}[(new URLSearchParams(location.search).get('onderwerp')||'').toLowerCase()];
if(pilot)form.querySelectorAll('input[name=onderwerp]').forEach(function(r){r.checked=/pilot/i.test(r.value)&&r.value.indexOf(pilot)>-1;});
var required=[].slice.call(form.querySelectorAll('input[required]'));
required.forEach(watch);
var label=function(name){
var el=form.elements[name];
if(!el)return name;
var field=(el.length&&el[0])?el[0].closest('fieldset').querySelector('legend'):form.querySelector('label[for="'+el.id+'"]');
return field?field.firstChild.textContent.trim():name;
};
var value=function(name){var el=form.elements[name];return el?el.value.trim():'';};
form.addEventListener('submit',function(e){
e.preventDefault();
var first=null;
required.forEach(function(input){
var text=check(input);
setError(input,text);
if(text&&!first)first=input;
});
if(first){first.focus();return;}
var topic=value('onderwerp');
var lines=['naam','organisatie','email','onderwerp'].filter(function(n){return form.elements[n];})
.map(function(n){return label(n)+': '+value(n);});
var body=lines.join('\n')+'\n\n'+value('vraag');
var status=form.querySelector('[data-contact-status]');
if(status)status.textContent=OPENING;
location.href='mailto:info@aquaware.nl?subject='+encodeURIComponent((form.dataset.subject||'Kennismaking')+(topic?' · '+topic:''))+
'&body='+encodeURIComponent(body);
});
});
document.querySelectorAll('.nav__item').forEach(function(item){
var btn=item.querySelector('.nav__toggle');
var close=function(){item.classList.remove('is-open');if(btn)btn.setAttribute('aria-expanded','false');};
if(btn)btn.addEventListener('click',function(){
var open=!item.classList.contains('is-open');
item.classList.remove('is-dismissed');
item.classList.toggle('is-open',open);
btn.setAttribute('aria-expanded',String(open));
});
item.addEventListener('keydown',function(e){
if(e.key!=='Escape')return;
close();item.classList.add('is-dismissed');
(btn||item.querySelector('.nav__link')).focus();
});
item.addEventListener('focusout',function(e){if(!item.contains(e.relatedTarget)){close();item.classList.remove('is-dismissed');}});
item.addEventListener('mouseleave',function(){item.classList.remove('is-dismissed');});
});
var map=document.querySelector('[data-hero-map]');
if(map){
var COLORS={H:'#f16b6b',M:'#f3b545',L:'#5cc27a'},LEVELS=EN?{H:'High',M:'Medium',L:'Low'}:{H:'Hoog',M:'Midden',L:'Laag'};
var dots=[
{p:[19,38],c:[12,22],l:'H',name:'Van Dalen Metaal',sbi:'25 · Producten van metaal',rwzi:'Noorderhaven',lozing:'Indirect',krw:21,step:'Beoordelen'},
{p:[34,50],c:[26,30],l:'H',name:'Coating Zuidkade',sbi:'22 · Rubber en kunststof',rwzi:'Lindevallei',lozing:'Indirect',krw:17,step:'Beoordelen'},
{p:[40,41],c:[8,38],l:'H',name:'Galvano Rivierpark',sbi:'25 · Oppervlaktebehandeling',rwzi:'Lindevallei',lozing:'Indirect',krw:19,step:'Shortlist'},
{p:[53.5,46],c:[24,46],l:'H',name:'Scheepsrep. Oosthaven',sbi:'30 · Overige transportmiddelen',rwzi:'Lindevallei',lozing:'Indirect',krw:18,step:'Bemonstering'},
{p:[32.5,62],c:[10,54],l:'H',name:'Kunststofverwerking Delta',sbi:'22 · Rubber en kunststof',rwzi:'Oosterweide',lozing:'Indirect',krw:14,step:'Beoordelen'},
{p:[44,80],c:[84,64],l:'H',name:'Lakspuiterij Meander',sbi:'20 · Chemische producten',rwzi:'Zuidbroek',lozing:'Indirect',krw:12,step:'Beoordelen'},
{p:[52.5,76],c:[90,78],l:'H',name:'Tankcleaning Havenmond',sbi:'52 · Opslag en dienstverlening',rwzi:'Oosterweide',lozing:'Direct',krw:16,step:'Bedrijfsbezoek'},
{p:[9,30],c:[32,17],l:'M',name:'Tandtechniek Noordwal',sbi:'32 · Overige goederen',rwzi:'Noorderhaven',lozing:'Indirect',krw:6,step:'Uitgevraagd'},
{p:[33,79],c:[80,86],l:'M',name:'Autoschade De Brug',sbi:'45 · Reparatie van auto’s',rwzi:'Oosterweide',lozing:'Indirect',krw:5,step:'Shortlist'},
{p:[46,57],c:[28,60],l:'M',name:'Textielveredeling Waalzicht',sbi:'13 · Textiel',rwzi:'Lindevallei',lozing:'Direct',krw:8,step:'Beoordelen'},
{p:[6,40],c:[6,61],l:'L',name:'Wasserij Hofland',sbi:'96 · Wassen en stomen',rwzi:'Noorderhaven',lozing:'Indirect',krw:2,step:'Niet nodig'},
{p:[37.5,68],c:[88,95],l:'L',name:'Drukkerij Kanaalzicht',sbi:'18 · Drukkerijen',rwzi:'Oosterweide',lozing:'Indirect',krw:1,step:'Niet nodig'}
];
var PLANTS={Lindevallei:{p:[46.5,33],c:[36,60]},Zuidbroek:{p:[35,93],c:[5,96]},
Noorderhaven:{p:[20,20],c:[14,13]},Oosterweide:{p:[50,93],c:[62,96]}};
var SETS=[
[['Nikkel','48 µg/l',80],['Lood','31 µg/l',70],['Naftaleen','2,1 µg/l',45]],
[['Zink','160 µg/l',85],['PFOS','9 ng/l',75],['Tolueen','4,2 µg/l',40]],
[['Nikkel','92 µg/l',95],['Chroom','18 µg/l',66],['Koper','24 µg/l',52]],
[['Koper','38 µg/l',64],['Zink','95 µg/l',58],['PFOS','12 ng/l',90]],
[['Bisfenol A','1,4 µg/l',72],['Zink','61 µg/l',44],['Lood','6 µg/l',30]],
[['Xyleen','3,8 µg/l',68],['Benzeen','1,8 µg/l',48],['PFOA','5 ng/l',52]],
[['Naftaleen','7,5 µg/l',88],['Benzeen','3,1 µg/l',70],['Minerale olie','420 µg/l',60]],
[['Zilver','2,2 µg/l',42],['Koper','9 µg/l',26],['Nikkel','5 µg/l',18]],
[['Zink','48 µg/l',40],['Koper','15 µg/l',36],['Xyleen','0,9 µg/l',22]],
[['PFOA','14 ng/l',78],['Nonylfenol','0,8 µg/l',54],['Koper','11 µg/l',30]],
[['Zink','12 µg/l',14],['Koper','4 µg/l',10],['Lood','1 µg/l',6]],
[['Tolueen','0,6 µg/l',12],['Koper','3 µg/l',8],['Zink','9 µg/l',10]]
];
if(EN){
var SBI={
'25 · Producten van metaal':'25 · Fabricated metal products','22 · Rubber en kunststof':'22 · Rubber and plastics',
'25 · Oppervlaktebehandeling':'25 · Surface treatment','30 · Overige transportmiddelen':'30 · Other transport equipment',
'20 · Chemische producten':'20 · Chemical products','52 · Opslag en dienstverlening':'52 · Storage and logistics',
'32 · Overige goederen':'32 · Other manufacturing','45 · Reparatie van auto’s':'45 · Motor vehicle repair',
'13 · Textiel':'13 · Textiles','96 · Wassen en stomen':'96 · Laundry and dry cleaning','18 · Drukkerijen':'18 · Printing'
};
var STEP={'Beoordelen':'To assess','Shortlist':'Shortlist','Bemonstering':'Sampling','Bedrijfsbezoek':'Site visit',
'Uitgevraagd':'Info requested','Niet nodig':'Not needed'};
var SUBST={'Nikkel':'Nickel','Lood':'Lead','Naftaleen':'Naphthalene','Zink':'Zinc','Tolueen':'Toluene',
'Chroom':'Chromium','Koper':'Copper','Bisfenol A':'Bisphenol A','Xyleen':'Xylene','Benzeen':'Benzene',
'Minerale olie':'Mineral oil','Zilver':'Silver','Nonylfenol':'Nonylphenol'};
dots.forEach(function(d){d.sbi=SBI[d.sbi]||d.sbi;d.step=STEP[d.step]||d.step;});
SETS.forEach(function(set){
set.forEach(function(row){row[0]=SUBST[row[0]]||row[0];row[1]=row[1].replace(',','.');});
});
}
var canvas=map.querySelector('.hero-map__canvas'),mock=map.closest('.mock');
var base=map.querySelector('[data-base]'),river=map.querySelector('[data-river]');
var link=map.querySelector('[data-link]'),layer=map.querySelector('[data-dots]'),ring=map.querySelector('[data-ring]');
var $=function(sel){return map.querySelector(sel);};
var compact=function(){return!!mock&&mock.classList.contains('is-compact');};
var pos=function(o){return compact()?o.c:o.p;};
Object.keys(PLANTS).forEach(function(k){
var el=map.querySelector('[data-plant="'+k+'"]');
if(!el){
el=document.createElement('div');
el.className='map-tag is-quiet';
el.dataset.plant=k;el.dataset.quiet='';
el.innerHTML='<span>'+(EN?'WWTP ':'RWZI ')+k+'</span>';
canvas.insertBefore(el,layer);
}
PLANTS[k].el=el;
});
var seed=11,rnd=function(){seed=seed*16807%2147483647;return(seed-1)/2147483646;};
var ZONES=[[25,43,37,67],[46,64,26,47],[15,24,33,53],[79,92,42,59],[0,100,0,100]],field='';
for(var n=0;n<180;n++){
var z=ZONES[n<120?n%4:4];
field+='<circle cx="'+(z[0]+rnd()*(z[1]-z[0])).toFixed(1)+'%" cy="'+(z[2]+rnd()*(z[3]-z[2])).toFixed(1)+'%" r="1.6"/>';
}
$('[data-field]').innerHTML=field;
var els=dots.map(function(d,i){
var el=document.createElement('span');
el.className='map-dot';
el.style.background=COLORS[d.l];
el.addEventListener('mouseenter',function(){select(i);});
el.addEventListener('click',function(){select(i);});
layer.appendChild(el);
return el;
});
var riverPoint=function(q){
var r=canvas.getBoundingClientRect(),m=river.getScreenCTM(),len=river.getTotalLength(),best,bd=Infinity;
for(var s=0;s<=len;s+=len/240){
var p=river.getPointAtLength(s),t=new DOMPoint(p.x,p.y).matrixTransform(m);
var x=(t.x-r.left)/r.width*100,y=(t.y-r.top)/r.height*100;
var dd=Math.pow((x-q[0])*r.width,2)+Math.pow((y-q[1])*r.height,2);
if(dd<bd){bd=dd;best=[x,y];}
}
return best;
};
var current=3;
var select=function(i){
current=i;
var d=dots[i],q=pos(d),direct=d.lozing==='Direct';
els.forEach(function(el,k){el.classList.toggle('is-active',k===i);});
ring.style.left=q[0]+'%';
ring.style.top=q[1]+'%';
ring.style.borderColor=COLORS[d.l];
Object.keys(PLANTS).forEach(function(k){
var el=PLANTS[k].el,target=!direct&&k===d.rwzi;
el.classList.toggle('is-target',target);
if(el.hasAttribute('data-quiet'))el.classList.toggle('is-quiet',!target);
});
var t=direct?riverPoint(q):pos(PLANTS[d.rwzi]);
var w=canvas.clientWidth/100,h=canvas.clientHeight/100;
var x1=q[0]*w,y1=q[1]*h,x2=t[0]*w,y2=t[1]*h;
var mx=(x1+x2)/2,my=(y1+y2)/2-Math.min(40,Math.abs(x2-x1)*.18);
link.setAttribute('d','M'+x1.toFixed(1)+' '+y1.toFixed(1)+'Q'+mx.toFixed(1)+' '+my.toFixed(1)+' '+x2.toFixed(1)+' '+y2.toFixed(1));
$('[data-level]').textContent='● '+LEVELS[d.l];
$('[data-level]').style.color=COLORS[d.l];
$('[data-name]').textContent=d.name;
$('[data-sbi]').textContent=d.sbi;
$('[data-rwzi]').textContent=d.rwzi;
$('[data-lozing]').textContent=d.lozing;
$('[data-krw]').textContent=d.krw;
$('[data-step]').textContent=d.step;
$('[data-stoffen]').innerHTML=SETS[i].map(function(s){
var c=s[2]>=80?COLORS.H:s[2]>=50?COLORS.M:COLORS.L;
return'<div class="stof"><span class="stof__n">'+s[0]+'</span><span class="stof__v">'+s[1]+
'</span><span class="stof__bar"><span style="width:'+s[2]+'%;background:'+c+'"></span></span></div>';
}).join('');
};
var place=function(){
base.setAttribute('preserveAspectRatio',compact()?'xMidYMid slice':'none');
dots.forEach(function(d,i){var q=pos(d);els[i].style.left=q[0]+'%';els[i].style.top=q[1]+'%';});
Object.keys(PLANTS).forEach(function(k){var q=pos(PLANTS[k]);PLANTS[k].el.style.left=q[0]+'%';PLANTS[k].el.style.top=q[1]+'%';});
select(current);
};
new ResizeObserver(place).observe(canvas);
place();
var link=map.querySelector('[data-link]'),crawl=null,offset=0;
var flowing=function(on){
clearInterval(crawl);crawl=null;
if(on&&link&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
crawl=setInterval(function(){offset=(offset-1.2)%14;link.style.strokeDashoffset=offset.toFixed(1);},90);
}
};
if('IntersectionObserver'in window){
new IntersectionObserver(function(es){map.classList.toggle('is-away',!es[0].isIntersecting);flowing(es[0].isIntersecting);}).observe(map);
}else flowing(true);
}
var onView=function(el,share,fn){
var go=function(es){if(es[0].isIntersecting)fn();};
new IntersectionObserver(go,{threshold:share}).observe(el);
new IntersectionObserver(go,{rootMargin:'0px 0px -20% 0px'}).observe(el);
};
var below=function(el,share,cb){
var io=new IntersectionObserver(function(es){
io.disconnect();
var e=es[0];
cb(e.boundingClientRect.top>(e.rootBounds?e.rootBounds.height:window.innerHeight)*share);
});
whenLoaded(function(){io.observe(el);});
};
var afterPaint=function(fn){requestAnimationFrame(function(){setTimeout(fn,0);});};
var whenLoaded=function(fn){
var go=function(){afterPaint(fn);};
if(document.readyState==='complete')go();else window.addEventListener('load',go,{once:true});
};
var onLeave=function(el,fn){
var first=true;
new IntersectionObserver(function(es){if(first){first=false;return;}if(!es[0].isIntersecting)fn();}).observe(el);
};
document.querySelectorAll('[data-startup]').forEach(function(shot){
var root=shot.querySelector('.mock__stage > div');
if(!root||!('IntersectionObserver'in window)||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
whenLoaded(function(){
root.classList.add('boot');
var all=function(sel){return[].slice.call(root.querySelectorAll(sel));};
var styled=function(el,bit){return(el.getAttribute('style')||'').indexOf(bit)>-1;};
var cards=all('div').filter(function(d){return styled(d,'border-radius:12px')&&styled(d,'background:#fff');});
cards.sort(function(a,b){
var ra=a.getBoundingClientRect(),rb=b.getBoundingClientRect();
return(Math.round(ra.top/40)-Math.round(rb.top/40))||(ra.left-rb.left);
});
cards.forEach(function(c,i){c.classList.add('boot-card');c.style.setProperty('--i',i);});
all('div').filter(function(d){return styled(d,'linear-gradient(90deg,#1a3fd6');}).forEach(function(b,i){b.classList.add('boot-bar');b.style.setProperty('--i',i);});
all('svg').forEach(function(svg){if(svg.querySelector('[stroke-dasharray]'))svg.classList.add('boot-donut');});
all('circle').forEach(function(c){if(!c.closest('.boot-donut')){c.classList.add('boot-dot');c.style.setProperty('--r',Math.random().toFixed(2));}});
var names=['Van Dalen Metaal','Coating Zuidkade','Galvano Rivierpark','Kunststof Delta','Tandtechniek Noordwal','Autoschade De Brug','Lakspuiterij Meander'],rows=[];
all('*').forEach(function(el){
if(el.children.length||names.indexOf(el.textContent.trim())<0)return;
var row=el;while(row.parentElement&&row.parentElement.children.length<6)row=row.parentElement;
if(rows.indexOf(row)<0)rows.push(row);
});
rows.forEach(function(r,i){r.classList.add('boot-row');r.style.setProperty('--i',i);});
var nums=all('*').filter(function(el){return!el.children.length&&/^\d+$/.test(el.textContent.trim())&&parseFloat(getComputedStyle(el).fontSize)>=18;})
.map(function(el){el.classList.add('boot-num');return[el,+el.textContent.trim()];});
var timers=[];
var set=function(k){nums.forEach(function(x){x[0].textContent=String(Math.round(x[1]*k));});};
var hide=function(){timers.forEach(clearTimeout);timers=[];root.classList.remove('is-in');root.classList.add('is-ready');set(0);};
var play=function(){
hide();root.offsetWidth;
requestAnimationFrame(function(){requestAnimationFrame(function(){root.classList.add('is-in');});});
timers.push(setTimeout(function(){
var t0=performance.now();
(function step(now){
var k=Math.min(1,(now-t0)/1200);
set(1-Math.pow(1-k,3));
if(k<1&&root.classList.contains('is-in'))requestAnimationFrame(step);
})(t0);
},750));
timers.push(setTimeout(function(){root.classList.remove('is-ready','is-in');set(1);},3400));
};
var away=false;
below(shot,.8,function(b){if(b){away=true;hide();}});
onView(shot,.35,function(){if(away){away=false;play();}});
onLeave(shot,function(){if(!away){away=true;hide();}});
});
});
document.querySelectorAll('.proof__inner').forEach(function(box){
var parts=box.querySelectorAll('[data-area]');
var light=function(areas){
areas=areas?[].concat(areas):[];
parts.forEach(function(el){
var mine=el.dataset.area.split(' ');
el.classList.toggle('is-active',areas.some(function(a){return mine.indexOf(a)>-1;}));
});
};
var proof=box.closest('.proof'),timers=[];
var stopTour=function(){timers.forEach(clearTimeout);timers=[];if(proof)proof.classList.remove('is-touring');};
parts.forEach(function(el){
var a=el.dataset.area.split(' ')[0];
el.addEventListener('mouseenter',function(){stopTour();light(a);});
el.addEventListener('mouseleave',function(){light(null);});
el.addEventListener('focusin',function(){stopTour();light(a);});
el.addEventListener('focusout',function(){light(null);});
});
var map=box.querySelector('.nl-map'),list=box.querySelector('.proof__partners');
if(!proof||!map||!list||!('IntersectionObserver'in window)||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
var pins=[].slice.call(map.querySelectorAll('.nl-pin'));
pins.forEach(function(p,i){p.style.setProperty('--i',i);});
[].forEach.call(list.children,function(li,i){li.style.setProperty('--i',i);});
var steps=pins.map(function(p){return p.dataset.area.split(' ');});
var tour=function(){
stopTour();proof.classList.add('is-touring');
steps.forEach(function(s,i){timers.push(setTimeout(function(){light(s);},i*1100));});
timers.push(setTimeout(function(){light(null);proof.classList.remove('is-touring');},steps.length*1100+300));
};
var reveal=function(el,ms,then){
var away=false,done;
var hide=function(){clearTimeout(done);el.classList.remove('is-in');el.classList.add('is-ready');if(el===map){stopTour();light(null);}};
var play=function(){
hide();el.offsetWidth;
requestAnimationFrame(function(){requestAnimationFrame(function(){el.classList.add('is-in');});});
done=setTimeout(function(){el.classList.remove('is-ready','is-in');if(then)then();},ms);
};
below(el,.9,function(b){if(b){away=true;hide();}});
onView(el,.4,function(){if(away){away=false;play();}});
onLeave(el,function(){if(!away){away=true;hide();}});
};
reveal(list,1400);
reveal(map,2400,tour);
});
document.querySelectorAll('.wd-services').forEach(function(grid){
if(!('IntersectionObserver'in window)||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
below(grid,1,function(b){
if(!b)return;
Array.prototype.forEach.call(grid.children,function(card,i){card.style.setProperty('--i',i);});
grid.classList.add('is-ready');
var played=false;
onView(grid,.25,function(){
if(played)return;
played=true;
requestAnimationFrame(function(){requestAnimationFrame(function(){grid.classList.add('is-in');});});
});
});
});
document.querySelectorAll('[data-flow-in]').forEach(function(box){
var flow=box.querySelector('.flow');
if(!flow||!('IntersectionObserver'in window)||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
box.classList.add('flow-in');
var each=function(sel,name){[].forEach.call(box.querySelectorAll(sel),function(el,i){el.style.setProperty(name,i);});};
each('.flow__partners li','--i');each('.flow__checks li','--i');
each('.flow__card--hub > *','--j');each('.flow__card:last-child > *','--j');each('.flow__terms > div','--k');
[].forEach.call(box.querySelectorAll('.flow__checks path'),function(p){p.setAttribute('pathLength','1');});
[].forEach.call(box.querySelectorAll('.flow__arrow'),function(a,i){a.style.setProperty('--at',(i?1.45:.55)+'s');});
var done;
var hide=function(){clearTimeout(done);box.classList.remove('is-in');box.classList.add('is-ready');};
var play=function(){
hide();box.offsetWidth;
requestAnimationFrame(function(){requestAnimationFrame(function(){box.classList.add('is-in');});});
done=setTimeout(function(){box.classList.remove('is-ready','is-in');},4300);
};
var away=false;
below(flow,.8,function(b){if(b){away=true;hide();}});
onView(flow,.35,function(){if(away){away=false;play();}});
onLeave(flow,function(){if(!away){away=true;hide();}});
});
document.querySelectorAll('[data-case-in]').forEach(function(cas){
if(!('IntersectionObserver'in window)||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
[].forEach.call(cas.querySelectorAll('.case__body > *'),function(el,j){el.style.setProperty('--j',j);});
[].forEach.call(cas.querySelectorAll('.tags li'),function(el,i){el.style.setProperty('--i',i);});
var done;
var hide=function(){clearTimeout(done);cas.classList.remove('is-in');cas.classList.add('is-ready');};
var play=function(){
hide();cas.offsetWidth;
requestAnimationFrame(function(){requestAnimationFrame(function(){cas.classList.add('is-in');});});
done=setTimeout(function(){cas.classList.remove('is-ready','is-in');},3200);
};
var away=false;
below(cas,.8,function(b){if(b){away=true;hide();}});
onView(cas,.35,function(){if(away){away=false;play();}});
onLeave(cas,function(){if(!away){away=true;hide();}});
});
document.querySelectorAll('.closing').forEach(function(sec){
if(!('IntersectionObserver'in window)||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
[].forEach.call(sec.querySelectorAll(':scope > .container > *'),function(el,j){el.style.setProperty('--j',j);});
var done;
var hide=function(){clearTimeout(done);sec.classList.remove('is-in');sec.classList.add('is-ready');};
var play=function(){
hide();sec.offsetWidth;
requestAnimationFrame(function(){requestAnimationFrame(function(){sec.classList.add('is-in');});});
done=setTimeout(function(){sec.classList.remove('is-ready','is-in');},2000);
};
var away=false;
below(sec,.8,function(b){if(b){away=true;hide();}});
onView(sec,.4,function(){if(away){away=false;play();}});
onLeave(sec,function(){if(!away){away=true;hide();}});
});
document.querySelectorAll('.stage__modules').forEach(function(list){
if(!('IntersectionObserver'in window)||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
[].forEach.call(list.querySelectorAll('.stage__module'),function(m,i){m.style.setProperty('--i',i);});
var done;
var hide=function(){clearTimeout(done);list.classList.remove('is-in');list.classList.add('is-ready');};
var play=function(){
hide();list.offsetWidth;
requestAnimationFrame(function(){requestAnimationFrame(function(){list.classList.add('is-in');});});
done=setTimeout(function(){list.classList.remove('is-ready','is-in');},2000);
};
var away=false;
below(list,.85,function(b){if(b){away=true;hide();}});
onView(list,.3,function(){if(away){away=false;play();}});
onLeave(list,function(){if(!away){away=true;hide();}});
});
document.querySelectorAll('.wt-deliver').forEach(function(box){
if(!('IntersectionObserver'in window)||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
[].forEach.call(box.querySelectorAll('.wt-checks li'),function(li,i){li.style.setProperty('--i',i);});
var done;
var hide=function(){clearTimeout(done);box.classList.remove('is-in');box.classList.add('is-ready');};
var play=function(){
hide();box.offsetWidth;
requestAnimationFrame(function(){requestAnimationFrame(function(){box.classList.add('is-in');});});
done=setTimeout(function(){box.classList.remove('is-ready','is-in');},2600);
};
var away=false;
below(box,.8,function(b){if(b){away=true;hide();}});
onView(box,.35,function(){if(away){away=false;play();}});
onLeave(box,function(){if(!away){away=true;hide();}});
});
var onArrival=function(box,items,delays,plainAfter){
if(!('IntersectionObserver'in window)||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
var done;
var hide=function(){clearTimeout(done);box.classList.add('is-ready');items.forEach(function(el){el.classList.remove('is-in');});};
var play=function(batch){
batch.sort(function(a,b){return items.indexOf(a)-items.indexOf(b);});
delays(batch);
box.offsetWidth;
requestAnimationFrame(function(){requestAnimationFrame(function(){batch.forEach(function(el){el.classList.add('is-in');});});});
clearTimeout(done);
done=setTimeout(function(){
if(items.every(function(el){return el.classList.contains('is-in');})){box.classList.remove('is-ready');items.forEach(function(el){el.classList.remove('is-in');});}
},plainAfter);
};
var arrive=function(es){
var batch=es.filter(function(e){return e.isIntersecting&&box.classList.contains('is-ready')&&!e.target.classList.contains('is-in');})
.map(function(e){return e.target;});
if(batch.length)play(batch);
};
var io=new IntersectionObserver(arrive,{threshold:.3}),io80=new IntersectionObserver(arrive,{rootMargin:'0px 0px -20% 0px'});
items.forEach(function(el){io.observe(el);io80.observe(el);});
below(box,1,function(b){if(b)hide();});
onLeave(box,hide);
};
document.querySelectorAll('.wd-examples').forEach(function(box){
var photo=box.querySelector('.wd-examples__photo');
var rank=function(vals){
var u=vals.filter(function(v,i){return vals.indexOf(v)===i;}).sort(function(a,b){return a-b;});
return function(v){return u.indexOf(v);};
};
onArrival(box,[photo].concat([].slice.call(box.querySelectorAll('.wd-examples__list li'))).filter(Boolean),function(batch){
var cards=batch.filter(function(el){return el!==photo;}),lead=cards.length<batch.length?.45:0;
var col=rank(cards.map(function(el){return el.offsetLeft;})),row=rank(cards.map(function(el){return el.offsetTop;}));
if(photo)photo.style.setProperty('--d','0s');
cards.forEach(function(el){el.style.setProperty('--d',lead+(col(el.offsetLeft)+row(el.offsetTop))*.1+'s');});
},2600);
});
document.querySelectorAll('.wd-products').forEach(function(grid){
onArrival(grid,[].slice.call(grid.children),function(batch){
batch.forEach(function(card,k){card.style.setProperty('--d',k*.14+'s');});
},3400);
});
document.querySelectorAll('.wt-steps').forEach(function(list){
onArrival(list,[].slice.call(list.children),function(batch){
batch.forEach(function(step,k){step.style.setProperty('--d',.1+k*.26+'s');});
},2600);
});
document.querySelectorAll('.wvc-stages').forEach(function(list){
onArrival(list,[].slice.call(list.children),function(batch){
batch.forEach(function(el,k){el.style.setProperty('--d',k*.2+'s');});
},3000);
});
document.querySelectorAll('.kn-articles').forEach(function(grid){
onArrival(grid,[].slice.call(grid.children),function(batch){
batch.forEach(function(article,k){article.style.setProperty('--d',k*.11+'s');});
},2400);
});
document.querySelectorAll('.kn-news').forEach(function(box){
[].slice.call(box.firstElementChild.children).concat([].slice.call(box.querySelectorAll(':scope > .btn'))).forEach(function(el,j){el.style.setProperty('--j',j);});
onArrival(box.parentNode,[box],function(){},2000);
});
document.querySelectorAll('.pr-case').forEach(function(box){
[].forEach.call(box.querySelectorAll('.facts > div, .pr-case__note'),function(el,j){el.style.setProperty('--j',j);});
onArrival(box,[box.querySelector('.pr-case__facts'),box.querySelector('.pr-case__photo')].filter(Boolean),function(batch){
batch.forEach(function(el){el.style.setProperty('--d','0s');});
},3000);
});
document.querySelectorAll('.pr-news').forEach(function(box){
var photo=box.querySelector('.pr-news__photo');
[].forEach.call(box.querySelectorAll('.tags li'),function(li,i){li.style.setProperty('--i',i);});
onArrival(box,[].slice.call(box.children),function(batch){
var first=batch[0]===photo;
batch.forEach(function(el,k){el.style.setProperty('--d',(el===photo?0:(first?.35+(k-1)*.2:k*.2))+'s');});
},3400);
});
document.querySelectorAll('.text-cards__cards').forEach(function(panel){
onArrival(panel,[].slice.call(panel.children),function(batch){
batch.forEach(function(card,k){card.style.setProperty('--d',k*.12+'s');});
},2200);
});
document.querySelectorAll('.sc-pillars').forEach(function(panel){
onArrival(panel,[].slice.call(panel.children),function(batch){
batch.forEach(function(pillar,k){
var d=k*.3,last=d;
pillar.style.setProperty('--d',d+'s');
[].forEach.call(pillar.querySelectorAll('.checklist li'),function(li,r){last=d+.4+r*.14;li.style.setProperty('--t',last+'s');});
pillar.style.setProperty('--b',last+.3+'s');
});
},3600);
});
document.querySelectorAll('.sc-trace').forEach(function(box){
var file=box.querySelector('.dossier'),list=box.querySelector('.sc-trace__list');
if(!file||!list)return;
[].forEach.call(file.querySelectorAll('.dossier__item'),function(li,i){li.style.setProperty('--t',.35+i*.12+'s');});
[].forEach.call(list.children,function(li,i){li.style.setProperty('--t',i*.1+'s');});
onArrival(box,[list,file],function(){},2600);
});
document.querySelectorAll('.sc-note').forEach(function(note){
[].forEach.call(note.querySelectorAll('.sc-note__body > *'),function(el,j){el.style.setProperty('--j',j);});
onArrival(note.parentNode,[note],function(){},2000);
});
document.querySelectorAll('.ov-what').forEach(function(box){
var text=box.querySelector('.ov-what__text'),photo=box.querySelector('.ov-what__photo');
if(!text||!photo)return;
[].forEach.call(text.children,function(el,j){el.style.setProperty('--j',j);});
onArrival(box,[text,photo],function(){},2800);
});
document.querySelectorAll('.ov-values').forEach(function(grid){
onArrival(grid,[].slice.call(grid.children),function(batch){
batch.forEach(function(card,k){card.style.setProperty('--d',k*.11+'s');});
},2200);
});
document.querySelectorAll('.ov-meet').forEach(function(box){
var panels=[].slice.call(box.children);
panels.forEach(function(p){[].forEach.call(p.children,function(el,j){el.style.setProperty('--j',j);});});
onArrival(box,panels,function(batch){
batch.forEach(function(p,k){p.style.setProperty('--d',k*.15+'s');});
},2400);
});
document.querySelectorAll('.contact-more__grid').forEach(function(box){
var rows=box.querySelector('.contact-rows'),links=[].slice.call(box.querySelectorAll('.contact-link'));
if(!rows)return;
[].forEach.call(rows.children,function(row,i){row.style.setProperty('--r',i);});
onArrival(box,[rows].concat(links),function(batch){
var first=batch[0]===rows;
batch.forEach(function(el,k){el.style.setProperty('--d',(el===rows?0:(first?.45+(k-1)*.15:k*.15))+'s');});
},2800);
});
document.querySelectorAll('.wt-phases').forEach(function(tl){
if(!('IntersectionObserver'in window)||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
[].forEach.call(tl.children,function(step,i){step.style.setProperty('--i',i);});
var done;
var hide=function(){clearTimeout(done);tl.classList.remove('is-in');tl.classList.add('is-ready');};
var play=function(){
hide();tl.offsetWidth;
requestAnimationFrame(function(){requestAnimationFrame(function(){tl.classList.add('is-in');});});
done=setTimeout(function(){tl.classList.remove('is-ready','is-in');},3400);
};
var away=false;
below(tl,.8,function(b){if(b){away=true;hide();}});
onView(tl,.4,function(){if(away){away=false;play();}});
new IntersectionObserver(function(es){tl.classList.toggle('is-flowing',es[0].isIntersecting);}).observe(tl);
onLeave(tl,function(){if(!away){away=true;hide();}});
});
document.querySelectorAll('[data-status-in]').forEach(function(grid){
if(!('IntersectionObserver'in window)||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
[].forEach.call(grid.children,function(card,i){
card.style.setProperty('--i',i);
var badge=card.querySelector('.badge');if(badge)badge.style.setProperty('--i',i);
});
var done;
var hide=function(){clearTimeout(done);grid.classList.remove('is-in');grid.classList.add('is-ready');};
var play=function(){
hide();grid.offsetWidth;
requestAnimationFrame(function(){requestAnimationFrame(function(){grid.classList.add('is-in');});});
done=setTimeout(function(){grid.classList.remove('is-ready','is-in');},3200);
};
var away=false;
below(grid,.8,function(b){if(b){away=true;hide();}});
onView(grid,.25,function(){if(away){away=false;play();}});
onLeave(grid,function(){if(!away){away=true;hide();}});
});
document.querySelectorAll('[data-rise]').forEach(function(grid){
if(!('IntersectionObserver'in window)||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
Array.prototype.forEach.call(grid.children,function(card,i){card.style.setProperty('--i',i);});
var away=false,done=null;
var hide=function(){clearTimeout(done);grid.classList.remove('is-in');grid.classList.add('is-ready');};
below(grid,1,function(b){if(b){away=true;hide();}});
onView(grid,.3,function(){
if(!away)return;
away=false;
requestAnimationFrame(function(){requestAnimationFrame(function(){grid.classList.add('is-in');});});
done=setTimeout(function(){grid.classList.remove('is-ready','is-in');},1600);
});
onLeave(grid,function(){if(!away){away=true;hide();}});
});
var stillMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
var ZONE=.67;
var NS='http://www.w3.org/2000/svg';
var buildThenFlow=function(block,trigger,draw,buildTime){
var token=0,away=true;
var setState=function(state){
block.classList.remove('is-ready','is-building','is-flowing');
if(state)block.classList.add(state);
};
var play=function(){
var t=++token;
away=false;
setState('is-building');
setTimeout(function(){if(t===token)setState('is-flowing');},buildTime);
};
var enter=function(){
var b=block.getBoundingClientRect();
if(b.top<0&&b.height>window.innerHeight*.9){token++;away=false;setState('is-flowing');}
else play();
};
var reset=function(){
token++;
away=true;
setState('is-ready');
};
var enable=function(){
block.classList.add('is-animated');
draw();
var b=block.getBoundingClientRect();
if(b.bottom>0&&b.top<window.innerHeight&&trigger.getBoundingClientRect().top<window.innerHeight*ZONE)enter();
else reset();
};
var disable=function(){
token++;
setState(null);
block.classList.remove('is-animated');
};
new IntersectionObserver(function(entries){
entries.forEach(function(e){
if(e.isIntersecting||stillMotion.matches||!block.classList.contains('is-animated'))return;
if(e.boundingClientRect.bottom<=0&&e.boundingClientRect.height>window.innerHeight*.9)return;
reset();
});
}).observe(block);
new IntersectionObserver(function(entries){
entries.forEach(function(e){if(e.isIntersecting&&away&&!stillMotion.matches&&block.classList.contains('is-animated'))enter();});
},{rootMargin:'0px 0px -'+Math.round((1-ZONE)*100)+'% 0px'}).observe(trigger);
var onMotionChange=function(){if(stillMotion.matches)disable();else enable();};
if(stillMotion.addEventListener)stillMotion.addEventListener('change',onMotionChange);
else if(stillMotion.addListener)stillMotion.addListener(onMotionChange);
if(!stillMotion.matches)whenLoaded(enable);
};
var dashLine=function(parent,cls){
var svg=document.createElementNS(NS,'svg');
svg.setAttribute('class','dash-line '+cls);
svg.setAttribute('aria-hidden','true');
svg.appendChild(document.createElementNS(NS,'path'));
parent.appendChild(svg);
return svg;
};
var px=function(style,name){return parseFloat(style.getPropertyValue(name))||0;};
if('IntersectionObserver'in window){
document.querySelectorAll('.process').forEach(function(proc){
var flow=proc.querySelector('.process__flow'),loop=null;
var steps=proc.querySelectorAll('.step'),STAGGER=.55;
steps.forEach(function(step,i){step.style.setProperty('--at',(i*STAGGER)+'s');});
var linked=steps.length*STAGGER;
proc.style.setProperty('--linked',linked.toFixed(2)+'s');
var drawLoop=function(){
if(!proc.classList.contains('is-animated'))return;
loop=loop||dashLine(flow,'process__loop');
var f=flow.getBoundingClientRect(),ret=proc.querySelector('.process__return').getBoundingClientRect();
if(!f.width||!ret.width)return;
var st=getComputedStyle(proc),o=px(st,'--loop-x'),r=px(st,'--loop-r'),h=px(st,'--loop-hook');
var first=proc.querySelector('.step').getBoundingClientRect(),chip=proc.querySelector('.icon-chip');
var y=first.top-f.top+chip.offsetTop+chip.offsetHeight/2,xEnd=ret.right-f.left+o;
var xl=ret.left-f.left+o,yb=ret.bottom-f.top,xIn=first.left-f.left+o-4;
loop.style.width=(xEnd+4)+'px';
loop.style.height=(yb+4)+'px';
loop.firstChild.setAttribute('d','M'+(xEnd-r)+' '+y+'Q'+xEnd+' '+y+' '+xEnd+' '+(y+r)+
'V'+(yb-r)+'Q'+xEnd+' '+yb+' '+(xEnd-r)+' '+yb+'H'+(xl+r)+'Q'+xl+' '+yb+' '+xl+' '+(yb-r)+
'V'+(y+h)+'Q'+xl+' '+y+' '+(xl+h)+' '+y+'H'+xIn);
};
if('ResizeObserver'in window)new ResizeObserver(drawLoop).observe(flow);
buildThenFlow(proc,flow,drawLoop,(linked+2.15)*1000);
});
document.querySelectorAll('.chain').forEach(function(chain){
var cap=chain.querySelector('figcaption'),trace=null;
var links=chain.querySelectorAll('.chain__link'),chips=chain.querySelectorAll('.chain__chips li'),STAGGER=.42;
links.forEach(function(link,i){link.style.setProperty('--at',(i*STAGGER).toFixed(2)+'s');});
var linked=(links.length-1)*STAGGER+.45;
chain.style.setProperty('--linked',linked.toFixed(2)+'s');
var tickStart=linked+1.8;
chips.forEach(function(chip,i){chip.style.setProperty('--ct',(tickStart+i*.1).toFixed(2)+'s');});
var drawTrace=function(){
if(!chain.classList.contains('is-animated'))return;
trace=trace||dashLine(cap,'chain__trace');
var st=getComputedStyle(chain),w=cap.offsetWidth,h=px(st,'--trace-h'),r=px(st,'--trace-r');
if(!w||!h)return;
var a=.75,b=h-.75;
trace.style.width=w+'px';
trace.style.height=(h+2)+'px';
trace.firstChild.setAttribute('d','M'+(w-a)+' 0V'+(b-r)+'Q'+(w-a)+' '+b+' '+(w-a-r)+' '+b+
'H'+(a+r)+'Q'+a+' '+b+' '+a+' '+(b-r)+'V0');
};
if('ResizeObserver'in window)new ResizeObserver(drawTrace).observe(cap);
buildThenFlow(chain,chain.querySelector('.chain__links'),drawTrace,(tickStart+Math.max(chips.length-1,0)*.1+.4+.3)*1000);
});
}
var story=document.querySelector('[data-story]');
if(story)whenLoaded(function(){(function(fig){
var stage=fig.querySelector('.story__stage');
var canvas=stage.querySelector('canvas');
var ctx=canvas.getContext('2d');
var steps=Array.prototype.slice.call(fig.querySelectorAll('.story__step'));
var labels=Array.prototype.slice.call(fig.querySelectorAll('.story__pile'));
var HOLD=steps.map(function(b){return parseFloat(getComputedStyle(b).getPropertyValue('--hold'))||0;});
var DOT=[150,166,207],FAINT=[214,221,236],BLUE=[26,63,214];
var PILE=[[26,63,214],[96,121,222],[139,148,165],[140,162,234]];
var seed=11;
var rnd=function(){seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
var riverY=function(u){return 0.56+0.15*Math.sin(u*Math.PI*1.2+0.5)-0.06*Math.sin(u*Math.PI*3.1);};
var edge=function(a){return 0.94+0.08*Math.sin(3*a+0.8)+0.05*Math.sin(5*a+2.1);};
var inArea=function(u,v){var dx=u*2-1,dy=v*2-1;return Math.sqrt(dx*dx+dy*dy)<edge(Math.atan2(dy,dx));};
var dots=[];
for(var j=0;j<32;j++){
for(var i=0;i<74;i++){
var u=(i+0.5+(rnd()-0.5)*0.85)/74,v=(j+0.5+(rnd()-0.5)*0.85)/32;
var near=Math.abs(v-riverY(u));
if(!inArea(u,v)||rnd()>0.6||near<0.03)continue;
dots.push({u:u,v:v,near:near,pile:dots.length%4,jx:(rnd()-0.5)*0.5,jy:(rnd()-0.5)*0.5,x:0,y:0,r:0,c:DOT.slice()});
}
}
dots.forEach(function(d){d.key=d.near<0.09?rnd()<0.24:rnd()<0.012;});
dots.sort(function(a,b){return a.key-b.key;});
var W=0,H=0,PAD=26,SCALE=1,at=-1,land=0,landFrom=0,landTo=0,t0=0,raf=0,DUR=1100;
var layout=function(){
var box=stage.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);
W=box.width;H=box.height;
canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);
ctx.setTransform(dpr,0,0,dpr,0,0);
SCALE=Math.max(0.68,Math.min(1,W/720));
var narrow=W<560,counts=[0,0,0,0];
dots.forEach(function(d){counts[d.pile]++;});
var pw=narrow?W*0.34:W*0.19,ph=narrow?H*0.27:H*0.5;
var piles=counts.map(function(n,k){
var s=Math.sqrt(pw*ph/n),cols=Math.max(1,Math.floor(pw/s));
var cx=narrow?W*(k%2?0.73:0.27):W*(0.125+0.25*k);
return{cx:cx,left:cx-cols*s/2,top:narrow?H*(k<2?0.17:0.62):H*0.36,s:s,cols:cols,i:0};
});
dots.forEach(function(d){
var g=piles[d.pile],k=g.i++;
d.px=g.left+(k%g.cols+0.5+d.jx)*g.s;
d.py=g.top+(Math.floor(k/g.cols)+0.5+d.jy)*g.s;
d.mx=PAD+d.u*(W-2*PAD);
d.my=PAD+d.v*(H-2*PAD);
});
labels.forEach(function(l,k){l.style.left=piles[k].cx+'px';l.style.top=(piles[k].top-(narrow?32:40))+'px';});
};
var target=function(d,s){
if(s===1)return[d.px,d.py,2.1*SCALE,PILE[d.pile]];
if(s===2)return d.key?[d.mx,d.my,3.3*SCALE,BLUE]:[d.mx,d.my,1.9*SCALE,FAINT];
return[d.mx,d.my,2.1*SCALE,DOT];
};
var draw=function(){
ctx.clearRect(0,0,W,H);
if(land>0.01){
ctx.beginPath();
for(var q=0;q<=96;q++){
var a=q/96*6.2832,R=edge(a)+0.05;
var ax=PAD+(1+R*Math.cos(a))/2*(W-2*PAD),ay=PAD+(1+R*Math.sin(a))/2*(H-2*PAD);
if(q)ctx.lineTo(ax,ay);else ctx.moveTo(ax,ay);
}
ctx.fillStyle='rgba(255, 255, 255, '+0.7*land+')';
ctx.fill();
ctx.beginPath();
for(var s=0;s<=120;s++){
var ru=-0.05+s*1.1/120,rx=PAD+ru*(W-2*PAD),ry=PAD+riverY(ru)*(H-2*PAD);
if(s)ctx.lineTo(rx,ry);else ctx.moveTo(rx,ry);
}
var fade=ctx.createLinearGradient(PAD,0,W-PAD,0),c='rgba(142, 167, 239, '+0.85*land+')';
fade.addColorStop(0,'rgba(142, 167, 239, 0)');
fade.addColorStop(0.12,c);
fade.addColorStop(0.88,c);
fade.addColorStop(1,'rgba(142, 167, 239, 0)');
ctx.strokeStyle=fade;
ctx.lineWidth=3*SCALE;
ctx.lineCap='round';
ctx.stroke();
}
for(var k=0;k<dots.length;k++){
var d=dots[k];
if(d.r<0.2)continue;
if(d.key&&at===2&&d.r>2.4*SCALE){
ctx.fillStyle='rgba(26, 63, 214, 0.12)';
ctx.beginPath();
ctx.arc(d.x,d.y,d.r*2.6,0,6.2832);
ctx.fill();
}
ctx.fillStyle='rgb('+(d.c[0]|0)+','+(d.c[1]|0)+','+(d.c[2]|0)+')';
ctx.beginPath();
ctx.arc(d.x,d.y,d.r,0,6.2832);
ctx.fill();
}
};
var ease=function(t){return t===1?1:1-Math.pow(2,-10*t);};
var frame=function(now){
var busy=false;
for(var k=0;k<dots.length;k++){
var d=dots[k],p=(now-t0-d.delay)/DUR;
p=p<0?0:p>1?1:p;
if(p<1)busy=true;
var e=ease(p);
d.x=d.fx+(d.tx-d.fx)*e;
d.y=d.fy+(d.ty-d.fy)*e;
d.r=d.fr+(d.tr-d.fr)*e;
for(var n=0;n<3;n++)d.c[n]=d.fc[n]+(d.tc[n]-d.fc[n])*e;
}
var pl=Math.min(1,(now-t0)/700);
land=landFrom+(landTo-landFrom)*ease(pl);
draw();
if(busy||pl<1)raf=requestAnimationFrame(frame);
};
var setStage=function(s,instant){
at=s;
fig.setAttribute('data-at',s);
steps.forEach(function(b,k){b.setAttribute('aria-pressed',String(k===s));});
dots.forEach(function(d){
var t=target(d,s);
d.fx=d.x;d.fy=d.y;d.fr=d.r;d.fc=d.c.slice();
d.tx=t[0];d.ty=t[1];d.tr=t[2];d.tc=t[3];
d.delay=s===1?d.u*420:s===2?(d.key?380+d.near*1600:d.u*240):0;
});
landFrom=land;landTo=s===1?0:1;
cancelAnimationFrame(raf);
if(instant||stillMotion.matches){
dots.forEach(function(d){d.x=d.tx;d.y=d.ty;d.r=d.tr;d.c=d.tc.slice();});
land=landTo;
draw();
return;
}
t0=performance.now();
raf=requestAnimationFrame(frame);
};
var appear=function(){
dots.forEach(function(d){d.x=d.mx;d.y=d.my;d.r=0;d.c=DOT.slice();});
land=0;
setStage(0);
dots.forEach(function(d){d.delay=80+d.near*1500+rnd()*160;});
};
var timer=0,played=false;
var stopAuto=function(){clearTimeout(timer);fig.classList.remove('is-auto');};
var play=function(){
stopAuto();
fig.classList.add('is-auto');
appear();
timer=setTimeout(function(){
setStage(1);
timer=setTimeout(function(){stopAuto();setStage(2);},HOLD[1]);
},HOLD[0]);
};
steps.forEach(function(b,k){
b.addEventListener('click',function(){stopAuto();setStage(k);});
});
layout();
if(stillMotion.matches||!('IntersectionObserver'in window)){
setStage(0,true);
}else{
new IntersectionObserver(function(entries){
entries.forEach(function(e){
if(e.intersectionRatio>=0.5&&!played){played=true;play();}
else if(!e.isIntersecting&&played){played=false;stopAuto();}
});
},{threshold:[0,0.5]}).observe(fig);
}
if('ResizeObserver'in window){
var lastW=stage.getBoundingClientRect().width;
new ResizeObserver(function(){
var w=stage.getBoundingClientRect().width;
if(Math.abs(w-lastW)<1)return;
lastW=w;
layout();
if(at>=0)setStage(at,true);
}).observe(stage);
}
})(story);});
var wwdEl=document.querySelector('[data-wwd]');
if(wwdEl)whenLoaded(function(){(function(fig){
var wiresIn=fig.querySelector('.wwd__wires--in'),wiresOut=fig.querySelector('.wwd__wires--out');
var srcs=Array.prototype.slice.call(fig.querySelectorAll('.wwd__col--in .wwd-src:not(.wwd-src--more)'));
var outs=Array.prototype.slice.call(fig.querySelectorAll('.wwd-out'));
var method=fig.querySelector('.wwd-method');
var add=function(svg,d,cls,i){
var p=document.createElementNS(NS,'path');
p.setAttribute('d',d);
p.setAttribute('class',cls);
p.style.setProperty('--i',i);
svg.appendChild(p);
if(cls==='wwd-wire')p.style.setProperty('--len',Math.ceil(p.getTotalLength())+'px');
};
var hub=function(svg,x,y){
var c=document.createElementNS(NS,'circle');
c.setAttribute('cx',x);c.setAttribute('cy',y);c.setAttribute('r',4);c.setAttribute('class','wwd-hub');
svg.appendChild(c);
};
var glint=function(svg,d,i,w,colour,start,gap){
if(stillMotion.matches)return;
var defs=svg.querySelector('defs')||svg.insertBefore(document.createElementNS(NS,'defs'),svg.firstChild);
var id='wwd-gl-'+(svg===wiresIn?'in':'out')+i;
var g=document.createElementNS(NS,'linearGradient');
g.setAttribute('id',id);g.setAttribute('gradientUnits','userSpaceOnUse');
g.setAttribute('x1',-60);g.setAttribute('x2',0);g.setAttribute('y1',0);g.setAttribute('y2',0);
[[0,0],[.7,.9],[1,0]].forEach(function(s){
var st=document.createElementNS(NS,'stop');
st.setAttribute('offset',s[0]);st.setAttribute('stop-color',colour);st.setAttribute('stop-opacity',s[1]);
g.appendChild(st);
});
[['x1',-60],['x2',0]].forEach(function(a){
var an=document.createElementNS(NS,'animate');
an.setAttribute('attributeName',a[0]);
an.setAttribute('values',a[1]+';'+(w+a[1]+70)+';'+(w+a[1]+70));
an.setAttribute('keyTimes','0;.24;1');an.setAttribute('dur',gap+'s');
an.setAttribute('begin',(start+i*1.1)+'s');an.setAttribute('repeatCount','indefinite');
g.appendChild(an);
});
defs.appendChild(g);
var p=document.createElementNS(NS,'path');
p.setAttribute('d',d);p.setAttribute('class','wwd-glint');p.setAttribute('stroke','url(#'+id+')');
svg.appendChild(p);
};
var draw=function(){
[wiresIn,wiresOut].forEach(function(s){while(s.firstChild)s.removeChild(s.firstChild);});
if(getComputedStyle(wiresIn).display==='none')return;
var mid=function(el,svg){var r=el.getBoundingClientRect();return r.top+r.height/2-svg.getBoundingClientRect().top;};
var w=wiresIn.getBoundingClientRect().width,yc=mid(method,wiresIn);
srcs.forEach(function(s,i){
var y=mid(s,wiresIn),d='M0 '+y+' C'+w*.55+' '+y+' '+w*.45+' '+yc+' '+(w-2)+' '+yc;
add(wiresIn,d,'wwd-wire',i);glint(wiresIn,d,i,w,'#1a3fd6',1.2,6.6);
});
hub(wiresIn,w-2,yc);
var w2=wiresOut.getBoundingClientRect().width,yc2=mid(method,wiresOut);
outs.forEach(function(o,i){
var y=mid(o,wiresOut),d='M2 '+yc2+' C'+w2*.55+' '+yc2+' '+w2*.45+' '+y+' '+w2+' '+y;
add(wiresOut,d,'wwd-wire',i);glint(wiresOut,d,i,w2,'#2f9e55',4.4,6.6);
});
hub(wiresOut,2,yc2);
};
draw();
var light=function(rows,svg){
rows.forEach(function(row,i){
var set=function(on){
var wire=svg.querySelectorAll('.wwd-wire')[i],dot=svg.querySelector('.wwd-hub');
row.classList.toggle('is-lit',on);
if(wire)wire.classList.toggle('is-lit',on);
if(dot)dot.classList.toggle('is-lit',on);
};
row.addEventListener('pointerenter',function(){set(true);});
row.addEventListener('pointerleave',function(){set(false);});
});
};
light(srcs,wiresIn);
light(outs,wiresOut);
if('ResizeObserver'in window)new ResizeObserver(draw).observe(fig);
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(draw);
if('IntersectionObserver'in window)buildThenFlow(fig,fig,draw,5000);
var glinting=function(){
var on=fig.classList.contains('is-flowing')||!fig.classList.contains('is-animated');
[wiresIn,wiresOut].forEach(function(s){if(s&&s.pauseAnimations){if(on)s.unpauseAnimations();else s.pauseAnimations();}});
};
new MutationObserver(glinting).observe(fig,{attributes:true,attributeFilter:['class']});
glinting();
})(wwdEl);});
var nameFx=document.querySelector('.ov-namefx');
if(nameFx&&'IntersectionObserver'in window&&!stillMotion.matches)below(nameFx,1,function(b){if(b)(function(root){
var word=root.querySelector('.ov-namefx__word'),aqu=word.children[0],a=word.children[1],w=word.children[2];
var cards=Array.prototype.slice.call(root.querySelectorAll('.ov-name'));
var clamp=function(x){return Math.max(0,Math.min(1,x));};
var seg=function(t,t0,t1){return clamp((t-t0)/(t1-t0));};
var inout=function(x){return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;};
var spring=function(x){return x<=0?0:x>=1?1:1-Math.exp(-6*x)*Math.cos(8*x)*(1-x);};
var snap=function(x){return x<=0?0:x>=1?1:1-Math.exp(-8*x)*Math.cos(7*x)*(1-x);};
var M=null;
var measure=function(){
[aqu,a,w].forEach(function(el){el.style.transform='';});
cards.forEach(function(c){c.style.transform='';});
var box=root.getBoundingClientRect(),r=function(el){return el.getBoundingClientRect();};
var em=parseFloat(getComputedStyle(word).fontSize),wide=r(w).right-r(aqu).left,stacked=r(cards[1]).top>=r(cards[0]).bottom-1;
M={
em:em,stacked:stacked,
S:Math.max(em*.14,Math.min(em*.64,(box.width-wide)/2*.72)),
c0:(r(aqu).left+r(a).right)/2-box.left,c1:(r(w).left+r(w).right)/2-box.left,c2:(r(a).left+r(w).right)/2-box.left,
mid:box.width/2,rideY:r(word).bottom-box.top+(stacked?22:30),
d:cards.map(function(c){var q=r(c);return{x:q.left-box.left,y:q.top-box.top,w:q.width};})
};
};
var ph=-1;
var render=function(t){
var S=M.S,em=M.em;
var split=t<.74?spring(seg(t,.05,.2)):1-snap(seg(t,.74,.9));
var cross=inout(seg(t,.48,.64)),close=inout(seg(t,.74,.92)),lift=Math.sin(Math.PI*cross);
aqu.style.transform='translateX('+(-S*split).toFixed(2)+'px)';
w.style.transform='translateX('+(S*split).toFixed(2)+'px)';
a.style.transform='translate('+((-S+2*S*cross)*split).toFixed(2)+'px,'+(-lift*em*.34).toFixed(2)+'px) rotate('+(-lift*9).toFixed(2)+'deg)';
var p=t<.05?0:t<.28?1:t<.48?2:t<.74?3:4;
if(p!==ph){ph=p;root.setAttribute('data-ph',p);}
root.classList.toggle('is-named',t>=.97);
var rs=t<.74?split:1;
var ride=M.stacked?[M.mid,M.mid,M.mid]:[M.c0-S*rs,M.c1+S*rs,M.c2+S*rs];
var op=M.stacked?[
t<.74?seg(t,.1,.2)*(1-seg(t,.28,.32)):close,
t<.74?seg(t,.32,.4)*(1-seg(t,.48,.54)):seg(close,.55,1),
t<.74?seg(t,.56,.64):1
]:[
t<.74?seg(t,.1,.2)*(1-.62*seg(t,.3,.38)):.38+.62*close,
t<.74?seg(t,.3,.4)*(1-seg(t,.48,.56)):seg(close,.55,1),
t<.74?seg(t,.56,.64):1
];
cards.forEach(function(c,i){
var f=M.d[i],rx=ride[i]-f.w/2-f.x,ry=M.rideY-f.y,rise=t<.74?(1-op[i])*14:0;
if(i===1&&t>=.74){rx=0;ry=0;}
c.style.transform=t>=1?'':'translate('+(rx*(1-close)).toFixed(1)+'px,'+(ry*(1-close)+rise).toFixed(1)+'px)';
c.style.opacity=t>=1?'':op[i].toFixed(3);
});
};
var raf=null;
var play=function(){
cancelAnimationFrame(raf);
measure();
var t0=performance.now();
var tick=function(now){var t=clamp((now-t0)/9400);render(t);if(t<1)raf=requestAnimationFrame(tick);};
raf=requestAnimationFrame(tick);
};
var away=true;
var begin=function(){
root.classList.add('is-live');
measure();
render(0);
onView(word,.55,function(){if(away){away=false;play();}});
new IntersectionObserver(function(entries){
if(entries[0].isIntersecting||away)return;
away=true;
cancelAnimationFrame(raf);
measure();
render(0);
}).observe(root);
word.addEventListener('click',play);
};
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(begin);else begin();
})(nameFx);});
if(header){
if('IntersectionObserver'in window){
var mark=document.createElement('div');
mark.setAttribute('aria-hidden','true');
mark.style.cssText='position: absolute; top: 0; left: 0; width: 1px; height: 9px; pointer-events: none; visibility: hidden';
document.body.appendChild(mark);
new IntersectionObserver(function(es){header.classList.toggle('is-scrolled',!es[0].isIntersecting);}).observe(mark);
}else{
var onScroll=function(){header.classList.toggle('is-scrolled',window.scrollY>8);};
window.addEventListener('scroll',onScroll,{passive:true});
onScroll();
}
}
})();
