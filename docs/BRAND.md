# Innoshare brand

Four concepts, one production recommendation. All are single-path or
three-path SVGs using `currentColor`, which means one file works in every
context: light, dark, embossed, engraved, 16px, or three metres wide.

## The four concepts

| File | Name | The idea | Reads as |
|---|---|---|---|
| `concept-a-aperture.svg` | **Aperture**, *recommended* | A circle built from three equal arcs with hairline gaps | A lens, an aperture, three parties sharing one form, and the letter **o** at the centre of both *Innoshare* and *Börner* |
| `concept-b-lens.svg` | Lens | Two opposed arcs forming a vesica, split by a hairline stem | Two entities overlapping, shared value, plus an implied **I** |
| `concept-c-node.svg` | Node | Three points on a hairline triangle | Distribution, a network, a fire-team of three. The most defence-adjacent of the four. |
| `concept-d-signal.svg` | Signal | Three ascending bars of decreasing width | Growth, broadcast, signal strength. The most immediate at tiny sizes. |

### Why Aperture is the recommendation

It survives the tests the others partly fail:

- **16px.** Three thick arcs stay legible where a triangle of dots turns to mush.
- **Ownable.** Ascending bars are the single most crowded shape in tech identity. A gapped circle is not.
- **Non-literal.** It never says "security company" or "growth agency". It works as the mark of a holding that will own things nobody has named yet.
- **One meaning per audience.** Investors read a lens. Engineers read an aperture. Nobody reads it as a cliché.

Its one weakness is honest: as a pure outline it is quieter than a filled mark.
That is why the favicon version below is optically corrected rather than scaled.

## Production files

| File | Use |
|---|---|
| `brand/innoshare-mark.svg` | The mark. Inherits `currentColor`. |
| `favicon.svg` | 48×48, rounded ink tile, mark scaled to 82% and stroke thickened to 3.1, because outline marks thin out at favicon size, so this is corrected by hand, not scaled. |
| `brand/innoshare-square.svg` | 512×512 podcast / LinkedIn / avatar lockup with wordmark and `HOLDING` kicker. |
| `Mark` in `src/components/ui/Logo.tsx` | The inline React version used in the nav, footer and article bylines. |

## Usage rules

**Clear space.** One stroke-width of the mark on all sides. At nav size that is
roughly 3px. Enough.

**Minimum size.** 16px for the favicon variant, 20px for the outline mark.
Below 20px use the favicon variant.

**Colour.** Bone `#F2F1EE` on ink `#08090B`. Ink on bone for print. Sand
`#C8BBA6` only for the mark when it sits beside body copy as a byline device.
Never two colours inside the mark; never a gradient.

**Do not** rotate it, close the gaps, add a container ring, place it on
photography without a scrim, or set the wordmark in anything other than Inter
Medium at −0.02em.

## The system around it

| Token | Value | Role |
|---|---|---|
| Ink | `#08090B` | Canvas. Not pure black, which flattens photography. |
| Ink raised | `#0E1013` | Hover surfaces, cards |
| Bone | `#F2F1EE` | Text. Warm, so it does not glare against the ink. |
| Muted / Faint | `#8E8F96` / `#5A5C62` | Secondary and tertiary text |
| Sand | `#C8BBA6` | The single editorial accent. Eyebrows, active states, bullets. |
| Signal | `#7A9CFF` | Focus rings only. Never decorative. |

**Type.** Inter for everything structural, tracked tight (−0.035em at display
sizes). That tightness is most of the premium feel. There is no second
typeface: the serif was removed when the design was made stricter. IBM Plex
Mono, uppercase, +0.2em, for eyebrows
and years: the precision register that defence and public safety work earns.

**Motion.** One easing curve, `cubic-bezier(0.16, 1, 0.3, 1)`, everywhere.
Fade, rise 14 to 18px, scale ≤1.08, one pointer-following light source. Nothing
bounces. Everything stops under `prefers-reduced-motion`.

## Motion on the homepage

The homepage carries almost no text, so movement has to do the explaining.
Three rules keep that from becoming decoration:

**Scroll is the only timeline.** Nothing on the homepage animates on a timer.
Every transition is a function of scroll position, which means the visitor sets
the pace and can stop anywhere. Autoplaying carousels break this; we do not have any.

**One motion per idea.** The career section moves exactly one thing continuously:
the year odometer, trailed slightly behind the scroll so it feels weighted. The
image and the caption *snap* to the nearest milestone instead of smearing between
states. Continuous where it reads as physics, discrete where it reads as content.

**Everything has a still version.** Under `prefers-reduced-motion` the pinned
sections unpin, the runways collapse to their natural height, the philosophy
lines stack, and the career section becomes a plain dated list. No information
lives only in the movement, which is also why the section still works for a
crawler that never scrolls.

Numbers, for consistency: 1.1 s crossfade on imagery, 0.7 s on captions,
0.95 s on scroll reveals, 0.14 lerp factor on the odometer,
`cubic-bezier(0.16, 1, 0.3, 1)` on all of it.
