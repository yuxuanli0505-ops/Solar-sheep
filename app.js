const controlsConfig = [
  {
    key: "humans",
    label: "Humans Supported",
    min: 500,
    max: 50000,
    step: 500,
    value: 12000,
    unit: "people"
  },
  {
    key: "panels",
    label: "Solar Panels",
    min: 1000,
    max: 120000,
    step: 1000,
    value: 38000,
    unit: "panels"
  },
  {
    key: "energyDemand",
    label: "Clean Energy Demand",
    min: 100,
    max: 9000,
    step: 100,
    value: 2900,
    unit: "MWh/month"
  },
  {
    key: "cleaning",
    label: "Panel Cleaning",
    min: 0,
    max: 8,
    step: 1,
    value: 3,
    unit: "times/month"
  },
  {
    key: "sheep",
    label: "Sheep",
    min: 100,
    max: 30000,
    step: 100,
    value: 8400,
    unit: "sheep"
  },
  {
    key: "grassGrowth",
    label: "Grass Growth Speed",
    min: 10,
    max: 100,
    step: 1,
    value: 58,
    unit: "%"
  },
  {
    key: "transparency",
    label: "Data Transparency",
    min: 0,
    max: 100,
    step: 5,
    value: 65,
    unit: "%"
  }
];

const state = Object.fromEntries(controlsConfig.map((control) => [control.key, control.value]));
const controlsEl = document.querySelector("#controls");
const ecosystemCanvas = document.querySelector("#ecosystemCanvas");
const trendCanvas = document.querySelector("#trendCanvas");
const barCanvas = document.querySelector("#barCanvas");
const ecoCtx = ecosystemCanvas.getContext("2d");
const trendCtx = trendCanvas.getContext("2d");
const barCtx = barCanvas.getContext("2d");

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function sigmoid(value) {
  return 1 / (1 + Math.exp(-value));
}

function formatNumber(value, digits = 0) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  }).format(value);
}

function makeControls() {
  controlsEl.innerHTML = "";

  controlsConfig.forEach((control) => {
    const wrapper = document.createElement("div");
    wrapper.className = "control";
    wrapper.innerHTML = `
      <div class="control-top">
        <label for="${control.key}">${control.label}</label>
        <output id="${control.key}Output">${formatControlValue(control, control.value)}</output>
      </div>
      <input id="${control.key}" type="range" min="${control.min}" max="${control.max}" step="${control.step}" value="${control.value}">
      <div class="range-row">
        <span>${formatControlValue(control, control.min)}</span>
        <span>${formatControlValue(control, control.max)}</span>
      </div>
    `;

    controlsEl.appendChild(wrapper);

    wrapper.querySelector("input").addEventListener("input", (event) => {
      state[control.key] = Number(event.target.value);
      wrapper.querySelector("output").textContent = formatControlValue(control, state[control.key]);
      update();
    });
  });
}

function formatControlValue(control, value) {
  const number = control.key === "grassGrowth" || control.key === "transparency"
    ? `${value}`
    : formatNumber(value);

  return `${number} ${control.unit}`;
}

function calculateModel() {
  const panelEnergyMwh = 0.08;
  const dustLoss = clamp(0.25 - state.cleaning * 0.035, 0.03, 0.25);
  const cleaningEfficiency = 1 - dustLoss;
  const monthlyEnergy = state.panels * panelEnergyMwh * cleaningEfficiency;
  const co2Avoided = monthlyEnergy * 0.58;
  const shadeBoost = clamp(state.panels / 90000, 0, 1) * 18;
  const cleaningStress = Math.max(0, state.cleaning - 5) * 4;
  const grazingPressure = state.sheep / 185;
  const vegetation = clamp(18 + state.grassGrowth * 0.72 + shadeBoost - grazingPressure - cleaningStress, 2, 96);
  const sheepCapacity = vegetation * 185;
  const sheepBalance = clamp(1 - Math.abs(state.sheep - sheepCapacity) / Math.max(sheepCapacity, 1), 0, 1);
  const peopleEnergySupported = monthlyEnergy / 0.22;
  const foodSupported = state.sheep * 1.38;
  const humanEnergyFit = clamp(peopleEnergySupported / state.humans, 0, 1.25);
  const foodFit = clamp(foodSupported / state.humans, 0, 1.25);

  const ecologicalScore = 35 * clamp(vegetation / 75, 0, 1);
  const cleanEnergyScore = 30 * clamp(monthlyEnergy / state.energyDemand, 0, 1);
  const grazingScore = 18 * sheepBalance * clamp(foodFit, 0, 1);
  const resourceScore = 10 * clamp(1 - Math.abs(state.cleaning - 3) / 5, 0, 1);
  const transparencyScore = 7 * (state.transparency / 100);
  const impactScore = clamp(ecologicalScore + cleanEnergyScore + grazingScore + resourceScore + transparencyScore, 0, 100);
  const confidenceScore = clamp(38 + state.transparency * 0.42 + (state.cleaning > 0 ? 7 : 0), 0, 100);

  let systemState = "Balanced";
  if (vegetation < 28 || sheepBalance < 0.48 || humanEnergyFit < 0.7) {
    systemState = "Stressed";
  }
  if (vegetation > 62 && sheepBalance > 0.7 && humanEnergyFit >= 0.95) {
    systemState = "Regenerating";
  }

  return {
    monthlyEnergy,
    co2Avoided,
    vegetation,
    sheepCapacity,
    sheepBalance,
    peopleEnergySupported,
    foodSupported,
    humanEnergyFit,
    foodFit,
    impactScore,
    confidenceScore,
    systemState,
    dustLoss
  };
}

