const controlsConfig = [
  {
    key: "humans",
    label: "Humans Supported",
    group: "Human Demand",
    min: 500,
    max: 50000,
    step: 500,
    value: 12000,
    unit: "people"
  },
  {
    key: "panels",
    label: "Solar Panels",
    group: "Solar Infrastructure",
    min: 1000,
    max: 120000,
    step: 1000,
    value: 38000,
    unit: "panels"
  },
  {
    key: "energyDemand",
    label: "Clean Energy Demand",
    group: "Human Demand",
    min: 100,
    max: 9000,
    step: 100,
    value: 2900,
    unit: "MWh/month"
  },
  {
    key: "cleaning",
    label: "Panel Cleaning",
    group: "Solar Infrastructure",
    min: 0,
    max: 8,
    step: 1,
    value: 3,
    unit: "times/month"
  },
  {
    key: "sheep",
    label: "Sheep",
    group: "Ecosystem",
    min: 100,
    max: 30000,
    step: 100,
    value: 8400,
    unit: "sheep"
  },
  {
    key: "grassGrowth",
    label: "Grass Growth Speed",
    group: "Ecosystem",
    min: 10,
    max: 100,
    step: 1,
    value: 58,
    unit: "%"
  },
  {
    key: "transparency",
    label: "Data Transparency",
    group: "Data Integrity",
    min: 0,
    max: 100,
    step: 5,
    value: 65,
    unit: "%"
  }
];

const presets = [
  {
    name: "Balanced",
    values: { humans: 12000, panels: 38000, energyDemand: 2900, cleaning: 3, sheep: 8400, grassGrowth: 58, transparency: 65 }
  },
  {
    name: "Overgrazing",
    values: { humans: 12000, panels: 32000, energyDemand: 2900, cleaning: 2, sheep: 23000, grassGrowth: 38, transparency: 55 }
  },
  {
    name: "Energy Expansion",
    values: { humans: 18000, panels: 90000, energyDemand: 5200, cleaning: 4, sheep: 9800, grassGrowth: 62, transparency: 70 }
  },
  {
    name: "Low Cleaning",
    values: { humans: 14000, panels: 48000, energyDemand: 3900, cleaning: 0, sheep: 9200, grassGrowth: 52, transparency: 50 }
  },
  {
    name: "High Trust",
    values: { humans: 15000, panels: 64000, energyDemand: 4300, cleaning: 3, sheep: 10500, grassGrowth: 68, transparency: 95 }
  }
];

const state = Object.fromEntries(controlsConfig.map((control) => [control.key, control.value]));
const controlsEl = document.querySelector("#controls");
const presetsEl = document.querySelector("#presets");
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
  const groups = [...new Set(controlsConfig.map((control) => control.group))];

  groups.forEach((groupName) => {
    const group = document.createElement("section");
    group.className = "control-group";
    group.innerHTML = `<h3>${groupName}</h3>`;

    controlsConfig
      .filter((control) => control.group === groupName)
      .forEach((control) => {
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

        group.appendChild(wrapper);

        wrapper.querySelector("input").addEventListener("input", (event) => {
          state[control.key] = Number(event.target.value);
          wrapper.querySelector("output").textContent = formatControlValue(control, state[control.key]);
          update();
        });
      });

    controlsEl.appendChild(group);
  });
}

function makePresets() {
  presetsEl.innerHTML = presets.map((preset) => `
    <button type="button" data-preset="${preset.name}">${preset.name}</button>
  `).join("");

  presetsEl.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      const preset = presets.find((item) => item.name === button.dataset.preset);
      applyValues(preset.values);
    });
  });
}

