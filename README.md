# ale-the-hit-maker.github.io

My personal site. GitHub Pages builds it automatically with Jekyll, so there is nothing to install.

## How to update it

You never need to touch the HTML. Everything lives in a few text files:

| What | File |
|---|---|
| Name, email, LinkedIn link | `_config.yml` |
| Works (projects, own and team) | `_data/works.yml` |
| Visual work: renders, posters, drawings | `_data/sketchbook.yml` |
| Experience and education | `_data/timeline.yml` |

To add a work, copy an existing block in `_data/works.yml`, change the text and commit. The site updates in a minute or two.

Each work gets a generative cover drawn in the browser (`cover: co2`, `voxels`, `federated`, `density`, `hold`, or `air` as default). To use a real picture instead, put it in `assets/img/` and add `image:` and `image_alt:` to the work.

The Sketchbook section stays hidden until `_data/sketchbook.yml` has at least one image.

Keep the indentation exactly as in the other blocks: YAML breaks if the spaces are off.

## The look

- `assets/concrete.jpg` is the wall texture, a seamless tile. The form-tie holes and panel joints are drawn in CSS on top of it, in `assets/style.css`.
- The blue line is the thread: it starts at the name, passes through every yellow pin in reading order and ends circling the email. Any element with `data-thread` becomes a pin it passes through, so new sections join the path on their own.

## Files

- `index.html` page structure
- `assets/style.css` look and layout
- `assets/site.js` the wind effect on the name and the generative covers
