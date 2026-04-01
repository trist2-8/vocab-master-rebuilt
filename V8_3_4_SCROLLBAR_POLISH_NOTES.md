# v8.3.4 scrollbar polish fix

This build focuses on the main page scrollbar.

## Changed
- removed the forced `scrollbar-gutter: stable both-edges` behavior on the root page
- removed forced `overflow-y: scroll` on `body`
- switched the viewport scrollbar to a slimmer web-style track and thumb
- made the scrollbar sit flush to the page edge instead of looking inset/thick
- kept the liquid-glass page styling intact

## Files touched
- `style.css`
