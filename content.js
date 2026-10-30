// Side Comments for YouTube

(() => {
  'use strict';

  const STORAGE_KEY = 'mode';
  const COMMENTS = 'comments';
  const RECOMMENDED = 'recommended';

  let mode = COMMENTS; // default until the saved choice loads
  let home = null;     // where YouTube originally put the comments

  const $ = (selector, root = document) => root.querySelector(selector);

  // Off in theater mode, full screen, narrow windows (one column),
  // and on livestreams / chat replays where chat owns the right side.
  function layoutSupported(flexy) {
    if (location.pathname !== '/watch') return false;
    if (!flexy || flexy.hasAttribute('hidden')) return false;
    if (flexy.hasAttribute('theater') || flexy.hasAttribute('fullscreen')) return false;
    if (!flexy.hasAttribute('is-two-columns_')) return false;
    if ($('#chat-container ytd-live-chat-frame:not([hidden])', flexy)) return false;
    return true;
  }

  function makeButton(value, label) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.mode = value;
    button.textContent = label;
    button.title = `Show ${label.toLowerCase()} (Alt+C)`;
    button.addEventListener('click', () => setMode(value));
    return button;
  }

  // Built with createElement because YouTube blocks innerHTML (Trusted Types).
  function ensureUI(flexy) {
    const existing = $('#sc-root', flexy);
    if (existing) return existing;

    const secondaryInner = $('#secondary-inner', flexy);
    const related = $('#related', flexy);
    if (!secondaryInner || !related) return null;

    const root = document.createElement('div');
    root.id = 'sc-root';

    const toggle = document.createElement('div');
    toggle.className = 'sc-switch';
    toggle.setAttribute('role', 'group');
    toggle.setAttribute('aria-label', 'Side column');

    const indicator = document.createElement('span');
    indicator.className = 'sc-indicator';
    indicator.setAttribute('aria-hidden', 'true');

    toggle.append(indicator, makeButton(COMMENTS, 'Comments'), makeButton(RECOMMENDED, 'Recommended'));

    const panel = document.createElement('div');
    panel.id = 'sc-panel';
    // Some of YouTube's loading code listens for page scrolls; passing the
    // panel's scrolls along helps more comments load as you scroll down.
    panel.addEventListener('scroll', nudgeLoading, { passive: true });

    root.append(toggle, panel);
    secondaryInner.insertBefore(root, related);
    return root;
  }

  function updateSwitch(root) {
    if (!root) return;
    root.dataset.mode = mode;
    root.querySelectorAll('.sc-switch button').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
    });
  }

  let nudgeQueued = false;
  function nudgeLoading() {
    if (nudgeQueued) return;
    nudgeQueued = true;
    requestAnimationFrame(() => {
      nudgeQueued = false;
      window.dispatchEvent(new Event('scroll'));
    });
  }

  function putCommentsBack(comments, flexy) {
    const parent = home?.parent?.isConnected ? home.parent : $('#below', flexy);
    if (!parent) return;
    const next = home?.next?.parentElement === parent ? home.next : null;
    parent.insertBefore(comments, next);
  }

  // Turning the extension off or reloading it leaves this copy running in
  // tabs that were already open, but cut off from Chrome. When that
  // happens, undo everything so the page goes back to normal.
  function extensionAlive() {
    return Boolean(chrome.runtime?.id);
  }

  function shutDown() {
    observer.disconnect();
    document.removeEventListener('yt-navigate-finish', scheduleApply);
    clearTimeout(applyTimer);

    const flexy = $('ytd-watch-flexy');
    const root = flexy && $('#sc-root', flexy);
    const comments = root && $('ytd-comments#comments', root);
    if (comments) putCommentsBack(comments, flexy);
    root?.remove();
    document.documentElement.dataset.sc = 'off';
  }

  function apply() {
    if (!extensionAlive()) {
      shutDown();
      return;
    }

    const flexy = $('ytd-watch-flexy');
    if (!flexy) return;

    const active = layoutSupported(flexy);
    const root = active ? ensureUI(flexy) : $('#sc-root', flexy);
    const comments = $('ytd-comments#comments', flexy);

    // Remember YouTube's spot for the comments whenever they're in it.
    if (comments && !root?.contains(comments)) {
      home = { parent: comments.parentElement, next: comments.nextSibling };
    }

    if (active && root && comments && mode === COMMENTS) {
      const panel = $('#sc-panel', root);
      if (comments.parentElement !== panel) {
        panel.appendChild(comments);
        nudgeLoading();
      }
    } else if (comments && root?.contains(comments)) {
      putCommentsBack(comments, flexy);
    }

    document.documentElement.dataset.sc = active && root ? mode : 'off';
    updateSwitch(root);
  }

  async function setMode(next) {
    if (next !== COMMENTS && next !== RECOMMENDED) return;
    if (next === mode) return;
    mode = next;
    apply();
    if (!extensionAlive()) return;
    try {
      await chrome.storage.local.set({ [STORAGE_KEY]: mode });
    } catch (error) {
      // The switch still works on this page; it just won't be remembered.
      console.warn('Side Comments: could not save your choice.', error);
    }
  }

  function toggleMode() {
    if (document.documentElement.dataset.sc === 'off') return;
    setMode(mode === COMMENTS ? RECOMMENDED : COMMENTS);
  }

  // YouTube swaps pages without reloading, so re-check after changes.
  let applyTimer = null;
  function scheduleApply() {
    clearTimeout(applyTimer);
    applyTimer = setTimeout(apply, 120);
  }

  document.addEventListener('yt-navigate-finish', scheduleApply);
  const observer = new MutationObserver(scheduleApply);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['theater', 'fullscreen', 'is-two-columns_'],
  });

  // Alt+C from the background worker.
  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === 'toggle') toggleMode();
  });

  // Keep every open YouTube tab in sync when you flip the switch in one.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes[STORAGE_KEY]) return;
    const next = changes[STORAGE_KEY].newValue;
    if (next && next !== mode) {
      mode = next;
      apply();
    }
  });

  async function start() {
    try {
      const saved = await chrome.storage.local.get(STORAGE_KEY);
      if (saved[STORAGE_KEY] === COMMENTS || saved[STORAGE_KEY] === RECOMMENDED) {
        mode = saved[STORAGE_KEY];
      }
    } catch (error) {
      console.warn('Side Comments: could not load your saved choice.', error);
    }
    apply();
  }

  start();
})();
