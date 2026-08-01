# Images

There are twelve image files in the whole project and none of them is a
placeholder. Two are photographs, ten are drawn by the scripts in
`scripts/art/` and can be regenerated at any time.

## What ships

| Path | What it is | Where it comes from |
|---|---|---|
| `media/portrait.jpg` | Tobias Börner, 4:5 | Photograph, cropped by hand |
| `media/people/tobias-boerner.jpg` | Same photograph, 4:5, smaller | As above |
| `media/companies/*.jpg` | Seven company graphics, 16:9 | `scripts/art/companies.py` |
| `media/articles/*.jpg` | Three newsroom covers, 16:9 | `scripts/art/covers.py` |

```bash
python3 scripts/art/companies.py
python3 scripts/art/covers.py
```

Both scripts need only Pillow. They are deterministic: the same seed produces
the same image, so regenerating does not silently change the design.

## What the graphics are

Each one is drawn from what the subject actually does, so the imagery cannot
drift away from the copy.

| File | The idea |
|---|---|
| `companies/civitas-europe.jpg` | Scattered evidence resolving into linked clusters, with the one connection that matters lit |
| `companies/orcrist.jpg` | A plan position indicator: range rings, a sweep, one contact resolved and framed |
| `companies/innoshare.jpg` | One centre with the companies in orbit around it |
| `companies/fastic.jpg` | A grid of ring gauges, each a fasting window at a different point of completion |
| `companies/lovoo.jpg` | A crowd of dots and the single connected pair |
| `companies/appic.jpg` | A portfolio grid, the acquired apps filled in |
| `companies/admiral-studio.jpg` | A lattice of hexagons with a few cells lit |
| `articles/sovereign-european-ai.jpg` | Six layers of a stack, one of them shifted out of alignment |
| `articles/defence-technology-engineers.jpg` | Sensor arcs from four positions, one contact tracked through |
| `articles/public-trust-ai.jpg` | A log of records with one entry traced back to its source |

## Deliberately without images

Some places would normally hold a photograph and do not, because a stand-in
would be worse than nothing:

- **Tim Börner** has no portrait yet. The leadership block renders his initials
  on a plain tile instead. Drop a 4:5 photograph at
  `public/media/people/tim-boerner.jpg` and set `image` in
  `content/data/people.json`, and the tile is replaced automatically.
- **Media items** show the outlet name set large on a plain panel rather than a
  borrowed press photograph. That is a design decision, not a gap.
- **The home page** has no photography at all. The hero is drawn in a canvas
  from the claim itself.

## Replacing the photographs

Keep the aspect ratio and the filename and nothing in the code needs to change.
`media/portrait.jpg` wants 4:5 at 1200 by 1500 or larger. Faces read better
kept in the upper third of the frame, because the layout crops from the top on
narrow screens.

When you swap a photograph, update the alternative text where it is written:
`content/data/people.json` for portraits, the frontmatter of the article for a
cover.
