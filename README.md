# BLOOM — Damianonyx

A monochrome particle flower landing page inspired by the supplied video reference.

## Run

Open `index.html` in a modern browser. No dependencies or build step are required.

For a local server, run `python3 -m http.server 8000` in this folder, then visit http://localhost:8000.

## Files

- `index.html`: page structure and controls
- `style.css`: desktop and mobile styles
- `bloom.js`: WebGL particles, bloom animation, and interactions
- `reference.mp4`: supplied video, used as a fallback when WebGL is unavailable

## Controls

Drag the flower to rotate. Pause or replay the animation, or use the Bloom slider to adjust its openness. Reduced-motion preferences are respected.

## Hosting

This is a static website. Upload the files at the repository root. No build command is needed. Keep the video alongside the other files for the fallback to work.

The animation is a procedural interpretation of the reference, not an exact reproduction.
