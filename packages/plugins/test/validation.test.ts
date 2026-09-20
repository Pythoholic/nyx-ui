import { expect, it } from "vitest";
import { acquireValidation } from "../src/internal/validation.js";

it("shares validation timing without dispatching invalid during initialization and releases leases safely", async () => {
  document.body.innerHTML = '<form><input required><input required type="email"></form>';
  const form = document.querySelector('form')!;
  const [name, email] = Array.from(form.querySelectorAll('input'));
  let invalidEvents = 0;
  form.addEventListener('invalid', () => invalidEvents++, true);
  const first = acquireValidation(name!);
  const second = acquireValidation(email!);
  expect(invalidEvents).toBe(0);
  expect(name!.getAttribute('aria-invalid')).toBe('false');
  email!.value = 'bad';
  email!.dispatchEvent(new Event('input', {bubbles:true}));
  expect(email!.getAttribute('aria-invalid')).toBe('true');
  expect(name!.getAttribute('aria-invalid')).toBe('false');
  first.destroy(); first.destroy();
  form.checkValidity();
  expect(name!.dataset.validationState).toBe('submitted');
  form.reset();
  await Promise.resolve();
  expect(email!.dataset.validationState).toBe('pristine');
  second.destroy();
  email!.dispatchEvent(new Event('input', {bubbles:true}));
  expect(email!.dataset.validationState).toBe('pristine');
});
