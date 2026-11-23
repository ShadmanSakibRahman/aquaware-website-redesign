(function(root,factory){
'use strict';
var api=factory();
if(typeof module==='object'&&module.exports)module.exports=api;
root.AWAanvraag=Object.assign(root.AWAanvraag||{},api);
}(typeof window!=='undefined'?window:(typeof globalThis!=='undefined'?globalThis:this),function(){
'use strict';
var SOURCE_IDS=['all','industrie','agrarisch','rwzi','overstort','historisch','overig'];
var SUBSTANCE_IDS=['krw','metingen','overig','zzs','specifiek'];
var FIELD_ORDER=['waterbody','sources','substances','specificText','naam','organisatie','email'];
var EMAIL_RE=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
var MAX_MANUAL=200;
var MIN_MANUAL=3;
var MAX_SPECIFIC=300;
var SUBJECT_PREFIX='Aanvraag Waterlichaam-Bronnenanalyse – ';
var MAILTO_MAX=1800;
var BACKGROUND_NL='meegenomen waar betrouwbare gegevens beschikbaar zijn';
var STRINGS={
nl:{
err_waterbody:'Selecteer een waterlichaam of voer zelf een naam in.',
err_sources:'Kies ten minste één broncategorie.',
err_substances:'Kies ten minste één stofgroep.',
err_specific:'Vul de stoffen in die u wilt onderzoeken.',
err_name:'Vul uw naam in.',
err_org:'Vul uw organisatie in.',
err_email:'Vul een geldig e-mailadres in, bijvoorbeeld naam@waterschap.nl.',
summary_one:'Controleer 1 veld: {fields}',
summary_many:'Controleer {n} velden: {fields}',
field_waterbody:'waterlichaam',
field_sources:'bronnen',
field_substances:'stoffen',
field_specificText:'specifieke stoffen',
field_naam:'naam',
field_organisatie:'organisatie',
field_email:'zakelijk e-mailadres',
send_failed:'Verzenden is niet gelukt. Uw keuzes zijn bewaard; probeer het opnieuw of mail naar info@aquaware.nl.',
success_title:'Bedankt, uw aanvraag is verstuurd.',
success_text:'We nemen contact met u op om de onderzoeksopzet en mogelijkheden te bespreken.',
success_contact:'Liever eerst bellen of mailen? info@aquaware.nl',
recap_title:'Uw aanvraag',
summary_title:'Uw geselecteerde analyse',
search_more:'Meer resultaten gevonden. Typ verder of kies een land.',
search_none:'Geen waterlichaam gevonden. Voer het zelf in of kies een ander land.',
load_failed:'De lijst met waterlichamen kon niet worden geladen. U kunt het waterlichaam zelf invoeren.',
cleared:'Uw keuze is gewist omdat u een ander land koos.',
name_unknown:'Naam onbekend',
all_countries:'Alle landen',
mail_fallback:'Uw e-mailprogramma wordt geopend met uw aanvraag. Lukt dat niet? Mail naar info@aquaware.nl.',
lbl_country:'Land',
lbl_waterbody:'Waterlichaam',
lbl_code:'Waterlichaamcode',
lbl_manager:'Waterbeheerder',
lbl_method:'Invoerwijze',
lbl_sources:'Bronnen',
lbl_substances:'Stoffen',
lbl_background:'Achtergrondbelasting',
v_not_specified:'Niet opgegeven',
v_not_available:'Niet beschikbaar',
v_from_database:'Geselecteerd uit database',
v_manual:'Handmatig ingevoerd',
v_all_sources:'alle relevante bronnen',
v_background:BACKGROUND_NL,
v_not_selected:'nog niet gekozen',
v_specific:'specifiek: {text}',
v_specific_bare:'specifiek',
src_all:'Alle relevante bronnen meenemen',
src_industrie:'Industriële lozingen (direct en indirect)',
src_agrarisch:'Agrarische bronnen',
src_rwzi:'RWZI-lozingen',
src_overstort:'Riooloverstorten',
src_historisch:'Historische verontreiniging',
src_overig:'Overige bronnen',
srcs_industrie:'industriële lozingen',
srcs_agrarisch:'agrarische bronnen',
srcs_rwzi:'RWZI-lozingen',
srcs_overstort:'riooloverstorten',
srcs_historisch:'historische verontreiniging',
srcs_overig:'overige bronnen',
sub_krw:'KRW-probleemstoffen van dit waterlichaam',
sub_metingen:'Stoffen uit beschikbare waterkwaliteitsmetingen',
sub_overig:'Overige KRW-stoffen',
sub_zzs:'Zeer zorgwekkende stoffen (ZZS)',
sub_specifiek:'Specifieke stoffen',
subs_krw:'KRW-probleemstoffen',
subs_metingen:'stoffen uit metingen',
subs_overig:'overige KRW-stoffen',
subs_zzs:'ZZS'
},
en:{
err_waterbody:'Select a waterbody or enter a name manually.',
err_sources:'Select at least one source category.',
err_substances:'Select at least one substance group.',
err_specific:'Enter the substances you want to investigate.',
err_name:'Please enter your name.',
err_org:'Please enter your organisation.',
err_email:'Please enter a valid email address, e.g. name@organisation.eu.',
summary_one:'Please check 1 field: {fields}',
summary_many:'Please check {n} fields: {fields}',
field_waterbody:'waterbody',
field_sources:'sources',
field_substances:'substances',
field_specificText:'specific substances',
field_naam:'name',
field_organisatie:'organisation',
field_email:'business email',
send_failed:'Sending failed. Your choices are kept; please try again or email info@aquaware.nl.',
success_title:'Thank you — your request has been sent.',
success_text:'We will contact you to discuss the research design and options.',
success_contact:'Prefer to call or email first? info@aquaware.nl',
recap_title:'Your request',
summary_title:'Your selected analysis',
search_more:'More results found. Keep typing or choose a country.',
search_none:'No waterbody found. Enter it manually or choose another country.',
load_failed:'The list of waterbodies could not be loaded. You can enter the waterbody manually.',
cleared:'Your selection was cleared because you chose another country.',
name_unknown:'Name unknown',
all_countries:'All countries',
mail_fallback:'Your email program opens with your request. Not working? Email info@aquaware.nl.',
lbl_country:'Country',
lbl_waterbody:'Waterbody',
lbl_code:'Waterbody code',
lbl_manager:'Water manager',
lbl_method:'Entry method',
lbl_sources:'Sources',
lbl_substances:'Substances',
lbl_background:'Background load',
v_not_specified:'Not specified',
v_not_available:'Not available',
v_from_database:'Selected from database',
v_manual:'Entered manually',
v_all_sources:'all relevant sources',
v_background:'included where reliable data are available',
v_not_selected:'not yet selected',
v_specific:'specific: {text}',
v_specific_bare:'specific',
src_all:'Include all relevant sources',
src_industrie:'Industrial discharges (direct and indirect)',
src_agrarisch:'Agricultural sources',
src_rwzi:'WWTP discharges',
src_overstort:'Combined sewer overflows',
src_historisch:'Historical contamination',
src_overig:'Other sources',
srcs_industrie:'industrial discharges',
srcs_agrarisch:'agricultural sources',
srcs_rwzi:'WWTP discharges',
srcs_overstort:'combined sewer overflows',
srcs_historisch:'historical contamination',
srcs_overig:'other sources',
sub_krw:'WFD problem substances of this waterbody',
sub_metingen:'Substances from available water quality monitoring',
sub_overig:'Other WFD substances',
sub_zzs:'Substances of very high concern (ZZS)',
sub_specifiek:'Specific substances',
subs_krw:'WFD problem substances',
subs_metingen:'substances from monitoring',
subs_overig:'other WFD substances',
subs_zzs:'ZZS'
}
};
function t(lang,key,vars){
var table=STRINGS[lang]||STRINGS.nl;
var s=Object.prototype.hasOwnProperty.call(table,key)?table[key]:key;
if(vars){
s=s.replace(/\{(\w+)\}/g,function(m,k){return Object.prototype.hasOwnProperty.call(vars,k)?String(vars[k]):m;});
}
return s;
}
function initialState(){
return{
country:null,mode:'search',record:null,manualText:'',searchText:'',
sources:{all:true,industrie:true,agrarisch:true,rwzi:true,overstort:true,historisch:true,overig:true},
substances:{krw:true,metingen:false,overig:false,zzs:false,specifiek:false},
specificText:'',
contact:{naam:'',organisatie:'',email:'',toelichting:''},
attempted:false
};
}
function copy(state,changes){return Object.assign({},state,changes);}
function clean(v){
var x=v==null?'':String(v);
return x.replace(/[\ud800-\udbff][\udc00-\udfff]|([\ud800-\udfff])/g,function(m,lone){return lone?'':m;});
}
function cut(v,n){
var chars=Array.from(clean(v));
return chars.length>n?chars.slice(0,n).join(''):chars.join('');
}
function trim(v){return clean(v).trim();}
function setCountry(state,code){
var country=code||null;
var next=copy(state,{country:country});
var notice=null;
var rec=state.record;
if(rec&&country&&country!==rec.cc){
next.record=null;
if(state.mode==='search')notice='cleared';
}
return{state:next,notice:notice};
}
function setMode(state,mode){return copy(state,{mode:mode==='manual'?'manual':'search'});}
function normaliseRecord(r){
if(!r)return null;
var cc=clean(r.cc),code=clean(r.code);
if(!cc||!code)return undefined;
return{key:clean(r.key)||cc+':'+code,cc:cc,code:code,name:clean(r.name),manager:clean(r.manager)};
}
function selectRecord(state,record){
var rec=normaliseRecord(record);
if(rec===undefined)return state;
return copy(state,{record:rec});
}
function clearRecord(state){return copy(state,{record:null});}
function setManualText(state,text){return copy(state,{manualText:cut(text,MAX_MANUAL)});}
function setSpecificText(state,text){return copy(state,{specificText:cut(text,MAX_SPECIFIC)});}
var CONTACT_MAX={naam:120,organisatie:120,email:254,toelichting:2000};
function setContact(state,field,value){
var c=Object.assign({},state.contact);
c[field]=cut(value,CONTACT_MAX[field]||2000);
return copy(state,{contact:c});
}
function toggleSource(state,id,checked){
var cats=SOURCE_IDS.slice(1);
var src=Object.assign({},state.sources);
if(id==='all'){
if(!checked)return state;
SOURCE_IDS.forEach(function(k){src[k]=true;});
return copy(state,{sources:src});
}
if(cats.indexOf(id)<0)return state;
if(!checked){
var others=cats.filter(function(k){return k!==id&&src[k];});
if(!others.length)return state;
src[id]=false;
src.all=false;
}else{
src[id]=true;
src.all=cats.every(function(k){return src[k];});
}
return copy(state,{sources:src});
}
function toggleSubstance(state,id,checked){
if(SUBSTANCE_IDS.indexOf(id)<0)return state;
var sub=Object.assign({},state.substances);
if(!checked){
var others=SUBSTANCE_IDS.filter(function(k){return k!==id&&sub[k];});
if(!others.length)return state;
}
sub[id]=!!checked;
return copy(state,{substances:sub});
}
function validate(state){
var e={};
var wb=state.mode==='manual'?trim(state.manualText).length>=MIN_MANUAL:!!state.record;
if(!wb)e.waterbody='err_waterbody';
if(!SOURCE_IDS.some(function(k){return state.sources[k];}))e.sources='err_sources';
if(!SUBSTANCE_IDS.some(function(k){return state.substances[k];}))e.substances='err_substances';
if(state.substances.specifiek&&!trim(state.specificText))e.specificText='err_specific';
if(!trim(state.contact.naam))e.naam='err_name';
if(!trim(state.contact.organisatie))e.organisatie='err_org';
if(!EMAIL_RE.test(trim(state.contact.email)))e.email='err_email';
return e;
}
function errorSummary(errors,lang){
var fields=FIELD_ORDER.filter(function(f){return Object.prototype.hasOwnProperty.call(errors,f);});
if(!fields.length)return'';
var names=fields.map(function(f){return t(lang,'field_'+f);}).join(', ');
return fields.length===1
?t(lang,'summary_one',{fields:names})
:t(lang,'summary_many',{n:fields.length,fields:names});
}
function countryName(countries,code,field){
var list=countries||[];
for(var i=0;i<list.length;i++){
if(list[i].code===code)return clean((field&&list[i][field])||list[i].name||code);
}
return clean(code);
}
function activeRecord(state){return state.mode==='search'&&state.record?state.record:null;}
function sourcesText(state,lang){
if(state.sources.all)return t(lang,'v_all_sources');
return SOURCE_IDS.slice(1).filter(function(k){return state.sources[k];})
.map(function(k){return t(lang,'srcs_'+k);}).join(', ');
}
function substancesText(state,lang){
return SUBSTANCE_IDS.filter(function(k){return state.substances[k];}).map(function(k){
if(k!=='specifiek')return t(lang,'subs_'+k);
var txt=trim(state.specificText);
return txt?t(lang,'v_specific',{text:txt}):t(lang,'v_specific_bare');
}).join(', ');
}
function summaryLines(state,lang,countries){
var rec=activeRecord(state);
var manual=state.mode==='manual';
var typed=trim(state.manualText);
var lines=[];
function add(id,value){lines.push({id:id,label:t(lang,'lbl_'+id),value:value});}
if(!rec&&!(manual&&typed.length>=1)){
if(state.country)add('country',countryName(countries,state.country));
add('waterbody',t(lang,'v_not_selected'));
}else{
var chosen=state.country?countryName(countries,state.country):t(lang,'v_not_specified');
add('country',rec?countryName(countries,rec.cc):chosen);
add('waterbody',rec?(clean(rec.name)||t(lang,'name_unknown')):typed);
add('code',rec&&clean(rec.code)?clean(rec.code):t(lang,'v_not_available'));
if(rec&&clean(rec.manager))add('manager',clean(rec.manager));
add('method',t(lang,manual?'v_manual':'v_from_database'));
}
add('sources',sourcesText(state,lang));
add('substances',substancesText(state,lang));
add('background',t(lang,'v_background'));
return lines;
}
function emailParams(state,lang,meta,countries){
var rec=activeRecord(state);
var m=meta||{};
var name,code,manager,cc,cname,method;
if(rec){
name=clean(rec.name)||t('nl','name_unknown');
code=clean(rec.code);manager=clean(rec.manager);cc=clean(rec.cc);
cname=countryName(countries,rec.cc,'nl');method='database';
}else{
name=trim(state.manualText);code='';manager='';
cc=clean(state.country);
cname=state.country?countryName(countries,state.country,'nl'):t('nl','v_not_specified');
method='handmatig';
}
var subjName=rec&&!clean(rec.name)?code:name;
var chars=Array.from(subjName);
if(chars.length>120)subjName=chars.slice(0,120).join('')+'…';
return{
country_code:cc,
country_name:cname,
waterbody_name:name,
waterbody_code:code,
water_manager:manager,
entry_method:method,
sources:sourcesText(state,'nl'),
substances:substancesText(state,'nl'),
specific_substances:state.substances.specifiek?trim(state.specificText):'',
background_load:BACKGROUND_NL,
name:trim(state.contact.naam),
organisation:trim(state.contact.organisatie),
email:trim(state.contact.email),
message:trim(state.contact.toelichting),
language:lang==='en'?'EN':'NL',
cta_source:clean(m.cta_source),
page:clean(m.page),
dataset_version:clean(m.dataset_version),
subject:SUBJECT_PREFIX+subjName
};
}
function shorten(v,n){
var chars=Array.from(v);
return chars.length<=n?v:chars.slice(0,n-1).join('')+'…';
}
function mailtoUrl(params,lang){
var f={
country:clean(params.country_name),wb:clean(params.waterbody_name),code:clean(params.waterbody_code),
manager:clean(params.water_manager),method:clean(params.entry_method),sources:clean(params.sources),
substances:clean(params.substances),spec:clean(params.specific_substances),
background:clean(params.background_load),name:clean(params.name),org:clean(params.organisation),
email:clean(params.email),lang:clean(params.language),page:clean(params.page)
};
var subject=clean(params.subject);
var message=clean(params.message);
var MIN_FIELD=60;
function head(){
var lines=['Land: '+f.country,'Waterlichaam: '+f.wb,'Waterlichaamcode: '+f.code];
if(f.manager)lines.push('Waterbeheerder: '+f.manager);
lines.push('Invoerwijze: '+f.method,'Bronnen: '+f.sources,'Stoffen: '+f.substances,
'Achtergrondbelasting: '+f.background,'Naam: '+f.name,'Organisatie: '+f.org,
'E-mail: '+f.email,'Taal: '+f.lang,'Pagina: '+f.page);
return lines.join('\n');
}
var prefix='mailto:info@aquaware.nl?subject='+encodeURIComponent(subject)+'&body=';
function build(msg){return prefix+encodeURIComponent(msg?head()+'\n\n'+msg:head());}
var url=build(message);
if(url.length<=MAILTO_MAX)return url;
var tail=message?' […]':'';
function fitField(get,set){
if(build(tail).length<=MAILTO_MAX)return;
var orig=get(),n=Array.from(orig).length;
if(n<=MIN_FIELD)return;
var lo=MIN_FIELD,hi=n-1;
while(lo<hi){
var mid=(lo+hi+1)>>1;
set(shorten(orig,mid));
if(build(tail).length<=MAILTO_MAX)lo=mid;else hi=mid-1;
}
set(shorten(orig,lo));
}
fitField(function(){return f.org;},function(v){f.org=v;});
fitField(function(){return f.name;},function(v){f.name=v;});
fitField(function(){return f.wb;},function(v){f.wb=v;});
if(f.spec&&f.substances.slice(-f.spec.length)===f.spec){
var base=f.substances.slice(0,f.substances.length-f.spec.length);
fitField(function(){return f.spec;},function(v){f.spec=v;f.substances=base+v;});
}
if(!message)return build('');
var chars=Array.from(message);
var lo=0,hi=chars.length;
while(lo<hi){
var mid=(lo+hi+1)>>1;
if(build(chars.slice(0,mid).join('')+' […]').length<=MAILTO_MAX)lo=mid;else hi=mid-1;
}
return build(chars.slice(0,lo).join('')+' […]');
}
Object.assign(STRINGS.nl,{
sending:'Bezig met verzenden…',
results_one:'1 suggestie',
results_many:'{n} suggesties',
selected:'Gekozen: {name}, {meta}'
});
Object.assign(STRINGS.en,{
sending:'Sending…',
results_one:'1 suggestion',
results_many:'{n} suggestions',
selected:'Selected: {name}, {meta}'
});
var EMAILJS_URL='https://api.emailjs.com/api/v1.0/email/send';
var CONTACT_MAIL='info@aquaware.nl';
var DEBOUNCE=150;
function globalApi(){return typeof window!=='undefined'&&window.AWAanvraag?window.AWAanvraag:null;}
function openMail(url){window.location.href=url;}
function fold(s){
var out='',map=[],pos=0;
Array.from(s).forEach(function(ch){
var f=ch.toLowerCase().normalize('NFD').replace(/\p{M}/gu,'').replace(/[^\p{L}\p{N}]/gu,' ');
for(var k=0;k<f.length;k++){out+=f.charAt(k);map.push([pos,pos+ch.length]);}
pos+=ch.length;
});
return{s:out,map:map};
}
function matchRanges(name,query){
var f=fold(name);
var words=fold(query).s.split(' ').filter(Boolean);
var ranges=[];
words.forEach(function(w){
var at=-1,i=f.s.indexOf(w);
while(i>=0){
if(i===0||f.s.charAt(i-1)===' '){at=i;break;}
if(at<0)at=i;
i=f.s.indexOf(w,i+1);
}
if(at>=0)ranges.push([f.map[at][0],f.map[at+w.length-1][1]]);
});
ranges.sort(function(a,b){return a[0]-b[0];});
var merged=[];
ranges.forEach(function(r){
var last=merged[merged.length-1];
if(last&&(r[0]<=last[1]||!/[\p{L}\p{N}]/u.test(name.slice(last[1],r[0]))))last[1]=Math.max(last[1],r[1]);
else merged.push([r[0],r[1]]);
});
return merged;
}
function fillMarked(doc,el,text,ranges){
var at=0;
ranges.forEach(function(r){
if(r[0]>at)el.appendChild(doc.createTextNode(text.slice(at,r[0])));
var b=doc.createElement('strong');
b.textContent=text.slice(r[0],r[1]);
el.appendChild(b);
at=r[1];
});
if(at<text.length)el.appendChild(doc.createTextNode(text.slice(at)));
}
function codeRange(code,query){
var qc=String(query).toLowerCase().replace(/[^\p{L}\p{N}]+/gu,'');
var cc=String(code).toLowerCase().replace(/[^\p{L}\p{N}]+/gu,'');
if(qc.length<2||cc.indexOf(qc)!==0)return[];
var seen=0,end=0,chars=Array.from(code);
for(var i=0;i<chars.length&&seen<qc.length;i++){
end+=chars[i].length;
if(/[\p{L}\p{N}]/u.test(chars[i]))seen+=1;
}
return[[0,end]];
}
function mount(form,opts){
if(!form)return null;
if(form.aanvraag)return form.aanvraag;
opts=opts||{};
var doc=form.ownerDocument,win=doc.defaultView;
var lang=opts.lang==='en'?'en':'nl';
var search=opts.search||null;
var T=function(k,v){return t(lang,k,v);};
var $=function(s){return form.querySelector(s);};
var mk=function(tag,cls,text){
var n=doc.createElement(tag);
if(cls)n.className=cls;
if(text!=null)n.textContent=text;
return n;
};
var el={
card1:$('#aanvraag-stap-1'),country:$('#aanvraag-land'),input:$('#waterbody-search'),
selected:$('[data-req-selected]'),selName:$('.ba-req__selname'),selMeta:$('.ba-req__selmeta'),clear:$('[data-req-clear]'),
list:$('[data-req-list]'),options:$('[data-req-list] [role=listbox]'),more:$('[data-req-more]'),none:$('[data-req-none]'),
help:$('[data-req-help]'),load:$('[data-req-load]'),live:$('[data-req-live]'),
searchPanel:$('[data-req-searchpanel]'),manualPanel:$('[data-req-manualpanel]'),manualBtn:$('[data-req-manual]'),back:$('[data-req-back]'),
manual:$('#aanvraag-handmatig'),specificWrap:$('[data-req-specific]'),specific:$('#aanvraag-specifiek'),
errors:$('[data-req-errors]'),errorsText:$('[data-req-errors] p'),summary:$('[data-req-summary]'),change:$('[data-req-change]'),
side:$('.ba-req__side'),submit:$('[data-req-submit]'),fail:$('[data-req-fail]'),mail:$('[data-req-mail]'),
trap:$('input[name=website]'),done:form.parentNode.querySelector('[data-req-done]'),
naam:$('#aanvraag-naam'),organisatie:$('#aanvraag-organisatie'),email:$('#aanvraag-email'),toelichting:$('#aanvraag-toelichting')
};
var sourceBoxes=[].slice.call(form.querySelectorAll('input[name=bronnen]'));
var substanceBoxes=[].slice.call(form.querySelectorAll('input[name=stoffen]'));
var submitLabel=el.submit.textContent;
var state=initialState();
var countries=[];
var countriesReq=null;
var loadFailed=false;
var notice=null;
var refused={sources:false,substances:false};
var sending=false;
var ctaSource='direct';
var lastLive='';
var list={items:[],active:-1,token:0,timer:0,text:'',pressing:false};
[].forEach.call(form.querySelectorAll('[data-t]'),function(n){n.textContent=T(n.getAttribute('data-t'));});
if(el.country.options[0])el.country.options[0].textContent=T('all_countries');
function announce(text){
lastLive=text===lastLive?text+' ':text;
el.live.textContent=lastLive;
}
function setLoadFailed(on){
loadFailed=!!on;
el.load.textContent=on?T('load_failed'):'';
}
function loadCountries(){
if(!search){setLoadFailed(true);return Promise.resolve([]);}
if(countries.length)return Promise.resolve(countries);
if(!countriesReq){
countriesReq=search.countries().then(function(items){
countries=items;
var frag=doc.createDocumentFragment();
items.forEach(function(c){var o=mk('option',null,c.name);o.value=c.code;frag.appendChild(o);});
el.country.appendChild(frag);
setLoadFailed(false);
renderSearch();renderSummary();
if(!el.list.hidden)runQuery(true);
return countries;
},function(){
countriesReq=null;
setLoadFailed(true);
return[];
});
}
return countriesReq;
}
function countryLabel(cc){return countryName(countries,cc);}
function metaLine(r){
return clean(r.code)+' · '+countryLabel(r.cc)+(clean(r.manager)?' · '+clean(r.manager):'');
}
function displayName(r){return clean(r.name)||T('name_unknown');}
function setActive(i){
var opts=el.options.children;
if(list.active>=0&&opts[list.active]){opts[list.active].setAttribute('aria-selected','false');opts[list.active].classList.remove('is-active');}
list.active=i;
if(i>=0&&opts[i]){
opts[i].setAttribute('aria-selected','true');
opts[i].classList.add('is-active');
el.input.setAttribute('aria-activedescendant',opts[i].id);
var o=opts[i].getBoundingClientRect(),v=win.innerHeight;
if(o.bottom>v||o.top<0)opts[i].scrollIntoView({block:'nearest'});
}else{
el.input.removeAttribute('aria-activedescendant');
}
}
function closeList(){
win.clearTimeout(list.timer);
list.token+=1;
el.list.hidden=true;
el.input.setAttribute('aria-expanded','false');
setActive(-1);
}
function showResults(out,text){
list.items=out.results;
list.text=text;
list.active=-1;
el.options.textContent='';
el.input.removeAttribute('aria-activedescendant');
out.results.forEach(function(r,i){
var li=mk('li','ba-req__option');
li.id='aanvraag-optie-'+i;
li.setAttribute('role','option');
li.setAttribute('aria-selected','false');
li.setAttribute('data-key',r.key);
var name=mk('span','ba-req__optname');
if(clean(r.name))fillMarked(doc,name,clean(r.name),matchRanges(clean(r.name),text));
else{name.textContent=T('name_unknown');name.classList.add('is-unknown');}
var meta=mk('span','ba-req__optmeta');
var code=clean(r.code);
fillMarked(doc,meta,code,codeRange(code,text));
meta.appendChild(doc.createTextNode(metaLine(r).slice(code.length)));
li.appendChild(name);
li.appendChild(meta);
el.options.appendChild(li);
});
var none=!out.results.length;
el.options.hidden=none;
el.more.hidden=!out.more;
el.more.textContent=out.more?T('search_more'):'';
el.none.hidden=!none;
el.none.textContent=none?T('search_none'):'';
el.list.hidden=false;
el.input.setAttribute('aria-expanded',none?'false':'true');
announce(none?T('search_none'):out.results.length===1?T('results_one'):T('results_many',{n:out.results.length}));
}
function runQuery(now){
win.clearTimeout(list.timer);
var text=state.searchText.trim();
if(state.mode!=='search'||state.record||text.length<2){closeList();return;}
var go=function(){
var token=++list.token;
if(!search){setLoadFailed(true);return;}
search.query(text,state.country).then(function(out){
if(token!==list.token||out.stale)return;
if(out.error){setLoadFailed(true);el.list.hidden=true;el.input.setAttribute('aria-expanded','false');return;}
if(loadFailed)setLoadFailed(false);
if(!countries.length)loadCountries();
showResults(out,text);
});
};
if(now)go();else list.timer=win.setTimeout(go,DEBOUNCE);
}
function choose(i){
var rec=list.items[i];
if(!rec)return;
var next=selectRecord(state,rec);
if(next===state)return;
state=next;
notice=null;
closeList();
renderSearch();renderSummary();refreshError('waterbody');
announce(T('selected',{name:displayName(state.record),meta:metaLine(state.record)}));
el.selected.focus();
}
el.input.addEventListener('input',function(){
state=copy(state,{searchText:el.input.value});
if(notice){notice=null;renderSearch();}
runQuery(false);
});
el.input.addEventListener('keydown',function(e){
if(e.isComposing)return;
var k=e.key,open=!el.list.hidden&&list.items.length>0;
if(k==='ArrowDown'||k==='ArrowUp'){
e.preventDefault();
if(!open){if(state.searchText.trim().length>=2)runQuery(true);return;}
var n=list.items.length;
setActive(k==='ArrowDown'?(list.active+1)%n:(list.active<=0?n-1:list.active-1));
}else if(k==='Enter'){
e.preventDefault();
if(open&&list.active>=0)choose(list.active);
}else if(k==='Escape'){
if(!el.list.hidden){e.preventDefault();closeList();}
}else if(k==='Tab'){
closeList();
}
});
el.input.addEventListener('blur',function(){if(state.attempted)showError('waterbody');});
el.list.addEventListener('mousedown',function(e){e.preventDefault();});
el.list.addEventListener('pointerdown',function(){list.pressing=true;});
['pointerup','pointercancel'].forEach(function(type){
el.list.addEventListener(type,function(){win.setTimeout(function(){list.pressing=false;},400);});
});
el.options.addEventListener('click',function(e){
var li=e.target.closest?e.target.closest('[role=option]'):null;
if(li)choose([].indexOf.call(el.options.children,li));
});
el.card1.addEventListener('focusout',function(e){
var to=e.relatedTarget;
if(list.pressing||(to&&el.card1.contains(to)))return;
closeList();
});
el.clear.addEventListener('click',function(){
state=clearRecord(state);
renderSearch();renderSummary();refreshError('waterbody');
el.input.focus();
el.input.select();
});
var autoSize=!(win.CSS&&win.CSS.supports&&win.CSS.supports('field-sizing','content'));
function sizeManual(){
if(!autoSize)return;
el.manual.style.height='auto';
el.manual.style.height=el.manual.scrollHeight+2+'px';
}
el.manualBtn.addEventListener('click',function(){
closeList();
notice=null;
state=setMode(state,'manual');
el.manual.value=state.manualText;
renderSearch();renderSummary();refreshError('waterbody');
sizeManual();
el.manual.focus();
});
el.back.addEventListener('click',function(){
state=setMode(state,'search');
renderSearch();renderSummary();refreshError('waterbody');
(state.record?el.selected:el.input).focus();
});
el.manual.addEventListener('keydown',function(e){if(e.key==='Enter')e.preventDefault();});
el.manual.addEventListener('input',function(){
var v=el.manual.value.replace(/[\r\n]+/g,' ');
state=setManualText(state,v);
if(el.manual.value!==state.manualText)el.manual.value=state.manualText;
sizeManual();
renderSummary();refreshError('waterbody');
});
el.manual.addEventListener('blur',function(){if(state.attempted)showError('waterbody');});
el.country.addEventListener('change',function(){
var res=setCountry(state,el.country.value||null);
state=res.state;
if(res.notice)notice=res.notice;
renderSearch();renderSummary();refreshError('waterbody');
if(state.mode==='search'&&!state.record&&!el.list.hidden)runQuery(true);
});
function renderChecks(){
sourceBoxes.forEach(function(b){b.checked=!!state.sources[b.value];b.closest('label').classList.toggle('is-on',b.checked);});
substanceBoxes.forEach(function(b){b.checked=!!state.substances[b.value];b.closest('label').classList.toggle('is-on',b.checked);});
el.specificWrap.hidden=!state.substances.specifiek;
}
sourceBoxes.forEach(function(b){
b.addEventListener('change',function(){
var next=toggleSource(state,b.value,b.checked);
refused.sources=next===state;
state=next;
renderChecks();renderSummary();showError('sources');
});
});
substanceBoxes.forEach(function(b){
b.addEventListener('change',function(){
var next=toggleSubstance(state,b.value,b.checked);
refused.substances=next===state;
state=next;
renderChecks();renderSummary();showError('substances');
if(!state.substances.specifiek)setError('specificText',null);
});
});
el.specific.addEventListener('input',function(){
state=setSpecificText(state,el.specific.value);
renderSummary();refreshError('specificText');
});
el.specific.addEventListener('blur',function(){showError('specificText');});
['naam','organisatie','email','toelichting'].forEach(function(f){
el[f].addEventListener('input',function(){
state=setContact(state,f,el[f].value);
refreshError(f);
});
if(f!=='toelichting')el[f].addEventListener('blur',function(){showError(f);});
});
function errorPairs(field){
var id=function(s){return doc.getElementById(s);};
switch(field){
case'waterbody':return[[el.input,id('aanvraag-zoek-fout')],[el.manual,id('aanvraag-handmatig-fout')]];
case'sources':return[[null,id('aanvraag-bronnen-fout')]];
case'substances':return[[null,id('aanvraag-stoffen-fout')]];
case'specificText':return[[el.specific,id('aanvraag-specifiek-fout')]];
default:return[[el[field],id('aanvraag-'+field+'-fout')]];
}
}
function setError(field,key){
errorPairs(field).forEach(function(p){
if(!p[1])return;
p[1].textContent=key?T(key):'';
p[1].hidden=!key;
if(p[0]){if(key)p[0].setAttribute('aria-invalid','true');else p[0].removeAttribute('aria-invalid');}
});
}
function errorKey(field){
if(field==='sources'&&refused.sources)return'err_sources';
if(field==='substances'&&refused.substances)return'err_substances';
return validate(state)[field]||null;
}
function isShown(field){return errorPairs(field).some(function(p){return p[1]&&!p[1].hidden;});}
function showError(field){setError(field,errorKey(field));refreshSummary();}
function refreshError(field){if(isShown(field))setError(field,errorKey(field));refreshSummary();}
function fieldTarget(field){
switch(field){
case'waterbody':return state.mode==='manual'?el.manual:(state.record?el.selected:el.input);
case'sources':return sourceBoxes[0];
case'substances':return substanceBoxes[0];
case'specificText':return el.specific;
default:return el[field];
}
}
function renderErrorSummary(errs,focus){
var fields=FIELD_ORDER.filter(function(f){return Object.prototype.hasOwnProperty.call(errs,f);});
if(!fields.length){el.errors.hidden=true;el.errorsText.textContent='';return;}
var parts=T(fields.length===1?'summary_one':'summary_many',{n:fields.length}).split('{fields}');
el.errorsText.textContent='';
el.errorsText.appendChild(mk('strong',null,parts[0].replace(/\s+$/,'')));
el.errorsText.appendChild(doc.createTextNode(' '));
fields.forEach(function(f,i){
if(i)el.errorsText.appendChild(doc.createTextNode(', '));
var a=mk('a',null,T('field_'+f));
var target=fieldTarget(f);
a.href='#'+(target.id||'aanvraag-stap-'+(f==='sources'?2:3));
a.setAttribute('data-field',f);
el.errorsText.appendChild(a);
});
if(parts[1])el.errorsText.appendChild(doc.createTextNode(parts[1]));
el.errors.hidden=false;
if(focus)el.errors.focus();
}
function refreshSummary(){if(state.attempted&&!el.errors.hidden)renderErrorSummary(validate(state),false);}
el.errors.addEventListener('click',function(e){
var a=e.target.closest?e.target.closest('a[data-field]'):null;
if(!a)return;
e.preventDefault();
var target=fieldTarget(a.getAttribute('data-field'));
target.focus({preventScroll:true});
target.scrollIntoView({block:'center',behavior:reducedMotion()?'auto':'smooth'});
});
function renderSearch(){
var manual=state.mode==='manual';
el.searchPanel.hidden=manual;
el.manualPanel.hidden=!manual;
var rec=state.record;
el.input.hidden=!!rec;
el.selected.hidden=!rec;
if(rec){
el.selName.textContent=displayName(rec);
el.selMeta.textContent=metaLine(rec);
}
el.help.textContent=notice==='cleared'?T('cleared'):'';
}
function fillLines(dl,lines){
dl.textContent='';
lines.forEach(function(l){
var row=mk('div','ba-req__line');
row.setAttribute('data-line',l.id);
row.appendChild(mk('dt',null,l.label+':'));
row.appendChild(doc.createTextNode(' '));
row.appendChild(mk('dd',null,l.value));
dl.appendChild(row);
});
}
function renderSummary(){fillLines(el.summary,summaryLines(state,lang,countries));}
function reducedMotion(){return!!(win.matchMedia&&win.matchMedia('(prefers-reduced-motion: reduce)').matches);}
function keys(){
var g=function(n){return(form.getAttribute('data-emailjs-'+n)||'').trim();};
return{service:g('service'),template:g('template'),key:g('key')};
}
function setBusy(on){
el.submit.disabled=on;
el.submit.classList.toggle('is-loading',on);
if(on){el.submit.setAttribute('aria-busy','true');el.submit.textContent=T('sending');}
else{el.submit.removeAttribute('aria-busy');el.submit.textContent=submitLabel;}
}
function datasetVersion(){
if(!search||loadFailed||!countries.length)return Promise.resolve('');
return search.version().then(String,function(){return'';});
}
function showSuccess(lines){
var d=el.done;
d.textContent='';
var msg=mk('div','ba-req__done-msg');
msg.setAttribute('role','status');
msg.setAttribute('tabindex','-1');
msg.setAttribute('data-req-done-msg','');
var title=mk('p','ba-req__done-title');
var mark=mk('span','ba-req__done-mark','✓');
mark.setAttribute('aria-hidden','true');
title.appendChild(mark);
title.appendChild(doc.createTextNode(' '+T('success_title')));
msg.appendChild(title);
msg.appendChild(doc.createTextNode(' '));
msg.appendChild(mk('p','ba-req__done-text',T('success_text')));
var recap=mk('div','ba-req__summary ba-req__recap');
recap.appendChild(mk('h4','ba-req__sumtitle',T('recap_title')));
var dl=mk('dl','ba-req__lines');
fillLines(dl,lines);
recap.appendChild(dl);
var contact=mk('p','ba-req__done-contact');
var parts=T('success_contact').split(CONTACT_MAIL);
contact.appendChild(doc.createTextNode(parts[0]));
var a=mk('a',null,CONTACT_MAIL);
a.href='mailto:'+CONTACT_MAIL;
contact.appendChild(a);
if(parts[1])contact.appendChild(doc.createTextNode(parts[1]));
d.appendChild(msg);d.appendChild(recap);d.appendChild(contact);
form.hidden=true;
d.hidden=false;
msg.focus({preventScroll:true});
var top=d.getBoundingClientRect().top;
if(top<0||top>win.innerHeight*0.6)d.scrollIntoView({block:'start',behavior:reducedMotion()?'auto':'smooth'});
}
function send(){
var k=keys();
var meta={page:String(win.location.href).split('#')[0],cta_source:ctaSource,dataset_version:''};
if(!k.service||!k.template||!k.key){
var params=emailParams(state,lang,meta,countries);
el.mail.textContent=T('mail_fallback');
var api=globalApi();
((api&&api.openMail)||openMail)(mailtoUrl(params,lang));
return;
}
sending=true;
setBusy(true);
var lines=summaryLines(state,lang,countries);
datasetVersion().then(function(v){
meta.dataset_version=v;
var body={service_id:k.service,template_id:k.template,user_id:k.key,template_params:emailParams(state,lang,meta,countries)};
return win.fetch(EMAILJS_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
}).then(function(res){
if(!res||res.status!==200)throw new Error('EmailJS answered '+(res&&res.status));
showSuccess(lines);
}).catch(function(){
sending=false;
setBusy(false);
el.fail.textContent=T('send_failed');
el.fail.hidden=false;
});
}
form.addEventListener('submit',function(e){
e.preventDefault();
if(sending)return;
el.fail.hidden=true;
el.fail.textContent='';
el.mail.textContent='';
closeList();
state=copy(state,{attempted:true});
var errs=validate(state);
FIELD_ORDER.forEach(function(f){
setError(f,errs[f]||((f==='sources'&&refused.sources)||(f==='substances'&&refused.substances)?errorKey(f):null));
});
if(Object.keys(errs).length){renderErrorSummary(errs,true);return;}
el.errors.hidden=true;
if(el.trap&&el.trap.value)return;
send();
});
function focusTarget(){
if(!el.done.hidden)return el.done.querySelector('[data-req-done-msg]');
return state.mode==='manual'?el.manual:(state.record?el.selected:el.input);
}
el.change.addEventListener('click',function(e){
e.preventDefault();
el.card1.scrollIntoView({block:'start',behavior:reducedMotion()?'auto':'smooth'});
focusTarget().focus({preventScroll:true});
});
if(el.side&&win.ResizeObserver){
new win.ResizeObserver(function(){el.side.style.setProperty('--ba-req-side-h',el.side.offsetHeight+'px');}).observe(el.side);
}
form.addEventListener('focusin',function(){loadCountries();});
renderChecks();renderSearch();renderSummary();
var inst={
state:function(){return state;},
loadCountries:loadCountries,
focusTarget:focusTarget,
setCtaSource:function(s){if(s)ctaSource=clean(s);}
};
form.aanvraag=inst;
return inst;
}
return{
initialState:initialState,setCountry:setCountry,setMode:setMode,selectRecord:selectRecord,
clearRecord:clearRecord,setManualText:setManualText,toggleSource:toggleSource,
toggleSubstance:toggleSubstance,setSpecificText:setSpecificText,setContact:setContact,
validate:validate,errorSummary:errorSummary,summaryLines:summaryLines,emailParams:emailParams,
mailtoUrl:mailtoUrl,clean:clean,t:t,STRINGS:STRINGS,SOURCE_IDS:SOURCE_IDS,SUBSTANCE_IDS:SUBSTANCE_IDS,
mount:mount,openMail:openMail
};
}));
