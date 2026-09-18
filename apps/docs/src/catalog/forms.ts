import { icon } from "../icons.js";
import calendarMarkup from "../../../../registry/components/calendar.html?raw";
import comboboxMarkup from "../../../../registry/components/combobox.html?raw";
import datePickerMarkup from "../../../../registry/components/date-picker.html?raw";
import fileUploadMarkup from "../../../../registry/components/file-upload.html?raw";
import inputOtpMarkup from "../../../../registry/components/input-otp.html?raw";
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
    body: card("Text fields", `<div class="docs-form-grid"><label class="nyx-field" for="project-name"><span class="nyx-label">Project name</span><input class="nyx-input" id="project-name" value="night-operations" /></label><label class="nyx-field" for="record-search"><span class="nyx-label">Search</span><div class="nyx-input-group"><input class="nyx-input" id="record-search" placeholder="Filter records"/><button class="nyx-button nyx-icon-button" type="button" aria-label="Search">${icon("search")}</button></div></label><label class="nyx-field docs-form-span" for="project-description"><span class="nyx-label">Description</span><textarea class="nyx-textarea" id="project-description">Reusable operational interface components.</textarea><span class="nyx-field-hint">Maximum 240 characters.</span></label><label class="nyx-field" for="invalid-value"><span class="nyx-label">Invalid value</span><input class="nyx-input" id="invalid-value" aria-invalid="true" aria-describedby="validation-error" value="bad/value"/><span class="nyx-field-error" id="validation-error">Use letters, numbers, and hyphens.</span></label><label class="nyx-field" for="disabled-value"><span class="nyx-label">Disabled</span><input class="nyx-input" id="disabled-value" disabled value="Unavailable"/></label></div>`, "Semantic"),
  }),
  page({
    path: paths.components.forms.selection,
    categoryId: "forms",
    categoryLabel: "Forms",
    title: "Selection Controls",
    description,
    searchTerms: "select checkbox radio switch number segmented choice forms",
    body: card("Selection", `<div class="docs-form-grid"><label class="nyx-field" for="region"><span class="nyx-label">Region</span><select class="nyx-select" id="region"><option>Tokyo</option><option>London</option><option>New York</option></select></label><label class="nyx-field" for="quantity"><span class="nyx-label">Quantity</span><input class="nyx-input" id="quantity" type="number" value="24" min="1"/></label><label class="nyx-choice" for="notices"><input id="notices" type="checkbox" checked/>Receive operational notices</label><fieldset class="nyx-toggle-fieldset"><legend class="nyx-label">Environment</legend><label class="nyx-choice" for="env-production"><input id="env-production" type="radio" name="env" checked/>Production</label><label class="nyx-choice" for="env-staging"><input id="env-staging" type="radio" name="env"/>Staging</label></fieldset><label class="nyx-switch" for="automatic-deployment"><input id="automatic-deployment" type="checkbox" checked/><span class="nyx-switch-track"></span><span>Automatic deployment</span></label><fieldset class="nyx-segmented-fieldset"><legend class="nyx-label">View mode</legend><div class="nyx-segmented"><input id="seg-a" name="segment" type="radio" checked/><label for="seg-a">Grid</label><input id="seg-b" name="segment" type="radio"/><label for="seg-b">List</label></div></fieldset></div>`, "Keyboard ready"),
  }),
  page({
    path: paths.components.forms.combobox,
    categoryId: "forms",
    categoryLabel: "Forms",
    title: "Combobox",
    description: "An editable ARIA combobox filters listbox options, tracks an active descendant, and synchronizes selection to a form value.",
    searchTerms: "combobox autocomplete listbox filter search option active descendant form",
    plugins: ["combobox"],
    body: card("Combobox", selectMarkup(comboboxMarkup, ["label[for='nyx-location-query']", "#nyx-location-combobox"]), "Registry source"),
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
    description: "Native range, date, and time inputs retain platform behavior while inheriting the Nyx visual contract.",
    searchTerms: "range slider date time native input form strength",
    body: card("Range, date, and time", `<div class="docs-form-grid"><label class="nyx-field docs-form-span" for="strength"><span class="nyx-label">Strength · <output data-range-output for="strength">68</output></span><input class="nyx-range" id="strength" data-range-input type="range" min="0" max="100" value="68"/></label><label class="nyx-field" for="start-date"><span class="nyx-label">Date</span><input class="nyx-input" id="start-date" type="date" value="2026-09-17"/></label><label class="nyx-field" for="start-time"><span class="nyx-label">Time</span><input class="nyx-input" id="start-time" type="time" value="17:30"/></label></div>`, "Native"),
  }),
  page({
    path: paths.components.forms.calendar,
    categoryId: "forms",
    categoryLabel: "Forms",
    title: "Calendar",
    description: "A preview month-grid controller for single dates and ranges, with locale-aware labels, week starts, constraints, and complete keyboard movement.",
    searchTerms: "calendar month grid single range locale week start minimum maximum disabled date keyboard preview",
    plugins: ["calendar"],
    body: `<section class="docs-prose-section"><h2>Calendar dates, not moments</h2><p>Values use <code>YYYY-MM-DD</code> and never carry a time or time zone. Month and weekday labels come from <code>Intl.DateTimeFormat</code>; the default first weekday comes from <code>Intl.Locale</code> and can be overridden. Supply a <code>disabled</code> predicate for application rules such as blackout days.</p></section>${card("Single date and range", `<div class="docs-row" style="align-items:start">${calendarMarkup}</div>`, "Preview", calendarMarkup)}`,
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
