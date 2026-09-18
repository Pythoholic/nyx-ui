import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const markup = readFileSync(resolve(process.cwd(), "../../registry/components/chat-thread.html"), "utf8");

describe("chat thread registry markup", () => {
  it("keeps transcript order, message authorship, and timestamps semantic", () => {
    document.body.innerHTML = markup;
    const thread = document.querySelector<HTMLElement>(".nyx-chat-thread")!;
    const messages = thread.querySelectorAll("ol > li > article.nyx-chat-message");
    expect(thread.getAttribute("aria-labelledby")).toBeTruthy();
    expect(messages).toHaveLength(3);
    expect(messages[0]?.getAttribute("data-author")).toBe("assistant");
    expect(messages[1]?.getAttribute("data-author")).toBe("self");
    expect(thread.querySelectorAll("time[datetime]")).toHaveLength(2);
    expect(thread.hasAttribute("aria-live")).toBe(false);
  });
});
