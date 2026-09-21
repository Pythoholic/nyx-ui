import { NyxToast } from '@nyx-ui/plugins/toast';
import { NyxDialog } from '@nyx-ui/plugins/dialog';
import { NyxSidebar } from '@nyx-ui/plugins/sidebar';
import { initialState, imageSlots, names, type AdminState, type RecordItem } from './data.js';
import './style.css';

const root = document.querySelector<HTMLElement>('#admin')!;
const storageKey = 'nyx-admin-demo-v1';
let state: AdminState = initialState();
try { const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null') as AdminState | null; if (saved && Array.isArray(saved.orders) && Array.isArray(saved.products) && saved.settings && saved.members && saved.projects && saved.events && saved.messages) state = saved; } catch { /* Demo works without browser storage. */ }
const esc = (value: unknown) => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
const initials = (name: string) => name.split(' ').map(s => s[0]).slice(0, 2).join('');
const uid = () => crypto.randomUUID();
const icons: Record<string, string> = {
  overview: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  analytics: '<path d="M4 4v16h17M8 15l4-5 4 3 5-7"/>',
  orders: '<path d="M4 7h16l-1 14H5L4 7ZM8 7V5a4 4 0 0 1 8 0v2"/>',
  customers: '<circle cx="9" cy="8" r="3"/><path d="M2 21v-3a7 7 0 0 1 14 0v3M16 5a3 3 0 0 1 0 6m3 3a6 6 0 0 1 3 5"/>',
  products: '<path d="m12 2 9 5v10l-9 5-9-5V7l9-5ZM3 7l9 5 9-5M12 12v10M8 4l9 5"/>',
  projects: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M15 4v16M5 8h2m4 4h2m4-4h2"/>',
  inbox: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6m10-6v6M3 11h18"/>',
  team: '<circle cx="12" cy="8" r="4"/><path d="M4 22v-2a8 8 0 0 1 16 0v2"/>',
  billing: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20M6 16h4"/>',
  settings: '<circle cx="12" cy="12" r="4"/><path d="m12 2 2 3 4 1 1 4 3 2-3 2-1 4-4 1-2 3-2-3-4-1-1-4-3-2 3-2 1-4 4-1 2-3Z"/>',
  search: '<circle cx="10" cy="10" r="7"/><path d="m16 16 5 5"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1"/><path d="m3 17 6-6 4 4 3-3 5 5"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
};
const icon = (name: string) => `<svg class="nyx-icon" aria-hidden="true" viewBox="0 0 24 24">${icons[name] ?? icons.overview}</svg>`;
const routes = ['overview', 'analytics', 'orders', 'customers', 'products', 'projects', 'inbox', 'calendar', 'team', 'billing', 'settings'];
const labels: Record<string, string> = { overview: 'Overview', analytics: 'Analytics', orders: 'Orders', customers: 'Customers', products: 'Products', projects: 'Projects', inbox: 'Inbox', calendar: 'Calendar', team: 'Team & access', billing: 'Billing', settings: 'Settings' };
let route = 'overview';
let query = '';
let filter = 'All';
let sort = 'newest';
let page = 1;
let period = '6';
let selected = new Set<string>();
let calendarMonth = 8;
let calendarYear = 2026;
let activeMessage = state.messages[0]?.id ?? '';
let dialog: NyxDialog | undefined;
const base = import.meta.env.BASE_URL;
document.documentElement.dataset.nyxTheme = ['solar', 'signal', 'flux', 'plasma'].includes(state.theme) ? state.theme : 'signal';

function avatar(name: string): string {
  const slot = imageSlots[`avatar-${names.indexOf(name)}`];
  return slot?.src ? `<img class="nyx-avatar" src="${esc(slot.src)}" alt="${esc(name)}" />` : `<span class="nyx-avatar" aria-hidden="true">${esc(initials(name))}</span>`;
}
function imageSlot(id: string, compact = false): string {
  const slot = imageSlots[id];
  if (slot?.src) return `<img class="admin-art ${compact ? 'compact' : ''}" src="${esc(slot.src)}" alt="${esc(slot.alt)}" />`;
  return `<div class="admin-art ${compact ? 'compact' : ''}" role="img" aria-label="${esc(slot?.alt ?? 'Product image')} placeholder"><span>${icon('image')}</span>${compact ? '' : `<small>${esc(slot?.alt ?? 'Product image')}</small><span class="admin-art-spec">IMAGE PLACEHOLDER · ${esc(slot?.ratio ?? '4:3')}</span>`}</div>`;
}
const badge = (status: string) => `<span class="nyx-badge" data-tone="${['Paid', 'Active', 'Done', 'Owner'].includes(status) ? 'success' : ['Pending', 'Review', 'Low stock', 'Admin'].includes(status) ? 'warning' : ['Refunded', 'Out of stock'].includes(status) ? 'danger' : 'neutral'}">${esc(status)}</span>`;
const button = (text: string, action: string, primary = false, glyph = '') => `<button type="button" class="nyx-button" ${primary ? 'data-variant="primary"' : ''} data-action="${action}">${glyph ? icon(glyph) : ''}${text}</button>`;
const sectionHead = (title: string, sub: string, action = '') => `<div class="nyx-panel-header admin-section-head"><div><h2 class="nyx-panel-title">${title}</h2><p class="nyx-panel-description">${sub}</p></div>${action}</div>`;
const empty = (title: string, sub: string) => `<div class="nyx-empty admin-empty">${icon('search')}<h3 class="nyx-panel-title">${title}</h3><p>${sub}</p></div>`;

root.innerHTML = `<a class="admin-skip" href="#main">Skip to content</a>
  <dialog class="nyx-dialog nyx-sidebar-dialog admin-navigation" id="admin-sidebar" data-nyx-sidebar-panel data-layout="drawer" data-side="left" aria-label="Workspace navigation"><aside class="nyx-app-sidebar admin-sidebar" aria-label="Workspace sidebar"><button class="nyx-button nyx-icon-button" data-variant="quiet" data-nyx-sidebar-close data-nyx-dialog-close aria-label="Close navigation">${icon('close')}</button>
    <a class="admin-brand" href="#overview"><span class="admin-logo">N<span> /</span></span><span>NYX <b>STEALTH</b><small>ADMIN WORKSPACE</small></span></a>
    <div class="admin-workspace"><span class="nyx-avatar">S</span><div><strong data-workspace-name>${esc(state.settings.workspace)}</strong><small>Commerce & operations</small></div></div>
    <nav class="nyx-sidebar-nav" aria-label="Admin navigation">${[['Workspace', routes.slice(0, 5)], ['Collaborate', routes.slice(5, 8)], ['Manage', routes.slice(8)]].map(([label, items]) => `<p class="admin-nav-label">${label}</p>${(items as string[]).map(id => `<a href="#${id}" data-route="${id}">${icon(id)}<span>${labels[id]}</span>${id === 'inbox' ? '<span class="admin-count" data-unread></span>' : ''}</a>`).join('')}`).join('')}</nav>
    <div class="admin-sidebar-foot"><span class="admin-online">All systems operational</span><a href="${base}">Explore Nyx components ${icon('arrow')}</a><button class="nyx-button admin-profile" data-variant="quiet" type="button" data-action="profile">${avatar('Alex Morgan')}<span><strong>Alex Morgan</strong><small>Workspace owner</small></span>${icon('settings')}</button></div>
  </aside></dialog>
  <div class="admin-shell"><header class="nyx-topbar admin-topbar"><button class="nyx-button nyx-icon-button admin-icon-button" data-variant="quiet" data-nyx-sidebar-toggle aria-label="Toggle navigation" aria-controls="admin-sidebar" aria-expanded="false">${icon('menu')}</button><span class="admin-breadcrumb">Workspace <span>/</span> <strong id="crumb">Overview</strong></span><div class="admin-top-actions"><button class="nyx-button admin-search-button" data-variant="quiet" data-action="search">${icon('search')}<span>Search workspace</span><kbd class="nyx-kbd">Ctrl K</kbd></button><label class="admin-theme-label"><span class="nyx-visually-hidden">Accent theme</span><select class="nyx-select" aria-label="Accent theme" id="admin-theme">${['solar', 'signal', 'flux', 'plasma'].map(t => `<option ${state.theme === t ? 'selected' : ''}>${t}</option>`).join('')}</select></label><a href="#inbox" class="nyx-button nyx-icon-button admin-icon-button" aria-label="Open inbox">${icon('bell')}<i data-notification-dot></i></a></div></header>
    <main id="main" tabindex="-1"></main><footer class="admin-footer"><span>NYX STEALTH <span class="admin-dot">/</span> Crafted with Nyx UI</span><span>Sample data · changes stay in this browser</span></footer></div>
  <div class="nyx-toast-region" id="admin-toasts"></div><dialog class="nyx-dialog admin-dialog" id="admin-dialog" data-nyx-dialog aria-labelledby="dialog-title"></dialog>`;
root.setAttribute('data-nyx-sidebar', '');
const sidebar = new NyxSidebar(root, { mediaQuery: '(max-width: 950px)' });
const main = root.querySelector<HTMLElement>('main')!;
const toasts = new NyxToast(root.querySelector<HTMLElement>('#admin-toasts')!);
function notify(title: string, description = '', tone: 'neutral' | 'success' | 'warning' | 'danger' = 'success'): void { toasts.notify({ title, description, tone }); }
function persist(): void { try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { notify('Browser storage unavailable', 'Changes will last for this session only.', 'warning'); } }
function notifications(): void {
  const count = state.messages.filter(m => m.unread).length;
  root.querySelectorAll<HTMLElement>('[data-unread]').forEach(e => { e.textContent = String(count); e.hidden = count === 0; });
  root.querySelectorAll<HTMLElement>('[data-notification-dot]').forEach(e => e.hidden = count === 0);
}

function chart(): string {
  const revenue = state.orders.filter(o => o.status === 'Paid').reduce((sum, o) => sum + o.total, 0);
  const values = [1420, 1710, 1550, 1940, 2180, revenue].slice(-Number(period));
  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'].slice(-Number(period));
  const max = Math.ceil(Math.max(...values) / 1000) * 1000;
  const points = values.map((v, i) => `${50 + i * 580 / (values.length - 1)},${210 - v / max * 170}`);
  return `<div class="admin-chart"><svg class="nyx-chart" viewBox="0 0 670 258" role="img" aria-labelledby="revenue-title"><title id="revenue-title">Monthly revenue, ${months.map((m, i) => `${m} ${money(values[i]!)}`).join(', ')}</title><defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--nyx-chart-primary)" stop-opacity=".2"/><stop offset="100%" stop-color="var(--nyx-chart-primary)" stop-opacity="0"/></linearGradient></defs>${[0, 1, 2, 3].map(i => `<line x1="50" y1="${40 + i * 170 / 3}" x2="635" y2="${40 + i * 170 / 3}" stroke="var(--nyx-line)" stroke-dasharray="3 5"/><text x="0" y="${44 + i * 170 / 3}">${money(max * (1 - i / 3))}</text>`).join('')}<path d="M50 210 L${points.join(' L')} L630 210 Z" fill="url(#area)"/><polyline class="nyx-chart-series" points="${points.join(' ')}"/>${points.map((p, i) => `<circle cx="${p.split(',')[0]}" cy="${p.split(',')[1]}" r="4" fill="var(--nyx-panel)" stroke="var(--nyx-chart-primary)" stroke-width="2"><title>${months[i]}: ${money(values[i]!)}</title></circle><text x="${p.split(',')[0]}" y="245" text-anchor="middle">${months[i]}</text>`).join('')}</svg></div>`;
}
function kpis(): string {
  const paid = state.orders.filter(o => o.status === 'Paid');
  return `<div class="nyx-stat-grid admin-kpis">${[
    ['Revenue', money(paid.reduce((s, o) => s + o.total, 0)), `${paid.length} paid orders`, 'analytics'],
    ['Orders', String(state.orders.length), `${state.orders.filter(o => o.status === 'Pending').length} awaiting payment`, 'orders'],
    ['Customers', String(new Set(state.orders.map(o => o.email)).size), 'Across the sample workspace', 'customers'],
    ['Avg. order value', money(paid.reduce((s, o) => s + o.total, 0) / (paid.length || 1)), 'Paid orders only', 'billing'],
  ].map(([label, value, note, glyph], i) => `<article class="nyx-stat admin-kpi"><div><span class="nyx-stat-label">${label}</span>${icon(glyph!)}</div><strong class="nyx-stat-value">${value}</strong><footer><span>${note}</span></footer></article>`).join('')}</div>`;
}
function revenuePanel(): string { return `<section class="nyx-panel admin-panel">${sectionHead('Revenue overview', 'Paid orders · USD', `<label class="admin-inline-label">Period <select class="nyx-select" id="period"><option value="6" ${period === '6' ? 'selected' : ''}>Last 6 months</option><option value="3" ${period === '3' ? 'selected' : ''}>Last 3 months</option></select></label>`)}${chart()}<div class="admin-chart-note"><span><i></i> Revenue</span><span>September follows your demo orders</span></div></section>`; }
function paymentRing(): string {
  const percent = Math.round(state.orders.filter(o => o.status === 'Paid').length / (state.orders.length || 1) * 100);
  return `<div class="nyx-progress-radial admin-ring" role="progressbar" aria-label="Paid orders" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}" style="--nyx-progress-value:${percent}"><svg viewBox="0 0 112 112" aria-hidden="true"><circle class="nyx-progress-ring-track" cx="56" cy="56" r="48"/><circle class="nyx-progress-ring-value" cx="56" cy="56" r="48" pathLength="100" transform="rotate(-90 56 56)"/></svg><span><strong>${percent}%</strong><small>Paid orders</small></span></div>`;
}
function overview(): string {
  return `${kpis()}<div class="admin-columns">${revenuePanel()}<section class="nyx-panel admin-panel">${sectionHead('Order health', 'Payment status at a glance')}${paymentRing()}<div class="admin-legend">${['Paid', 'Pending', 'Refunded'].map(s => `<div>${badge(s)}<strong>${state.orders.filter(o => o.status === s).length}</strong></div>`).join('')}</div></section></div>
    <div class="admin-columns"><section class="nyx-panel admin-panel">${sectionHead('Recent orders', 'Your latest customer transactions', '<a class="nyx-link admin-text-link" href="#orders">View all orders →</a>')}${orderTable(state.orders.slice(0, 5), false)}</section><section class="nyx-panel admin-panel admin-campaign">${imageSlot('campaign')}<div><span class="nyx-eyebrow">UP NEXT / SEPTEMBER 28</span><h2 class="nyx-panel-title">Make room for what’s next.</h2><p>Your autumn collection is taking shape. Bring the team, products, and launch plan together.</p><a href="#projects" class="nyx-link admin-text-link">Open launch projects ${icon('arrow')}</a></div></section></div>
    <div class="admin-columns equal"><section class="nyx-panel admin-panel">${sectionHead('Team activity', 'The latest across your workspace')}<div class="admin-activity">${[['Sofia Chen', 'Updated the autumn collection', '12 minutes ago'], ['James Wilson', 'Completed checkout refresh', '48 minutes ago'], ['Maya Patel', 'Added a photography brief', '2 hours ago']].map(([name, action, time]) => `<div>${avatar(name!)}<div><strong>${name}</strong><p>${action}</p><small>${time}</small></div></div>`).join('')}</div></section><section class="nyx-panel admin-panel">${sectionHead('Upcoming schedule', 'Keep your next milestones in sight', '<a class="nyx-link admin-text-link" href="#calendar">Calendar →</a>')}<div class="admin-agenda">${[...state.events].filter(e => e.date >= '2026-09-21').sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)).slice(0, 3).map(e => `<div><span class="admin-date-tile"><small>${new Date(`${e.date}T12:00:00`).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</small>${esc(e.date.slice(-2))}</span><div><strong>${esc(e.name)}</strong><p>${esc(e.time)} · ${esc(state.settings.timezone)}</p></div></div>`).join('')}</div></section></div>`;
}
function analytics(): string { return `${kpis()}${revenuePanel()}<div class="admin-columns equal"><section class="nyx-panel admin-panel">${sectionHead('Acquisition channels', 'Illustrative session distribution')}<div class="admin-bars">${[['Organic search', 46], ['Direct', 28], ['Social', 17], ['Referral', 9]].map(([name, v]) => `<div><div><span>${name}</span><strong>${v}%</strong></div><div class="nyx-progress" role="progressbar" aria-label="${name}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${v}"><span class="nyx-progress-bar" style="--nyx-progress:${v}%"></span></div></div>`).join('')}</div></section><section class="nyx-panel admin-panel">${sectionHead('Top markets', 'Illustrative share of sessions')}<div class="admin-market-list">${[['United States', 'US', '38%'], ['Japan', 'JP', '26%'], ['Germany', 'DE', '19%'], ['United Kingdom', 'GB', '17%']].map(([country, code, v]) => `<div><span class="nyx-avatar">${code}</span><span>${country}</span><strong>${v}</strong></div>`).join('')}</div></section></div>`; }
function orderTable(items: RecordItem[], selectable: boolean): string {
  if (!items.length) return empty('No matching orders', 'Try a different search or payment status.');
  return `<div class="nyx-table-wrap admin-table-scroll"><table class="nyx-table admin-table"><thead><tr>${selectable ? '<th><span class="nyx-choice"><input type="checkbox" id="select-all" aria-label="Select visible orders" /></span></th>' : ''}<th>Order</th><th>Customer</th><th>Status</th><th class="numeric">Amount</th><th>Date</th><th><span class="nyx-visually-hidden">Actions</span></th></tr></thead><tbody>${items.map(o => `<tr>${selectable ? `<td><span class="nyx-choice"><input type="checkbox" data-select="${o.id}" ${selected.has(o.id) ? 'checked' : ''} aria-label="Select ${o.id}" /></span></td>` : ''}<td><button class="nyx-link admin-text-link" data-edit-order="${o.id}">${o.id}</button></td><td><div class="admin-person">${avatar(o.name)}<span><strong>${esc(o.name)}</strong><small>${esc(o.email)}</small></span></div></td><td>${badge(o.status)}</td><td class="numeric">${money(o.total)}</td><td class="admin-muted">${o.date.slice(5)}</td><td><button class="nyx-button nyx-icon-button admin-icon-button" data-edit-order="${o.id}" aria-label="Open ${o.id}">${icon('arrow')}</button></td></tr>`).join('')}</tbody></table></div>`;
}
function filteredOrders(): RecordItem[] { return state.orders.filter(o => (filter === 'All' || o.status === filter) && `${o.id} ${o.name} ${o.email}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === 'amount' ? b.total - a.total : sort === 'name' ? a.name.localeCompare(b.name) : b.date.localeCompare(a.date)); }
function orders(): string {
  const items = filteredOrders();
  page = Math.min(page, Math.max(1, Math.ceil(items.length / 6)));
  return `<section class="nyx-panel admin-panel"><div class="admin-toolbar"><label class="admin-filter-search">${icon('search')}<input class="nyx-input" id="table-search" type="search" placeholder="Search orders or customers" aria-label="Search orders" value="${esc(query)}" /></label><label>Status <select class="nyx-select" id="status-filter">${['All', 'Paid', 'Pending', 'Refunded'].map(s => `<option ${s === filter ? 'selected' : ''}>${s}</option>`).join('')}</select></label><label>Sort <select class="nyx-select" id="sort"><option value="newest" ${sort === 'newest' ? 'selected' : ''}>Newest</option><option value="amount" ${sort === 'amount' ? 'selected' : ''}>Amount: high to low</option><option value="name" ${sort === 'name' ? 'selected' : ''}>Customer name</option></select></label></div><div class="admin-bulk"><span id="selected-count">${selected.size} selected</span>${button('Export selected', 'export-selected', false, 'download')}</div>${orderTable(items.slice((page - 1) * 6, page * 6), true)}<div class="admin-pagination"><span>${items.length} orders · Page ${page} of ${Math.max(1, Math.ceil(items.length / 6))}</span><div><button class="nyx-button" data-action="previous" ${page === 1 ? 'disabled' : ''}>Previous</button><button class="nyx-button" data-action="next" ${page * 6 >= items.length ? 'disabled' : ''}>Next</button></div></div></section>`;
}
function customers(): string {
  const rows = [...new Map(state.orders.map(o => [o.email, o])).values()].filter(o => `${o.name} ${o.email}`.toLowerCase().includes(query.toLowerCase()));
  return `<section class="nyx-panel admin-panel"><div class="admin-toolbar"><label class="admin-filter-search">${icon('search')}<input class="nyx-input" type="search" id="table-search" aria-label="Search customers" placeholder="Search customers" value="${esc(query)}" /></label><span>${rows.length} customers</span></div>${rows.length ? `<div class="nyx-table-wrap admin-table-scroll"><table class="nyx-table admin-table"><thead><tr><th>Customer</th><th>Relationship</th><th>Orders</th><th class="numeric">Lifetime spend</th><th>Details</th></tr></thead><tbody>${rows.map(o => `<tr><td><div class="admin-person">${avatar(o.name)}<span><strong>${esc(o.name)}</strong><small>${esc(o.email)}</small></span></div></td><td>${badge('Active')}</td><td>${state.orders.filter(x => x.email === o.email).length}</td><td class="numeric">${money(state.orders.filter(x => x.email === o.email && x.status === 'Paid').reduce((s, x) => s + x.total, 0))}</td><td><button class="nyx-link admin-text-link" data-customer="${esc(o.email)}">View profile →</button></td></tr>`).join('')}</tbody></table></div>` : empty('No customers found', 'Try another name or email address.')}</section>`;
}
function products(): string { const products = state.products.filter(p => `${p.name} ${p.category}`.toLowerCase().includes(query.toLowerCase())); return `<div class="nyx-panel admin-toolbar standalone"><label class="admin-filter-search">${icon('search')}<input class="nyx-input" id="table-search" type="search" aria-label="Search products" placeholder="Search products" value="${esc(query)}" /></label><span>${products.length} products</span></div><div class="admin-product-grid">${products.map(p => `<article class="nyx-panel admin-panel admin-product">${imageSlot(p.id)}<div><div class="admin-product-meta"><small>${esc(p.category)}</small>${badge(p.stock === 0 ? 'Out of stock' : p.stock < 10 ? 'Low stock' : 'Active')}</div><h2 class="nyx-panel-title">${esc(p.name)}</h2><p>${p.stock} available</p><footer><strong>${money(p.price)}</strong><button class="nyx-button" data-edit-product="${p.id}">Edit product</button></footer></div></article>`).join('')}</div>${!products.length ? empty('No products found', 'Try a different product or category.') : ''}`; }
function projects(): string { return `<div class="admin-board">${['Planned', 'In progress', 'Review', 'Done'].map(status => `<section class="nyx-panel admin-board-column"><h2 class="nyx-panel-title">${status}<span>${state.projects.filter(p => p.status === status).length}</span></h2>${state.projects.filter(p => p.status === status).map(p => `<article class="nyx-panel admin-project"><span class="nyx-eyebrow">PROJECT / ${p.id.slice(0, 4)}</span><h3 class="nyx-panel-title">${esc(p.name)}</h3><div class="admin-progress-label"><span>Completion</span><strong>${p.progress}%</strong></div><div class="nyx-progress" role="progressbar" aria-label="${esc(p.name)} completion" aria-valuenow="${p.progress}" aria-valuemin="0" aria-valuemax="100"><span class="nyx-progress-bar" style="--nyx-progress:${p.progress}%"></span></div><div class="admin-project-owner">${avatar(p.owner)}<span>${esc(p.owner)}<small>Due ${esc(p.due)}</small></span></div><label class="nyx-field">Move to<select class="nyx-select" data-project-status="${p.id}" aria-label="${esc(p.name)} status">${['Planned', 'In progress', 'Review', 'Done'].map(s => `<option ${s === status ? 'selected' : ''}>${s}</option>`).join('')}</select></label><button class="nyx-link admin-text-link" data-edit-project="${p.id}">Edit project →</button></article>`).join('')}${!state.projects.some(p => p.status === status) ? '<p class="admin-muted">No projects in this stage.</p>' : ''}</section>`).join('')}</div>`; }
function inbox(): string { const message = state.messages.find(m => m.id === activeMessage); return `<section class="nyx-panel admin-panel admin-inbox"><div class="admin-message-list"><h2 class="nyx-panel-title">Messages <span>${state.messages.length}</span></h2>${state.messages.map(m => `<button class="nyx-item" data-message="${m.id}" aria-pressed="${m.id === activeMessage}"><div>${avatar(m.name)}<strong>${esc(m.name)}</strong>${m.unread ? '<i aria-label="Unread"></i>' : ''}</div><span>${esc(m.subject)}</span></button>`).join('')}</div><div class="admin-message-body">${message ? `<span class="nyx-eyebrow">CONVERSATION</span><h2 class="nyx-panel-title">${esc(message.subject)}</h2><div class="admin-person">${avatar(message.name)}<span><strong>${esc(message.name)}</strong><small>September 21, 2026</small></span></div><p>${esc(message.body)}</p>${message.replies.map(r => `<div class="admin-reply"><strong>You</strong><p>${esc(r)}</p><small>Saved in this demo</small></div>`).join('')}<form id="reply-form"><label class="nyx-field">Reply<textarea class="nyx-textarea" name="reply" required rows="4" placeholder="Write a reply…"></textarea></label><button class="nyx-button" data-variant="primary">Save demo reply ${icon('arrow')}</button><small>Demo only · no message is sent</small></form>` : empty('No conversation selected', 'Select a message to read and reply.')}</div></section>`; }
function calendar(): string {
  const title = new Date(calendarYear, calendarMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const start = (new Date(calendarYear, calendarMonth, 1).getDay() + 6) % 7;
  const count = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  return `<section class="nyx-panel admin-panel">${sectionHead(title, `Events shown in ${esc(state.settings.timezone)}`, `<div class="admin-row">${button('←', 'month-prev')}${button('September 2026', 'month-reset')}${button('→', 'month-next')}</div>`)}<div class="admin-calendar-scroll"><div class="admin-calendar">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => `<div class="admin-weekday">${d}</div>`).join('')}${Array.from({ length: Math.ceil((start + count) / 7) * 7 }, (_, i) => {
    const day = i - start + 1;
    const date = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return day < 1 || day > count ? '<div class="admin-day outside"></div>' : `<div class="admin-day" ${date === '2026-09-21' ? 'data-today' : ''}><button class="nyx-button nyx-icon-button" data-variant="quiet" data-size="small" data-date="${date}" aria-label="Add event on ${date}">${day}</button>${state.events.filter(e => e.date === date).map(e => `<button class="nyx-button admin-event" data-size="small" data-event="${e.id}"><small>${e.time}</small>${esc(e.name)}</button>`).join('')}</div>`;
  }).join('')}</div></div></section>`;
}
function team(): string { return `<section class="nyx-panel admin-panel">${sectionHead('People & permissions', 'Roles in this demo do not enforce server-side access.')}<div class="nyx-table-wrap admin-table-scroll"><table class="nyx-table admin-table"><thead><tr><th>Member</th><th>Role</th><th>Status</th><th>Manage access</th></tr></thead><tbody>${state.members.map(m => `<tr><td><div class="admin-person">${avatar(m.name)}<span><strong>${esc(m.name)}</strong><small>${esc(m.email)}</small></span></div></td><td>${badge(m.role)}</td><td>${badge('Active')}</td><td>${m.role === 'Owner' ? '<span class="admin-muted">Workspace owner</span>' : `<select class="nyx-select" data-role="${m.id}" aria-label="Role for ${esc(m.name)}">${['Admin', 'Member', 'Viewer'].map(r => `<option ${r === m.role ? 'selected' : ''}>${r}</option>`).join('')}</select>`}</td></tr>`).join('')}</tbody></table></div></section>`; }
function billing(): string { return `<div class="admin-columns equal"><section class="nyx-panel admin-panel admin-plan"><span class="nyx-eyebrow">CURRENT PLAN</span><h2 class="nyx-panel-title">Studio <span>Demo subscription</span></h2><p class="admin-price">$49 <small>/ month</small></p><p>Includes 10 team members, unlimited projects, and 100 GB storage.</p><div class="admin-bars"><div><div><span>Team seats</span><strong>${state.members.length} / 10</strong></div><div class="nyx-progress" role="progressbar" aria-label="Team seats" aria-valuemin="0" aria-valuemax="10" aria-valuenow="${Math.min(10, state.members.length)}"><span class="nyx-progress-bar" style="--nyx-progress:${Math.min(100, state.members.length * 10)}%"></span></div></div></div>${button('View plan details', 'plan')}</section><section class="nyx-panel admin-panel">${sectionHead('Billing details', 'Illustrative billing information')}<dl class="admin-definition"><div><dt>Business</dt><dd>${esc(state.settings.workspace)}</dd></div><div><dt>Billing email</dt><dd>${esc(state.settings.email)}</dd></div><div><dt>Payment method</dt><dd>Visa ending 4242 · sample card</dd></div><div><dt>Next invoice</dt><dd>October 1, 2026</dd></div></dl><a href="#settings" class="nyx-link admin-text-link">Update workspace details →</a></section></div><section class="nyx-panel admin-panel">${sectionHead('Invoices', 'Download sample invoices for your records')}<div class="nyx-table-wrap admin-table-scroll"><table class="nyx-table admin-table"><thead><tr><th>Invoice</th><th>Date</th><th>Status</th><th>Amount</th><th>Download</th></tr></thead><tbody>${['September', 'August', 'July'].map((m, i) => `<tr><td>INV-2026-0${9-i}</td><td>${m} 1, 2026</td><td>${badge('Paid')}</td><td>$49.00</td><td><button class="nyx-link admin-text-link" data-invoice="${m}">Download ${icon('download')}</button></td></tr>`).join('')}</tbody></table></div></section>`; }
function settings(): string { return `<div class="admin-columns"><section class="nyx-panel admin-panel"><form id="settings-form">${sectionHead('Workspace settings', 'Personalize your workspace and notification preferences.')}<div class="nyx-form-grid admin-form-grid"><label class="nyx-field">Workspace name<input class="nyx-input" name="workspace" required maxlength="60" value="${esc(state.settings.workspace)}" /></label><label class="nyx-field">Contact email<input class="nyx-input" name="email" required type="email" value="${esc(state.settings.email)}" /></label><label class="nyx-field">Timezone<select class="nyx-select" name="timezone">${['Asia/Tokyo', 'America/New_York', 'Europe/London', 'UTC'].map(t => `<option ${state.settings.timezone === t ? 'selected' : ''}>${t}</option>`).join('')}</select></label><label class="nyx-choice admin-check"><span class="nyx-choice"><input type="checkbox" name="digest" ${state.settings.digest ? 'checked' : ''} /></span> Weekly activity digest <small>Preference saved locally; email delivery is not connected.</small></label></div><div class="admin-form-footer"><button class="nyx-button" data-variant="primary">Save changes</button></div></form></section><section class="nyx-panel admin-panel">${sectionHead('Demo controls', 'Explore states safely with sample data.')}<p class="admin-muted">Changes persist in this browser. Reset restores the original records, preferences, and theme.</p>${button('Reset demo data', 'reset')}<hr class="nyx-separator"/><h3 class="nyx-panel-title">Account screens</h3><p class="admin-muted">Preview sign-in and recovery layouts.</p>${button('Preview sign in', 'signin')}</section></div>`; }
const descriptions: Record<string, string> = { overview: 'A clear view of your business. Every detail, connected.', analytics: 'Understand the numbers behind your next decision.', orders: 'Track purchases, payment status, and customer details.', customers: 'Build a complete picture of your customer relationships.', products: 'Your catalogue, inventory, and product imagery in one place.', projects: 'Keep the work moving, from the first idea to the final review.', inbox: 'Bring your team’s conversations into focus.', calendar: 'Make space for the work that matters.', team: 'The right people, with the right access.', billing: 'Your subscription, usage, and invoice history.', settings: 'Make the workspace work for you.' };
function render(): void {
  notifications();
  document.title = `${labels[route]} · Nyx Stealth Admin`;
  root.querySelector('#crumb')!.textContent = labels[route]!;
  root.querySelectorAll<HTMLElement>('[data-route]').forEach(a => { if (a.dataset.route === route) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  const create: Record<string, string> = { orders: 'Create order', products: 'Add product', projects: 'New project', calendar: 'Add event', team: 'Add member' };
  main.innerHTML = `<div class="admin-page-heading"><div><p class="nyx-eyebrow">${esc(state.settings.workspace)} <span>/</span> ${route === 'overview' ? 'MONDAY, SEPTEMBER 21, 2026' : 'WORKSPACE'}</p><h1>${route === 'overview' ? 'Workspace overview' : labels[route]}</h1><p>${descriptions[route]}</p></div><div class="admin-heading-actions">${['overview', 'analytics', 'orders', 'customers'].includes(route) ? button('Export orders', 'export', false, 'download') : ''}${create[route] ? button(create[route]!, 'create', true, 'plus') : route === 'overview' ? button('Create order', 'new-order', true, 'plus') : ''}</div></div>${({ overview, analytics, orders, customers, products, projects, inbox, calendar, team, billing, settings } as Record<string, () => string>)[route]!()}`;
  const checkAll = main.querySelector<HTMLInputElement>('#select-all');
  const checks = [...main.querySelectorAll<HTMLInputElement>('[data-select]')];
  if (checkAll) { checkAll.checked = checks.length > 0 && checks.every(c => c.checked); checkAll.indeterminate = checks.some(c => c.checked) && !checkAll.checked; }
}

function openDialog(title: string, body: string, submit?: (form: HTMLFormElement) => void): void {
  const el = root.querySelector<HTMLDialogElement>('#admin-dialog')!;
  dialog?.destroy();
  el.innerHTML = `<header class="nyx-dialog-header"><div><span class="nyx-eyebrow">NYX WORKSPACE</span><h2 class="nyx-dialog-title" id="dialog-title">${esc(title)}</h2></div><button class="nyx-button nyx-icon-button admin-icon-button" type="button" data-nyx-dialog-close aria-label="Close dialog">${icon('close')}</button></header><div class="nyx-dialog-body">${body}</div>`;
  dialog = new NyxDialog(el);
  const form = el.querySelector<HTMLFormElement>('form');
  if (form && submit) form.addEventListener('submit', event => { event.preventDefault(); if (!form.reportValidity()) return; submit(form); });
  dialog.open(document.activeElement instanceof HTMLElement ? document.activeElement : undefined);
}
const field = (name: string, label: string, value = '', type = 'text') => `<label class="nyx-field"><span class="nyx-label">${label}</span><input class="nyx-input" name="${name}" type="${type}" required value="${esc(value)}" ${type === 'number' ? 'min="0" step="0.01"' : 'maxlength="120"'} /></label>`;
const selectField = (name: string, label: string, values: string[], current = '') => `<label class="nyx-field">${label}<select class="nyx-select" name="${name}">${values.map(v => `<option ${v === current ? 'selected' : ''}>${v}</option>`).join('')}</select></label>`;
function editor(kind: string, id?: string, date = '2026-09-21'): void {
  let fields = '';
  let title = '';
  if (kind === 'orders') { const o = state.orders.find(x => x.id === id); title = o ? `Order ${o.id}` : 'Create order'; fields = field('name', 'Customer name', o?.name) + field('email', 'Customer email', o?.email, 'email') + field('total', 'Amount (USD)', String(o?.total ?? 0), 'number') + selectField('status', 'Payment status', ['Pending', 'Paid', 'Refunded'], o?.status); }
  if (kind === 'products') { const p = state.products.find(x => x.id === id); title = p ? 'Edit product' : 'Add product'; fields = field('name', 'Product name', p?.name) + field('category', 'Category', p?.category) + field('price', 'Price (USD)', String(p?.price ?? 0), 'number') + field('stock', 'Stock quantity', String(p?.stock ?? 0), 'number'); }
  if (kind === 'projects') { const p = state.projects.find(x => x.id === id); title = p ? 'Edit project' : 'New project'; fields = field('name', 'Project name', p?.name) + selectField('owner', 'Owner', state.members.map(m => m.name), p?.owner) + field('due', 'Due date', p?.due ?? date, 'date') + field('progress', 'Completion (%)', String(p?.progress ?? 0), 'number'); }
  if (kind === 'calendar') { const e = state.events.find(x => x.id === id); title = e ? 'Edit event' : 'Add event'; fields = field('name', 'Event name', e?.name) + field('date', 'Date', e?.date ?? date, 'date') + field('time', 'Time', e?.time ?? '10:00', 'time'); }
  if (kind === 'team') { title = 'Add demo member'; fields = field('name', 'Full name') + field('email', 'Email address', '', 'email') + selectField('role', 'Role', ['Member', 'Admin', 'Viewer']); }
  openDialog(title, `<form><div class="nyx-form-grid admin-form-grid">${fields}</div><p class="admin-muted">Saved to this browser only.</p><div class="admin-form-footer"><button class="nyx-button" type="button" data-nyx-dialog-close>Cancel</button><button class="nyx-button" data-variant="primary">Save ${kind === 'team' ? 'member' : 'changes'}</button></div></form>`, form => {
    const data = new FormData(form); const val = (key: string) => String(data.get(key) ?? '').trim(); const num = (key: string) => Number(val(key));
    if (kind === 'orders') { const o = state.orders.find(x => x.id === id); const values = { name: val('name'), email: val('email'), total: num('total'), status: val('status') }; if (o) Object.assign(o, values); else state.orders.unshift({ ...values, id: `NX-${Math.max(1048, ...state.orders.map(x => Number(x.id.slice(3)))) + 1}`, date: '2026-09-21' }); }
    if (kind === 'products') { const p = state.products.find(x => x.id === id); const values = { name: val('name'), category: val('category'), price: num('price'), stock: Math.floor(num('stock')) }; if (p) Object.assign(p, values); else state.products.push({ ...values, id: uid() }); }
    if (kind === 'projects') { const p = state.projects.find(x => x.id === id); const values = { name: val('name'), owner: val('owner'), due: val('due'), progress: Math.min(100, num('progress')) }; if (p) Object.assign(p, values); else state.projects.push({ ...values, id: uid(), status: 'Planned' }); }
    if (kind === 'calendar') { const e = state.events.find(x => x.id === id); const values = { name: val('name'), date: val('date'), time: val('time') }; if (e) Object.assign(e, values); else state.events.push({ ...values, id: uid() }); }
    if (kind === 'team') { if (state.members.some(m => m.email.toLowerCase() === val('email').toLowerCase())) { form.querySelector<HTMLInputElement>('[name=email]')!.setCustomValidity('This email is already a member.'); form.reportValidity(); form.querySelector<HTMLInputElement>('[name=email]')!.addEventListener('input', e => (e.target as HTMLInputElement).setCustomValidity(''), { once: true }); return; } state.members.push({ id: uid(), name: val('name'), email: val('email'), role: val('role') }); }
    dialog?.close(); persist(); render(); main.focus({ preventScroll: true }); notify('Changes saved', 'Your demo workspace is up to date.');
  });
}

function download(name: string, content: string, type = 'text/csv'): void {
  const url = URL.createObjectURL(new Blob([content], { type })); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function exportOrders(items: RecordItem[]): void {
  const cell = (v: unknown) => `"${String(v).replace(/^[=+@-]/, "'$&").replace(/"/g, '""')}"`;
  download('nyx-orders.csv', [['Order', 'Customer', 'Email', 'Status', 'Amount USD', 'Date'], ...items.map(o => [o.id, o.name, o.email, o.status, o.total, o.date])].map(r => r.map(cell).join(',')).join('\r\n'));
  notify('Report exported', `${items.length} records downloaded.`);
}
function searchDialog(): void {
  openDialog('Search workspace', `<label class="nyx-field">Search pages, orders, and products<input class="nyx-input" id="global-search" type="search" placeholder="Try orders, Sofia, or headphones" autocomplete="off" /></label><div id="search-results" class="admin-search-results"></div>`);
  const input = root.querySelector<HTMLInputElement>('#global-search')!;
  const update = () => { const q = input.value.toLowerCase(); const result = root.querySelector('#search-results')!; const entries = [...routes.map(r => ({ name: labels[r]!, route: r, sub: 'Page' })), ...state.orders.map(o => ({ name: `${o.id} · ${o.name}`, route: 'orders', sub: o.status })), ...state.products.map(p => ({ name: p.name, route: 'products', sub: p.category }))].filter(x => x.name.toLowerCase().includes(q)).slice(0, 10); result.innerHTML = entries.map(e => `<a href="#${e.route}" data-search-result><span>${esc(e.name)}</span><small>${esc(e.sub)}</small>${icon('arrow')}</a>`).join('') || '<p>No results found.</p>'; };
  input.addEventListener('input', update); update(); input.focus();
}
root.addEventListener('click', event => {
  const target = (event.target as Element).closest<HTMLElement>('button, a'); if (!target) return;
  if (target.hasAttribute('data-search-result')) dialog?.close();
  if (target.dataset.editOrder) editor('orders', target.dataset.editOrder);
  if (target.dataset.editProduct) editor('products', target.dataset.editProduct);
  if (target.dataset.editProject) editor('projects', target.dataset.editProject);
  if (target.dataset.date) editor('calendar', undefined, target.dataset.date);
  if (target.dataset.event) editor('calendar', target.dataset.event);
  if (target.dataset.customer) { const o = state.orders.find(x => x.email === target.dataset.customer)!; openDialog(o.name, `<div class="admin-person">${avatar(o.name)}<span>${esc(o.email)}</span></div><h3 class="nyx-panel-title">Order history</h3>${orderTable(state.orders.filter(x => x.email === o.email), false)}`); }
  if (target.dataset.message) { activeMessage = target.dataset.message; const m = state.messages.find(x => x.id === activeMessage)!; m.unread = false; persist(); render(); main.querySelector<HTMLElement>(`[data-message="${activeMessage}"]`)?.focus(); }
  if (target.dataset.invoice) download(`nyx-invoice-${target.dataset.invoice}.txt`, `SAMPLE INVOICE — NOT A PAYMENT REQUEST\n${state.settings.workspace}\n${target.dataset.invoice} 2026\nStudio plan\nAmount: USD 49.00\nStatus: Paid`, 'text/plain');
  switch (target.dataset.action) {
    case 'profile': location.hash = 'settings'; break;
    case 'search': searchDialog(); break;
    case 'create': editor(route); break;
    case 'new-order': editor('orders'); break;
    case 'previous': page--; render(); break;
    case 'next': page++; render(); break;
    case 'export': exportOrders(route === 'orders' ? filteredOrders() : state.orders); break;
    case 'export-selected': { const rows = state.orders.filter(o => selected.has(o.id)); if (!rows.length) notify('Select orders first', 'Use the checkboxes to choose records.', 'neutral'); else exportOrders(rows); break; }
    case 'month-prev': calendarMonth--; if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; } render(); break;
    case 'month-next': calendarMonth++; if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; } render(); break;
    case 'month-reset': calendarMonth = 8; calendarYear = 2026; render(); break;
    case 'plan': openDialog('Studio plan', '<p>10 team seats · unlimited projects · 100 GB storage.</p><p>This is a sample subscription screen. No payment provider is connected and no charges can be made.</p>'); break;
    case 'signin': openDialog('Welcome back', `<form><p>Sign in to your workspace.</p><div class="nyx-form-grid admin-form-grid">${field('email', 'Email', '', 'email')}${field('password', 'Password', '', 'password')}</div><div class="admin-form-footer"><button class="nyx-button" data-variant="primary">Preview sign in</button></div><p>Authentication preview · no credentials are sent or saved.</p></form><button class="nyx-link admin-text-link" type="button" data-action="recovery">Forgot password?</button>`, () => { dialog?.close(); notify('Sign-in preview complete', 'Connect your identity provider for real authentication.', 'neutral'); }); break;
    case 'recovery': openDialog('Reset your password', `<form>${field('email', 'Email address', '', 'email')}<div class="admin-form-footer"><button class="nyx-button" data-variant="primary">Preview recovery</button></div><p>No recovery email will be sent in this demo.</p></form>`, () => { dialog?.close(); notify('Recovery preview complete', 'Connect your identity provider to send recovery emails.', 'neutral'); }); break;
    case 'reset': openDialog('Reset demo workspace?', `<form><p>This restores the sample data and removes changes made in this browser.</p><div class="admin-form-footer"><button class="nyx-button" type="button" data-nyx-dialog-close>Keep changes</button><button class="nyx-button" data-tone="danger">Reset demo</button></div></form>`, () => { state = initialState(); selected.clear(); query = ''; filter = 'All'; page = 1; document.documentElement.dataset.nyxTheme = state.theme; (root.querySelector('#admin-theme') as HTMLSelectElement).value = state.theme; root.querySelector('[data-workspace-name]')!.textContent = state.settings.workspace; persist(); dialog?.close(); render(); main.focus(); notify('Demo restored'); }); break;
  }
});
root.addEventListener('input', event => {
  const input = event.target as HTMLInputElement;
  if (input.id === 'table-search') { const start = input.selectionStart; query = input.value; page = 1; render(); const replacement = main.querySelector<HTMLInputElement>('#table-search')!; replacement.focus(); replacement.setSelectionRange(start, start); }
});
root.addEventListener('change', event => {
  const input = event.target as HTMLInputElement;
  if (input.id === 'admin-theme') { state.theme = input.value; document.documentElement.dataset.nyxTheme = input.value; persist(); }
  if (input.id === 'period') { period = input.value; render(); main.querySelector<HTMLElement>('#period')?.focus(); }
  if (input.id === 'status-filter') { filter = input.value; page = 1; render(); main.querySelector<HTMLElement>('#status-filter')?.focus(); }
  if (input.id === 'sort') { sort = input.value; render(); main.querySelector<HTMLElement>('#sort')?.focus(); }
  if (input.dataset.select) { if (input.checked) selected.add(input.dataset.select); else selected.delete(input.dataset.select); }
  if (input.id === 'select-all') main.querySelectorAll<HTMLInputElement>('[data-select]').forEach(c => { c.checked = input.checked; if (c.checked) selected.add(c.dataset.select!); else selected.delete(c.dataset.select!); });
  if (input.id === 'select-all' || input.dataset.select) { main.querySelector('#selected-count')!.textContent = `${selected.size} selected`; const checks = [...main.querySelectorAll<HTMLInputElement>('[data-select]')]; const all = main.querySelector<HTMLInputElement>('#select-all')!; all.checked = checks.every(c => c.checked); all.indeterminate = checks.some(c => c.checked) && !all.checked; }
  if (input.dataset.projectStatus) { const p = state.projects.find(p => p.id === input.dataset.projectStatus)!; p.status = input.value; if (p.status === 'Done') p.progress = 100; persist(); render(); main.querySelector<HTMLElement>(`[data-project-status="${p.id}"]`)?.focus(); notify('Project moved', p.name); }
  if (input.dataset.role) { state.members.find(m => m.id === input.dataset.role)!.role = input.value; persist(); render(); main.querySelector<HTMLElement>(`[data-role="${input.dataset.role}"]`)?.focus(); notify('Demo role updated'); }
});
root.addEventListener('submit', event => {
  const form = event.target as HTMLFormElement;
  if (form.id === 'settings-form') { event.preventDefault(); const data = new FormData(form); state.settings = { workspace: String(data.get('workspace')).trim(), email: String(data.get('email')).trim(), timezone: String(data.get('timezone')), digest: data.has('digest') }; persist(); root.querySelector('[data-workspace-name]')!.textContent = state.settings.workspace; notify('Workspace settings saved'); }
  if (form.id === 'reply-form') { event.preventDefault(); const text = String(new FormData(form).get('reply')).trim(); if (!text) return; state.messages.find(m => m.id === activeMessage)!.replies.push(text); persist(); render(); main.querySelector<HTMLTextAreaElement>('textarea')?.focus(); notify('Demo reply saved', 'No message was sent outside this browser.'); }
});
function navigate(): void { const hash = location.hash.slice(1).split('?')[0]!; route = routes.includes(hash) ? hash : 'overview'; query = ''; filter = 'All'; page = 1; selected.clear(); if (sidebar.mode === 'mobile' && sidebar.open) sidebar.dialog.close(); render(); window.scrollTo(0, 0); }
window.addEventListener('hashchange', () => { navigate(); main.focus({ preventScroll: true }); });
document.addEventListener('keydown', event => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); searchDialog(); } });
navigate();
