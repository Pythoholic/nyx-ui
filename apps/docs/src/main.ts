import { initDialogs } from "@nyx-ui/plugins/dialog";
import "./styles.css";

const closeIcon = `
  <svg aria-hidden="true" class="nyx-icon" viewBox="0 0 24 24">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>`;

const arrowIcon = `
  <svg aria-hidden="true" class="nyx-icon" viewBox="0 0 24 24">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>`;

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) throw new Error("Nyx documentation root was not found.");

app.innerHTML = `
  <div class="docs-shell">
    <header class="docs-topbar">
      <div class="docs-brand">
        <span class="docs-mark" aria-hidden="true">N</span>
        <div>
          <div class="docs-brand-name">Nyx UI</div>
          <div class="docs-version">Foundation preview · 0.1.0</div>
        </div>
      </div>
      <div class="docs-theme-list" aria-label="Accent theme" role="group">
        <button class="nyx-button docs-theme-button" data-size="small" data-theme-value="solar" aria-pressed="true" type="button">Solar</button>
        <button class="nyx-button docs-theme-button" data-size="small" data-theme-value="signal" aria-pressed="false" type="button">Signal</button>
        <button class="nyx-button docs-theme-button" data-size="small" data-theme-value="flux" aria-pressed="false" type="button">Flux</button>
        <button class="nyx-button docs-theme-button" data-size="small" data-theme-value="plasma" aria-pressed="false" type="button">Plasma</button>
      </div>
    </header>

    <div class="docs-layout">
      <aside class="docs-sidebar">
        <nav class="docs-nav" aria-label="Documentation sections">
          <a href="#overview" aria-current="page">Overview <span aria-hidden="true">01</span></a>
          <a href="#tokens">Tokens <span aria-hidden="true">02</span></a>
          <a href="#typography">Typography <span aria-hidden="true">03</span></a>
          <a href="#button">Button <span aria-hidden="true">04</span></a>
          <a href="#dialog">Dialog <span aria-hidden="true">05</span></a>
        </nav>
      </aside>

      <main class="docs-main">
        <section class="docs-hero" id="overview">
          <div>
            <p class="docs-kicker">// System online</p>
            <h1 class="docs-title">A precise interface system with nothing hidden.</h1>
            <p class="docs-intro">Nyx combines stable visual tokens, semantic component markup, and optional behavior modules. This laboratory imports the same packages an application will use.</p>
          </div>
          <div class="docs-readout" aria-label="Foundation status">
            <div class="docs-readout-row"><span>Core CSS</span><strong style="color: var(--nyx-signal)">Ready</strong></div>
            <div class="docs-readout-row"><span>Typography</span><strong>Fixed roles</strong></div>
            <div class="docs-readout-row"><span>Behavior</span><strong>Optional</strong></div>
            <div class="docs-readout-row"><span>Runtime</span><strong>Framework-free</strong></div>
          </div>
        </section>

        <section class="docs-section" id="tokens">
          <div class="docs-section-heading">
            <div>
              <span class="nyx-eyebrow">// 02 — Foundation</span>
              <h2>Signal palette</h2>
            </div>
            <p class="docs-section-copy">Surfaces stay cool and quiet. One accent carries interaction while semantic colors keep a fixed meaning.</p>
          </div>
          <div class="docs-token-grid">
            <article class="docs-token" style="--token-color: var(--nyx-panel)"><span class="docs-token-label">Panel · #0A0F14</span></article>
            <article class="docs-token" style="--token-color: var(--nyx-chip)"><span class="docs-token-label">Chip · #121A1F</span></article>
            <article class="docs-token" style="--token-color: var(--nyx-line-strong)"><span class="docs-token-label">Line · #26313A</span></article>
            <article class="docs-token" style="--token-color: var(--nyx-accent)"><span class="docs-token-label">Accent · Live</span></article>
            <article class="docs-token" style="--token-color: var(--nyx-signal)"><span class="docs-token-label">Signal · #00E08A</span></article>
            <article class="docs-token" style="--token-color: var(--nyx-danger)"><span class="docs-token-label">Danger · #FF4D5D</span></article>
          </div>
        </section>

        <section class="docs-section" id="typography">
          <div class="docs-section-heading">
            <div>
              <span class="nyx-eyebrow">// 03 — Typography</span>
              <h2>Fixed role scale</h2>
            </div>
            <p class="docs-section-copy">Viewport changes may reflow the page, but they never shrink a type role. Browser preferences remain respected through rem-based tokens.</p>
          </div>
          <div class="docs-type-grid">
            <article class="docs-type-card">
              <p class="docs-type-sample" style="font-size: var(--nyx-type-display); font-weight: 800; line-height: 1.08; text-transform: uppercase;">Nyx</p>
              <span class="docs-type-meta">Display · 36px</span>
            </article>
            <article class="docs-type-card">
              <p class="docs-type-sample" style="font-size: var(--nyx-type-title); font-weight: 700; text-transform: uppercase;">Panel title</p>
              <span class="docs-type-meta">Title · 18px</span>
            </article>
            <article class="docs-type-card">
              <p class="docs-type-sample" style="font-size: var(--nyx-type-body); color: var(--nyx-muted);">Readable interface copy remains stable on every screen.</p>
              <span class="docs-type-meta">Body · 16px</span>
            </article>
          </div>
          <div class="docs-callout"><span class="nyx-status-dot" style="color: var(--nyx-accent)" aria-hidden="true"></span><span>No breakpoint in this implementation changes <code>--nyx-type-display</code>, <code>--nyx-type-title</code>, <code>--nyx-type-body</code>, or the control roles.</span></div>
        </section>

        <section class="docs-section" id="button">
          <div class="docs-section-heading">
            <div>
              <span class="nyx-eyebrow">// 04 — Actions</span>
              <h2>Button</h2>
            </div>
            <p class="docs-section-copy">A semantic native button with deliberate variants, stable dimensions, visible focus, and no JavaScript requirement.</p>
          </div>
          <article class="nyx-panel">
            <header class="nyx-panel-header">
              <span class="nyx-eyebrow">Live preview</span>
              <span class="nyx-badge"><span class="nyx-status-dot" aria-hidden="true"></span>Static</span>
            </header>
            <div class="docs-preview">
              <div class="docs-button-row">
                <button class="nyx-button" data-variant="primary" type="button">Deploy change ${arrowIcon}</button>
                <button class="nyx-button" type="button">Secondary</button>
                <button class="nyx-button" data-variant="quiet" type="button">Quiet</button>
                <button class="nyx-button" data-variant="danger" type="button">Remove</button>
                <button class="nyx-button" disabled type="button">Disabled</button>
              </div>
            </div>
          </article>
        </section>

        <section class="docs-section" id="dialog">
          <div class="docs-section-heading">
            <div>
              <span class="nyx-eyebrow">// 05 — Overlays</span>
              <h2>Dialog</h2>
            </div>
            <p class="docs-section-copy">Native modal semantics enhanced with trigger discovery, lifecycle events, scroll locking, Escape handling, backdrop dismissal, and focus return.</p>
          </div>
          <article class="nyx-panel">
            <header class="nyx-panel-header">
              <span class="nyx-eyebrow">Interactive preview</span>
              <span class="nyx-badge"><span class="nyx-status-dot" aria-hidden="true"></span>Plugin</span>
            </header>
            <div class="docs-preview">
              <button class="nyx-button" data-nyx-dialog-trigger="docs-dialog" data-variant="primary" type="button">Open dialog ${arrowIcon}</button>
            </div>
          </article>

          <dialog class="nyx-dialog" id="docs-dialog" data-nyx-dialog aria-labelledby="docs-dialog-title" aria-describedby="docs-dialog-description">
            <header class="nyx-dialog-header">
              <div>
                <span class="nyx-eyebrow">Confirmation required</span>
                <h2 class="nyx-dialog-title" id="docs-dialog-title">Deploy interface changes?</h2>
              </div>
              <button aria-label="Close dialog" class="nyx-button nyx-icon-button" data-nyx-dialog-close data-variant="quiet" type="button">${closeIcon}</button>
            </header>
            <div class="nyx-dialog-body">
              <p class="nyx-dialog-description" id="docs-dialog-description">The component keeps native modal behavior while adding a small, inspectable controller. Press Escape, use the close control, or select the backdrop to dismiss it.</p>
              <label class="nyx-field" for="release-name">
                <span class="nyx-label">Release name</span>
                <input class="nyx-input" id="release-name" name="release-name" placeholder="foundation-01" type="text" />
              </label>
            </div>
            <footer class="nyx-dialog-footer">
              <button class="nyx-button" data-nyx-dialog-close type="button">Cancel</button>
              <button class="nyx-button" data-variant="primary" type="button">Deploy</button>
            </footer>
          </dialog>
        </section>

        <section class="docs-section" aria-labelledby="install-title">
          <div class="docs-section-heading">
            <div>
              <span class="nyx-eyebrow">// 06 — Consumer path</span>
              <h2 id="install-title">Small by default</h2>
            </div>
            <p class="docs-section-copy">Import the foundation once. Add only the behavior modules used by the application.</p>
          </div>
          <pre class="nyx-code"><code>@import "tailwindcss";
@import "@nyx-ui/core";

import { initDialogs } from "@nyx-ui/plugins/dialog";

initDialogs();</code></pre>
        </section>

        <footer class="docs-footer">
          <span>Nyx UI · Foundation preview</span>
          <span>Semantic · Accessible · Lightweight</span>
        </footer>
      </main>
    </div>
  </div>`;

