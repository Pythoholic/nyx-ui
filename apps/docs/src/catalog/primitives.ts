import staticPrimitivesMarkup from "../../../../registry/components/static-primitives.html?raw";
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
];
