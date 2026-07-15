// Kandler Math Library — comprehensive math for 3D.
// Vectors, matrices, quaternions, interpolation, geometry, noise, random, color, calculus.
import * as THREE from "three";

export function vec3(x=0,y=0,z=0){return new THREE.Vector3(x,y,z)}
export function vec3Add(a:THREE.Vector3,b:THREE.Vector3){return new THREE.Vector3(a.x+b.x,a.y+b.y,a.z+b.z)}
export function vec3Sub(a:THREE.Vector3,b:THREE.Vector3){return new THREE.Vector3(a.x-b.x,a.y-b.y,a.z-b.z)}
export function vec3Scale(a:THREE.Vector3,s:number){return new THREE.Vector3(a.x*s,a.y*s,a.z*s)}
export function vec3Dot(a:THREE.Vector3,b:THREE.Vector3){return a.x*b.x+a.y*b.y+a.z*b.z}
export function vec3Cross(a:THREE.Vector3,b:THREE.Vector3){return new THREE.Vector3(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x)}
export function vec3Length(a:THREE.Vector3){return Math.sqrt(a.x*a.x+a.y*a.y+a.z*a.z)}
export function vec3Normalize(a:THREE.Vector3){const l=vec3Length(a);return l<1e-4?new THREE.Vector3():new THREE.Vector3(a.x/l,a.y/l,a.z/l)}
export function vec3Lerp(a:THREE.Vector3,b:THREE.Vector3,t:number){return new THREE.Vector3(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,a.z+(b.z-a.z)*t)}
export function vec3Distance(a:THREE.Vector3,b:THREE.Vector3){return vec3Length(vec3Sub(a,b))}
export function vec3Angle(a:THREE.Vector3,b:THREE.Vector3){return Math.acos(Math.max(-1,Math.min(1,vec3Dot(vec3Normalize(a),vec3Normalize(b)))))}
export function vec3Reflect(v:THREE.Vector3,n:THREE.Vector3){const d=vec3Dot(v,n);return new THREE.Vector3(v.x-2*d*n.x,v.y-2*d*n.y,v.z-2*d*n.z)}
export function vec3Project(v:THREE.Vector3,o:THREE.Vector3){const d=vec3Dot(v,o)/vec3Dot(o,o);return vec3Scale(o,d)}
export function vec3Min(a:THREE.Vector3,b:THREE.Vector3){return new THREE.Vector3(Math.min(a.x,b.x),Math.min(a.y,b.y),Math.min(a.z,b.z))}
export function vec3Max(a:THREE.Vector3,b:THREE.Vector3){return new THREE.Vector3(Math.max(a.x,b.x),Math.max(a.y,b.y),Math.max(a.z,b.z))}
export function vec3Clamp(v:THREE.Vector3,min:THREE.Vector3,max:THREE.Vector3){return new THREE.Vector3(Math.max(min.x,Math.min(max.x,v.x)),Math.max(min.y,Math.min(max.y,v.y)),Math.max(min.z,Math.min(max.z,v.z)))}
export function vec3Abs(a:THREE.Vector3){return new THREE.Vector3(Math.abs(a.x),Math.abs(a.y),Math.abs(a.z))}
export function vec3Floor(a:THREE.Vector3){return new THREE.Vector3(Math.floor(a.x),Math.floor(a.y),Math.floor(a.z))}
export function vec3Ceil(a:THREE.Vector3){return new THREE.Vector3(Math.ceil(a.x),Math.ceil(a.y),Math.ceil(a.z))}
export function vec3RotateX(v:THREE.Vector3,a:number){const c=Math.cos(a),s=Math.sin(a);return new THREE.Vector3(v.x,v.y*c-v.z*s,v.y*s+v.z*c)}
export function vec3RotateY(v:THREE.Vector3,a:number){const c=Math.cos(a),s=Math.sin(a);return new THREE.Vector3(v.x*c+v.z*s,v.y,-v.x*s+v.z*c)}
export function vec3RotateZ(v:THREE.Vector3,a:number){const c=Math.cos(a),s=Math.sin(a);return new THREE.Vector3(v.x*c-v.y*s,v.x*s+v.y*c,v.z)}
export function vec3Slerp(a:THREE.Vector3,b:THREE.Vector3,t:number){const d=Math.max(-1,Math.min(1,vec3Dot(vec3Normalize(a),vec3Normalize(b))));const th=Math.acos(d);if(th<1e-3)return vec3Lerp(a,b,t);const s=Math.sin(th);const w1=Math.sin((1-t)*th)/s,w2=Math.sin(t*th)/s;return new THREE.Vector3(a.x*w1+b.x*w2,a.y*w1+b.y*w2,a.z*w1+b.z*w2)}

