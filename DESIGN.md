# Hall of Legends design system

## World

The interface is a celestial sanctuary suspended between worlds: monumental ivory architecture, antique gold light, dark marble, deep blue sky, mist, dust, and quiet inscription-like typography.

## Composition

The experience opens on one grand tableau. A full-bleed sanctuary image carries the architecture while transparent character layers stand in staggered depth. The top edge holds a restrained identity lockup; the lower edge holds guidance and motion controls. Selection opens a glass-darkened quote panel that belongs to the architecture rather than a conventional card grid.

## Materials and color

- Night: `#071016` and `#0b1b26` for sky, shadow, and reading depth.
- Ivory: `#f2e7ce` for primary type and carved light.
- Antique gold: `#e5bb64` and `#f1d88f` for the sacred axis, rules, focus, and wayfinding.
- Character aura colors are muted and used as light, not as badges.

## Type

Display uses Cormorant Garamond with a restrained italic for epithets and quotations. Manrope handles labels, status text, buttons, and metadata. Small uppercase labels are tracked and sparse.

## Motion

The entrance is a single slow reveal: image scale settles, the legends rise, and the guide arrives last. Pointer movement produces bounded 2.5D parallax. Character selection dims the hall, elevates the selected figure, and slides in the quote panel. `prefers-reduced-motion` and the visible motion toggle collapse movement to short fades.

## Interaction grammar

Legends are buttons in the scene, with visible focus rings, hover labels, `aria-pressed` state, keyboard shortcuts 1–4, Escape dismissal, and focus restoration. Quote text remains selectable HTML content and includes a source link.
