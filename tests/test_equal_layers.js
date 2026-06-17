const assert = require("assert");
const fs = require("fs");

let code = fs.readFileSync("app.js", "utf8");
assert.ok(!code.includes('document.getElementById("uniqueSets")'));
code = code.split("loadDefaultPieces();")[0] + "function setStatus(message) { globalThis.lastStatusMessage = message; document.getElementById('status').textContent = message; }";

const inputs = {
  w: { value: "4" },
  h: { value: "4" },
  levels: { value: "2" },
  pieceCount: { value: "3" },
  cardNumber: { value: "1" },
  targetCellSize: { value: "14.5" },
  comboCount: { value: "6" },
  attempts: { value: "1200" },
  seed: { value: "12345" },
  pieces: { value: "" },
  status: makeTestElement("section"),
  generate: Object.assign(makeTestElement("button"), { disabled: false }),
  newSession: Object.assign(makeTestElement("button"), { className: "hidden" }),
  generationOverlay: Object.assign(makeTestElement("div"), { className: "generationOverlay", attributes: { "aria-hidden": "true" } }),
  generationOverlayText: makeTestElement("div"),
  printSelectionPanel: Object.assign(makeTestElement("section"), { className: "panel printSelectionPanel hidden" }),
  printSelectionCount: makeTestElement("div"),
  generatedCardsList: makeTestElement("div"),
  manualMode: { checked: false },
  manualLayerEditorA: makeTestElement("div"),
  manualLayerEditorB: makeTestElement("div"),
  pieceColors: makeTestElement("div"),
  card: makeTestElement("section"),
  meta: makeTestElement("div"),
  gameCardView: makeTestElement("div"),
  printSheet: Object.assign(makeTestElement("section"), { className: "printSheet" }),
  layers: makeTestElement("div"),
  combosTitle: makeTestElement("h3"),
  combos: makeTestElement("div"),
  solutions: makeTestElement("div"),
};
const body = makeTestElement("body");

function makeTestElement(tagName = "div") {
  const element = {
    tagName: tagName.toUpperCase(),
    children: [],
    attributes: {},
    style: { setProperty(name, value) { this[name] = value; } },
    className: "",
    textContent: "",
    _innerHTML: "",
    value: "",
    type: "",
    onchange: null,
    onclick: null,
    click() {
      if (element.tagName === "A") {
        clickedDownloadHref = element.href || element.attributes.href || null;
        clickedDownloadName = element.download || element.attributes.download || null;
      }
      if (typeof element.onclick === "function") element.onclick();
    },
    appendChild(child) {
      this.children.push(child);
      child.parentNode = this;
      return child;
    },
    remove() {
      if (!element.parentNode) return;
      element.parentNode.children = element.parentNode.children.filter((child) => child !== element);
      element.parentNode = null;
    },
    setAttribute(name, value) {
      this.attributes[name] = String(value);
      if (name === "class") this.className = String(value);
    },
    getAttribute(name) {
      return this.attributes[name];
    },
    classList: {
      add(name) {
        const classes = new Set((element.className || "").split(/\s+/).filter(Boolean));
        classes.add(name);
        element.className = [...classes].join(" ");
      },
      remove(name) {
        const classes = new Set((element.className || "").split(/\s+/).filter(Boolean));
        classes.delete(name);
        element.className = [...classes].join(" ");
      },
      toggle(name, force) {
        const classes = new Set((element.className || "").split(/\s+/).filter(Boolean));
        const enabled = force ?? !classes.has(name);
        if (enabled) classes.add(name);
        else classes.delete(name);
        element.className = [...classes].join(" ");
      },
      contains(name) {
        return (element.className || "").split(/\s+/).includes(name);
      },
    },
  };
  Object.defineProperty(element, "outerHTML", {
    get() {
      const attrsObject = { ...element.attributes };
      if (element.className && !attrsObject.class) attrsObject.class = element.className;
      const attrs = Object.entries(attrsObject)
        .map(([name, value]) => ` ${name}="${String(value)}"`)
        .join("");
      return `<${tagName}${attrs}>${element.children.map((child) => child.outerHTML || "").join("")}${element.textContent || ""}</${tagName}>`;
    },
  });
  Object.defineProperty(element, "innerHTML", {
    get() {
      return element._innerHTML;
    },
    set(value) {
      element._innerHTML = String(value);
      if (value === "") element.children = [];
    },
  });
  return element;
}

function findAllElements(root, predicate) {
  const out = [];
  function visit(node) {
    if (predicate(node)) out.push(node);
    for (const child of node.children || []) visit(child);
  }
  visit(root);
  return out;
}

function averageFaceCenterY(faces) {
  const centers = faces.map((face) => {
    const points = face
      .getAttribute("points")
      .trim()
      .split(/\s+/)
      .map((point) => point.split(",").map(Number));
    return points.reduce((sum, [, y]) => sum + y, 0) / points.length;
  });
  return centers.reduce((sum, y) => sum + y, 0) / centers.length;
}

function averageFaceCenterX(faces) {
  const centers = faces.map((face) => {
    const points = face
      .getAttribute("points")
      .trim()
      .split(/\s+/)
      .map((point) => point.split(",").map(Number));
    return points.reduce((sum, [x]) => sum + x, 0) / points.length;
  });
  return centers.reduce((sum, x) => sum + x, 0) / centers.length;
}

let printCallCount = 0;
let popupOpenCount = 0;
let lastPopup = null;
let blockedPopup = false;
let html2canvasCallCount = 0;
let lastHtml2canvasTarget = null;
let savedPdfFilename = null;
let savedPdfImages = [];
let savedPdfOutputMode = null;
let clickedDownloadHref = null;
let clickedDownloadName = null;
global.window = {
  print() {
    printCallCount++;
  },
  open() {
    popupOpenCount++;
    if (blockedPopup) return null;
    lastPopup = {
      html: "",
      focused: false,
      document: {
        open() {
          this.owner.html = "";
        },
        write(html) {
          this.owner.html += html;
        },
        close() {
          this.owner.closed = true;
        },
      },
      focus() {
        this.focused = true;
      },
    };
    lastPopup.document.owner = lastPopup;
    return lastPopup;
  },
};
global.html2canvas = async (target, options = {}) => {
  html2canvasCallCount++;
  lastHtml2canvasTarget = target;
  globalThis.lastHtml2canvasOptions = options;
  return {
    toDataURL() {
      return "data:image/png;base64,TEST";
    },
  };
};
global.jspdf = {
  jsPDF: class {
    constructor(options) {
      this.options = options;
    }
    addImage(...args) {
      savedPdfImages.push(args);
    }
    output(mode) {
      savedPdfOutputMode = mode;
      return { type: "application/pdf" };
    }
    save(filename) {
      savedPdfFilename = filename;
    }
  },
};
global.URL = {
  createObjectURL() {
    return "blob:ubongo-test-pdf";
  },
  revokeObjectURL() {},
};

global.document = {
  body,
  getElementById(id) {
    return inputs[id] || { value: "", checked: false };
  },
  createElement(tagName) {
    return makeTestElement(tagName);
  },
  createElementNS(namespace, tagName) {
    const element = makeTestElement(tagName);
    element.namespaceURI = namespace;
    return element;
  },
  querySelector(selector) {
    if (selector === 'link[rel="stylesheet"]') return { getAttribute: () => "style.css?v=test" };
    return null;
  },
};
global.localStorage = {
  store: {},
  getItem(key) {
    return this.store[key] || null;
  },
  setItem(key, value) {
    this.store[key] = String(value);
  },
  removeItem(key) {
    delete this.store[key];
  },
};
global.requestAnimationFrame = (callback) => {
  callback();
  return 1;
};

eval(code);
pieces = JSON.parse(fs.readFileSync("data/pieces_thingiverse_6534722.json", "utf8"));
inputs.pieces.value = JSON.stringify(pieces);

function layerSignature(cells, z) {
  return cells
    .filter((cell) => cell[2] === z)
    .map((cell) => `${cell[0]},${cell[1]}`)
    .sort()
    .join(";");
}

function targetSignature(card) {
  return card.target.map((cell) => cell.join(",")).sort().join(";");
}

function cardSignature(card) {
  return `${targetSignature(card)}|${card.combos.map((combo) => pieceSetSignature(combo.pieces)).sort().join("/")}`;
}

function comboSet(card) {
  return comboSetSignature(card.combos);
}

function usedPieces(card) {
  return new Set(card.combos.flatMap((combo) => combo.pieces));
}

function layerBounds(card) {
  const layer = card.target.filter((cell) => cell[2] === 0);
  return {
    width: 1 + Math.max(...layer.map((cell) => cell[0])),
    height: 1 + Math.max(...layer.map((cell) => cell[1])),
    area: layer.length,
  };
}

assert.strictEqual(pieceSetSignature(["P01", "P13", "P15"]), pieceSetSignature(["P02", "P14", "P15"]));
assert.strictEqual(pieceSetSignature(["P06", "P07", "P15"]), pieceSetSignature(["P09", "P10", "P15"]));
assert.notStrictEqual(pieceSetSignature(["P01", "P13", "P15"]), pieceSetSignature(["P01", "P04", "P15"]));
assert.deepStrictEqual(targetVolumeOrder(mulberry32(1), [12, 14]).sort((a, b) => a - b), [12, 14]);

const translatedP17Placements = makePlacementsForPiece(pieces.find((piece) => piece.id === "P17"), 4, 4, 2);
assert.ok(translatedP17Placements.length > rotations(pieces.find((piece) => piece.id === "P17").cubes).length);
assert.ok(translatedP17Placements.some((placement) => placement.cubes.some(([x, y]) => x === 3 || y === 3)));

