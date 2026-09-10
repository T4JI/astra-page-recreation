const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// Exercise the actual canvas renderer with deterministic time and pointer events.
function simulation(reduced = false) {
  let now = 0, nextFrame;
  class Element {
    constructor(width = 1000, height = 720) {
      this.clientWidth = width; this.clientHeight = height;
      this.width = width; this.height = height;
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
      return {createRadialGradient: () => ({addColorStop() {}}), fillRect() {}, setTransform() {},
        clearRect() { el.images = []; }, drawImage(sprite, x, y, w, h) { el.images.push([x+w/2, y+h/2]); }};
    }
  }
  const elements = {universe: new Element(), astra: new Element(), replay: new Element()};
  const extras = ['cursor', 'blossom'].map(type => {const el = new Element(1000, 520); el.dataset.shape = type; return el;});
  const doc = Object.assign(new Element(), {hidden: false, createElement: () => new Element(), getElementById: id => elements[id], querySelectorAll: () => extras.filter(el => !el.dataset.initialized)});
  const win = {};
  vm.runInNewContext(fs.readFileSync(require.resolve('../starfield.js'), 'utf8'), {
    document: doc, window: win, matchMedia: () => ({matches: reduced}), devicePixelRatio: 1, innerWidth: 1000, innerHeight: 720,
    performance: {now: () => now}, addEventListener() {}, requestAnimationFrame: cb => {nextFrame = cb;},
    ResizeObserver: class {constructor(cb) {this.cb = cb;} observe() {this.cb();}},
    IntersectionObserver: class {constructor(cb) {this.cb = cb;} observe() {this.cb([{isIntersecting: true}]);}}
  });
  win.initStarScenes();
  const step = (count = 1, duration = 1000/30) => {for (let i=0; i<count; i++) {now += duration; nextFrame(now);}};
  step(180);
  return {scenes: [elements.astra, ...extras], step, replay: elements.replay, setHidden(value) {doc.hidden=value; doc.fire('visibilitychange');}};
}
const displacement = (a,b) => a.images.map((p,i) => Math.hypot(p[0]-b.images[i][0],p[1]-b.images[i][1]));

for (const [index, name] of ['Astra', 'cursor', 'blossom'].entries()) {
  test(`${name}: hovering disturbs nearby stars without dragging, then they settle`, () => {
    const control = simulation(), interactive = simulation();
    const canvas = interactive.scenes[index], baseline = control.scenes[index];
    // Brush an edge of the shape so the opposite side provides an unaffected control.
    const [x,y] = canvas.images.reduce((left,point) => point[0]<left[0]?point:left);
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
  const [x,y] = canvas.images[2100];
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
  const canvas = interactive.scenes[0]; const [x,y] = canvas.images[2100];
  canvas.fire('pointermove', {clientX: x, clientY: y}); control.step(20); interactive.step(20);
  assert.ok(Math.max(...displacement(canvas, control.scenes[0])) < .01);
});


test('switching tabs without blur releases a held pointer', () => {
  const control = simulation(), interactive = simulation();
  const canvas = interactive.scenes[0], baseline = control.scenes[0];
  const [x,y] = canvas.images[2100];
  canvas.fire('pointerdown', {clientX: x, clientY: y});
  control.step(8); interactive.step(8);
  interactive.setHidden(true); control.step(30); interactive.step(30);
  interactive.setHidden(false); control.step(150); interactive.step(150);
  assert.ok(Math.max(...displacement(canvas, baseline)) < .3, 'A hidden page must release any held pointer');
});

test('a secondary pointer cancellation does not cancel the primary drag', () => {
  const control = simulation(), interactive = simulation();
  const canvas = interactive.scenes[0], baseline = control.scenes[0];
  const [x,y] = canvas.images[2100];
  for (const el of [canvas,baseline]) el.fire('pointerdown', {clientX: x, clientY: y});
  canvas.fire('pointercancel', {pointerId: 2});
  canvas.fire('lostpointercapture', {pointerId: 2});
  for (const el of [canvas,baseline]) el.fire('pointermove', {clientX: x+30, clientY: y+10});
  control.step(8); interactive.step(8);
  assert.ok(Math.max(...displacement(canvas, baseline)) < .01, 'Only the captured pointer may cancel its drag');
});
