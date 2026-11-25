(function(){
'use strict';
var story=document.querySelector('[data-bronnenverhaal]');
if(!story||!('IntersectionObserver'in window))return;
if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
var map=story.querySelector('.ba-map--main');
var visual=story.querySelector('.ba-story__visual');
var stages=Array.prototype.slice.call(story.querySelectorAll('.ba-stage'));
var phoneFig=story.querySelector('.ba-mfig');
if(!map||!visual||stages.length!==3)return;
var wide=window.matchMedia('(min-width: 64em)');
var tablet=window.matchMedia('(min-width: 48em)');
var stage=0,seen=false,pulsed=false,settled=false;
var pulse=function(el){
el.classList.remove('is-pulse');
void el.getBoundingClientRect();
el.classList.add('is-pulse');
};
var pulseIfSeen=function(){
if(stage===1&&seen&&!pulsed){pulsed=true;pulse(map);}
};
var set=function(n){
if(n===stage)return;
stage=n;
map.setAttribute('data-stage',String(n));
stages.forEach(function(li,i){li.classList.toggle('is-active',i===n-1);});
if(n===1)pulseIfSeen();else pulsed=false;
};
var line=function(){
var h=window.innerHeight;
if(wide.matches)return h/2;
if(tablet.matches){
var b=(parseFloat(getComputedStyle(visual).top)||0)+visual.offsetHeight;
return b+(h-b)/3;
}
return null;
};
var inside=[false,false,false],io=null;
var cross=function(entries){
entries.forEach(function(e){inside[stages.indexOf(e.target)]=e.isIntersecting;});
var n=0;
inside.forEach(function(v,i){if(v)n=i+1;});
if(!n)n=stages[0].getBoundingClientRect().top>(line()||0)?1:3;
set(n);
if(!settled){
settled=true;
requestAnimationFrame(function(){requestAnimationFrame(function(){map.classList.remove('is-init');});});
}
};
var watch=function(){
if(io)io.disconnect();
inside=[false,false,false];
var y=line();
if(y===null){set(3);return;}
var h=window.innerHeight,a=Math.max(0,Math.min(h-1,Math.round(y)));
io=new IntersectionObserver(cross,{rootMargin:(-a)+'px 0px '+(-(h-a-1))+'px 0px'});
stages.forEach(function(li){io.observe(li);});
};
new IntersectionObserver(function(entries){
entries.forEach(function(e){
seen=e.intersectionRatio>=0.8;
if(!e.isIntersecting)pulsed=false;
pulseIfSeen();
});
},{threshold:[0,0.8]}).observe(map);
if(phoneFig){
var phoneDone=false;
new IntersectionObserver(function(entries){
entries.forEach(function(e){
if(!e.isIntersecting){phoneDone=false;return;}
if(e.intersectionRatio>=0.8&&!phoneDone&&getComputedStyle(phoneFig).display!=='none'){phoneDone=true;pulse(phoneFig);}
});
},{threshold:[0,0.8]}).observe(phoneFig);
}
story.setAttribute('data-motion','');
map.classList.add('is-init');
set(1);
watch();
var timer=0;
var rewatch=function(){clearTimeout(timer);timer=setTimeout(watch,150);};
window.addEventListener('resize',rewatch);
[wide,tablet].forEach(function(q){
if(q.addEventListener)q.addEventListener('change',rewatch);else if(q.addListener)q.addListener(rewatch);
});
})();
