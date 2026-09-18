import { dispatchNyxEvent, queryAllIncludingRoot } from "./internal/dom.js";

export type NyxDataTableSortDirection = "ascending" | "descending";
export type NyxDataTableComparator = (
  leftValue: string,
  rightValue: string,
  leftRow: HTMLTableRowElement,
  rightRow: HTMLTableRowElement,
) => number;
export type NyxDataTablePredicate = (row: HTMLTableRowElement, query: string) => boolean;

export interface NyxDataTableOptions {
  comparators?: Record<string, NyxDataTableComparator>;
  controlled?: boolean;
  pageSize?: number;
  predicate?: NyxDataTablePredicate;
  totalRows?: number;
}

export interface NyxDataTableState {
  filter: string;
  page: number;
  pageSize: number;
  sortColumn?: string;
  sortDirection?: NyxDataTableSortDirection;
}

export interface NyxDataTableStateEventDetail {
  action: "filter" | "page" | "sort";
  controlled: boolean;
  dataTable: NyxDataTable;
  previousState: NyxDataTableState;
  state: NyxDataTableState;
}

export interface NyxDataTableSelectionEventDetail {
  dataTable: NyxDataTable;
  key?: string;
  selected: boolean;
  selectedKeys: readonly string[];
}

export interface NyxDataTableEventMap {
  "nyx:data-table:before-filter": CustomEvent<NyxDataTableStateEventDetail>;
  "nyx:data-table:filter": CustomEvent<NyxDataTableStateEventDetail>;
  "nyx:data-table:before-page": CustomEvent<NyxDataTableStateEventDetail>;
  "nyx:data-table:page": CustomEvent<NyxDataTableStateEventDetail>;
  "nyx:data-table:before-sort": CustomEvent<NyxDataTableStateEventDetail>;
  "nyx:data-table:sort": CustomEvent<NyxDataTableStateEventDetail>;
  "nyx:data-table:before-select": CustomEvent<NyxDataTableSelectionEventDetail>;
  "nyx:data-table:select": CustomEvent<NyxDataTableSelectionEventDetail>;
}

declare global {
  interface HTMLElementEventMap extends NyxDataTableEventMap {}
}

const dataTableSelector = "[data-nyx-data-table]";
const instances = new WeakMap<HTMLElement, NyxDataTable>();

function cloneState(state: NyxDataTableState): NyxDataTableState {
  return { ...state };
}

export class NyxDataTable {
  readonly element: HTMLElement;
  readonly table: HTMLTableElement;

  private readonly comparators: Record<string, NyxDataTableComparator>;
  private readonly controlled: boolean;
  private readonly filterInput: HTMLInputElement | undefined;
  private readonly pageStatus: HTMLElement | undefined;
  private readonly predicate: NyxDataTablePredicate;
  private readonly selectAll: HTMLInputElement | undefined;
  private readonly selected = new Set<string>();
  private readonly tbody: HTMLTableSectionElement;
  private readonly totalRows: number | undefined;
  private rows: HTMLTableRowElement[] = [];
  private tableState: NyxDataTableState;

  constructor(element: HTMLElement, options: NyxDataTableOptions = {}) {
    this.element = element;
    this.table = this.required<HTMLTableElement>("table");
    this.tbody = this.required<HTMLTableSectionElement>("tbody");
    this.filterInput = element.querySelector<HTMLInputElement>("[data-nyx-data-table-filter]") ?? undefined;
    this.pageStatus = element.querySelector<HTMLElement>("[data-nyx-data-table-page-status]") ?? undefined;
    this.selectAll = element.querySelector<HTMLInputElement>("[data-nyx-data-table-select-all]") ?? undefined;
    this.controlled = options.controlled ?? element.dataset.nyxDataTableControlled === "true";
    this.comparators = options.comparators ?? {};
    this.totalRows = options.totalRows;
    this.predicate = options.predicate ?? ((row, query) => row.textContent?.toLocaleLowerCase().includes(query.toLocaleLowerCase()) ?? false);
    const pageSize = options.pageSize ?? (Number(element.dataset.nyxDataTablePageSize) || 10);
    this.tableState = {
      filter: this.filterInput?.value ?? "",
      page: Math.max(1, Number(element.dataset.nyxDataTablePage) || 1),
      pageSize: Math.max(1, pageSize),
    };
    const activeSort = element.querySelector<HTMLButtonElement>("[data-nyx-data-table-sort][data-direction]");
    if (activeSort?.dataset.nyxDataTableSort) {
      this.tableState.sortColumn = activeSort.dataset.nyxDataTableSort;
      this.tableState.sortDirection = activeSort.dataset.direction === "descending" ? "descending" : "ascending";
    }
    this.refresh();
    this.element.addEventListener("click", this.handleClick);
    this.element.addEventListener("change", this.handleChange);
    this.filterInput?.addEventListener("input", this.handleFilterInput);
  }

