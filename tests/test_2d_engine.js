const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

let code = fs.readFileSync("app.js", "utf8");
code = code.split('document.getElementById("loadPieces").onclick')[0];

const inputs = {
  levels: { value: "1" },
  pieceCount: { value: "3" },
  comboCount: { value: "6" },
  attempts: { value: "240" },
  seed: { value: "314159" },
  manualMode: { checked: false },
  cardNumber: { value: "7" },
  targetCellSize: { value: "14.5" },
  status: { textContent: "" },
  generationOverlayText: { textContent: "" },
};

global.document = {
  getElementById(id) {
    return inputs[id] || null;
  },
};
global.localStorage = {
  getItem() { return null; },
  setItem() {},
  removeItem() {},
};

vm.runInThisContext(code, { filename: "app.js" });
appMode = MODE_2D;
pieces = validatePieces(structuredClone(BUILTIN_2D_PIECES), MODE_2D);
piecesByMode[MODE_2D] = pieces;
pieceSelectionById = {};
generationHistory = emptyGenerationHistory();
generationHistoriesByMode[MODE_2D] = generationHistory;

assert.strictEqual(pieces.length, 12);
assert.deepStrictEqual(pieces.map((piece) => piece.cells.length), [5, 2, 4, 5, 4, 3, 4, 4, 5, 3, 4, 5]);
assert.strictEqual(pieces.reduce((sum, piece) => sum + piece.cells.length, 0), 48);

function canonical2d(piece) {
  return orientations2d(piece.cells)
    .map((orientation) => serialize(orientation))
    .sort()[0];
}

assert.strictEqual(new Set(pieces.map(canonical2d)).size, 12);
assert.strictEqual(orientations2d(pieces.find((piece) => piece.id === "D01").cells).length, 8);
assert.strictEqual(orientations2d(pieces.find((piece) => piece.id === "D07").cells).length, 1);

for (const id of ["D02", "D10", "D11"]) {
  const compact = minimize2dPreviewHeight(pieces.find((piece) => piece.id === id));
  assert.strictEqual(dimensions2d(compact).rows, 1);
}
assert.deepStrictEqual(dimensions2d(minimize2dPreviewHeight(pieces.find((piece) => piece.id === "D12"))), { columns: 4, rows: 2 });
assert.deepStrictEqual(dimensions2d(minimize2dPreviewHeight(pieces.find((piece) => piece.id === "D09"))), { columns: 3, rows: 3 });

function fakeSvgNode() {
  return {
    attributes: {},
    children: [],
    setAttribute(name, value) { this.attributes[name] = String(value); },
    getAttribute(name) { return this.attributes[name] ?? null; },
    appendChild(child) { this.children.push(child); return child; },
  };
}

document.createElementNS = () => fakeSvgNode();
const previewContainer = fakeSvgNode();
const fixedCellPreview = drawPiece2d(
  previewContainer,
  pieces.find((piece) => piece.id === "D11"),
  { compact: true, width: 50, height: 30, cellSize: 10, minimizeHeight: true },
);
assert.strictEqual(fixedCellPreview.getAttribute("width"), "50");
assert.strictEqual(fixedCellPreview.getAttribute("height"), "30");
assert.strictEqual(fixedCellPreview.getAttribute("data-cell-size"), "10");
assert.strictEqual(fixedCellPreview.getAttribute("data-columns"), "4");
assert.strictEqual(fixedCellPreview.getAttribute("data-rows"), "1");
assert.ok(fixedCellPreview.children.every((cell) =>
  cell.getAttribute("width") === "10" && cell.getAttribute("height") === "10"));

function verifyCard(card, expectedPieceCount) {
  assert.strictEqual(card.mode, MODE_2D);
  assert.strictEqual(card.levels, 1);
  assert.strictEqual(card.w, 7);
  assert.strictEqual(card.h, 5);
  assert.strictEqual(card.tasks.length, 1);
  assert.strictEqual(card.combos.length, 6);
  assert.strictEqual(card.incomplete, false);
  assert.strictEqual(card.challengeCode, `2D-${expectedPieceCount}-07`);
  assert.strictEqual(new Set(card.combos.map((combo) => pieceSetSignature(combo.pieces))).size, 6);
  const target = new Set(card.target.map(key));
  for (const combo of card.combos) {
    assert.strictEqual(combo.pieces.length, expectedPieceCount);
    const occupied = combo.solution.flatMap((placement) => placement.cubes);
    assert.strictEqual(occupied.length, target.size);
    assert.strictEqual(new Set(occupied.map(key)).size, target.size);
    assert.ok(occupied.every((cell) => target.has(key(cell))));
  }
  assert.ok(connected(card.target));
  assert.ok(!isPlainRectangularTarget(card.target));
}

const card3 = generateCardWithRetries(8);
verifyCard(card3, 3);

inputs.pieceCount.value = "4";
inputs.seed.value = "271828";
generationHistory = emptyGenerationHistory();
const card4 = generateCardWithRetries(8);
verifyCard(card4, 4);

for (const [pieceCount, seed] of [[5, "161803"], [6, "141421"], [7, "173205"]]) {
  inputs.pieceCount.value = String(pieceCount);
  inputs.seed.value = seed;
  generationHistory = emptyGenerationHistory();
  const card = generateCardWithRetries(8);
  verifyCard(card, pieceCount);
}

inputs.seed.value = "314159";
inputs.pieceCount.value = "3";
generationHistory = emptyGenerationHistory();
const repeatedCard3 = generateCardWithRetries(8);
assert.strictEqual(targetCellsSignature(repeatedCard3.target), targetCellsSignature(card3.target));
assert.strictEqual(comboSetSignature(repeatedCard3.combos), comboSetSignature(card3.combos));

console.log("2D engine tests passed");
