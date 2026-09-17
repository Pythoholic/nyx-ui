export interface NavigationGroup {
  label: string;
  items: Array<{ id: string; label: string; index: string }>;
}

export const navigationGroups: NavigationGroup[] = [
  { label: "Start", items: [{ id: "overview", label: "Overview", index: "01" }] },
  {
    label: "Foundations",
    items: [
      { id: "color", label: "Color", index: "02" },
      { id: "typography", label: "Typography", index: "03" },
      { id: "geometry", label: "Geometry", index: "04" },
      { id: "motion", label: "Motion", index: "05" },
    ],
  },
  {
    label: "Components",
    items: [
      { id: "actions", label: "Actions", index: "06" },
      { id: "forms", label: "Forms", index: "07" },
      { id: "navigation", label: "Navigation", index: "08" },
      { id: "overlays", label: "Overlays", index: "09" },
      { id: "feedback", label: "Feedback", index: "10" },
      { id: "data", label: "Data display", index: "11" },
      { id: "charts", label: "Visualization", index: "12" },
      { id: "media", label: "Media", index: "13" },
      { id: "layouts", label: "Layouts", index: "14" },
    ],
  },
];

export function section(id: string, index: string, title: string, description: string, body: string, searchTerms: string): string {
  return `<section class="docs-section" id="${id}" data-search="${searchTerms}"><div class="docs-section-heading"><div><span class="nyx-eyebrow">// ${index} — System</span><h2>${title}</h2></div><p class="docs-section-copy">${description}</p></div>${body}</section>`;
}

export function card(title: string, body: string, badge = "Ready"): string {
  return `<article class="docs-component-card"><header class="docs-component-head"><h3>${title}</h3><span class="nyx-badge">${badge}</span></header><div class="docs-component-body">${body}</div></article>`;
}

