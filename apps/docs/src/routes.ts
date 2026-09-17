export const paths = {
  overview: "/",
  foundations: {
    color: "/foundations/color",
    typography: "/foundations/typography",
    geometry: "/foundations/geometry",
    motion: "/foundations/motion",
  },
  components: {
    actions: {
      button: "/components/actions/button",
      toggles: "/components/actions/toggles",
    },
    forms: {
      textFields: "/components/forms/text-fields",
      selection: "/components/forms/selection-controls",
      dateTime: "/components/forms/range-date-time",
      fileUpload: "/components/forms/file-upload",
    },
    primitives: {
      staticPrimitives: "/components/primitives/static-primitives",
    },
    navigation: {
      topBar: "/components/navigation/top-bar",
      menubar: "/components/navigation/menubar",
      navigationMenu: "/components/navigation/navigation-menu",
      breadcrumbs: "/components/navigation/breadcrumbs",
      pagination: "/components/navigation/pagination",
      accordion: "/components/navigation/accordion",
      tabs: "/components/navigation/tabs",
    },
    overlays: {
      tooltip: "/components/overlays/tooltip",
      dropdownMenu: "/components/overlays/dropdown-menu",
      contextMenu: "/components/overlays/context-menu",
      dialog: "/components/overlays/dialog",
      drawer: "/components/overlays/drawer",
    },
    feedback: {
      badges: "/components/feedback/badges",
      alerts: "/components/feedback/alerts",
      progress: "/components/feedback/progress",
      steps: "/components/feedback/steps",
      loading: "/components/feedback/loading",
      toast: "/components/feedback/toast",
      emptyState: "/components/feedback/empty-state",
      errorState: "/components/feedback/error-state",
    },
    dataDisplay: {
      records: "/components/data-display/metrics-records-activity",
    },
    visualization: {
      lineChart: "/components/visualization/line-chart",
      sparklines: "/components/visualization/sparklines",
      barChart: "/components/visualization/bar-chart",
      accessibleSummary: "/components/visualization/accessible-summary",
    },
    media: {
      gallery: "/components/media/gallery",
      rating: "/components/media/rating",
      protectedMedia: "/components/media/protected-media",
      batchPlan: "/components/media/batch-plan",
    },
    layouts: {
      applicationShell: "/components/layouts/application-shell",
      authentication: "/components/layouts/authentication",
      splitWorkspace: "/components/layouts/split-workspace",
    },
  },
} as const;

function collectPaths(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (!value || typeof value !== "object") return [];
  return Object.values(value).flatMap(collectPaths);
}

export const routePaths = collectPaths(paths);

export const legacyHashRedirects: Record<string, string> = {
  overview: paths.overview,
  color: paths.foundations.color,
  typography: paths.foundations.typography,
  geometry: paths.foundations.geometry,
  motion: paths.foundations.motion,
  actions: paths.components.actions.button,
  forms: paths.components.forms.textFields,
  primitives: paths.components.primitives.staticPrimitives,
  navigation: paths.components.navigation.topBar,
  overlays: paths.components.overlays.tooltip,
  feedback: paths.components.feedback.badges,
  data: paths.components.dataDisplay.records,
  charts: paths.components.visualization.lineChart,
  media: paths.components.media.gallery,
  layouts: paths.components.layouts.applicationShell,
};
