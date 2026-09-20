import markup from "./screen.html?raw";
import { mountWorkspace } from "./app.js";
import "./style.css";

const host = document.querySelector<HTMLElement>("#app")!;
host.innerHTML = markup;
const cleanup = mountWorkspace(host.querySelector<HTMLElement>("[data-render-workspace]")!);
window.addEventListener("pagehide", cleanup, { once: true });
window.addEventListener("pageshow", event => { if (event.persisted) window.location.reload(); });
if (import.meta.hot) import.meta.hot.dispose(cleanup);
