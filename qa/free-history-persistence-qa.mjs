import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Test the candidate in isolation. Public download links stay on v1.2.0
// until a human reviews and approves a separate release.
const source = fs.readFileSync('downloads/Calculator_Suite_Free_v1.2.1.txt', 'utf8');
const match = source.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(match, 'Candidate Free app script missing');
const storage = new Map();
const storageKey = 'digital-execution:calculator-free:history:v1';
const createApp = () => {
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) {
      const e = {
        textContent: '', disabled: false, listeners: {}, children: [],
        addEventListener(type, fn) { this.listeners[type] = fn; },
        replaceChildren() { this.children = []; },
        append(...nodes) { this.children.push(...nodes); },
      };
      if (id.endsWith('-form')) {
        e.fields = {};
        e.elements = {namedItem: name => ({value:e.fields[name] ?? ''})};
      }
      elements.set(id,e);
    }
    return elements.get(id);
  };
  const document = {
    getElementById:element,
    createElement:() => ({textContent:'',children:[],append(...nodes){this.children.push(...nodes);}}),
  };
  const localStorage = {
    getItem:k => storage.has(k) ? storage.get(k) : null,
    setItem:(k,v) => storage.set(k,v),
  };
  vm.runInNewContext(match[1], {
    document, localStorage, Intl, Number, Date, Math, JSON, Object,
    confirm:()=>true, window:{print(){}}, setTimeout,
  }, {filename:'Calculator_Suite_Free_v1.2.1.txt'});
  return {element};
};
const app = createApp();
function calculate(kind,fields) {
  const form=app.element(kind+'-form');
  form.fields=fields;
  form.listeners.submit({preventDefault(){},currentTarget:form});
  assert.equal(app.element('save-'+kind).disabled,false,kind+' save must be enabled');
  app.element('save-'+kind).listeners.click();
}
calculate('pricing',{cost:'1000000000000',shipping:'0',extra:'0',markup:'1000000000000'});
calculate('break',{fixed:'1000000000000',sale:'1000000000000',variable:'999999999999'});
const persisted=JSON.parse(storage.get(storageKey));
assert.equal(persisted.length,2);
assert.ok(persisted[0].outputs.revenue>1e15);
assert.ok(persisted[1].outputs.price>1e15);
const reloaded=createApp();
const rows=reloaded.element('history-list').children;
assert.equal(rows.length,2,'Large finite saved calculations must survive reload');
assert.ok(rows.every(row=>row.children.length>0),'Both saved records must render');
const backup = JSON.stringify({
  format:'digital-execution-calculator-free-backup',
  version:1,
  records:persisted,
});
storage.clear();
const restored=createApp();
const picker=restored.element('backup-file');
picker.files=[{size:backup.length,text:async()=>backup}];
await picker.listeners.change();
assert.equal(restored.element('history-list').children.length,2,
  'Portable JSON restore must retain large finite results');
assert.equal(JSON.parse(storage.get(storageKey)).length,2,
  'Restored large results must be persisted locally');
console.log('PASS Free v1.2.1: large finite pricing and break-even results survive reload and JSON restore');