export function lerp(a:number,b:number,t:number){return a+(b-a)*t}
export function clamp(v:number,min:number,max:number){return Math.max(min,Math.min(max,v))}
export function clamp01(v:number){return Math.max(0,Math.min(1,v))}
export function smoothstep(e0:number,e1:number,x:number){const t=clamp01((x-e0)/(e1-e0));return t*t*(3-2*t)}
export function smootherstep(e0:number,e1:number,x:number){const t=clamp01((x-e0)/(e1-e0));return t*t*t*(t*(t*6-15)+10)}
export function step(e:number,x:number){return x<e?0:1}
export function mapRange(v:number,fMin:number,fMax:number,tMin:number,tMax:number){return tMin+((v-fMin)/(fMax-fMin))*(tMax-tMin)}
export function mapRangeClamped(v:number,fMin:number,fMax:number,tMin:number,tMax:number){return tMin+clamp01((v-fMin)/(fMax-fMin))*(tMax-tMin)}
export function wrap(v:number,min:number,max:number){const r=max-min;return r===0?min:((v-min)%r+r)%r+min}
export function pingPong(t:number,len:number){return len-Math.abs((t%(len*2))-len)}
export function degToRad(d:number){return d*Math.PI/180}
export function radToDeg(r:number){return r*180/Math.PI}
export function mix(a:number,b:number,t:number){return lerp(a,b,t)}
export function inverseLerp(a:number,b:number,v:number){return a===b?0:(v-a)/(b-a)}
export function approach(c:number,t:number,d:number){return c<t?Math.min(c+d,t):Math.max(c-d,t)}
export function damp(c:number,t:number,l:number,dt:number){return lerp(c,t,1-Math.exp(-l*dt))}
export function dampAngle(c:number,t:number,l:number,dt:number){let d=t-c;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return c+d*(1-Math.exp(-l*dt))}

