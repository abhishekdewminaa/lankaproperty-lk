# LankaProperty.lk — Design System & Visual Standards

---

## 1. Brand Color Palette (British Racing Green & Editorial Ochre)

| Token | Hex Value | Application |
| :--- | :--- | :--- |
| **Deep Forest Primary** | `#103D2C` | Brand anchor, header backgrounds, high-contrast text |
| **Racing Green Accent** | `#176B45` | Primary buttons, active state pills, verified badges, links |
| **Editorial Ochre** | `#C29958` | Luxury signature tags, curated badges, architectural accents |
| **Warm Sand Background** | `#FBFBF9` | Primary page canvas, card backgrounds |
| **Stone Border** | `#DDE5DF` | Card borders, dividers, subtle structural separation |
| **Charcoal Body Text** | `#18251E` | High-contrast readable typography |
| **Muted Slate Text** | `#5F6B63` | Metadata labels, specs, secondary descriptions |

---

## 2. Typography Hierarchy

* **Serif Headings**: `Playfair Display`, `Cormorant Garamond`, or serif fallback — reserved for hero titles, architectural stories, and property titles.
* **Sans-Serif UI**: `Plus Jakarta Sans`, `Inter`, or system sans — used for navigational controls, data facets, price displays, specs grids, and forms.
* **Strict Rule**: No emojis anywhere in the UI. Use clean SVG icons from `lucide-react`.

---

## 3. Motion & Responsive Principles

* **Reduced Motion**: Respect `prefers-reduced-motion: reduce` across all animations and transitions.
* **Responsive Breakpoints**:
  * Mobile: 320px – 639px (single column, thumb-friendly sticky action bar)
  * Tablet: 640px – 1023px (2-column grid, compact filters)
  * Desktop: 1024px – 1440px+ (3-column marketplace grid, sticky sidebar dossier)
