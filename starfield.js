(() => {
  'use strict';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let seed = 136;
  function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
  function normal(){return Math.sqrt(-2*Math.log(Math.max(.00001,rand())))*Math.cos(6.283185*rand());}
  const colors=['#d8ecff','#a1cfff','#fff5e5','#ffbc80'];
  const sprites=colors.map(color=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'#ffffff');g.addColorStop(.08,color);g.addColorStop(.18,color+'c0');g.addColorStop(.4,color+'25');g.addColorStop(1,color+'00');x.fillStyle=g;x.fillRect(0,0,64,64);return c;});
  const bg=document.getElementById('universe'),bc=bg.getContext('2d');
  const bgStars=Array.from({length:550},()=>({x:rand(),y:rand(),r:rand()>.98?1.4:rand()*.65+.12,a:rand()*.55+.12,c:Math.floor(rand()*4)}));
  function background(){const d=Math.min(devicePixelRatio,1.5),w=innerWidth,h=innerHeight;bg.width=w*d;bg.height=h*d;bc.setTransform(d,0,0,d,0,0);const grad=bc.createRadialGradient(w/2,h*.4,0,w/2,h*.4,w*.66);grad.addColorStop(0,'#000203');grad.addColorStop(.46,'#020709');grad.addColorStop(.82,'#071018');grad.addColorStop(1,'#03070a');bc.fillStyle=grad;bc.fillRect(0,0,w,h);for(const s of bgStars){let opacity=s.a*(.03+.97*Math.pow(Math.abs(s.x-.5)*2,2.0));bc.globalAlpha=opacity;bc.drawImage(sprites[s.c],s.x*w-s.r*4,s.y*h-s.r*4,s.r*8,s.r*8);}bc.globalAlpha=1;}
  addEventListener('resize',background,{passive:true});background();

  const TAU=Math.PI*2;
  const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
  const mix=(a,b,t)=>a+(b-a)*t;
  const fract=x=>x-Math.floor(x);
  // Authored spiral paths from the reference hero, in its 231 x 325 view box.
  const heroPaths=["M128.472 2.36011C65.4727 24.3601 10.7725 93.1601 9.97246 162.36C8.97246 248.86 79.4138 262.86 87.9725 262.86C116.973 262.86 135.973 244.36 135.973 221.36C135.973 189.86 102.973 193.86 102.973 209.36","M224.973 31.8602C132.473 3.86011 29.9727 75.8601 29.9727 159.86C29.9727 247.86 98.4726 259.86 126.473 247.86","M126.473 215.359C124.639 222.692 117.073 237.159 101.473 236.359C89.1905 235.729 76.0585 219.995 76.4724 195.859C76.4724 165.859 100.473 142.859 132.473 142.859C171.973 142.859 213.473 171.36 213.473 231.36C213.473 276.36 170.473 328.36 85.9727 316.86","M106.973 237.36C81.9727 240.36 61.4727 222.86 61.4727 184.86C61.4727 153.36 91.9727 123.36 132.473 123.36C172.973 123.36 227.973 149.86 227.973 225.36C227.973 287.36 168.473 322.36 121.473 322.36C53.4727 322.36 10.9727 264.86 2.47266 208.36","M114.973 211.36C114.973 225.86 92.4727 226.86 92.4727 205.36C92.4727 183.86 109.938 175.36 127.973 175.36C146.008 175.36 174.473 195.86 174.473 230.86C174.473 264.36 148.473 281.86 133.973 287.36C119.473 292.86 81.6727 296.56 54.4727 269.36"];
  const heroLayers=[{depth:.62,speed:.025,strong:true},{depth:-.46,speed:.018,strong:false},{depth:.78,speed:-.021,strong:true},{depth:-.7,speed:-.016,strong:false},{depth:.42,speed:-.03,strong:true}];
  const heroColors=['#6dcbf4','#7ab1fe','#f87915','#fa994c','#f5f6fb'];
  function heroColor(){const n=rand();return n<.36?0:n<.52?1:n<.64?2:n<.74?3:4;}
  function makeStarSprite(color,bright){
    const c=document.createElement('canvas');c.width=c.height=128;
    const x=c.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);
    const stops=bright?[[0,'#ffffff'],[.04,'#ffffff'],[.085,'#f0f5fff0'],[.14,color+'9a'],[.24,color+'40'],[.5,color+'16'],[1,color+'00']]:[[0,color],[.16,color],[.35,color+'df'],[.55,color+'90'],[.8,color+'15'],[1,color+'00']];
    for(const [at,c] of stops)g.addColorStop(at,c);
    x.fillStyle=g;x.fillRect(0,0,128,128);return c;
  }
  const heroSprites=heroColors.map(c=>[makeStarSprite(c,false),makeStarSprite(c,true)]);
  function cubic(s,t){const u=1-t;return [u*u*u*s[0][0]+3*u*u*t*s[1][0]+3*u*t*t*s[2][0]+t*t*t*s[3][0],u*u*u*s[0][1]+3*u*u*t*s[1][1]+3*u*t*t*s[2][1]+t*t*t*s[3][1]];}
  function resample(points,count){
    const lengths=[0];
    for(let i=1;i<points.length;i++)lengths.push(lengths[i-1]+Math.hypot(...points[i].map((v,j)=>v-points[i-1][j])));
    const total=lengths[lengths.length-1],out=[];let j=1;
    for(let i=0;i<count;i++){
      const distance=total*i/(count-1);
      while(j<points.length-1&&lengths[j]<distance)j++;
      const t=(distance-lengths[j-1])/(lengths[j]-lengths[j-1]||1);
      out.push(points[j].map((v,k)=>mix(points[j-1][k],v,t)));
    }
    return out;
  }
  // Arc-length lookup keeps speed even through tight bends without rebuilding paths each frame.
  heroPaths.forEach((path,index)=>{
    const n=path.match(/-?\d*\.?\d+/g).map(Number),points=[];let start=n.slice(0,2);
    for(let i=2;i<n.length;i+=6){
      const segment=[start,n.slice(i,i+2),n.slice(i+2,i+4),n.slice(i+4,i+6)];
      for(let j=0;j<160;j++)points.push(cubic(segment,j/160));
      start=segment[3];
    }
    points.push(start);
    const flat=resample(points,641),layer=heroLayers[index];
    layer.samples=resample(flat.map(([x,y],i)=>{const t=i/640;return [(x-114.973)*9.7/325,(211.36-y)*9.7/325,Math.sin(t*Math.PI*1.35+.82*index)*layer.depth*1.4*Math.sin(t*Math.PI)];}),512);
  });
  function starPoints(){
    const ps=[];
    for(const layer of heroLayers){
      for(let i=0;i<(layer.strong?880:680);i++){
        const travel=rand(),t=travel+.22*Math.sin(travel*TAU)/TAU,middle=Math.sin(t*Math.PI);
        const spread=.4*mix(.3,1,middle)*(.22+.78*rand());
        const across=(rand()+rand()-1)*spread,depth=(rand()+rand()-1)*spread*.65;
        const bright=rand()<mix((layer.strong?.085:.055)*.22,layer.strong?.085:.055,middle);
        ps.push({layer,travel,across,depth,r:(bright?.85+1.25*rand():.12+rand()**2.4*.68)*2.05,bright,
          a:.82+.16*rand(),c:heroColor(),phase:rand()*TAU,rate:.65+.7*rand(),scatter:rand()*1000,
          x:0,y:0,z:0,visibility:1,envelope:1,cycle:null});
      }
    }
    for(let i=0;i<96;i++){
      const r=rand()**2.4*.42,angle=rand()*TAU,weight=1-r/.42;
      ps.push({x:Math.cos(angle)*r,y:Math.sin(angle)*r*.72,z:(rand()-.5)*.16,
        r:(.28+1.45*weight+.45*rand())*2.05*.8,bright:true,core:true,
        a:.62+.38*weight,c:weight>.74?4:heroColor(),phase:rand()*TAU,rate:.55+.45*rand(),scatter:rand()*800,visibility:1,envelope:1});
    }
    return ps;
  }
  function moveAlongPath(p,elapsed){
    if(!p.layer)return;
    const travel=p.travel+elapsed*p.layer.speed*.8,cycle=Math.floor(travel),phase=fract(travel);
    // Reuse particles only while invisible at a path endpoint. Never carry a brush impulse across the wrap.
    if(p.cycle!==null&&cycle!==p.cycle)p.dx=p.dy=p.vx=p.vy=0;
    p.cycle=cycle;
    const t=phase+.22*Math.sin(phase*TAU)/TAU,samples=p.layer.samples,scaled=t*511;
    const i=Math.min(510,Math.floor(scaled)),blend=scaled-i,a=samples[i],b=samples[i+1];
    const tangentX=b[0]-a[0],tangentY=b[1]-a[1],length=Math.hypot(tangentX,tangentY)||1;
    p.x=mix(a[0],b[0],blend)-tangentY/length*p.across;
    p.y=mix(a[1],b[1],blend)+tangentX/length*p.across;
    p.z=mix(a[2],b[2],blend)+p.depth;
    p.visibility=smooth(0,.055,t)*(1-smooth(.945,1,t));
    p.envelope=mix(1,.14+.86*Math.max(0,Math.sin(t*Math.PI))**.68,.45);
  }
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
      w=canvas.clientWidth;h=canvas.clientHeight;dpr=Math.min(devicePixelRatio,2);
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
      const hero=type==='astra',flowTime=reduceMotion?0:Math.max(0,age-3);
      const form=Math.min(1,age/(hero?5.5:2.4)),ease=1-Math.pow(1-form,4);
      const spin=reduceMotion||hero?0:Math.sin(now*.00012)*.045;
      const ax=state.x,ay=state.y+spin,ca=Math.cos(ay),sa=Math.sin(ay),cx=Math.cos(ax),sx=Math.sin(ax);
      ctx.clearRect(0,0,w,h);ctx.globalCompositeOperation='lighter';
      const scale=hero?Math.min(h/(w/h<.72?12.7:10.9),w/7.4):Math.min(h/430,w/600)*.7;
      const coreAngle=flowTime*.288,coreCos=Math.cos(coreAngle),coreSin=Math.sin(coreAngle);
      const interactionScale=Math.min(1,w/1280);
      const radius=Math.max(65,176*interactionScale),highlightRadius=Math.max(74,196*interactionScale);
      let pointerX=0,pointerY=0,interacting=pointer.active&&!reduceMotion;
      if(interacting){
        const rect=canvas.getBoundingClientRect();
        pointerX=pointer.clientX-rect.left;pointerY=pointer.clientY-rect.top;
        interacting=pointerX>=0&&pointerX<=w&&pointerY>=0&&pointerY<=h;
      }
      const steps=Math.ceil(dt/(1/60)),step=dt/steps;
      if(hero){
        const glowRadius=scale*1.9,glowX=w/2,glowY=h/2+1.2*scale;
        const glow=ctx.createRadialGradient(glowX,glowY,0,glowX,glowY,glowRadius);
        glow.addColorStop(0,'#eaf2ff9a');glow.addColorStop(.15,'#e2edff69');glow.addColorStop(.4,'#bfcddd30');glow.addColorStop(.75,'#acbdd510');glow.addColorStop(1,'#aebdce00');
        ctx.globalAlpha=ease;ctx.fillStyle=glow;ctx.fillRect(glowX-glowRadius,glowY-glowRadius,glowRadius*2,glowRadius*2);
      }
      for(const p of ps){
        if(hero)moveAlongPath(p,flowTime);
        const px=hero&&p.core?p.x*coreCos-p.y*coreSin:p.x,py=hero&&p.core?p.x*coreSin+p.y*coreCos:p.y;
        const x=px*ca-p.z*sa,z=px*sa+p.z*ca,y=py*cx-z*sx,z2=py*sx+z*cx;
        const perspective=hero?1:850/(850-z2);
        let X=w/2+x*scale*perspective,Y=hero?h/2+(1.2-y)*scale:h/2+(y+20)*scale*perspective;
        if(hero&&!reduceMotion){
          const local=Math.max(0,Math.min(1,(form-.14-fract(p.phase)*.18)/(.58+p.rate*.07)));
          const pull=local*local*local*(local*(local*6-15)+10),angle=Math.sin(pull*Math.PI)*.55;
          const scatteredX=Math.cos(p.phase+angle)*p.scatter*.75,scatteredY=Math.sin(p.phase+angle)*p.scatter*.65;
          X=mix(w/2+scatteredX,X,pull);Y=mix(h/2+scatteredY,Y,pull);
        }else{
          X+=(1-ease)*Math.cos(p.phase+age)*p.scatter;Y+=(1-ease)*Math.sin(p.phase+age)*p.scatter;
        }
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
        if(hero){
          const twinkle=reduceMotion?1:.86+.14*Math.sin(p.phase+flowTime*.62*p.rate);
          const diameter=(.35+p.r*p.envelope*p.visibility*3.8)*(.97+twinkle*.03);
          const size=diameter*(p.core?1.7:p.bright?4:1.15);
          ctx.globalAlpha=Math.min(1,(p.a*twinkle*(p.core?.34:1)+highlight)*p.visibility*smooth(0,.2,form));
          ctx.drawImage(heroSprites[p.c][Number(p.bright)],X-size/2,Y-size/2,size,size);
        }else{
          const r=p.r*scale*perspective*(reduceMotion?1:1+.14*Math.sin(now*.0018+p.phase));
          ctx.globalAlpha=Math.min(1,p.a*(.65+.35*ease)+highlight);ctx.drawImage(sprites[p.c],X-r*4,Y-r*4,r*8,r*8);
        }
      }
      pointer.movementX=pointer.movementY=0;
      ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
    };
    scenes.push(draw);
    return()=>{
      clearPointer();state.start=performance.now();state.tx=state.ty=state.x=state.y=0;
      for(const p of ps){p.dx=p.dy=p.vx=p.vy=0;p.cycle=null;}
    };
  }
  const replay=scene(document.getElementById('astra'),'astra');document.getElementById('replay').addEventListener('click',replay);
  window.initStarScenes=()=>document.querySelectorAll('.interlude canvas:not([data-initialized])').forEach(c=>{c.dataset.initialized='true';scene(c,c.dataset.shape);});
  let last=0;function frame(now){if(!document.hidden&&now-last>28){scenes.forEach(draw=>draw(now));last=now;}requestAnimationFrame(frame);}requestAnimationFrame(frame);
})();