initDialogs();

const themeButtons = document.querySelectorAll<HTMLButtonElement>("[data-theme-value]");

themeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const theme = button.dataset.themeValue;
    if (!theme) return;

    document.documentElement.dataset.nyxTheme = theme;
    themeButtons.forEach((candidate) => {
      candidate.setAttribute("aria-pressed", String(candidate === button));
    });
  });
});

const navigationLinks = Array.from(
  document.querySelectorAll<HTMLAnchorElement>(".docs-nav a[href^='#']"),
);

const navigationSections = navigationLinks.flatMap((link) => {
  const sectionId = link.hash.slice(1);
  const section = document.getElementById(sectionId);
  return section ? [{ link, section }] : [];
});

function setActiveNavigation(sectionId: string): void {
  navigationSections.forEach(({ link, section }) => {
    if (section.id === sectionId) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function updateNavigationFromScroll(): void {
  const activationLine = window.scrollY + 160;
  let activeSection = navigationSections[0]?.section;

  navigationSections.forEach(({ section }) => {
    if (section.offsetTop <= activationLine) activeSection = section;
  });

  if (activeSection) setActiveNavigation(activeSection.id);
}

navigationSections.forEach(({ link, section }) => {
  link.addEventListener("click", () => setActiveNavigation(section.id));
});

let navigationFrame = 0;

window.addEventListener(
  "scroll",
  () => {
    if (navigationFrame) return;
    navigationFrame = window.requestAnimationFrame(() => {
      updateNavigationFromScroll();
      navigationFrame = 0;
    });
  },
  { passive: true },
);

window.addEventListener("hashchange", () => {
  const sectionId = window.location.hash.slice(1);
  if (sectionId) setActiveNavigation(sectionId);
});

const initialSectionId = window.location.hash.slice(1);

if (initialSectionId && document.getElementById(initialSectionId)) {
  setActiveNavigation(initialSectionId);
} else {
  updateNavigationFromScroll();
}