function simulateTrend(model) {
  const months = [];
  let vegetation = clamp(model.vegetation * 0.76, 4, 84);
  let sheep = state.sheep;

  for (let index = 0; index < 12; index += 1) {
    const shade = clamp(state.panels / 100000, 0, 1) * 2.1;
    const growth = (state.grassGrowth / 100) * 5.2 + shade;
    const consumption = sheep / 7800;
    const cleaningDrag = Math.max(0, state.cleaning - 5) * 0.55;
    vegetation = clamp(vegetation + growth - consumption - cleaningDrag, 2, 96);
    const capacity = vegetation * 185;
    sheep += (capacity - sheep) * 0.055;

    months.push({
      month: `M${index + 1}`,
      vegetation,
      sheep,
      energy: model.monthlyEnergy * (0.92 + index * 0.006)
    });
  }

  return months;
}

function getBarData(model) {
  return [
    ["Energy", clamp(model.monthlyEnergy / state.energyDemand, 0, 1.35), "#157a8c"],
    ["CO2", clamp(model.co2Avoided / 2200, 0, 1.35), "#2e7d5b"],
    ["Grazing", clamp(model.sheepBalance, 0, 1.35), "#bd7b2f"],
    ["Human Fit", clamp((model.humanEnergyFit + model.foodFit) / 2, 0, 1.35), "#775d9e"]
  ];
}

function analyzeTrend(trend) {
  const first = trend[0];
  const last = trend[trend.length - 1];
  const vegetationChange = last.vegetation - first.vegetation;
  const sheepChange = last.sheep - first.sheep;
  const direction = vegetationChange >= 2
    ? "upward"
    : vegetationChange <= -2
      ? "downward"
      : "stable";

  return {
    first,
    last,
    vegetationChange,
    sheepChange,
    direction
  };
}