assert.strictEqual(pieceColor(pieces.find((piece) => piece.id === "P06")), DEFAULT_PIECE_COLORS.P06);
assert.strictEqual(pieceColor(pieces.find((piece) => piece.id === "P18")), "#066008");
pieceColorsById.P06 = "#123456";
assert.strictEqual(pieceColor(pieces.find((piece) => piece.id === "P06")), "#123456");
resetPieceColors();
assert.strictEqual(pieceColor(pieces.find((piece) => piece.id === "P06")), DEFAULT_PIECE_COLORS.P06);
assert.strictEqual(pieceColor({ id: "CustomYellow", sourceFiles: ["custom_yellow.stl"], cubes: [[0, 0, 0]] }), "#f2c812");

assert.deepStrictEqual([...VISUAL_ROTATE_180_PIECES].sort(), ["P02", "P07", "P10", "P12", "P13", "P16"]);
assert.deepStrictEqual([...VISUAL_ROTATE_90_PIECES].sort(), ["P18"]);
assert.deepStrictEqual(CUSTOM_PRESET_PIECE_IDS, ["P01", "P03", "P04", "P06", "P07", "P08", "P09", "P11", "P12", "P13", "P15", "P16", "P17", "P18"]);
assert.deepStrictEqual([...DEFAULT_EXCLUDED_PIECES].sort(), ["P02", "P10", "P14"]);
assert.strictEqual(visiblePieces().length, pieces.length);
assert.ok(!pieces.some((piece) => piece.id === "P05"));
assert.ok(visiblePieces().some((piece) => DEFAULT_EXCLUDED_PIECES.has(piece.id)));
assert.ok(generationPieces().every((piece) => !DEFAULT_EXCLUDED_PIECES.has(piece.id)));
assert.strictEqual(generationPieces().length, pieces.length - DEFAULT_EXCLUDED_PIECES.size);
assert.deepStrictEqual(pieceIdsForPreset("thingiverse6534722"), ["P01", "P02", "P03", "P04", "P06", "P07", "P08", "P09", "P10", "P11", "P12", "P13", "P14", "P15", "P16", "P18"]);
assert.deepStrictEqual(pieceIdsForPreset("thingiverse5072592"), ["P01", "P04", "P07", "P09", "P16", "P13", "P17", "P18"]);
assert.deepStrictEqual(pieceIdsForPreset("all"), pieces.map((piece) => piece.id));
assert.deepStrictEqual(pieceIdsForPreset("custom"), ["P01", "P03", "P04", "P06", "P07", "P08", "P09", "P11", "P12", "P13", "P15", "P16", "P17", "P18"]);
setPieceIncluded("P02", true);
assert.ok(generationPieces().some((piece) => piece.id === "P02"));
setPieceIncluded("P02", false);
assert.ok(!generationPieces().some((piece) => piece.id === "P02"));
setPieceIncluded("P17", false);
assert.deepStrictEqual(pieceIdsForPreset("custom"), ["P01", "P03", "P04", "P06", "P07", "P08", "P09", "P11", "P12", "P13", "P15", "P16", "P17", "P18"]);
applyPiecePreset("thingiverse5072592");
assert.deepStrictEqual(generationPieces().map((piece) => piece.id), ["P01", "P04", "P07", "P09", "P13", "P16", "P17", "P18"]);
applyPiecePreset("all");
assert.strictEqual(generationPieces().length, pieces.length);
applyPiecePreset("custom");
assert.ok(!generationPieces().some((piece) => piece.id === "P02"));
assert.ok(!generationPieces().some((piece) => piece.id === "P14"));
assert.ok(generationPieces().some((piece) => piece.id === "P01"));
assert.deepStrictEqual(generationPieces().map((piece) => piece.id), ["P01", "P03", "P04", "P06", "P07", "P08", "P09", "P11", "P12", "P13", "P15", "P16", "P17", "P18"]);
setPieceIncluded("P17", true);
const p02 = pieces.find((piece) => piece.id === "P02");
assert.notStrictEqual(serialize(visualCubesForPiece(p02)), serialize(p02.cubes));
assert.deepStrictEqual(p02.cubes, pieces.find((piece) => piece.id === "P02").cubes);
assert.strictEqual(serialize(visualCubesForPiece(pieces.find((piece) => piece.id === "P03"))), serialize(pieces.find((piece) => piece.id === "P03").cubes));
const p18 = pieces.find((piece) => piece.id === "P18");
assert.deepStrictEqual(p18.cubes, [[0, 1, 0], [1, 0, 0], [1, 1, 0], [2, 1, 0], [2, 1, 1]]);
assert.deepStrictEqual(dims(p18.cubes), [3, 2, 2]);
assert.notStrictEqual(serialize(visualCubesForPiece(p18)), serialize(p18.cubes));
assert.strictEqual(visualCubesForPiece(p18).length, p18.cubes.length);

const p06Preview = createPiecePreview(pieces.find((piece) => piece.id === "P06"), true);
assert.strictEqual(findAllElements(p06Preview, (node) => node.tagName === "SVG").length, 1);
assert.strictEqual(findAllElements(p06Preview, (node) => node.className === "pieceLayerBoards").length, 0);
assert.strictEqual(findAllElements(p06Preview, (node) => (node.className || "").includes("isoCubeFace")).length, pieces.find((piece) => piece.id === "P06").cubes.length * 3);
assert.ok(findAllElements(p06Preview, (node) => (node.className || "").includes("isoCubeFace")).some((face) => face.getAttribute("fill") === shadeColor(DEFAULT_PIECE_COLORS.P06, 38)));
const p06Level1Faces = findAllElements(p06Preview, (node) => (node.className || "").includes("isoCubeFace") && node.getAttribute("data-cube-z") === "0");
const p06Level2Faces = findAllElements(p06Preview, (node) => (node.className || "").includes("isoCubeFace") && node.getAttribute("data-cube-z") === "1");
assert.ok(p06Level1Faces.length > 0);
assert.ok(p06Level2Faces.length > 0);
assert.ok(averageFaceCenterY(p06Level2Faces) < averageFaceCenterY(p06Level1Faces));
const verticalStackPreview = makeTestElement("div");
drawPiece3d(verticalStackPreview, [[0, 0, 0], [0, 0, 1]], { compact: true, color: "#999999" });
const verticalStackLevel1Faces = findAllElements(verticalStackPreview, (node) => (node.className || "").includes("isoCubeFace") && node.getAttribute("data-cube-z") === "0");
const verticalStackLevel2Faces = findAllElements(verticalStackPreview, (node) => (node.className || "").includes("isoCubeFace") && node.getAttribute("data-cube-z") === "1");
assert.ok(Math.abs(averageFaceCenterX(verticalStackLevel2Faces) - averageFaceCenterX(verticalStackLevel1Faces)) < 0.01);
assert.ok(averageFaceCenterY(verticalStackLevel2Faces) < averageFaceCenterY(verticalStackLevel1Faces));

const repeatedPieceCombos = [
  { pieces: ["P01", "P02"] },
  { pieces: ["P01", "P03"] },
  { pieces: ["P01", "P18"] },
  { pieces: ["P02", "P04"] },
];
const repeatedPieceSelection = selectDiverseCombos(repeatedPieceCombos, 3, emptyGenerationHistory(), () => 0);
assert.deepStrictEqual(repeatedPieceSelection.map((combo) => combo.pieces.join(",")), ["P01,P02", "P01,P03", "P02,P04"]);

const customSizePreview = makeTestElement("div");
drawPiece3d(customSizePreview, [[0, 0, 0], [1, 0, 0]], { compact: true, color: "#999999", width: 58, height: 50 });
const customSizeSvg = findAllElements(customSizePreview, (node) => node.tagName === "SVG")[0];
assert.strictEqual(customSizeSvg.getAttribute("width"), "58");
assert.strictEqual(customSizeSvg.getAttribute("height"), "50");

const p06NormalPreview = createPiecePreview(pieces.find((piece) => piece.id === "P06"), false);
const compactSvg = findAllElements(p06Preview, (node) => node.tagName === "SVG")[0];
const normalSvg = findAllElements(p06NormalPreview, (node) => node.tagName === "SVG")[0];
assert.strictEqual(compactSvg.getAttribute("width"), "72");
assert.strictEqual(compactSvg.getAttribute("height"), "62");
assert.notStrictEqual(compactSvg.getAttribute("width"), normalSvg.getAttribute("width"));
assert.strictEqual(
  findAllElements(p06Preview, (node) => (node.className || "").includes("isoCubeFace")).length,
  findAllElements(p06NormalPreview, (node) => (node.className || "").includes("isoCubeFace")).length,
);

const p17Preview = createPiecePreview(pieces.find((piece) => piece.id === "P17"), true);
assert.strictEqual(findAllElements(p17Preview, (node) => node.tagName === "SVG").length, 1);
assert.strictEqual(findAllElements(p17Preview, (node) => (node.className || "").includes("isoCubeFace")).length, pieces.find((piece) => piece.id === "P17").cubes.length * 3);

