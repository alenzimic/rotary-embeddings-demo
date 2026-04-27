const DIM = 8;
const POS_SCALE = 0.52;
const VECTOR_SCALE = 104;
const MAX_TOKENS = 24;
const MAX_VISUAL_TOKENS = 12;
const THETA_LOG_MIN = 0.3;
const THETA_LOG_MAX = 5;
const THETA_LOG_DEFAULT = 4;

const SENTENCES = [
  "The bat scared the baseball player and he threw his bat",
  "The cat sat on the mat",
  "Dog bites man",
  "Man bites dog",
  "Alice gave Bob tea",
  "The model reads tokens in order"
];

const STEPS = [
  {
    name: "Tokenize",
    title: "Text becomes token slots",
    claim: "A sentence becomes an ordered list of tokens.",
    mode: "none"
  },
  {
    name: "Embed",
    title: "Each token gets a learned vector",
    claim: "The embedding table maps token id to coordinates.",
    mode: "none"
  },
  {
    name: "Limitation",
    title: "Token vectors do not store order",
    claim: "Move a word to another slot; its token embedding is unchanged.",
    mode: "none"
  },
  {
    name: "Abs add",
    title: "Absolute position: lookup + add",
    claim: "At position i: output x_i = token embedding e + position vector p_i.",
    mode: "add"
  },
  {
    name: "Shift",
    title: "Shift test for absolute positions",
    claim: "Same words, new absolute ids; the attention pattern can change.",
    mode: "add"
  },
  {
    name: "Rotate",
    title: "Position rotates the vector",
    claim: "RoPE keeps e the same length and turns its direction.",
    mode: "rope"
  },
  {
    name: "Theta",
    title: "Theta sets rotation speed",
    claim: "Theta controls how quickly positions spread around the circle.",
    mode: "rope"
  },
  {
    name: "Relative",
    title: "RoPE keeps relative offsets",
    claim: "Same pair, same gap; RoPE gives the same score.",
    mode: "rope"
  },
  {
    name: "Experiment",
    title: "Change the sentence",
    claim: "Try the same controls on your own tokens.",
    mode: "rope"
  },
  {
    name: "AGI theater",
    title: "AGI Theater",
    claim: "Same word. New slot. New meaning.",
    mode: "none"
  }
];

const FUNNY_EXAMPLES = [
  {
    title: "Sam's demo horoscope",
    moving: "only",
    variants: [
      {
        sentence: "Only Sam Altman called the demo a sleepy little revolution",
        meaning: "Nobody else reached for the prophecy button."
      },
      {
        sentence: "Sam Altman only called the demo a sleepy little revolution",
        meaning: "Just called it that. The model did not ascend."
      },
      {
        sentence: "Sam Altman called only the demo a sleepy little revolution",
        meaning: "The demo got the halo. Nothing else."
      },
      {
        sentence: "Sam Altman called the demo only a sleepy little revolution",
        meaning: "Only a revolution. Very low-key."
      }
    ]
  },
  {
    title: "AGI arrival dispute",
    moving: "still",
    variants: [
      {
        sentence: "Still researchers say AGI has not arrived",
        meaning: "Despite the hype, the skepticism survives."
      },
      {
        sentence: "Researchers still say AGI has not arrived",
        meaning: "The same researchers keep saying it."
      },
      {
        sentence: "Researchers say AGI still has not arrived",
        meaning: "AGI remains the thing that is missing."
      },
      {
        sentence: "Researchers say AGI has still not arrived",
        meaning: "The not-yet verdict gets maximum underline."
      }
    ]
  },
  {
    title: "Trump tweet alchemy",
    moving: "only",
    variants: [
      {
        sentence: "Only Trump turned the policy brief into tweets",
        meaning: "Nobody else converted governance into posts."
      },
      {
        sentence: "Trump only turned the policy brief into tweets",
        meaning: "He just transformed it. Casual Tuesday."
      },
      {
        sentence: "Trump turned only the policy brief into tweets",
        meaning: "The brief alone entered the tweet machine."
      },
      {
        sentence: "Trump turned the policy brief only into tweets",
        meaning: "No memo. No plan. Just posts."
      }
    ]
  }
];

const WORD_FEATURES = {
  the: [-0.85, -0.28, 0.12, -0.15, 0.18, -0.12, -0.2, 0.08],
  a: [-0.76, -0.24, 0.1, -0.1, 0.16, -0.08, -0.18, 0.06],
  and: [-0.72, -0.18, 0.14, -0.06, 0.2, -0.08, -0.14, 0.1],
  he: [-0.62, -0.3, 0.28, -0.12, 0.18, 0.04, -0.2, 0.16],
  only: [0.24, 0.62, -0.48, 0.18, -0.36, 0.52, -0.2, 0.12],
  still: [0.34, -0.54, 0.28, 0.42, -0.18, 0.46, 0.1, -0.24],
  bat: [0.58, 0.18, 0.72, -0.34, -0.18, 0.44, 0.22, -0.1],
  baseball: [0.52, 0.36, -0.12, 0.28, 0.54, -0.22, 0.14, 0.32],
  player: [0.46, -0.48, 0.56, 0.18, 0.28, 0.34, -0.12, 0.24],
  scared: [-0.42, -0.72, 0.18, 0.62, -0.22, 0.12, 0.38, -0.18],
  threw: [-0.58, -0.18, -0.26, 0.78, 0.34, -0.16, 0.22, 0.12],
  his: [-0.7, -0.2, 0.16, -0.08, 0.2, -0.1, -0.16, 0.08],
  cat: [0.86, 0.72, 0.36, 0.1, -0.22, 0.34, 0.18, -0.08],
  dog: [0.82, 0.66, 0.34, 0.16, -0.2, 0.28, 0.12, -0.05],
  man: [0.44, -0.82, 0.62, -0.1, 0.18, 0.36, -0.16, 0.18],
  alice: [0.48, -0.72, 0.7, -0.04, 0.2, 0.42, -0.08, 0.16],
  bob: [0.43, -0.68, 0.64, -0.12, 0.18, 0.38, -0.1, 0.22],
  sat: [-0.62, 0.54, -0.74, 0.46, 0.16, -0.28, 0.2, -0.12],
  bites: [-0.72, -0.46, -0.28, 0.8, -0.1, -0.18, 0.36, -0.16],
  gave: [-0.52, -0.18, -0.34, 0.76, 0.44, -0.22, 0.22, 0.18],
  reads: [-0.46, -0.12, -0.32, 0.6, 0.52, -0.18, 0.18, 0.26],
  on: [-0.18, 0.18, -0.08, -0.36, 0.82, -0.24, -0.32, 0.1],
  in: [-0.16, 0.16, -0.1, -0.34, 0.78, -0.22, -0.3, 0.12],
  mat: [0.22, 0.84, -0.54, -0.18, 0.1, -0.36, -0.12, 0.28],
  tea: [0.2, 0.76, -0.46, -0.12, 0.16, -0.28, -0.18, 0.32],
  model: [0.62, -0.08, 0.18, 0.46, -0.58, -0.44, 0.5, 0.22],
  tokens: [0.68, 0.16, 0.22, 0.38, -0.56, -0.36, 0.48, 0.2],
  token: [0.68, 0.16, 0.22, 0.38, -0.56, -0.36, 0.48, 0.2],
  order: [-0.24, 0.34, 0.1, -0.22, 0.66, 0.48, -0.34, -0.16],
  attention: [0.58, -0.04, 0.18, 0.48, -0.56, -0.36, 0.5, 0.24],
  nearby: [-0.2, 0.3, 0.12, -0.2, 0.68, 0.44, -0.34, -0.18],
  likes: [-0.48, -0.12, -0.3, 0.58, 0.46, -0.18, 0.18, 0.2]
};

const COLORS = ["#3b454d", "#07877f", "#c66d12", "#b5482e", "#367b9a", "#7b6d30", "#5e6b75"];

const state = {
  step: 0,
  sentence: SENTENCES[0],
  tokens: tokenize(SENTENCES[0]),
  selected: 1,
  pair: 0,
  start: 0,
  rotationPosition: 1,
  relativeLeft: 0,
  relativeRight: 2,
  orderToken: "dog",
  funnyExample: 0,
  funnyVariant: 0,
  thetaLog: THETA_LOG_DEFAULT,
  mode: "none"
};