  get state(): NyxDataTableState {
    return cloneState(this.tableState);
  }

  set state(value: NyxDataTableState) {
    this.tableState = { ...value, page: Math.max(1, value.page), pageSize: Math.max(1, value.pageSize) };
    if (this.filterInput) this.filterInput.value = this.tableState.filter;
    this.apply();
  }

  get selectedKeys(): readonly string[] {
    return [...this.selected];
  }

  sort(column: string, direction?: NyxDataTableSortDirection): boolean {
    const nextDirection = direction ?? (this.tableState.sortColumn === column && this.tableState.sortDirection === "ascending" ? "descending" : "ascending");
    return this.requestState("sort", { ...this.tableState, page: 1, sortColumn: column, sortDirection: nextDirection });
  }

  filter(query: string): boolean {
    return this.requestState("filter", { ...this.tableState, filter: query, page: 1 });
  }

  goToPage(page: number): boolean {
    const pageCount = this.pageCount(this.filteredRows().length);
    return this.requestState("page", { ...this.tableState, page: Math.min(Math.max(1, page), pageCount) });
  }

  select(key: string, selected: boolean): boolean {
    const current = this.selected.has(key);
    if (current === selected) return true;
    const next = new Set(this.selected);
    if (selected) next.add(key);
    else next.delete(key);
    const detail: NyxDataTableSelectionEventDetail = { dataTable: this, key, selected, selectedKeys: [...next] };
    if (!dispatchNyxEvent(this.element, "nyx:data-table:before-select", detail, true)) {
      this.syncSelection();
      return false;
    }
    this.selected.clear();
    next.forEach((value) => this.selected.add(value));
    this.syncSelection();
    dispatchNyxEvent(this.element, "nyx:data-table:select", detail);
    return true;
  }

  refresh(): void {
    this.rows = Array.from(this.tbody.querySelectorAll<HTMLTableRowElement>("tr[data-row-key]"));
    this.rows.forEach((row) => {
      const checkbox = row.querySelector<HTMLInputElement>("[data-nyx-data-table-row-select]");
      if (checkbox?.checked && row.dataset.rowKey) this.selected.add(row.dataset.rowKey);
    });
    this.apply();
  }

  destroy(): void {
    this.element.removeEventListener("click", this.handleClick);
    this.element.removeEventListener("change", this.handleChange);
    this.filterInput?.removeEventListener("input", this.handleFilterInput);
    if (instances.get(this.element) === this) instances.delete(this.element);
  }

  private required<T extends Element>(selector: string): T {
    const value = this.element.querySelector<T>(selector);
    if (!value) throw new Error(`NyxDataTable requires ${selector}.`);
    return value;
  }

  private cellValue(row: HTMLTableRowElement, column: string): string {
    const cell = Array.from(row.querySelectorAll<HTMLElement>("[data-column]")).find((candidate) => candidate.dataset.column === column);
    return cell?.dataset.sortValue ?? cell?.textContent?.trim() ?? "";
  }

  private filteredRows(): HTMLTableRowElement[] {
    const query = this.tableState.filter.trim();
    return query ? this.rows.filter((row) => this.predicate(row, query)) : [...this.rows];
  }

