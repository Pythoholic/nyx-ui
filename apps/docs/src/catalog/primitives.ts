import aspectRatioMarkup from "../../../../registry/components/aspect-ratio.html?raw";
import blockquoteMarkup from "../../../../registry/components/blockquote.html?raw";
import codeBlockMarkup from "../../../../registry/components/code-block.html?raw";
import containerColumnsMarkup from "../../../../registry/components/container-columns.html?raw";
import iconCatalogMarkup from "../../../../registry/components/icon-catalog.html?raw";
import visuallyHiddenMarkup from "../../../../registry/components/visually-hidden.html?raw";
import directionMarkup from "../../../../registry/components/direction.html?raw";
import staticPrimitivesMarkup from "../../../../registry/components/static-primitives.html?raw";
import styledLinksMarkup from "../../../../registry/components/styled-links.html?raw";
import tagsMarkup from "../../../../registry/components/tags.html?raw";
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
    body: card("Avatar, card, separator, and keys", staticPrimitivesMarkup, "Registry source"),
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
  page({
    path: paths.components.primitives.codeBlock,
    categoryId: "primitives",
    categoryLabel: "Primitives",
    title: "Code Block",
    description: "Selectable preformatted code gains an explicit clipboard action, durable status feedback, and a framework-free lifecycle.",
    searchTerms: "code block pre clipboard copy button source syntax developer",
    plugins: ["code-block"],
    body: `<section class="docs-prose-section"><h2>Copy only what is displayed</h2><p>The copy button identifies one code source with <code>aria-controls</code>. Nyx reads that element's exact text content, so highlighted or decorated presentations should keep the underlying code text intact.</p></section>${card("Deployment snippet", codeBlockMarkup, "Registry source")}`,
  }),
  page({
    path: paths.components.primitives.iconCatalog,
    categoryId: "primitives",
    categoryLabel: "Primitives",
    title: "Icons Nyx Uses",
    description: "Every inline interface icon rendered by Nyx components, collected under the shared size, stroke, and current-color contract.",
    searchTerms: "icons used by Nyx inline svg stroke current color alert arrows chevron check close grid image lock menu plus records search settings star upload user",
    body: `<section class="docs-prose-section"><h2>Meaning comes from context</h2><p>This is an inventory of Nyx's own interface symbols, not a general-purpose icon set. Decorative icons use <code>aria-hidden="true"</code>. When an icon is the only visible content in a control, give the native control an accessible name; when an illustration conveys information, name the SVG with <code>aria-labelledby</code> or visible text.</p></section>${card("Icons used across the catalog", iconCatalogMarkup, "Registry source")}`,
  }),
  page({
    path: paths.components.primitives.visuallyHidden,
    categoryId: "primitives",
    categoryLabel: "Primitives",
    title: "Visually Hidden",
    description: "A reusable utility keeps meaningful labels, context, and live status in the accessibility tree while removing them from visual layout.",
    searchTerms: "visually hidden screen reader accessible name label live region skip link focusable utility",
    body: `<section class="docs-prose-section"><h2>Hide presentation, not meaning</h2><p>Use <code>nyx-visually-hidden</code> for text that must remain available to assistive technology. Do not use it to conceal content that should be unavailable to everyone; use <code>hidden</code> instead. The companion <code>nyx-visually-hidden-focusable</code> utility reveals skip links and other focus targets while they have focus.</p></section>${card("Accessible labels and focus target", visuallyHiddenMarkup, "Registry source")}`,
  }),
  page({
    path: paths.components.primitives.direction,
    categoryId: "primitives",
    categoryLabel: "Primitives",
    title: "RTL and Direction",
    description: "Inherited text direction mirrors logical component geometry, directional motion, overlay placement, and horizontal keyboard navigation.",
    searchTerms: "rtl right to left direction dir localization internationalization logical properties bidi arabic hebrew",
    body: `<section class="docs-prose-section"><h2>Declare direction at the language boundary</h2><p>Set <code>dir="rtl"</code> and the appropriate <code>lang</code> on the document or the smallest subtree whose language direction changes. Nyx uses logical geometry and reads inherited direction for horizontal Arrow-key behavior. Wrap machine identifiers or user data with an unknown direction in <code>bdi</code> so it cannot reorder surrounding text.</p></section>${card("Right-to-left workspace", directionMarkup, "Registry source")}`,
  }),
  page({
    path: paths.components.primitives.tags,
    categoryId: "primitives",
    categoryLabel: "Primitives",
    title: "Tags and Chips",
    description: "Compact labels identify categories, filters, and state without replacing native controls when a value is interactive.",
    searchTerms: "tag tags chip chips label filter category outlined solid minimal status dot tone",
    body: `<section class="docs-prose-section"><h2>Match emphasis to the job</h2><p>Outlined tags suit ordinary categories, solid tags call attention to important state, and minimal tags keep dense lists quiet. Use list semantics when tags form a collection. A static tag needs no role; when a tag becomes interactive, compose the treatment with a native button or link.</p></section>${card("Tag emphasis variants", tagsMarkup, "Registry source")}`,
  }),
];