const el = {};
let liveUpdateFrame = 0;

document.addEventListener("DOMContentLoaded", () => {
  ["stepNav", "progressFill", "stepKicker", "stepTitle", "stepClaim", "stepBody", "prevBtn", "tryBtn", "nextBtn", "resetBtn"].forEach((id) => {
    el[id] = document.getElementById(id);
  });
  bindChrome();
  render();
});

function bindChrome() {
  el.prevBtn.addEventListener("click", () => setStep(state.step - 1));
  el.nextBtn.addEventListener("click", () => setStep(state.step + 1));
  el.tryBtn.addEventListener("click", runStepAction);
  el.resetBtn.addEventListener("click", () => {
    state.step = 0;
    state.sentence = SENTENCES[0];
    state.tokens = tokenize(state.sentence);
    state.selected = 1;
    state.pair = 0;
    state.start = 0;
    state.rotationPosition = 1;
    state.relativeLeft = 0;
    state.relativeRight = 2;
    state.orderToken = "dog";
    state.funnyExample = 0;
    state.funnyVariant = 0;
    state.thetaLog = THETA_LOG_DEFAULT;
    state.mode = "none";
    render();
  });
  document.addEventListener("keydown", (event) => {
    const tag = event.target?.tagName?.toLowerCase();
    if (tag === "input" || tag === "select") return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setStep(state.step + 1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setStep(state.step - 1);
    }
  });
}

function setStep(next) {
  const previousStep = state.step;
  state.step = clamp(next, 0, STEPS.length - 1);
  state.mode = STEPS[state.step].mode;
  if (state.step === 4) state.start = Math.max(state.start, 4);
  if (state.step === 5 && previousStep !== state.step) {
    state.pair = 0;
    state.rotationPosition = state.selected;
  }
  if (state.step === 6 && previousStep !== state.step) state.pair = 1;
  if (state.step === 7) {
    state.start = Math.max(state.start, 4);
    syncRelativePair();
  }
  if (state.step === 9) {
    state.funnyExample = clamp(state.funnyExample, 0, FUNNY_EXAMPLES.length - 1);
    state.funnyVariant = clamp(state.funnyVariant, 0, FUNNY_EXAMPLES[state.funnyExample].variants.length - 1);
  }
  render();
  if (previousStep !== state.step) scrollToLessonTop();
}

function render() {
  const step = STEPS[state.step];
  state.selected = clamp(state.selected, 0, activeTokens().length - 1);
  el.stepKicker.textContent = `Step ${state.step + 1} of ${STEPS.length}`;
  el.stepTitle.textContent = step.title;
  el.stepClaim.textContent = step.claim;
  el.progressFill.style.width = `${((state.step + 1) / STEPS.length) * 100}%`;
  renderNav();
  el.stepBody.innerHTML = renderStepBody();
  bindStepBody();
  el.prevBtn.disabled = state.step === 0;
  el.nextBtn.textContent = state.step === STEPS.length - 1 ? "Finish" : "Next";
  el.tryBtn.textContent = tryLabel();
}

function renderNav() {
  el.stepNav.innerHTML = STEPS.map((step, index) => `
    <li>
      <button class="step-button ${index === state.step ? "is-active" : ""}" type="button" data-step="${index}">
        <span class="step-num">${index + 1}</span>
        <span class="step-name">${escapeHtml(step.name)}</span>
      </button>
    </li>
  `).join("");
  el.stepNav.querySelectorAll("[data-step]").forEach((button) => {
    button.addEventListener("click", () => setStep(Number(button.dataset.step)));
  });
}

function renderStepBody() {
  if (state.step === 0) return stepTokens();
  if (state.step === 1) return stepEmbed();
  if (state.step === 2) return stepLimitation();
  if (state.step === 3) return stepAdd();
  if (state.step === 4) return stepShift();
  if (state.step === 5) return stepRotatePosition();
  if (state.step === 6) return stepTheta();
  if (state.step === 7) return stepRelative();
  if (state.step === 8) return stepExperiment();
  return stepFunnyExamples();
}

function stepTokens() {
  return `
    <div class="control-row">
      ${sentenceSelect()}
      ${customInput()}
    </div>
    <div class="slot-row">
      ${state.tokens.map((token, index) => `<span class="slot-pair"><span class="slot">${index}</span><button class="${tokenClass(token, index)}" type="button" data-token="${index}" title="${escapeHtml(token)}">${escapeHtml(token)}</button></span>`).join("")}
    </div>
    ${selectedEmbeddingPanel()}
    <p class="caption">Slot = position. Token = identity. The next math panels use the first ${Math.min(MAX_VISUAL_TOKENS, state.tokens.length)} tokens.</p>
  `;
}

function stepEmbed() {
  const tokens = activeTokens();
  const token = tokens[state.selected];
  return `
    ${tokenControls()}
    <div class="visual-grid">
      <div class="plane-card">${vectorSvg({ mode: "none", showAll: true })}</div>
      <div class="mini-card">
        <h3>${escapeHtml(token)}</h3>
        <div class="formula">
          <span class="chip teal">embedding table</span>
          <span class="chip">e = ${formatVec(tokenVector(token), 4)}</span>
        </div>
        <p>Click a token. The vector is concrete coordinates.</p>
      </div>
    </div>
  `;
}

function stepLimitation() {
  const active = activeOrderToken();
  return `
    <div class="order-demo">
      ${orderPanel("Dog bites man")}
      ${orderPanel("Man bites dog")}
    </div>
    <div class="concrete-row">
      <span class="chip teal">${sameEmbeddingStatement(active)}</span>
      <span class="chip amber">same vector, different slot</span>
    </div>
    <p class="caption">With token embeddings only, changing a word's slot does not change that word's vector.</p>
  `;
}

function stepAdd() {
  state.mode = "add";
  const token = activeTokens()[state.selected];
  const position = state.start + state.selected;
  const base = pairPoint(tokenVector(token), state.pair);
  const pos = pairPoint(positionalVector(position), state.pair);
  const out = pairPoint(transformedVector(token, position, "add"), state.pair);
  const coordPair = coordPairLabel(state.pair);
  return `
    ${pairAndTokenControls(false)}
    ${dimensionMap(token)}
    ${positionLookup(position, token)}
    <div class="visual-grid">
      <div class="plane-card compact">${vectorSvg({ mode: "add", showAll: false })}</div>
      <div class="mini-card">
        <h3>Selected coordinates</h3>
        <div class="formula">
          <span class="chip">e coords ${coordPair} ${formatPair(base)}</span>
          <span>+</span>
          <span class="chip amber">p coords ${coordPair} ${formatPair({ x: pos.x * POS_SCALE, y: pos.y * POS_SCALE })}</span>
          <span>=</span>
          <span class="chip teal">out coords ${coordPair} ${formatPair(out)}</span>
        </div>
        <p>Same full e vector. This panel draws only two coordinates.</p>
      </div>
    </div>
  `;
}

function stepShift() {
  state.mode = "add";
  return `
    ${shiftControl("add")}
    ${shiftLesson()}
    <div class="compare-grid">
      <div class="compare-card">
        <h3>start = 0</h3>
        ${heatmap("add", 0)}
      </div>
      <div class="compare-card">
        <h3>start = ${state.start}</h3>
        ${heatmap("add", state.start)}
        <div class="score-line"><span>same pattern?</span><strong>${matrixStability(similarityMatrix("add", 0), similarityMatrix("add", state.start)).toFixed(2)}</strong></div>
      </div>
    </div>
  `;
}

function stepRotatePosition() {
  state.mode = "rope";
  const position = state.rotationPosition;
  return `
    <div class="control-row">
      ${tokenControls()}
      ${positionIdControl()}
    </div>
    <div class="visual-grid">
      <div class="plane-card compact" id="rotationPlane">${rotationPlane()}</div>
      <div class="mini-card" id="rotationDetails">${rotationDetails(position)}</div>
    </div>
  `;
}

function rotationPlane() {
  return vectorSvg({ mode: "rope", showAll: false, positionOverride: state.rotationPosition });
}