renderPieceColorControls();
const pieceControls = findAllElements(inputs.pieceColors, (node) => (node.className || "").split(/\s+/).includes("pieceColorControl"));
const colorInputs = findAllElements(inputs.pieceColors, (node) => node.tagName === "INPUT" && node.type === "color");
const includeInputs = findAllElements(inputs.pieceColors, (node) => node.tagName === "INPUT" && node.type === "checkbox");
const pieceControlSvgs = findAllElements(inputs.pieceColors, (node) => node.tagName === "SVG");
assert.strictEqual(pieceControls.length, pieces.length);
assert.strictEqual(colorInputs.length, pieces.length);
assert.strictEqual(includeInputs.length, pieces.length);
assert.strictEqual(pieceControlSvgs.length, pieces.length);
assert.ok(colorInputs.some((input) => input.getAttribute("data-piece-id") === "P17"));
assert.ok(colorInputs.some((input) => input.getAttribute("data-piece-id") === "P02"));
assert.ok(colorInputs.some((input) => input.getAttribute("data-piece-id") === "P14"));
assert.strictEqual(includeInputs.find((input) => input.getAttribute("data-piece-id") === "P02").checked, false);
assert.strictEqual(includeInputs.find((input) => input.getAttribute("data-piece-id") === "P10").checked, false);
assert.strictEqual(includeInputs.find((input) => input.getAttribute("data-piece-id") === "P14").checked, false);
assert.strictEqual(includeInputs.find((input) => input.getAttribute("data-piece-id") === "P17").checked, true);
assert.ok(pieceControls.find((control) => findAllElements(control, (node) => node.getAttribute?.("data-piece-id") === "P02").length > 0).classList.contains("excludedPiece"));
assert.ok(pieceControls.find((control) => findAllElements(control, (node) => node.getAttribute?.("data-piece-id") === "P10").length > 0).classList.contains("excludedPiece"));
assert.ok(!pieceControls.find((control) => findAllElements(control, (node) => node.getAttribute?.("data-piece-id") === "P17").length > 0).classList.contains("excludedPiece"));
assert.ok(pieceControls.every((control) => findAllElements(control, (node) => node.tagName === "SVG").length === 1));

const firstVolumes = new Set();
for (let seed = 1; seed <= 8; seed++) {
  firstVolumes.add(targetVolumeOrder(mulberry32(seed), [12, 14])[0]);
}
assert.deepStrictEqual([...firstVolumes].sort((a, b) => a - b), [12, 14]);
assert.strictEqual(combosPerTaskForTaskCount(1), 6);
assert.strictEqual(combosPerTaskForTaskCount(2), 3);
inputs.pieceCount.value = "3";
assert.strictEqual(selectedTaskCount(), 2);
inputs.pieceCount.value = "4";
assert.strictEqual(selectedTaskCount(), 1);
inputs.pieceCount.value = "5";
assert.strictEqual(selectedTaskCount(), 1);
inputs.pieceCount.value = "3";
assert.deepStrictEqual(backgroundForCardMode(3, 2), { key: "cyan", asset: "assets/ubongo-board-cyan.png" });
assert.deepStrictEqual(backgroundForCardMode(4, 2), { key: "pink", asset: "assets/ubongo-board-pink.png" });
assert.deepStrictEqual(backgroundForCardMode(4, 3), { key: "navy", asset: "assets/ubongo-board-navy.png" });
assert.deepStrictEqual(backgroundForCardMode(5, 3), { key: "ppl", asset: "assets/ubongo-board-ppl.png" });
assert.deepStrictEqual(backgroundForCardMode(5, 2), { key: "green", asset: "assets/ubongo-board-green.png" });
assert.deepStrictEqual(backgroundForCardMode(3, 3), { key: "green", asset: "assets/ubongo-board-green.png" });
assert.deepStrictEqual(backgroundForCardMode(6, 2), { key: "large", asset: "assets/ubongo-board-large.png" });
assert.deepStrictEqual(backgroundForCardMode(8, 4), { key: "large", asset: "assets/ubongo-board-large.png" });
assert.deepStrictEqual(cardLayoutForBackgroundKey("cyan"), { key: "normal", width: "110mm", height: "157mm", backgroundWidth: "157mm", backgroundHeight: "110mm" });
assert.deepStrictEqual(cardLayoutForBackgroundKey("large"), { key: "large", width: "110mm", height: "176mm", backgroundWidth: "176mm", backgroundHeight: "110mm" });
assert.strictEqual(letterForCount(3), "C");
assert.strictEqual(letterForCount(2), "B");
assert.strictEqual(formatCardNumber(1), "01");
assert.strictEqual(formatCardNumber(99), "99");
assert.strictEqual(autoTargetSearchLimit(200, 1200), 8);
assert.strictEqual(autoTargetSearchLimit(20, 10), 20);
assert.strictEqual(autoComboSetSearchLimit(500, 6, 4, 1200), 30);
assert.strictEqual(autoComboSetSearchLimit(40, 6, 4, 10), 40);
assert.strictEqual(nextCardNumberValue(1), 2);
assert.strictEqual(nextCardNumberValue(99), 1);
assert.strictEqual(selectedTargetCellSize(), 14.5);
inputs.targetCellSize.value = "13";
assert.strictEqual(selectedTargetCellSize(), 13);
inputs.targetCellSize.value = "14.5";
assert.deepStrictEqual(boardDimensionsForTaskCount(1), { w: 7, h: 5 });
assert.deepStrictEqual(boardDimensionsForTaskCount(2), { w: 7, h: 5 });
assert.deepStrictEqual(taskBoardDimensions(0, 1), { w: 7, h: 5 });
assert.deepStrictEqual(taskBoardDimensions(0, 2), { w: 3, h: 5 });
assert.deepStrictEqual(taskBoardDimensions(1, 2), { w: 4, h: 5 });
assert.strictEqual(boardLabelForTaskCount(1), "7x5");
assert.strictEqual(boardLabelForTaskCount(2), "3x5 + 4x5");
const footprintStats = targetFootprintStats(extrudeSilhouette([[2, 3], [3, 3], [5, 4]], 2));
assert.strictEqual(footprintStats.width, 4);
assert.strictEqual(footprintStats.height, 2);
assert.strictEqual(footprintStats.minX, 2);
assert.strictEqual(footprintStats.minY, 3);
assert.deepStrictEqual(footprintStats.rowCounts, { 0: 2, 1: 1 });
const fullTopRowTarget = extrudeSilhouette([[0, 0], [1, 0], [2, 0], [3, 0]], 2);
const fullSecondRowTarget = extrudeSilhouette([[0, 0], [0, 1], [1, 1], [2, 1], [3, 1]], 2);
const narrowThirdRowTarget = extrudeSilhouette([[0, 0], [0, 2], [1, 2], [2, 2]], 2);
const fullNormalizedTopRowTarget = extrudeSilhouette([[0, 2], [1, 2], [2, 2], [3, 2]], 2);
const tooWideTarget = extrudeSilhouette([[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]], 2);
const fourWideRightTarget = extrudeSilhouette([[0, 0], [1, 0], [2, 0], [3, 0], [3, 1]], 2);
const threeWideRightTarget = extrudeSilhouette([[0, 0], [1, 0], [2, 0], [2, 1]], 2);
const threeWideLeftTarget = extrudeSilhouette([[0, 0], [1, 0], [2, 0], [1, 1]], 2);
const lShapeTarget = extrudeSilhouette([[0, 0], [1, 0], [0, 1]], 2);
const mirroredRotatedLShapeTarget = extrudeSilhouette([[0, 0], [1, 0], [1, 1]], 2);
assert.ok(!twoTaskTargetsFitOnCard([{ target: tooWideTarget }, { target: fullSecondRowTarget }]));
assert.ok(!twoTaskTargetsFitOnCard([{ target: threeWideLeftTarget }, { target: tooWideTarget }]));
assert.ok(twoTaskTargetsFitOnCard([{ target: threeWideLeftTarget }, { target: fourWideRightTarget }]));
assert.ok(!twoTaskTargetsFitOnCard([{ target: fourWideRightTarget }, { target: threeWideRightTarget }]));
assert.ok(!twoTaskTargetsFitOnCard([{ target: threeWideRightTarget }, { target: threeWideRightTarget }]));
assert.strictEqual(targetFootprintCanonicalSignature(lShapeTarget), targetFootprintCanonicalSignature(mirroredRotatedLShapeTarget));
assert.ok(!twoTaskTargetsFitOnCard([{ target: lShapeTarget, combos: [{ pieces: ["P01", "P04", "P07"] }] }, { target: mirroredRotatedLShapeTarget, combos: [{ pieces: ["P03", "P08", "P12"] }] }]));
assert.ok(!twoTaskTargetsFitOnCard([{ target: lShapeTarget, combos: [{ pieces: ["P01", "P13", "P15"] }] }, { target: mirroredRotatedLShapeTarget, combos: [{ pieces: ["P02", "P14", "P15"] }] }]));
assert.strictEqual(taskVariantSignature({ target: lShapeTarget, combos: [{ pieces: ["P01", "P13", "P15"] }] }), taskVariantSignature({ target: mirroredRotatedLShapeTarget, combos: [{ pieces: ["P02", "P14", "P15"] }] }));
assert.notStrictEqual(taskVariantSignature({ target: lShapeTarget, combos: [{ pieces: ["P01", "P04", "P07"] }] }), taskVariantSignature({ target: mirroredRotatedLShapeTarget, combos: [{ pieces: ["P03", "P08", "P12"] }] }));
const visualOrderCombo = { pieces: ["P01", "P03", "P04", "P06", "P08"] };
const visualOrderCard = { seed: 2468 };
const visualOrderA = displayPiecesForCombo(visualOrderCombo, visualOrderCard, 0);
const visualOrderARepeat = displayPiecesForCombo(visualOrderCombo, visualOrderCard, 0);
const visualOrderB = displayPiecesForCombo(visualOrderCombo, visualOrderCard, 1);
assert.deepStrictEqual(visualOrderA, visualOrderARepeat);
assert.deepStrictEqual([...visualOrderA].sort(), [...visualOrderCombo.pieces].sort());
assert.notDeepStrictEqual(visualOrderA, visualOrderCombo.pieces);
assert.notDeepStrictEqual(visualOrderA, visualOrderB);

