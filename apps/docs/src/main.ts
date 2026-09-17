import { initDialogs } from "@nyx-ui/plugins/dialog";
import { initTabs } from "@nyx-ui/plugins/tabs";
import { NyxToast } from "@nyx-ui/plugins/toast";
import { catalogMarkup, navigationGroups } from "./catalog/index.js";
import { icon } from "./icons.js";
import "./styles.css";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) throw new Error("Nyx documentation root was not found.");

const navigationMarkup = navigationGroups
  .map(
    (group) => `<div class="docs-nav-group"><span class="docs-nav-label">${group.label}</span><nav class="docs-nav" aria-label="${group.label}">${group.items
      .map((item) => `<a href="#${item.id}"><span>${item.label}</span><span class="docs-nav-index">${item.index}</span></a>`)
      .join("")}</nav></div>`,
  )
  .join("");

app.innerHTML = `<div class="docs-shell">
  <header class="docs-topbar">
    <div class="docs-brand"><span class="docs-mark" aria-hidden="true">N</span><div><div class="docs-brand-name">Nyx UI</div><div class="docs-version">System catalog · 0.1.0</div></div></div>
    <label class="docs-search"><span class="sr-only">Search components</span>${icon("search")}<input class="nyx-input" data-catalog-search type="search" placeholder="Search components and foundations" autocomplete="off"/></label>
    <div class="docs-theme-list" aria-label="Accent theme" role="group"><button class="nyx-button docs-theme-button" data-size="small" data-theme-value="solar" aria-pressed="true">Solar</button><button class="nyx-button docs-theme-button" data-size="small" data-theme-value="signal" aria-pressed="false">Signal</button><button class="nyx-button docs-theme-button" data-size="small" data-theme-value="flux" aria-pressed="false">Flux</button><button class="nyx-button docs-theme-button" data-size="small" data-theme-value="plasma" aria-pressed="false">Plasma</button></div>
  </header>
  <div class="docs-layout">
    <aside class="docs-sidebar">${navigationMarkup}</aside>
    <main class="docs-main">
      <section class="docs-hero" id="overview" data-search="overview foundation catalog components">
        <div><p class="docs-kicker">// Complete system catalog</p><h1 class="docs-title">Foundations, components, motion, and application patterns.</h1><p class="docs-intro">A complete working reference for building precise interfaces with stable typography, semantic markup, themeable tokens, and optional framework-free behavior.</p></div>
        <div class="docs-readout" aria-label="Catalog status"><div class="docs-readout-row"><span>Foundation groups</span><strong>4</strong></div><div class="docs-readout-row"><span>Catalog families</span><strong>9</strong></div><div class="docs-readout-row"><span>Typography roles</span><strong>14 fixed</strong></div><div class="docs-readout-row"><span>Motion tokens</span><strong>10 durations</strong></div><div class="docs-readout-row"><span>Behavior</span><strong style="color:var(--nyx-signal)">Operational</strong></div></div>
      </section>
      ${catalogMarkup}
      <div class="docs-no-results" data-no-results hidden><div>${icon("search")}<h2>No matching system item</h2><p>Try a component name, state, or foundation token.</p></div></div>
      <footer class="docs-footer"><span>Nyx UI · System catalog</span><span>Semantic · Accessible · Lightweight</span></footer>
    </main>
  </div>
  <div class="nyx-toast-region" data-toast-region></div>
</div>`;

initDialogs();
initTabs();

const toastRegion = document.querySelector<HTMLElement>("[data-toast-region]");
const toast = toastRegion ? new NyxToast(toastRegion) : null;

document.querySelector("[data-toast-demo]")?.addEventListener("click", () => {
  toast?.notify({ title: "Release validated", description: "All component contracts passed.", tone: "success" });
});

const themeButtons = document.querySelectorAll<HTMLButtonElement>("[data-theme-value]");
themeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const theme = button.dataset.themeValue;
    if (!theme) return;
    document.documentElement.dataset.nyxTheme = theme;
    themeButtons.forEach((candidate) => candidate.setAttribute("aria-pressed", String(candidate === button)));
  });
});

const rangeInput = document.querySelector<HTMLInputElement>("[data-range-input]");
const rangeOutput = document.querySelector<HTMLOutputElement>("[data-range-output]");
rangeInput?.addEventListener("input", () => {
  if (rangeOutput) rangeOutput.value = rangeInput.value;
});

document.querySelector("[data-motion-replay]")?.addEventListener("click", () => {
  const stage = document.querySelector<HTMLElement>("[data-motion-stage]");
  if (!stage) return;
  const replacement = stage.cloneNode(true);
  stage.replaceWith(replacement);
});

const searchInput = document.querySelector<HTMLInputElement>("[data-catalog-search]");
const searchableSections = Array.from(document.querySelectorAll<HTMLElement>("[data-search]"));
const noResults = document.querySelector<HTMLElement>("[data-no-results]");

searchInput?.addEventListener("input", () => {
  const query = searchInput.value.trim().toLowerCase();
  let visibleCount = 0;

  searchableSections.forEach((section) => {
    const searchable = `${section.dataset.search ?? ""} ${section.textContent ?? ""}`.toLowerCase();
    const visible = query.length === 0 || searchable.includes(query);
    section.toggleAttribute("hidden", !visible);
    if (visible) visibleCount += 1;
  });

  document.querySelectorAll<HTMLAnchorElement>(".docs-nav a").forEach((link) => {
    const target = document.getElementById(link.hash.slice(1));
    link.toggleAttribute("hidden", Boolean(target?.hidden));
  });

  noResults?.toggleAttribute("hidden", visibleCount > 0);
});

const navigationLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>(".docs-nav a[href^='#']"));
const navigationSections = navigationLinks.flatMap((link) => {
  const section = document.getElementById(link.hash.slice(1));
  return section ? [{ link, section }] : [];
});

function setActiveNavigation(sectionId: string): void {
  navigationSections.forEach(({ link, section }) => {
    if (section.id === sectionId) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}

function updateNavigationFromScroll(): void {
  const activationLine = window.scrollY + 180;
  let activeSection = navigationSections.find(({ section }) => !section.hidden)?.section;
  navigationSections.forEach(({ section }) => {
    if (!section.hidden && section.offsetTop <= activationLine) activeSection = section;
  });
  if (activeSection) setActiveNavigation(activeSection.id);
}

navigationSections.forEach(({ link, section }) => link.addEventListener("click", () => setActiveNavigation(section.id)));

let navigationFrame = 0;
window.addEventListener("scroll", () => {
  if (navigationFrame) return;
  navigationFrame = window.requestAnimationFrame(() => {
    updateNavigationFromScroll();
    navigationFrame = 0;
  });
}, { passive: true });

window.addEventListener("hashchange", () => {
  const sectionId = window.location.hash.slice(1);
  if (sectionId) setActiveNavigation(sectionId);
});

const initialSectionId = window.location.hash.slice(1);
const initialSection = initialSectionId ? document.getElementById(initialSectionId) : null;
if (initialSection) {
  setActiveNavigation(initialSectionId);
  window.requestAnimationFrame(() => initialSection.scrollIntoView());
} else updateNavigationFromScroll();