function rotationDetails(position) {
  const token = activeTokens()[state.selected];
  const base = pairPoint(tokenVector(token), state.pair);
  const out = pairPoint(transformedVector(token, position, "rope"), state.pair);
  const freq = invFreq(state.pair);
  const angle = position * freq;
  return `
    <h3>Same e, new angle</h3>
    <div class="formula">
      <span class="chip">e ${formatPair(base)}</span>
      <span class="chip amber">pos ${formatScalar(position)}</span>
      <span class="chip amber">angle ${angle.toFixed(2)}</span>
      <span class="chip teal">out ${formatPair(out)}</span>
    </div>
    ${angleEquation(position, freq)}
    ${positionRotationLesson(position)}
    <p>RoPE stores position as direction, not by adding a new vector.</p>
  `;
}

function stepTheta() {
  state.mode = "rope";
  return `
    <div class="control-row">
      ${tokenControls()}
      ${pairReadout()}
      ${thetaControl()}
    </div>
    <div class="visual-grid">
      <div class="plane-card compact" id="thetaPlane">${thetaSweepSvg()}</div>
      <div class="mini-card" id="thetaDetails">${thetaDetails()}</div>
    </div>
  `;
}

function thetaDetails() {
  return `
    <h3>Position trail</h3>
    ${thetaEquation()}
    ${thetaLesson()}
    ${thetaAngleTable()}
  `;
}

function stepRelative() {
  state.mode = "rope";
  syncRelativePair();
  const addScore = matrixStability(similarityMatrix("add", 0), similarityMatrix("add", state.start));
  const ropeScore = matrixStability(similarityMatrix("rope", 0), similarityMatrix("rope", state.start));
  return `
    ${shiftControl("rope")}
    ${relativeLesson()}
    <div class="compare-grid">
      <div class="compare-card">
        <h3>Absolute add</h3>
        ${heatmap("add", state.start)}
        <div class="score-line"><span>shift stability</span><strong>${addScore.toFixed(2)}</strong></div>
      </div>
      <div class="compare-card">
        <h3>RoPE rotate</h3>
        ${heatmap("rope", state.start)}
        <div class="score-line"><span>shift stability</span><strong>${ropeScore.toFixed(2)}</strong></div>
      </div>
    </div>
  `;
}

function stepExperiment() {
  return `
    <div class="control-row">
      ${sentenceSelect()}
      ${customInput()}
    </div>
    <div class="control-row">
      ${modeButtons()}
      ${pairControl()}
      ${positionControl()}
      ${thetaControl()}
    </div>
    ${tokenControls()}
    <div class="visual-grid">
      <div class="plane-card" id="experimentPlane">${vectorSvg({ mode: state.mode, showAll: true })}</div>
      <div class="mini-card" id="experimentDetails">
        <h3>Selected output</h3>
        ${attentionBars()}
      </div>
    </div>
  `;
}

function stepFunnyExamples() {
  const example = FUNNY_EXAMPLES[state.funnyExample];
  const active = example.variants[state.funnyVariant];
  return `
    <div class="funny-layout">
      <div class="funny-controls">
        ${funnyExampleTabs()}
        <div class="funny-focus">
          <span>moving word</span>
          <strong>${escapeHtml(example.moving)}</strong>
        </div>
      </div>
      <div class="funny-stage">
        <div class="funny-sentence">
          <span>selected sentence</span>
          <strong>${highlightMovingWord(active.sentence, example.moving)}</strong>
        </div>
        <div class="funny-meaning">
          <span>meaning</span>
          <strong>${escapeHtml(active.meaning)}</strong>
        </div>
      </div>
      ${funnyRopePanel(example)}
      <div class="funny-grid">
        ${example.variants.map((variant, index) => funnySentenceCard(variant, example.moving, index)).join("")}
      </div>
      ${funnyPositionMap(example)}
    </div>
  `;
}

function funnyExampleTabs() {
  return `
    <div class="funny-tabs" role="group" aria-label="Funny example set">
      ${FUNNY_EXAMPLES.map((example, index) => `
        <button class="funny-tab ${index === state.funnyExample ? "is-active" : ""}" type="button" data-funny-example="${index}">
          ${escapeHtml(example.title)}
        </button>
      `).join("")}
    </div>
  `;
}

function funnySentenceCard(variant, movingWord, index) {
  return `
    <button class="funny-card ${index === state.funnyVariant ? "is-active" : ""}" type="button" data-funny-variant="${index}">
      <span class="slot-mini">${index + 1}</span>
      <strong>${highlightMovingWord(variant.sentence, movingWord)}</strong>
      <small>${escapeHtml(variant.meaning)}</small>
    </button>
  `;
}

function funnyPositionMap(example) {
  return `
    <div class="funny-map">
      <span class="strip-label">same words, different slot for "${escapeHtml(example.moving)}"</span>
      ${example.variants.map((variant, index) => {
        const tokens = tokenize(variant.sentence);
        return `
          <button class="funny-row ${index === state.funnyVariant ? "is-active" : ""}" type="button" data-funny-variant="${index}">
            ${tokens.map((token, tokenIndex) => `
              <span class="${tokenKey(token) === tokenKey(example.moving) ? "is-moving" : ""}">
                <b>${tokenIndex}</b>${escapeHtml(token)}
              </span>
            `).join("")}
          </button>
        `;
      }).join("")}
    </div>
  `;
}

function funnyRopePanel(example) {
  const active = example.variants[state.funnyVariant];
  const slot = movingWordSlot(active.sentence, example.moving);
  const pair = 0;
  const freq = invFreq(pair);
  const angle = slot * freq;
  const coords = pairPoint(rotateVector(tokenVector(example.moving), slot), pair);
  return `
    <div class="funny-rope-card">
      <div class="funny-rope-plane">${funnyRopeSvg(example)}</div>
      <div class="funny-rope-details">
        <h3>RoPE view of "${escapeHtml(example.moving)}"</h3>
        <div class="coord-readout">
          <span><b>slot</b><strong>${slot}</strong></span>
          <span><b>angle</b><strong>${angle.toFixed(2)}</strong></span>
          <span><b>pair</b><strong>${coordPairDisplay(pair)}</strong></span>
          <span><b>coords</b><strong>${formatPair(coords)}</strong></span>
        </div>
        <p>Same token vector. Moving the word changes the slot, so RoPE rotates that vector.</p>
      </div>
    </div>
  `;
}

function funnyRopeSvg(example) {
  const width = 560;
  const height = 320;
  const pair = 0;
  const vector = tokenVector(example.moving);
  const base = directionToSvg(pairPoint(vector, pair), 72);
  const activeVariant = example.variants[state.funnyVariant];
  const activeSlot = movingWordSlot(activeVariant.sentence, example.moving);
  const activePoint = directionToSvg(pairPoint(rotateVector(vector, activeSlot), pair), 102);
  const activeColor = COLORS[2];
  const arc = rotationArcPath(124, base, activeSlot * invFreq(pair));
  const parts = [
    `<svg viewBox="${-width / 2} ${-height / 2} ${width} ${height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="RoPE rotation for moved word">`,
    `<circle class="ring" cx="0" cy="0" r="102" />`,
    `<circle class="ring" cx="0" cy="0" r="146" />`,
    `<line class="axis" x1="-230" y1="0" x2="230" y2="0" />`,
    `<line class="axis" x1="0" y1="138" x2="0" y2="-138" />`,
    `<text class="axis-label" x="235" y="-8">${coordLabel(0)}</text>`,
    `<text class="axis-label" x="8" y="-142">${coordLabel(1)}</text>`,
    drawVector(base.x, base.y, "#8d9996", "faint"),
    `<text class="funny-base-label" x="${base.x + 10}" y="${base.y - 10}">e_${escapeHtml(example.moving)}</text>`,
    arc ? `<path class="angle-arc" d="${arc}" stroke="${activeColor}" />` : ""
  ];
  example.variants.forEach((variant, index) => {
    const slot = movingWordSlot(variant.sentence, example.moving);
    const point = directionToSvg(pairPoint(rotateVector(vector, slot), pair), 102);
    const active = index === state.funnyVariant;
    const color = active ? activeColor : COLORS[(index + 4) % COLORS.length];
    if (active) parts.push(drawVector(point.x, point.y, color, "funny-active-vector"));
    parts.push(`<circle class="funny-rope-dot ${active ? "is-active" : ""}" cx="${point.x}" cy="${point.y}" r="${active ? 8 : 5.8}" fill="${color}" />`);
    parts.push(`<text class="funny-slot-label ${active ? "is-active" : ""}" x="${point.x + 10}" y="${point.y + 4}">slot ${slot}</text>`);
  });
  parts.push(`<circle class="dot-halo" cx="${activePoint.x}" cy="${activePoint.y}" r="15" stroke="${activeColor}" />`);
  parts.push(`</svg>`);
  return parts.join("");
}