function buildSummary(model, trend) {
  const trendAnalysis = analyzeTrend(trend);
  const bars = getBarData(model);
  const sortedBars = [...bars].sort((a, b) => b[1] - a[1]);
  const strongestBar = sortedBars[0];
  const weakestBar = sortedBars[sortedBars.length - 1];
  const sheepGap = state.sheep - model.sheepCapacity;
  const sheepGapPercent = sheepGap / Math.max(model.sheepCapacity, 1);
  const energyGap = model.monthlyEnergy - state.energyDemand;
  const energyGapPercent = energyGap / Math.max(state.energyDemand, 1);
  const overgrazed = sheepGapPercent > 0.15;
  const undergrazed = sheepGapPercent < -0.45;
  const energyShortage = energyGapPercent < -0.1;
  const lowVegetation = model.vegetation < 28;
  const strongVegetation = model.vegetation >= 62;

  let lead = "";
  if (model.systemState === "Regenerating") {
    lead = `The current configuration indicates a regenerative solar-grazing scenario. Vegetation cover is estimated at ${formatNumber(model.vegetation, 1)}%, monthly clean-energy output reaches ${formatNumber(model.monthlyEnergy)} MWh, and sheep demand remains broadly compatible with the modeled grass carrying capacity.`;
  } else if (model.systemState === "Stressed") {
    lead = `The current configuration indicates ecological or resource stress. The primary pressure is ${overgrazed ? "excessive sheep demand relative to grass capacity" : energyShortage ? "clean-energy demand exceeding solar output" : lowVegetation ? "limited vegetation recovery" : "an imbalance between human demand and ecosystem capacity"}. Without adjustment, the desert-to-oasis transition becomes less stable.`;
  } else {
    lead = `The current configuration is broadly balanced. The model shows usable clean-energy production, moderate vegetation recovery, and manageable grazing pressure, but the system remains sensitive to changes in livestock numbers, grass growth, and panel maintenance.`;
  }

  const trendText = trendAnalysis.direction === "upward"
    ? `The line chart projects vegetation rising from ${formatNumber(trendAnalysis.first.vegetation, 1)}% in Month 1 to ${formatNumber(trendAnalysis.last.vegetation, 1)}% in Month 12, a gain of ${formatNumber(trendAnalysis.vegetationChange, 1)} percentage points. This suggests that grass recovery can outpace grazing pressure under the selected settings.`
    : trendAnalysis.direction === "downward"
      ? `The line chart projects vegetation falling from ${formatNumber(trendAnalysis.first.vegetation, 1)}% in Month 1 to ${formatNumber(trendAnalysis.last.vegetation, 1)}% in Month 12, a loss of ${formatNumber(Math.abs(trendAnalysis.vegetationChange), 1)} percentage points. This is a warning signal: grazing and maintenance pressure are overpowering grass recovery.`
      : `The line chart shows a mostly stable vegetation trajectory, changing by only ${formatNumber(Math.abs(trendAnalysis.vegetationChange), 1)} percentage points across 12 months. This indicates short-term balance, but not necessarily long-term ecological expansion.`;

  const sheepTrendText = trendAnalysis.sheepChange >= 0
    ? `The modeled sheep index increases over the same period, implying that available grass can support gradual livestock expansion.`
    : `The modeled sheep index declines over the same period, implying that the land cannot comfortably support the selected livestock level.`;

  const barText = `The bar chart's strongest dimension is ${strongestBar[0]} at ${formatNumber(strongestBar[1] * 100, 0)}% of its benchmark, while the weakest dimension is ${weakestBar[0]} at ${formatNumber(weakestBar[1] * 100, 0)}%. This comparison identifies where the system is performing well and where the impact score is being constrained.`;

  const grazingText = overgrazed
    ? `Sheep numbers exceed the estimated carrying capacity by ${formatNumber(Math.abs(sheepGap))} animals. This creates overgrazing risk, reduces grass biomass, and can expose more soil surface.`
    : undergrazed
      ? `Sheep numbers are well below the estimated carrying capacity. The grass layer is protected, but the grazing function is underused.`
      : `Sheep numbers are close to the estimated carrying capacity of ${formatNumber(model.sheepCapacity)} animals, which keeps grazing pressure within a manageable range.`;

  let recommendationText = "Maintain the current balance and use real NDVI, weather, and solar-output data to calibrate the simulation.";
  if (overgrazed) {
    recommendationText = "Reduce sheep numbers, increase grass-growth capacity, or add rotational grazing before expanding livestock.";
  } else if (energyShortage) {
    recommendationText = "Increase panel capacity, improve cleaning efficiency, or lower energy demand to close the clean-energy gap.";
  } else if (lowVegetation) {
    recommendationText = "Prioritize vegetation recovery before increasing livestock pressure.";
  } else if (strongVegetation && undergrazed) {
    recommendationText = "The site may support more sheep, but expansion should be gradual and monitored with vegetation data.";
  }

  return {
    lead,
    status: model.systemState,
    items: [
      ["Line Chart Analysis", `${trendText} ${sheepTrendText}`],
      ["Bar Chart Analysis", `${barText} Estimated avoided emissions are ${formatNumber(model.co2Avoided)} tons of CO2 this month.`],
      ["Grazing & Vegetation", grazingText],
      ["Recommended Action", recommendationText]
    ]
  };
}

function updateSummary(model, trend) {
  const summary = buildSummary(model, trend);
  const badge = document.querySelector("#summaryBadge");
  badge.textContent = summary.status;
  badge.className = summary.status.toLowerCase();
  document.querySelector("#summaryLead").textContent = summary.lead;
  document.querySelector("#summaryGrid").innerHTML = summary.items.map(([title, text]) => `
    <article class="summary-item">
      <span>${title}</span>
      <p>${text}</p>
    </article>
  `).join("");
}