pieceSelectionById = {};
const defaultCard = generateCard();
const defaultCardCombos = new Set(defaultCard.combos.map((combo) => pieceSetSignature(combo.pieces)));
assert.strictEqual(defaultCard.cardNumber, 1);
assert.strictEqual(defaultCard.challengeCode, "CB-01");
assert.strictEqual(defaultCard.targetCellSizeMm, 14.5);
assert.strictEqual(challengeCodeForCard(defaultCard), "CB-01");
assert.strictEqual(defaultCard.w, 7);
assert.strictEqual(defaultCard.h, 5);
assert.ok([12, 14].includes(defaultCard.target.length));
assert.strictEqual(defaultCard.tasks.length, 2);
assert.strictEqual(defaultCard.tasks[0].target, defaultCard.target);
assert.strictEqual(defaultCard.tasks[0].combos, defaultCard.combos);
assert.ok(defaultCard.tasks.every((task) => [12, 14].includes(task.target.length)));
assert.ok(defaultCard.tasks.every((task) => task.combos.length >= 1 && task.combos.length <= 3));
assert.ok(defaultCard.tasks.every((task) => task.requestedComboCount === 3));
assert.ok(targetFootprintStats(defaultCard.tasks[0].target).width <= 3);
assert.ok(targetFootprintStats(defaultCard.tasks[1].target).width <= 4);
assert.strictEqual(defaultCard.tasks[0].w, 3);
assert.strictEqual(defaultCard.tasks[0].h, 5);
assert.strictEqual(defaultCard.tasks[1].w, 4);
assert.strictEqual(defaultCard.tasks[1].h, 5);
assert.ok(twoTaskTargetsFitOnCard(defaultCard.tasks));
assert.ok(defaultCard.combos.length >= 1 && defaultCard.combos.length <= 3);
assert.ok(defaultCard.combos.every((combo) => combo.pieces.every((id) => !DEFAULT_EXCLUDED_PIECES.has(id))));
assert.strictEqual(defaultCard.incomplete, defaultCard.tasks.some((task) => task.incomplete));
assert.strictEqual(defaultCardCombos.size, defaultCard.combos.length);
renderCard(defaultCard, { skipHistory: true });
assert.strictEqual(inputs.gameCardView.getAttribute("data-background-key"), "cyan");
assert.strictEqual(inputs.gameCardView.getAttribute("data-card-size"), "normal");
assert.strictEqual(inputs.gameCardView.style["--game-card-width"], "110mm");
assert.strictEqual(inputs.gameCardView.style["--game-card-height"], "157mm");
assert.strictEqual(inputs.gameCardView.style["--game-card-bg-width"], "157mm");
assert.strictEqual(inputs.gameCardView.style["--game-card-bg-height"], "110mm");
let gameBackgrounds = findAllElements(inputs.gameCardView, (node) => (node.className || "").split(/\s+/).includes("gameCardBackground"));
assert.strictEqual(gameBackgrounds.length, 1);
assert.strictEqual(gameBackgrounds[0].tagName, "IMG");
assert.strictEqual(gameBackgrounds[0].getAttribute("src"), "assets/ubongo-board-cyan.png");
assert.strictEqual(gameBackgrounds[0].getAttribute("aria-hidden"), "true");
const gameTargetMaps = findAllElements(inputs.gameCardView, (node) => (node.className || "").includes("gameTargetMap"));
const gameTargetCells = findAllElements(inputs.gameCardView, (node) => (node.className || "").split(/\s+/).includes("gameTargetCell"));
const filledGameTargetCells = gameTargetCells.filter((node) => (node.className || "").split(/\s+/).includes("filled"));
const legacyEdgeGameTargetCells = filledGameTargetCells.filter((node) => ["edgeTop", "edgeRight", "edgeBottom", "edgeLeft"].some((edgeClass) => (node.className || "").split(/\s+/).includes(edgeClass)));
const gameTargetOutlines = findAllElements(inputs.gameCardView, (node) => (node.className || "").split(/\s+/).includes("gameTargetOutline"));
const gameTargetOutlineSegments = findAllElements(inputs.gameCardView, (node) => (node.className || "").split(/\s+/).includes("gameTargetOutlineSegment"));
const gameLevelBadges = findAllElements(inputs.gameCardView, (node) => (node.className || "").split(/\s+/).includes("gameLevelBadge"));
const gameLevelIcons = findAllElements(inputs.gameCardView, (node) => (node.className || "").split(/\s+/).includes("gameLevelIcon"));
const gameLevelIconBlocks = findAllElements(inputs.gameCardView, (node) => (node.className || "").split(/\s+/).includes("gameLevelIconBlock"));
const gameCardCodes = findAllElements(inputs.gameCardView, (node) => (node.className || "").split(/\s+/).includes("gameCardCode"));
const gameSlots = findAllElements(inputs.gameCardView, (node) => (node.className || "").split(/\s+/).includes("gameVariantSlot"));
const gamePieceSlots = findAllElements(inputs.gameCardView, (node) => (node.className || "").split(/\s+/).includes("gamePieceSlot"));
assert.strictEqual(gameTargetMaps.length, 2);
assert.strictEqual(gameTargetOutlines.length, 2);
assert.strictEqual(gameLevelBadges.length, 1);
assert.strictEqual(gameLevelBadges[0].getAttribute("data-level-count"), String(defaultCard.levels));
assert.strictEqual(gameLevelBadges[0].getAttribute("aria-label"), `${defaultCard.levels} levels high`);
assert.strictEqual(gameLevelIcons.length, 1);
assert.strictEqual(gameLevelIconBlocks.length, defaultCard.levels);
assert.strictEqual(gameCardCodes.length, 1);
assert.strictEqual(gameCardCodes[0].textContent, "CB-01");
assert.strictEqual(gameCardCodes[0].getAttribute("aria-label"), "Challenge CB-01");
let expectedTargetCellCount = 0;
let expectedFilledTargetCellCount = 0;
let expectedTargetOutlineSegmentCount = 0;
defaultCard.tasks.forEach((task, taskIndex) => {
  const map = gameTargetMaps[taskIndex];
  assert.strictEqual(map.getAttribute("data-task-index"), String(taskIndex));
  assert.strictEqual(map.getAttribute("data-target-signature"), targetCellsSignature(task.target));
  const footprint = new Set(task.target.map(([x, y]) => `${x},${y}`));
  const footprintCells = [...footprint].map((cell) => cell.split(",").map(Number));
  const minX = Math.min(...footprintCells.map(([x]) => x));
  const maxX = Math.max(...footprintCells.map(([x]) => x));
  const minY = Math.min(...footprintCells.map(([, y]) => y));
  const maxY = Math.max(...footprintCells.map(([, y]) => y));
  const footprintWidth = maxX - minX + 1;
  const footprintHeight = maxY - minY + 1;
  assert.strictEqual(map.getAttribute("data-target-cell-size"), "14.5");
  assert.strictEqual(map.style["--game-target-cell-size"], "14.5mm");
  assert.strictEqual(map.style.width, `${footprintWidth * 14.5}mm`);
  assert.strictEqual(map.style.height, `${footprintHeight * 14.5}mm`);
  assert.strictEqual(map.getAttribute("data-footprint-width"), String(footprintWidth));
  assert.strictEqual(map.getAttribute("data-footprint-height"), String(footprintHeight));
  assert.strictEqual(map.getAttribute("data-footprint-min-x"), String(minX));
  assert.strictEqual(map.getAttribute("data-footprint-min-y"), String(minY));
  const grid = findAllElements(map, (node) => (node.className || "").split(/\s+/).includes("gameTargetGrid"))[0];
  assert.strictEqual(grid.style.gridTemplateColumns, `repeat(${footprintWidth}, 14.5mm)`);
  assert.strictEqual(grid.style.gridTemplateRows, `repeat(${footprintHeight}, 14.5mm)`);
  const outline = findAllElements(map, (node) => (node.className || "").split(/\s+/).includes("gameTargetOutline"))[0];
  assert.strictEqual(outline.getAttribute("viewBox"), `0 0 ${footprintWidth * 14.5} ${footprintHeight * 14.5}`);
  assert.strictEqual(outline.getAttribute("width"), `${footprintWidth * 14.5}mm`);
  assert.strictEqual(outline.getAttribute("height"), `${footprintHeight * 14.5}mm`);
  expectedTargetCellCount += footprintWidth * footprintHeight;
  expectedFilledTargetCellCount += footprint.size;
  for (const cell of footprint) {
    const [x, y] = cell.split(",").map(Number);
    if (!footprint.has(`${x},${y - 1}`)) expectedTargetOutlineSegmentCount++;
    if (!footprint.has(`${x + 1},${y}`)) expectedTargetOutlineSegmentCount++;
    if (!footprint.has(`${x},${y + 1}`)) expectedTargetOutlineSegmentCount++;
    if (!footprint.has(`${x - 1},${y}`)) expectedTargetOutlineSegmentCount++;
  }
});
assert.strictEqual(gameTargetCells.length, expectedTargetCellCount);
assert.strictEqual(filledGameTargetCells.length, expectedFilledTargetCellCount);
assert.strictEqual(legacyEdgeGameTargetCells.length, 0);
assert.strictEqual(gameTargetOutlineSegments.length, expectedTargetOutlineSegmentCount);
assert.strictEqual(gameSlots.length, defaultCard.tasks.reduce((sum, task) => sum + task.combos.length, 0));
assert.strictEqual(gamePieceSlots.length, 6);
const renderedTaskCombos = defaultCard.tasks.flatMap((task) => task.combos);
gameSlots.forEach((slot, index) => {
  assert.strictEqual(slot.getAttribute("data-variant-index"), String(index));
  assert.strictEqual(slot.getAttribute("data-pieces"), renderedTaskCombos[index].pieces.join(","));
});
defaultCard.tasks.forEach((task, taskIndex) => task.combos.forEach((combo, comboIndex) => {
  const index = taskIndex * 3 + comboIndex;
  const slot = gamePieceSlots[index];
  assert.strictEqual(slot.getAttribute("data-variant-index"), String(index));
  assert.strictEqual(slot.getAttribute("data-task-index"), String(taskIndex));
  assert.strictEqual(slot.getAttribute("data-pieces"), combo.pieces.join(","));
  const gameSvgs = findAllElements(slot, (node) => node.tagName === "SVG");
  assert.strictEqual(gameSvgs.length, combo.pieces.length);
  for (const svg of gameSvgs) {
    assert.strictEqual(svg.getAttribute("width"), "40");
    assert.strictEqual(svg.getAttribute("height"), "34");
  }
}));
defaultCard.tasks.forEach((task, taskIndex) => {
  for (let comboIndex = task.combos.length; comboIndex < 3; comboIndex++) {
    const index = taskIndex * 3 + comboIndex;
    assert.ok((gamePieceSlots[index].className || "").split(/\s+/).includes("inactive"));
  }
});
assert.strictEqual(findAllElements(inputs.layers, (node) => (node.className || "").split(/\s+/).includes("layer")).length, defaultCard.tasks.length * defaultCard.levels);
assert.strictEqual(findAllElements(inputs.combos, (node) => (node.className || "").split(/\s+/).includes("combo")).length, renderedTaskCombos.length);
assert.strictEqual(findAllElements(inputs.combos, (node) => (node.className || "").split(/\s+/).includes("chips")).length, 0);
assert.strictEqual(findAllElements(inputs.combos, (node) => (node.className || "").split(/\s+/).includes("chip")).length, 0);
assert.strictEqual(findAllElements(inputs.combos, (node) => (node.className || "").split(/\s+/).includes("comboPreviews")).length, renderedTaskCombos.length);
const renderedSolutions = findAllElements(inputs.solutions, (node) => (node.className || "").split(/\s+/).includes("solution"));
assert.strictEqual(renderedSolutions.length, renderedTaskCombos.length);
renderedSolutions.forEach((solutionNode, solutionIndex) => {
  const combo = renderedTaskCombos[solutionIndex];
  const solutionModels = findAllElements(solutionNode, (node) => (node.className || "").split(/\s+/).includes("solutionModel"));
  assert.strictEqual(solutionModels.length, 1);
  const solutionSvgs = findAllElements(solutionModels[0], (node) => node.tagName === "SVG");
  assert.strictEqual(solutionSvgs.length, 1);
  assert.strictEqual(solutionSvgs[0].getAttribute("class"), "solution3dPreview");
  assert.strictEqual(solutionSvgs[0].getAttribute("width"), "220");
  assert.strictEqual(solutionSvgs[0].getAttribute("height"), "160");
  const solutionFaces = findAllElements(solutionSvgs[0], (node) => (node.className || "").split(/\s+/).includes("solutionCubeFace"));
  const solutionCubeCount = combo.solution.reduce((sum, placement) => sum + placement.cubes.length, 0);
  assert.strictEqual(solutionFaces.length, solutionCubeCount * 3);
  assert.ok(combo.solution.every((placement) => solutionFaces.some((face) => face.getAttribute("data-piece-id") === placement.id)));
  const solutionCells = findAllElements(solutionNode, (node) => (node.className || "").split(/\s+/).includes("cell") && node.getAttribute("data-piece-id"));
  assert.strictEqual(solutionCells.length, solutionCubeCount);
  for (const cell of solutionCells) {
    const piece = pieceById(cell.getAttribute("data-piece-id"));
    assert.strictEqual(cell.style.backgroundColor, pieceColor(piece));
    assert.ok(["#050505", "#f8fbfc"].includes(cell.style.color));
  }
});
generationHistory = { targets: [], targetFootprints: [], taskVariants: [], comboSets: [], volumes: [], pieceCounts: {} };
updateGenerationHistory(defaultCard);
const defaultTaskFootprints = defaultCard.tasks.map((task) => targetFootprintCanonicalSignature(task.target));
const defaultTaskVariants = defaultCard.tasks.map((task) => taskVariantSignature(task));
assert.deepStrictEqual(generationHistory.targetFootprints, defaultTaskFootprints);
assert.deepStrictEqual(generationHistory.taskVariants, defaultTaskVariants);
const usedDefaultFootprints = usedTargetFootprintSignatures(generationHistory);
const usedDefaultTaskVariants = usedTaskVariantSignatures(generationHistory);
assert.ok(defaultTaskFootprints.every((signature) => usedDefaultFootprints.has(signature)));
assert.ok(defaultTaskVariants.every((signature) => usedDefaultTaskVariants.has(signature)));
assert.strictEqual(targetFootprintCanonicalSignature(lShapeTarget), targetFootprintCanonicalSignature(mirroredRotatedLShapeTarget));
assert.strictEqual(
  usedTargetFootprintSignatures({ targetFootprints: [targetFootprintCanonicalSignature(lShapeTarget)] }).has(targetFootprintCanonicalSignature(mirroredRotatedLShapeTarget)),
  true
);
assert.strictEqual(
  usedTaskVariantSignatures({ taskVariants: [taskVariantSignature({ target: lShapeTarget, combos: [{ pieces: ["P01", "P13", "P15"] }] })] }).has(taskVariantSignature({ target: mirroredRotatedLShapeTarget, combos: [{ pieces: ["P02", "P14", "P15"] }] })),
  true
);
assert.strictEqual(
  usedTaskVariantSignatures({ taskVariants: [taskVariantSignature({ target: lShapeTarget, combos: [{ pieces: ["P01", "P04", "P07"] }] })] }).has(taskVariantSignature({ target: mirroredRotatedLShapeTarget, combos: [{ pieces: ["P03", "P08", "P12"] }] })),
  false
);
assert.strictEqual(
  usedTargetFootprintSignatures({ targetFootprints: [targetFootprintCanonicalSignature(lShapeTarget)] }).has(targetFootprintCanonicalSignature(mirroredRotatedLShapeTarget)),
  true
);
showGenerationOverlay();
assert.ok(inputs.generationOverlay.classList.contains("visible"));
assert.strictEqual(inputs.generationOverlay.getAttribute("aria-hidden"), "false");
assert.strictEqual(inputs.generationOverlayText.textContent, "Generating a new card...");
hideGenerationOverlay();
assert.ok(!inputs.generationOverlay.classList.contains("visible"));
assert.strictEqual(inputs.generationOverlay.getAttribute("aria-hidden"), "true");
showNewSessionAction();
assert.ok(!inputs.newSession.classList.contains("hidden"));
hideNewSessionAction();
assert.ok(inputs.newSession.classList.contains("hidden"));
generationHistory = { targets: ["a"], targetFootprints: ["b"], taskVariants: ["v"], comboSets: ["c"], volumes: [12], pieceCounts: { P01: 2 } };
resetGenerationSession();
assert.deepStrictEqual(generationHistory, emptyGenerationHistory());
inputs.pieceCount.value = "3";
inputs.manualMode.checked = true;
renderManualLayerEditor();
assert.strictEqual(inputs.manualLayerEditorA.style.gridTemplateColumns, "repeat(3, 34px)");
assert.strictEqual(inputs.manualLayerEditorB.style.gridTemplateColumns, "repeat(4, 34px)");
inputs.pieceCount.value = "5";
renderManualLayerEditor();
assert.strictEqual(inputs.manualLayerEditorA.style.gridTemplateColumns, "repeat(7, 34px)");
assert.ok(inputs.manualLayerEditorB.classList.contains("hidden"));
inputs.manualMode.checked = false;
inputs.pieceCount.value = "3";
renderGameCardView({ ...defaultCard, targetCellSizeMm: 13 });
const thirteenMmMap = findAllElements(inputs.gameCardView, (node) => (node.className || "").includes("gameTargetMap"))[0];
const thirteenMmGrid = findAllElements(thirteenMmMap, (node) => (node.className || "").split(/\s+/).includes("gameTargetGrid"))[0];
const thirteenMmOutline = findAllElements(thirteenMmMap, (node) => (node.className || "").split(/\s+/).includes("gameTargetOutline"))[0];
const thirteenMmFootprintWidth = Number(thirteenMmMap.getAttribute("data-footprint-width"));
const thirteenMmFootprintHeight = Number(thirteenMmMap.getAttribute("data-footprint-height"));
assert.strictEqual(thirteenMmMap.getAttribute("data-target-cell-size"), "13");
assert.strictEqual(thirteenMmMap.style["--game-target-cell-size"], "13mm");
assert.strictEqual(thirteenMmMap.style.width, `${thirteenMmFootprintWidth * 13}mm`);
assert.strictEqual(thirteenMmMap.style.height, `${thirteenMmFootprintHeight * 13}mm`);
assert.strictEqual(thirteenMmGrid.style.gridTemplateColumns, `repeat(${thirteenMmFootprintWidth}, 13mm)`);
assert.strictEqual(thirteenMmGrid.style.gridTemplateRows, `repeat(${thirteenMmFootprintHeight}, 13mm)`);
assert.strictEqual(thirteenMmOutline.getAttribute("viewBox"), `0 0 ${thirteenMmFootprintWidth * 13} ${thirteenMmFootprintHeight * 13}`);
assert.strictEqual(thirteenMmOutline.getAttribute("width"), `${thirteenMmFootprintWidth * 13}mm`);
assert.strictEqual(thirteenMmOutline.getAttribute("height"), `${thirteenMmFootprintHeight * 13}mm`);
renderGameCardView({
  seed: 2468,
  w: 4,
  h: 4,
  levels: 2,
  pieceCount: 5,
  target: [[0, 0, 0]],
  combos: [visualOrderCombo],
});
const visualOrderSlot = findAllElements(inputs.gameCardView, (node) => (node.className || "").split(/\s+/).includes("gamePieceSlot") && node.getAttribute("data-variant-index") === "0")[0];
const visualOrderPreviews = findAllElements(visualOrderSlot, (node) => (node.className || "").split(/\s+/).includes("gamePiecePreview"));
assert.strictEqual(visualOrderSlot.getAttribute("data-pieces"), visualOrderCombo.pieces.join(","));
assert.deepStrictEqual(visualOrderPreviews.map((preview) => preview.getAttribute("data-piece-id")), displayPiecesForCombo(visualOrderCombo, { seed: 2468 }, 0));
inputs.pieceCount.value = "5";
const originalSelectDiverseCombos = selectDiverseCombos;
let singleTaskRequestedComboSelectionCount = null;
selectDiverseCombos = (combos, requestedCount, history, rng) => {
  singleTaskRequestedComboSelectionCount = requestedCount;
  return originalSelectDiverseCombos(combos, requestedCount, history, rng);
};
const singleTaskCard = generateCard();
selectDiverseCombos = originalSelectDiverseCombos;
singleTaskCard.cardNumber = 2;
singleTaskCard.challengeCode = challengeCodeForCard(singleTaskCard);
assert.strictEqual(singleTaskCard.tasks.length, 1);
assert.strictEqual(singleTaskCard.requestedComboCount, 6);
assert.strictEqual(singleTaskCard.tasks[0].requestedComboCount, 6);
assert.strictEqual(singleTaskRequestedComboSelectionCount, 6);
renderCard(singleTaskCard, { skipHistory: true });
assert.strictEqual(inputs.gameCardView.getAttribute("data-background-key"), "green");
gameBackgrounds = findAllElements(inputs.gameCardView, (node) => (node.className || "").split(/\s+/).includes("gameCardBackground"));
assert.strictEqual(gameBackgrounds.length, 1);
assert.strictEqual(gameBackgrounds[0].getAttribute("src"), "assets/ubongo-board-green.png");
assert.strictEqual(findAllElements(inputs.gameCardView, (node) => (node.className || "").includes("gameTargetMap")).length, 1);
assert.strictEqual(findAllElements(inputs.gameCardView, (node) => (node.className || "").split(/\s+/).includes("gamePieceSlot")).length, 6);
assert.strictEqual(findAllElements(inputs.gameCardView, (node) => (node.className || "").split(/\s+/).includes("gamePieceSlot") && !(node.className || "").split(/\s+/).includes("inactive")).length, singleTaskCard.combos.length);
assert.ok(singleTaskCard.combos.length >= 1 && singleTaskCard.combos.length <= 6);
assert.ok(findAllElements(inputs.gameCardView, (node) => (node.className || "").split(/\s+/).includes("gamePieceSlotsDense")).length === 1);
findAllElements(inputs.gameCardView, (node) => (node.className || "").split(/\s+/).includes("gamePieceSlot") && !(node.className || "").split(/\s+/).includes("inactive")).forEach((slot, index) => {
  assert.strictEqual(slot.getAttribute("data-variant-index"), String(index));
  assert.strictEqual(slot.getAttribute("data-task-index"), "0");
  assert.strictEqual(slot.getAttribute("data-piece-count"), "5");
});
const largeCard = { ...singleTaskCard, pieceCount: 6, challengeCode: "FB-02" };
renderGameCardView(largeCard);
assert.strictEqual(inputs.gameCardView.getAttribute("data-background-key"), "large");
assert.strictEqual(inputs.gameCardView.getAttribute("data-card-size"), "large");
assert.strictEqual(inputs.gameCardView.style["--game-card-width"], "110mm");
assert.strictEqual(inputs.gameCardView.style["--game-card-height"], "176mm");
assert.strictEqual(inputs.gameCardView.style["--game-card-bg-width"], "176mm");
assert.strictEqual(inputs.gameCardView.style["--game-card-bg-height"], "110mm");
gameBackgrounds = findAllElements(inputs.gameCardView, (node) => (node.className || "").split(/\s+/).includes("gameCardBackground"));
assert.strictEqual(gameBackgrounds[0].getAttribute("src"), "assets/ubongo-board-large.png");
renderPrintSheet([largeCard]);
let largePrintPackages = findAllElements(inputs.printSheet, (node) => (node.className || "").split(/\s+/).includes("printCardPackage"));
assert.strictEqual(largePrintPackages.length, 1);
assert.strictEqual(largePrintPackages[0].style["--print-card-height"], "176mm");
inputs.pieceCount.value = "3";