function movingWordSlot(sentence, movingWord) {
  const target = tokenKey(movingWord);
  const index = tokenize(sentence).findIndex((token) => tokenKey(token) === target);
  return Math.max(0, index);
}

function highlightMovingWord(sentence, movingWord) {
  const target = tokenKey(movingWord);
  return tokenize(sentence)
    .map((token) => tokenKey(token) === target ? `<mark>${escapeHtml(token)}</mark>` : escapeHtml(token))
    .join(" ");
}

function sentenceSelect() {
  const customSelected = !isPresetSentence(state.sentence);
  return `
    <label class="field">
      <span>Example</span>
      <select id="sentenceSelect">
        ${customSelected ? `<option value="${escapeHtml(state.sentence)}" selected>Custom sentence</option>` : ""}
        ${SENTENCES.map((sentence) => `<option value="${escapeHtml(sentence)}" ${sentence === state.sentence ? "selected" : ""}>${escapeHtml(sentence)}</option>`).join("")}
      </select>
    </label>
  `;
}

function customInput() {
  const value = isPresetSentence(state.sentence) ? "" : state.sentence;
  return `
    <div class="field">
      <span>Custom</span>
      <div class="input-line">
        <input id="customSentence" type="text" maxlength="220" placeholder="type a longer sentence" value="${escapeHtml(value)}" />
        <button id="customApply" class="secondary-button" type="button">Use</button>
      </div>
    </div>
  `;
}

function tokenControls() {
  const tokens = activeTokens();
  return `
    <div class="token-row">
      ${tokens.map((token, index) => tokenButton(token, index)).join("")}
      ${state.tokens.length > tokens.length ? `<span class="chip muted">showing first ${tokens.length}</span>` : ""}
    </div>
  `;
}

function pairAndTokenControls(includePosition, includeTheta = false) {
  return `
    <div class="control-row">
      ${tokenControls()}
      ${pairControl()}
      ${includePosition ? positionControl() : ""}
      ${includeTheta ? thetaControl() : ""}
    </div>
  `;
}

function pairControl(minPair = 0) {
  state.pair = Math.max(state.pair, minPair);
  const pairs = Array.from({ length: DIM / 2 }, (_, pair) => pair).filter((pair) => pair >= minPair);
  return `
    <div class="field pair-field">
      <span>choose two coordinates to plot</span>
      <div class="pair-buttons" role="group" aria-label="Choose coordinate pair">
        ${pairs.map((pair) => pairButton(pair)).join("")}
      </div>
    </div>
  `;
}

function pairReadout() {
  const freq = invFreq(state.pair);
  return `
    <div class="field readout-field pair-readout">
      <span>coordinate pair from the same e vector</span>
      <div class="dim-pair-row" aria-label="Embedding coordinate pairs">
        ${Array.from({ length: DIM / 2 }, (_, pair) => `
          <button class="dim-pair ${pair === state.pair ? "is-active" : ""}" type="button" data-pair="${pair}">
            <b>${coordPairDisplay(pair)}</b>
            <i style="--speed:${pairSpeed(pair)}%"></i>
          </button>
        `).join("")}
      </div>
      <div class="readout-pill">current freq ${freq.toFixed(4)} | larger pair = slower turn</div>
    </div>
  `;
}

function positionControl() {
  return `
    <label class="field">
      <span id="positionLabel">start position: ${state.start}</span>
      <input id="positionSlider" type="range" min="0" max="12" value="${state.start}" style="--fill:${rangeFill(state.start, 0, 12)}%" />
    </label>
  `;
}

function positionIdControl() {
  return `
    <label class="field">
      <span id="rotationPositionLabel">position id: ${formatScalar(state.rotationPosition)}</span>
      <input id="rotationPositionSlider" type="range" min="0" max="12" step="0.01" value="${state.rotationPosition}" style="--fill:${rangeFill(state.rotationPosition, 0, 12)}%" />
    </label>
  `;
}

function thetaControl() {
  return `
    <label class="field">
      <span id="thetaLabel">theta base: ${formatThetaBase(thetaBase())}</span>
      <input id="thetaSlider" type="range" min="${THETA_LOG_MIN}" max="${THETA_LOG_MAX}" step="0.01" value="${state.thetaLog}" style="--fill:${rangeFill(state.thetaLog, THETA_LOG_MIN, THETA_LOG_MAX)}%" />
    </label>
  `;
}

function shiftControl(mode) {
  return `
    <div class="control-row">
      <span class="chip ${mode === "rope" ? "teal" : "amber"}">${mode === "rope" ? "RoPE" : "absolute add"}</span>
      ${positionControl()}
      ${mode === "rope" ? thetaControl() : ""}
    </div>
  `;
}

function modeButtons() {
  return `
    <div class="field mode-field">
      <span>position method</span>
      <div class="mode-pills" role="group" aria-label="Position method">
        ${["none", "add", "rope"].map((mode) => `<button class="mode-button ${state.mode === mode ? "is-active" : ""}" type="button" data-mode="${mode}">${modeLabel(mode)}</button>`).join("")}
      </div>
      <small class="mode-hint">Abs add: x = e + p; RoPE: rotate e</small>
    </div>
  `;
}

function tokenButton(token, index) {
  return `<button class="${tokenClass(token, index)}" type="button" data-token="${index}" title="${escapeHtml(token)}">${escapeHtml(token)}</button>`;
}

function tokenClass(token, index) {
  const lengthClass = tokenSizeClass(token);
  const sameClass = state.step === 0 && index !== state.selected && tokenKey(token) === tokenKey(state.tokens[state.selected]) ? " is-same" : "";
  return `token ${index === state.selected ? "is-active" : ""}${sameClass}${lengthClass}`;
}

function tokenSizeClass(token) {
  return token.length > 14 ? " is-very-long" : token.length > 9 ? " is-long" : "";
}

function selectedEmbeddingPanel() {
  const token = state.tokens[state.selected] || "";
  const matches = state.tokens
    .map((candidate, index) => ({ candidate, index }))
    .filter((item) => tokenKey(item.candidate) === tokenKey(token));
  return `
    <div class="embedding-panel">
      <div>
        <h3>Selected embedding</h3>
        <div class="formula">
          <span class="chip teal">e_${escapeHtml(shortLabel(token))}</span>
          <span class="chip">${formatVec(tokenVector(token), 4)}</span>
        </div>
      </div>
      <div>
        <h3>Same token slots</h3>
        <div class="same-slots">${matches.map((item) => `<span class="slot-mini">${item.index}</span>`).join("")}</div>
      </div>
    </div>
  `;
}

