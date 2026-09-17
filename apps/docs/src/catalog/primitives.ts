import staticPrimitivesMarkup from "../../../../registry/components/static-primitives.html?raw";
import { card, section } from "./shared.js";

export const primitivesSection = section(
  "primitives",
  "08",
  "Static primitives",
  "Avatar, card, list, item, separator, and keyboard patterns stay semantic and require no runtime controller.",
  `<div class="docs-stack">
    ${card("Avatar, card, separator, and keys", `<div class="docs-stack">${staticPrimitivesMarkup}</div>`, "Semantic")}
  </div>`,
  "avatar group initials card panel item list list group separator divider keyboard kbd chord static",
);
