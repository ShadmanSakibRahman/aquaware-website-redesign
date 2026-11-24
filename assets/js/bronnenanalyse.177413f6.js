(function(){
'use strict';
var doc=document;
var lang=doc.documentElement.lang==='en'?'en':'nl';
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
requestLinks();
function faqAccordion(){
[].forEach.call(doc.querySelectorAll('[data-faq]'),function(list){
var set=function(button,open){
var panel=doc.getElementById(button.getAttribute('aria-controls'));
button.setAttribute('aria-expanded',open?'true':'false');
if(panel)panel.classList.toggle('is-closed',!open);
};
[].forEach.call(list.querySelectorAll('h3 > button[aria-controls]'),function(button){
set(button,false);
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
var header=doc.querySelector('.site-header');
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
var show=past&&!near&&!(header&&header.classList.contains('is-open'))&&!keyboard();
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
if(header)mo.observe(header,{attributes:true,attributeFilter:['class']});
}
if(window.visualViewport)window.visualViewport.addEventListener('resize',update);
window.addEventListener('resize',update);
doc.addEventListener('focusin',update);
doc.addEventListener('focusout',function(){window.setTimeout(update,0);});
}
stickyBar();
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
var NAMES={analysis:'analyse',use:'toepassing',process:'werkwijze',why:'waarom',faq:'vragen',request:'aanvraag'};
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
function motionProcess(){
var box=doc.querySelector('.ba-steps'),line=box?box.querySelector('.ba-steps__line'):null;
if(!line||!motionAllowed())return;
var visuals=[].slice.call(box.querySelectorAll('.ba-step')),nums=[].slice.call(box.querySelectorAll('.ba-step__num'));
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
motionProcess();
function noteInfo(){
[].forEach.call(doc.querySelectorAll('.ba-req__info[aria-controls]'),function(button){
var text=doc.getElementById(button.getAttribute('aria-controls'));
if(!text)return;
button.addEventListener('click',function(){
var open=button.getAttribute('aria-expanded')!=='true';
button.setAttribute('aria-expanded',open?'true':'false');
text.hidden=!open;
});
});
}
noteInfo();
}());