function orderPanel(sentence) {
  const tokens = tokenize(sentence);
  const active = activeOrderToken();
  return `
    <div class="order-panel">
      <h3>${escapeHtml(sentence)}</h3>
      <div class="order-slots">
        ${tokens.map((token, index) => `
          <button class="token ${tokenKey(token) === active ? "is-active" : ""}${tokenSizeClass(token)}" type="button" data-order-token="${escapeHtml(tokenKey(token))}">
            <span class="slot-mini">${index}</span>
            <span>${escapeHtml(token)}</span>
            ${miniVectorBars(token)}
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

function sameEmbeddingStatement(token) {
  const first = tokenize("Dog bites man").findIndex((item) => tokenKey(item) === token);
  const second = tokenize("Man bites dog").findIndex((item) => tokenKey(item) === token);
  const slots = first >= 0 && second >= 0 ? `slot ${first} = slot ${second}` : "same vector";
  return `e_${token}: ${slots}`;
}

function positionLookup(position, token) {
  const positions = activeTokens().map((_, index) => state.start + index);
  return `
    <div class="lookup-strip">
      <div class="lookup-node">
        <span>position id</span>
        <strong>${position}</strong>
      </div>
      <div class="lookup-node one-hot-node">
        <span>one-hot selector</span>
        <div class="one-hot-row" aria-label="one-hot position selector">
          ${positions.map((pos) => `<span class="${pos === position ? "is-hot" : ""}">${pos === position ? "1" : "0"}</span>`).join("")}
        </div>
      </div>
      <div class="lookup-node wide">
        <span>selected row</span>
        <strong class="position-row">p_${position}</strong>
        <small>add this position vector to e_${escapeHtml(shortLabel(token))}</small>
      </div>
      <p class="lookup-caption">The coordinate buttons only change the 2D view; e_${escapeHtml(shortLabel(token))} stays fixed.</p>
    </div>
  `;
}

function dimensionMap(token) {
  const vec = tokenVector(token);
  const selectedStart = state.pair * 2;
  const selectedEnd = selectedStart + 1;
  const label = escapeHtml(shortLabel(token));
  return `
    <div class="dimension-map">
      <div class="dimension-header">
        <span>same fixed vector</span>
        <strong>e_${label}</strong>
        <small>8 coordinates</small>
      </div>
      <div class="dimension-equation">
        <span class="vector-bracket">[</span>
        <div class="dimension-strip" aria-label="Eight embedding coordinates">
          ${vec.map((value, index) => `
            <span class="dimension-cell ${index === selectedStart || index === selectedEnd ? "is-selected" : ""}">
              <b>${coordLabel(index)}</b>
              <strong>${value.toFixed(2)}</strong>
            </span>
          `).join("")}
        </div>
        <span class="vector-bracket">]</span>
      </div>
      <div class="axis-choice">
        <span class="axis-pill x-axis">x = ${coordLabel(selectedStart)}</span>
        <span class="axis-pill y-axis">y = ${coordLabel(selectedEnd)}</span>
        <span class="axis-pill muted-axis">one point = (${vec[selectedStart].toFixed(2)}, ${vec[selectedEnd].toFixed(2)})</span>
      </div>
    </div>
  `;
}

function shiftLesson() {
  const tokens = activeTokens();
  return `
    <div class="shift-panel">
      <div class="position-strip">
        <span class="strip-label">start 0</span>
        ${tokens.map((token, index) => `<span><b>${index}</b>${escapeHtml(shortLabel(token))}</span>`).join("")}
      </div>
      <div class="position-strip">
        <span class="strip-label">start ${state.start}</span>
        ${tokens.map((token, index) => `<span><b>${state.start + index}</b>${escapeHtml(shortLabel(token))}</span>`).join("")}
      </div>
      <div class="formula">
        <span class="chip amber">same token e</span>
        <span class="chip amber">different p ids</span>
        <span class="chip teal">compare heatmaps below</span>
      </div>
    </div>
  `;
}

function thetaLesson() {
  const freq = invFreq(state.pair);
  return `
    <div class="theta-panel">
      <div class="formula">
        <span class="chip amber">freq ${freq.toFixed(4)}</span>
        <span class="chip teal">pos 11 -> angle ${(11 * freq).toFixed(2)}</span>
      </div>
      <div class="theta-compare">
        <span><strong>lower theta</strong> positions separate fast</span>
        <span><strong>higher theta</strong> positions drift slowly</span>
      </div>
    </div>
  `;
}

function angleEquation(position, freq) {
  const angle = position * freq;
  return `
    <div class="calc-card">
      <div class="calc-title">Angle calculation</div>
      <div class="calc-flow">
        <span><b>position id</b><strong>${formatScalar(position)}</strong></span>
        <i>x</i>
        <span><b>frequency</b><strong>${freq.toFixed(4)}</strong></span>
        <i>=</i>
        <span class="is-result"><b>angle</b><strong>${angle.toFixed(2)}</strong></span>
      </div>
    </div>
  `;
}

function thetaEquation() {
  const pairIndex = state.pair;
  const exponent = (-2 * pairIndex) / DIM;
  const freq = invFreq(state.pair);
  return `
    <div class="calc-card">
      <div class="calc-title">Frequency from theta: pair i=${pairIndex}, embedding width D=${DIM}</div>
      <div class="calc-flow">
        <span><b>theta</b><strong>${formatThetaBase(thetaBase())}</strong></span>
        <i>^</i>
        <span><b>exponent</b><strong>${exponent.toFixed(2)}</strong></span>
        <i>=</i>
        <span class="is-result"><b>frequency</b><strong>${freq.toFixed(4)}</strong></span>
      </div>
    </div>
  `;
}

function positionRotationLesson(position) {
  const freq = invFreq(state.pair);
  return `
    <div class="angle-strip">
      <span class="angle-card"><b>pos 0</b><strong>angle 0.00</strong></span>
      <span class="angle-card is-active"><b>pos ${formatScalar(position)}</b><strong>angle ${(position * freq).toFixed(2)}</strong></span>
      <span class="angle-card"><b>length</b><strong>unchanged</strong></span>
    </div>
  `;
}

function thetaAngleTable() {
  const freq = invFreq(state.pair);
  return `
    <div class="angle-strip">
      ${[0, 3, 6, 9, 11].map((position) => `
        <span class="angle-card">
          <b>pos ${position}</b>
          <strong>${(position * freq).toFixed(2)}</strong>
        </span>
      `).join("")}
    </div>
  `;
}

function relativeLesson() {
  const tokens = activeTokens();
  const { left, right, distance } = relativePair();
  const addBefore = similarityMatrix("add", 0)[left][right];
  const addAfter = similarityMatrix("add", state.start)[left][right];
  const ropeBefore = similarityMatrix("rope", 0)[left][right];
  const ropeAfter = similarityMatrix("rope", state.start)[left][right];
  return `
    <div class="shift-panel relative-panel">
      ${relativePicker(tokens, left, right)}
      <div class="relative-ruler">
        ${relativeRow("start 0", 0, left, right, tokens)}
        ${relativeRow(`start ${state.start}`, state.start, left, right, tokens)}
      </div>
      ${relativeScoreCard(distance, addBefore, addAfter, ropeBefore, ropeAfter)}
    </div>
  `;
}

function relativeScoreCard(distance, addBefore, addAfter, ropeBefore, ropeAfter) {
  return `
    <div class="score-card">
      <div class="score-pill">offset = ${signedDistance(distance)}</div>
      <div class="score-table">
        <span></span>
        <span>before</span>
        <span>after shift</span>
        <b>Abs add</b>
        <strong>${addBefore.toFixed(2)}</strong>
        <strong>${addAfter.toFixed(2)}</strong>
        <b>RoPE</b>
        <strong>${ropeBefore.toFixed(2)}</strong>
        <strong>${ropeAfter.toFixed(2)}</strong>
      </div>
    </div>
  `;
}

function relativePair() {
  const tokens = activeTokens();
  syncRelativePair();
  const left = state.relativeLeft;
  const right = state.relativeRight;
  return { left, right, distance: right - left };
}

function syncRelativePair() {
  const tokens = activeTokens();
  const max = Math.max(0, tokens.length - 1);
  state.relativeLeft = clamp(state.relativeLeft, 0, max);
  state.relativeRight = clamp(state.relativeRight, 0, max);
  if (tokens.length > 1 && state.relativeLeft === state.relativeRight) {
    state.relativeRight = state.relativeLeft === max ? state.relativeLeft - 1 : state.relativeLeft + 1;
  }
}

function relativePicker(tokens, left, right) {
  return `
    <div class="relative-picker">
      ${relativePickerRow("word A", "left", left, tokens)}
      ${relativePickerRow("word B", "right", right, tokens)}
    </div>
  `;
}

function relativePickerRow(label, side, active, tokens) {
  return `
    <div class="picker-line">
      <span class="strip-label">${label}</span>
      <div class="picker-tokens">
        ${tokens.map((token, index) => `
          <button class="token picker-token ${index === active ? "is-active" : ""}${tokenSizeClass(token)}" type="button" data-relative-${side}="${index}" title="${escapeHtml(token)}">
            <span class="slot-mini">${index}</span>
            ${escapeHtml(shortLabel(token))}
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

function relativeRow(label, start, left, right, tokens) {
  return `
    <div class="relative-row">
      <span class="strip-label">${escapeHtml(label)}</span>
      ${tokens.map((token, index) => `
        <span class="relative-slot ${index === left || index === right ? "is-focus" : ""}">
          <b>${start + index}</b>
          ${index === left || index === right ? escapeHtml(shortLabel(token)) : ""}
        </span>
      `).join("")}
    </div>
  `;
}

function thetaSweepSvg() {
  const width = 560;
  const height = 380;
  const token = activeTokens()[state.selected];
  const baseVector = tokenVector(token);
  const targetPosition = 11;
  const freq = invFreq(state.pair);
  const angle = targetPosition * freq;
  const basePair = pairPoint(baseVector, state.pair);
  const rotatedPair = pairPoint(rotateVector(baseVector, targetPosition), state.pair);
  const displayRadius = 92;
  const base = directionToSvg(basePair, displayRadius);
  const last = directionToSvg(rotatedPair, displayRadius);
  const orbitRadius = Math.max(30, Math.hypot(base.x, base.y));
  const color = colorFor(state.selected);
  const arc = rotationArcPath(orbitRadius + 18, base, angle);
  const parts = [
    `<svg viewBox="${-width / 2} ${-height / 2} ${width} ${height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Theta rotation diagram">`,
    `<circle class="ring" cx="0" cy="0" r="${VECTOR_SCALE}" />`,
    `<circle class="ring" cx="0" cy="0" r="${VECTOR_SCALE * 1.65}" />`,
    `<circle class="rotation-orbit" cx="0" cy="0" r="${orbitRadius}" />`,
    `<line class="axis" x1="-240" y1="0" x2="240" y2="0" />`,
    `<line class="axis" x1="0" y1="170" x2="0" y2="-170" />`,
    `<text class="axis-label" x="244" y="-8">${coordLabel(state.pair * 2)}</text>`,
    `<text class="axis-label" x="8" y="-174">${coordLabel(state.pair * 2 + 1)}</text>`,
    drawVector(base.x, base.y, "#8d9996", "theta-base"),
    arc ? `<path class="angle-arc" d="${arc}" stroke="${color}" />` : "",
    drawVector(last.x, last.y, color, ""),
    `<circle class="theta-point base-point" cx="${base.x}" cy="${base.y}" r="5.6" />`,
    `<circle class="theta-point end-point" cx="${last.x}" cy="${last.y}" r="7" fill="${color}" />`,
    thetaBadge("pos 0", base.x, base.y, "base"),
    thetaBadge("pos 11", last.x, last.y, "end"),
    `<text class="angle-label" x="-252" y="-150">angle = 11 x ${freq.toFixed(4)}</text>`
  ];
  parts.push(`</svg>`);
  return parts.join("");
}

function thetaBadge(text, x, y, tone) {
  const width = 54;
  const height = 24;
  const lx = clamp(x + (x >= 0 ? 12 : -width - 12), -260, 206);
  const ly = clamp(y - 34, -176, 150);
  return `<g class="theta-badge ${tone}"><rect x="${lx}" y="${ly}" width="${width}" height="${height}" /><text x="${lx + 8}" y="${ly + 16}">${text}</text></g>`;
}

function directionToSvg(point, radius) {
  const length = Math.hypot(point.x, point.y) || 1;
  return { x: (point.x / length) * radius, y: (-point.y / length) * radius };
}

function vectorSvg({ mode, showAll, positionOverride = null }) {
  const width = 560;
  const height = 380;
  const items = activeTokens().map((token, index) => {
    const position = positionOverride !== null && index === state.selected ? positionOverride : state.start + index;
    return {
      token,
      index,
      base: tokenVector(token),
      output: transformedVector(token, position, mode)
    };
  });
  const visible = showAll ? items : [items[state.selected]];
  const parts = [
    `<svg viewBox="${-width / 2} ${-height / 2} ${width} ${height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="2D vector plane">`,
    `<circle class="ring" cx="0" cy="0" r="${VECTOR_SCALE}" />`,
    `<circle class="ring" cx="0" cy="0" r="${VECTOR_SCALE * 1.65}" />`,
    `<line class="axis" x1="-240" y1="0" x2="240" y2="0" />`,
    `<line class="axis" x1="0" y1="170" x2="0" y2="-170" />`,
    `<text class="axis-label" x="244" y="-8">${coordLabel(state.pair * 2)}</text>`,
    `<text class="axis-label" x="8" y="-174">${coordLabel(state.pair * 2 + 1)}</text>`
  ];

  visible.forEach((item) => {
    const color = colorFor(item.index);
    const base = toSvg(pairPoint(item.base, state.pair));
    const out = toSvg(pairPoint(item.output, state.pair));
    const selected = item.index === state.selected;
    const quiet = showAll && !selected;
    if (mode !== "none" && !quiet) {
      parts.push(drawVector(base.x, base.y, color, "faint"));
      parts.push(drawTransform(base, out, color, mode, item.index));
    }
    parts.push(`<g class="point-hit" tabindex="0" role="button" data-token="${item.index}">`);
    if (!quiet) parts.push(drawVector(out.x, out.y, color, ""));
    if (selected) parts.push(`<circle class="dot-halo" cx="${out.x}" cy="${out.y}" r="13" stroke="${color}" />`);
    parts.push(`<circle class="dot ${quiet ? "quiet" : ""}" cx="${out.x}" cy="${out.y}" r="${selected ? 9 : 6.8}" fill="${color}" />`);
    parts.push(`<circle cx="${out.x}" cy="${out.y}" r="24" fill="transparent" />`);
    if (!quiet) parts.push(drawLabel(item.token, out.x, out.y, selected, color));
    parts.push(`</g>`);
  });
  parts.push(`</svg>`);
  return parts.join("");
}

function drawVector(x, y, color, extra) {
  const head = arrowHead(0, 0, x, y, 9);
  return `<line class="vec ${extra}" x1="0" y1="0" x2="${x}" y2="${y}" stroke="${color}" /><polygon points="${head}" fill="${color}" opacity="${extra === "faint" ? 0.35 : 1}" />`;
}

function drawTransform(from, to, color, mode, index) {
  if (mode === "rope") {
    const r = Math.max(34, Math.hypot(from.x, from.y) + 16 + index * 2);
    const start = Math.atan2(-from.y, from.x);
    const end = Math.atan2(-to.y, to.x);
    return `<path class="dash" d="${arcPath(0, 0, r, start, end)}" stroke="${color}" />`;
  }
  return `<line class="dash" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="${color}" />`;
}

function drawLabel(token, x, y, selected, color) {
  const safe = escapeHtml(shortLabel(token));
  const width = Math.max(34, safe.length * 8 + 16);
  const lx = x + (x >= 0 ? 10 : -width - 10);
  const ly = y - 25;
  return `<g class="label"><rect x="${lx}" y="${ly}" width="${width}" height="24" stroke="${selected ? color : ""}" /><text x="${lx + 8}" y="${ly + 16}">${safe}</text></g>`;
}

function heatmap(mode, start) {
  const tokens = activeTokens();
  const labels = tokens.length > 8 ? tokens.map((_, index) => String(index)) : tokens.map(shortLabel);
  const titles = tokens.map(shortLabel);
  const matrix = similarityMatrix(mode, start);
  const size = labels.length;
  const focused = state.step === 7 ? new Set([state.relativeLeft, state.relativeRight]) : new Set([state.selected]);
  return `
    <div class="heatmap">
      <div></div>
      <div class="heat-x" style="grid-template-columns: repeat(${size}, minmax(18px, 1fr));">${labels.map((label) => `<span>${escapeHtml(label)}</span>`).join("")}</div>
      <div class="heat-y" style="grid-template-rows: repeat(${size}, minmax(22px, 1fr));">${labels.map((label) => `<span>${escapeHtml(label)}</span>`).join("")}</div>
      <div class="heat-cells" style="grid-template-columns: repeat(${size}, minmax(18px, 1fr)); grid-template-rows: repeat(${size}, minmax(22px, 1fr));">
        ${matrix.flatMap((row, rowIndex) => row.map((value, colIndex) => `<span class="heat-cell ${focused.has(rowIndex) || focused.has(colIndex) ? "is-focus" : ""}" title="${titles[rowIndex]} -> ${titles[colIndex]} ${value.toFixed(2)}" style="background:${similarityColor(value)}"></span>`)).join("")}
      </div>
    </div>
  `;
}

function attentionBars() {
  const matrix = similarityMatrix(state.mode, state.start);
  const scores = softmax(matrix[state.selected].map((value) => value * 2.2));
  const tokens = activeTokens();
  const position = state.start + state.selected;
  const selectedToken = tokens[state.selected];
  const coords = pairPoint(transformedVector(selectedToken, position, state.mode), state.pair);
  return `
    <div class="formula"><span class="chip teal">from ${escapeHtml(tokens[state.selected])}</span><span class="chip">${modeLabel(state.mode)}</span></div>
    <div class="coord-readout">
      <span><b>position id</b><strong>${position}</strong></span>
      <span><b>shown coords</b><strong>${formatPair(coords)}</strong></span>
    </div>
    ${scores.map((score, index) => `
      <div class="score-line">
        <span>${escapeHtml(tokens[index])}</span>
        <strong>${score.toFixed(2)}</strong>
      </div>
    `).join("")}
  `;
}

function bindStepBody() {
  bindTokenHits(document);
  document.querySelectorAll("[data-pair]").forEach((button) => {
    button.addEventListener("click", () => {
      state.pair = Number(button.dataset.pair);
      render();
    });
  });
  document.querySelectorAll("[data-relative-left]").forEach((button) => {
    button.addEventListener("click", () => {
      state.relativeLeft = Number(button.dataset.relativeLeft);
      syncRelativePair();
      render();
    });
  });
  document.querySelectorAll("[data-relative-right]").forEach((button) => {
    button.addEventListener("click", () => {
      state.relativeRight = Number(button.dataset.relativeRight);
      syncRelativePair();
      render();
    });
  });
  document.querySelectorAll("[data-funny-example]").forEach((button) => {
    button.addEventListener("click", () => {
      state.funnyExample = Number(button.dataset.funnyExample);
      state.funnyVariant = 0;
      render();
    });
  });
  document.querySelectorAll("[data-funny-variant]").forEach((button) => {
    button.addEventListener("click", () => {
      state.funnyVariant = Number(button.dataset.funnyVariant);
      render();
    });
  });
  const sentenceSelect = document.getElementById("sentenceSelect");
  if (sentenceSelect) {
    sentenceSelect.addEventListener("change", () => {
      state.sentence = sentenceSelect.value;
      state.tokens = tokenize(state.sentence);
      state.selected = clamp(state.selected, 0, state.tokens.length - 1);
      syncRelativePair();
      render();
    });
  }
  const custom = document.getElementById("customSentence");
  if (custom) {
    custom.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        applyCustomSentence(custom.value);
      }
    });
  }
  const customApply = document.getElementById("customApply");
  if (customApply && custom) {
    customApply.addEventListener("click", () => applyCustomSentence(custom.value));
  }
  const pair = document.getElementById("pairSlider");
  if (pair) {
    pair.addEventListener("input", () => {
      state.pair = Number(pair.value);
      render();
    });
  }
  const position = document.getElementById("positionSlider");
  if (position) {
    position.addEventListener("input", () => {
      state.start = Number(position.value);
      position.style.setProperty("--fill", `${rangeFill(state.start, 0, 12)}%`);
      updatePositionLive();
    });
    position.addEventListener("change", render);
  }
  const rotationPosition = document.getElementById("rotationPositionSlider");
  if (rotationPosition) {
    rotationPosition.addEventListener("input", () => {
      state.rotationPosition = Number(rotationPosition.value);
      rotationPosition.style.setProperty("--fill", `${rangeFill(state.rotationPosition, 0, 12)}%`);
      updateRotationPositionLive();
    });
    rotationPosition.addEventListener("change", render);
  }
  const theta = document.getElementById("thetaSlider");
  if (theta) {
    theta.addEventListener("input", () => {
      state.thetaLog = Number(theta.value);
      theta.style.setProperty("--fill", `${rangeFill(state.thetaLog, THETA_LOG_MIN, THETA_LOG_MAX)}%`);
      updateThetaLive();
    });
    theta.addEventListener("change", render);
  }
  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.mode = button.dataset.mode;
      render();
    });
  });
  document.querySelectorAll("[data-order-token]").forEach((button) => {
    button.addEventListener("click", () => {
      state.orderToken = button.dataset.orderToken;
      render();
    });
  });
}

