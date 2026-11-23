(function(root,factory){
'use strict';
var api=factory();
if(typeof module==='object'&&module.exports)module.exports=api;
if(root)root.AWWaterbodies=api;
})(typeof window!=='undefined'?window:null,function(){
'use strict';
var MAX_RESULTS=8;
function normalize(s){
return String(s).toLowerCase().normalize('NFD')
.replace(/\p{M}/gu,'')
.replace(/[^\p{L}\p{N}]+/gu,' ')
.trim();
}
function normalizeCode(s){
return String(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu,'');
}
function shardKey(word){
var c0=word.charAt(0);
if(!/[a-z0-9]/.test(c0))return'_';
var c1=word.charAt(1);
return c0+(c1&&/[a-z0-9]/.test(c1)?c1:'_');
}
function prepare(records){
for(var i=0;i<records.length;i++){
var r=records[i];
if(r._n===undefined){
r._n=r.name?normalize(r.name):'';
r._w=r._n?r._n.split(' '):[];
r._c=normalizeCode(r.code);
}
}
return records;
}
var collators={};
function collatorFor(lang){
if(!collators[lang]){
try{collators[lang]=new Intl.Collator(lang);}
catch(e){collators[lang]=new Intl.Collator();}
}
return collators[lang];
}
function countryPriority(cc){return cc==='NL'?0:cc==='BE'?1:2;}
function wordPrefix(words,q){
for(var i=0;i<words.length;i++)if(words[i].lastIndexOf(q,0)===0)return true;
return false;
}
function wordEquals(words,q){
for(var i=0;i<words.length;i++)if(words[i]===q)return true;
return false;
}
function nameClass(rec,qn,qw,withCountry){
var n=rec._n,w=rec._w,i;
if(!n)return 0;
if(withCountry){
for(i=0;i<qw.length;i++)if(n.indexOf(qw[i])<0)return 0;
}else{
for(i=0;i<qw.length;i++)if(!wordPrefix(w,qw[i]))return 0;
}
if(n===qn)return 3;
var allEqual=true;
for(i=0;i<qw.length;i++)if(!wordEquals(w,qw[i])){allEqual=false;break;}
if(allEqual)return 4;
if(n.lastIndexOf(qn,0)===0)return 5;
var allPrefix=true;
for(i=0;i<qw.length;i++)if(!wordPrefix(w,qw[i])){allPrefix=false;break;}
return allPrefix?6:7;
}
function rank(records,query,opts){
opts=opts||{};
var withCountry=!!opts.country;
var countryNames=opts.countryNames||{};
var collator=collatorFor(opts.lang||'nl');
var qn=normalize(query);
var qw=qn?qn.split(' '):[];
var qc=normalizeCode(query);
var hasDigit=/[0-9]/.test(qc);
var useName=!opts.codeOnly&&qw.length>0;
var seen=new Set();
var matches=[];
prepare(records);
function collect(useCode,nameToo){
for(var i=0;i<records.length;i++){
var rec=records[i];
var cls=0;
if(useCode){
if(rec._c===qc)cls=1;
else if(rec._c.lastIndexOf(qc,0)===0)cls=2;
}
if(!cls&&nameToo)cls=nameClass(rec,qn,qw,withCountry);
if(!cls||seen.has(rec.key))continue;
seen.add(rec.key);
matches.push({rec:rec,cls:cls});
}
}
var codeOk=opts.codeMatch!==false&&qc.length>=2;
collect(codeOk&&(hasDigit||!!opts.codeOnly),useName);
if(!matches.length&&!hasDigit&&!opts.codeOnly&&opts.codeFallback&&codeOk)collect(true,false);
matches.sort(function(a,b){
if(a.cls!==b.cls)return a.cls-b.cls;
var ra=a.rec,rb=b.rec;
if(ra.name.length!==rb.name.length)return ra.name.length-rb.name.length;
var pa=countryPriority(ra.cc),pb=countryPriority(rb.cc);
if(pa!==pb)return pa-pb;
if(ra.cc!==rb.cc){
var d=collator.compare(countryNames[ra.cc]||ra.cc,countryNames[rb.cc]||rb.cc);
if(d)return d;
}
return ra.code<rb.code?-1:ra.code>rb.code?1:0;
});
var results=[];
for(var k=0;k<matches.length&&k<MAX_RESULTS;k++){
var m=matches[k].rec;
results.push({key:m.key,cc:m.cc,code:m.code,name:m.name,manager:m.manager||''});
}
return{results:results,more:matches.length>MAX_RESULTS};
}
function createSearch(config){
config=config||{};
var base=config.base||'';
if(base&&base.charAt(base.length-1)!=='/')base+='/';
var doFetch=config.fetch||(typeof fetch==='function'?fetch.bind(null):null);
var lang=config.lang==='en'?'en':'nl';
var cache={};
var versionPromise=null;
var seq=0;
function getJSON(url){
if(!cache[url]){
var p=Promise.resolve().then(function(){return doFetch(url);}).then(function(res){
if(!res||!res.ok)throw new Error('Could not load '+url);
return res.json();
});
cache[url]=p;
p.catch(function(){if(cache[url]===p)delete cache[url];});
}
return cache[url];
}
function getVersion(){
if(!versionPromise){
versionPromise=getJSON(base+'current.json').then(function(c){
if(!c||!c.version)throw new Error('current.json has no version');
return String(c.version);
});
versionPromise.catch(function(){versionPromise=null;});
}
return versionPromise;
}
var versionValue='';
function getFile(path){
return getVersion().then(function(v){versionValue=v;return getJSON(base+v+'/'+path);});
}
var countriesPromise=null;
function getCountries(){
if(!countriesPromise){
var p=getFile('countries.json').then(function(list){
var names={},codes={};
list.forEach(function(c){names[c.code]=c[lang];codes[c.code]=true;});
return{names:names,codes:codes,list:list};
});
countriesPromise=p;
p.catch(function(){if(countriesPromise===p)countriesPromise=null;});
}
return countriesPromise;
}
var manifestPromise=null;
function getManifest(){
if(!manifestPromise){
var p=getFile('manifest.json').then(function(m){
var files={};
(m.files||[]).forEach(function(f){files[f]=true;});
return files;
});
manifestPromise=p;
p.catch(function(){if(manifestPromise===p)manifestPromise=null;});
}
return manifestPromise;
}
var prepared={};
function getRecords(path,withCc){
if(!prepared[path]){
var p=getFile(path).then(function(d){
var m=d.m||[];
var recs=d.r.map(function(r){
var cc=withCc?r[0]:d.cc;
var code=withCc?r[1]:r[0];
var name=withCc?r[2]:r[1];
var mgr=withCc?r[3]:r[2];
var row=withCc?r[4]:r[3];
var key=cc+':'+code+(row!=null&&row!==''?'#'+row:'');
return{key:key,cc:cc,code:code,name:name,manager:mgr>=0?m[mgr]||'':''};
});
delete cache[base+versionValue+'/'+path];
return prepare(recs);
});
prepared[path]=p;
p.catch(function(){if(prepared[path]===p)delete prepared[path];});
}
return prepared[path];
}
function run(q,country){
return getCountries().then(function(meta){
var cc=country?String(country).toUpperCase():null;
var opts={country:cc,lang:lang,countryNames:meta.names};
function byCountry(code,extra){
var path='c/'+code+'.json';
if(!meta.codes[code])return Promise.resolve({results:[],more:false});
return getRecords(path,false).then(function(recs){
var o={country:extra.country,lang:lang,countryNames:meta.names,codeOnly:extra.codeOnly,codeFallback:extra.codeFallback};
return rank(recs,q,o);
});
}
function byName(){
var words=normalize(q).split(' ').filter(Boolean);
var first=null;
for(var i=0;i<words.length;i++)if(words[i].length>=2){first=words[i];break;}
if(first===null)return Promise.resolve({results:[],more:false});
var path='w/'+shardKey(first)+'.json';
return getManifest().then(function(files){
if(!files[path])return null;
return getRecords(path,true);
}).then(function(recs){
if(!recs)return{results:[],more:false};
return rank(recs,q,{country:null,lang:lang,countryNames:meta.names,codeMatch:false});
});
}
if(cc){
var own=normalizeCode(q);
return byCountry(cc,{country:cc,codeOnly:false,codeFallback:own.length>=3&&own.slice(0,2)===cc.toLowerCase()});
}
var qc=normalizeCode(q);
var looksLikeCode=qc.length>=3&&/[0-9]/.test(qc)&&meta.codes[qc.slice(0,2).toUpperCase()]===true;
var codeCountry=qc.length>=3&&meta.codes[qc.slice(0,2).toUpperCase()]===true
?qc.slice(0,2).toUpperCase():null;
function codeOnly(){return byCountry(codeCountry,{country:null,codeOnly:true});}
if(looksLikeCode){
return codeOnly().then(function(r){return r.results.length?r:byName();});
}
return byName().then(function(r){
return r.results.length||!codeCountry?r:codeOnly();
});
});
}
function query(q,country){
var id=++seq;
var text=String(q==null?'':q).trim();
if(text.length<2)return Promise.resolve({results:[],more:false});
return run(text,country).then(function(out){return out;},function(){
return{results:[],more:false,error:true};
}).then(function(out){
return id===seq?out:{stale:true,results:[],more:false};
});
}
function countries(){
return getCountries().then(function(meta){
return meta.list.map(function(c){return{code:c.code,name:c[lang],nl:c.nl,en:c.en,count:c.count};})
.sort(function(a,b){return a.name.localeCompare(b.name,lang);});
});
}
return{query:query,countries:countries,version:getVersion};
}
return{
normalize:normalize,
normalizeCode:normalizeCode,
shardKey:shardKey,
prepare:prepare,
rank:rank,
createSearch:createSearch
};
});