function updateMetrics(model) {
  document.querySelector("#impactScore").textContent = formatNumber(model.impactScore, 0);
  document.querySelector("#systemState").textContent = model.systemState;
  document.querySelector("#vegPercent").textContent = `${formatNumber(model.vegetation, 0)}%`;
  document.querySelector("#capacityText").textContent = `${formatNumber(model.sheepCapacity)} sheep`;

  const metricItems = [
    ["Clean Energy", `${formatNumber(model.monthlyEnergy)} MWh`, `${formatNumber(model.peopleEnergySupported)} people powered`],
    ["CO2 Avoided", `${formatNumber(model.co2Avoided)} tons`, "Estimated against grid electricity"],
    ["Vegetation Cover", `${formatNumber(model.vegetation, 1)}%`, "Proxy for grass and NDVI recovery"],
    ["Grazing Balance", `${formatNumber(model.sheepBalance * 100, 0)}%`, `${formatNumber(model.foodSupported)} people food-supported`],
    ["Dust Loss", `${formatNumber(model.dustLoss * 100, 0)}%`, "Lower loss means higher panel output"],
    ["Confidence", `${formatNumber(model.confidenceScore, 0)} / 100`, "Based on transparency and data completeness"]
  ];

  document.querySelector("#metrics").innerHTML = metricItems.map(([label, value, note]) => `
    <div class="metric">
      <span>${label}</span>
      <strong>${value}</strong>
      <small>${note}</small>
    </div>
  `).join("");
}

function resizeCanvasToDisplaySize(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = Math.round(rect.width * dpr);
  const height = Math.round(rect.height * dpr);

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width: rect.width, height: rect.height };
}

function drawEcosystem(model) {
  const { width, height } = resizeCanvasToDisplaySize(ecosystemCanvas);
  ecoCtx.clearRect(0, 0, width, height);

  const skyGradient = ecoCtx.createLinearGradient(0, 0, 0, height * 0.58);
  skyGradient.addColorStop(0, "#9ed6e2");
  skyGradient.addColorStop(1, "#f4dfaa");
  ecoCtx.fillStyle = skyGradient;
  ecoCtx.fillRect(0, 0, width, height);

  ecoCtx.fillStyle = "#e2be75";
  ecoCtx.beginPath();
  ecoCtx.moveTo(0, height * 0.54);
  ecoCtx.bezierCurveTo(width * 0.24, height * 0.43, width * 0.46, height * 0.66, width, height * 0.48);
  ecoCtx.lineTo(width, height);
  ecoCtx.lineTo(0, height);
  ecoCtx.closePath();
  ecoCtx.fill();

  const greenAlpha = clamp(model.vegetation / 95, 0, 1);
  ecoCtx.fillStyle = `rgba(88, 148, 72, ${0.28 + greenAlpha * 0.64})`;
  ecoCtx.beginPath();
  ecoCtx.moveTo(0, height * (0.79 - greenAlpha * 0.22));
  ecoCtx.bezierCurveTo(width * 0.25, height * (0.73 - greenAlpha * 0.1), width * 0.58, height * 0.83, width, height * (0.72 - greenAlpha * 0.2));
  ecoCtx.lineTo(width, height);
  ecoCtx.lineTo(0, height);
  ecoCtx.closePath();
  ecoCtx.fill();

  drawSun(width, height);
  drawPanels(width, height, model);
  drawGrass(width, height, model);
  drawSheep(width, height, model);
  drawPeople(width, height, model);
}

function drawSun(width, height) {
  ecoCtx.fillStyle = "#f4bc4d";
  ecoCtx.beginPath();
  ecoCtx.arc(width * 0.82, height * 0.16, Math.max(28, width * 0.045), 0, Math.PI * 2);
  ecoCtx.fill();
}

function drawPanels(width, height, model) {
  const panelCount = Math.round(clamp(state.panels / 5000, 3, 22));
  const startX = width * 0.08;
  const baseY = height * 0.5;
  const gap = Math.min(58, width * 0.055);

  for (let index = 0; index < panelCount; index += 1) {
    const row = index % 3;
    const col = Math.floor(index / 3);
    const x = startX + col * gap;
    const y = baseY + row * 34 + col * 4;
    drawPanel(x, y, Math.max(24, width * 0.035), Math.max(15, height * 0.025), model.systemState);
  }
}