export function triangleArea(a:THREE.Vector3,b:THREE.Vector3,c:THREE.Vector3){return vec3Length(vec3Cross(vec3Sub(b,a),vec3Sub(c,a)))*0.5}
export function triangleNormal(a:THREE.Vector3,b:THREE.Vector3,c:THREE.Vector3){return vec3Normalize(vec3Cross(vec3Sub(b,a),vec3Sub(c,a)))}
export function triangleCentroid(a:THREE.Vector3,b:THREE.Vector3,c:THREE.Vector3){return new THREE.Vector3((a.x+b.x+c.x)/3,(a.y+b.y+c.y)/3,(a.z+b.z+c.z)/3)}
export function barycentric(p:THREE.Vector3,a:THREE.Vector3,b:THREE.Vector3,c:THREE.Vector3):[number,number,number]{const v0=vec3Sub(b,a),v1=vec3Sub(c,a),v2=vec3Sub(p,a);const d00=vec3Dot(v0,v0),d01=vec3Dot(v0,v1),d11=vec3Dot(v1,v1),d20=vec3Dot(v2,v0),d21=vec3Dot(v2,v1);const den=d00*d11-d01*d01;if(Math.abs(den)<1e-4)return[0,0,0];const v=(d11*d20-d01*d21)/den,w=(d00*d21-d01*d20)/den;return[1-v-w,v,w]}
export function pointInTriangle(p:THREE.Vector3,a:THREE.Vector3,b:THREE.Vector3,c:THREE.Vector3){const[u,v,w]=barycentric(p,a,b,c);return u>=0&&v>=0&&w>=0}
export function raySphereIntersect(o:THREE.Vector3,d:THREE.Vector3,c:THREE.Vector3,r:number):number|null{const oc=vec3Sub(o,c);const a=vec3Dot(d,d),b=2*vec3Dot(oc,d),cc=vec3Dot(oc,oc)-r*r;const disc=b*b-4*a*cc;if(disc<0)return null;const t=(-b-Math.sqrt(disc))/(2*a);return t>=0?t:null}
export function rayBoxIntersect(o:THREE.Vector3,d:THREE.Vector3,min:THREE.Vector3,max:THREE.Vector3):number|null{let tmin=-Infinity,tmax=Infinity;for(let i=0;i<3;i++){const oo=[o.x,o.y,o.z][i],dd=[d.x,d.y,d.z][i],mn=[min.x,min.y,min.z][i],mx=[max.x,max.y,max.z][i];if(Math.abs(dd)<1e-4){if(oo<mn||oo>mx)return null}else{const t1=(mn-oo)/dd,t2=(mx-oo)/dd;tmin=Math.max(tmin,Math.min(t1,t2));tmax=Math.min(tmax,Math.max(t1,t2))}}return tmax>=tmin?(tmin>=0?tmin:tmax>=0?tmax:null):null}
export function rayTriangleIntersect(o:THREE.Vector3,d:THREE.Vector3,v0:THREE.Vector3,v1:THREE.Vector3,v2:THREE.Vector3):number|null{const e1=vec3Sub(v1,v0),e2=vec3Sub(v2,v0);const h=vec3Cross(d,e2);const a=vec3Dot(e1,h);if(Math.abs(a)<1e-4)return null;const f=1/a;const s=vec3Sub(o,v0);const u=f*vec3Dot(s,h);if(u<0||u>1)return null;const q=vec3Cross(s,e1);const v=f*vec3Dot(d,q);if(v<0||u+v>1)return null;const t=f*vec3Dot(e2,q);return t>=0?t:null}
export function rayPlaneIntersect(o:THREE.Vector3,d:THREE.Vector3,p:THREE.Vector3,n:THREE.Vector3):number|null{const den=vec3Dot(d,n);if(Math.abs(den)<1e-4)return null;const t=vec3Dot(vec3Sub(p,o),n)/den;return t>=0?t:null}
export function closestPointOnLine(p:THREE.Vector3,a:THREE.Vector3,b:THREE.Vector3){const ab=vec3Sub(b,a);const t=clamp01(vec3Dot(vec3Sub(p,a),ab)/vec3Dot(ab,ab));return vec3Add(a,vec3Scale(ab,t))}
export function closestPointOnSegment(p:THREE.Vector3,a:THREE.Vector3,b:THREE.Vector3){const ab=vec3Sub(b,a);const den=vec3Dot(ab,ab);if(den<1e-4)return{point:a.clone(),t:0};const t=clamp01(vec3Dot(vec3Sub(p,a),ab)/den);return{point:vec3Add(a,vec3Scale(ab,t)),t}}
export function pointToLineDistance(p:THREE.Vector3,a:THREE.Vector3,b:THREE.Vector3){return vec3Distance(p,closestPointOnLine(p,a,b))}
export function pointToSegmentDistance(p:THREE.Vector3,a:THREE.Vector3,b:THREE.Vector3){return vec3Distance(p,closestPointOnSegment(p,a,b).point)}
export function computeBoundingBox(positions:Float32Array){let min=new THREE.Vector3(Infinity,Infinity,Infinity),max=new THREE.Vector3(-Infinity,-Infinity,-Infinity);for(let i=0;i<positions.length;i+=3){min.x=Math.min(min.x,positions[i]);min.y=Math.min(min.y,positions[i+1]);min.z=Math.min(min.z,positions[i+2]);max.x=Math.max(max.x,positions[i]);max.y=Math.max(max.y,positions[i+1]);max.z=Math.max(max.z,positions[i+2])}return{min,max}}
export function computeBoundingSphere(positions:Float32Array){const box=computeBoundingBox(positions);const center=new THREE.Vector3((box.min.x+box.max.x)/2,(box.min.y+box.max.y)/2,(box.min.z+box.max.z)/2);let maxD=0;for(let i=0;i<positions.length;i+=3){const dx=positions[i]-center.x,dy=positions[i+1]-center.y,dz=positions[i+2]-center.z;const d=dx*dx+dy*dy+dz*dz;if(d>maxD)maxD=d}return{center,radius:Math.sqrt(maxD)}}
export function boxBoxOverlap(minA:THREE.Vector3,maxA:THREE.Vector3,minB:THREE.Vector3,maxB:THREE.Vector3){return minA.x<=maxB.x&&maxA.x>=minB.x&&minA.y<=maxB.y&&maxA.y>=minB.y&&minA.z<=maxB.z&&maxA.z>=minB.z}
export function sphereSphereOverlap(cA:THREE.Vector3,rA:number,cB:THREE.Vector3,rB:number){return vec3Distance(cA,cB)<rA+rB}
export function sphereBoxOverlap(c:THREE.Vector3,r:number,min:THREE.Vector3,max:THREE.Vector3){const cx=Math.max(min.x,Math.min(c.x,max.x)),cy=Math.max(min.y,Math.min(c.y,max.y)),cz=Math.max(min.z,Math.min(c.z,max.z));return (c.x-cx)**2+(c.y-cy)**2+(c.z-cz)**2<r*r}
export function boxContainsPoint(min:THREE.Vector3,max:THREE.Vector3,p:THREE.Vector3){return p.x>=min.x&&p.x<=max.x&&p.y>=min.y&&p.y<=max.y&&p.z>=min.z&&p.z<=max.z}
export function boxVolume(min:THREE.Vector3,max:THREE.Vector3){return(max.x-min.x)*(max.y-min.y)*(max.z-min.z)}
export function boxSurfaceArea(min:THREE.Vector3,max:THREE.Vector3){const w=max.x-min.x,h=max.y-min.y,d=max.z-min.z;return 2*(w*h+h*d+w*d)}