function bindTokenHits(root) {
  root.querySelectorAll("[data-token]").forEach((node) => {
    node.addEventListener("click", () => {
      state.selected = Number(node.dataset.token);
      if (state.step === 5) state.rotationPosition = state.selected;
      render();
    });
    node.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        state.selected = Number(node.dataset.token);
        if (state.step === 5) state.rotationPosition = state.selected;
        render();
      }
    });
  });
}

function updateRotationPositionLive() {
  const label = document.getElementById("rotationPositionLabel");
  if (label) label.textContent = `position id: ${formatScalar(state.rotationPosition)}`;
  scheduleLiveUpdate(() => {
    const plane = document.getElementById("rotationPlane");
    if (plane) {
      plane.innerHTML = rotationPlane();
      bindTokenHits(plane);
    }
    const details = document.getElementById("rotationDetails");
    if (details) details.innerHTML = rotationDetails(state.rotationPosition);
  });
}

function updateThetaLive() {
  const label = document.getElementById("thetaLabel");
  if (label) label.textContent = `theta base: ${formatThetaBase(thetaBase())}`;
  scheduleLiveUpdate(() => {
    const plane = document.getElementById("thetaPlane");
    if (plane) plane.innerHTML = thetaSweepSvg();
    const details = document.getElementById("thetaDetails");
    if (details) details.innerHTML = thetaDetails();
    const experimentPlane = document.getElementById("experimentPlane");
    if (experimentPlane) {
      experimentPlane.innerHTML = vectorSvg({ mode: state.mode, showAll: true });
      bindTokenHits(experimentPlane);
    }
    const experimentDetails = document.getElementById("experimentDetails");
    if (experimentDetails) {
      experimentDetails.innerHTML = `<h3>Selected output</h3>${attentionBars()}`;
    }
  });
}