generatedCards.length = 0;
selectedPrintCardIds.length = 0;
printCallCount = 0;
assert.strictEqual(printReadyCards(), false);
assert.strictEqual(globalThis.lastStatusMessage, "Select at least one generated card for printing.");
addGeneratedCard(defaultCard);
assert.strictEqual(generatedCards.length, 1);
assert.strictEqual(selectedPrintCardIds.length, 1);
assert.strictEqual(inputs.printSelectionCount.textContent, "Selected for print: 1/2");
assert.ok(!inputs.printSelectionPanel.classList.contains("hidden"));
assert.strictEqual(findAllElements(inputs.generatedCardsList, (node) => (node.className || "").split(/\s+/).includes("generatedCardPreview")).length, 1);
printReadyCards();
assert.strictEqual(printCallCount, 0);
assert.ok(body.classList.contains("printPreviewMode"));
assert.strictEqual(globalThis.lastStatusMessage, "Print preview ready for 1 card. Press Print or Export PDF.");
assert.strictEqual(inputs.printSheet.getAttribute("data-card-count"), "1");
assert.strictEqual(findAllElements(inputs.printSheet, (node) => (node.className || "").split(/\s+/).includes("printCardPackage")).length, 1);
assert.strictEqual(findAllElements(inputs.printSheet, (node) => (node.className || "").split(/\s+/).includes("gameCardView")).length, 1);
assert.strictEqual(findAllElements(inputs.printSheet, (node) => (node.className || "").split(/\s+/).includes("printSolutionBlock")).length, 1);
popupOpenCount = 0;
lastPopup = null;
blockedPopup = false;
assert.strictEqual(printNow(), true);
assert.strictEqual(printCallCount, 1);
assert.strictEqual(popupOpenCount, 0);
assert.strictEqual(globalThis.lastStatusMessage, "Print requested from the current preview. If no dialog opens in this browser, use Chrome or Ctrl+P.");
popupOpenCount = 0;
lastPopup = null;
assert.strictEqual(openPrintPage(), true);
assert.strictEqual(popupOpenCount, 1);
assert.ok(lastPopup.html.includes('<link rel="stylesheet" href="style.css?v=test">'));
assert.ok(lastPopup.html.includes('class="printSheet"'));
assert.ok(lastPopup.html.includes('class="printCardPackage"'));
assert.ok(lastPopup.html.includes('Open') === false);
assert.ok(lastPopup.html.includes('Print'));
assert.strictEqual(lastPopup.focused, true);
assert.strictEqual(globalThis.lastStatusMessage, "Print page opened. Use its Print button or Ctrl+P.");
popupOpenCount = 0;
lastPopup = null;
blockedPopup = true;
assert.strictEqual(openPrintPage(), false);
assert.strictEqual(globalThis.lastStatusMessage, "Popup blocked. Allow popups for this site or press Ctrl+P on the preview.");
blockedPopup = false;
exitPrintPreview();
assert.ok(!body.classList.contains("printPreviewMode"));
addGeneratedCard(singleTaskCard);
assert.strictEqual(generatedCards.length, 2);
assert.deepStrictEqual(selectedPrintCards(), [defaultCard, singleTaskCard]);
renderPrintSheet();
assert.strictEqual(inputs.printSheet.getAttribute("data-card-count"), "2");
let printSheetCards = findAllElements(inputs.printSheet, (node) => (node.className || "").split(/\s+/).includes("gameCardView"));
let printPackages = findAllElements(inputs.printSheet, (node) => (node.className || "").split(/\s+/).includes("printCardPackage"));
let printSolutionBlocks = findAllElements(inputs.printSheet, (node) => (node.className || "").split(/\s+/).includes("printSolutionBlock"));
let printSolutionItems = findAllElements(inputs.printSheet, (node) => (node.className || "").split(/\s+/).includes("printSolutionItem"));
assert.strictEqual(printSheetCards.length, 2);
assert.strictEqual(printPackages.length, 2);
assert.strictEqual(printSolutionBlocks.length, 2);
assert.strictEqual(printSheetCards[0].getAttribute("data-print-card-index"), "0");
assert.strictEqual(printSheetCards[1].getAttribute("data-print-card-index"), "1");
assert.strictEqual(printSolutionBlocks[0].getAttribute("data-challenge-code"), defaultCard.challengeCode);
assert.strictEqual(printSolutionBlocks[1].getAttribute("data-challenge-code"), singleTaskCard.challengeCode);
assert.deepStrictEqual(
  findAllElements(inputs.printSheet, (node) => (node.className || "").split(/\s+/).includes("gameCardCode")).map((node) => node.textContent),
  [defaultCard.challengeCode, singleTaskCard.challengeCode]
);
assert.strictEqual(printSolutionItems.length, defaultCard.tasks.flatMap((task) => task.combos).length + singleTaskCard.combos.length);
assert.ok(printSolutionItems.every((item) => findAllElements(item, (node) => node.tagName === "SVG").length === 1));
printSolutionItems.forEach((item) => {
  const svg = findAllElements(item, (node) => node.tagName === "SVG")[0];
  assert.strictEqual(svg.getAttribute("width"), "104");
  assert.strictEqual(svg.getAttribute("height"), "74");
});
printCallCount = 0;
printReadyCards();
assert.strictEqual(printCallCount, 0);
assert.ok(body.classList.contains("printPreviewMode"));
assert.strictEqual(globalThis.lastStatusMessage, "Print preview ready for 2 cards. Press Print or Export PDF.");
const replacementPrintCard = { ...defaultCard, seed: defaultCard.seed + 1 };
addGeneratedCard(replacementPrintCard);
assert.strictEqual(generatedCards.length, 3);
assert.deepStrictEqual(selectedPrintCards(), [singleTaskCard, replacementPrintCard]);
assert.strictEqual(inputs.printSelectionCount.textContent, "Selected for print: 2/2");
togglePrintCardSelection(defaultCard.sessionCardId);
assert.deepStrictEqual(selectedPrintCards(), [replacementPrintCard, defaultCard]);
assert.strictEqual(inputs.printSelectionCount.textContent, "Selected for print: 2/2");
togglePrintCardSelection(defaultCard.sessionCardId);
assert.deepStrictEqual(selectedPrintCards(), [replacementPrintCard]);
assert.strictEqual(inputs.printSelectionCount.textContent, "Selected for print: 1/2");
printReadyCards();
assert.strictEqual(inputs.printSheet.getAttribute("data-card-count"), "1");
assert.deepStrictEqual(
  findAllElements(inputs.printSheet, (node) => (node.className || "").split(/\s+/).includes("gameCardCode")).map((node) => node.textContent),
  [replacementPrintCard.challengeCode]
);
for (let i = 0; i < 5; i++) {
  addGeneratedCard({ ...defaultCard, seed: defaultCard.seed + 10 + i });
}
assert.strictEqual(generatedCards.length, 6);
assert.ok(!generatedCards.some((card) => card.sessionCardId === singleTaskCard.sessionCardId));
assert.ok(findAllElements(inputs.generatedCardsList, (node) => (node.className || "").split(/\s+/).includes("generatedCardPreview")).length >= 1);

