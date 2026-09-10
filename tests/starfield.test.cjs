const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const rendererSource = fs.readFileSync(require.resolve('../starfield.js'), 'utf8');

// Exercise the actual canvas renderer with deterministic time and pointer events.
function simulation(reduced = false, {width = 1000, height = 720, interludeHeight = 520, interludes = true, warmupFrames = 180} = {}) {
  let now = 0, nextFrame;
  class Element {
    constructor(elementWidth = width, elementHeight = height) {
      this.clientWidth = elementWidth; this.clientHeight = elementHeight;
      this.width = elementWidth; this.height = elementHeight;
      this.dataset = {}; this.events = {}; this.images = [];
    }
    addEventListener(name, fn) { (this.events[name] ||= []).push(fn); }
    fire(name, values = {}) {
      for (const fn of this.events[name] || []) fn({pointerId: 1, pointerType: 'mouse', clientX: 0, clientY: 0, preventDefault() {}, ...values});
    }
    getBoundingClientRect() { return {left: 0, top: 0, width: this.clientWidth, height: this.clientHeight}; }
    setPointerCapture() {} releasePointerCapture() {} hasPointerCapture() { return true; }
    getContext() {
      const el = this;
      return {globalAlpha: 1, createRadialGradient: () => ({addColorStop() {}}), fillRect() {}, setTransform() {},
        clearRect() { el.images = []; }, drawImage(sprite, x, y, w, h) { el.images.push([x+w/2, y+h/2, w, h, this.globalAlpha]); }};
    }
  }
  const elements = {universe: new Element(), astra: new Element(), replay: new Element()};
  const extras = ['cursor', 'blossom'].map(type => {const el = new Element(width, interludeHeight); el.dataset.shape = type; return el;});
  const doc = Object.assign(new Element(), {hidden: false, createElement: () => new Element(), getElementById: id => elements[id], querySelectorAll: () => extras.filter(el => !el.dataset.initialized)});
  const win = {};
  vm.runInNewContext(rendererSource, {
    document: doc, window: win, matchMedia: () => ({matches: reduced}), devicePixelRatio: 1, innerWidth: width, innerHeight: height,
    performance: {now: () => now}, addEventListener() {}, requestAnimationFrame: cb => {nextFrame = cb;},
    ResizeObserver: class {constructor(cb) {this.cb = cb;} observe() {this.cb();}},
    IntersectionObserver: class {constructor(cb) {this.cb = cb;} observe() {this.cb([{isIntersecting: true}]);}}
  });
  if (interludes) win.initStarScenes();
  const step = (count = 1, duration = 1000/30) => {for (let i=0; i<count; i++) {now += duration; nextFrame(now);}};
  step(warmupFrames);
  return {scenes: [elements.astra, ...(interludes ? extras : [])], step, replay: elements.replay, setHidden(value) {doc.hidden=value; doc.fire('visibilitychange');}};
}
const displacement = (a,b) => a.images.map((p,i) => Math.hypot(p[0]-b.images[i][0],p[1]-b.images[i][1]));
function visiblePointerTarget(canvas) {
  const visible = canvas.images.filter(([x,y,w,h,alpha]) =>
    x >= 0 && x <= canvas.clientWidth && y >= 0 && y <= canvas.clientHeight && w > 0 && h > 0 && alpha > .1);
  assert.ok(visible.length, 'The scene must contain visible stars to interact with');
  // Brush the visible edge, preserving the opposite side as an unaffected control.
  return visible.reduce((left,point) => point[0] < left[0] ? point : left);
}

for (const [index, name] of ['Astra', 'cursor', 'blossom'].entries()) {
  test(`${name}: hovering disturbs nearby stars without dragging, then they settle`, () => {
    const control = simulation(), interactive = simulation();
    const canvas = interactive.scenes[index], baseline = control.scenes[index];
    const [x,y] = visiblePointerTarget(canvas);
    canvas.fire('pointermove', {clientX: x, clientY: y});
    control.step(12); interactive.step(12);
    const moved = displacement(canvas, baseline);
    assert.ok(moved.filter(d => d > 4).length >= 10, 'Hover must displace individual nearby stars');
    assert.ok(moved.filter(d => d < .01).length > moved.length / 3, 'Distant stars must retain their shape');
    canvas.fire('pointerleave'); control.step(150); interactive.step(150);
    assert.ok(Math.max(...displacement(canvas, baseline)) < .3, 'Stars must return to their undisturbed positions');
  });
}