function updatePositionLive() {
  const label = document.getElementById("positionLabel");
  if (label) label.textContent = `start position: ${state.start}`;
  scheduleLiveUpdate(() => {
    const experimentPlane = document.getElementById("experimentPlane");
    if (experimentPlane) {
      experimentPlane.innerHTML = vectorSvg({ mode: state.mode, showAll: true });
      bindTokenHits(experimentPlane);
    }
    const experimentDetails = document.getElementById("experimentDetails");
    if (experimentDetails) {
      experimentDetails.innerHTML = `<h3>Selected output</h3>${attentionBars()}`;
    }
  });
}

function scheduleLiveUpdate(callback) {
  if (liveUpdateFrame) cancelAnimationFrame(liveUpdateFrame);
  liveUpdateFrame = requestAnimationFrame(() => {
    liveUpdateFrame = 0;
    callback();
  });
}

function scrollToLessonTop() {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  requestAnimationFrame(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth"
    });
  });
}

function applyCustomSentence(value) {
  const next = tokenize(value);
  if (!next.length) return;
  state.sentence = next.join(" ");
  state.tokens = next;
  state.selected = clamp(state.selected, 0, state.tokens.length - 1);
  syncRelativePair();
  render();
}

function runStepAction() {
  if (state.step === 0) {
    state.sentence = SENTENCES[5];
    state.tokens = tokenize(state.sentence);
    state.selected = 2;
  } else if (state.step === 1) {
    state.selected = (state.selected + 1) % activeTokens().length;
  } else if (state.step === 2) {
    const orderTokens = ["dog", "man", "bites"];
    const nextOrder = orderTokens.indexOf(activeOrderToken()) + 1;
    state.orderToken = orderTokens[nextOrder % orderTokens.length];
  } else if (state.step === 3) {
    state.start = state.start >= 5 ? 0 : state.start + 1;
  } else if (state.step === 4 || state.step === 7) {
    state.start = state.start >= 10 ? 0 : state.start + 3;
  } else if (state.step === 5) {
    state.rotationPosition = state.rotationPosition >= 11.9 ? 0 : state.rotationPosition + 1.5;
  } else if (state.step === 6) {
    state.thetaLog = state.thetaLog <= THETA_LOG_MIN + 0.05 ? 2 : state.thetaLog <= 2.05 ? 4 : THETA_LOG_MIN;
  } else if (state.step === 8) {
    state.mode = state.mode === "rope" ? "add" : state.mode === "add" ? "none" : "rope";
  } else {
    const variants = FUNNY_EXAMPLES[state.funnyExample].variants;
    state.funnyVariant = (state.funnyVariant + 1) % variants.length;
  }
  render();
}