export function rgbToHsv(r:number,g:number,b:number):[number,number,number]{const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;let h=0;if(d>0){if(mx===r)h=((g-b)/d)%6;else if(mx===g)h=(b-r)/d+2;else h=(r-g)/d+4;h*=60;if(h<0)h+=360}return[h/360,mx===0?0:d/mx,mx]}
export function hsvToRgb(h:number,s:number,v:number):[number,number,number]{const c=v*s,x=c*(1-Math.abs((h*6)%2-1)),m=v-c;let r=0,g=0,b=0;if(h<1/6){r=c;g=x}else if(h<2/6){r=x;g=c}else if(h<3/6){g=c;b=x}else if(h<4/6){g=x;b=c}else if(h<5/6){r=x;b=c}else{r=c;b=x}return[r+m,g+m,b+m]}
export function rgbToHsl(r:number,g:number,b:number):[number,number,number]{const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2;let h=0,s=0;if(mx!==mn){const d=mx-mn;s=l>0.5?d/(2-mx-mn):d/(mx+mn);if(mx===r)h=((g-b)/d)%6;else if(mx===g)h=(b-r)/d+2;else h=(r-g)/d+4;h*=60;if(h<0)h+=360}return[h/360,s,l]}
export function hslToRgb(h:number,s:number,l:number):[number,number,number]{if(s===0)return[l,l,l];const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h*6)%2-1)),m=l-c/2;let r=0,g=0,b=0;if(h<1/6){r=c;g=x}else if(h<2/6){r=x;g=c}else if(h<3/6){g=c;b=x}else if(h<4/6){g=x;b=c}else if(h<5/6){r=x;b=c}else{r=c;b=x}return[r+m,g+m,b+m]}
export function colorBrightness(r:number,g:number,b:number){return 0.299*r+0.587*g+0.114*b}
export function colorLerp(a:[number,number,number],b:[number,number,number],t:number):[number,number,number]{return[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)]}
export function wavelengthToRgb(w:number):[number,number,number]{let r=0,g=0,b=0;if(w>=380&&w<440){r=-(w-440)/60;g=0;b=1}else if(w>=440&&w<490){r=0;g=(w-440)/50;b=1}else if(w>=490&&w<510){r=0;g=1;b=-(w-510)/20}else if(w>=510&&w<580){r=(w-510)/70;g=1;b=0}else if(w>=580&&w<645){r=1;g=-(w-645)/65;b=0}else if(w>=645&&w<=780){r=1;g=0;b=0}let f=0;if(w>=380&&w<420)f=0.3+0.7*(w-380)/40;else if(w>=420&&w<700)f=1;else if(w>=700&&w<=780)f=0.3+0.7*(780-w)/80;return[r*f,g*f,b*f]}