assert.ok(isRetryableGenerationError(new Error("Only plain rectangular targets were found with these settings.")));
assert.ok(isRetryableGenerationError(new Error("Could not find enough combinations. Try fewer pieces, more attempts, or a different seed.")));
assert.ok(isRetryableGenerationError(new Error("No new unique targets left for this session. Change settings, increase attempts, or reload the page to start a new session.")));
assert.ok(!isRetryableGenerationError(new Error("No target that fits the fixed 7x5 task area is possible with 3 pieces. Increase pieces per variant.")));
assert.strictEqual(fullVariantRequirementText(), "full 3/3 + 3/3 variant set");
assert.strictEqual(
  incompleteGenerationFailureMessage(),
  "Could not find a full 3/3 + 3/3 variant set within the current Generation attempts budget. Try Generate card again, increase attempts, or broaden the active piece set.",
);

const realGenerateCardForRetry = generateCard;
try {
  inputs.seed.value = "200";
  inputs.attempts.value = "2";
  const retrySeeds = [];
  let retryAttempts = 0;
  generateCard = () => {
    retrySeeds.push(inputs.seed.value);
    retryAttempts++;
    return {
      seed: +inputs.seed.value,
      w: 4,
      h: 4,
      levels: 2,
      target: [],
      combos: retryAttempts === 1 ? [{ pieces: ["P01"] }] : [{ pieces: ["P01"] }, { pieces: ["P03"] }, { pieces: ["P04"] }],
      requestedComboCount: 3,
      incomplete: retryAttempts === 1,
      tasks: [{
        target: [],
        combos: retryAttempts === 1 ? [{ pieces: ["P01"] }] : [{ pieces: ["P01"] }, { pieces: ["P03"] }, { pieces: ["P04"] }],
        requestedComboCount: 3,
        incomplete: retryAttempts === 1,
      }],
    };
  };
  const retriedIncompleteCard = generateCardWithRetries(2);
  assert.strictEqual(retryAttempts, 2);
  assert.deepStrictEqual(retrySeeds, ["200", "10173"]);
  assert.strictEqual(retriedIncompleteCard.incomplete, false);
  assert.strictEqual(retriedIncompleteCard.retryCount, 1);
  assert.strictEqual(currentGenerationAttempt, null);
  assert.strictEqual(currentGenerationAttemptBudget, null);
} finally {
  generateCard = realGenerateCardForRetry;
  inputs.seed.value = "12345";
}