function tryLabel() {
  return ["Change example", "Next token", "Next word", "Move p", "Shift", "Move pos", "Change theta", "Shift", "Cycle method", "Move word"][state.step];
}

function tokenize(text) {
  return (text || "")
    .split(/\s+/)
    .map((token) => token.trim().replace(/[^\w'-]/g, "").slice(0, 24))
    .filter(Boolean)
    .slice(0, MAX_TOKENS);
}

function activeTokens() {
  return state.step === 0 ? state.tokens : state.tokens.slice(0, MAX_VISUAL_TOKENS);
}

function activeOrderToken() {
  return state.orderToken;
}

function miniVectorBars(token) {
  return miniBars(tokenVector(token), 4);
}

function miniBars(values, count = 4) {
  return `<span class="mini-bars" aria-hidden="true">${values.slice(0, count).map((value) => `<span style="--h:${Math.round((Math.abs(value) * 0.78 + 0.18) * 100)}%; --c:${value >= 0 ? "var(--teal)" : "var(--amber)"}"></span>`).join("")}</span>`;
}

function pairButton(pair) {
  const freq = invFreq(pair);
  const detail = state.step === 3 ? `same e, view ${pair * 2}-${pair * 2 + 1}` : `freq ${freq.toFixed(4)}`;
  return `
    <button class="pair-button ${pair === state.pair ? "is-active" : ""}" type="button" data-pair="${pair}">
      <strong>${coordPairDisplay(pair)}</strong>
      <span>${detail}</span>
    </button>
  `;
}

function pairSpeed(pair) {
  return clamp(invFreq(pair) * 100, 6, 100).toFixed(1);
}

function coordLabel(index) {
  return `e[${index}]`;
}

function coordPairLabel(pair) {
  return `${pair * 2},${pair * 2 + 1}`;
}

function coordPairDisplay(pair) {
  return `${coordLabel(pair * 2)}, ${coordLabel(pair * 2 + 1)}`;
}

function tokenVector(token) {
  const key = token.toLowerCase();
  const base = WORD_FEATURES[key] || Array.from({ length: DIM }, (_, index) => hashUnit(key, index) * 0.9);
  return normalize(base.map((value, index) => value + hashUnit(`${key}:${index}`, index + 13) * 0.08), 1.34);
}

function positionalVector(position) {
  const out = Array(DIM).fill(0);
  for (let pair = 0; pair < DIM / 2; pair += 1) {
    const angle = position * invFreq(pair);
    out[pair * 2] = Math.sin(angle);
    out[pair * 2 + 1] = Math.cos(angle);
  }
  return out;
}

function transformedVector(token, position, mode) {
  const base = tokenVector(token);
  if (mode === "none") return base;
  if (mode === "add") {
    const pos = positionalVector(position);
    return base.map((value, index) => value + pos[index] * POS_SCALE);
  }
  return rotateVector(base, position);
}

function rotateVector(vec, position) {
  const out = [...vec];
  for (let pair = 0; pair < DIM / 2; pair += 1) {
    const x = vec[pair * 2];
    const y = vec[pair * 2 + 1];
    const angle = position * invFreq(pair);
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    out[pair * 2] = x * c - y * s;
    out[pair * 2 + 1] = x * s + y * c;
  }
  return out;
}

function similarityMatrix(mode, start) {
  const vectors = activeTokens().map((token, index) => normalize(transformedVector(token, start + index, mode), 1));
  return vectors.map((a) => vectors.map((b) => cosine(a, b)));
}

function matrixStability(a, b) {
  let total = 0;
  let count = 0;
  for (let row = 0; row < a.length; row += 1) {
    for (let col = 0; col < a[row].length; col += 1) {
      total += Math.abs(a[row][col] - b[row][col]);
      count += 1;
    }
  }
  return clamp(1 - total / Math.max(1, count) / 1.2, 0, 1);
}

function pairPoint(vec, pair) {
  return { x: vec[pair * 2], y: vec[pair * 2 + 1] };
}

function toSvg(point) {
  return { x: point.x * VECTOR_SCALE, y: -point.y * VECTOR_SCALE };
}

function invFreq(pair) {
  return Math.pow(thetaBase(), (-2 * pair) / DIM);
}

function thetaBase() {
  return Math.pow(10, state.thetaLog);
}

function normalize(vec, target = 1) {
  const length = Math.hypot(...vec) || 1;
  return vec.map((value) => (value / length) * target);
}

function cosine(a, b) {
  const dot = a.reduce((sum, value, index) => sum + value * b[index], 0);
  return clamp(dot / ((Math.hypot(...a) || 1) * (Math.hypot(...b) || 1)), -1, 1);
}

function softmax(values) {
  const max = Math.max(...values);
  const exp = values.map((value) => Math.exp(value - max));
  const total = exp.reduce((sum, value) => sum + value, 0) || 1;
  return exp.map((value) => value / total);
}

function hashUnit(input, salt = 0) {
  let h = 2166136261 + salt * 16777619;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) / 4294967295) * 2 - 1;
}

function colorFor(index) {
  return index === state.selected ? "#c66d12" : COLORS[index % COLORS.length];
}

function arrowHead(x1, y1, x2, y2, size) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const a1 = angle + Math.PI * 0.82;
  const a2 = angle - Math.PI * 0.82;
  return `${x2},${y2} ${x2 + Math.cos(a1) * size},${y2 + Math.sin(a1) * size} ${x2 + Math.cos(a2) * size},${y2 + Math.sin(a2) * size}`;
}

function arcPath(cx, cy, radius, startAngle, endAngle) {
  let delta = endAngle - startAngle;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  const end = startAngle + delta;
  const start = { x: cx + radius * Math.cos(startAngle), y: cy - radius * Math.sin(startAngle) };
  const stop = { x: cx + radius * Math.cos(end), y: cy - radius * Math.sin(end) };
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 ${delta < 0 ? 1 : 0} ${stop.x} ${stop.y}`;
}

function rotationArcPath(radius, basePoint, angle) {
  const startAngle = Math.atan2(-basePoint.y, basePoint.x);
  let delta = angle % (Math.PI * 2);
  if (delta < 0) delta += Math.PI * 2;
  if (delta < 0.04) return "";
  const endAngle = startAngle + delta;
  const start = { x: radius * Math.cos(startAngle), y: -radius * Math.sin(startAngle) };
  const stop = { x: radius * Math.cos(endAngle), y: -radius * Math.sin(endAngle) };
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${delta > Math.PI ? 1 : 0} 0 ${stop.x} ${stop.y}`;
}

function similarityColor(value) {
  const mid = [250, 249, 245];
  const high = [7, 135, 127];
  const low = [226, 139, 40];
  const target = value >= 0 ? high : low;
  const t = Math.pow(Math.abs(value), 0.72);
  return `rgb(${mid.map((part, index) => Math.round(part + (target[index] - part) * t)).join(", ")})`;
}

function shortLabel(token) {
  return token.length > 5 ? `${token.slice(0, 4)}.` : token;
}

function formatPair(point) {
  return `(${point.x.toFixed(2)}, ${point.y.toFixed(2)})`;
}

function formatScalar(value) {
  return Math.abs(value - Math.round(value)) < 0.005 ? String(Math.round(value)) : value.toFixed(2);
}

function formatVec(vec, count) {
  return `[${vec.slice(0, count).map((value) => value.toFixed(2)).join(", ")}...]`;
}

function formatThetaBase(value) {
  if (value >= 100000) return "100k";
  if (value >= 1000) return `${Math.round(value / 1000)}k`;
  return Math.round(value).toString();
}

function signedDistance(value) {
  return value > 0 ? `+${value}` : String(value);
}

function rangeFill(value, min, max) {
  if (max <= min) return 0;
  return clamp(((value - min) / (max - min)) * 100, 0, 100).toFixed(1);
}

function modeLabel(mode) {
  if (mode === "add") return "Abs add";
  if (mode === "rope") return "RoPE";
  return "None";
}

function tokenKey(token) {
  return String(token || "").toLowerCase();
}

function isPresetSentence(sentence) {
  return SENTENCES.includes(sentence);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