  private sortedRows(rows: HTMLTableRowElement[]): HTMLTableRowElement[] {
    const { sortColumn, sortDirection } = this.tableState;
    if (!sortColumn || !sortDirection) return rows;
    const comparator = this.comparators[sortColumn] ?? ((left, right) => left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" }));
    const direction = sortDirection === "ascending" ? 1 : -1;
    return rows.map((row, index) => ({ index, row })).sort((left, right) => {
      const compared = comparator(this.cellValue(left.row, sortColumn), this.cellValue(right.row, sortColumn), left.row, right.row) * direction;
      return compared || left.index - right.index;
    }).map(({ row }) => row);
  }

  private pageCount(filteredCount: number): number {
    return Math.max(1, Math.ceil((this.controlled ? this.totalRows ?? filteredCount : filteredCount) / this.tableState.pageSize));
  }

  private currentPageRows(): HTMLTableRowElement[] {
    if (this.controlled) return this.rows.filter((row) => !row.hidden);
    return this.rows.filter((row) => !row.hidden);
  }

  private apply(): void {
    const filtered = this.filteredRows();
    const pageCount = this.pageCount(filtered.length);
    this.tableState.page = Math.min(this.tableState.page, pageCount);
    if (!this.controlled) {
      const sorted = this.sortedRows(filtered);
      const start = (this.tableState.page - 1) * this.tableState.pageSize;
      const visible = new Set(sorted.slice(start, start + this.tableState.pageSize));
      this.rows.forEach((row) => { row.hidden = !visible.has(row); });
      sorted.forEach((row) => this.tbody.append(row));
    }
    this.element.querySelectorAll<HTMLButtonElement>("[data-nyx-data-table-sort]").forEach((button) => {
      const column = button.dataset.nyxDataTableSort;
      const active = column === this.tableState.sortColumn;
      button.dataset.direction = active ? this.tableState.sortDirection : "";
      const th = button.closest<HTMLTableCellElement>("th");
      th?.setAttribute("aria-sort", active ? this.tableState.sortDirection ?? "none" : "none");
    });
    this.element.querySelectorAll<HTMLButtonElement>("[data-nyx-data-table-page]").forEach((button) => {
      const action = button.dataset.nyxDataTablePage;
      if (action === "previous") button.disabled = this.tableState.page <= 1;
      else if (action === "next") button.disabled = this.tableState.page >= pageCount;
      else if (Number(action)) button.setAttribute("aria-current", Number(action) === this.tableState.page ? "page" : "false");
    });
    if (this.pageStatus) this.pageStatus.textContent = `Page ${this.tableState.page} of ${pageCount}`;
    const empty = this.element.querySelector<HTMLElement>("[data-nyx-data-table-empty]");
    if (empty) empty.hidden = this.controlled ? this.rows.length > 0 : filtered.length > 0;
    this.syncSelection();
  }

  private syncSelection(): void {
    this.rows.forEach((row) => {
      const key = row.dataset.rowKey;
      const checkbox = row.querySelector<HTMLInputElement>("[data-nyx-data-table-row-select]");
      if (key && checkbox) checkbox.checked = this.selected.has(key);
      row.toggleAttribute("data-selected", Boolean(key && this.selected.has(key)));
    });
    if (!this.selectAll) return;
    const visibleKeys = this.currentPageRows().map((row) => row.dataset.rowKey).filter((key): key is string => Boolean(key));
    const count = visibleKeys.filter((key) => this.selected.has(key)).length;
    this.selectAll.checked = visibleKeys.length > 0 && count === visibleKeys.length;
    this.selectAll.indeterminate = count > 0 && count < visibleKeys.length;
  }

  private requestState(action: NyxDataTableStateEventDetail["action"], nextState: NyxDataTableState): boolean {
    const previousState = cloneState(this.tableState);
    const detail: NyxDataTableStateEventDetail = { action, controlled: this.controlled, dataTable: this, previousState, state: cloneState(nextState) };
    if (!dispatchNyxEvent(this.element, `nyx:data-table:before-${action}`, detail, true)) {
      if (this.filterInput) this.filterInput.value = previousState.filter;
      return false;
    }
    this.tableState = nextState;
    this.apply();
    dispatchNyxEvent(this.element, `nyx:data-table:${action}`, detail);
    return true;
  }

  private readonly handleFilterInput = (): void => {
    this.filter(this.filterInput?.value ?? "");
  };

  private readonly handleClick = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const sortButton = target.closest<HTMLButtonElement>("[data-nyx-data-table-sort]");
    if (sortButton?.dataset.nyxDataTableSort) {
      this.sort(sortButton.dataset.nyxDataTableSort);
      return;
    }
    const pageButton = target.closest<HTMLButtonElement>("[data-nyx-data-table-page]");
    if (!pageButton || pageButton.disabled) return;
    const action = pageButton.dataset.nyxDataTablePage;
    if (action === "previous") this.goToPage(this.tableState.page - 1);
    else if (action === "next") this.goToPage(this.tableState.page + 1);
    else if (Number(action)) this.goToPage(Number(action));
  };

  private readonly handleChange = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.matches("[data-nyx-data-table-row-select]")) {
      const key = target.closest<HTMLTableRowElement>("tr[data-row-key]")?.dataset.rowKey;
      if (key) this.select(key, target.checked);
      return;
    }
    if (target.matches("[data-nyx-data-table-select-all]")) {
      const keys = this.currentPageRows().map((row) => row.dataset.rowKey).filter((key): key is string => Boolean(key));
      const next = new Set(this.selected);
      keys.forEach((key) => target.checked ? next.add(key) : next.delete(key));
      const detail: NyxDataTableSelectionEventDetail = { dataTable: this, selected: target.checked, selectedKeys: [...next] };
      if (!dispatchNyxEvent(this.element, "nyx:data-table:before-select", detail, true)) { this.syncSelection(); return; }
      this.selected.clear();
      next.forEach((key) => this.selected.add(key));
      this.syncSelection();
      dispatchNyxEvent(this.element, "nyx:data-table:select", detail);
    }
  };
}

export function initDataTables(root: ParentNode = document, options: NyxDataTableOptions = {}): NyxDataTable[] {
  return queryAllIncludingRoot<HTMLElement>(root, dataTableSelector).map((element) => {
    const current = instances.get(element);
    if (current) return current;
    const instance = new NyxDataTable(element, options);
    instances.set(element, instance);
    return instance;
  });
}
