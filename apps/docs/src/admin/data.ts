export interface RecordItem { id: string; name: string; email: string; status: string; total: number; date: string; }
export interface Project { id: string; name: string; owner: string; status: string; progress: number; due: string; }
export interface EventItem { id: string; name: string; date: string; time: string; }
export interface Member { id: string; name: string; email: string; role: string; }
export interface Message { id: string; name: string; subject: string; body: string; unread: boolean; replies: string[]; }
export interface Product { id: string; name: string; category: string; price: number; stock: number; }
export interface AdminState {
  orders: RecordItem[]; projects: Project[]; events: EventItem[]; members: Member[]; messages: Message[]; products: Product[];
  settings: { workspace: string; email: string; timezone: string; digest: boolean; }; theme: string;
}
export const names = ['Alex Morgan', 'Sofia Chen', 'James Wilson', 'Maya Patel', 'Noah Williams', 'Emma Garcia', 'Oliver Kim', 'Amelia Davis', 'Leo Martin', 'Isla Thompson', 'Ethan Brooks', 'Aria Nakamura'];
export function initialState(): AdminState {
  return {
    orders: names.map((name, i) => ({ id: `NX-${1048 - i}`, name, email: `${name.toLowerCase().replace(' ', '.')}@example.com`, status: ['Paid', 'Paid', 'Pending', 'Paid', 'Refunded'][i % 5]!, total: [249, 129, 389, 79, 179, 549, 219, 99, 329, 149, 69, 459][i]!, date: `2026-09-${String(21 - i % 7).padStart(2, '0')}` })),
    projects: [
      { id: 'p1', name: 'Autumn collection', owner: 'Sofia Chen', status: 'In progress', progress: 72, due: '2026-09-28' },
      { id: 'p2', name: 'Customer portal', owner: 'Alex Morgan', status: 'Review', progress: 90, due: '2026-09-25' },
      { id: 'p3', name: 'Brand photography', owner: 'Maya Patel', status: 'Planned', progress: 18, due: '2026-10-02' },
      { id: 'p4', name: 'Checkout refresh', owner: 'James Wilson', status: 'Done', progress: 100, due: '2026-09-20' },
    ],
    products: [
      { id: 'prod-1', name: 'Studio headphones', category: 'Audio', price: 249, stock: 42 },
      { id: 'prod-2', name: 'Desk light', category: 'Workspace', price: 129, stock: 18 },
      { id: 'prod-3', name: 'Everyday backpack', category: 'Lifestyle', price: 179, stock: 7 },
      { id: 'prod-4', name: 'Mechanical keyboard', category: 'Workspace', price: 189, stock: 34 },
      { id: 'prod-5', name: 'Portable speaker', category: 'Audio', price: 99, stock: 0 },
      { id: 'prod-6', name: 'Travel notebook', category: 'Lifestyle', price: 29, stock: 120 },
    ],
    events: [{ id: 'ev-1', name: 'Collection review', date: '2026-09-23', time: '10:00' }, { id: 'ev-2', name: 'Design sync', date: '2026-09-25', time: '14:30' }, { id: 'ev-3', name: 'Autumn launch', date: '2026-09-28', time: '09:00' }],
    members: names.slice(0, 5).map((name, i) => ({ id: `m${i}`, name, email: `${name.toLowerCase().replace(' ', '.')}@example.com`, role: i === 0 ? 'Owner' : i === 1 ? 'Admin' : 'Member' })),
    messages: [
      { id: 'msg1', name: 'Sofia Chen', subject: 'Autumn collection is ready for review', body: 'The new collection is ready. Please review the product details and confirm the launch date with the team.', unread: true, replies: [] },
      { id: 'msg2', name: 'James Wilson', subject: 'Order NX-1046 · delivery update', body: 'Could you confirm the shipping details for this order? The customer has asked for an update before Friday.', unread: true, replies: [] },
      { id: 'msg3', name: 'Maya Patel', subject: 'Photography brief', body: 'The shot list covers the six hero products. We are waiting on the final images before publishing.', unread: false, replies: [] },
    ],
    settings: { workspace: 'Northstar Studio', email: 'hello@example.com', timezone: 'Asia/Tokyo', digest: true }, theme: 'signal',
  };
}