function drawPanel(x, y, w, h, systemState) {
  ecoCtx.save();
  ecoCtx.translate(x, y);
  ecoCtx.rotate(-0.18);
  ecoCtx.fillStyle = systemState === "Stressed" ? "#324b57" : "#1d5f76";
  ecoCtx.fillRect(0, 0, w, h);
  ecoCtx.strokeStyle = "rgba(255,255,255,0.45)";
  ecoCtx.lineWidth = 1;
  for (let line = 1; line < 3; line += 1) {
    ecoCtx.beginPath();
    ecoCtx.moveTo((w / 3) * line, 0);
    ecoCtx.lineTo((w / 3) * line, h);
    ecoCtx.stroke();
  }
  ecoCtx.strokeRect(0, 0, w, h);
  ecoCtx.restore();

  ecoCtx.strokeStyle = "#59635f";
  ecoCtx.lineWidth = 2;
  ecoCtx.beginPath();
  ecoCtx.moveTo(x + w * 0.42, y + h);
  ecoCtx.lineTo(x + w * 0.35, y + h + 20);
  ecoCtx.stroke();
}

function seededNoise(index) {
  const value = Math.sin(index * 999.13) * 10000;
  return value - Math.floor(value);
}

function drawGrass(width, height, model) {
  const grassCount = Math.round(clamp(model.vegetation * 3.2, 18, 285));
  ecoCtx.lineWidth = 1.5;

  for (let index = 0; index < grassCount; index += 1) {
    const x = seededNoise(index) * width;
    const y = height * (0.62 + seededNoise(index + 31) * 0.34);
    const blade = 5 + seededNoise(index + 14) * 11;
    ecoCtx.strokeStyle = seededNoise(index + 8) > 0.5 ? "#477b3e" : "#6b9c45";
    ecoCtx.beginPath();
    ecoCtx.moveTo(x, y);
    ecoCtx.quadraticCurveTo(x + 3, y - blade * 0.6, x + 1, y - blade);
    ecoCtx.stroke();
  }
}

function drawSheep(width, height, model) {
  const sheepCount = Math.round(clamp(state.sheep / 1100, 2, 24));

  for (let index = 0; index < sheepCount; index += 1) {
    const x = width * (0.24 + seededNoise(index + 51) * 0.65);
    const y = height * (0.68 + seededNoise(index + 71) * 0.22);
    const size = 9 + seededNoise(index + 87) * 4;
    const tint = model.systemState === "Stressed" ? "#ece4d8" : "#fffaf0";
    drawSheepIcon(x, y, size, tint);
  }
}

function drawSheepIcon(x, y, size, tint) {
  ecoCtx.fillStyle = tint;
  ecoCtx.beginPath();
  ecoCtx.ellipse(x, y, size * 1.35, size, 0, 0, Math.PI * 2);
  ecoCtx.fill();
  ecoCtx.beginPath();
  ecoCtx.arc(x + size * 1.25, y - size * 0.18, size * 0.45, 0, Math.PI * 2);
  ecoCtx.fill();
  ecoCtx.strokeStyle = "#3c3c35";
  ecoCtx.lineWidth = 1.4;
  ecoCtx.beginPath();
  ecoCtx.moveTo(x - size * 0.55, y + size * 0.7);
  ecoCtx.lineTo(x - size * 0.7, y + size * 1.35);
  ecoCtx.moveTo(x + size * 0.48, y + size * 0.72);
  ecoCtx.lineTo(x + size * 0.6, y + size * 1.35);
  ecoCtx.stroke();
}

function drawPeople(width, height, model) {
  const houseX = width * 0.82;
  const houseY = height * 0.62;
  const houseScale = clamp(state.humans / 22000, 0.7, 1.35);

  ecoCtx.fillStyle = model.humanEnergyFit >= 1 ? "#f4f2e8" : "#f2dcc6";
  ecoCtx.fillRect(houseX, houseY, 72 * houseScale, 54 * houseScale);
  ecoCtx.fillStyle = "#b95f45";
  ecoCtx.beginPath();
  ecoCtx.moveTo(houseX - 8 * houseScale, houseY);
  ecoCtx.lineTo(houseX + 36 * houseScale, houseY - 34 * houseScale);
  ecoCtx.lineTo(houseX + 80 * houseScale, houseY);
  ecoCtx.closePath();
  ecoCtx.fill();

  const peopleIcons = Math.round(clamp(state.humans / 5000, 1, 9));
  for (let index = 0; index < peopleIcons; index += 1) {
    const x = houseX - 42 + index * 12;
    const y = houseY + 82 + (index % 2) * 8;
    ecoCtx.fillStyle = "#26544a";
    ecoCtx.beginPath();
    ecoCtx.arc(x, y, 4, 0, Math.PI * 2);
    ecoCtx.fill();
    ecoCtx.fillRect(x - 2, y + 4, 4, 13);
  }
}