test('touch cancellation releases disturbance and replay clears particle offsets', () => {
  const control = simulation(), interactive = simulation();
  const canvas = interactive.scenes[0], baseline = control.scenes[0];
  const [x,y] = visiblePointerTarget(canvas);
  canvas.fire('pointerdown', {pointerType: 'touch', clientX: x, clientY: y});
  control.step(8); interactive.step(8);
  assert.ok(Math.max(...displacement(canvas, baseline)) > 4);
  canvas.fire('pointercancel', {pointerType: 'touch'}); control.step(150); interactive.step(150);
  assert.ok(Math.max(...displacement(canvas, baseline)) < .3);
  canvas.fire('pointermove', {clientX: x, clientY: y}); control.step(8); interactive.step(8);
  control.replay.fire('click'); interactive.replay.fire('click'); control.step(); interactive.step();
  assert.ok(Math.max(...displacement(canvas, baseline)) < .01, 'Replay must start with a clean particle state');
});

test('reduced motion avoids ambient pointer displacement', () => {
  const control = simulation(true), interactive = simulation(true);
  const canvas = interactive.scenes[0]; const [x,y] = visiblePointerTarget(canvas);
  canvas.fire('pointermove', {clientX: x, clientY: y}); control.step(20); interactive.step(20);
  assert.ok(Math.max(...displacement(canvas, control.scenes[0])) < .01);
});

test('reduced motion keeps idle centers, opacity, and size unchanged over time', () => {
  const sim = simulation(true);
  const before = sim.scenes.map(canvas => canvas.images.map(point => [...point]));
  for (const duration of [10000, 20000]) {
    sim.step(1, duration);
    sim.scenes.forEach((canvas,index) => {
      assert.deepEqual(canvas.images, before[index], 'Reduced motion must freeze idle flow, twinkle, and rotation');
    });
  }
});


test('switching tabs without blur releases a held pointer', () => {
  const control = simulation(), interactive = simulation();
  const canvas = interactive.scenes[0], baseline = control.scenes[0];
  const [x,y] = visiblePointerTarget(canvas);
  canvas.fire('pointerdown', {clientX: x, clientY: y});
  control.step(8); interactive.step(8);
  interactive.setHidden(true); control.step(30); interactive.step(30);
  interactive.setHidden(false); control.step(150); interactive.step(150);
  assert.ok(Math.max(...displacement(canvas, baseline)) < .3, 'A hidden page must release any held pointer');
});

test('a secondary pointer cancellation does not cancel the primary drag', () => {
  const control = simulation(), interactive = simulation();
  const canvas = interactive.scenes[0], baseline = control.scenes[0];
  const [x,y] = visiblePointerTarget(canvas);
  for (const el of [canvas,baseline]) el.fire('pointerdown', {clientX: x, clientY: y});
  canvas.fire('pointercancel', {pointerId: 2});
  canvas.fire('lostpointercapture', {pointerId: 2});
  for (const el of [canvas,baseline]) el.fire('pointermove', {clientX: x+30, clientY: y+10});
  control.step(8); interactive.step(8);
  assert.ok(Math.max(...displacement(canvas, baseline)) < .01, 'Only the captured pointer may cancel its drag');
});

// The authored first trail contains 880 particles; the final 96 form the core.
// Track their actual draw calls, without accessing renderer internals.
const mainTrailCount = 880, coreCount = 96;
function flowSimulation(options = {}) {
  const sim = simulation(false, {interludes: false, warmupFrames: 0, ...options});
  sim.step(1, 6000); // Advance to a stable point in the continuous idle flow.
  return sim;
}
function coreCenter(images) {
  const core = images.slice(-coreCount);
  return core.reduce(([x,y],p) => [x+p[0]/core.length, y+p[1]/core.length], [0,0]);
}
const distanceTo = (point,center) => Math.hypot(point[0]-center[0],point[1]-center[1]);

test('hero opens fully formed on the first frame at desktop, mobile, and build-preview sizes', () => {
  for (const options of [{width:1440,height:900},{width:390,height:844},{width:480,height:520}]) {
    const settings={...options,interludes:false,warmupFrames:0};
    const animated=simulation(false,settings), formed=simulation(true,settings);
    animated.step(1,30); formed.step(1,30);
    const actual=animated.scenes[0].images, reference=formed.scenes[0].images;
    const visible=reference.map((p,i)=>({p,i})).filter(({p})=>p[4]>.1);
    assert.ok(visible.length>3000,'The formed reference must contain the full star field');
    assert.ok(visible.every(({i})=>actual[i][4]>.05),'Stars must be visible immediately');
    assert.ok(visible.every(({p,i})=>distanceTo(actual[i],p)<Math.max(options.width,options.height)*.005),
      'The first frame must already follow the spiral, allowing only 30 ms of inward motion');
  }
});

