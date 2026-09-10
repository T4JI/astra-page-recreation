(() => {
  'use strict';
  const script = document.currentScript;
  const base = new URL('./', script.src);
  const current = script.dataset.iteration || 'latest';
  const stages = [
    {id: '1', label: 'First build', time: '2026-09-10T12:16:12-07:00', clock: '12:16 PM PDT'},
    {id: '2', label: 'Pointer interaction', time: '2026-09-10T12:28:27-07:00', clock: '12:28 PM PDT'},
    {id: '3', label: 'Inward flow + closer look', time: '2026-09-10T12:45:32-07:00', clock: '12:45 PM PDT'},
    {id: 'latest', label: 'Spiral from the start'}
  ];
  const selected = stages.find(stage => stage.id === current) || stages[3];
  const nav = document.createElement('nav');
  nav.className = 'iteration-switcher';
  nav.setAttribute('aria-label', 'Recreation iterations');
  const heading = document.createElement('div');
  heading.className = 'iteration-heading';
  const title = document.createElement('strong');
  title.textContent = `${selected.id === 'latest' ? 'Latest' : selected.id} · ${selected.label}`;
  heading.append(title);
  if (selected.time) {
    const time = document.createElement('time');
    time.dateTime = selected.time;
    time.textContent = `Sep 10, 2026 · ${selected.clock}`;
    heading.append(time);
  }
  const links = document.createElement('div');
  links.className = 'iteration-links';
  stages.forEach(stage => {
    const link = document.createElement('a');
    link.href = new URL(stage.id === 'latest' ? './' : `${stage.id}/`, base).href;
    link.textContent = stage.id === 'latest' ? 'Latest' : stage.id;
    link.setAttribute('aria-label', `${stage.id === 'latest' ? 'Latest version' : `Iteration ${stage.id}`}: ${stage.label}`);
    link.title = stage.label;
    if (stage.id === selected.id) link.setAttribute('aria-current', 'page');
    links.append(link);
  });
  nav.append(heading, links);
  document.body.append(nav);
})();
