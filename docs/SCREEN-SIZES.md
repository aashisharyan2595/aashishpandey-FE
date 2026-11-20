# Screen sizes we design and test for

Source: StatCounter Global Stats, screen resolution by device, worldwide and India, October 2025 (latest monthly export at time of writing; the raw table is polluted by bot and "800x600" noise, so this list is built from the stable top entries).
https://gs.statcounter.com/screen-resolution-stats/desktop-mobile-tablet/worldwide and `/india`

What the data shows (CSS pixels, share of that device class):
- Phones, worldwide: 360x800 (10%), 390x844, 414x896, 375x812, 393x873, 384x832, 412x915. India: 360x800 alone is ~19%, then 393x873, 360x804, 385x854, 432x960.
- Tablets, worldwide: 768x1024 (14%), 810x1080, 820x1180, 800x1280, 1280x800, 1024x1366. India: 601x1007 (~28%), 820x1180, 800x1280.
- Desktop and laptop: 1920x1080 (largest), 1536x864 (Windows laptops at 125% scaling), 1366x768 (the biggest laptop size in India), 1440x900, 1280x720, 1600x900, 2560x1440, 3840x2160 (shows as 1920 wide or 2560 wide once OS scaling is applied).

## Test list (viewport width x height)
Phone: 360x800, 390x844, 412x915. Tablet: 768x1024, 820x1180, 1024x768. Laptop and desktop: 1280x720, 1366x768, 1536x864, 1920x1080. Large: 2560x1440. Ultrawide: 3440x1440.
These cover well over 95% of real visits. Anything in between (601 to 1000 wide) is handled by the same fluid rules, not extra breakpoints.

## How width works
`--ap-max` in `assets/nav.css` is the one page-width token: `clamp(1200px, 84vw, 2400px)`. Up to about 1430px wide screens it stays at the long-standing 1200px, above that it holds a steady 84% of the viewport, capped at 2400px on ultrawide. Header, footer, the closing contact panel, blog wrapper, `.nr-wrap` (`--nr-max`), tool pages and page sections all read it. Reading text keeps its own measure (`ch` or a fixed column) so lines never get too long; grids, cards and media take the extra room.
The 3D home page (`Portfolio.dc.html`) is deliberately left alone, except for one gate in its head: phones (touch screen, short side under 600px) get the small canvas game `assets/js/play-m.js` (Night Ride Dash) and never download the 3D world; tablets, laptops and desktops get the 3D ride and never download the game. `/?ride=1` opts a phone into the 3D ride for the session.
