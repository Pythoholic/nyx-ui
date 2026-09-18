import aspectRatioMarkup from "../../../../registry/components/aspect-ratio.html?raw";
import blockquoteMarkup from "../../../../registry/components/blockquote.html?raw";
import containerColumnsMarkup from "../../../../registry/components/container-columns.html?raw";
import staticPrimitivesMarkup from "../../../../registry/components/static-primitives.html?raw";
import styledLinksMarkup from "../../../../registry/components/styled-links.html?raw";
import { paths } from "../routes.js";
import { card, page } from "./shared.js";

export const primitivePages = [
  page({
    path: paths.components.primitives.staticPrimitives,
    categoryId: "primitives",
    categoryLabel: "Primitives",
    title: "Static Primitives",
    description: "Avatar, card, list, item, separator, and keyboard patterns form one cohesive semantic vocabulary with no runtime controller.",
    searchTerms: "avatar group initials card panel item list separator divider keyboard kbd chord static",
    body: card("Avatar, card, separator, and keys", `<div class="docs-stack">${staticPrimitivesMarkup}</div>`, "Registry source", staticPrimitivesMarkup),
  }),
  page({
    path: paths.components.primitives.aspectRatio,
    categoryId: "primitives",
    categoryLabel: "Primitives",
    title: "Aspect-ratio Container",
    description: "A bounded media wrapper reserves predictable space before images, video, or embedded content load.",
    searchTerms: "aspect ratio container media image video square portrait wide layout shift",
    body: `<section class="docs-prose-section"><h2>Keep content semantics intact</h2><p>The wrapper controls only geometry and clipping. Its child remains the real image, video, iframe, or other meaningful content and still needs an accessible name or text alternative.</p></section>${card("Video ratio", aspectRatioMarkup, "Registry source")}`,
  }),
  page({
    path: paths.components.primitives.containerColumns,
    categoryId: "primitives",
    categoryLabel: "Primitives",
    title: "Container and Responsive Columns",
    description: "Logical sizing centers page content while a small grid vocabulary collapses columns without changing typography.",
    searchTerms: "container responsive columns grid layout compact wide full two three four",
    body: `<section class="docs-prose-section"><h2>Layout without type changes</h2><p>Container sizes cap readable width, while column counts adapt from four or three to two and then one. Breakpoints change only arrangement; content order and typography remain stable.</p></section>${card("Responsive region grid", containerColumnsMarkup, "Registry source")}`,
  }),
  page({
    path: paths.components.primitives.styledLinks,
    categoryId: "primitives",
    categoryLabel: "Primitives",
    title: "Styled Links",
    description: "Persistent underlines and clear focus treatment distinguish navigation from surrounding text without relying on color alone.",
    searchTerms: "styled links anchor underline navigation muted standalone focus visited",
    body: `<section class="docs-prose-section"><h2>Links still navigate</h2><p>Use a native anchor with an <code>href</code> for navigation. Use a button for an action; styling a link must not blur that semantic distinction.</p></section>${card("Inline and standalone links", styledLinksMarkup, "Registry source")}`,
  }),
  page({
    path: paths.components.primitives.blockquote,
    categoryId: "primitives",
    categoryLabel: "Primitives",
    title: "Blockquote",
    description: "Quoted material keeps native document semantics, a restrained accent boundary, and an optional visible citation.",
    searchTerms: "blockquote quote citation cite footer prose document semantic",
    body: `<section class="docs-prose-section"><h2>Cite the work, not the speaker</h2><p>The native <code>blockquote</code> marks an extended quotation. Use <code>cite</code> for the title of a referenced work and ordinary text for a person or team attribution.</p></section>${card("Operational principle", blockquoteMarkup, "Registry source")}`,
  }),
];
