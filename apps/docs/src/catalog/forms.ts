import formsMarkup from "../../../../registry/components/forms.html?raw";
import calendarMarkup from "../../../../registry/components/calendar.html?raw";
import comboboxMarkup from "../../../../registry/components/combobox.html?raw";
import datePickerMarkup from "../../../../registry/components/date-picker.html?raw";
import fileUploadMarkup from "../../../../registry/components/file-upload.html?raw";
import inputOtpMarkup from "../../../../registry/components/input-otp.html?raw";
import numberInputMarkup from "../../../../registry/components/number-input.html?raw";
import passwordInputMarkup from "../../../../registry/components/password-input.html?raw";
import searchBoxMarkup from "../../../../registry/components/search-box.html?raw";
import multiSelectMarkup from "../../../../registry/components/multi-select.html?raw";
import { paths } from "../routes.js";
import { card, codeBlock, page, selectMarkup } from "./shared.js";

const description = "Native controls remain the baseline. Every label is associated, focus is visible, validation is explicit, and sizing follows the Nyx hierarchy.";

export const formPages = [
  page({
    path: paths.components.forms.textFields,
    categoryId: "forms",
    categoryLabel: "Forms",
    title: "Text Fields",
    description,
    searchTerms: "forms input textarea search validation disabled label hint error",
    body: `<section class="docs-prose-section"><h2>Start with the native input type</h2><p>Choose the input type and <code>autocomplete</code> token that match the data, keep every control associated with a visible label, and connect hints or errors with <code>aria-describedby</code>. The examples show disabled and invalid presentation; the application owns validation rules, submitted values, and server-error mapping.</p></section>${card("Text fields", selectMarkup(formsMarkup, ["[data-nyx-example='text-fields']"]), "Registry source")}`,
  }),
  page({
    path: paths.components.forms.selection,
    categoryId: "forms",
    categoryLabel: "Forms",
    title: "Selection Controls",
    description,
    searchTerms: "select checkbox radio switch number segmented choice forms",
    body: `<section class="docs-prose-section"><h2>Match the control to the choice</h2><p>Checkboxes allow independent choices, radios select one value from a named group, and a native select fits a compact option list. Preserve fieldset and legend grouping where the shared question matters. The browser owns keyboard and form behavior; the application owns available options and validation.</p></section>${card("Selection", selectMarkup(formsMarkup, ["[data-nyx-example='selection-controls']"]), "Registry source")}`,
  }),
  page({
    path: paths.components.forms.numberInput,
    categoryId: "forms",
    categoryLabel: "Forms",
    title: "Advanced Number Input",
    description: "A native number input gains bounded step buttons, coarse keyboard movement, localized output, cancelable changes, and synchronized constraint state.",
    searchTerms: "advanced number input spinbutton increment decrement min max step quantity numeric",
    plugins: ["number-input"],
    body: `<section class="docs-prose-section"><h2>Keep native numeric semantics</h2><p>The editable control remains <code>input[type=number]</code>, so direct entry, native Arrow-key stepping, constraint validation, and mobile keyboard behavior stay intact. The added buttons and coarse keys use the same declared <code>min</code>, <code>max</code>, and <code>step</code>.</p></section>${card("Advanced number input", numberInputMarkup, "Registry source")}`,
  }),
  page({
    path: paths.components.forms.passwordInput,
    categoryId: "forms",
    categoryLabel: "Forms",
    title: "Password Strength and Visibility",
    description: "A native password input adds cancelable visibility control and advisory strength feedback without compromising autocomplete or form semantics.",
    searchTerms: "password passphrase strength meter show hide visibility autocomplete validation security",
    plugins: ["password-input"],
    body: `<section class="docs-prose-section"><h2>Treat strength as guidance</h2><p>The local meter is an immediate composition heuristic, not proof that a password is safe. Keep server-side policy, compromised-password checks, rate limits, and secure storage in the application. Preserve an appropriate <code>autocomplete</code> value so password managers can help users.</p></section>${card("Password strength and visibility", passwordInputMarkup, "Registry source")}`,
  }),
  page({
    path: paths.components.forms.searchBox,
    categoryId: "forms",
    categoryLabel: "Forms",
    title: "Search Box",
    description: "A semantic search form presents recent searches for an empty query, filters suggestions as text changes, and emits cancelable application-owned search actions.",
    searchTerms: "search box suggestions recent history query autocomplete listbox",
    plugins: ["search-box"],
    body: `<section class="docs-prose-section"><h2>Search remains application-owned</h2><p>Nyx manages suggestion discovery, keyboard movement, recent-query presentation, clear state, and the search event lifecycle. Your application handles navigation or remote requests after <code>nyx:search-box:search</code>; use the cancelable before-event for controlled integration.</p></section>${card("Search box with recent searches", searchBoxMarkup, "Registry source")}`,
  }),
  page({
    path: paths.components.forms.multiSelect,
    categoryId: "forms",
    categoryLabel: "Forms",
    title: "Multi-select and Tag Input",
    description: "An editable multi-select filters listbox options, renders removable tags, enforces a value limit, and submits repeated hidden form fields.",
    searchTerms: "multi select tag input chips multiple listbox removable form values",
    plugins: ["multi-select"],
    body: `<section class="docs-prose-section"><h2>Keep values and labels distinct</h2><p>Options provide stable <code>data-value</code> identifiers while their visible text labels generated tags. The configured field name produces one hidden input per selection, which preserves ordinary form submission without turning tags into editable text.</p></section>${card("Multi-select and tag input", multiSelectMarkup, "Registry source")}`,
  }),
  page({
    path: paths.components.forms.combobox,
    categoryId: "forms",
    categoryLabel: "Forms",
    title: "Combobox",
    description: "An editable ARIA combobox filters listbox options, tracks an active descendant, and synchronizes selection to a form value.",
    searchTerms: "combobox autocomplete listbox filter search option active descendant form",
    plugins: ["combobox"],
    body: `<section class="docs-prose-section"><h2>Use for text entry with suggestions</h2><p>The editable value may differ from the active suggestion, so decide whether free text is accepted before integration. Nyx manages popup state, filtering, active-descendant focus, selection, and dismissal. The application supplies the option set and handles the committed value; use Searchable Select when a value must come from the list.</p></section>${card("Combobox", selectMarkup(comboboxMarkup, ["label[for='nyx-location-query']", "#nyx-location-combobox"]), "Registry source")}`,
  }),
  page({
    path: paths.components.forms.searchableSelect,
    categoryId: "forms",
    categoryLabel: "Forms",
    title: "Searchable Select",
    description: "Searchable Select is a Combobox configuration for long choice sets. Prefer a native select for ordinary non-searchable choices.",
    searchTerms: "searchable select combobox choice native select long options",
    plugins: ["combobox"],
    body: `<section class="docs-prose-section"><h2>Choose the smallest control</h2><p>Use a native <code>select</code> when the option set is short and does not need filtering. Use this Combobox configuration only when search materially helps people find a choice.</p></section>${card("Searchable Select", selectMarkup(comboboxMarkup, ["label[for='nyx-team-query']", "#nyx-team-select"]), "Combobox configuration")}`,
  }),
  page({
    path: paths.components.forms.inputOtp,
    categoryId: "forms",
    categoryLabel: "Forms",
    title: "Input OTP / PIN",
    description: "A multi-cell numeric code entry controller supports full-code paste, keyboard navigation, completion events, and one submitted form value.",
    searchTerms: "otp pin one time code verification paste autofill numeric form",
    plugins: ["input-otp"],
    body: `<section class="docs-prose-section"><h2>Choose the robust default deliberately</h2><p>A single native input with <code>autocomplete="one-time-code"</code>, <code>inputmode="numeric"</code>, and an appropriate <code>maxlength</code> is generally more robust for password managers, browser autofill, and screen readers. Use this multi-cell enhancement only when the visual requirement justifies those tradeoffs. Never use <code>type="number"</code> for a code.</p></section>${card("Input OTP / PIN", inputOtpMarkup, "Registry source")}`,
  }),
  page({
    path: paths.components.forms.dateTime,
    categoryId: "forms",
    categoryLabel: "Forms",
    title: "Range, Date, and Time",
    description: "Range, date, and time inputs use the Nyx control surface while retaining native picker behavior, validation, and mobile keyboards.",
    searchTerms: "range slider date time native input form strength",
    body: `<section class="docs-prose-section"><h2>Keep platform behavior for simple values</h2><p>The range, date, and time controls remain native inputs with Nyx surface styling. Their labels carry meaning that visual position alone cannot. Use application code to display a range value when immediate feedback is needed, and validate cross-field rules such as an end time after a start time at the form level.</p></section>${card("Range, date, and time", selectMarkup(formsMarkup, ["[data-nyx-example='range-date-time']"]), "Registry source")}`,
  }),
  page({
    path: paths.components.forms.calendar,
    categoryId: "forms",
    categoryLabel: "Forms",
    title: "Calendar",
    description: "A preview month-grid controller for single dates and ranges, with locale-aware labels, week starts, constraints, and complete keyboard movement.",
    searchTerms: "calendar month grid single range locale week start minimum maximum disabled date keyboard preview",
    plugins: ["calendar"],
    body: `<section class="docs-prose-section"><h2>Calendar dates, not moments</h2><p>Values use <code>YYYY-MM-DD</code> and never carry a time or time zone. Month and weekday labels come from <code>Intl.DateTimeFormat</code>; the default first weekday comes from <code>Intl.Locale</code> and can be overridden. Supply a <code>disabled</code> predicate for application rules such as blackout days.</p></section>${card("Single date and range", calendarMarkup, "Preview")}`,
  }),
  page({
    path: paths.components.forms.datePicker,
    categoryId: "forms",
    categoryLabel: "Forms",
    title: "Date Picker",
    description: "A preview Calendar composition keeps typed ISO input and popover selection synchronized while reusing Nyx positioning and dismissal.",
    searchTerms: "date picker input calendar popover typed parse positioning dismissal native date preview",
    plugins: ["date-picker"],
    body: `<section class="docs-prose-section"><h2>Use native date input first</h2><p>For a simple date field, prefer <code>input[type=date]</code>: it is smaller and uses the platform picker. Use Date Picker when the product needs the same custom Calendar across platforms, date-range selection, disabled-date rules, or visible adjacent-month context. Typed values use <code>YYYY-MM-DD</code>; range mode accepts two ISO dates separated by a slash.</p></section>${card("Date picker", datePickerMarkup, "Preview")}`,
  }),
  page({
    path: paths.components.forms.fileUpload,
    categoryId: "forms",
    categoryLabel: "Forms",
    title: "File Upload",
    description: "A native file input gains drag-and-drop, validation, leak-free image previews, queue state, and consumer-driven upload progress.",
    searchTerms: "file upload input drop zone multiple asset queue preview validation progress transport adapter",
    plugins: ["file-upload"],
    body: `<section class="docs-prose-section"><h2>Transport stays with the consumer</h2><p>Nyx owns selection, validation, previews, queue state, and progress display. Supply an adapter that performs the request and calls <code>reportProgress</code>. Use an XHR-based or streaming implementation when upload progress matters; <code>fetch</code> does not provide a universally useful upload-progress callback.</p>${codeBlock(`import { initFileUploads } from "@nyx-ui/plugins/file-upload";

const [upload] = initFileUploads(root, {
  transport: async (file, { reportProgress, signal }) => {
    // Implement the request with your transport. Call reportProgress(0..100).
    return uploadFileWithProgress(file, { reportProgress, signal });
  },
});`, "js", "Consumer transport adapter")}</section>${card("File upload", fileUploadMarkup, "Registry source")}`,
  }),
];
