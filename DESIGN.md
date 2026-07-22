# Streetwear Blantyre — Design System

## 1. Brand Identity

**Brand:** Streetwear Blantyre — Premium streetwear for the culture.
**Domain:** wearsb.com
**Feel:** Editorial luxury meets street culture. Think COS meets Off-White — clean, minimal, confident. Not a tech startup. Not a SaaS product. A fashion brand.

## 2. Color Palette

### Primary Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `--color-black` | `#0a0a0a` | Primary text, headings, dark backgrounds |
| `--color-white` | `#ffffff` | Backgrounds, cards, light text on dark |
| `--color-off-white` | `#fafafa` | Subtle background variations |
| `--color-gray-50` | `#f9f9f9` | Card backgrounds, subtle sections |
| `--color-gray-100` | `#f3f3f3` | Borders, dividers |
| `--color-gray-200` | `#e5e5e5` | Borders, hover states |
| `--color-gray-400` | `#a3a3a3` | Secondary text, placeholders |
| `--color-gray-600` | `#525252` | Body text |
| `--color-gray-900` | `#171717` | Dark backgrounds |

### Accent (use sparingly — max 10% of any surface)
| Token | Hex | Usage |
|-------|-----|-------|
| `--color-accent` | `#2563eb` | Links, active states, minimal accents only |

### Rules
- **NO gradients** on buttons, cards, or backgrounds. Flat, clean surfaces only.
- **NO colored shadows.** Shadows use `rgba(0,0,0,0.08)` maximum.
- **Black and white dominate.** Any color accent must be ≤10% of surface area.

## 3. Typography

### Font Stack
| Role | Font | Weight | Fallback |
|------|------|--------|----------|
| Headings (h1-h6) | `Cormorant Garamond` | 600, 700 | `Georgia, serif` |
| Body / UI | `DM Sans` | 400, 500, 600 | `system-ui, sans-serif` |
| Monospace (prices, codes) | `JetBrains Mono` | 400 | `monospace` |

### Type Scale
| Element | Size | Weight | Line Height | Letter Spacing |
|---------|------|--------|-------------|----------------|
| Display (hero) | 4rem / 64px | 700 | 1.05 | -0.03em |
| H1 | 2.5rem / 40px | 700 | 1.1 | -0.02em |
| H2 | 2rem / 32px | 600 | 1.2 | -0.015em |
| H3 | 1.5rem / 24px | 600 | 1.3 | -0.01em |
| Body Large | 1.125rem / 18px | 400 | 1.6 | 0 |
| Body | 1rem / 16px | 400 | 1.6 | 0 |
| Caption | 0.875rem / 14px | 500 | 1.4 | 0.02em |
| Overline | 0.75rem / 12px | 600 | 1.2 | 0.1em |

### Rules
- **Headings:** Cormorant Garamond serif. Bold, tight letter-spacing (-0.02em to -0.03em). No all-caps except overlines.
- **Body:** DM Sans. Clean, readable, 1.6 line-height.
- **No gradient text.** Solid colors only.
- **No text shadows.** Clean typography.

## 4. Spacing & Layout

### Spacing Scale
| Token | Value |
|-------|-------|
| `--space-xs` | `0.25rem` (4px) |
| `--space-sm` | `0.5rem` (8px) |
| `--space-md` | `1rem` (16px) |
| `--space-lg` | `1.5rem` (24px) |
| `--space-xl` | `2rem` (32px) |
| `--space-2xl` | `3rem` (48px) |
| `--space-3xl` | `4rem` (64px) |
| `--space-4xl` | `6rem` (96px) |
| `--space-5xl` | `8rem` (128px) |

### Layout
- **Container max-width:** 1280px
- **Section padding:** `py-24` minimum (96px). Let it breathe.
- **Grid gap:** `gap-6` (24px) minimum between cards.
- **Asymmetry:** Break symmetry with offset margins, mixed aspect ratios.
- **Whitespace:** Aggressive. Double current padding everywhere.

### Rules
- **No edge-to-edge content.** Everything inside the container.
- **Generous vertical rhythm.** Sections feel spacious, not cramped.
- **Mobile:** Single column, `px-6`, `py-16` minimum.

## 5. Components

### Buttons
- **Primary:** Black background, white text, `rounded-none` (sharp edges), `px-8 py-3`, hover: `bg-gray-800`
- **Secondary:** White background, black border, black text, hover: `bg-gray-50`
- **Text:** No background/border, underline on hover
- **NO rounded-full buttons.** Sharp, clean edges.
- **NO gradient buttons.** Flat, solid colors.
- **NO icon buttons unless functional** (search, cart, menu).

### Cards
- **No borders.** Background color only.
- **No box-shadow.** Clean separation through spacing.
- **Hover:** Subtle opacity change (`opacity-95`), no transform/shadow.
- **Product cards:** Image + name + price. Minimal text. No badges unless functional.

### Navigation
- **Text-based links.** No icons next to nav items.
- **Minimal actions:** Logo left, nav center, cart/user right.
- **No promo banner.** Clean, minimal header.
- **Mobile:** Hamburger menu, full-screen overlay.

### Footer
- **No icons.** Text links only.
- **Minimal trust badges.** One line of text, not icon+text blocks.
- **Clean columns:** Logo + tagline, Shop, Support, Legal.
- **No newsletter CTA with blue background.** Subtle, text-based.

## 6. Animation & Motion

### Rules
- **Minimal animations.** Only scroll-reveal (`opacity-0` to `opacity-100`, `translate-y-4` to `translate-y-0`).
- **No bounce, pulse, glow, or shimmer.** These are SaaS startup patterns.
- **No Framer Motion on every element.** One subtle fade-in per section maximum.
- **Duration:** 300ms-500ms, `ease-out` only.
- **Hover transitions:** 200ms, `opacity` or `color` only.

## 7. Iconography

### Rules
- **Reduce icon count by 80%.** Most sections need zero icons.
- **When icons are needed:** Use Phosphor (light weight) or inline SVG.
- **NO lucide-react icons in navigation, trust badges, or feature sections.**
- **Icons only for functional elements:** Search, cart, menu, close, arrow.
- **No decorative icons.** Every icon must serve a UI function.

## 8. Anti-Patterns (BANNED)

- Blue gradient buttons or backgrounds
- Rounded-full buttons (except mobile menu toggle)
- Box shadows on cards
- Gradient text
- Icon + text trust badge blocks
- Framer Motion on every section
- Pulse, glow, bounce, or shimmer animations
- "Premium" badges or labels
- Blue-50, blue-100, blue-500 accent colors in UI
- `rounded-2xl` or `rounded-3xl` on everything