export class Random{private state:number;constructor(seed:number=0){this.state=seed||1}next(){this.state^=this.state<<13;this.state^=this.state>>17;this.state^=this.state<<5;return(this.state>>>0)/4294967296}range(min:number,max:number){return min+this.next()*(max-min)}int(min:number,max:number){return Math.floor(this.range(min,max+1))}bool(){return this.next()<0.5}sign(){return this.bool()?1:-1}gaussian(m=0,s=1){const u1=this.next(),u2=this.next();return m+Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2)*s}unitVector(){const t=this.range(0,Math.PI*2),p=Math.acos(this.range(-1,1));return new THREE.Vector3(Math.sin(p)*Math.cos(t),Math.cos(p),Math.sin(p)*Math.sin(t))}pointInSphere(r=1){return this.unitVector().multiplyScalar(Math.cbrt(this.next())*r)}pointOnSphere(r=1){return this.unitVector().multiplyScalar(r)}color(){return new THREE.Color(this.next(),this.next(),this.next())}pick<T>(a:T[]){return a[this.int(0,a.length-1)]}shuffle<T>(a:T[]){const r=[...a];for(let i=r.length-1;i>0;i--){const j=this.int(0,i);[r[i],r[j]]=[r[j],r[i]]}return r}reset(){this.state=(this.state||1)}}

const PERM=new Uint8Array(512);{const p=new Uint8Array(256);for(let i=0;i<256;i++)p[i]=i;for(let i=255;i>0;i--){const j=Math.floor(Math.random()*(i+1));[p[i],p[j]]=[p[j],p[i]]}for(let i=0;i<512;i++)PERM[i]=p[i&255]}
function fade(t:number){return t*t*t*(t*(t*6-15)+10)}
export function perlinNoise3D(x:number,y:number,z:number){const X=Math.floor(x)&255,Y=Math.floor(y)&255,Z=Math.floor(z)&255;x-=Math.floor(x);y-=Math.floor(y);z-=Math.floor(z);const u=fade(x),v=fade(y),w=fade(z);const A=PERM[X]+Y,AA=PERM[A]+Z,AB=PERM[A+1]+Z,B=PERM[X+1]+Y,BA=PERM[B]+Z,BB=PERM[B+1]+Z;const grad=(h:number,x:number,y:number,z:number)=>{const g=PERM[h&511];return((g&1)===0?1:-1)*x+((g&2)===0?1:-1)*y+((g&4)===0?1:-1)*z};const lerp2=(t:number,a:number,b:number)=>a+t*(b-a);return lerp2(w,lerp2(v,lerp2(u,grad(AA,x,y,z),grad(BA,x-1,y,z)),lerp2(u,grad(AB,x,y-1,z),grad(BB,x-1,y-1,z))),lerp2(v,lerp2(u,grad(AA+1,x,y,z-1),grad(BA+1,x-1,y,z-1)),lerp2(u,grad(AB+1,x,y-1,z-1),grad(BB+1,x-1,y-1,z-1))))*0.5+0.5}
export function fbmNoise(x:number,y:number,z:number,oct=4,per=0.5,lac=2){let t=0,f=1,a=1,m=0;for(let i=0;i<oct;i++){t+=perlinNoise3D(x*f,y*f,z*f)*a;m+=a;a*=per;f*=lac}return t/m}
export function ridgedNoise(x:number,y:number,z:number,oct=4){let t=0,f=1,a=1,m=0;for(let i=0;i<oct;i++){const n=1-Math.abs(perlinNoise3D(x*f,y*f,z*f)-0.5)*2;t+=n*n*a;m+=a;a*=0.5;f*=2}return t/m}
export function worleyNoise(x:number,y:number,z:number,cs=1){const ix=Math.floor(x/cs),iy=Math.floor(y/cs),iz=Math.floor(z/cs);let md=Infinity;for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)for(let dz=-1;dz<=1;dz++){const h=Math.sin(ix+dx*374.7+iy+dy*783.4+iz+dz*191.8)*43758.5;const fx=(ix+dx)*cs+(h-Math.floor(h))*cs;const fy=(iy+dy)*cs+(h*1.3-Math.floor(h*1.3))*cs;const fz=(iz+dz)*cs+(h*1.7-Math.floor(h*1.7))*cs;const d=(x-fx)**2+(y-fy)**2+(z-fz)**2;if(d<md)md=d}return Math.sqrt(md)}

