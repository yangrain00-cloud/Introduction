(() => {
  const control = document.querySelector('.language-switch');
  const views = document.getElementById('views');
  const parameters = new URLSearchParams(location.search);
  const requestedView = parameters.get('view');

  if (requestedView && views && !location.hash.startsWith('#sector-')) {
    const button = [...views.querySelectorAll('[data-view]')]
      .find(item => item.dataset.view === requestedView);
    if (button && !button.classList.contains('active')) button.click();
  }

  function updateDestination() {
    const destination = new URL(control.dataset.alternate, location.href);
    destination.search = location.search;
    destination.hash = location.hash;
    const view = views?.querySelector('[data-view].active')?.dataset.view;
    if (view) destination.searchParams.set('view', view);
    control.href = destination.href;
  }

  control.addEventListener('focus', updateDestination);
  control.addEventListener('pointerenter', updateDestination);
  control.addEventListener('click', updateDestination);
  window.addEventListener('hashchange', updateDestination);
  updateDestination();

  const preferenceKey = 'aidc-language-intro';
  try {
    if (localStorage.getItem(preferenceKey) || sessionStorage.getItem(preferenceKey)) return;
  } catch {}

  const current = document.documentElement.lang === 'en' ? 'en' : 'zh';
  const dialog = document.createElement('dialog');
  dialog.className = 'language-intro';
  dialog.setAttribute('aria-labelledby', 'language-intro-title');
  dialog.innerHTML = `
    <div class="language-intro-panel">
      <section class="language-intro-credits" lang="en" aria-labelledby="language-intro-credits-title">
        <h2 id="language-intro-credits-title">Created by</h2>
        <div class="language-intro-author">
          <p><strong>Leah He <span lang="zh-CN">何琳</span></strong><span class="language-intro-role"> · Sales Engineer</span></p>
          <p>Sales opportunity research, competitor brochure library development, and site architecture and visual design</p>
        </div>
        <div class="language-intro-author">
          <p><strong>Rain Yang <span lang="zh-CN">杨依锐</span></strong><span class="language-intro-role"> · Sales Engineer</span></p>
          <p>Customer database development, company research, and classification</p>
        </div>
      </section>
      <h1 id="language-intro-title">选择语言 <span lang="en">Choose a language</span></h1>
      <div class="language-intro-options">
        <button type="button" data-language="zh" lang="en"><span class="language-intro-glyph" aria-hidden="true" lang="zh-CN">中</span><span>Chinese</span></button>
        <button type="button" data-language="en" lang="en"><span class="language-intro-glyph" aria-hidden="true">英</span><span>English</span></button>
      </div>
    </div>`;
  document.body.append(dialog);
  dialog.showModal();
  let closing = false;

  async function choose(language) {
    if (closing) return;
    closing = true;
    updateDestination();
    const destination = control.href;
    try { sessionStorage.setItem(preferenceKey, language); } catch {}
    try { localStorage.setItem(preferenceKey, language); } catch {}

    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      control.scrollIntoView({ behavior: 'instant', block: 'nearest' });
      const origins = [...dialog.querySelectorAll('.language-intro-glyph')];
      const targets = [...control.querySelectorAll('span')];
      const animations = origins.map((origin, index) => {
        const target = targets[index];
        const start = origin.getBoundingClientRect();
        const end = target?.getBoundingClientRect() ?? start;
        const tile = origin.cloneNode(true);
        tile.className = 'language-flight-tile';
        tile.setAttribute('aria-hidden', 'true');
        dialog.append(tile);
        Object.assign(tile.style, { left: `${start.left}px`, top: `${start.top}px`, width: `${start.width}px`, height: `${start.height}px` });
        const foreground = target === targets[1];
        tile.style.zIndex = foreground ? '2' : '1';
        if (language === 'en') {
          setTimeout(() => { tile.textContent = index === 0 ? 'C' : 'E'; }, 245);
        }
        const scale = end.width / start.width;
        return tile.animate([
          { transform: 'translate(0, 0) scale(1)', offset: 0 },
          { transform: `translate(${innerWidth / 2 - start.left - start.width / 2 + (foreground ? 7 : -7)}px, ${start.height * -.12}px) scale(.66)`, offset: .36 },
          { transform: `translate(${end.left - start.left}px, ${end.top - start.top}px) scale(${scale})`, borderRadius: `${5 / scale}px`, background: foreground ? '#145ca8' : '#fff', color: foreground ? '#fff' : '#145ca8', offset: 1 },
        ], { duration: 680, easing: 'cubic-bezier(.22,.72,.22,1)', fill: 'forwards' });
      });
      control.classList.add('language-switch-docking');
      dialog.classList.add('is-docking');
      await Promise.allSettled(animations.map(animation => animation.finished));
      control.classList.remove('language-switch-docking');
    }

    dialog.close();
    dialog.remove();
    if (language !== current) location.assign(destination);
    else control.focus({ preventScroll: true });
  }

  dialog.addEventListener('click', event => {
    const choice = event.target.closest('[data-language]');
    if (choice) choose(choice.dataset.language);
  });
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    choose(current);
  });
})();