inputs.manualMode.checked = true;
manualLayerCellsA = new Set(["0,0", "0,1", "1,0", "1,1", "2,0", "2,1"]);
manualLayerCellsB = new Set(["0,0", "1,0", "2,0", "0,1", "0,2", "1,2"]);
generationHistory = {
  targets: [],
  targetFootprints: [targetFootprintCanonicalSignature(manualLayerTarget(3, 5, 2, manualLayerCellsA, "1"))],
  taskVariants: [],
  comboSets: [],
  volumes: [],
  pieceCounts: {},
};
const realGenerateSingleTaskForManual = generateSingleTask;
try {
  let manualCalls = 0;
  generateSingleTask = (options = {}) => {
    manualCalls++;
    return {
      seed: 1,
      w: manualCalls === 1 ? 3 : 4,
      h: 5,
      levels: 2,
      pieceCount: 3,
      target: manualCalls === 1 ? manualLayerTarget(3, 5, 2, manualLayerCellsA, "1") : manualLayerTarget(4, 5, 2, manualLayerCellsB, "2"),
      combos: [{ pieces: ["P01", "P04", "P07"], solution: [] }],
      requestedComboCount: 3,
      incomplete: false,
      pieceLibrary: pieces,
      activeLibrary: "test-library",
      targetMode: "equal-layer",
    };
  };
  const manualLayerCard = generateCard();
assert.strictEqual(manualLayerCard.target.length, 12);
assert.strictEqual(manualLayerCard.tasks.length, 2);
assert.strictEqual(layerSignature(manualLayerCard.target, 0), "0,0;0,1;1,0;1,1;2,0;2,1");
assert.strictEqual(layerSignature(manualLayerCard.target, 0), layerSignature(manualLayerCard.target, 1));
assert.strictEqual(layerSignature(manualLayerCard.tasks[1].target, 0), "0,0;0,1;0,2;1,0;1,2;2,0");
assert.ok(manualLayerCard.combos.length >= 1);
} finally {
  generateSingleTask = realGenerateSingleTaskForManual;
}

manualLayerCellsA = new Set(["0,0", "2,4"]);
manualLayerCellsB = new Set(["0,0", "1,0", "2,0", "0,1", "1,1", "2,1"]);
assert.throws(
  () => generateCard(),
  /Manual layer 1 cells must be connected/,
);

manualLayerCellsA = new Set(["0,0", "1,0", "2,0", "0,1", "1,1", "2,1", "1,2"]);
manualLayerCellsB = new Set(["0,0", "1,0", "2,0", "0,1", "1,1", "2,1"]);
const xA1ManualTargetA = manualLayerTarget(3, 5, 2, manualLayerCellsA, "1");
const xA1ManualTargetB = manualLayerTarget(4, 5, 2, manualLayerCellsB, "2");
assert.ok(twoTaskTargetsFitOnCard([xA1ManualTargetA, xA1ManualTargetB]));

manualLayerCellsA = new Set(["0,0", "1,0", "2,0"]);
manualLayerCellsB = new Set(["0,0", "1,0", "2,0"]);
assert.throws(
  () => generateCard(),
  /Two task targets collide: left target must be at most 3 columns wide, right target must be at most 4 columns wide, mirrored\/equivalent contours cannot repeat, and 4-cell rows cannot be on the same or adjacent rows\./,
);
inputs.manualMode.checked = false;
generationHistory = { targets: [], targetFootprints: [], taskVariants: [], comboSets: [], volumes: [], pieceCounts: {} };
inputs.attempts.value = "20";

const defaultRetryCard = generateCardWithRetries();
assert.ok([12, 14].includes(defaultRetryCard.target.length));
assert.strictEqual(defaultRetryCard.tasks.length, 2);
assert.ok(defaultRetryCard.tasks.every((task) => task.combos.length >= 1 && task.combos.length <= 3));
assert.ok(targetFootprintStats(defaultRetryCard.tasks[0].target).width <= 3);
assert.ok(targetFootprintStats(defaultRetryCard.tasks[1].target).width <= 4);
assert.ok(twoTaskTargetsFitOnCard(defaultRetryCard.tasks));
assert.strictEqual(defaultRetryCard.incomplete, defaultRetryCard.tasks.some((task) => task.incomplete));
inputs.attempts.value = "1200";

const realGenerateCardForBudget = generateCard;
try {
  inputs.seed.value = "400";
  inputs.attempts.value = "5";
  let incompleteAttempts = 0;
  generateCard = () => {
    incompleteAttempts++;
    return {
      seed: +inputs.seed.value,
      w: 4,
      h: 5,
      levels: 2,
      target: [],
      combos: [{ pieces: ["P01"] }],
      requestedComboCount: 6,
      incomplete: true,
      tasks: [
        { target: [], combos: [{ pieces: ["P01"] }], requestedComboCount: 3, incomplete: true },
        { target: [], combos: [{ pieces: ["P03"] }], requestedComboCount: 3, incomplete: true },
      ],
    };
  };
  assert.throws(
    () => generateCardWithRetries(),
    /Could not find a full 3\/3 \+ 3\/3 variant set within the current Generation attempts budget/,
  );
  assert.strictEqual(incompleteAttempts, 5);
  assert.strictEqual(currentGenerationAttempt, null);
  assert.strictEqual(currentGenerationAttemptBudget, null);
} finally {
  generateCard = realGenerateCardForBudget;
  inputs.seed.value = "12345";
  inputs.attempts.value = "1200";
}

