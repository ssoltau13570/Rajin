# Rajin: Edge of Darkness website

The website for Rajin: Edge of Darkness, a sci-fi fantasy graphic novel series by Susan.

## What each file does

- **index.html, characters.html, art.html, ship.html, timelapses.html, story.html, then-and-now.html, updates.html**: the eight pages. Each one holds its own page title and search description at the top.
- **content.js**: all the words, pictures, and videos. This is the file you edit most.
- **style.css**: colors, fonts, and layout. The main colors sit at the very top.
- **site.js**: builds the galleries, lightbox, timelapse player, sliders, and the Tumblr feed. You shouldn't need to touch it.
- **assets folder**: every picture, video, and the 3D ship model.

## How to edit content.js on GitHub

1. Open your repository on github.com and tap **content.js**.
2. Tap the **pencil icon** (Edit this file).
3. Make your change, then tap **Commit changes** and confirm.
4. Your site updates within a minute or two.

A few rules so nothing breaks:

- Keep the quote marks around words and file names.
- Keep the commas between items. Every item in a list ends with a comma except the last one.
- If the site goes blank after an edit, a missing comma or quote mark is the usual culprit. GitHub keeps every old version, so you can always undo.

### Examples

**Change a fun fact.** Find the character, then edit the sentence inside the quote marks under `"facts"`.

**Add a concept art piece.**

1. Upload the picture into the **assets** folder (for example, `art-43.webp`).
2. In content.js, find `"art": [` and add a new line inside the list:

```
{ "image": "art-43.webp" },
```

Add `"big": true` to make a piece show larger:

```
{ "image": "art-43.webp", "big": true },
```

**Reorder the concept art.** Move a line up or down in the `"art"` list. The top of the list shows first.

**Add a timelapse.** Upload the video and a square thumbnail into **assets**, then add a line to the `"timelapses"` list:

```
{ "title": "Jessie", "video": "timelapse-jessie.mp4", "thumb": "timelapse-jessie-thumb.webp" },
```

The first timelapse in the list plays first.

## Tumblr updates

The Home and Updates pages pull your newest public posts from rajinedgeofdarkness.tumblr.com automatically, with no password or login. If you ever change your Tumblr name, change `"tumblr"` near the top of content.js to the new name. If Tumblr is ever unreachable, the pages show a link to the blog instead.

## Still to check

- **Ship evolution years** on the Then & Now page: 2016, 2019, 2021, and 2024 are placeholders for the four middle designs. Edit the `"year"` values under `"ship"` in the `"evolution"` section of content.js.

## Credits

All artwork and writing by Susan. Website built with an AI coding assistant, with free textures from Magnific (formerly Freepik) and water animations by PIXEL80R and PI-SLICES. The 3D viewer uses Google's free model-viewer component.