function drawTrendChart(model) {
  const trend = simulateTrend(model);
  const { width, height } = resizeCanvasToDisplaySize(trendCanvas);
  drawChartFrame(trendCtx, width, height);

  const padding = { top: 28, right: 28, bottom: 36, left: 52 };
  drawLineSeries(trendCtx, trend.map((item) => item.vegetation), width, height, padding, "#5a9a4e", "Vegetation %", 100);
  drawLineSeries(trendCtx, trend.map((item) => clamp(item.sheep / 300, 0, 100)), width, height, padding, "#157a8c", "Sheep index", 100);
  drawLegend(trendCtx, [
    ["Vegetation %", "#5a9a4e"],
    ["Sheep index", "#157a8c"]
  ], width, padding.top);
}

function drawBarChart(model) {
  const { width, height } = resizeCanvasToDisplaySize(barCanvas);
  drawChartFrame(barCtx, width, height);

  const bars = getBarData(model);

  const padding = { top: 28, right: 24, bottom: 48, left: 38 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const gap = 18;
  const barW = (chartW - gap * (bars.length - 1)) / bars.length;

  bars.forEach(([label, value, color], index) => {
    const barH = clamp(value, 0, 1.2) / 1.2 * chartH;
    const x = padding.left + index * (barW + gap);
    const y = padding.top + chartH - barH;

    barCtx.fillStyle = color;
    barCtx.fillRect(x, y, barW, barH);
    barCtx.fillStyle = "#22302d";
    barCtx.font = "700 12px system-ui";
    barCtx.textAlign = "center";
    barCtx.fillText(`${Math.round(value * 100)}%`, x + barW / 2, y - 8);
    barCtx.fillStyle = "#60706c";
    barCtx.fillText(label, x + barW / 2, height - 20);
  });
}

function drawChartFrame(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#fbfcf8";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#dfe6de";
  ctx.lineWidth = 1;
  for (let line = 1; line <= 4; line += 1) {
    const y = 28 + (height - 76) * (line / 4);
    ctx.beginPath();
    ctx.moveTo(38, y);
    ctx.lineTo(width - 22, y);
    ctx.stroke();
  }
}

function drawLineSeries(ctx, values, width, height, padding, color, label, maxValue) {
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  values.forEach((value, index) => {
    const x = padding.left + (chartW / (values.length - 1)) * index;
    const y = padding.top + chartH - (clamp(value, 0, maxValue) / maxValue) * chartH;
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  ctx.fillStyle = color;
  values.forEach((value, index) => {
    const x = padding.left + (chartW / (values.length - 1)) * index;
    const y = padding.top + chartH - (clamp(value, 0, maxValue) / maxValue) * chartH;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "#60706c";
  ctx.font = "700 11px system-ui";
  ctx.textAlign = "left";
  ctx.fillText(label, padding.left, padding.top - 10);
}

function drawLegend(ctx, items, width, y) {
  let x = width - 230;
  items.forEach(([label, color]) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y - 12, 12, 12);
    ctx.fillStyle = "#42504c";
    ctx.font = "700 12px system-ui";
    ctx.fillText(label, x + 18, y - 2);
    x += 112;
  });
}

function update() {
  const model = calculateModel();
  const trend = simulateTrend(model);
  updateMetrics(model);
  updateSummary(model, trend);
  drawEcosystem(model);
  drawTrendChart(model);
  drawBarChart(model);
}

document.querySelector("#resetBtn").addEventListener("click", () => {
  controlsConfig.forEach((control) => {
    state[control.key] = control.value;
    const input = document.querySelector(`#${control.key}`);
    const output = document.querySelector(`#${control.key}Output`);
    input.value = control.value;
    output.textContent = formatControlValue(control, control.value);
  });
  update();
});

window.addEventListener("resize", update);

makeControls();
update();
