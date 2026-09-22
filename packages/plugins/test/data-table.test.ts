import { beforeEach, describe, expect, it, vi } from "vitest";
import { initDataTables, type NyxDataTable } from "../src/data-table.js";

type DataRowElement = HTMLTableSectionElement["rows"][number];

function renderTable(controlled = false): HTMLElement {
  document.body.innerHTML = `<div data-nyx-data-table data-nyx-data-table-page-size="2"${controlled ? ' data-nyx-data-table-controlled="true"' : ""}>
    <input data-nyx-data-table-filter><span data-nyx-data-table-page-status></span>
    <table><thead><tr><th><input data-nyx-data-table-select-all type="checkbox"></th><th aria-sort="none"><button data-nyx-data-table-sort="name">Name</button></th></tr></thead><tbody>
      <tr data-row-key="charlie"><td><input data-nyx-data-table-row-select type="checkbox"></td><th data-column="name">Charlie</th></tr>
      <tr data-row-key="alpha"><td><input data-nyx-data-table-row-select type="checkbox"></td><th data-column="name">Alpha</th></tr>
      <tr data-row-key="bravo"><td><input data-nyx-data-table-row-select type="checkbox"></td><th data-column="name">Bravo</th></tr>
      <tr data-nyx-data-table-empty hidden><td>No results</td></tr>
    </tbody></table>
    <button data-nyx-data-table-page="previous">Previous</button><button data-nyx-data-table-page="next">Next</button>
  </div>`;
  const root = document.querySelector<HTMLElement>("[data-nyx-data-table]");
  if (!root) throw new Error("Data table fixture missing.");
  return root;
}

describe("NyxDataTable", () => {
  let dataTable: NyxDataTable | undefined;
  beforeEach(() => { document.body.innerHTML = ""; dataTable = undefined; });

  it("initializes idempotently and reinitializes after destroy", () => {
    const root = renderTable();
    dataTable = initDataTables(root)[0];
    expect(initDataTables(root)[0]).toBe(dataTable);
    dataTable?.destroy();
    const next = initDataTables(root)[0];
    expect(next).not.toBe(dataTable);
    next?.destroy();
  });

  it("sorts through real header buttons and maintains aria-sort", () => {
    const root = renderTable();
    dataTable = initDataTables()[0];
    root.querySelector<HTMLButtonElement>("[data-nyx-data-table-sort]")?.click();
    const visible = Array.from(root.querySelectorAll<DataRowElement>("tr[data-row-key]")).filter((row) => !row.hidden);
    expect(visible.map((row) => row.dataset.rowKey)).toEqual(["alpha", "bravo"]);
    expect(root.querySelector("th[aria-sort='ascending']")).not.toBeNull();
    expect(root.querySelectorAll("[data-nyx-motion='reordered']")).toHaveLength(0);
  });

  it("filters and paginates in client mode", () => {
    const root = renderTable();
    dataTable = initDataTables()[0];
    const filter = root.querySelector<HTMLInputElement>("[data-nyx-data-table-filter]")!;
    filter.value = "bravo";
    filter.dispatchEvent(new Event("input", { bubbles: true }));
    expect(Array.from(root.querySelectorAll<DataRowElement>("tr[data-row-key]")).filter((row) => !row.hidden).map((row) => row.dataset.rowKey)).toEqual(["bravo"]);
    expect(root.querySelector("[data-nyx-data-table-page-status]")?.textContent).toBe("Page 1 of 1");
  });

  it("persists selection by row key across pages", () => {
    const root = renderTable();
    dataTable = initDataTables()[0];
    const first = root.querySelector<HTMLInputElement>("tr[data-row-key='charlie'] [data-nyx-data-table-row-select]")!;
    first.checked = true;
    first.dispatchEvent(new Event("change", { bubbles: true }));
    dataTable!.goToPage(2);
    expect(dataTable!.selectedKeys).toEqual(["charlie"]);
    dataTable!.goToPage(1);
    expect(first.checked).toBe(true);
  });

  it("emits cancelable controlled requests without transforming server rows", () => {
    const root = renderTable(true);
    dataTable = initDataTables(root, { totalRows: 20 })[0];
    const before = vi.fn((event: Event) => event.preventDefault());
    root.addEventListener("nyx:data-table:before-sort", before);
    expect(dataTable!.sort("name")).toBe(false);
    expect(dataTable!.state.sortColumn).toBeUndefined();
    root.removeEventListener("nyx:data-table:before-sort", before);
    expect(dataTable!.sort("name")).toBe(true);
    expect(Array.from(root.querySelectorAll<DataRowElement>("tr[data-row-key]")).map((row) => row.dataset.rowKey)).toEqual(["charlie", "alpha", "bravo"]);
  });
});