test('reset returns directly to the opening spiral without a scattered transition', () => {
  const sim=simulation(false,{interludes:false,warmupFrames:0}), canvas=sim.scenes[0];
  sim.step(1,30);
  const opening=canvas.images.map(p=>[...p]);
  const [x,y]=visiblePointerTarget(canvas);
  canvas.fire('pointerdown',{clientX:x,clientY:y});
  canvas.fire('pointermove',{clientX:x+30,clientY:y+10});
  sim.step(12);
  sim.replay.fire('click'); sim.step(1,30);
  assert.deepEqual(canvas.images,opening,'Reset must clear rotation and brush offsets and restore the fully formed first frame');
});

test('hero idle flow carries the outer trail inward', () => {
  const sim = flowSimulation(), canvas = sim.scenes[0], before = canvas.images;
  const center = coreCenter(before);
  const cohort = before.slice(0,mainTrailCount).map((point,index) => ({point,index}))
    .filter(({point}) => point[1] < canvas.clientHeight*.2 && point[4] > .2);
  assert.ok(cohort.length >= 20, 'The outer trail must contain a visible cohort');
  sim.step(1, 8000);
  const inward = cohort.filter(({point,index}) =>
    distanceTo(point,center)-distanceTo(canvas.images[index],center) > 40);
  assert.ok(inward.length >= cohort.length*.8, 'Most outer stars must travel toward the core without pointer input');
});

test('hero stars fade, wrap to the outer trail, and replenish without changing count', () => {
  const sim = flowSimulation(), canvas = sim.scenes[0], count = canvas.images.length;
  const center = coreCenter(canvas.images), wraps = new Map();
  let previous = canvas.images;
  for (let frame=0; frame<220; frame++) { // 55 simulated seconds, just over one main-trail cycle.
    sim.step(1, 250);
    const current = canvas.images;
    assert.equal(current.length, count, 'Recycling must keep the particle population fixed');
    for (let i=0; i<mainTrailCount; i++) {
      const before=previous[i], after=current[i];
      if (distanceTo(after,before) > canvas.clientHeight*.4) {
        assert.ok(before[4] < .05 && after[4] < .05, 'An endpoint jump must happen while the star is faded');
        assert.ok(distanceTo(before,center) < canvas.clientHeight*.1, 'Stars must finish near the core');
        assert.ok(after[1] < canvas.clientHeight*.2, 'Recycled stars must restart at the outer trail');
        if (!wraps.has(i)) wraps.set(i,{birth: after, visibleAgain: false});
      }
      const wrap=wraps.get(i);
      if (wrap && after[4] > .2 && distanceTo(after,wrap.birth) > 5) wrap.visibleAgain=true;
    }
    previous=current;
  }
  assert.ok(wraps.size >= mainTrailCount*.9, 'A full cycle must recycle nearly every main-trail star');
  assert.ok([...wraps.values()].filter(w=>w.visibleAgain).length >= mainTrailCount*.9,
    'Recycled stars must become visible and resume moving');
});

test('hero flow stays finite and populated at late times on desktop and mobile', () => {
  for (const options of [{width:1000,height:720},{width:390,height:844}]) {
    const sim=flowSimulation(options), canvas=sim.scenes[0], count=canvas.images.length;
    for (const elapsed of [60000,3600000,86400000,2592000000]) {
      sim.step(1,elapsed);
      assert.equal(canvas.images.length,count,'Long-running flow must not lose particles');
      assert.ok(canvas.images.every(p=>p.every(Number.isFinite)), 'Draw coordinates, sizes, and opacity must remain finite');
      assert.ok(canvas.images.every(([x,y,w,h,a])=>w>0&&h>0&&a>=0&&a<=1&&Math.abs(x)<options.width*4&&Math.abs(y)<options.height*4),
        'Late-time output must remain bounded and drawable');
      assert.ok(canvas.images.filter(p=>p[4]>.1).length > count*.5, 'The scene must remain visibly populated after many cycles');
    }
  }
});

test('hero idle motion agrees at 30 and 60 Hz after equal elapsed time', () => {
  const slower=flowSimulation(), faster=flowSimulation();
  slower.step(60,1000/30); faster.step(120,1000/60);
  const a=slower.scenes[0].images, b=faster.scenes[0].images;
  assert.equal(a.length,b.length);
  assert.ok(a.every((p,i)=>p.every((value,j)=>Math.abs(value-b[i][j])<1e-6)),
    'Idle positions, sizes, and opacity must depend on elapsed time, not refresh rate');
});