export function catmullRom(p0:number,p1:number,p2:number,p3:number,t:number){const t2=t*t,t3=t2*t;return 0.5*(2*p1+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t2+(-p0+3*p1-3*p2+p3)*t3)}
export function bezierCurve(p0:number,p1:number,p2:number,p3:number,t:number){const u=1-t;return u*u*u*p0+3*u*u*t*p1+3*u*t*t*p2+t*t*t*p3}
export function solveQuadratic(a:number,b:number,c:number):number[]{const d=b*b-4*a*c;if(d<0)return[];if(d===0)return[-b/(2*a)];const s=Math.sqrt(d);return[(-b-s)/(2*a),(-b+s)/(2*a)]}
export function gcd(a:number,b:number):number{a=Math.abs(a);b=Math.abs(b);while(b){[a,b]=[b,a%b]}return a}
export function lcm(a:number,b:number){return Math.abs(a*b)/gcd(a,b)}
export function factorial(n:number){let r=1;for(let i=2;i<=n;i++)r*=i;return r}
export function binomial(n:number,k:number){return factorial(n)/(factorial(k)*factorial(n-k))}
export function fibonacci(n:number){if(n<2)return n;let a=0,b=1;for(let i=2;i<=n;i++){[a,b]=[b,a+b]}return b}
export function isPrime(n:number){if(n<2)return false;if(n<4)return true;if(n%2===0||n%3===0)return false;let i=5;while(i*i<=n){if(n%i===0||n%(i+2)===0)return false;i+=6}return true}
export function nextPow2(n:number){return Math.pow(2,Math.ceil(Math.log2(n)))}
export function isPow2(n:number){return n>0&&(n&(n-1))===0}
export function sign(v:number){return v>0?1:v<0?-1:0}
export function mod(a:number,b:number){return((a%b)+b)%b}
export function sum(a:number[]){return a.reduce((x,y)=>x+y,0)}
export function average(a:number[]){return a.length===0?0:sum(a)/a.length}
export function median(a:number[]){const s=[...a].sort((x,y)=>x-y);const m=Math.floor(s.length/2);return s.length%2===0?(s[m-1]+s[m])/2:s[m]}
export function variance(a:number[]){const avg=average(a);return average(a.map(v=>(v-avg)**2))}
export function stddev(a:number[]){return Math.sqrt(variance(a))}

export const PI=Math.PI,TWO_PI=Math.PI*2,HALF_PI=Math.PI/2,DEG2RAD=Math.PI/180,RAD2DEG=180/Math.PI,EPS=1e-4,INF=Infinity,GOLDEN=(1+Math.sqrt(5))/2;

export function easeInOut(t:number){return t<0.5?2*t*t:-1+(4-2*t)*t}
export function easeIn(t:number){return t*t}
export function easeOut(t:number){return t*(2-t)}
export function easeInOutCubic(t:number){return t<0.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}
export function easeInOutQuart(t:number){return t<0.5?8*t*t*t*t:1-Math.pow(-2*t+2,4)/2}
export function easeInOutQuint(t:number){return t<0.5?16*t*t*t*t*t:1-Math.pow(-2*t+2,5)/2}
export function easeInOutSine(t:number){return-(Math.cos(Math.PI*t)-1)/2}
export function easeInOutExpo(t:number){return t===0?0:t===1?1:t<0.5?Math.pow(2,20*t-10)/2:(2-Math.pow(2,-20*t+10))/2}
export function easeOutBack(t:number){const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2)}
export function easeInBack(t:number){const c1=1.70158,c3=c1+1;return c3*t*t*t-c1*t*t}
export function easeOutElastic(t:number){const c4=(2*Math.PI)/3;return t===0?0:t===1?1:Math.pow(2,-10*t)*Math.sin((t*10-0.75)*c4)+1}
export function easeOutBounce(t:number){const n1=7.5625,d1=2.75;if(t<1/d1)return n1*t*t;else if(t<2/d1)return n1*(t-=1.5/d1)*t+0.75;else if(t<2.5/d1)return n1*(t-=2.25/d1)*t+0.9375;else return n1*(t-=2.625/d1)*t+0.984375}
export function easeInBounce(t:number){return 1-easeOutBounce(1-t)}
export function easeInOutBounce(t:number){return t<0.5?(1-easeOutBounce(1-2*t))/2:(1+easeOutBounce(2*t-1))/2}

