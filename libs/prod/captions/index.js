var K=Object.defineProperty;var J=(i,t,e)=>t in i?K(i,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):i[t]=e;var l=(i,t,e)=>(J(i,typeof t!="symbol"?t+"":t,e),e);const Q={LoadFail:0,BadSignature:1,BadTimestamp:2,BadSettingValue:3,BadFormat:4,UnknownSetting:5};class Z extends Error{constructor(e){super(e.reason);l(this,"code");l(this,"line");this.code=e.code,this.line=e.line}}const M=/\r?\n|\r/gm;class U{constructor(t){l(this,"writable");l(this,"readable");const e=new tt(t);this.writable=new WritableStream({write(s){e.transform(s)},close(){e.close()}}),this.readable=new ReadableStream({start(s){e.onLine=a=>s.enqueue(a),e.onClose=()=>s.close()}})}}class tt{constructor(t){l(this,"x","");l(this,"y");l(this,"onLine");l(this,"onClose");this.y=new TextDecoder(t)}transform(t){this.x+=this.y.decode(t,{stream:!0});const e=this.x.split(M);this.x=e.pop()||"";for(let s=0;s<e.length;s++)this.onLine(e[s].trim())}close(){this.x&&this.onLine(this.x.trim()),this.x="",this.onClose()}}async function et(i,t){const e=new ReadableStream({start(s){const a=i.split(M);for(const r of a)s.enqueue(r);s.close()}});return k(e,t)}async function k(i,t){const e=t?.type??"vtt";let s;if(typeof e=="string")switch(e){case"srt":s=(await import("./srt-parser.js")).default;break;case"ssa":case"ass":s=(await import("./ssa-parser.js")).default;break;default:s=(await Promise.resolve().then(function(){return yt})).default}else s=e;let a;const r=i.getReader(),n=s(),o=!!t?.strict||!!t?.errors;await n.init({strict:!1,...t,errors:o,type:e,cancel(){r.cancel(),a=n.done(!0)}});let h=1;for(;;){const{value:c,done:u}=await r.read();if(u){n.parse("",h),a=n.done(!1);break}n.parse(c,h),h++}return a}async function it(i,t){const e=await i;if(!e.ok||!e.body){let n;return{metadata:{},cues:[],regions:[],errors:[n]}}const s=e.headers.get("content-type")||"",a=s.match(/text\/(.*?)(?:;|$)/)?.[1],r=s.match(/charset=(.*?)(?:;|$)/)?.[1];return P(e.body,{type:a,encoding:r,...t})}async function P(i,{encoding:t="utf-8",...e}={}){const s=i.pipeThrough(new U(t));return k(s,e)}const st=window.VTTCue;class O extends st{constructor(){super(...arguments);l(this,"region",null);l(this,"vertical","");l(this,"snapToLines",!0);l(this,"line","auto");l(this,"lineAlign","start");l(this,"position","auto");l(this,"positionAlign","auto");l(this,"size",100);l(this,"align","center");l(this,"style")}}class B{constructor(){l(this,"id","");l(this,"width",100);l(this,"lines",3);l(this,"regionAnchorX",0);l(this,"regionAnchorY",100);l(this,"viewportAnchorX",0);l(this,"viewportAnchorY",100);l(this,"scroll","")}}const z=",",rt="%";function nt(i){const t=parseInt(i,10);return Number.isNaN(t)?null:t}function w(i){const t=parseInt(i.replace(rt,""),10);return!Number.isNaN(t)&&t>=0&&t<=100?t:null}function $(i){if(!i.includes(z))return null;const[t,e]=i.split(z).map(w);return t!==null&&e!==null?[t,e]:null}function at(i){const t=parseFloat(i);return Number.isNaN(t)?null:t}const ot="WEBVTT",j=",",lt="%",m=/[:=]/,ht=/^[\s\t]*(region|vertical|line|position|size|align)[:=]/,ct="NOTE",ut="REGION",ft=/^REGION:?[\s\t]+/,T=/[\s\t]+/,dt="-->",pt=/[\s\t]*-->[\s\t]+/,gt=/start|center|end|left|right/,mt=/start|center|end/,bt=/line-(?:left|right)|center|auto/,wt=/^(?:(\d{1,2}):)?(\d{2}):(\d{2})(?:\.(\d{1,3}))?$/;var R=(i=>(i[i.None=0]="None",i[i.Header=1]="Header",i[i.Cue=2]="Cue",i[i.Region=3]="Region",i[i.Note=4]="Note",i))(R||{});class _{constructor(){l(this,"f");l(this,"c",0);l(this,"g",{});l(this,"h",{});l(this,"j",[]);l(this,"a",null);l(this,"b",null);l(this,"k",[]);l(this,"d");l(this,"l","")}async init(t){this.f=t,t.strict&&(this.c=1),t.errors&&(this.d=(await import("./errors.js")).ParseErrorBuilder)}parse(t,e){if(t==="")this.a?(this.j.push(this.a),this.f.onCue?.(this.a),this.a=null):this.b?(this.h[this.b.id]=this.b,this.f.onRegion?.(this.b),this.b=null):this.c===1&&(this.i(t,e),this.f.onHeaderMetadata?.(this.g)),this.c=0;else if(this.c)switch(this.c){case 1:this.i(t,e);break;case 2:if(this.a){const s=this.a.text.length>0;!s&&ht.test(t)?this.m(t.split(T),e):this.a.text+=(s?`
`:"")+t}break;case 3:this.n(t.split(T),e);break}else if(t.startsWith(ct))this.c=4;else if(t.startsWith(ut))this.c=3,this.b=new B,this.n(t.replace(ft,"").split(T),e);else if(t.includes(dt)){const s=this.o(t,e);s&&(this.a=new O(s[0],s[1],""),this.a.id=this.l,this.m(s[2],e)),this.c=2}else e===1&&this.i(t,e);this.l=t}done(){return{metadata:this.g,cues:this.j,regions:Object.values(this.h),errors:this.k}}i(t,e){if(e>1){if(m.test(t)){const[s,a]=t.split(m);s&&(this.g[s]=(a||"").replace(T,""))}}else t.startsWith(ot)?this.c=1:this.e(this.d?.p())}o(t,e){const[s,a=""]=t.split(pt),[r,...n]=a.split(T),o=y(s),h=y(r);if(o!==null&&h!==null&&h>o)return[o,h,n];o===null&&this.e(this.d?.q(s,e)),h===null&&this.e(this.d?.r(r,e)),o!=null&&h!==null&&h>o&&this.e(this.d?.s(o,h,e))}n(t,e){let s;for(let a=0;a<t.length;a++)if(m.test(t[a])){s=!1;const[r,n]=t[a].split(m);switch(r){case"id":this.b.id=n;break;case"width":const o=w(n);o!==null?this.b.width=o:s=!0;break;case"lines":const h=nt(n);h!==null?this.b.lines=h:s=!0;break;case"regionanchor":const c=$(n);c!==null?(this.b.regionAnchorX=c[0],this.b.regionAnchorY=c[1]):s=!0;break;case"viewportanchor":const u=$(n);u!==null?(this.b.viewportAnchorX=u[0],this.b.viewportAnchorY=u[1]):s=!0;break;case"scroll":n==="up"?this.b.scroll="up":s=!0;break;default:this.e(this.d?.t(r,n,e))}s&&this.e(this.d?.u(r,n,e))}}m(t,e){let s;for(let a=0;a<t.length;a++)if(s=!1,m.test(t[a])){const[r,n]=t[a].split(m);switch(r){case"region":const o=this.h[n];o&&(this.a.region=o);break;case"vertical":n==="lr"||n==="rl"?(this.a.vertical=n,this.a.region=null):s=!0;break;case"line":const[h,c]=n.split(j);if(h.includes(lt)){const b=w(h);b!==null?(this.a.line=b,this.a.snapToLines=!1):s=!0}else{const b=at(h);b!==null?this.a.line=b:s=!0}mt.test(c)?this.a.lineAlign=c:c&&(s=!0),this.a.line!=="auto"&&(this.a.region=null);break;case"position":const[u,d]=n.split(j),A=w(u);A!==null?this.a.position=A:s=!0,d&&bt.test(d)?this.a.positionAlign=d:d&&(s=!0);break;case"size":const N=w(n);N!==null?(this.a.size=N,N<100&&(this.a.region=null)):s=!0;break;case"align":gt.test(n)?this.a.align=n:s=!0;break;default:this.e(this.d?.v(r,n,e))}s&&this.e(this.d?.w(r,n,e))}}e(t){if(t){if(this.k.push(t),this.f.strict)throw this.f.cancel(),t;this.f.onError?.(t)}}}function y(i){const t=i.match(wt);if(!t)return null;const e=t[1]?parseInt(t[1],10):0,s=parseInt(t[2],10),a=parseInt(t[3],10),r=t[4]?parseInt(t[4].padEnd(3,"0"),10):0,n=e*3600+s*60+a+r/1e3;return e<0||s<0||a<0||r<0||s>59||a>59?null:n}function Tt(){return new _}var yt=Object.freeze({__proto__:null,VTTBlock:R,VTTParser:_,default:Tt,parseVTTTimestamp:y});const vt=/[0-9]/,At=/[\s\t]+/,G={c:"span",i:"i",b:"b",u:"u",ruby:"ruby",rt:"rt",v:"span",lang:"span",timestamp:"span"},St={"&amp;":"&","&lt;":"<","&gt;":">","&quot;":'"',"&#39;":"'","&nbsp;":"\xA0","&lrm;":"\u200E","&rlm;":"\u200F"},Et=/&(?:amp|lt|gt|quot|#(0+)?39|nbsp|lrm|rlm);/g,Nt=new Set(["white","lime","cyan","red","yellow","magenta","blue","black"]),kt=new Set(Object.keys(G));function H(i){let t="",e=1,s=[],a=[],r;for(let c=0;c<i.text.length;c++){const u=i.text[c];switch(e){case 1:u==="<"?(h(),e=2):t+=u;break;case 2:switch(u){case`
`:case"	":case" ":n(),e=4;break;case".":n(),e=3;break;case"/":e=5;break;case">":n(),e=1;break;default:!t&&vt.test(u)&&(e=6),t+=u;break}break;case 3:switch(u){case"	":case" ":case`
`:o(),r&&r.class?.trim(),e=4;break;case".":o();break;case">":o(),r&&r.class?.trim(),e=1;break;default:t+=u}break;case 4:u===">"?(t=t.replace(At," "),r?.type==="v"?r.voice=C(t):r?.type==="lang"&&(r.lang=C(t)),t="",e=1):t+=u;break;case 5:u===">"&&(t="",r=a.pop(),e=1);break;case 6:if(u===">"){const d=y(t);d!==null&&d>=i.startTime&&d<=i.endTime&&(t="timestamp",n(),r.time=d),t="",e=1}else t+=u;break}}function n(){if(kt.has(t)){const c=r;r=Rt(t),c?(a[a.length-1]!==c&&a.push(c),c.children.push(r)):s.push(r)}t="",e=1}function o(){if(r&&t){const c=t.replace("bg_","");Nt.has(c)?r[t.startsWith("bg_")?"bgColor":"color"]=c:r.class=r.class?r.class+" "+t:t}t=""}function h(){if(!t)return;const c={type:"text",data:C(t)};r?r.children.push(c):s.push(c),t=""}return e===1&&h(),s}function Rt(i){return{tagName:G[i],type:i,children:[]}}function C(i){return i.replace(Et,t=>St[t]||"'")}function f(i,t,e){i.style.setProperty(`--${t}`,e+"")}function p(i,t,e=!0){i.setAttribute(`data-${t}`,e===!0?"":e+"")}function S(i,t){i.setAttribute("part",t)}function _t(i){return parseFloat(getComputedStyle(i).lineHeight)||0}function F(i,t=0){return I(H(i),t)}function I(i,t=0){let e,s="";for(const a of i)if(a.type==="text")s+=a.data;else{const r=a.type==="timestamp";e={},e.class=a.class,e.title=a.type==="v"&&a.voice,e.lang=a.type==="lang"&&a.lang,e.part=a.type==="v"&&"voice",r&&(e.part="timed",e["data-time"]=a.time,e["data-future"]=a.time>t,e["data-past"]=a.time<t),e.style=`${a.color?`color: ${a.color};`:""}${a.bgColor?`background-color: ${a.bgColor};`:""}`;const n=Object.entries(e).filter(o=>o[1]).map(o=>`${o[0]}="${o[1]===!0?"":o[1]}"`).join(" ");s+=`<${a.tagName}${n?" "+n:""}>${I(a.children)}</${a.tagName}>`}return s}function D(i,t){for(const e of i.querySelectorAll('[part="timed"]')){const s=Number(e.getAttribute("data-time"));Number.isNaN(s)||(s>t?p(e,"future"):e.removeAttribute("data-future"),s<t?p(e,"past"):e.removeAttribute("data-past"))}}function Ct(i,t){let e=null,s;function a(){r(),i(...s),s=void 0}function r(){clearTimeout(e),e=null}function n(){s=[].slice.call(arguments),r(),e=setTimeout(a,t)}return n}const g=Symbol(0);function x(i){return i instanceof HTMLElement?{top:i.offsetTop,width:i.clientWidth,height:i.clientHeight,left:i.offsetLeft,right:i.offsetLeft+i.clientWidth,bottom:i.offsetTop+i.clientHeight}:{...i}}function E(i,t,e){switch(t){case"+x":i.left+=e,i.right+=e;break;case"-x":i.left-=e,i.right-=e;break;case"+y":i.top+=e,i.bottom+=e;break;case"-y":i.top-=e,i.bottom-=e;break}}function It(i,t){return i.left<=t.right&&i.right>=t.left&&i.top<=t.bottom&&i.bottom>=t.top}function xt(i,t){for(let e=0;e<t.length;e++)if(It(i,t[e]))return t[e];return null}function V(i,t){return t.top>=0&&t.bottom<=i.height&&t.left>=0&&t.right<=i.width}function Lt(i,t,e){switch(e){case"+x":return t.left<0;case"-x":return t.right>i.width;case"+y":return t.top<0;case"-y":return t.bottom>i.height}}function Mt(i,t){const e=Math.max(0,Math.min(i.width,t.right)-Math.max(0,t.left)),s=Math.max(0,Math.min(i.height,t.bottom)-Math.max(0,t.top));return e*s/(i.height*i.width)}function L(i,t){return{top:t.top/i.height,left:t.left/i.width,right:(i.width-t.right)/i.width,bottom:(i.height-t.bottom)/i.height}}function W(i,t){return t.top=t.top*i.height,t.left=t.left*i.width,t.right=i.width-t.right*i.width,t.bottom=i.height-t.bottom*i.height,t}const X=["top","left","right","bottom"];function q(i,t,e,s){const a=L(t,e);for(const r of X)f(i,`${s}-${r}`,a[r]*100+"%")}function Y(i,t,e,s){let a=1,r,n={...t};for(let o=0;o<s.length;o++){for(;Lt(i,t,s[o])||V(i,t)&&xt(t,e);)E(t,s[o],1);if(V(i,t))return t;const h=Mt(i,t);a>h&&(r={...t},a=h),t={...n}}return r||n}const v=Symbol(0);function Pt(i,t,e,s){let a=e.firstElementChild,r=zt(t),n,o=[];if(e[g]||(e[g]=Ot(i,e)),n=W(i,{...e[g]}),e[v])o=[e[v]==="top"?"+y":"-y","+x","-x"];else if(t.snapToLines){let h;switch(t.vertical){case"":o=["+y","-y"],h="height";break;case"rl":o=["+x","-x"],h="width";break;case"lr":o=["-x","+x"],h="width";break}let c=_t(a),u=c*Math.round(r),d=i[h]+c,A=o[0];Math.abs(u)>d&&(u=u<0?-1:1,u*=Math.ceil(d/c)*c),r<0&&(u+=t.vertical===""?i.height:i.width,o=o.reverse()),E(n,A,u)}else{const h=t.vertical==="",c=h?"+y":"+x",u=h?n.height:n.width;E(n,c,(h?i.height:i.width)*r/100),E(n,c,t.lineAlign==="center"?u/2:t.lineAlign==="end"?u:0),o=h?["-y","+y","-x","+x"]:["-x","+x","-y","+y"]}return n=Y(i,n,s,o),q(e,i,n,"cue"),n}function Ot(i,t){const e=x(t),s=Bt(t);if(t[v]=!1,s.top&&(e.top=s.top,e.bottom=s.top+e.height,t[v]="top"),s.bottom){const a=i.height-s.bottom;e.top=a-e.height,e.bottom=a,t[v]="bottom"}return s.left&&(e.left=s.left),s.right&&(e.right=i.width-s.right),L(i,e)}function Bt(i){const t={};for(const e of X)t[e]=parseFloat(i.style.getPropertyValue(`--cue-${e}`));return t}function zt(i){return i.line==="auto"?i.snapToLines?-1:100:i.line}function $t(i){if(i.position==="auto")switch(i.align){case"start":case"left":return 0;case"right":case"end":return 100;default:return 50}return i.position}function jt(i,t){if(i.positionAlign==="auto")switch(i.align){case"start":return t==="ltr"?"line-left":"line-right";case"end":return t==="ltr"?"line-right":"line-left";case"center":return"center";default:return`line-${i.align}`}return i.positionAlign}const Gt=["-y","+y","-x","+x"];function Ht(i,t,e,s){let a=Array.from(e.querySelectorAll('[part="cue-display"]')),r=0,n=Math.max(0,a.length-t.lines);for(let h=a.length-1;h>=n;h--)r+=a[h].offsetHeight;f(e,"region-height",r+"px"),e[g]||(e[g]=L(i,x(e)));let o={...e[g]};return o=W(i,o),o.width=e.clientWidth,o.height=r,o.right=o.left+o.width,o.bottom=o.top+r,o=Y(i,o,s,Gt),q(e,i,o,"region"),o}class Ft{constructor(t,e){l(this,"overlay");l(this,"z");l(this,"A",0);l(this,"C","ltr");l(this,"B",[]);l(this,"D",!1);l(this,"E");l(this,"h",new Map);l(this,"j",new Map);l(this,"K",Ct(()=>{this.D=!1,this.G();for(const t of this.h.values())t[g]=null;for(const t of this.j.values())t&&(t[g]=null);this.H(!0)},50));this.overlay=t,this.dir=e?.dir??"ltr",t.setAttribute("translate","yes"),t.setAttribute("aria-live","off"),t.setAttribute("aria-atomic","true"),S(t,"captions"),this.G(),this.E=new ResizeObserver(this.I.bind(this)),this.E.observe(t)}get dir(){return this.C}set dir(t){this.C=t,p(this.overlay,"dir",t)}get currentTime(){return this.A}set currentTime(t){this.A=t,this.update()}changeTrack({regions:t,cues:e}){this.reset(),this.J(t);for(const s of e)this.j.set(s,null);this.update()}addCue(t){this.j.set(t,null),this.update()}removeCue(t){this.j.delete(t),this.update()}update(t=!1){this.H(t)}reset(){this.j.clear(),this.h.clear(),this.B=[],this.overlay.textContent=""}destroy(){this.reset(),this.E.disconnect()}I(){this.D=!0,this.K()}G(){this.z=x(this.overlay),f(this.overlay,"overlay-width",this.z.width+"px"),f(this.overlay,"overlay-height",this.z.height+"px")}H(t=!1){if(!this.j.size||this.D)return;let e,s=[...this.j.keys()].filter(r=>this.A>=r.startTime&&this.A<=r.endTime).sort((r,n)=>r.startTime!==n.startTime?r.startTime-n.startTime:r.endTime-n.endTime),a=s.map(r=>r.region);for(let r=0;r<this.B.length;r++){if(e=this.B[r],s[r]===e)continue;if(e.region&&!a.includes(e.region)){const o=this.h.get(e.region.id);o&&(o.removeAttribute("data-active"),t=!0)}const n=this.j.get(e);n&&(n.remove(),t=!0)}for(let r=0;r<s.length;r++){e=s[r];let n=this.j.get(e);n||this.j.set(e,n=this.L(e));const o=this.F(e)&&this.h.get(e.region.id);o&&!o.hasAttribute("data-active")&&(requestAnimationFrame(()=>p(o,"active")),t=!0),n.isConnected||((o||this.overlay).append(n),t=!0)}if(t){const r=[],n=new Set;for(let o=s.length-1;o>=0;o--){if(e=s[o],n.has(e.region||e))continue;const h=this.F(e),c=h?this.h.get(e.region.id):this.j.get(e);h?r.push(Ht(this.z,e.region,c,r)):r.push(Pt(this.z,e,c,r)),n.add(h?e.region:e)}}D(this.overlay,this.A),this.B=s}J(t){if(t)for(const e of t){const s=this.M(e);this.h.set(e.id,s),this.overlay.append(s)}}M(t){const e=document.createElement("div");return S(e,"region"),p(e,"id",t.id),p(e,"scroll",t.scroll),f(e,"region-width",t.width+"%"),f(e,"region-anchor-x",t.regionAnchorX),f(e,"region-anchor-y",t.regionAnchorY),f(e,"region-viewport-anchor-x",t.viewportAnchorX),f(e,"region-viewport-anchor-y",t.viewportAnchorY),f(e,"region-lines",t.lines),e}L(t){const e=document.createElement("div"),s=$t(t),a=jt(t,this.C);if(S(e,"cue-display"),t.vertical!==""&&p(e,"vertical"),f(e,"cue-text-align",t.align),t.style)for(const n of Object.keys(t.style))e.style.setProperty(n,t.style[n]);if(this.F(t))f(e,"cue-offset",`${s-(a==="line-right"?100:a==="center"?50:0)}%`);else if(f(e,"cue-writing-mode",t.vertical===""?"horizontal-tb":t.vertical==="lr"?"vertical-lr":"vertical-rl"),!t.style?.["--cue-width"]){let n=s;a==="line-left"?n=100-s:a==="center"&&s<=50?n=s*2:a==="center"&&s>50&&(n=(100-s)*2);const o=t.size<n?t.size:n;t.vertical===""?f(e,"cue-width",o+"%"):f(e,"cue-height",o+"%")}const r=document.createElement("div");return S(r,"cue"),t.id&&p(r,"id",t.id),r.innerHTML=F(t),e.append(r),e}F(t){return t.region&&t.size===100&&t.vertical===""&&t.line==="auto"}}export{Ft as C,Z as P,O as V,Q as a,B as b,it as c,et as d,k as e,y as f,I as g,_ as h,R as i,P as p,F as r,H as t,D as u};