const repeatedTarget = defaultCard;
const diverseTarget = {
  ...defaultCard,
  target: extrudeSilhouette([[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [3, 2]], 2),
  combos: [
    { pieces: ["P03", "P08", "P12"] },
    { pieces: ["P04", "P07", "P11"] },
  ],
};
const repeatedHistory = {
  targets: [targetCellsSignature(repeatedTarget.target)],
  comboSets: [comboSet(repeatedTarget)],
  pieceCounts: Object.fromEntries(repeatedTarget.combos.flatMap((combo) => combo.pieces).map((id) => [canonicalPieceId(id), 4])),
};
assert.ok(cardDiversityScore(diverseTarget, repeatedHistory, mulberry32(10)) > cardDiversityScore(repeatedTarget, repeatedHistory, mulberry32(10)));

inputs.seed.value = "1";
randomSeedMode = true;
const variedSeedCardA = generateCard();
updateGenerationHistory(variedSeedCardA);
inputs.seed.value = "2";
const variedSeedCardB = generateCard();
randomSeedMode = false;
assert.notStrictEqual(cardSignature(variedSeedCardA), cardSignature(variedSeedCardB));

inputs.seed.value = "2";
generationHistory = { targets: [targetCellsSignature(variedSeedCardA.target)], targetFootprints: [], taskVariants: [], comboSets: [comboSet(variedSeedCardA)], pieceCounts: { P16: 99 } };
const explicitSeedCardA = generateCard();
generationHistory = { targets: [], targetFootprints: [], taskVariants: [], comboSets: [], pieceCounts: {} };
const explicitSeedCardB = generateCard();
assert.strictEqual(cardSignature(explicitSeedCardA), cardSignature(explicitSeedCardB));

generationHistory = { targets: [], targetFootprints: [], taskVariants: [], comboSets: [], pieceCounts: {} };
const seriesComboSets = new Set();
const seriesTargets = new Set();
const seriesPieces = new Set();
randomSeedMode = true;
for (let seed = 1; seed <= 10; seed++) {
  inputs.seed.value = String(seed);
  const card = generateCard();
  seriesComboSets.add(comboSet(card));
  seriesTargets.add(targetCellsSignature(card.target));
  for (const pieceId of usedPieces(card)) seriesPieces.add(pieceId);
  updateGenerationHistory(card);
}
randomSeedMode = false;
assert.ok(seriesComboSets.size > 2);
assert.ok(seriesTargets.size > 4);
assert.ok([...seriesPieces].some((id) => !["P13", "P14", "P15", "P16", "P18"].includes(id)));

generationHistory = { targets: [], targetFootprints: defaultCard.tasks.map((task) => targetFootprintCanonicalSignature(task.target)), taskVariants: defaultCard.tasks.map((task) => taskVariantSignature(task)), comboSets: [], volumes: [], pieceCounts: {} };
inputs.seed.value = "12345";
randomSeedMode = true;
const uniqueAfterHistoryCard = generateCard();
randomSeedMode = false;
assert.ok(uniqueAfterHistoryCard.tasks.every((task) => !generationHistory.targetFootprints.includes(targetFootprintCanonicalSignature(task.target))));
assert.ok(twoTaskTargetsFitOnCard(uniqueAfterHistoryCard.tasks));

inputs.levels.value = "3";
inputs.pieceCount.value = "2";

assert.throws(
  () => generateCard(),
  /No normal-sized target is possible/,
);

const threeLayerTarget = extrudeSilhouette([[0, 0], [0, 1], [1, 0], [1, 1]], 3);
assert.strictEqual(threeLayerTarget.length, 12);
assert.strictEqual(layerSignature(threeLayerTarget, 0), layerSignature(threeLayerTarget, 1));
assert.strictEqual(layerSignature(threeLayerTarget, 1), layerSignature(threeLayerTarget, 2));

const threeLevelSet = ["P01", "P04", "P15"].map((id) => pieces.find((piece) => piece.id === id));
const threeLevelCache = Object.fromEntries(pieces.map((piece) => [piece.id, makePlacementsForPiece(piece, 4, 4, 3)]));
const threeLevelSolution = solveExact(threeLevelSet, threeLayerTarget, 4, 4, 3, mulberry32(1), 40000, threeLevelCache);

assert.ok(threeLevelSolution);

inputs.levels.value = "3";
inputs.pieceCount.value = "3";

const generatedThreeLevelCard = generateCard();
const generatedThreeLevelCombos = new Set(generatedThreeLevelCard.combos.map((combo) => pieceSetSignature(combo.pieces)));

assert.strictEqual(generatedThreeLevelCard.levels, 3);
assert.strictEqual(generatedThreeLevelCard.tasks.length, 2);
assert.strictEqual(generatedThreeLevelCard.target.length, 12);
assert.strictEqual(generatedThreeLevelCard.combos.length, 3);
assert.strictEqual(generatedThreeLevelCard.incomplete, generatedThreeLevelCard.tasks.some((task) => task.incomplete));
assert.strictEqual(generatedThreeLevelCombos.size, generatedThreeLevelCard.combos.length);
assert.ok(generatedThreeLevelCard.combos.some((combo) => combo.pieces.includes("P17")));

inputs.levels.value = "2";
inputs.pieceCount.value = "5";
inputs.seed.value = "1781123196111";

const singleBoardCard = generateCard();
assert.strictEqual(singleBoardCard.tasks.length, 1);
assert.strictEqual(singleBoardCard.w, 7);
assert.strictEqual(singleBoardCard.h, 5);
assert.ok(singleBoardCard.combos.length >= 1 && singleBoardCard.combos.length <= 6);
assert.ok(!isPlainRectangularTarget(singleBoardCard.target));

const shapedTargets = generatedTargetsFor(mulberry32(42), 7, 5, 2, [12], 120);
const shapedTargetSignatures = new Set(shapedTargets.map((target) => targetSignature({ target: target.target })));

assert.ok(shapedTargets.length >= 50);
assert.strictEqual(shapedTargetSignatures.size, shapedTargets.length);
for (const target of shapedTargets.slice(0, 50)) {
  assert.strictEqual(target.id, "random-growth");
  const layer = target.target.filter((cell) => cell[2] === 0).map(([x, y]) => [x, y]);
  assert.strictEqual(layer.length, 6);
  assert.ok(connected2d(layer));
  assert.ok(!isPlainRectangularTarget(target.target));
  assert.ok(targetLayerPerimeter(target.target) > 10);
  assert.ok(targetShapeScore(target.target) >= 10);
}

const mirroredDuplicateCard = {
  combos: [
    { pieces: ["P01", "P13", "P15"] },
    { pieces: ["P02", "P14", "P15"] },
  ],
};
const mirroredDuplicateCombos = new Set(mirroredDuplicateCard.combos.map((combo) => pieceSetSignature(combo.pieces)));
assert.notStrictEqual(mirroredDuplicateCombos.size, mirroredDuplicateCard.combos.length);

(async () => {
  const realGenerateCardWithRetries = generateCardWithRetries;
  const realLoadPiecesFromText = loadPiecesFromText;
  try {
    generatedCards.length = 0;
    selectedPrintCardIds.length = 0;
    addGeneratedCard(defaultCard);
    renderPrintSheet();
    popupOpenCount = 0;
    printCallCount = 0;
    savedPdfFilename = null;
    savedPdfImages = [];
    savedPdfOutputMode = null;
    clickedDownloadHref = null;
    clickedDownloadName = null;
    html2canvasCallCount = 0;
    const exported = await exportPdf();
    assert.strictEqual(exported, true);
    assert.strictEqual(popupOpenCount, 1);
    assert.strictEqual(printCallCount, 0);
    assert.strictEqual(html2canvasCallCount, 1);
    assert.strictEqual(lastHtml2canvasTarget, inputs.printSheet);
    assert.strictEqual(savedPdfOutputMode, "blob");
    assert.strictEqual(clickedDownloadHref, "blob:ubongo-test-pdf");
    assert.strictEqual(clickedDownloadName, "ubongo3d-cards.pdf");
    assert.strictEqual(savedPdfFilename, null);
    assert.strictEqual(savedPdfImages.length, 1);
    assert.strictEqual(globalThis.lastStatusMessage, "PDF ready. If the download did not start, save it from the opened PDF tab.");

    generatedCards.length = 0;
    selectedPrintCardIds.length = 0;
    inputs.generate.disabled = false;
    hideNewSessionAction();
    loadPiecesFromText = () => {};
    generateCardWithRetries = () => ({ ...defaultCard, retryCount: 0 });
    const handledCard = await handleGenerateCard();
    assert.ok(handledCard);
    assert.strictEqual(inputs.generate.disabled, false);
    assert.ok(!inputs.generationOverlay.classList.contains("visible"));
    assert.ok(inputs.newSession.classList.contains("hidden"));
    assert.ok(globalThis.lastStatusMessage.startsWith("Done: card generated"));
    assert.strictEqual(generatedCards.length, 1);
    assert.strictEqual(selectedPrintCardIds.length, 1);

    generationHistory = { targets: ["x"], targetFootprints: ["y"], comboSets: ["z"], volumes: [12], pieceCounts: { P01: 1 } };
    generatedCards = [defaultCard];
    selectedPrintCardIds = [ensureGeneratedCardId(defaultCard)];
    generateCardWithRetries = () => { throw newUniqueTargetError(); };
    const noCard = await handleGenerateCard();
    assert.strictEqual(noCard, null);
    assert.strictEqual(inputs.generate.disabled, false);
    assert.ok(!inputs.generationOverlay.classList.contains("visible"));
    assert.ok(!inputs.newSession.classList.contains("hidden"));
    assert.strictEqual(globalThis.lastStatusMessage, "No new unique targets left in this session. Start a new session to generate more cards with repeats allowed across sessions.");
    assert.strictEqual(generatedCards.length, 1);

    inputs.newSession.onclick();
    assert.deepStrictEqual(generationHistory, emptyGenerationHistory());
    assert.ok(inputs.newSession.classList.contains("hidden"));
    assert.strictEqual(globalThis.lastStatusMessage, "New session started. Generate a new card.");
    assert.strictEqual(generatedCards.length, 0);
    assert.strictEqual(selectedPrintCardIds.length, 0);
  } finally {
    generateCardWithRetries = realGenerateCardWithRetries;
    loadPiecesFromText = realLoadPiecesFromText;
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
