const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const read = file => fs.readFileSync(path.join(root, file));
const versions = ['1', '2', '3'];

for (const number of versions) {
  test(`iteration ${number}: historical source is frozen and shared assets match`, () => {
    const manifest = JSON.parse(read(`${number}/provenance.json`));
    for (const [name, expected] of Object.entries(manifest.files)) {
      const archived = read(`${number}/${name}`);
      assert.equal(hash(archived), expected.archiveSHA256, `${name}: archive unexpectedly changed`);
      let original = archived.toString().replaceAll('../assets/', './assets/');
      if (name === 'index.html') {
        original = original.replace(`<title>Iteration ${number}: ${manifest.label} • Astra recreation</title>`, '<title>GPT-6 Astra • Unofficial recreation</title>')
          .replace(`<link rel="stylesheet" href="../iterations.css?v=1"><script src="../iterations.js?v=1" data-iteration="${number}" defer></script>`, '');
      }
      assert.equal(hash(original), expected.sourceSHA256, `${name}: changes exceed routing and navigation`);
    }
    for (const [name, sha] of Object.entries(manifest.sharedAssets)) {
      assert.equal(hash(read(name)), sha, `${name}: shared asset diverged from historical version`);
    }
    assert.match(read(`${number}/index.html`).toString(), /Unofficial educational recreation/);
  });

  test(`iteration ${number}: page, article, chart, fonts, and PDF resources resolve under a project subpath`, () => {
    const base = new URL(`https://example.test/astra-page-recreation/${number}/`);
    const html = read(`${number}/index.html`).toString();
    const urls = [...html.matchAll(/(?:src|href)="(\.[^"]+)"/g)].map(match => match[1]);
    for (const name of ['article.js', 'charts.js', 'interactions.js', 'style.css']) {
      urls.push(...[...read(`${number}/${name}`).toString().matchAll(/['"](\.\.?\/[^'"\s]+)['"]/g)].map(match => match[1]));
    }
    urls.push(...Object.values(JSON.parse(read(`${number}/asset-map.json`))));
    for (const reference of urls) {
      const url = new URL(reference, base);
      assert.ok(url.pathname.startsWith('/astra-page-recreation/'), `${reference} escapes the project`);
      const local = path.join(root, decodeURIComponent(url.pathname.slice('/astra-page-recreation/'.length)));
      assert.ok(fs.existsSync(local), `${reference} resolves to missing ${local}`);
    }
    const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(match => new URL(match[1], base).pathname);
    assert.ok(scripts.includes(`/astra-page-recreation/${number}/starfield.js`), 'Renderer must come from the frozen version');
    assert.ok(!scripts.includes('/astra-page-recreation/starfield.js'), 'Historical page must not use the latest renderer');
  });
}

test('version navigation resolves from its script URL and identifies the active page', () => {
  class Element {
    constructor(tag) { this.tag = tag; this.children = []; this.attributes = {}; }
    append(...children) { this.children.push(...children); }
    setAttribute(key, value) { this.attributes[key] = value; }
  }
  for (const version of [...versions, 'latest']) {
    const body = new Element('body');
    vm.runInNewContext(read('iterations.js').toString(), {
      URL,
      document: {
        currentScript: {src: 'https://example.test/astra-page-recreation/iterations.js?v=1', dataset: {iteration: version}},
        createElement: tag => new Element(tag),
        body
      }
    });
    const nav = body.children[0];
    const links = nav.children[1].children;
    assert.equal(nav.attributes['aria-label'], 'Recreation iterations');
    assert.deepEqual(links.map(link => new URL(link.href).pathname), ['/astra-page-recreation/1/', '/astra-page-recreation/2/', '/astra-page-recreation/3/', '/astra-page-recreation/']);
    assert.equal(links.filter(link => link.attributes['aria-current'] === 'page').length, 1);
    assert.equal(links[version === 'latest' ? 3 : Number(version) - 1].attributes['aria-current'], 'page');
  }
});
