import { actionsSection } from "./actions.js";
import { chartsSection } from "./charts.js";
import { dataSection } from "./data.js";
import { feedbackSection } from "./feedback.js";
import { formsSection } from "./forms.js";
import { foundationSections } from "./foundations.js";
import { layoutsSection } from "./layouts.js";
import { mediaSection } from "./media.js";
import { navigationSection } from "./navigation.js";
import { overlaysSection } from "./overlays.js";

export { navigationGroups } from "./shared.js";

export const catalogMarkup = [
  foundationSections,
  actionsSection,
  formsSection,
  navigationSection,
  overlaysSection,
  feedbackSection,
  dataSection,
  chartsSection,
  mediaSection,
  layoutsSection,
].join("");

