(function(){
'use strict';
var doc=document;
var lang=doc.documentElement.lang==='en'?'en':'nl';
function afterLoad(fn){
var idle=function(){
if(window.requestIdleCallback)window.requestIdleCallback(fn,{timeout:1200});
else window.setTimeout(fn,1);
};
if(doc.readyState==='complete')idle();
else window.addEventListener('load',idle);
}
function mountBronnenbeeld(){
var B=window.Bronnenbeeld;
var els=[].slice.call(doc.querySelectorAll('[data-bb]'));
if(!B||!B.mount||!els.length)return;
var start=function(el){
if(el.bronnenbeeld)return;
el.bronnenbeeld=B.mount(el,{
data:(el.getAttribute('data-src')||'').replace('{lang}',lang),
mode:el.getAttribute('data-mode')||'full',
lang:lang,
selected:el.getAttribute('data-selected')
});
el.bronnenbeeld.catch(function(){(el.closest('[data-bb-frame]')||el).hidden=true;});
};
afterLoad(function(){
if(!('IntersectionObserver'in window)){els.forEach(start);return;}
var io=new IntersectionObserver(function(entries){
entries.forEach(function(entry){
if(entry.isIntersecting){io.unobserve(entry.target);start(entry.target);}
});
},{rootMargin:'400px'});
els.forEach(function(el){io.observe(el);});
});
}
function requestLinks(){
var hash=requestHash();
var section=hash?doc.getElementById(hash.slice(1)):null;
var root=doc.documentElement,run=0;
if(!section)return;
var go=function(calm){section.scrollIntoView({behavior:calm?'auto':'smooth',block:'start'});};
var settle=function(calm,tries,mine){
var from=window.pageYOffset;
window.setTimeout(function(){
if(mine!==run)return;
var y=window.pageYOffset,top=section.getBoundingClientRect().top;
if(y!==from){settle(calm,tries,mine);return;}
var want=parseFloat(window.getComputedStyle(root).scrollPaddingTop)||0;
var atEnd=window.innerHeight+y>=root.scrollHeight-2;
if(Math.abs(top-want)<2||(atEnd&&top>want)||!tries)return;
go(calm);settle(calm,tries-1,mine);
},180);
};
var arrive=function(){
var menu=doc.querySelector('.site-header.is-open .menu-toggle');
if(menu)menu.click();
var field=requestField(section);
if(field===section&&!section.hasAttribute('tabindex'))section.setAttribute('tabindex','-1');
var calm=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
go(calm);
field.focus({preventScroll:true});
run+=1;settle(calm,4,run);
};
['wheel','touchstart','keydown'].forEach(function(type){window.addEventListener(type,function(){run+=1;},{passive:true});});
doc.addEventListener('click',function(e){
var a=e.target&&e.target.closest?e.target.closest('a[href]'):null;
if(!a||a.getAttribute('href')!==hash||e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
e.preventDefault();
arrive();
if(window.history&&window.history.pushState&&window.location.hash!==hash)window.history.pushState(null,'',hash);
});
if(window.location.hash===hash){
var mine=run;
var fonts=doc.fonts&&doc.fonts.ready?doc.fonts.ready:null;
var later=function(){
window.requestAnimationFrame(function(){window.requestAnimationFrame(function(){if(run===mine)arrive();});});
};
if(fonts&&fonts.then)fonts.then(later,later);else later();
}
}
function mountFragments(){
var B=window.Bronnenbeeld;
var els=[].slice.call(doc.querySelectorAll('[data-bb-fragment]'));
if(!B||!B.mount||!els.length)return;
var start=function(el){
if(el.bronnenbeeld)return;
el.bronnenbeeld=B.mount(el,{
data:(el.getAttribute('data-src')||'').replace('{lang}',lang),
mode:el.getAttribute('data-mode'),
lang:lang,
selected:el.getAttribute('data-selected')
});
el.bronnenbeeld.catch(function(){(el.closest('[data-fragment-frame]')||el).hidden=true;});
};
afterLoad(function(){
if(!('IntersectionObserver'in window)){els.forEach(start);return;}
var io=new IntersectionObserver(function(entries){
entries.forEach(function(entry){
if(entry.isIntersecting){io.unobserve(entry.target);start(entry.target);}
});
},{rootMargin:'400px'});
els.forEach(function(el){io.observe(el);});
});
}
mountBronnenbeeld();
requestLinks();
function faqAccordion(){
[].forEach.call(doc.querySelectorAll('[data-faq]'),function(list){
var set=function(button,open){
var panel=doc.getElementById(button.getAttribute('aria-controls'));
button.setAttribute('aria-expanded',open?'true':'false');
if(panel)panel.classList.toggle('is-closed',!open);
};
[].forEach.call(list.querySelectorAll('h3 > button[aria-controls]'),function(button,i){
set(button,i===0);
button.addEventListener('click',function(){set(button,button.getAttribute('aria-expanded')!=='true');});
});
window.requestAnimationFrame(function(){window.requestAnimationFrame(function(){list.classList.add('is-ready');});});
});
}
faqAccordion();
var STICKY_LABEL={nl:'Bespreek uw waterlichaam',en:'Discuss your waterbody'};
function requestHash(){
var a=doc.querySelector('main > section:first-of-type a.btn--primary');
var hash=a?a.getAttribute('href')||'':'';
return hash.length>1&&hash.charAt(0)==='#'&&doc.getElementById(hash.slice(1))?hash:'';
}
function requestField(section){
var shown=function(el){return!!el&&el.getClientRects().length>0&&window.getComputedStyle(el).visibility!=='hidden';};
var field=function(el){return/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)?el:el.querySelector('input:not([type="hidden"]), select, textarea');};
var pick=function(marks){
var els=section.querySelectorAll(marks);
for(var i=0;i<els.length;i++){
var f=field(els[i]);
if(shown(els[i])&&shown(f)&&!f.disabled)return f;
}
return null;
};
return pick('[data-wb-manual], #waterbody-manual')||pick('[data-wb-search], #waterbody-search')||section;
}
function stickyBar(){
var hash=requestHash(),section=hash?doc.getElementById(hash.slice(1)):null;
var hero=doc.querySelector('main > section:first-of-type');
if(!section||!hero||!('IntersectionObserver'in window))return;
var root=doc.documentElement,header=doc.querySelector('.site-header');
var bar=doc.createElement('div'),link=doc.createElement('a');
bar.className='ba-sticky';
bar.hidden=true;
link.className='btn btn--primary ba-sticky__link';
link.setAttribute('href',hash);
link.textContent=STICKY_LABEL[lang];
bar.appendChild(link);
doc.body.appendChild(bar);
var past=false,near=false;
var touch=window.matchMedia?window.matchMedia('(pointer: coarse)'):{matches:false};
var typing=function(){
var e=doc.activeElement;
if(!touch.matches||!e)return false;
if(e.isContentEditable||e.tagName==='TEXTAREA')return true;
return e.tagName==='INPUT'&&!/^(button|checkbox|color|file|hidden|image|radio|range|reset|submit)$/i.test(e.type);
};
var keyboard=function(){var v=window.visualViewport;return(!!v&&v.height<0.75*window.innerHeight)||typing();};
var update=function(){
var show=past&&!near&&!root.hasAttribute('data-bb-sheet-open')&&!(header&&header.classList.contains('is-open'))&&!keyboard();
if(bar.hidden===show)bar.hidden=!show;
};
var io=new IntersectionObserver(function(entries){
entries.forEach(function(e){
if(e.target===hero)past=!e.isIntersecting&&e.boundingClientRect.bottom<=0;
else near=e.isIntersecting;
});
update();
});
io.observe(hero);
io.observe(section);
if('MutationObserver'in window){
var mo=new MutationObserver(update);
mo.observe(root,{attributes:true,attributeFilter:['data-bb-sheet-open']});
if(header)mo.observe(header,{attributes:true,attributeFilter:['class']});
}
if(window.visualViewport)window.visualViewport.addEventListener('resize',update);
window.addEventListener('resize',update);
doc.addEventListener('focusin',update);
doc.addEventListener('focusout',function(){window.setTimeout(update,0);});
}
stickyBar();
mountFragments();
function mountRequest(){
var A=window.AWAanvraag,W=window.AWWaterbodies;
var form=doc.querySelector('form[data-aanvraag]');
if(!A||!A.mount||!form)return;
var script=doc.querySelector('script[src*="waterbody-search.01dec24a.js"]');
var base=script?script.getAttribute('src').replace(/js\/waterbody-search\.01dec24a\.js.*$/,'data/waterbodies/'):'';
var search=W&&W.createSearch&&base
?W.createSearch({base:base,lang:lang,fetch:function(url){return window.fetch(url);}})
:null;
var inst=A.mount(form,{search:search,lang:lang});
if(!inst)return;
if('IntersectionObserver'in window){
var io=new IntersectionObserver(function(entries){
if(entries.some(function(e){return e.isIntersecting;})){io.disconnect();inst.loadCountries();}
},{rootMargin:'400px 0px'});
io.observe(form);
}
var section=form.closest('section');
var NAMES={'source-overview':'bronnenbeeld',use:'toepassing',sources:'bronnen',process:'werkwijze',why:'waarom',faq:'vragen',request:'aanvraag'};
var ctaName=function(a){
if(a.getAttribute('data-cta'))return a.getAttribute('data-cta');
if(a.closest('.m-foot'))return'menu';
if(a.closest('.site-header'))return'header';
var s=a.closest('section[id]');
var id=s?s.id:'pagina';
return id==='top'?'hero':(NAMES[id]||id);
};
if(section&&window.location.hash==='#'+section.id)inst.setCtaSource('link');
doc.addEventListener('click',function(e){
var a=e.target&&e.target.closest?e.target.closest('a[href]'):null;
if(!a||!section||a.getAttribute('href')!=='#'+section.id)return;
inst.setCtaSource(ctaName(a));
if(!e.defaultPrevented)return;
var target=inst.focusTarget();
if(target&&target!==doc.activeElement)target.focus({preventScroll:true});
});
}
mountRequest();
function motionAllowed(){
return'IntersectionObserver'in window&&!!window.matchMedia&&window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
}
function whenPainted(fn){
var go=function(){window.requestAnimationFrame(function(){window.setTimeout(fn,0);});};
if(doc.readyState==='complete')go();else window.addEventListener('load',go,{once:true});
}
function startsBelow(els,cb){
whenPainted(function(){
var io=new IntersectionObserver(function(entries){
io.disconnect();
cb(entries.filter(function(e){return e.boundingClientRect.top>(e.rootBounds?e.rootBounds.height:window.innerHeight);}).map(function(e){return e.target;}));
});
els.forEach(function(el){io.observe(el);});
});
}
function onReach(els,line,fn){
var left=els.slice();
var io=new IntersectionObserver(function(entries){
var batch=[];
entries.forEach(function(e){
var i=left.indexOf(e.target);
if(!e.isIntersecting||i<0)return;
io.unobserve(e.target);
left.splice(i,1);
batch.push(e.target);
});
batch.sort(function(a,b){return a.compareDocumentPosition(b)&4?-1:1;});
if(batch.length)fn(batch);
},{rootMargin:'100000px 0px '+ -Math.round((1-line)*100)+'% 0px'});
els.forEach(function(el){io.observe(el);});
return function(){io.disconnect();};
}
function onPrint(fn){window.addEventListener('beforeprint',fn);}
function heroSettle(){
var hero=doc.querySelector('.ba-hero'),figure=hero?hero.querySelector('.ba-hero__figure'):null;
if(!figure)return;
var settle=function(){hero.classList.add('is-settled');};
var playing=function(){return figure.getAnimations?figure.getAnimations().some(function(a){return a.playState!=='finished';}):false;};
if(window.getComputedStyle(figure).animationName==='none'||!playing()){settle();return;}
figure.addEventListener('animationend',function(e){if(e.target===figure)settle();});
figure.addEventListener('animationcancel',function(e){if(e.target===figure)settle();});
}
function motionCards(){
var cards=[].slice.call(doc.querySelectorAll('.ba-use'));
if(!cards.length||!motionAllowed())return;
var end=function(card){card.removeAttribute('data-motion');card.style.removeProperty('--ba-at');};
startsBelow(cards,function(below){
if(!below.length)return;
below.forEach(function(card){card.setAttribute('data-motion','wait');});
var stop=onReach(below,0.8,function(batch){
batch.forEach(function(card,i){
var frag=card.querySelector('[data-bb-fragment]'),frames=0;
var play=function(){
void card.offsetWidth;
card.style.setProperty('--ba-at',i*120+'ms');
card.setAttribute('data-motion','play');
window.setTimeout(function(){end(card);},i*120+950);
};
(function drawn(){
if(frag&&frag.bronnenbeeld)frag.bronnenbeeld.then(play,play);
else if(!frag||++frames>60)play();
else window.requestAnimationFrame(drawn);
}());
});
});
onPrint(function(){stop();below.forEach(end);});
});
}
function motionProcess(){
var box=doc.querySelector('.ba-steps'),line=box?box.querySelector('.ba-steps__line'):null;
if(!line||!motionAllowed())return;
var visuals=[].slice.call(box.querySelectorAll('.ba-step__visual')),nums=[].slice.call(box.querySelectorAll('.ba-step__num'));
if(!visuals.length)return;
var stopAt=function(k){
if(k>=visuals.length||!nums[k])return 1;
var wide=window.matchMedia('(min-width: 64em)').matches,l=line.getBoundingClientRect(),n=nums[k].getBoundingClientRect();
var f=wide?(n.left+n.width/2-l.left)/l.width:(n.top+n.height/2-l.top)/l.height;
return Math.round(Math.max(0,Math.min(1,f))*10000)/10000;
};
var end=function(){
box.removeAttribute('data-motion');
box.style.removeProperty('--ba-fill');
visuals.forEach(function(v){v.classList.remove('is-in');v.style.removeProperty('--ba-at');});
};
startsBelow([box],function(below){
if(!below.length)return;
var reached=0,timer;
box.style.setProperty('--ba-fill','0');
box.setAttribute('data-motion','wait');
var stop=onReach(visuals,0.85,function(batch){
var k=Math.max.apply(null,batch.map(function(v){return visuals.indexOf(v)+1;}));
if(k<=reached)return;
var fresh=visuals.slice(reached,k);
reached=k;
fresh.forEach(function(v,i){v.style.setProperty('--ba-at',i*120+'ms');v.classList.add('is-in');});
box.style.setProperty('--ba-fill',String(stopAt(reached)));
box.setAttribute('data-motion','play');
if(reached===visuals.length){window.clearTimeout(timer);timer=window.setTimeout(end,Math.max(650,(fresh.length-1)*120+450));}
});
onPrint(function(){stop();end();});
});
}
function motionPicture(){
var fig=doc.querySelector('.ba-why__figure');
if(!fig||!motionAllowed())return;
var lines=[].slice.call(fig.querySelectorAll('.ba-why__line')),cards=[];
[].forEach.call(fig.querySelectorAll('.ba-why__svg'),function(svg){
[].filter.call(svg.children,function(g){return g.tagName.toLowerCase()==='g'&&g.querySelector('.ba-why__card');})
.forEach(function(g,i){cards.push([g,i]);});
});
var end=function(){
fig.removeAttribute('data-motion');
lines.forEach(function(l){l.removeAttribute('pathLength');});
cards.forEach(function(c){c[0].style.removeProperty('--ba-i');});
};
startsBelow([fig],function(below){
if(!below.length)return;
lines.forEach(function(l){l.setAttribute('pathLength','1');});
cards.forEach(function(c){c[0].style.setProperty('--ba-i',String(c[1]));});
fig.setAttribute('data-motion','wait');
var stop=onReach([fig],0.7,function(){
fig.setAttribute('data-motion','play');
window.setTimeout(end,1750);
});
onPrint(function(){stop();end();});
});
}
function categoryHighlight(){
var sec=doc.querySelector('.ba-sources'),map=sec?sec.querySelector('.ba-sources__map'):null;
var items=sec?[].slice.call(sec.querySelectorAll('.ba-cats li')):[];
if(!map||!items.length)return;
var hover=window.matchMedia?window.matchMedia('(hover: hover)'):{matches:false};
var colour=function(el,name){return(el.style.getPropertyValue(name)||'').trim().toLowerCase();};
var picked=null,pointed=null,calm;
var show=function(){
var li=pointed||picked,c=li?colour(li,'--ba-c'):'';
window.clearTimeout(calm);
sec.setAttribute('data-pointing','');
items.forEach(function(i){i.classList.toggle('is-lit',i===li);});
[].forEach.call(map.querySelectorAll('.bb-fr__marker'),function(m){m.classList.toggle('is-lit',!!c&&colour(m,'--bb-c')===c);});
if(li){sec.setAttribute('data-lit','');return;}
sec.removeAttribute('data-lit');
calm=window.setTimeout(function(){sec.removeAttribute('data-pointing');},300);
};
items.forEach(function(li){
li.addEventListener('pointerenter',function(e){if(e.pointerType!=='touch'&&hover.matches){pointed=li;show();}});
li.addEventListener('pointerleave',function(){if(pointed===li){pointed=null;show();}});
li.addEventListener('click',function(){picked=picked===li?null:li;show();});
});
}
heroSettle();
motionCards();
motionProcess();
motionPicture();
categoryHighlight();
}());