export const EASING:Record<string,(t:number)=>number>={"linear":t=>t,"ease-in":easeIn,"ease-out":easeOut,"ease-in-out":easeInOut,"ease-in-cubic":t=>t*t*t,"ease-out-cubic":t=>1-Math.pow(1-t,3),"ease-in-out-cubic":easeInOutCubic,"ease-in-quart":t=>t**4,"ease-out-quart":t=>1-Math.pow(1-t,4),"ease-in-out-quart":easeInOutQuart,"ease-in-quint":t=>t**5,"ease-out-quint":t=>1-Math.pow(1-t,5),"ease-in-out-quint":easeInOutQuint,"ease-in-sine":t=>1-Math.cos(t*Math.PI/2),"ease-out-sine":t=>Math.sin(t*Math.PI/2),"ease-in-out-sine":easeInOutSine,"ease-in-expo":t=>t===0?0:Math.pow(2,10*t-10),"ease-out-expo":t=>t===1?1:1-Math.pow(2,-10*t),"ease-in-out-expo":easeInOutExpo,"ease-in-back":easeInBack,"ease-out-back":easeOutBack,"ease-in-elastic":t=>{const c4=(2*Math.PI)/3;return t===0?0:t===1?1:-Math.pow(2,10*t-10)*Math.sin((t*10-10.75)*c4)},"ease-out-elastic":easeOutElastic,"ease-in-bounce":easeInBounce,"ease-out-bounce":easeOutBounce,"ease-in-out-bounce":easeInOutBounce};
export function applyEasing(t:number,e:string){const f=EASING[e];return f?f(t):t}

export function derivative(f:(x:number)=>number,x:number,h=1e-4){return(f(x+h)-f(x-h))/(2*h)}
export function secondDerivative(f:(x:number)=>number,x:number,h=1e-4){return(f(x+h)-2*f(x)+f(x-h))/(h*h)}
export function integrateSimpson(f:(x:number)=>number,a:number,b:number,n=1000){if(n%2===1)n++;const h=(b-a)/n;let r=f(a)+f(b);for(let i=1;i<n;i++){const x=a+i*h;r+=(i%2===0?2:4)*f(x)}return r*h/3}
export function integrateTrapezoid(f:(x:number)=>number,a:number,b:number,n=1000){const h=(b-a)/n;let r=(f(a)+f(b))/2;for(let i=1;i<n;i++)r+=f(a+i*h);return r*h}
export function newtonRaphson(f:(x:number)=>number,df:(x:number)=>number,x0:number,tol=1e-4,maxIter=100){let x=x0;for(let i=0;i<maxIter;i++){const fx=f(x),dfx=df(x);if(Math.abs(dfx)<1e-6)break;const x1=x-fx/dfx;if(Math.abs(x1-x)<tol)return x1;x=x1}return x}

export function quatFromEuler(x:number,y:number,z:number){return new THREE.Quaternion().setFromEuler(new THREE.Euler(x,y,z,"XYZ"))}
export function quatFromAxisAngle(axis:THREE.Vector3,angle:number){return new THREE.Quaternion().setFromAxisAngle(vec3Normalize(axis),angle)}
export function quatSlerp(a:THREE.Quaternion,b:THREE.Quaternion,t:number){return new THREE.Quaternion().copy(a).slerp(b,t)}
export function quatToEuler(q:THREE.Quaternion){return new THREE.Euler().setFromQuaternion(q,"XYZ")}
