# Nyx Stealth admin template

Open `/admin/` on the documentation server. This is a separate application entry with its own layout and stylesheet; it uses Nyx Core tokens and components plus the Nyx dialog and toast controllers.

## Included demo workflows

Overview and analytics; searchable, sortable, paginated orders with selection and CSV export; customer profiles; product editing; project stages; local inbox replies; calendar events; team roles; billing and sample invoice downloads; settings; sign-in and recovery previews; global workspace search; four accent themes; responsive navigation.

State is seeded from `data.ts` and saved under `nyx-admin-demo-v1` in localStorage. Reset it from Settings. Authentication, authorization, payments, email, and server persistence are integration points, not connected services. Chart history and acquisition data are illustrative; September revenue and the headline metrics use the current demo orders. The demo date is September 21, 2026.

## Add your images

`imageSlots` in `data.ts` is the single image map. An empty `src` renders an explicit placeholder, never a broken image. Supply a local asset URL and descriptive alternative text:

| Slot | Use | Suggested size |
| --- | --- | --- |
| `campaign` | Overview campaign | 1600 × 900, 16:9 |
| `prod-1` through `prod-6` | Product photography | 1200 × 900, 4:3 |
| `avatar-0` through `avatar-11` | Customer/team portraits | 256 × 256, 1:1 |

Images can be placed under `registry/assets/admin/`, which Vite serves as public assets. Use the deployment's base path when setting `src`. `alt` should describe the supplied image, not the placeholder.

## Adoption

The standalone entry is `apps/docs/admin/index.html`. Copy the `admin` source directory and supply Nyx Core and Nyx Plugins in your Vite application. Load Inter for body copy and JetBrains Mono for compact labels, or replace them with your licensed brand fonts. Replace fixture reads and local mutations with your API before production use. Enforce permissions and validate records on the server. Images and branding can be replaced without changing the application layout.

## Design references

The feature plan was informed by [Tabler](https://github.com/tabler/tabler), its [live preview](https://preview.tabler.io/), [shadcn's dashboard block](https://ui.shadcn.com/blocks), and [TailAdmin's free repository](https://github.com/TailAdmin/free-react-tailwind-admin-dashboard). The Nyx implementation uses its own markup, styling, and behavior; no source or artwork was copied from these templates.
