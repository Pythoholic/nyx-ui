type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
const sessions = new WeakMap<HTMLElement, ValidationSession>();

function isControl(value: EventTarget | null): value is Control {
  return value instanceof HTMLInputElement || value instanceof HTMLSelectElement || value instanceof HTMLTextAreaElement;
}

class ValidationSession {
  users = 0;
  private edited = new WeakSet<Control>();
  private submitted = false;

  constructor(readonly scope: HTMLElement) {
    scope.addEventListener("input", this.edit, true);
    scope.addEventListener("change", this.edit, true);
    scope.addEventListener("invalid", this.submit, true);
    scope.addEventListener("submit", this.submit, true);
    scope.addEventListener("reset", this.onReset);
    this.sync();
  }

  sync = (): void => {
    const controls = isControl(this.scope) ? [this.scope] : Array.from(this.scope.querySelectorAll<Control>("input, select, textarea"));
    for (const control of controls) {
      if (!control.willValidate) continue;
      const edited = this.edited.has(control);
      control.dataset.validationState = this.submitted ? "submitted" : edited ? "edited" : "pristine";
      // Reading validity must not dispatch an invalid event during initialization.
      control.setAttribute("aria-invalid", String((this.submitted || edited) && !control.validity.valid));
    }
  };

  reset = (): void => { this.edited = new WeakSet(); this.submitted = false; this.sync(); };
  private edit = (event: Event): void => {
    if (isControl(event.target)) this.edited.add(event.target);
    this.sync();
  };
  private submit = (): void => { this.submitted = true; this.sync(); };
  private onReset = (event: Event): void => {
    queueMicrotask(() => { if (!event.defaultPrevented && this.users) this.reset(); });
  };

  destroy = (): void => {
    if (--this.users) return;
    this.scope.removeEventListener("input", this.edit, true);
    this.scope.removeEventListener("change", this.edit, true);
    this.scope.removeEventListener("invalid", this.submit, true);
    this.scope.removeEventListener("submit", this.submit, true);
    this.scope.removeEventListener("reset", this.onReset);
    sessions.delete(this.scope);
  };
}

/** Share validation timing across every native field in a containing form. */
export function acquireValidation(control: Control | HTMLFormElement): Pick<ValidationSession, "sync" | "reset" | "destroy"> {
  const scope = control instanceof HTMLFormElement ? control : control.form ?? control;
  let session = sessions.get(scope);
  if (!session) { session = new ValidationSession(scope); sessions.set(scope, session); }
  session.users++;
  let released = false;
  return {
    sync: session.sync,
    reset: session.reset,
    destroy: () => { if (!released) { released = true; session.destroy(); } },
  };
}