function applyValues(values) {
  Object.entries(values).forEach(([key, value]) => {
    state[key] = value;
    const control = controlsConfig.find((item) => item.key === key);
    const input = document.querySelector(`#${key}`);
    const output = document.querySelector(`#${key}Output`);
    if (input && output && control) {
      input.value = value;
      output.textContent = formatControlValue(control, value);
    }
  });
  update();
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
  const scoreComponents = [
    ["Ecology", ecologicalScore, 35],
    ["Clean Energy", cleanEnergyScore, 30],
    ["Grazing Balance", grazingScore, 18],
    ["Resource Efficiency", resourceScore, 10],
    ["Transparency", transparencyScore, 7]
  ];
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
    scoreComponents,
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
    ["Energy Sufficiency", clamp(model.monthlyEnergy / state.energyDemand, 0, 1.35), "#157a8c", "Energy"],
    ["Carbon Impact", clamp(model.co2Avoided / 2200, 0, 1.35), "#2e7d5b", "Carbon"],
    ["Grazing Balance", clamp(model.sheepBalance, 0, 1.35), "#bd7b2f", "Grazing"],
    ["Human Support", clamp((model.humanEnergyFit + model.foodFit) / 2, 0, 1.35), "#775d9e", "Human"],
    ["Data Confidence", clamp(model.confidenceScore / 100, 0, 1.35), "#596c6d", "Confidence"]
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

  const barText = `The benchmark comparison shows ${strongestBar[0]} as the strongest dimension at ${formatNumber(strongestBar[1] * 100, 0)}% of target, while ${weakestBar[0]} is the weakest dimension at ${formatNumber(weakestBar[1] * 100, 0)}%. This identifies which part of the system is currently supporting the impact score and which part is constraining it.`;

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
  document.querySelector("#scoreStatus").textContent = `${model.systemState} scenario`;
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

function updateScoreBreakdown(model) {
  document.querySelector("#scoreBreakdown").innerHTML = model.scoreComponents.map(([label, value, max]) => `
    <div class="score-row">
      <span>${label}</span>
      <strong>${formatNumber(value, 1)} / ${max}</strong>
      <div class="score-track"><i style="width: ${clamp((value / max) * 100, 0, 100)}%"></i></div>
    </div>
  `).join("");
}

function updateVerification(model) {
  const hashStatus = state.transparency >= 85 ? "Ready for integrity proof" : "Simulation-only prototype";
  const evidenceStatus = state.transparency >= 70 ? "Moderate evidence quality" : "Low evidence completeness";
  const verificationItems = [
    ["Data Transparency", `${formatNumber(state.transparency)}%`, "User-controlled proxy for data completeness and source clarity."],
    ["Model Confidence", `${formatNumber(model.confidenceScore)} / 100`, "Confidence estimate based on transparency and maintenance observability."],
    ["Evidence Status", evidenceStatus, "Current version uses modeled estimates, not field sensor measurements."],
    ["Integrity Proof", hashStatus, "Future version can publish dataset hash, timestamp, and transaction reference."]
  ];

  document.querySelector("#verificationGrid").innerHTML = verificationItems.map(([label, value, note]) => `
    <div class="verification-item">
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

  if (model.vegetation < 30) {
    drawDryPatches(width, height);
  }
  if (model.vegetation > 62) {
    drawOasisRibbon(width, height, greenAlpha);
  }

  drawSun(width, height);
  drawPanels(width, height, model);
  drawGrass(width, height, model);
  drawSheep(width, height, model);
  drawPeople(width, height, model);
}

function drawDryPatches(width, height) {
  ecoCtx.strokeStyle = "rgba(117, 84, 43, 0.45)";
  ecoCtx.lineWidth = 1.4;
  for (let index = 0; index < 12; index += 1) {
    const x = seededNoise(index + 211) * width;
    const y = height * (0.67 + seededNoise(index + 233) * 0.24);
    const size = 10 + seededNoise(index + 277) * 18;
    ecoCtx.beginPath();
    ecoCtx.moveTo(x - size, y);
    ecoCtx.lineTo(x, y + size * 0.25);
    ecoCtx.lineTo(x + size, y - size * 0.1);
    ecoCtx.moveTo(x, y + size * 0.25);
    ecoCtx.lineTo(x - size * 0.25, y + size * 0.9);
    ecoCtx.stroke();
  }
}

function drawOasisRibbon(width, height, strength) {
  const gradient = ecoCtx.createLinearGradient(0, height * 0.62, width, height * 0.82);
  gradient.addColorStop(0, `rgba(72, 145, 129, ${0.18 + strength * 0.12})`);
  gradient.addColorStop(1, `rgba(68, 125, 92, ${0.2 + strength * 0.16})`);
  ecoCtx.fillStyle = gradient;
  ecoCtx.beginPath();
  ecoCtx.moveTo(width * 0.08, height * 0.79);
  ecoCtx.bezierCurveTo(width * 0.28, height * 0.7, width * 0.48, height * 0.87, width * 0.72, height * 0.72);
  ecoCtx.bezierCurveTo(width * 0.88, height * 0.63, width * 0.95, height * 0.72, width, height * 0.66);
  ecoCtx.lineTo(width, height * 0.74);
  ecoCtx.bezierCurveTo(width * 0.72, height * 0.84, width * 0.43, height * 0.91, width * 0.05, height * 0.85);
  ecoCtx.closePath();
  ecoCtx.fill();
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

  ecoCtx.save();
  ecoCtx.shadowColor = "rgba(50, 40, 20, 0.14)";
  ecoCtx.shadowBlur = 10;
  ecoCtx.shadowOffsetY = 5;
  ecoCtx.fillStyle = model.humanEnergyFit >= 1 ? "#f4f2e8" : "#f2dcc6";
  ecoCtx.fillRect(houseX, houseY, 72 * houseScale, 54 * houseScale);
  ecoCtx.fillStyle = "#b95f45";
  ecoCtx.beginPath();
  ecoCtx.moveTo(houseX - 8 * houseScale, houseY);
  ecoCtx.lineTo(houseX + 36 * houseScale, houseY - 34 * houseScale);
  ecoCtx.lineTo(houseX + 80 * houseScale, houseY);
  ecoCtx.closePath();
  ecoCtx.fill();
  ecoCtx.restore();

  const farmerCount = Math.round(clamp(state.humans / 9000, 1, 5));
  for (let index = 0; index < farmerCount; index += 1) {
    const x = houseX - 64 + index * 26;
    const y = houseY + 92 + (index % 2) * 7;
    drawFarmer(x, y, 0.82 + (index % 2) * 0.08, index);
  }
}

function drawFarmer(x, y, scale, index) {
  ecoCtx.save();
  ecoCtx.translate(x, y);
  ecoCtx.scale(scale, scale);

  ecoCtx.strokeStyle = "rgba(42, 54, 45, 0.28)";
  ecoCtx.lineWidth = 2;
  ecoCtx.beginPath();
  ecoCtx.moveTo(-10, 20);
  ecoCtx.lineTo(14, 20);
  ecoCtx.stroke();

  ecoCtx.fillStyle = "#d9a05c";
  ecoCtx.fillRect(-7, -24, 14, 8);
  ecoCtx.beginPath();
  ecoCtx.ellipse(0, -24, 15, 4, 0, 0, Math.PI * 2);
  ecoCtx.fill();

  ecoCtx.fillStyle = "#9b6a3a";
  ecoCtx.beginPath();
  ecoCtx.arc(0, -14, 6, 0, Math.PI * 2);
  ecoCtx.fill();

  ecoCtx.fillStyle = index % 2 === 0 ? "#2f6f5d" : "#6c7d3c";
  ecoCtx.beginPath();
  ecoCtx.roundRect(-7, -7, 14, 22, 4);
  ecoCtx.fill();

  ecoCtx.strokeStyle = "#263a34";
  ecoCtx.lineWidth = 2;
  ecoCtx.beginPath();
  ecoCtx.moveTo(-5, 14);
  ecoCtx.lineTo(-9, 25);
  ecoCtx.moveTo(5, 14);
  ecoCtx.lineTo(9, 25);
  ecoCtx.stroke();

  ecoCtx.strokeStyle = "#5f4d31";
  ecoCtx.beginPath();
  ecoCtx.moveTo(8, -2);
  ecoCtx.lineTo(18, 10);
  ecoCtx.moveTo(18, -12);
  ecoCtx.lineTo(18, 24);
  ecoCtx.stroke();

  ecoCtx.strokeStyle = "#a98c55";
  ecoCtx.lineWidth = 1.3;
  ecoCtx.beginPath();
  ecoCtx.moveTo(14, -12);
  ecoCtx.lineTo(22, -12);
  ecoCtx.moveTo(15, -8);
  ecoCtx.lineTo(22, -8);
  ecoCtx.stroke();

  ecoCtx.restore();
}

function drawTrendChart(model, trend = simulateTrend(model)) {
  const { width, height } = resizeCanvasToDisplaySize(trendCanvas);
  drawChartFrame(trendCtx, width, height);

  const padding = { top: 28, right: 28, bottom: 36, left: 52 };
  drawLineSeries(trendCtx, trend.map((item) => item.vegetation), width, height, padding, "#5a9a4e", "Vegetation Cover", 100);
  drawLineSeries(trendCtx, trend.map((item) => clamp(item.sheep / 300, 0, 100)), width, height, padding, "#157a8c", "Sheep Pressure", 100);
  drawLineSeries(trendCtx, trend.map((item) => clamp((item.vegetation * 185) / 300, 0, 100)), width, height, padding, "#bd7b2f", "Carrying Capacity", 100);
  drawLegend(trendCtx, [
    ["Vegetation", "#5a9a4e"],
    ["Sheep Pressure", "#157a8c"],
    ["Capacity", "#bd7b2f"]
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
  const benchmarkY = padding.top + chartH - (1 / 1.2) * chartH;

  barCtx.strokeStyle = "rgba(177, 76, 67, 0.55)";
  barCtx.setLineDash([5, 5]);
  barCtx.beginPath();
  barCtx.moveTo(padding.left, benchmarkY);
  barCtx.lineTo(width - padding.right, benchmarkY);
  barCtx.stroke();
  barCtx.setLineDash([]);
  barCtx.fillStyle = "#b14c43";
  barCtx.font = "800 11px system-ui";
  barCtx.textAlign = "right";
  barCtx.fillText("100% target", width - padding.right, benchmarkY - 7);

  bars.forEach(([label, value, color, shortLabel], index) => {
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
    barCtx.fillText(shortLabel || label, x + barW / 2, height - 20);
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

  void label;
}

function drawLegend(ctx, items, width, y) {
  let x = Math.max(58, width - 360);
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
  updateScoreBreakdown(model);
  updateVerification(model);
  updateSummary(model, trend);
  drawEcosystem(model);
  drawTrendChart(model, trend);
  drawBarChart(model);
}

document.querySelector("#resetBtn").addEventListener("click", () => {
  applyValues(Object.fromEntries(controlsConfig.map((control) => [control.key, control.value])));
});

window.addEventListener("resize", update);

makeControls();
makePresets();
update();
