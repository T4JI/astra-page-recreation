(() => {
  'use strict';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let seed = 136;
  function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
  function normal(){return Math.sqrt(-2*Math.log(Math.max(.00001,rand())))*Math.cos(6.283185*rand());}
  const colors=['#d8ecff','#a1cfff','#fff5e5','#ffbc80'];
  const sprites=colors.map(color=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'#ffffff');g.addColorStop(.08,color);g.addColorStop(.18,color+'c0');g.addColorStop(.4,color+'25');g.addColorStop(1,color+'00');x.fillStyle=g;x.fillRect(0,0,64,64);return c;});
  const bg=document.getElementById('universe'),bc=bg.getContext('2d');
  const bgStars=Array.from({length:850},()=>({x:rand(),y:rand(),r:rand()>.989?2.8:rand()*.9+.1,a:rand()*.65+.15,c:Math.floor(rand()*4)}));
  function background(){const d=Math.min(devicePixelRatio,1.5),w=innerWidth,h=innerHeight;bg.width=w*d;bg.height=h*d;bc.setTransform(d,0,0,d,0,0);const grad=bc.createRadialGradient(w/2,h*.4,0,w/2,h*.4,w*.66);grad.addColorStop(0,'#000302');grad.addColorStop(.46,'#020709');grad.addColorStop(.82,'#071018');grad.addColorStop(1,'#03070a');bc.fillStyle=grad;bc.fillRect(0,0,w,h);for(const s of bgStars){let opacity=s.a*(.03+.97*Math.pow(Math.abs(s.x-.5)*2,2.0));bc.globalAlpha=opacity;bc.drawImage(sprites[s.c],s.x*w-s.r*4,s.y*h-s.r*4,s.r*8,s.r*8);}bc.globalAlpha=1;}
  addEventListener('resize',background,{passive:true});background();
  const pathSegments=[[[165,-310],[-140,-305],[-265,-57],[-164,133]],[[-164,133],[-73,305],[186,259],[157,67]],[[157,67],[136,-49],[-60,-73],[-102,62]],[[-102,62],[-133,169],[8,210],[70,133]],[[70,133],[120,62],[32,11],[-2,72]]];
  function cubic(s,t){const u=1-t;return [u*u*u*s[0][0]+3*u*u*t*s[1][0]+3*u*t*t*s[2][0]+t*t*t*s[3][0],u*u*u*s[0][1]+3*u*u*t*s[1][1]+3*u*t*t*s[2][1]+t*t*t*s[3][1]];}
  function starPoints(){const ps=[];for(let i=0;i<4000;i++){const s=pathSegments[Math.floor(rand()*pathSegments.length)],t=rand(),p=cubic(s,t),spread=rand()>.91?normal()*25:normal()*9;const p2=cubic(s,Math.min(1,t+.002)),angle=Math.atan2(p2[1]-p[1],p2[0]-p[0]);const big=rand();ps.push({x:p[0]-Math.sin(angle)*spread,y:p[1]+Math.cos(angle)*spread,z:normal()*10,r:big>.99?6:big>.95?2.2:big>.76?1.0:.3+rand()*.42,a:.25+rand()*.75,c:rand()>.8?3:Math.floor(rand()*3),phase:rand()*6.28,scatter:rand()*1000});}for(let i=0;i<380;i++){const r=Math.abs(normal())*14,a=rand()*Math.PI*2;ps.push({x:Math.cos(a)*r,y:80+Math.sin(a)*r,z:normal()*18,r:rand()>.9?4:rand()*.8+.3,a:rand(),c:Math.floor(rand()*3),phase:rand()*6.28,scatter:rand()*800});}return ps;}
  function cursorPoints(){const line=[[-90,-145],[-70,160],[-3,102],[60,207],[99,182],[37,78],[131,48],[-90,-145]],ps=[];for(let i=0;i<2500;i++){const j=Math.floor(rand()*(line.length-1)),t=rand();ps.push({x:line[j][0]*(1-t)+line[j+1][0]*t+normal()*4,y:line[j][1]*(1-t)+line[j+1][1]*t+normal()*4,z:normal()*14,r:rand()>.975?3:rand()*.7+.2,a:rand()*.7+.3,c:rand()>.8?3:0,phase:rand()*6.28,scatter:rand()*800});}return ps;}
  function blossomPoints(){const ps=[];for(let k=0;k<6;k++)for(let i=0;i<550;i++){const t=rand()*Math.PI*2,a=k*Math.PI/3;let x=54+Math.cos(t)*90,y=Math.sin(t)*62;ps.push({x:x*Math.cos(a)-y*Math.sin(a)+normal()*3,y:x*Math.sin(a)+y*Math.cos(a)+normal()*3,z:Math.sin(t*2)*25+normal()*4,r:rand()>.98?3:rand()*.8+.2,a:rand()*.8+.2,c:rand()>.8?3:0,phase:rand()*6.28,scatter:rand()*800});}return ps;}
  const scenes=[];
  function scene(canvas,type){
    const ctx=canvas.getContext('2d');let w=0,h=0,dpr=1,lastFrame=0;
    const ps=type==='cursor'?cursorPoints():type==='blossom'?blossomPoints():starPoints();
    for(const p of ps)Object.assign(p,{dx:0,dy:0,vx:0,vy:0});
    const pointer={active:false,id:null,clientX:0,clientY:0,movementX:0,movementY:0};
    const state={x:0,y:0,tx:0,ty:0,down:false,start:performance.now(),visible:true};
    function resize(){
      w=canvas.clientWidth;h=canvas.clientHeight;dpr=Math.min(devicePixelRatio,1.5);
      canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    new ResizeObserver(resize).observe(canvas);resize();
    const clamp=(v,limit)=>Math.max(-limit,Math.min(limit,v));
    function track(e){
      if(pointer.active){
        pointer.movementX=clamp(pointer.movementX+e.clientX-pointer.clientX,80);
        pointer.movementY=clamp(pointer.movementY+e.clientY-pointer.clientY,80);
      }
      pointer.clientX=e.clientX;pointer.clientY=e.clientY;pointer.active=true;
    }
    function clearPointer(){
      state.down=false;pointer.active=false;pointer.id=null;
      pointer.movementX=pointer.movementY=0;
    }
    let prevX=0,prevY=0;
    canvas.addEventListener('pointerdown',e=>{
      if(pointer.id!==null)return;
      pointer.id=e.pointerId;state.down=true;track(e);
      prevX=e.clientX;prevY=e.clientY;canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove',e=>{
      if(pointer.id!==null&&pointer.id!==e.pointerId)return;
      track(e);
      if(state.down){
        state.ty+=(e.clientX-prevX)*.007;state.tx+=(e.clientY-prevY)*.004;
        prevX=e.clientX;prevY=e.clientY;
      }
    });
    canvas.addEventListener('pointerup',e=>{
      if(pointer.id!==e.pointerId)return;
      state.down=false;pointer.id=null;
      if(e.pointerType!=='mouse')clearPointer();
    });
    canvas.addEventListener('pointerleave',()=>{if(!state.down)clearPointer();});
    canvas.addEventListener('pointercancel',e=>{if(pointer.id===e.pointerId)clearPointer();});
    canvas.addEventListener('lostpointercapture',e=>{if(state.down&&pointer.id===e.pointerId)clearPointer();});
    addEventListener('blur',clearPointer);
    document.addEventListener('visibilitychange',()=>{if(document.hidden){clearPointer();lastFrame=0;}});
    canvas.addEventListener('keydown',e=>{
      if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key)){
        e.preventDefault();
        if(e.key==='Home'){state.tx=state.ty=0;}
        else{state.ty+=(e.key==='ArrowRight'?.15:e.key==='ArrowLeft'?-.15:0);state.tx+=(e.key==='ArrowDown'?.15:e.key==='ArrowUp'?-.15:0);}
      }
    });
    new IntersectionObserver(entries=>{
      state.visible=entries[0].isIntersecting;
      if(!state.visible){lastFrame=0;clearPointer();}
    },{rootMargin:'80px'}).observe(canvas);
    const draw=now=>{
      if(!state.visible)return;
      const dt=Math.min(.05,Math.max(.001,lastFrame?(now-lastFrame)/1000:1/30));lastFrame=now;
      state.x+=(state.tx-state.x)*.075;state.y+=(state.ty-state.y)*.075;
      const age=reduceMotion?10:(now-state.start)/1000;
      const form=Math.min(1,age/2.4),ease=1-Math.pow(1-form,4);
      const spin=reduceMotion?0:Math.sin(now*.00012)*.045;
      const ax=state.x,ay=state.y+spin,ca=Math.cos(ay),sa=Math.sin(ay),cx=Math.cos(ax),sx=Math.sin(ax);
      ctx.clearRect(0,0,w,h);ctx.globalCompositeOperation='lighter';
      const scale=type==='astra'?Math.min(h/660,w/720):Math.min(h/430,w/600)*.7;
      const interactionScale=Math.min(1,w/1280);
      const radius=Math.max(65,176*interactionScale),highlightRadius=Math.max(74,196*interactionScale);
      let pointerX=0,pointerY=0,interacting=pointer.active&&!reduceMotion;
      if(interacting){
        const rect=canvas.getBoundingClientRect();
        pointerX=pointer.clientX-rect.left;pointerY=pointer.clientY-rect.top;
        interacting=pointerX>=0&&pointerX<=w&&pointerY>=0&&pointerY<=h;
      }
      const steps=Math.ceil(dt/(1/60)),step=dt/steps;
      for(const p of ps){
        const x=p.x*ca-p.z*sa,z=p.x*sa+p.z*ca,y=p.y*cx-z*sx,z2=p.y*sx+z*cx;
        const perspective=850/(850-z2);
        let X=w/2+x*scale*perspective,Y=h/2+(y+20)*scale*perspective;
        X+=(1-ease)*Math.cos(p.phase+age)*p.scatter;Y+=(1-ease)*Math.sin(p.phase+age)*p.scatter;
        let forceX=0,forceY=0,highlight=0;
        if(interacting){
          const rx=X+p.dx-pointerX,ry=Y+p.dy-pointerY,distance=Math.hypot(rx,ry);
          highlight=.16*Math.pow(Math.max(0,1-distance/highlightRadius),2);
          if(distance<radius){
            const weight=Math.pow(1-distance/radius,2);
            const nx=distance>.01?rx/distance:Math.cos(p.phase),ny=distance>.01?ry/distance:Math.sin(p.phase);
            const strength=52*55*(state.down?2.2:1)*weight;
            forceX=nx*strength;forceY=ny*strength;
            // A moving pointer brushes particles along with it, then the spring restores their shape.
            p.vx+=pointer.movementX*weight*8;p.vy+=pointer.movementY*weight*8;
          }
        }
        if(forceX||forceY||Math.abs(p.dx)+Math.abs(p.dy)+Math.abs(p.vx)+Math.abs(p.vy)>.005){
          const spring=forceX||forceY?55:14,damping=forceX||forceY?11:7;
          for(let i=0;i<steps;i++){
            p.vx+=(forceX-p.dx*spring-p.vx*damping)*step;p.vy+=(forceY-p.dy*spring-p.vy*damping)*step;
            p.dx+=p.vx*step;p.dy+=p.vy*step;
          }
        }else p.dx=p.dy=p.vx=p.vy=0;
        X+=p.dx;Y+=p.dy;
        const r=p.r*scale*perspective*(reduceMotion?1:1+.14*Math.sin(now*.0018+p.phase));
        ctx.globalAlpha=Math.min(1,p.a*(.65+.35*ease)+highlight);ctx.drawImage(sprites[p.c],X-r*4,Y-r*4,r*8,r*8);
      }
      pointer.movementX=pointer.movementY=0;
      ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
    };
    scenes.push(draw);
    return()=>{
      clearPointer();state.start=performance.now();state.tx=state.ty=state.x=state.y=0;
      for(const p of ps)p.dx=p.dy=p.vx=p.vy=0;
    };
  }
  const replay=scene(document.getElementById('astra'),'astra');document.getElementById('replay').addEventListener('click',replay);
  window.initStarScenes=()=>document.querySelectorAll('.interlude canvas:not([data-initialized])').forEach(c=>{c.dataset.initialized='true';scene(c,c.dataset.shape);});
  let last=0;function frame(now){if(!document.hidden&&now-last>28){scenes.forEach(draw=>draw(now));last=now;}requestAnimationFrame(frame);}requestAnimationFrame(frame);
})();
