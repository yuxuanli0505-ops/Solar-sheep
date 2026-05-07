# Solar Sheep Impact Lab

An interactive local web prototype for visualizing how solar panels, sheep grazing, grass growth, clean energy, carbon reduction, and human demand interact in a desert-to-oasis solar grazing system.

## How to Open

Open `index.html` in a browser.

For the most reliable preview, run a simple local static server inside this folder:

```bash
python3 -m http.server 4173
```

Then open:

```text
http://localhost:4173
```

This project has no backend server and no database. The page is built with HTML, CSS, JavaScript, and Canvas.

## Current Features

- Adjustable components for humans, solar panels, clean energy demand, cleaning frequency, sheep, grass growth, and data transparency.
- Real-time desert-to-oasis visual scene drawn with Canvas.
- Dynamic vegetation, sheep, solar panel, and human settlement visuals.
- Impact Score model combining ecology, clean energy, grazing balance, resource efficiency, and transparency.
- Live metric cards for clean energy, avoided CO2, vegetation, grazing balance, dust loss, and confidence.
- 12-month ecosystem trend chart.
- Current-month bar chart for energy, carbon, grazing, and human fit.

## Research Prototype Logic

The simulator uses simplified formulas for a first research prototype:

- More solar panels increase clean energy and avoided CO2.
- More frequent cleaning reduces dust loss and improves energy output.
- Solar panel shade can slightly improve grass recovery.
- Too many sheep reduce vegetation through grazing pressure.
- Grass growth increases sheep carrying capacity.
- Human demand creates pressure on energy and food support.
- Transparency contributes to confidence and impact scoring.

These assumptions should be documented clearly in the final research paper and later replaced or calibrated with public data such as NDVI, weather, and solar generation estimates.

## Suggested Next Steps

1. Replace placeholder assumptions with cited values from public data sources.
2. Add a methodology page explaining the formulas.
3. Add scenario buttons: Balanced, Overgrazing, Energy Expansion, Low Cleaning.
4. Add exportable charts for the research paper.
5. Publish the static site through GitHub Pages.
