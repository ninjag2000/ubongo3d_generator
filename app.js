const DATA_URL = "data/pieces_thingiverse_6534722.json";
const DATA_2D_URL = "data/pieces_2d_photo.json";
const MIN_TARGET_VOLUME = 12;
const MIN_2D_TARGET_AREA = 9;
const MAX_TASKS_PER_CARD = 2;
const COMBOS_PER_TASK = 3;
const VARIANT_SLOTS_PER_CARD = 6;
const APP_MODE_STORAGE_KEY = "ubongo_generator_mode_v1";
const MODE_2D = "2d";
const MODE_3D = "3d";
const CARD_BACKGROUNDS = {
  cyan: "assets/ubongo-board-cyan.png",
  green: "assets/ubongo-board-green.png",
  large: "assets/ubongo-board-large.png",
  navy: "assets/ubongo-board-navy.png",
  pink: "assets/ubongo-board-pink.png",
  ppl: "assets/ubongo-board-ppl.png",
};
const CARD_LAYOUTS = {
  normal: { key: "normal", width: "110mm", height: "157mm", backgroundWidth: "157mm", backgroundHeight: "110mm" },
  large: { key: "large", width: "110mm", height: "176mm", backgroundWidth: "176mm", backgroundHeight: "110mm" },
};
const MIRROR_EQUIVALENT_PIECES = {
  P01: "P01/P14",
  P14: "P01/P14",
  P02: "P02/P13",
  P13: "P02/P13",
  P06: "P06/P10",
  P10: "P06/P10",
  P07: "P07/P09",
  P09: "P07/P09",
};
var appMode = loadAppMode();
var PIECE_COLORS_STORAGE_KEY = storageKeyForMode("colors", appMode);
var PIECE_SELECTION_STORAGE_KEY = storageKeyForMode("selection", appMode);
var PIECE_CUSTOM_SELECTION_STORAGE_KEY = storageKeyForMode("custom_selection", appMode);
var DEFAULT_EXCLUDED_PIECES = new Set(["P02", "P10", "P14"]);
var VISUAL_ROTATE_180_PIECES = new Set(["P02", "P07", "P10", "P12", "P13", "P16"]);
var VISUAL_ROTATE_90_PIECES = new Set(["P18"]);
var OLD_EDITION_EXTRA_PIECE_IDS = ["P18"];
var FAMILY_PRESET_PIECE_IDS = ["P01", "P04", "P07", "P09", "P16", "P13", "P17", "P18"];
var CUSTOM_PRESET_PIECE_IDS = ["P01", "P03", "P04", "P06", "P07", "P08", "P09", "P11", "P12", "P13", "P15", "P16", "P17", "P18"];
var DEFAULT_PIECE_COLORS = {
  P01: "#ff70c3",
  P02: "#1f86d1",
  P03: "#f3e5a0",
  P04: "#2da00d",
  P06: "#ab12f3",
  P07: "#f8f8f6",
  P08: "#26ec18",
  P09: "#e0c51a",
  P10: "#8a4f2a",
  P11: "#585556",
  P12: "#f27c0d",
  P13: "#5ee4b0",
  P14: "#35c759",
  P15: "#4784bd",
  P16: "#1054da",
  P17: "#e5392d",
  P18: "#066008",
  D01: "#b46e08",
  D02: "#7f2d89",
  D03: "#68aa1b",
  D04: "#0b9827",
  D05: "#bfd218",
  D06: "#069a79",
  D07: "#d33420",
  D08: "#278fc6",
  D09: "#cbb525",
  D10: "#1aa9d1",
  D11: "#846629",
  D12: "#b83e9b",
};
const PDF_BOARD_PRESETS = [
  { id: "X-A1-top", cells: [[0, 0], [1, 0], [2, 0], [1, 1], [2, 1], [3, 1]] },
  { id: "X-A1-bottom", cells: [[2, 0], [3, 0], [0, 1], [1, 1], [2, 1], [3, 1], [3, 2]] },
  { id: "X-B1-top", cells: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [3, 1], [2, 2]] },
  { id: "X-B1-bottom", cells: [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [0, 2], [1, 2]] },
  { id: "X-B2-top", cells: [[0, 0], [1, 0], [1, 1], [3, 1], [1, 2], [2, 2], [3, 2], [4, 2]] },
  { id: "X-B2-bottom", cells: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [2, 2]] },
  { id: "X-A3-top", cells: [[2, 0], [3, 0], [4, 0], [0, 1], [1, 1], [2, 1], [2, 2]] },
  { id: "X-B3-top", cells: [[0, 0], [1, 0], [2, 0], [1, 1], [2, 1], [3, 1], [4, 1], [1, 2], [2, 2]] },
  { id: "X-B3-bottom", cells: [[2, 0], [3, 0], [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [0, 2], [1, 2], [3, 2]] },
  { id: "X-B4-top", cells: [[1, 0], [2, 0], [3, 0], [4, 0], [0, 1], [1, 1], [3, 1], [1, 2], [2, 2], [3, 2]] },
  { id: "X-B4-bottom", cells: [[1, 0], [2, 0], [3, 0], [4, 0], [1, 1], [2, 1], [3, 1], [4, 1], [0, 2], [1, 2]] },
];

const BUILTIN_THINGIVERSE_PIECES = [{"id":"P01","sourceFiles":["BLEU_5_UBONGO.stl"],"cubes":[[0,0,0],[0,0,1],[1,0,0],[1,1,0],[1,2,0]]},{"id":"P02","sourceFiles":["BLEU_6_UBONGO.stl"],"cubes":[[0,1,0],[0,2,0],[0,2,1],[1,0,0],[1,1,0]]},{"id":"P03","sourceFiles":["BLEU_7_UBONGO.stl"],"cubes":[[0,0,0],[0,1,0],[1,0,0],[1,1,0],[1,2,0]]},{"id":"P04","sourceFiles":["BLEU_8_UBONGO.stl"],"cubes":[[0,0,0],[1,0,0],[1,1,0]]},{"id":"P06","sourceFiles":["JAUNE_2_UBONGO.stl"],"cubes":[[0,2,0],[1,0,0],[1,0,1],[1,1,0],[1,2,0]]},{"id":"P07","sourceFiles":["JAUNE_3_UBONGO.stl"],"cubes":[[0,0,0],[0,1,0],[1,1,0],[1,1,1]]},{"id":"P08","sourceFiles":["JAUNE_4_UBONGO.stl"],"cubes":[[0,0,0],[0,2,0],[1,0,0],[1,1,0],[1,2,0]]},{"id":"P09","sourceFiles":["ROUGE_10_UBONGO.stl"],"cubes":[[0,1,0],[0,1,1],[1,0,0],[1,1,0]]},{"id":"P10","sourceFiles":["ROUGE_11_UBONGO.stl"],"cubes":[[0,0,0],[1,0,0],[1,1,0],[1,2,0],[1,2,1]]},{"id":"P11","sourceFiles":["ROUGE_12_UBONGO.stl"],"cubes":[[0,1,0],[0,2,0],[1,0,0],[1,1,0]]},{"id":"P12","sourceFiles":["ROUGE_9_UBONGO.stl"],"cubes":[[0,0,0],[0,1,0],[1,0,0],[1,1,0],[1,1,1]]},{"id":"P13","sourceFiles":["VERT_13_UBONGO.stl"],"cubes":[[0,0,0],[0,1,0],[1,1,0],[1,2,0],[1,2,1]]},{"id":"P14","sourceFiles":["VERT_14_UBONGO.stl"],"cubes":[[0,2,0],[0,2,1],[1,0,0],[1,1,0],[1,2,0]]},{"id":"P15","sourceFiles":["VERT_15_UBONGO.stl"],"cubes":[[0,1,0],[1,0,0],[1,1,0],[1,2,0]]},{"id":"P16","sourceFiles":["VERT_16_UBONGO.stl"],"cubes":[[0,0,0],[1,0,0],[1,1,0],[1,2,0]]},{"id":"P17","sourceFiles":["thingiverse_5072592/1red.STL"],"cubes":[[0,0,0],[0,1,0]]},{"id":"P18","sourceFiles":["JAUNE_1_UBONGO.stl","Ubongo_3D_3Layers.3mf/manual-brown-layers-100-111-000-010"],"cubes":[[0,1,0],[1,0,0],[1,1,0],[2,1,0],[2,1,1]]}];

const BUILTIN_2D_PIECES = [
  { id: "D01", color: "#b46e08", cells: [[0, 0], [0, 1], [0, 2], [1, 2], [0, 3]] },
  { id: "D02", color: "#7f2d89", cells: [[0, 0], [0, 1]] },
  { id: "D03", color: "#68aa1b", cells: [[0, 0], [1, 0], [0, 1], [0, 2]] },
  { id: "D04", color: "#0b9827", cells: [[1, 0], [0, 1], [1, 1], [0, 2], [1, 2]] },
  { id: "D05", color: "#bfd218", cells: [[0, 0], [0, 1], [1, 1], [0, 2]] },
  { id: "D06", color: "#069a79", cells: [[0, 0], [1, 0], [1, 1]] },
  { id: "D07", color: "#d33420", cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
  { id: "D08", color: "#278fc6", cells: [[0, 0], [0, 1], [1, 1], [1, 2]] },
  { id: "D09", color: "#cbb525", cells: [[0, 0], [1, 0], [1, 1], [1, 2], [2, 2]] },
  { id: "D10", color: "#1aa9d1", cells: [[0, 0], [0, 1], [0, 2]] },
  { id: "D11", color: "#846629", cells: [[0, 0], [0, 1], [0, 2], [0, 3]] },
  { id: "D12", color: "#b83e9b", cells: [[0, 0], [0, 1], [1, 1], [2, 1], [3, 1]] },
];

function hydrate2dPieces(items) {
  return items.map((piece) => ({
    ...piece,
    mode: MODE_2D,
    cells: piece.cells.map(([x, y]) => [x, y]),
    cubes: piece.cells.map(([x, y]) => [x, y, 0]),
  }));
}

var piecesByMode = {
  [MODE_2D]: hydrate2dPieces(structuredClone(BUILTIN_2D_PIECES)),
  [MODE_3D]: structuredClone(BUILTIN_THINGIVERSE_PIECES),
};
var activeLibrariesByMode = {
  [MODE_2D]: "12 фигур с фотографии",
  [MODE_3D]: "Thingiverse 6534722 + 5072592 (встроенная)",
};
let pieces = piecesByMode[appMode];
let lastCard = null;
var generatedCards = [];
var selectedPrintCardIds = [];
var generatedCardSequence = 0;
const MAX_GENERATED_CARDS = 6;
let activeLibrary = activeLibrariesByMode[appMode];
var generationHistoriesByMode = {
  [MODE_2D]: { targets: [], targetFootprints: [], taskVariants: [], comboSets: [], volumes: [], pieceCounts: {} },
  [MODE_3D]: { targets: [], targetFootprints: [], taskVariants: [], comboSets: [], volumes: [], pieceCounts: {} },
};
var generationHistory = generationHistoriesByMode[appMode];
var runtimeByMode = {
  [MODE_2D]: { generatedCards: [], selectedPrintCardIds: [], lastCard: null, manualA: new Set(), manualB: new Set(), pieceCount: 3, levels: 1 },
  [MODE_3D]: { generatedCards: [], selectedPrintCardIds: [], lastCard: null, manualA: new Set(), manualB: new Set(), pieceCount: 3, levels: 2 },
};
var randomSeedMode = false;
var manualLayerCellsA = runtimeByMode[appMode].manualA;
var manualLayerCellsB = runtimeByMode[appMode].manualB;
var pieceColorsById = loadPieceColors();
var pieceSelectionById = loadPieceSelection();
var customPieceSelectionById = loadCustomPieceSelection();

function loadAppMode() {
  try {
    const saved = globalThis.localStorage?.getItem(APP_MODE_STORAGE_KEY);
    return saved === MODE_3D ? MODE_3D : MODE_2D;
  } catch {
    return MODE_2D;
  }
}

function storageKeyForMode(kind, mode = appMode) {
  return `ubongo_${mode}_${kind}_v1`;
}

function is2dMode(mode = appMode) {
  return mode === MODE_2D;
}

function mulberry32(a) {
  return function rng() {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rng, n) {
  return Math.floor(rng() * n);
}

function randomSeed() {
  if (globalThis.crypto?.getRandomValues) {
    const values = new Uint32Array(1);
    globalThis.crypto.getRandomValues(values);
    return values[0] || Date.now();
  }
  return Math.floor(Math.random() * 0xFFFFFFFF) || Date.now();
}

function key(cube) {
  return cube.join(",");
}

function norm(cubes) {
  const mins = [0, 1, 2].map((i) => Math.min(...cubes.map((c) => c[i])));
  return cubes
    .map((c) => [c[0] - mins[0], c[1] - mins[1], c[2] - mins[2]])
    .sort((a, b) => key(a).localeCompare(key(b)));
}

function serialize(cubes) {
  return norm(cubes).map(key).join(";");
}

function serializeAbsolute(cubes) {
  return cubes
    .map(key)
    .sort()
    .join(";");
}

function targetCellsSignature(cells) {
  return serialize(cells);
}

function canonicalPieceId(id) {
  return MIRROR_EQUIVALENT_PIECES[id] || id;
}

function pieceSetSignature(ids) {
  return ids.map(canonicalPieceId).sort().join(",");
}

function visiblePieces() {
  return pieces;
}

function isPieceIncludedInMap(id, selectionMap) {
  if (typeof selectionMap[id] === "boolean") return selectionMap[id];
  return is2dMode() || !DEFAULT_EXCLUDED_PIECES.has(id);
}

function isPieceIncluded(id) {
  return isPieceIncludedInMap(id, pieceSelectionById);
}

function setPieceIncluded(id, included) {
  pieceSelectionById[id] = !!included;
  customPieceSelectionById[id] = !!included;
  savePieceSelection();
  saveCustomPieceSelection();
}

function generationPieces() {
  return pieces.filter((piece) => isPieceIncluded(piece.id));
}

function pieceSourceText(piece) {
  return (piece.sourceFiles || []).join(" ").toLowerCase();
}

function isFamilyThingiversePiece(piece) {
  return pieceSourceText(piece).includes("5072592");
}

function isOldThingiversePiece(piece) {
  const source = pieceSourceText(piece);
  return !source.includes("5072592") && !source.includes("3mf") && !source.includes("manual");
}

function pieceIdsForPreset(presetId) {
  if (is2dMode()) return pieces.map((piece) => piece.id);
  if (presetId === "thingiverse6534722") {
    const ids = pieces.filter(isOldThingiversePiece).map((piece) => piece.id);
    for (const id of OLD_EDITION_EXTRA_PIECE_IDS) {
      if (pieces.some((piece) => piece.id === id) && !ids.includes(id)) ids.push(id);
    }
    return ids;
  }
  if (presetId === "thingiverse5072592") return FAMILY_PRESET_PIECE_IDS.filter((id) => pieces.some((piece) => piece.id === id));
  if (presetId === "all") return pieces.map((piece) => piece.id);
  if (presetId === "custom") return CUSTOM_PRESET_PIECE_IDS.filter((id) => pieces.some((piece) => piece.id === id));
  return generationPieces().map((piece) => piece.id);
}

function applyPiecePreset(presetId) {
  const includedIds = new Set(pieceIdsForPreset(presetId));
  pieceSelectionById = Object.fromEntries(pieces.map((piece) => [piece.id, includedIds.has(piece.id)]));
  savePieceSelection();
  refreshPieceColorViews();
}

function comboSetSignature(combos) {
  return combos.map((combo) => pieceSetSignature(combo.pieces)).sort().join("/");
}

function taskVariantSignature(task) {
  const target = task?.target || [];
  const combos = task?.combos || [];
  return `${targetFootprintCanonicalSignature(target)}|${comboSetSignature(combos)}`;
}

function cardDiversitySignature(card) {
  return `${targetCellsSignature(card.target)}|${comboSetSignature(card.combos)}`;
}

function historyCount(items, value) {
  return items.filter((item) => item === value).length;
}

function emptyGenerationHistory() {
  return { targets: [], targetFootprints: [], taskVariants: [], comboSets: [], volumes: [], pieceCounts: {} };
}

function resetGenerationSession() {
  generationHistory = emptyGenerationHistory();
  generationHistoriesByMode[appMode] = generationHistory;
  generatedCards = [];
  selectedPrintCardIds = [];
  runtimeByMode[appMode].generatedCards = generatedCards;
  runtimeByMode[appMode].selectedPrintCardIds = selectedPrintCardIds;
  runtimeByMode[appMode].lastCard = null;
  lastCard = null;
  renderGeneratedCardList();
}

function serializePieceLibraryForEditor(items = pieces, mode = appMode) {
  if (!is2dMode(mode)) return JSON.stringify(items, null, 2);
  return JSON.stringify(items.map((piece) => ({
    id: piece.id,
    color: piece.color || DEFAULT_PIECE_COLORS[piece.id],
    cells: piece.cells.map(([x, y]) => [x, y]),
  })), null, 2);
}

function stashCurrentModeRuntime() {
  const runtime = runtimeByMode[appMode];
  runtime.generatedCards = generatedCards;
  runtime.selectedPrintCardIds = selectedPrintCardIds;
  runtime.lastCard = lastCard;
  runtime.manualA = manualLayerCellsA;
  runtime.manualB = manualLayerCellsB;
  runtime.pieceCount = Number(document.getElementById("pieceCount")?.value || runtime.pieceCount);
  runtime.levels = Number(document.getElementById("levels")?.value || runtime.levels);
  generationHistoriesByMode[appMode] = generationHistory;
  piecesByMode[appMode] = pieces;
  activeLibrariesByMode[appMode] = activeLibrary;
}

function activateMode(nextMode, options = {}) {
  const normalizedMode = nextMode === MODE_3D ? MODE_3D : MODE_2D;
  if (!options.initial) stashCurrentModeRuntime();
  appMode = normalizedMode;
  try {
    globalThis.localStorage?.setItem(APP_MODE_STORAGE_KEY, appMode);
  } catch {
    // Режим всё равно переключается, даже если хранилище недоступно.
  }

  PIECE_COLORS_STORAGE_KEY = storageKeyForMode("colors", appMode);
  PIECE_SELECTION_STORAGE_KEY = storageKeyForMode("selection", appMode);
  PIECE_CUSTOM_SELECTION_STORAGE_KEY = storageKeyForMode("custom_selection", appMode);
  pieces = piecesByMode[appMode];
  activeLibrary = activeLibrariesByMode[appMode];
  generationHistory = generationHistoriesByMode[appMode];
  const runtime = runtimeByMode[appMode];
  generatedCards = runtime.generatedCards;
  selectedPrintCardIds = runtime.selectedPrintCardIds;
  lastCard = runtime.lastCard;
  manualLayerCellsA = runtime.manualA;
  manualLayerCellsB = runtime.manualB;
  pieceColorsById = loadPieceColors();
  pieceSelectionById = loadPieceSelection();
  customPieceSelectionById = loadCustomPieceSelection();

  const twoDimensional = is2dMode();
  const levelsInput = document.getElementById("levels");
  const pieceCountInput = document.getElementById("pieceCount");
  if (levelsInput) levelsInput.value = String(twoDimensional ? 1 : runtime.levels || 2);
  if (pieceCountInput) {
    pieceCountInput.min = twoDimensional ? "3" : "2";
    pieceCountInput.max = twoDimensional ? "7" : "8";
    pieceCountInput.value = String(twoDimensional ? Math.max(3, Math.min(7, runtime.pieceCount || 3)) : runtime.pieceCount || 3);
  }
  document.getElementById("levelsField")?.classList?.toggle("hidden", twoDimensional);
  document.getElementById("piecePresetBar")?.classList?.toggle("hidden", twoDimensional);
  document.getElementById("mode2d")?.setAttribute?.("aria-pressed", String(twoDimensional));
  document.getElementById("mode3d")?.setAttribute?.("aria-pressed", String(!twoDimensional));
  document.getElementById("mode2d")?.classList?.toggle("active", twoDimensional);
  document.getElementById("mode3d")?.classList?.toggle("active", !twoDimensional);
  if (document.body?.setAttribute) document.body.setAttribute("data-mode", appMode);

  const title = document.getElementById("appTitle");
  const subtitle = document.getElementById("appSubtitle");
  const libraryHint = document.getElementById("libraryHint");
  const formatHint = document.getElementById("pieceLibraryFormatHint");
  const resetPieces = document.getElementById("resetPieces");
  const layersTitle = document.getElementById("layersTitle");
  if (title) title.textContent = `Генератор заданий Ubongo ${twoDimensional ? "2D" : "3D"}`;
  if (subtitle) subtitle.textContent = twoDimensional
    ? "Один контур и шесть разных наборов из 12 фигур с фотографии."
    : "Один 3D-объём и шесть вариантов из реальных деталей Thingiverse.";
  if (libraryHint) libraryHint.innerHTML = twoDimensional
    ? "В режиме 2D используются 12 фигур, восстановленных по фотографии."
    : "Сначала приложение загружает <code>data/pieces_thingiverse_6534722.json</code>. Если браузер блокирует локальную загрузку, выберите JSON вручную.";
  if (formatHint) formatHint.textContent = twoDimensional
    ? "Формат 2D: идентификатор, цвет и список целочисленных координат клеток. Разрешены повороты и отражения."
    : "Формат 3D: идентификатор и список целочисленных координат кубиков. Разрешены пространственные повороты.";
  if (resetPieces) resetPieces.textContent = twoDimensional ? "Вернуть 12 фигур с фотографии" : "Вернуть встроенные детали Thingiverse";
  if (layersTitle) layersTitle.textContent = twoDimensional ? "Целевой контур" : "Целевой объём по слоям";

  const editor = document.getElementById("pieces");
  if (editor) editor.value = serializePieceLibraryForEditor();
  renderManualLayerEditor();
  renderPieceColorControls();
  renderGeneratedCardList();
  const restoredCard = lastCard;
  clearCard();
  if (restoredCard) renderCard(restoredCard, { skipHistory: true });
  setStatus(twoDimensional ? "Режим 2D готов: выберите от 3 до 7 деталей и создайте карточку." : "Режим 3D готов.");
}

function canonicalPiecesForCard(card) {
  return card.combos.flatMap((combo) => combo.pieces.map(canonicalPieceId));
}

function averageComboDistance(card) {
  if (card.combos.length < 2) return 0;
  const sets = card.combos.map((combo) => new Set(combo.pieces.map(canonicalPieceId)));
  let total = 0;
  let pairs = 0;
  for (let i = 0; i < sets.length; i++) {
    for (let j = i + 1; j < sets.length; j++) {
      const overlap = [...sets[i]].filter((id) => sets[j].has(id)).length;
      total += Math.max(sets[i].size, sets[j].size) - overlap;
      pairs++;
    }
  }
  return pairs ? total / pairs : 0;
}

function cardDiversityScore(card, history = generationHistory, rng = Math.random) {
  const targetSignature = targetCellsSignature(card.target);
  const comboSignature = comboSetSignature(card.combos);
  const canonicalPieces = canonicalPiecesForCard(card);
  const uniquePieces = new Set(canonicalPieces);
  const internalRepeats = canonicalPieces.length - uniquePieces.size;
  const historyPiecePenalty = [...uniquePieces].reduce((sum, id) => sum + (history.pieceCounts[id] || 0), 0);
  const targetRepeatPenalty = historyCount(history.targets, targetSignature) * 900;
  const comboRepeatPenalty = historyCount(history.comboSets, comboSignature) * 1200;
  const volumeRepeatPenalty = historyCount(history.volumes || [], card.target.length) * 850;
  const repeatedComboShapePenalty = internalRepeats * 45;
  const lowDistancePenalty = Math.max(0, 1.6 - averageComboDistance(card)) * 120;

  return (
    uniquePieces.size * 80 +
    targetShapeScore(card.target) * 10 +
    card.target.length * 4 +
    card.combos.length * 8 +
    rng() * 12 -
    targetRepeatPenalty -
    comboRepeatPenalty -
    volumeRepeatPenalty -
    historyPiecePenalty * 210 -
    repeatedComboShapePenalty -
    lowDistancePenalty
  );
}

function comboDiversityScore(combo, usedPieceCounts, history, rng) {
  const canonicalIds = combo.pieces.map(canonicalPieceId);
  const uniqueIds = new Set(canonicalIds);
  const overlap = [...uniqueIds].filter((id) => (usedPieceCounts.get(id) || 0) > 0).length;
  const repeatPressure = [...uniqueIds].reduce((sum, id) => {
    const usedCount = usedPieceCounts.get(id) || 0;
    return sum + usedCount * usedCount;
  }, 0);
  const historyPenalty = [...uniqueIds].reduce((sum, id) => sum + (history.pieceCounts[id] || 0), 0);
  return uniqueIds.size * 120 - overlap * 180 - repeatPressure * 95 - historyPenalty * 70 + rng() * 8;
}

function selectDiverseCombos(combos, requestedCount, history, rng) {
  const selected = [];
  const usedPieceCounts = new Map();
  const remaining = combos.slice();
  while (remaining.length && selected.length < requestedCount) {
    let bestIndex = 0;
    let bestScore = -Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const score = comboDiversityScore(remaining[i], usedPieceCounts, history, rng);
      if (score > bestScore) {
        bestIndex = i;
        bestScore = score;
      }
    }
    const [combo] = remaining.splice(bestIndex, 1);
    selected.push(combo);
    for (const id of combo.pieces.map(canonicalPieceId)) {
      usedPieceCounts.set(id, (usedPieceCounts.get(id) || 0) + 1);
    }
  }
  return selected;
}

function usedTargetFootprintSignatures(history = generationHistory) {
  return new Set(history?.targetFootprints || []);
}

function usedTaskVariantSignatures(history = generationHistory) {
  return new Set(history?.taskVariants || []);
}

function newUniqueTargetError() {
  return new Error("No new unique targets left for this session. Change settings, increase attempts, or start a new session.");
}

function fullVariantRequirementText() {
  const taskCount = selectedTaskCount();
  const combosPerTask = combosPerTaskForTaskCount(taskCount);
  if (taskCount === 2) return `full ${combosPerTask}/${combosPerTask} + ${combosPerTask}/${combosPerTask} variant set`;
  return `full ${VARIANT_SLOTS_PER_CARD}/${VARIANT_SLOTS_PER_CARD} variant set`;
}

function incompleteGenerationFailureMessage() {
  return `Could not find a ${fullVariantRequirementText()} within the current Generation attempts budget. Try Generate card again, increase attempts, or broaden the active piece set.`;
}

function generationProgressMessage() {
  if (!currentGenerationAttempt || !currentGenerationAttemptBudget) {
    return "Генерация: ищем контур и подходящие наборы деталей…";
  }
  return `Генерация: вариант карточки ${currentGenerationAttempt} из ${currentGenerationAttemptBudget}…`;
}

function autoTargetSearchLimit(targetCount, attempts) {
  if (!targetCount) return 0;
  const adaptiveBudget = Math.ceil(160 / Math.sqrt(Math.max(1, attempts)));
  return Math.min(targetCount, Math.max(8, Math.min(64, adaptiveBudget)));
}

function autoComboSetSearchLimit(candidateSetCount, comboCount, pieceCount, attempts) {
  if (!candidateSetCount) return 0;
  const adaptiveBudget = Math.ceil(280 / Math.sqrt(Math.max(1, attempts))) + pieceCount * 5;
  return Math.min(candidateSetCount, Math.max(comboCount * 5, Math.min(96, adaptiveBudget)));
}

function updateGenerationHistory(card) {
  generationHistory.targets ||= [];
  generationHistory.targetFootprints ||= [];
  generationHistory.taskVariants ||= [];
  generationHistory.comboSets ||= [];
  generationHistory.volumes ||= [];
  generationHistory.pieceCounts ||= {};
  const tasks = card.tasks || [{ target: card.target, combos: card.combos }];
  const targetSignature = targetCellsSignature(card.target);
  const comboSignature = comboSetSignature(card.combos);
  generationHistory.targets.push(targetSignature);
  for (const task of tasks) {
    generationHistory.targetFootprints.push(targetFootprintCanonicalSignature(task.target));
    generationHistory.taskVariants.push(taskVariantSignature(task));
  }
  generationHistory.comboSets.push(comboSignature);
  generationHistory.volumes.push(card.target.length);
  generationHistory.targets = generationHistory.targets.slice(-16);
  generationHistory.comboSets = generationHistory.comboSets.slice(-16);
  generationHistory.volumes = generationHistory.volumes.slice(-16);
  for (const id of canonicalPiecesForCard(card)) {
    generationHistory.pieceCounts[id] = (generationHistory.pieceCounts[id] || 0) + 1;
  }
}

function targetLayerStats(cells) {
  const layer = cells.filter((cell) => cell[2] === 0);
  return {
    area: layer.length,
    width: 1 + Math.max(...layer.map((cell) => cell[0])),
    height: 1 + Math.max(...layer.map((cell) => cell[1])),
  };
}

function targetLayerPerimeter(cells) {
  const layer = cells.filter((cell) => cell[2] === 0);
  const occupied = new Set(layer.map(([x, y]) => `${x},${y}`));
  let perimeter = 0;
  for (const [x, y] of layer) {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (!occupied.has(`${x + dx},${y + dy}`)) perimeter++;
    }
  }
  return perimeter;
}

function isPlainRectangularTarget(cells) {
  const stats = targetLayerStats(cells);
  return stats.area >= 6 && stats.area === stats.width * stats.height && targetLayerPerimeter(cells) === 2 * (stats.width + stats.height);
}

function targetShapeScore(cells) {
  const stats = targetLayerStats(cells);
  const perimeter = targetLayerPerimeter(cells);
  const boxArea = stats.width * stats.height;
  const missingInBox = boxArea - stats.area;
  const fillRatio = stats.area / boxArea;
  const span = Math.max(stats.width, stats.height);
  const rectanglePenalty = isPlainRectangularTarget(cells) ? 100 : 0;
  const skinnyPenalty = Math.min(stats.width, stats.height) === 1 ? 12 : 0;
  return perimeter + missingInBox * 4 + span * 2 - Math.round(fillRatio * 6) - rectanglePenalty - skinnyPenalty;
}

function boardFitRequirement(w, h) {
  const largeBoard = Math.min(w, h) >= 6;
  return {
    required: largeBoard,
    minSpan: largeBoard ? 4 : Math.min(3, Math.min(w, h)),
    minArea: largeBoard ? 8 : Math.min(6, w * h),
  };
}

function targetVolumeOrder(rng, volumes) {
  const ordered = volumes.slice().sort((a, b) => a - b);
  if (ordered.length < 2) return ordered;
  const start = randInt(rng, ordered.length);
  return ordered.slice(start).concat(ordered.slice(0, start));
}

function targetFitScore(card) {
  const stats = targetLayerStats(card.target);
  const span = Math.max(stats.width / card.w, stats.height / card.h);
  const coverage = stats.area / (card.w * card.h);
  return card.combos.length * 100 + card.target.length + targetShapeScore(card.target) + Math.round(span * 40) + Math.round(coverage * 40);
}

function usesBoardWell(card) {
  const stats = targetLayerStats(card.target);
  const requirement = boardFitRequirement(card.w, card.h);
  return (stats.width >= requirement.minSpan || stats.height >= requirement.minSpan) && stats.area >= requirement.minArea;
}

function rotations(cubes) {
  const maps = [
    ([x, y, z]) => [x, y, z],
    ([x, y, z]) => [x, -y, -z],
    ([x, y, z]) => [x, z, -y],
    ([x, y, z]) => [x, -z, y],
    ([x, y, z]) => [-x, y, -z],
    ([x, y, z]) => [-x, -y, z],
    ([x, y, z]) => [-x, z, y],
    ([x, y, z]) => [-x, -z, -y],
    ([x, y, z]) => [y, x, -z],
    ([x, y, z]) => [y, -x, z],
    ([x, y, z]) => [y, z, x],
    ([x, y, z]) => [y, -z, -x],
    ([x, y, z]) => [-y, x, z],
    ([x, y, z]) => [-y, -x, -z],
    ([x, y, z]) => [-y, z, -x],
    ([x, y, z]) => [-y, -z, x],
    ([x, y, z]) => [z, x, y],
    ([x, y, z]) => [z, -x, -y],
    ([x, y, z]) => [z, y, -x],
    ([x, y, z]) => [z, -y, x],
    ([x, y, z]) => [-z, x, -y],
    ([x, y, z]) => [-z, -x, y],
    ([x, y, z]) => [-z, y, x],
    ([x, y, z]) => [-z, -y, -x],
  ];
  const seen = new Set();
  const out = [];
  for (const map of maps) {
    const rotated = norm(cubes.map(map));
    const signature = serialize(rotated);
    if (!seen.has(signature)) {
      seen.add(signature);
      out.push(rotated);
    }
  }
  return out;
}

function orientations2d(cells) {
  const transforms = [
    ([x, y]) => [x, y],
    ([x, y]) => [-y, x],
    ([x, y]) => [-x, -y],
    ([x, y]) => [y, -x],
    ([x, y]) => [-x, y],
    ([x, y]) => [-y, -x],
    ([x, y]) => [x, -y],
    ([x, y]) => [y, x],
  ];
  const seen = new Set();
  const out = [];
  for (const transform of transforms) {
    const oriented = norm(cells.map(transform).map(([x, y]) => [x, y, 0]));
    const signature = serialize(oriented);
    if (!seen.has(signature)) {
      seen.add(signature);
      out.push(oriented);
    }
  }
  return out;
}

function dims(cubes) {
  return [0, 1, 2].map((i) => 1 + Math.max(...cubes.map((c) => c[i])));
}

function translate(cubes, dx, dy, dz) {
  return cubes.map((c) => [c[0] + dx, c[1] + dy, c[2] + dz]);
}

function inside(cubes, w, h, l) {
  return cubes.every((c) => c[0] >= 0 && c[0] < w && c[1] >= 0 && c[1] < h && c[2] >= 0 && c[2] < l);
}

function overlaps(cubes, occupied) {
  return cubes.some((c) => occupied.has(key(c)));
}

function connected(cells) {
  if (!cells.length) return false;
  const set = new Set(cells.map(key));
  const queue = [cells[0]];
  const seen = new Set([key(cells[0])]);
  const dirs = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  while (queue.length) {
    const c = queue.pop();
    for (const d of dirs) {
      const next = [c[0] + d[0], c[1] + d[1], c[2] + d[2]];
      const nextKey = key(next);
      if (set.has(nextKey) && !seen.has(nextKey)) {
        seen.add(nextKey);
        queue.push(next);
      }
    }
  }
  return seen.size === cells.length;
}

function connected2d(cells) {
  if (!cells.length) return false;
  const set = new Set(cells.map(([x, y]) => `${x},${y}`));
  const queue = [cells[0]];
  const seen = new Set([`${cells[0][0]},${cells[0][1]}`]);
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  while (queue.length) {
    const [x, y] = queue.pop();
    for (const [dx, dy] of dirs) {
      const next = [x + dx, y + dy];
      const nextKey = `${next[0]},${next[1]}`;
      if (set.has(nextKey) && !seen.has(nextKey)) {
        seen.add(nextKey);
        queue.push(next);
      }
    }
  }
  return seen.size === cells.length;
}

function hasEqualLayers(cells, levels) {
  if (!cells.length || cells.length % levels !== 0) return false;
  const signatures = [];
  for (let z = 0; z < levels; z++) {
    const layer = cells
      .filter((c) => c[2] === z)
      .map((c) => `${c[0]},${c[1]}`)
      .sort()
      .join(";");
    if (!layer) return false;
    signatures.push(layer);
  }
  return signatures.every((signature) => signature === signatures[0]);
}

function extrudeSilhouette(cells, levels) {
  const out = [];
  for (let z = 0; z < levels; z++) {
    for (const [x, y] of cells) out.push([x, y, z]);
  }
  return out;
}

function selectedTaskCount() {
  if (is2dMode()) return 1;
  const pieceCount = Number(document.getElementById("pieceCount")?.value || 0);
  return pieceCount === 3 ? 2 : 1;
}

function boardDimensionsForTaskCount(taskCount) {
  return { w: 7, h: 5 };
}

function taskBoardDimensions(taskIndex, taskCount) {
  if (taskCount === 2) {
    return taskIndex === 0 ? { w: 3, h: 5 } : { w: 4, h: 5 };
  }
  return boardDimensionsForTaskCount(taskCount);
}

function currentBoardDimensions() {
  return boardDimensionsForTaskCount(selectedTaskCount());
}

function currentTaskBoardDimensions(taskIndex = 0) {
  return taskBoardDimensions(taskIndex, selectedTaskCount());
}

function boardLabelForTaskCount(taskCount) {
  if (is2dMode()) return "7x5";
  return taskCount === 2 ? "3x5 + 4x5" : "7x5";
}

function boardLabelForCard(card) {
  if (card?.mode === MODE_2D) return "7x5";
  const taskCount = card?.tasks?.length || 1;
  return boardLabelForTaskCount(taskCount);
}

function combosPerTaskForTaskCount(taskCount) {
  return taskCount === 1 ? VARIANT_SLOTS_PER_CARD : COMBOS_PER_TASK;
}

function letterForCount(value) {
  const count = Math.max(1, Math.min(26, Math.trunc(Number(value) || 1)));
  return String.fromCharCode(64 + count);
}

function normalizeCardNumber(value) {
  const number = Math.trunc(Number(value) || 1);
  return ((number - 1) % 99 + 99) % 99 + 1;
}

function formatCardNumber(value) {
  return String(normalizeCardNumber(value)).padStart(2, "0");
}

function nextCardNumberValue(value) {
  const current = normalizeCardNumber(value);
  return current >= 99 ? 1 : current + 1;
}

function selectedTargetCellSize() {
  const value = Number(document.getElementById("targetCellSize")?.value);
  return value === 13 ? 13 : 14.5;
}

function modeForCard(card) {
  if (card?.mode === MODE_2D || card?.mode === MODE_3D) return card.mode;
  const ids = card?.combos?.flatMap((combo) => combo.pieces || [])
    || card?.tasks?.flatMap((task) => task.combos?.flatMap((combo) => combo.pieces || []) || [])
    || [];
  return ids.some((id) => String(id).startsWith("D")) ? MODE_2D : MODE_3D;
}

function challengeCodeForCard(card) {
  const pieceCount = card.pieceCount || card.combos?.[0]?.pieces?.length || card.tasks?.[0]?.combos?.[0]?.pieces?.length || 1;
  if (modeForCard(card) === MODE_2D) {
    return `2D-${pieceCount}-${formatCardNumber(card.cardNumber)}`;
  }
  return `${letterForCount(pieceCount)}${letterForCount(card.levels)}-${formatCardNumber(card.cardNumber)}`;
}

function targetFootprintStats(target) {
  const footprint = new Set((target || []).map(([x, y]) => `${x},${y}`));
  const cells = [...footprint].map((cell) => cell.split(",").map(Number));
  if (!cells.length) return { width: 0, height: 0, minX: 0, minY: 0, rowCounts: {} };
  const minX = Math.min(...cells.map(([x]) => x));
  const maxX = Math.max(...cells.map(([x]) => x));
  const minY = Math.min(...cells.map(([, y]) => y));
  const maxY = Math.max(...cells.map(([, y]) => y));
  const rowCounts = {};
  for (const [, y] of cells) {
    const normalizedY = y - minY;
    rowCounts[normalizedY] = (rowCounts[normalizedY] || 0) + 1;
  }
  return { width: maxX - minX + 1, height: maxY - minY + 1, minX, minY, rowCounts };
}

function targetFootprintSignature(target) {
  const footprint = new Set((target || []).map(([x, y]) => `${x},${y}`));
  const cells = [...footprint].map((cell) => cell.split(",").map(Number));
  return normalizedFootprintSignature(cells);
}

function normalizedFootprintSignature(cells) {
  if (!cells.length) return "";
  const minX = Math.min(...cells.map(([x]) => x));
  const minY = Math.min(...cells.map(([, y]) => y));
  return cells
    .map(([x, y]) => `${x - minX},${y - minY}`)
    .sort()
    .join(";");
}

function targetFootprintCanonicalSignature(target) {
  const footprint = new Set((target || []).map(([x, y]) => `${x},${y}`));
  const cells = [...footprint].map((cell) => cell.split(",").map(Number));
  if (!cells.length) return "";
  const transforms = [
    ([x, y]) => [x, y],
    ([x, y]) => [x, -y],
    ([x, y]) => [-x, y],
    ([x, y]) => [-x, -y],
    ([x, y]) => [y, x],
    ([x, y]) => [y, -x],
    ([x, y]) => [-y, x],
    ([x, y]) => [-y, -x],
  ];
  return transforms
    .map((transform) => normalizedFootprintSignature(cells.map(transform)))
    .sort()[0];
}

function twoTaskTargetsFitOnCard(tasksOrTargets) {
  const items = (tasksOrTargets || []).filter(Boolean);
  const targets = items.map((item) => item?.target || item).filter(Boolean);
  if (targets.length < 2) return true;
  const stats = targets.slice(0, 2).map(targetFootprintStats);
  if (stats[0].width > 3 || stats[1].width > 4) return false;
  const sameCanonicalFootprint = targetFootprintCanonicalSignature(targets[0]) === targetFootprintCanonicalSignature(targets[1]);
  if (sameCanonicalFootprint) return false;
  const fullRows = stats.map((item) => new Set(Object.entries(item.rowCounts).filter(([, count]) => count >= 4).map(([row]) => row)));
  return ![...fullRows[0]].some((row) => {
    const rowIndex = Number(row);
    return [rowIndex - 1, rowIndex, rowIndex + 1].some((nearbyRow) => fullRows[1].has(String(nearbyRow)));
  });
}

const TWO_TASK_TARGET_COLLISION_MESSAGE = "Two task targets collide: left target must be at most 3 columns wide, right target must be at most 4 columns wide, mirrored/equivalent contours cannot repeat, and 4-cell rows cannot be on the same or adjacent rows.";
const INCOMPLETE_GENERATION_FAILURE_MESSAGE = "Could not find a full variant set within the current Generation attempts budget. Try Generate card again, increase attempts, or broaden the active piece set.";
const SESSION_EXHAUSTED_STATUS_MESSAGE = "В этой сессии закончились новые уникальные контуры. Начните новую сессию, чтобы снова разрешить ранее встречавшиеся формы.";
var currentGenerationAttempt = null;
var currentGenerationAttemptBudget = null;

function backgroundForCardMode(pieceCount, levels) {
  if (Number(pieceCount) >= 6) {
    return { key: "large", asset: CARD_BACKGROUNDS.large };
  }
  const keyByMode = {
    "3x2": "cyan",
    "4x2": "pink",
    "4x3": "navy",
    "5x3": "ppl",
  };
  const key = keyByMode[`${Number(pieceCount)}x${Number(levels)}`] || "green";
  return { key, asset: CARD_BACKGROUNDS[key] };
}

function backgroundFor2dCard(pieceCount) {
  return backgroundForCardMode(pieceCount, 2);
}

function cardLayoutForBackgroundKey(backgroundKey) {
  return backgroundKey === "large" ? CARD_LAYOUTS.large : CARD_LAYOUTS.normal;
}

function manualLayerTarget(w, h, levels, cellsSet = manualLayerCellsA, label = "") {
  if (!document.getElementById("manualMode")?.checked) return null;
  const prefix = label ? ` ${label}` : "";
  const cells = [...cellsSet].map((value) => value.split(",").map(Number));
  if (!cells.length) throw new Error(`Draw at least one cell in manual layer${prefix}.`);
  if (cells.some(([x, y]) => x < 0 || x >= w || y < 0 || y >= h)) {
    throw new Error(`Manual layer${prefix} has cells outside the fixed ${w}x${h} task area.`);
  }
  if (!connected2d(cells)) throw new Error(`Manual layer${prefix} cells must be connected by sides.`);
  return extrudeSilhouette(cells, levels);
}

function randomSilhouette(rng, w, h, area) {
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let restart = 0; restart < 40; restart++) {
    const start = [randInt(rng, w), randInt(rng, h)];
    const cells = [start];
    const seen = new Set([`${start[0]},${start[1]}`]);
    const frontier = [];

    function addFrontier([x, y]) {
      for (const [dx, dy] of dirs) {
        const next = [x + dx, y + dy];
        const nextKey = `${next[0]},${next[1]}`;
        if (next[0] >= 0 && next[0] < w && next[1] >= 0 && next[1] < h && !seen.has(nextKey)) {
          frontier.push(next);
        }
      }
    }

    addFrontier(start);
    while (cells.length < area && frontier.length) {
      const next = frontier.splice(randInt(rng, frontier.length), 1)[0];
      const nextKey = `${next[0]},${next[1]}`;
      if (seen.has(nextKey)) continue;
      seen.add(nextKey);
      cells.push(next);
      addFrontier(next);
    }

    if (cells.length === area) {
      return norm(cells.map(([x, y]) => [x, y, 0])).map(([x, y]) => [x, y]);
    }
  }

  const start = [randInt(rng, w), randInt(rng, h)];
  const cells = [start];
  const seen = new Set([`${start[0]},${start[1]}`]);
  while (cells.length < area) {
    const [x, y] = cells[randInt(rng, cells.length)];
    const options = shuffle(rng, dirs)
      .map(([dx, dy]) => [x + dx, y + dy])
      .filter(([nx, ny]) => nx >= 0 && nx < w && ny >= 0 && ny < h && !seen.has(`${nx},${ny}`));
    if (!options.length) continue;
    const next = options[0];
    seen.add(`${next[0]},${next[1]}`);
    cells.push(next);
  }
  return norm(cells.map(([x, y]) => [x, y, 0])).map(([x, y]) => [x, y]);
}

function interestingSilhouette(rng, w, h, area) {
  let best = null;
  let bestScore = -Infinity;
  for (let attempt = 0; attempt < 16; attempt++) {
    const silhouette = randomSilhouette(rng, w, h, area);
    const target = extrudeSilhouette(silhouette, 1);
    const score = targetShapeScore(target) + rng() * 3;
    if (score > bestScore) {
      best = silhouette;
      bestScore = score;
    }
  }
  return best;
}

function randomEqualLayerTarget(rng, w, h, levels, area) {
  for (let attempt = 0; attempt < 80; attempt++) {
    const silhouette = interestingSilhouette(rng, w, h, area);
    if (connected2d(silhouette)) return extrudeSilhouette(silhouette, levels);
  }
  return null;
}

function presetTargetsFor(w, h, levels, volumes) {
  const volumeSet = new Set(volumes);
  return PDF_BOARD_PRESETS
    .filter((preset) => {
      const presetWidth = 1 + Math.max(...preset.cells.map((cell) => cell[0]));
      const presetHeight = 1 + Math.max(...preset.cells.map((cell) => cell[1]));
      return presetWidth <= w && presetHeight <= h && volumeSet.has(preset.cells.length * levels);
    })
    .map((preset) => ({ id: preset.id, target: extrudeSilhouette(preset.cells, levels) }));
}

function connectedSilhouettes(w, h, area, limit = 20000) {
  const cells = [];
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) cells.push([x, y]);
  }
  const out = [];
  function rec(start, picked) {
    if (out.length >= limit) return;
    if (picked.length === area) {
      if (connected2d(picked)) out.push(picked.map((cell) => cell.slice()));
      return;
    }
    for (let i = start; i <= cells.length - (area - picked.length); i++) {
      picked.push(cells[i]);
      rec(i + 1, picked);
      picked.pop();
    }
  }
  rec(0, []);
  return out;
}

function generatedTargetsFor(rng, w, h, levels, volumes, attempts) {
  const targets = [];
  const seen = new Set();
  const requirement = boardFitRequirement(w, h);
  const randomPerVolume = is2dMode()
    ? Math.min(Math.max(attempts, 36), 90)
    : requirement.required
      ? Math.min(Math.max(attempts, 220), 1100)
      : Math.min(Math.max(attempts, 140), 700);

  function addTarget(silhouette, id) {
    const target = extrudeSilhouette(silhouette, levels);
    const signature = targetCellsSignature(target);
    if (seen.has(signature)) return;
    seen.add(signature);
    targets.push({ id, target });
  }

  for (const volume of volumes) {
    const beforeVolume = targets.length;
    const area = volume / levels;

    for (let i = 0; i < randomPerVolume; i++) {
      const silhouette = interestingSilhouette(rng, w, h, area);
      const target = extrudeSilhouette(silhouette, levels);
      const stats = targetLayerStats(target);
      if (requirement.required && !((stats.width >= requirement.minSpan || stats.height >= requirement.minSpan) && stats.area >= requirement.minArea)) {
        continue;
      }
      if (isPlainRectangularTarget(target)) continue;
      addTarget(silhouette, "random-growth");
    }

    if (!is2dMode() && targets.length - beforeVolume < Math.min(20, attempts)) {
      for (const silhouette of connectedSilhouettes(w, h, area, 800)) {
        const target = extrudeSilhouette(silhouette, levels);
        const stats = targetLayerStats(target);
        if (requirement.required && !((stats.width >= requirement.minSpan || stats.height >= requirement.minSpan) && stats.area >= requirement.minArea)) continue;
        if (isPlainRectangularTarget(target)) continue;
        addTarget(silhouette, "connected-fallback");
      }
    }

    if (!is2dMode() && Math.min(w, h) >= 3) {
      for (const silhouette of connectedSilhouettes(w, h, area, 800)) {
        const target = extrudeSilhouette(silhouette, levels);
        const stats = targetLayerStats(target);
        if (requirement.required && !((stats.width >= requirement.minSpan || stats.height >= requirement.minSpan) && stats.area >= requirement.minArea)) continue;
        if (isPlainRectangularTarget(target)) addTarget(silhouette, "plain-fallback");
      }
    }

    const volumeTargets = targets.splice(beforeVolume);
    targets.push(
      ...shuffle(rng, volumeTargets)
        .map((target) => ({ ...target, score: targetShapeScore(target.target) + rng() * 4 }))
        .sort((a, b) => b.score - a.score)
        .map(({ score, ...target }) => target),
    );
  }

  if (requirement.required && targets.length < Math.min(attempts, 80)) {
    for (const volume of volumes) {
      const area = volume / levels;
      for (const silhouette of connectedSilhouettes(w, h, area, 600)) addTarget(silhouette, "connected-fallback");
    }
  }

  return targets;
}

function subsets(items, count) {
  const result = [];
  function rec(start, combo) {
    if (combo.length === count) {
      result.push(combo.slice());
      return;
    }
    for (let i = start; i <= items.length - (count - combo.length); i++) {
      combo.push(items[i]);
      rec(i + 1, combo);
      combo.pop();
    }
  }
  rec(0, []);
  return result;
}

function shuffle(rng, items) {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randInt(rng, i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function stableHash(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function displayPiecesForCombo(combo, card, slotIndex) {
  const pieces = (combo?.pieces || []).slice();
  if (pieces.length < 2) return pieces;
  const seed = stableHash(`${card?.seed ?? 0}|${slotIndex}|${pieces.join(",")}`);
  let ordered = shuffle(mulberry32(seed), pieces);
  const offset = slotIndex % ordered.length;
  if (offset) ordered = ordered.slice(offset).concat(ordered.slice(0, offset));
  if (ordered.every((id, index) => id === pieces[index])) {
    const fallbackOffset = (seed % (pieces.length - 1)) + 1;
    ordered = pieces.slice(fallbackOffset).concat(pieces.slice(0, fallbackOffset));
  }
  return ordered;
}

function makePlacementsForPiece(piece, w, h, l, targetSet = null) {
  const out = [];
  const orientations = piece.mode === MODE_2D || piece.cells
    ? orientations2d(piece.cells || piece.cubes.map(([x, y]) => [x, y]))
    : rotations(piece.cubes);
  for (const rotation of orientations) {
    const [dw, dh, dl] = dims(rotation);
    for (let x = 0; x <= w - dw; x++) {
      for (let y = 0; y <= h - dh; y++) {
        for (let z = 0; z <= l - dl; z++) {
          const placed = translate(rotation, x, y, z);
          if (targetSet && !placed.every((c) => targetSet.has(key(c)))) continue;
          out.push({ id: piece.id, cubes: placed });
        }
      }
    }
  }
  const seen = new Set();
  return out.filter((placement) => {
    const signature = serializeAbsolute(placement.cubes);
    if (seen.has(signature)) return false;
    seen.add(signature);
    return true;
  });
}

function randomTiling(rng, selected, w, h, l, maxTries = 250, placementCache = null, requireEqualLayers = false) {
  const placements = Object.fromEntries(selected.map((p) => [p.id, placementCache?.[p.id] || makePlacementsForPiece(p, w, h, l)]));
  for (let t = 0; t < maxTries; t++) {
    const occupied = new Set();
    const placed = [];
    let ok = true;
    for (const piece of shuffle(rng, selected)) {
      const options = shuffle(rng, placements[piece.id]).filter((p) => inside(p.cubes, w, h, l) && !overlaps(p.cubes, occupied));
      if (!options.length) {
        ok = false;
        break;
      }
      const pick = options[0];
      pick.cubes.forEach((c) => occupied.add(key(c)));
      placed.push(pick);
    }
    const cells = [...occupied].map((s) => s.split(",").map(Number));
    if (ok && connected(cells) && (!requireEqualLayers || hasEqualLayers(cells, l))) return { cells, placed };
  }
  return null;
}

function pieceSetNoveltyScore(set, history, rng) {
  const ids = new Set(set.map((piece) => canonicalPieceId(piece.id)));
  const historyPenalty = [...ids].reduce((sum, id) => sum + (history.pieceCounts[id] || 0), 0);
  return ids.size * 80 - historyPenalty * 120 + rng() * 20;
}

function pickNovelPieceSet(rng, sets, history) {
  let best = sets[randInt(rng, sets.length)];
  let bestScore = pieceSetNoveltyScore(best, history, rng);
  for (let i = 0; i < Math.min(8, sets.length); i++) {
    const candidate = sets[randInt(rng, sets.length)];
    const score = pieceSetNoveltyScore(candidate, history, rng);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return best;
}

function solutionDerivedTargetsFor(rng, w, h, levels, volumes, allSubsets, attempts, placementCache, history = emptyGenerationHistory()) {
  const targets = [];
  const seen = new Set();
  const requirement = boardFitRequirement(w, h);
  const triesPerVolume = Math.min(Math.max(Math.floor(attempts / 40), 12), 36);

  function addTarget(cells) {
    const signature = targetCellsSignature(cells);
    if (seen.has(signature)) return;
    const stats = targetLayerStats(cells);
    if (requirement.required && !((stats.width >= requirement.minSpan || stats.height >= requirement.minSpan) && stats.area >= requirement.minArea)) return;
    if (isPlainRectangularTarget(cells)) return;
    seen.add(signature);
    targets.push({ id: "solution-derived", target: cells });
  }

  for (const volume of volumes) {
    const sets = allSubsets.filter((set) => set.reduce((sum, piece) => sum + piece.cubes.length, 0) === volume);
    if (!sets.length) continue;
    for (let i = 0; i < triesPerVolume; i++) {
      const selected = i % 2 === 0 ? pickNovelPieceSet(rng, sets, history) : sets[randInt(rng, sets.length)];
      const tiling = randomTiling(rng, selected, w, h, levels, 36, placementCache, true);
      if (tiling) addTarget(tiling.cells);
    }
  }
  return targets;
}

function mixTargetCandidates(rng, presetTargets, randomTargets, solutionTargets, attempts) {
  const sourceMaps = [presetTargets, randomTargets, solutionTargets].map((source) => {
    const map = new Map();
    for (const target of shuffle(rng, source.slice())) {
      const volume = target.target.length;
      if (!map.has(volume)) map.set(volume, []);
      map.get(volume).push(target);
    }
    return map;
  });
  const volumes = shuffle(rng, [...new Set(sourceMaps.flatMap((map) => [...map.keys()]))]);
  const out = [];
  const seen = new Set();
  while (out.length < attempts && sourceMaps.some((map) => [...map.values()].some((source) => source.length))) {
    for (const volume of volumes) {
      for (const map of sourceMaps) {
        const source = map.get(volume);
        if (!source?.length || out.length >= attempts) continue;
        const target = source.shift();
        const signature = targetCellsSignature(target.target);
        if (seen.has(signature)) continue;
        seen.add(signature);
        out.push(target);
      }
    }
  }
  return out;
}

function solveExact(selected, targetCells, w, h, l, rng, maxNodes = 40000, placementCache = null) {
  const targetSet = new Set(targetCells.map(key));
  let nodes = 0;
  const all = selected.map((p) => {
    const placements = shuffle(rng, (placementCache?.[p.id] || makePlacementsForPiece(p, w, h, l)).filter((placement) => placement.cubes.every((c) => targetSet.has(key(c)))));
    const placementsByCell = new Map();
    for (const placement of placements) {
      for (const cube of placement.cubes) {
        const cubeKey = key(cube);
        if (!placementsByCell.has(cubeKey)) placementsByCell.set(cubeKey, []);
        placementsByCell.get(cubeKey).push(placement);
      }
    }
    return { id: p.id, placements, placementsByCell };
  });
  if (all.some((piece) => piece.placements.length === 0)) return null;

  function nextCell(unused, occupied) {
    let bestCell = null;
    let bestCount = Infinity;
    for (const cell of targetSet) {
      if (occupied.has(cell)) continue;
      let count = 0;
      for (const piece of unused) count += piece.placementsByCell.get(cell)?.length || 0;
      if (count < bestCount) {
        bestCell = cell;
        bestCount = count;
        if (count === 0) break;
      }
    }
    return bestCount === 0 ? null : bestCell;
  }

  function rec(unused, occupied, placed) {
    nodes++;
    if (nodes > maxNodes) return null;
    if (unused.length === 0) return occupied.size === targetSet.size ? placed : null;
    const firstEmpty = nextCell(unused, occupied);
    if (!firstEmpty) return null;
    const candidates = [];
    for (let i = 0; i < unused.length; i++) {
      for (const placement of unused[i].placementsByCell.get(firstEmpty) || []) {
        if (!overlaps(placement.cubes, occupied)) {
          candidates.push({ pieceIndex: i, placement });
        }
      }
    }
    if (!candidates.length) return null;
    for (const { pieceIndex, placement } of candidates) {
      const piece = unused[pieceIndex];
      const nextUnused = unused.slice(0, pieceIndex).concat(unused.slice(pieceIndex + 1));
      const nextOccupied = new Set(occupied);
      placement.cubes.forEach((c) => nextOccupied.add(key(c)));
      const answer = rec(nextUnused, nextOccupied, placed.concat([{ id: piece.id, cubes: placement.cubes }]));
      if (answer) return answer;
    }
    return null;
  }
  return rec(all, new Set(), []);
}

function solveFootprint(selected, footprintCells, w, h, l, rng, maxNodes = 50000, placementCache = null) {
  const footprintSet = new Set(footprintCells.map(([x, y]) => `${x},${y}`));
  let nodes = 0;
  const all = selected.map((p) => ({
    id: p.id,
    placements: shuffle(rng, (placementCache?.[p.id] || makePlacementsForPiece(p, w, h, l)).filter((placement) =>
      placement.cubes.every(([x, y]) => footprintSet.has(`${x},${y}`)),
    )),
  }));
  function rec(unused, occupied, covered, placed) {
    nodes++;
    if (nodes > maxNodes) return null;
    if (unused.length === 0) {
      return covered.size === footprintSet.size && [...footprintSet].every((cell) => covered.has(cell)) ? placed : null;
    }
    const ordered = unused.slice().sort((a, b) => a.placements.length - b.placements.length);
    const piece = ordered[0];
    const nextUnused = unused.filter((candidate) => candidate !== piece);
    for (const placement of piece.placements) {
      if (overlaps(placement.cubes, occupied)) continue;
      const nextOccupied = new Set(occupied);
      const nextCovered = new Set(covered);
      placement.cubes.forEach((cell) => {
        nextOccupied.add(key(cell));
        nextCovered.add(`${cell[0]},${cell[1]}`);
      });
      const answer = rec(nextUnused, nextOccupied, nextCovered, placed.concat([{ id: piece.id, cubes: placement.cubes }]));
      if (answer) return answer;
    }
    return null;
  }
  return rec(all, new Set(), new Set(), []);
}

function cellsFromSolution(solution) {
  const seen = new Set();
  const out = [];
  for (const placement of solution) {
    for (const cell of placement.cubes) {
      const signature = key(cell);
      if (!seen.has(signature)) {
        seen.add(signature);
        out.push(cell);
      }
    }
  }
  return out.sort((a, b) => key(a).localeCompare(key(b)));
}

function pieceById(id, mode = appMode) {
  return (piecesByMode[mode] || pieces).find((p) => p.id === id);
}

function validatePieces(parsed, mode = appMode) {
  if (!Array.isArray(parsed)) throw new Error("Библиотека деталей должна быть массивом.");
  const ids = new Set();
  const validated = parsed.map((piece) => {
    if (!piece?.id || ids.has(piece.id)) throw new Error(`У каждой детали должен быть уникальный id: ${piece?.id || "без id"}.`);
    ids.add(piece.id);
    if (is2dMode(mode)) {
      if (!Array.isArray(piece.cells) || piece.cells.length === 0) throw new Error(`Для детали ${piece.id} нужен непустой список cells.`);
      for (const cell of piece.cells) {
        if (!Array.isArray(cell) || cell.length !== 2 || cell.some((value) => !Number.isInteger(value))) {
          throw new Error(`Некорректная координата клетки в детали ${piece.id}.`);
        }
      }
      const cubes = norm(piece.cells.map(([x, y]) => [x, y, 0]));
      if (new Set(cubes.map(key)).size !== cubes.length) throw new Error(`В детали ${piece.id} есть повторяющиеся клетки.`);
      const cells = cubes.map(([x, y]) => [x, y]);
      if (!connected2d(cells)) throw new Error(`Клетки детали ${piece.id} должны быть соединены сторонами.`);
      return {
        id: String(piece.id),
        mode: MODE_2D,
        color: /^#[0-9a-f]{6}$/i.test(piece.color || "") ? piece.color : DEFAULT_PIECE_COLORS[piece.id] || "#247c8a",
        cells,
        cubes,
      };
    }
    if (!Array.isArray(piece.cubes) || piece.cubes.length === 0) throw new Error(`Для детали ${piece.id} нужен непустой список cubes.`);
    for (const cube of piece.cubes) {
      if (!Array.isArray(cube) || cube.length !== 3 || cube.some((value) => !Number.isInteger(value))) {
        throw new Error(`Некорректная координата кубика в детали ${piece.id}.`);
      }
    }
    return piece;
  });
  return validated;
}

function setPieces(nextPieces, sourceLabel, mode = appMode, options = {}) {
  const validated = validatePieces(nextPieces, mode);
  piecesByMode[mode] = validated;
  activeLibrariesByMode[mode] = sourceLabel;
  if (mode !== appMode) return validated;
  pieces = validated;
  activeLibrary = sourceLabel;
  const editor = document.getElementById("pieces");
  if (editor) editor.value = serializePieceLibraryForEditor(pieces, mode);
  renderPieceColorControls();
  if (!options.silent) setStatus(`Загружено деталей: ${pieces.length}. Источник: ${sourceLabel}.`);
  return validated;
}

async function loadDefaultPieces() {
  let twoDimensionalLoaded = false;
  try {
    const response = await fetch(DATA_2D_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    setPieces(await response.json(), "12 фигур с фотографии", MODE_2D, { silent: true });
    twoDimensionalLoaded = true;
  } catch {
    setPieces(structuredClone(BUILTIN_2D_PIECES), "12 фигур с фотографии (встроенные)", MODE_2D, { silent: true });
  }
  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    setPieces(await response.json(), "Thingiverse 6534722 + 5072592", MODE_3D, { silent: appMode !== MODE_3D });
  } catch (error) {
    setPieces(structuredClone(BUILTIN_THINGIVERSE_PIECES), "Thingiverse 6534722 + 5072592 (встроенные)", MODE_3D, { silent: true });
    if (appMode === MODE_3D) setStatus(`Не удалось загрузить ${DATA_URL}; используются встроенные детали Thingiverse.`);
  }
  if (appMode === MODE_2D) {
    pieces = piecesByMode[MODE_2D];
    activeLibrary = activeLibrariesByMode[MODE_2D];
    document.getElementById("pieces").value = serializePieceLibraryForEditor();
    renderPieceColorControls();
    setStatus(twoDimensionalLoaded
      ? "Готово: загружены 12 фигур 2D с фотографии."
      : "Готово: используются встроенные 12 фигур 2D.");
  }
}

function loadPiecesFromText(sourceLabel = "текстовое поле") {
  setPieces(JSON.parse(document.getElementById("pieces").value), sourceLabel);
}

function generateSingleTask(options = {}) {
  const taskCount = options.taskCount ?? selectedTaskCount();
  const taskDimensions = options.w && options.h
    ? { w: Number(options.w), h: Number(options.h) }
    : taskBoardDimensions(options.taskIndex ?? 0, taskCount);
  const { w, h } = taskDimensions;
  const l = is2dMode() ? 1 : +document.getElementById("levels").value;
  const pieceCount = +document.getElementById("pieceCount").value;
  const comboCount = options.requestedComboCount ?? +document.getElementById("comboCount").value;
  const attempts = +document.getElementById("attempts").value;
  const seedValue = document.getElementById("seed").value;
  const seed = options.seed ?? (seedValue ? +seedValue : randomSeed());
  const scoringHistory = options.scoringHistory ?? ((randomSeedMode || !seedValue) ? generationHistory : emptyGenerationHistory());
  const manualCells = options.manualCells ?? manualLayerCellsA;
  const taskLabel = options.taskIndex === undefined ? "" : String(options.taskIndex + 1);
  const maxFootprintWidth = options.maxFootprintWidth ?? Infinity;
  const excludedFootprintSignatures = new Set(options.excludedFootprintSignatures || []);
  const usedSessionTargetFootprints = usedTargetFootprintSignatures(generationHistory);
  const workingPieces = generationPieces();

  const rng = mulberry32(seed);
  if (workingPieces.length < pieceCount) throw new Error(`Select at least ${pieceCount} pieces for generation.`);
  const allSubsets = subsets(workingPieces, pieceCount).filter((set) => set.reduce((sum, p) => sum + p.cubes.length, 0) % l === 0);
  if (!allSubsets.length) throw new Error("Not enough pieces in the active library.");
  const placementCache = Object.fromEntries(workingPieces.map((piece) => [piece.id, makePlacementsForPiece(piece, w, h, l)]));
  const manualTarget = manualLayerTarget(w, h, l, manualCells, taskLabel);
  const possibleVolumes = [...new Set(allSubsets.map((set) => set.reduce((sum, p) => sum + p.cubes.length, 0)))]
    .filter((volume) => {
      if (manualTarget) return volume === manualTarget.length;
      const minimumVolume = is2dMode() ? MIN_2D_TARGET_AREA : MIN_TARGET_VOLUME;
      return volume >= minimumVolume && volume / l <= w * h;
    })
    .sort((a, b) => a - b);
  if (!possibleVolumes.length) {
    if (manualTarget) {
      throw new Error(`Manual layer volume ${manualTarget.length} cannot be built with ${pieceCount} pieces per variant.`);
    }
    throw new Error(`No normal-sized target is possible with these settings. Increase pieces per variant or reduce levels.`);
  }
  const fitRequirement = boardFitRequirement(w, h);
  const maxLayerArea = Math.max(...possibleVolumes.map((volume) => volume / l));
  if (!manualTarget && fitRequirement.required && maxLayerArea < fitRequirement.minArea) {
    throw new Error(`No target that fits the fixed ${w}x${h} task area is possible with ${pieceCount} pieces. Increase pieces per variant.`);
  }
  const orderedVolumes = manualTarget ? [manualTarget.length] : targetVolumeOrder(rng, possibleVolumes);
  const volumeOrder = !manualTarget && is2dMode() ? orderedVolumes.slice(0, 3) : orderedVolumes;
  const presetTargets = manualTarget ? [] : volumeOrder.flatMap((volume) => shuffle(rng, presetTargetsFor(w, h, l, [volume])));
  const solutionDerivedTargets = manualTarget ? [] : solutionDerivedTargetsFor(rng, w, h, l, volumeOrder, allSubsets, attempts, placementCache, scoringHistory);
  const generatedTargets = manualTarget ? [] : generatedTargetsFor(rng, w, h, l, volumeOrder, is2dMode() ? Math.min(attempts, 60) : attempts);
  const mixedTargetCandidates = manualTarget ? [{ id: "manual-layer", target: manualTarget }] : mixTargetCandidates(rng, presetTargets, generatedTargets, solutionDerivedTargets, attempts);
  const targetCandidates = mixedTargetCandidates.filter((candidate) =>
    targetFootprintStats(candidate.target).width <= maxFootprintWidth &&
    !excludedFootprintSignatures.has(targetFootprintCanonicalSignature(candidate.target)) &&
    (manualTarget || true),
  );
  if (!manualTarget && !targetCandidates.length && mixedTargetCandidates.length) {
    throw newUniqueTargetError();
  }
  const targetMode = manualTarget ? "equal-layer" : "auto";
  let bestCard = null;
  const solvableCards = [];
  const plainRectangularCards = [];
  let plainRectangularOnly = false;
  let checkedManualSets = 0;
  const manualTargetVolume = manualTarget ? manualTarget.length : null;

  setStatus(generationProgressMessage());
  const searchLimit = manualTarget
    ? Math.min(attempts, targetCandidates.length, 260)
    : is2dMode()
      ? Math.min(targetCandidates.length, Math.max(18, Math.min(36, Math.ceil(attempts / 10))))
      : autoTargetSearchLimit(targetCandidates.length, attempts);
  for (let a = 0; a < searchLimit; a++) {
    const target = targetCandidates[a].target;
    const targetVol = target.length;
    const candidateSets = shuffle(rng, allSubsets.filter((set) => set.reduce((sum, p) => sum + p.cubes.length, 0) === targetVol));
    const foundCombos = [];
    const seenSets = new Set();
    const comboSearchLimit = manualTarget || is2dMode() ? Math.max(comboCount * 2, 12) : Math.max(comboCount, 6);
    const candidateSetLimit = manualTarget
      ? candidateSets.length
      : is2dMode()
        ? Math.min(candidateSets.length, Math.max(comboCount * 8, 120 + pieceCount * 20))
        : autoComboSetSearchLimit(candidateSets.length, comboCount, pieceCount, attempts);
    for (let setIndex = 0; setIndex < candidateSetLimit; setIndex++) {
      const set = candidateSets[setIndex];
      const signature = pieceSetSignature(set.map((p) => p.id));
      if (seenSets.has(signature)) continue;
      if (manualTarget) checkedManualSets++;
      const solution = solveExact(set, target, w, h, l, rng, manualTarget ? 1000000 : 40000, placementCache);
      if (solution) {
        foundCombos.push({ pieces: set.map((p) => p.id), solution });
        seenSets.add(signature);
        if (foundCombos.length >= comboSearchLimit) break;
      }
    }
    const combos = selectDiverseCombos(foundCombos, comboCount, scoringHistory, rng);
    const cardTarget = target;
    if (!manualTarget && combos.length > 0 && isPlainRectangularTarget(cardTarget)) {
      plainRectangularOnly = true;
      plainRectangularCards.push({ seed, w, h, levels: l, pieceCount, target: cardTarget, combos, requestedComboCount: comboCount, incomplete: combos.length < comboCount, pieceLibrary: workingPieces, activeLibrary, targetMode });
      continue;
    }
    if (
      combos.length > 0 &&
      !usedSessionTargetFootprints.has(targetFootprintCanonicalSignature(cardTarget)) &&
      (
      combos.length > (bestCard?.combos.length || 0) ||
      (combos.length === (bestCard?.combos.length || 0) && cardTarget.length > (bestCard?.target.length || 0)) ||
      (combos.length === (bestCard?.combos.length || 0) && cardTarget.length === (bestCard?.target.length || 0) && rng() < 0.35)
      )
    ) {
      bestCard = { seed, w, h, levels: l, pieceCount, target: cardTarget, combos, requestedComboCount: comboCount, incomplete: combos.length < comboCount, pieceLibrary: workingPieces, activeLibrary, targetMode };
    }
    if (combos.length > 0) {
      solvableCards.push({ seed, w, h, levels: l, pieceCount, target: cardTarget, combos, requestedComboCount: comboCount, incomplete: combos.length < comboCount, pieceLibrary: workingPieces, activeLibrary, targetMode });
    }
  }
  const uniqueFootprintCards = solvableCards.filter((card) => !usedSessionTargetFootprints.has(targetFootprintCanonicalSignature(card.target)));
  const uniquePlainRectangularCards = plainRectangularCards.filter((card) => !usedSessionTargetFootprints.has(targetFootprintCanonicalSignature(card.target)));
  if (uniqueFootprintCards.length || (Math.min(w, h) >= 3 && uniquePlainRectangularCards.length)) {
    const boardFitCards = uniqueFootprintCards.filter(usesBoardWell);
    if (!manualTarget && fitRequirement.required && !boardFitCards.length) {
      throw new Error(`Could not find a target that fits the fixed ${w}x${h} task area. Increase pieces per variant, more attempts, or try Generate card again.`);
    }
    const baseCandidateCards = !manualTarget && boardFitCards.length ? boardFitCards : uniqueFootprintCards;
    const uniqueByTarget = [];
    const seenTargets = new Set();
    for (const card of shuffle(rng, baseCandidateCards)) {
      const signature = targetCellsSignature(card.target);
      if (!seenTargets.has(signature)) {
        seenTargets.add(signature);
        uniqueByTarget.push(card);
      }
    }
    if (uniqueByTarget.length) {
      const ranked = uniqueByTarget
        .map((card) => ({ card, score: cardDiversityScore(card, scoringHistory, rng) }))
        .sort((a, b) => b.score - a.score);
      const bestScore = ranked[0].score;
      const pool = ranked.filter((entry) => entry.score >= bestScore - 35).slice(0, 6);
      return pool[randInt(rng, pool.length)].card;
    }
  }
  if (!manualTarget && solvableCards.length && !uniqueFootprintCards.length) {
    throw newUniqueTargetError();
  }
  if (bestCard) return bestCard;
  if (plainRectangularOnly) {
    throw new Error("Only plain rectangular targets were found with these settings. Increase board size, pieces per variant, or attempts.");
  }
  if (manualTarget) {
    throw new Error(`No exact solution for the drawn ${manualTargetVolume}-cube manual target. Checked ${checkedManualSets} piece sets with ${pieceCount} pieces.`);
  }
  throw new Error("Could not find enough combinations. Try fewer pieces, more attempts, or a different seed.");
}

function generateCard() {
  const comboCountInput = document.getElementById("comboCount");
  if (comboCountInput) comboCountInput.value = String(VARIANT_SLOTS_PER_CARD);
  const seedInput = document.getElementById("seed");
  const seedValue = seedInput.value;
  const seed = seedValue ? +seedValue : randomSeed();
  const scoringHistory = (randomSeedMode || !seedValue) ? generationHistory : emptyGenerationHistory();
  const manualSets = [manualLayerCellsA, manualLayerCellsB];
  const taskCount = selectedTaskCount();
  const boardDimensions = boardDimensionsForTaskCount(taskCount);
  const combosPerTask = combosPerTaskForTaskCount(taskCount);
  const manualMode = !!document.getElementById("manualMode")?.checked;
  const l = is2dMode() ? 1 : +document.getElementById("levels").value;
  const cardNumber = normalizeCardNumber(document.getElementById("cardNumber")?.value);
  const targetCellSizeMm = selectedTargetCellSize();

  if (taskCount === 2 && manualMode) {
    const manualTargets = manualSets.slice(0, 2).map((cells, taskIndex) => {
      const dims = taskBoardDimensions(taskIndex, taskCount);
      return manualLayerTarget(dims.w, dims.h, l, cells, String(taskIndex + 1));
    });
    if (manualTargets.every(Boolean) && !twoTaskTargetsFitOnCard(manualTargets)) {
      throw new Error(TWO_TASK_TARGET_COLLISION_MESSAGE);
    }
  }

  const maxPairAttempts = taskCount === 2 && !manualMode ? 40 : 1;
  let taskCards = [];

  for (let pairAttempt = 0; pairAttempt < maxPairAttempts; pairAttempt++) {
    taskCards = [];
    const pairSeed = seed + pairAttempt * 19937;
    for (let taskIndex = 0; taskIndex < taskCount; taskIndex++) {
      const taskDimensions = taskBoardDimensions(taskIndex, taskCount);
      taskCards.push(generateSingleTask({
        seed: pairSeed + taskIndex * 9973,
        requestedComboCount: combosPerTask,
        manualCells: manualSets[taskIndex],
        taskIndex,
        taskCount,
        scoringHistory,
        w: taskDimensions.w,
        h: taskDimensions.h,
        maxFootprintWidth: taskDimensions.w,
        excludedFootprintSignatures: taskCards.map((task) => targetFootprintCanonicalSignature(task.target)),
      }));
    }
    if (taskCount !== 2 || twoTaskTargetsFitOnCard(taskCards)) break;
    if (pairAttempt === maxPairAttempts - 1) {
      throw new Error("Could not find compatible two-task targets. Try more attempts or a different seed.");
    }
  }

  const tasks = taskCards.map((task) => ({
    target: task.target,
    combos: task.combos,
    targetMode: task.targetMode,
    requestedComboCount: combosPerTask,
    incomplete: task.combos.length < combosPerTask,
    w: task.w,
    h: task.h,
  }));
  const firstTask = tasks[0];
  const card = {
    ...taskCards[0],
    mode: appMode,
    w: boardDimensions.w,
    h: boardDimensions.h,
    target: firstTask.target,
    combos: firstTask.combos,
    requestedComboCount: taskCount * combosPerTask,
    incomplete: tasks.some((task) => task.incomplete),
    tasks,
    cardNumber,
    targetCellSizeMm,
  };
  card.challengeCode = challengeCodeForCard(card);
  return card;
}

function isRetryableGenerationError(error) {
  return /Only plain rectangular targets|Could not find enough combinations|Could not find compatible two-task targets|No new unique targets left/.test(error.message);
}

function generateCardWithRetries(outerAttemptsOverride = null) {
  const seedInput = document.getElementById("seed");
  const attemptsInput = document.getElementById("attempts");
  const originalSeed = seedInput.value;
  const baseSeed = originalSeed ? +originalSeed : randomSeed();
  const originalRandomSeedMode = randomSeedMode;
  const outerAttemptBudget = Math.max(1, outerAttemptsOverride ?? (+attemptsInput.value || 1));
  let lastError = null;
  let sawIncompleteCard = false;

  currentGenerationAttemptBudget = outerAttemptBudget;
  for (let retry = 0; retry < outerAttemptBudget; retry++) {
    currentGenerationAttempt = retry + 1;
    updateGenerationOverlayText(generationProgressMessage());
    seedInput.value = String(baseSeed + retry * 9973);
    try {
      randomSeedMode = !originalSeed;
      const card = generateCard();
      if (card.incomplete) {
        sawIncompleteCard = true;
        lastError = new Error(incompleteGenerationFailureMessage());
        continue;
      }
      card.retryCount = retry;
      if (!originalSeed) seedInput.value = "";
      randomSeedMode = originalRandomSeedMode;
      currentGenerationAttempt = null;
      currentGenerationAttemptBudget = null;
      return card;
    } catch (error) {
      lastError = error;
      if (!isRetryableGenerationError(error)) {
        seedInput.value = originalSeed;
        randomSeedMode = originalRandomSeedMode;
        currentGenerationAttempt = null;
        currentGenerationAttemptBudget = null;
        throw error;
      }
    }
  }

  seedInput.value = originalSeed;
  randomSeedMode = originalRandomSeedMode;
  currentGenerationAttempt = null;
  currentGenerationAttemptBudget = null;
  throw sawIncompleteCard ? new Error(incompleteGenerationFailureMessage()) : lastError;
}

function setStatus(message) {
  document.getElementById("status").textContent = message;
}

function localizedErrorMessage(message) {
  const source = String(message || "");
  if (/Select at least .* pieces/.test(source)) return "Выберите достаточно деталей для генерации.";
  if (/Not enough pieces/.test(source)) return "В активной библиотеке недостаточно деталей.";
  if (/Manual layer .*cells must be connected/.test(source)) return "Нарисованный контур должен быть связным по сторонам клеток.";
  if (/Manual layer volume|cannot be built/.test(source)) return "Площадь нарисованного контура не соответствует доступным наборам деталей.";
  if (/No exact solution for the drawn/.test(source)) return "Для нарисованного контура не найдено шесть точных наборов деталей.";
  if (/Only plain rectangular targets/.test(source)) return "Найдены только прямоугольные контуры. Увеличьте число попыток или измените seed.";
  if (/Could not find enough combinations|Could not find a full/.test(source)) return "Не удалось найти шесть разных наборов для одного контура. Увеличьте число попыток или измените seed.";
  if (/No new unique targets left/.test(source)) return SESSION_EXHAUSTED_STATUS_MESSAGE;
  if (/No normal-sized target|No target that fits/.test(source)) return "С выбранными настройками нельзя построить подходящий контур.";
  if (/Could not find compatible two-task targets|Two task targets collide/.test(source)) return "Не удалось разместить две совместимые 3D-задачи на карточке.";
  return source;
}

function showNewSessionAction() {
  document.getElementById("newSession")?.classList.remove("hidden");
}

function hideNewSessionAction() {
  document.getElementById("newSession")?.classList.add("hidden");
}

function showGenerationOverlay(message = "Создаём новую карточку…") {
  const overlay = document.getElementById("generationOverlay");
  const text = document.getElementById("generationOverlayText");
  if (text) text.textContent = message;
  if (overlay) {
    void overlay.offsetHeight;
    document.body.classList.add("isGenerating");
    overlay.classList.add("visible");
    overlay.setAttribute("aria-hidden", "false");
  }
}

function updateGenerationOverlayText(message) {
  const text = document.getElementById("generationOverlayText");
  if (text) text.textContent = message;
}

function hideGenerationOverlay() {
  const overlay = document.getElementById("generationOverlay");
  document.body.classList.remove("isGenerating");
  if (overlay) {
    overlay.classList.remove("visible");
    overlay.setAttribute("aria-hidden", "true");
  }
}

function isSessionExhaustedError(error) {
  return /No new unique targets left/.test(error?.message || "");
}

function loadPieceColors() {
  try {
    const saved = globalThis.localStorage?.getItem(PIECE_COLORS_STORAGE_KEY);
    if (!saved) return {};
    const parsed = JSON.parse(saved);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function savePieceColors() {
  try {
    globalThis.localStorage?.setItem(PIECE_COLORS_STORAGE_KEY, JSON.stringify(pieceColorsById));
  } catch {
    // Palette persistence is a convenience; rendering should still work without storage.
  }
}

function loadPieceSelection() {
  try {
    const saved = globalThis.localStorage?.getItem(PIECE_SELECTION_STORAGE_KEY);
    if (!saved) return {};
    const parsed = JSON.parse(saved);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function loadCustomPieceSelection() {
  try {
    const saved = globalThis.localStorage?.getItem(PIECE_CUSTOM_SELECTION_STORAGE_KEY);
    if (!saved) return defaultCustomPieceSelection();
    const parsed = JSON.parse(saved);
    return parsed && typeof parsed === "object" ? parsed : defaultCustomPieceSelection();
  } catch {
    return defaultCustomPieceSelection();
  }
}

function defaultCustomPieceSelection() {
  const includedIds = new Set(is2dMode() ? pieces.map((piece) => piece.id) : CUSTOM_PRESET_PIECE_IDS);
  return Object.fromEntries(pieces.map((piece) => [piece.id, includedIds.has(piece.id)]));
}

function savePieceSelection() {
  try {
    globalThis.localStorage?.setItem(PIECE_SELECTION_STORAGE_KEY, JSON.stringify(pieceSelectionById));
  } catch {
    // Selection persistence is a convenience; generation should still work without storage.
  }
}

function saveCustomPieceSelection() {
  try {
    globalThis.localStorage?.setItem(PIECE_CUSTOM_SELECTION_STORAGE_KEY, JSON.stringify(customPieceSelectionById));
  } catch {
    // Custom preset persistence is a convenience; generation should still work without storage.
  }
}

function resetPieceColors() {
  pieceColorsById = {};
  try {
    globalThis.localStorage?.removeItem(PIECE_COLORS_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

function drawBoard(container, cells, w, h, z, scale = 28, flipY = false) {
  const set = new Set(cells.filter((c) => c[2] === z).map(key));
  const board = document.createElement("div");
  board.className = "board";
  board.style.gridTemplateColumns = `repeat(${w}, ${scale}px)`;
  board.style.setProperty("--cell-size", `${scale}px`);
  for (let displayY = 0; displayY < h; displayY++) {
    const y = flipY ? h - 1 - displayY : displayY;
    for (let x = 0; x < w; x++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      if (set.has(key([x, y, z]))) cell.classList.add("filled");
      board.appendChild(cell);
    }
  }
  container.appendChild(board);
}

function pieceColor(piece) {
  if (pieceColorsById[piece.id]) return pieceColorsById[piece.id];
  if (/^#[0-9a-f]{6}$/i.test(piece.color || "")) return piece.color;
  if (DEFAULT_PIECE_COLORS[piece.id]) return DEFAULT_PIECE_COLORS[piece.id];
  const source = (piece.sourceFiles || []).join(" ").toUpperCase();
  if (source.includes("JAUNE") || source.includes("YELLOW")) return "#f2c812";
  if (source.includes("BLEU") || source.includes("BLUE")) return "#3d94c7";
  if (source.includes("ROUGE") || source.includes("RED")) return "#e64f7c";
  if (source.includes("VERT") || source.includes("GREEN")) return "#5fc66a";
  return "#247c8a";
}

function shadeColor(hex, amount) {
  const color = hex.replace("#", "");
  const value = parseInt(color, 16);
  const next = [16, 8, 0]
    .map((shift) => Math.max(0, Math.min(255, ((value >> shift) & 255) + amount)))
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("");
  return `#${next}`;
}

function isoPoint(x, y, z, projection) {
  const { dx, dy, zBackY, zRise } = projection;
  return [(x - y) * dx, (x + y) * dy - z * zBackY - z * zRise];
}

function pointsToString(points) {
  return points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
}

function drawPiece3d(container, cubes, options = {}) {
  const compact = !!options.compact;
  const baseColor = options.color || "#247c8a";
  const normalized = norm(cubes);
  const dx = compact ? 10 : 15;
  const dy = compact ? 6 : 9;
  const projection = {
    dx,
    dy,
    zBackY: compact ? 13 : 18,
    zRise: compact ? 3 : 4,
  };
  const width = options.width || (compact ? 72 : 104);
  const height = options.height || (compact ? 62 : 88);
  const xmlns = "http://www.w3.org/2000/svg";
  const faces = [];

  for (const [x, y, z] of normalized.slice().sort((a, b) => (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]) || a[2] - b[2] || a[1] - b[1] || a[0] - b[0])) {
    const top = [
      isoPoint(x, y, z + 1, projection),
      isoPoint(x + 1, y, z + 1, projection),
      isoPoint(x + 1, y + 1, z + 1, projection),
      isoPoint(x, y + 1, z + 1, projection),
    ];
    const right = [
      isoPoint(x + 1, y, z + 1, projection),
      isoPoint(x + 1, y + 1, z + 1, projection),
      isoPoint(x + 1, y + 1, z, projection),
      isoPoint(x + 1, y, z, projection),
    ];
    const left = [
      isoPoint(x, y + 1, z + 1, projection),
      isoPoint(x + 1, y + 1, z + 1, projection),
      isoPoint(x + 1, y + 1, z, projection),
      isoPoint(x, y + 1, z, projection),
    ];
    faces.push({ points: top, fill: shadeColor(baseColor, 38), cubeZ: z });
    faces.push({ points: left, fill: shadeColor(baseColor, -18), cubeZ: z });
    faces.push({ points: right, fill: shadeColor(baseColor, -42), cubeZ: z });
  }

  const allPoints = faces.flatMap((face) => face.points);
  const minX = Math.min(...allPoints.map(([x]) => x));
  const maxX = Math.max(...allPoints.map(([x]) => x));
  const minY = Math.min(...allPoints.map(([, y]) => y));
  const maxY = Math.max(...allPoints.map(([, y]) => y));
  const contentWidth = maxX - minX || 1;
  const contentHeight = maxY - minY || 1;
  const scale = Math.min((width - 8) / contentWidth, (height - 8) / contentHeight);
  const offsetX = (width - contentWidth * scale) / 2 - minX * scale;
  const offsetY = (height - contentHeight * scale) / 2 - minY * scale;

  const svg = document.createElementNS(xmlns, "svg");
  svg.setAttribute("class", "piece3dPreview");
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "3D piece preview");

  for (const face of faces) {
    const polygon = document.createElementNS(xmlns, "polygon");
    polygon.setAttribute("class", "isoCubeFace");
    polygon.setAttribute("points", pointsToString(face.points.map(([x, y]) => [x * scale + offsetX, y * scale + offsetY])));
    polygon.setAttribute("fill", face.fill);
    polygon.setAttribute("data-cube-z", String(face.cubeZ));
    svg.appendChild(polygon);
  }

  container.appendChild(svg);
  return svg;
}

function normalized2dCells(pieceOrCells) {
  const source = Array.isArray(pieceOrCells)
    ? pieceOrCells
    : pieceOrCells?.cells || pieceOrCells?.cubes?.map(([x, y]) => [x, y]) || [];
  if (!source.length) return [];
  const minX = Math.min(...source.map(([x]) => x));
  const minY = Math.min(...source.map(([, y]) => y));
  return source
    .map(([x, y]) => [x - minX, y - minY])
    .sort((a, b) => a[1] - b[1] || a[0] - b[0]);
}

function dimensions2d(cells) {
  const normalized = normalized2dCells(cells);
  return {
    columns: normalized.length ? Math.max(...normalized.map(([x]) => x)) + 1 : 1,
    rows: normalized.length ? Math.max(...normalized.map(([, y]) => y)) + 1 : 1,
  };
}

function rotate2dQuarterTurn(cells) {
  return normalized2dCells(cells.map(([x, y]) => [-y, x]));
}

function minimize2dPreviewHeight(pieceOrCells) {
  let candidate = normalized2dCells(pieceOrCells);
  let best = candidate;
  let bestRows = dimensions2d(best).rows;
  for (let turn = 1; turn < 4; turn++) {
    candidate = rotate2dQuarterTurn(candidate);
    const rows = dimensions2d(candidate).rows;
    if (rows < bestRows) {
      best = candidate;
      bestRows = rows;
    }
  }
  return best;
}

function drawPiece2d(container, pieceOrCells, options = {}) {
  const cells = options.minimizeHeight
    ? minimize2dPreviewHeight(pieceOrCells)
    : normalized2dCells(pieceOrCells);
  const compact = !!options.compact;
  const width = options.width || (compact ? 72 : 104);
  const height = options.height || (compact ? 62 : 88);
  const baseColor = options.color || pieceOrCells?.color || "#247c8a";
  const { columns, rows } = dimensions2d(cells);
  const requestedCellSize = Number(options.cellSize);
  const cellSize = Number.isFinite(requestedCellSize) && requestedCellSize > 0
    ? requestedCellSize
    : Math.max(4, Math.min((width - 8) / columns, (height - 8) / rows));
  const offsetX = (width - columns * cellSize) / 2;
  const offsetY = (height - rows * cellSize) / 2;
  const xmlns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(xmlns, "svg");
  svg.setAttribute("class", "piece2dPreview");
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("data-cell-size", String(cellSize));
  svg.setAttribute("data-columns", String(columns));
  svg.setAttribute("data-rows", String(rows));
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Плоская деталь");
  for (const [x, y] of cells) {
    const rect = document.createElementNS(xmlns, "rect");
    rect.setAttribute("class", "piece2dCell");
    rect.setAttribute("x", String(offsetX + x * cellSize));
    rect.setAttribute("y", String(offsetY + y * cellSize));
    rect.setAttribute("width", String(cellSize));
    rect.setAttribute("height", String(cellSize));
    rect.setAttribute("fill", baseColor);
    svg.appendChild(rect);
  }
  container.appendChild(svg);
  return svg;
}

function drawSolution2d(container, solution, options = {}) {
  const width = options.width || 220;
  const height = options.height || 160;
  const placedCells = (solution || []).flatMap((placement) =>
    placement.cubes.map(([x, y]) => ({ x, y, id: placement.id })));
  const minX = placedCells.length ? Math.min(...placedCells.map((cell) => cell.x)) : 0;
  const maxX = placedCells.length ? Math.max(...placedCells.map((cell) => cell.x)) : 0;
  const minY = placedCells.length ? Math.min(...placedCells.map((cell) => cell.y)) : 0;
  const maxY = placedCells.length ? Math.max(...placedCells.map((cell) => cell.y)) : 0;
  const columns = maxX - minX + 1;
  const rows = maxY - minY + 1;
  const cellSize = Math.max(4, Math.min((width - 12) / columns, (height - 12) / rows));
  const offsetX = (width - columns * cellSize) / 2;
  const offsetY = (height - rows * cellSize) / 2;
  const xmlns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(xmlns, "svg");
  svg.setAttribute("class", "solution2dPreview");
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Собранное решение 2D");
  for (const cell of placedCells) {
    const rect = document.createElementNS(xmlns, "rect");
    rect.setAttribute("class", "solution2dCell");
    rect.setAttribute("data-piece-id", cell.id);
    rect.setAttribute("x", String(offsetX + (cell.x - minX) * cellSize));
    rect.setAttribute("y", String(offsetY + (cell.y - minY) * cellSize));
    rect.setAttribute("width", String(cellSize));
    rect.setAttribute("height", String(cellSize));
    rect.setAttribute("fill", pieceColor(pieceById(cell.id, MODE_2D) || { id: cell.id }));
    svg.appendChild(rect);
  }
  container.appendChild(svg);
  return svg;
}

function drawSolutionPreview(container, solution, mode = appMode, options = {}) {
  return is2dMode(mode) ? drawSolution2d(container, solution, options) : drawSolution3d(container, solution, options);
}

function textColorForBackground(hex) {
  const color = (hex || "#000000").replace("#", "");
  const value = parseInt(color.length === 3 ? color.split("").map((ch) => ch + ch).join("") : color, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#050505" : "#f8fbfc";
}

function drawSolution3d(container, solution, options = {}) {
  const width = options.width || 220;
  const height = options.height || 160;
  const projection = {
    dx: 17,
    dy: 10,
    zBackY: 20,
    zRise: 5,
  };
  const xmlns = "http://www.w3.org/2000/svg";
  const faces = [];

  for (const placement of solution || []) {
    const piece = pieceById(placement.id);
    const baseColor = pieceColor(piece || { id: placement.id, cubes: [] });
    for (const [x, y, z] of placement.cubes) {
      const top = [
        isoPoint(x, y, z + 1, projection),
        isoPoint(x + 1, y, z + 1, projection),
        isoPoint(x + 1, y + 1, z + 1, projection),
        isoPoint(x, y + 1, z + 1, projection),
      ];
      const right = [
        isoPoint(x + 1, y, z + 1, projection),
        isoPoint(x + 1, y + 1, z + 1, projection),
        isoPoint(x + 1, y + 1, z, projection),
        isoPoint(x + 1, y, z, projection),
      ];
      const left = [
        isoPoint(x, y + 1, z + 1, projection),
        isoPoint(x + 1, y + 1, z + 1, projection),
        isoPoint(x + 1, y + 1, z, projection),
        isoPoint(x, y + 1, z, projection),
      ];
      const sortKey = x + y + z;
      faces.push({ pieceId: placement.id, points: top, fill: shadeColor(baseColor, 38), sortKey, cubeZ: z, faceOrder: 0 });
      faces.push({ pieceId: placement.id, points: left, fill: shadeColor(baseColor, -18), sortKey, cubeZ: z, faceOrder: 1 });
      faces.push({ pieceId: placement.id, points: right, fill: shadeColor(baseColor, -42), sortKey, cubeZ: z, faceOrder: 2 });
    }
  }

  const allPoints = faces.flatMap((face) => face.points);
  const minX = Math.min(...allPoints.map(([x]) => x));
  const maxX = Math.max(...allPoints.map(([x]) => x));
  const minY = Math.min(...allPoints.map(([, y]) => y));
  const maxY = Math.max(...allPoints.map(([, y]) => y));
  const contentWidth = maxX - minX || 1;
  const contentHeight = maxY - minY || 1;
  const scale = Math.min((width - 16) / contentWidth, (height - 16) / contentHeight);
  const offsetX = (width - contentWidth * scale) / 2 - minX * scale;
  const offsetY = (height - contentHeight * scale) / 2 - minY * scale;

  const svg = document.createElementNS(xmlns, "svg");
  svg.setAttribute("class", "solution3dPreview");
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "3D assembled solution preview");

  faces
    .sort((a, b) => a.sortKey - b.sortKey || a.cubeZ - b.cubeZ || a.faceOrder - b.faceOrder || a.pieceId.localeCompare(b.pieceId))
    .forEach((face) => {
      const polygon = document.createElementNS(xmlns, "polygon");
      polygon.setAttribute("class", "solutionCubeFace");
      polygon.setAttribute("points", pointsToString(face.points.map(([x, y]) => [x * scale + offsetX, y * scale + offsetY])));
      polygon.setAttribute("fill", face.fill);
      polygon.setAttribute("data-piece-id", face.pieceId);
      polygon.setAttribute("data-cube-z", String(face.cubeZ));
      svg.appendChild(polygon);
    });

  container.appendChild(svg);
  return svg;
}

function visualCubesForPiece(piece) {
  const normalized = norm(piece.cubes);
  const maxX = Math.max(...normalized.map(([x]) => x));
  const maxY = Math.max(...normalized.map(([, y]) => y));
  if (VISUAL_ROTATE_90_PIECES.has(piece.id)) return norm(normalized.map(([x, y, z]) => [maxY - y, x, z]));
  if (VISUAL_ROTATE_180_PIECES.has(piece.id)) return norm(normalized.map(([x, y, z]) => [maxX - x, maxY - y, z]));
  return normalized;
}

function createPiecePreview(piece, compact = false) {
  const wrap = document.createElement("div");
  wrap.className = compact ? "pieceMini compactPiece" : "pieceMini";
  const title = document.createElement("div");
  title.className = "pieceMiniTitle";
  title.textContent = `${piece.id} (${piece.cells?.length || piece.cubes.length})`;
  wrap.appendChild(title);

  if (piece.mode === MODE_2D || piece.cells) {
    drawPiece2d(wrap, piece, { compact, color: pieceColor(piece) });
  } else {
    drawPiece3d(wrap, visualCubesForPiece(piece), { compact, color: pieceColor(piece) });
  }
  return wrap;
}

function createGameTargetOutline(footprint, minX, minY, footprintWidth, footprintHeight, cellSize = 14.5) {
  const xmlns = "http://www.w3.org/2000/svg";
  const outline = document.createElementNS(xmlns, "svg");
  outline.setAttribute("class", "gameTargetOutline");
  outline.setAttribute("width", `${footprintWidth * cellSize}mm`);
  outline.setAttribute("height", `${footprintHeight * cellSize}mm`);
  outline.setAttribute("viewBox", `0 0 ${footprintWidth * cellSize} ${footprintHeight * cellSize}`);
  outline.setAttribute("aria-hidden", "true");

  function addSegment(x1, y1, x2, y2) {
    const line = document.createElementNS(xmlns, "line");
    line.setAttribute("class", "gameTargetOutlineSegment");
    line.setAttribute("x1", String(x1));
    line.setAttribute("y1", String(y1));
    line.setAttribute("x2", String(x2));
    line.setAttribute("y2", String(y2));
    outline.appendChild(line);
  }

  for (const cell of footprint) {
    const [x, y] = cell.split(",").map(Number);
    const left = (x - minX) * cellSize;
    const top = (y - minY) * cellSize;
    const right = left + cellSize;
    const bottom = top + cellSize;
    if (!footprint.has(`${x},${y - 1}`)) addSegment(left, top, right, top);
    if (!footprint.has(`${x + 1},${y}`)) addSegment(right, top, right, bottom);
    if (!footprint.has(`${x},${y + 1}`)) addSegment(left, bottom, right, bottom);
    if (!footprint.has(`${x - 1},${y}`)) addSegment(left, top, left, bottom);
  }

  return outline;
}

function createGameTargetMap(target, taskIndex = 0, taskCount = 1, cellSize = 14.5) {
  const targetMap = document.createElement("div");
  targetMap.className = `gameTargetMap gameTargetMap${taskIndex + 1}${taskCount === 1 ? " gameTargetMapSolo" : ""}`;
  targetMap.setAttribute("data-task-index", String(taskIndex));
  targetMap.setAttribute("data-target-signature", targetCellsSignature(target));
  targetMap.setAttribute("data-target-volume", String(target.length));
  targetMap.setAttribute("data-target-cell-size", String(cellSize));
  targetMap.style.setProperty("--game-target-cell-size", `${cellSize}mm`);

  const footprint = new Set(target.map(([x, y]) => `${x},${y}`));
  const footprintCells = [...footprint].map((cell) => cell.split(",").map(Number));
  const minX = Math.min(...footprintCells.map(([x]) => x));
  const maxX = Math.max(...footprintCells.map(([x]) => x));
  const minY = Math.min(...footprintCells.map(([, y]) => y));
  const maxY = Math.max(...footprintCells.map(([, y]) => y));
  const footprintWidth = maxX - minX + 1;
  const footprintHeight = maxY - minY + 1;
  targetMap.style.width = `${footprintWidth * cellSize}mm`;
  targetMap.style.height = `${footprintHeight * cellSize}mm`;
  targetMap.setAttribute("data-footprint-width", String(footprintWidth));
  targetMap.setAttribute("data-footprint-height", String(footprintHeight));
  targetMap.setAttribute("data-footprint-min-x", String(minX));
  targetMap.setAttribute("data-footprint-min-y", String(minY));

  const grid = document.createElement("div");
  grid.className = "gameTargetGrid";
  grid.style.gridTemplateColumns = `repeat(${footprintWidth}, ${cellSize}mm)`;
  grid.style.gridTemplateRows = `repeat(${footprintHeight}, ${cellSize}mm)`;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const cell = document.createElement("div");
      cell.className = "gameTargetCell";
      if (footprint.has(`${x},${y}`)) {
        cell.classList.add("filled");
      }
      grid.appendChild(cell);
    }
  }
  targetMap.appendChild(grid);
  targetMap.appendChild(createGameTargetOutline(footprint, minX, minY, footprintWidth, footprintHeight, cellSize));
  return targetMap;
}

function createGameLevelBadge(levels) {
  const levelCount = Math.max(1, Math.min(4, Number(levels) || 1));
  const badge = document.createElement("div");
  badge.className = "gameLevelBadge";
  badge.setAttribute("data-level-count", String(levelCount));
  badge.setAttribute("aria-label", `Высота: ${levelCount} уровня`);

  const xmlns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(xmlns, "svg");
  svg.setAttribute("class", "gameLevelIcon");
  svg.setAttribute("viewBox", "0 0 36 36");
  svg.setAttribute("aria-hidden", "true");

  const blockWidth = 18;
  const blockHeight = 7;
  const x = 9;
  const bottom = 30;
  for (let index = 0; index < levelCount; index++) {
    const block = document.createElementNS(xmlns, "rect");
    block.setAttribute("class", "gameLevelIconBlock");
    block.setAttribute("x", String(x));
    block.setAttribute("y", String(bottom - blockHeight * (index + 1)));
    block.setAttribute("width", String(blockWidth));
    block.setAttribute("height", String(blockHeight));
    svg.appendChild(block);
  }

  badge.appendChild(svg);
  return badge;
}

function createGameCardCode(card) {
  const code = card.challengeCode || challengeCodeForCard(card);
  const badge = document.createElement("div");
  badge.className = "gameCardCode";
  badge.textContent = code;
  badge.setAttribute("aria-label", `Задание ${code}`);
  return badge;
}

function populateGameCardView(view, card) {
  view.innerHTML = "";
  const cardMode = modeForCard(card);
  const twoDimensional = cardMode === MODE_2D;
  const cardPieceCount = card.pieceCount || card.combos?.[0]?.pieces?.length || card.tasks?.[0]?.combos?.[0]?.pieces?.length || 0;
  const background = twoDimensional ? backgroundFor2dCard(cardPieceCount) : backgroundForCardMode(cardPieceCount, card.levels);
  const layout = cardLayoutForBackgroundKey(background.key);
  view.setAttribute("data-mode", cardMode);
  view.setAttribute("data-background-key", background.key);
  view.setAttribute("data-card-size", layout.key);
  view.style.setProperty("--game-card-width", layout.width);
  view.style.setProperty("--game-card-height", layout.height);
  view.style.setProperty("--game-card-bg-width", layout.backgroundWidth);
  view.style.setProperty("--game-card-bg-height", layout.backgroundHeight);

  const backgroundImage = document.createElement("img");
  backgroundImage.className = "gameCardBackground";
  backgroundImage.setAttribute("src", background.asset);
  backgroundImage.setAttribute("alt", "");
  backgroundImage.setAttribute("aria-hidden", "true");
  view.appendChild(backgroundImage);
  view.appendChild(createGameCardCode(card));

  const tasks = card.tasks || [{ target: card.target, combos: card.combos }];
  const targetCellSize = twoDimensional ? 13 : Number(card.targetCellSizeMm) === 13 ? 13 : 14.5;
  tasks.forEach((task, taskIndex) => {
    view.appendChild(createGameTargetMap(task.target, taskIndex, tasks.length, targetCellSize));
  });
  if (!twoDimensional) view.appendChild(createGameLevelBadge(card.levels));

  const pieceSlots = document.createElement("div");
  pieceSlots.className = "gamePieceSlots";
  const combosPerTask = combosPerTaskForTaskCount(tasks.length);
  const maxPiecesInCombo = Math.max(0, ...tasks.flatMap((task) => task.combos.map((combo) => combo.pieces.length)));
  if (maxPiecesInCombo >= 5) pieceSlots.classList.add("gamePieceSlotsDense");
  for (let index = 0; index < VARIANT_SLOTS_PER_CARD; index++) {
    const taskIndex = Math.floor(index / combosPerTask);
    const comboIndex = index % combosPerTask;
    const combo = tasks[taskIndex]?.combos[comboIndex];
    const slot = document.createElement("div");
    slot.className = combo ? "gamePieceSlot" : "gamePieceSlot inactive";
    if (combo) {
      slot.setAttribute("data-variant-index", String(index));
      slot.setAttribute("data-task-index", String(taskIndex));
      slot.setAttribute("data-pieces", combo.pieces.join(","));
      slot.setAttribute("data-piece-count", String(combo.pieces.length));
      displayPiecesForCombo(combo, card, index).forEach((id) => {
        const piece = pieceById(id, cardMode);
        if (!piece) return;
        const preview = document.createElement("div");
        preview.className = "gamePiecePreview";
        preview.setAttribute("data-piece-id", id);
        if (twoDimensional) {
          drawPiece2d(preview, piece, {
            compact: true,
            color: pieceColor(piece),
            width: 50,
            height: 30,
            cellSize: 10,
            minimizeHeight: true,
          });
        } else {
          drawPiece3d(preview, visualCubesForPiece(piece), { compact: true, color: pieceColor(piece), width: 40, height: 34 });
        }
        slot.appendChild(preview);
      });
    }
    pieceSlots.appendChild(slot);
  }
  view.appendChild(pieceSlots);

  const slots = document.createElement("div");
  slots.className = "gameVariantSlots";
  for (let index = 0; index < VARIANT_SLOTS_PER_CARD; index++) {
    const taskIndex = Math.floor(index / combosPerTask);
    const comboIndex = index % combosPerTask;
    const combo = tasks[taskIndex]?.combos[comboIndex];
    const slot = document.createElement("div");
    if (!combo) {
      slot.className = "gameVariantSlotPlaceholder inactive";
      slots.appendChild(slot);
      continue;
    }
    slot.className = "gameVariantSlot";
    slot.setAttribute("data-variant-index", String(index));
    slot.setAttribute("data-task-index", String(taskIndex));
    slot.setAttribute("data-pieces", combo.pieces.join(","));
    slots.appendChild(slot);
  }
  view.appendChild(slots);
}

function createGameCardView(card) {
  const view = document.createElement("div");
  view.className = "gameCardView";
  view.setAttribute("aria-label", "Карточка задания");
  populateGameCardView(view, card);
  return view;
}

function renderGameCardView(card) {
  const view = document.getElementById("gameCardView");
  if (!view) return;
  populateGameCardView(view, card);
}

function ensureGeneratedCardId(card) {
  const duplicatedId = card.sessionCardId && generatedCards.some((existingCard) => existingCard !== card && existingCard.sessionCardId === card.sessionCardId);
  if (!card.sessionCardId || duplicatedId) {
    generatedCardSequence += 1;
    card.sessionCardId = `generated-card-${generatedCardSequence}`;
  }
  return card.sessionCardId;
}

function selectedPrintCards() {
  const cardsById = new Map(generatedCards.map((card) => [card.sessionCardId, card]));
  return selectedPrintCardIds.map((id) => cardsById.get(id)).filter(Boolean);
}

function updatePrintSelectionCount() {
  const count = document.getElementById("printSelectionCount");
  if (count) count.textContent = `Выбрано для печати: ${selectedPrintCardIds.length}/2`;
}

function renderGeneratedCardList() {
  const panel = document.getElementById("printSelectionPanel");
  const list = document.getElementById("generatedCardsList");
  if (!panel || !list) return;
  panel.classList.toggle("hidden", generatedCards.length === 0);
  updatePrintSelectionCount();
  list.innerHTML = "";
  [...generatedCards].reverse().forEach((card) => {
    const selected = selectedPrintCardIds.includes(card.sessionCardId);
    const cardPieceCount = card.pieceCount || card.combos?.[0]?.pieces?.length || card.tasks?.[0]?.combos?.[0]?.pieces?.length || 0;
    const row = document.createElement("label");
    row.className = `generatedCardRow${selected ? " selected" : ""}`;
    row.setAttribute("data-card-id", card.sessionCardId);

    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.className = "generatedCardToggle";
    toggle.checked = selected;
    toggle.onchange = () => togglePrintCardSelection(card.sessionCardId);

    const info = document.createElement("div");
    info.className = "generatedCardInfo";

    const preview = document.createElement("div");
    preview.className = "generatedCardPreview";
    const previewCard = createGameCardView(card);
    previewCard.classList.add("generatedCardPreviewCard");
    preview.appendChild(previewCard);

    const code = document.createElement("div");
    code.className = "generatedCardCode";
    code.textContent = card.challengeCode || challengeCodeForCard(card);

    const meta = document.createElement("div");
    meta.className = "generatedCardMeta";
    meta.textContent = modeForCard(card) === MODE_2D
      ? `seed ${card.seed} | ${cardPieceCount} детали | поле ${boardLabelForCard(card)}`
      : `seed ${card.seed} | ${cardPieceCount} деталей × ${card.levels} уровня | ${boardLabelForCard(card)}`;

    const tag = document.createElement("div");
    tag.className = "generatedCardTag";
    tag.textContent = selected ? "Выбрано для печати" : "";

    info.appendChild(code);
    info.appendChild(meta);
    row.appendChild(toggle);
    row.appendChild(preview);
    row.appendChild(info);
    row.appendChild(tag);
    list.appendChild(row);
  });
}

function addGeneratedCard(card) {
  ensureGeneratedCardId(card);
  generatedCards.push(card);
  while (generatedCards.length > MAX_GENERATED_CARDS) {
    const removed = generatedCards.shift();
    if (removed?.sessionCardId) {
      selectedPrintCardIds = selectedPrintCardIds.filter((id) => id !== removed.sessionCardId);
    }
  }
  selectPrintCard(card.sessionCardId);
}

function selectPrintCard(cardId) {
  selectedPrintCardIds = selectedPrintCardIds.filter((id) => id !== cardId);
  selectedPrintCardIds.push(cardId);
  while (selectedPrintCardIds.length > 2) selectedPrintCardIds.shift();
  renderGeneratedCardList();
}

function togglePrintCardSelection(cardId) {
  if (selectedPrintCardIds.includes(cardId)) {
    selectedPrintCardIds = selectedPrintCardIds.filter((id) => id !== cardId);
  } else {
    selectedPrintCardIds.push(cardId);
    while (selectedPrintCardIds.length > 2) selectedPrintCardIds.shift();
  }
  renderGeneratedCardList();
}

function cardTasks(card) {
  return card.tasks || [{ target: card.target, combos: card.combos, targetMode: card.targetMode, requestedComboCount: card.requestedComboCount, incomplete: card.incomplete }];
}

function localizedTargetMode(mode) {
  if (mode === "auto") return "авто";
  if (mode === "equal-layer") return "ручной контур";
  return mode;
}

function createPrintSolutionBlock(card) {
  const block = document.createElement("div");
  block.className = "printSolutionBlock";
  const code = card.challengeCode || challengeCodeForCard(card);
  block.setAttribute("data-challenge-code", code);

  const title = document.createElement("h3");
  title.textContent = `Решения ${code}`;
  block.appendChild(title);

  const grid = document.createElement("div");
  grid.className = "printSolutionGrid";
  cardTasks(card).forEach((task, taskIndex) => task.combos.forEach((combo, comboIndex) => {
    const item = document.createElement("div");
    item.className = "printSolutionItem";
    item.setAttribute("data-task-index", String(taskIndex));
    item.setAttribute("data-combo-index", String(comboIndex));
    item.setAttribute("data-pieces", combo.pieces.join(","));

    const label = document.createElement("span");
    label.className = "printSolutionLabel";
    label.textContent = cardTasks(card).length > 1 ? `З${taskIndex + 1}-${comboIndex + 1}` : `В${comboIndex + 1}`;
    item.appendChild(label);

    const model = document.createElement("div");
    model.className = "printSolutionMiniModel";
    drawSolutionPreview(model, combo.solution, modeForCard(card), { width: 104, height: 74 });
    item.appendChild(model);
    grid.appendChild(item);
  }));

  block.appendChild(grid);
  return block;
}

function renderPrintSheet(cards = selectedPrintCards()) {
  const sheet = document.getElementById("printSheet");
  if (!sheet) return;
  const printableCards = cards.slice(0, 2);
  sheet.innerHTML = "";
  sheet.setAttribute("data-card-count", String(printableCards.length));
  printableCards.forEach((card, index) => {
    const package = document.createElement("div");
    package.className = "printCardPackage";
    const cardPieceCount = card.pieceCount || card.combos?.[0]?.pieces?.length || card.tasks?.[0]?.combos?.[0]?.pieces?.length || 0;
    const background = modeForCard(card) === MODE_2D
      ? backgroundFor2dCard(cardPieceCount)
      : backgroundForCardMode(cardPieceCount, card.levels);
    const layout = cardLayoutForBackgroundKey(background.key);
    package.style.setProperty("--print-card-height", layout.height);
    const view = createGameCardView(card);
    view.setAttribute("data-print-card-index", String(index));
    package.appendChild(view);
    package.appendChild(createPrintSolutionBlock(card));
    sheet.appendChild(package);
  });
}

function printReadyCards() {
  const cards = selectedPrintCards();
  if (cards.length < 1) {
    setStatus("Выберите хотя бы одну созданную карточку для печати.");
    document.getElementById("status")?.scrollIntoView?.({ block: "center", behavior: "smooth" });
    return false;
  }
  renderPrintSheet(cards);
  const cardCount = cards.length;
  document.body.classList.add("printPreviewMode");
  setStatus(`Предпросмотр готов: ${cardCount} ${cardCount === 1 ? "карточка" : "карточки"}. Нажмите «Печать» или «Экспорт PDF».`);
  document.getElementById("printSheet")?.scrollIntoView?.({ block: "start", behavior: "smooth" });
  void document.getElementById("printSheet")?.offsetHeight;
  return true;
}

function printNow() {
  const sheet = document.getElementById("printSheet");
  if (!sheet || !sheet.children.length) {
    setStatus("Выберите хотя бы одну созданную карточку для печати.");
    return false;
  }
  window.print();
  setStatus("Отправлено на печать. Если диалог не открылся, используйте Chrome или Ctrl+P.");
  return true;
}

async function downloadPrintSheetPdf(cards = selectedPrintCards()) {
  const printableCards = cards.slice(0, 2);
  if (!printableCards.length) {
    setStatus("Выберите хотя бы одну созданную карточку для печати.");
    return false;
  }
  if (typeof html2canvas !== "function" || !globalThis.jspdf?.jsPDF) {
    setStatus("Экспорт PDF недоступен: локальные библиотеки PDF не загрузились.");
    return false;
  }

  renderPrintSheet(cards);
  const sheet = document.getElementById("printSheet");
  if (!sheet) {
    setStatus("Экспорт PDF недоступен: не найден печатный лист.");
    return false;
  }

  showGenerationOverlay("Подготовка PDF…");
  try {
    await nextFrame();
    await nextFrame();
    const canvas = await html2canvas(sheet, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
    });
    const imageData = canvas.toDataURL("image/png");
    const pdf = new globalThis.jspdf.jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
      compress: true,
    });
    pdf.addImage(imageData, "PNG", 0, 0, 297, 210, undefined, "FAST");
    if (typeof pdf.output === "function" && globalThis.URL?.createObjectURL) {
      const pdfBlob = pdf.output("blob");
      const pdfUrl = globalThis.URL.createObjectURL(pdfBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = pdfUrl;
      const pdfFilename = printableCards.every((card) => modeForCard(card) === MODE_2D)
        ? "ubongo2d-cards.pdf"
        : printableCards.every((card) => modeForCard(card) === MODE_3D)
          ? "ubongo3d-cards.pdf"
          : "ubongo-cards.pdf";
      downloadLink.download = pdfFilename;
      downloadLink.rel = "noopener";
      downloadLink.style.display = "none";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      const popup = window.open(pdfUrl, "_blank");
      setTimeout(() => globalThis.URL.revokeObjectURL(pdfUrl), 60_000);
      setStatus(popup
        ? "PDF готов. Если загрузка не началась, сохраните файл из открытой вкладки."
        : "PDF готов. Если загрузка не началась, разрешите всплывающие окна или попробуйте Chrome.");
    } else {
      const pdfFilename = printableCards.every((card) => modeForCard(card) === MODE_2D) ? "ubongo2d-cards.pdf" : "ubongo3d-cards.pdf";
      pdf.save(pdfFilename);
      setStatus("PDF загружен.");
    }
    return true;
  } catch (error) {
    setStatus(`Ошибка: ${localizedErrorMessage(error.message)}`);
    return false;
  } finally {
    hideGenerationOverlay();
  }
}

async function exportPdf() {
  return downloadPrintSheetPdf();
}

function openPrintPage(mode = "print") {
  const sheet = document.getElementById("printSheet");
  if (!sheet || !sheet.children.length) {
    setStatus("Выберите хотя бы одну созданную карточку для печати.");
    return false;
  }
  const popup = window.open("", "_blank");
  if (!popup) {
    setStatus("Всплывающее окно заблокировано. Разрешите его или нажмите Ctrl+P в предпросмотре.");
    return false;
  }
  const stylesheetHref = document.querySelector('link[rel="stylesheet"]')?.getAttribute("href") || "style.css";
  const title = "Печатный лист Ubongo";
  const primaryAction = "Печать";
  const helperText = "Выберите принтер в системном диалоге печати.";
  const html = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
  <link rel="stylesheet" href="${stylesheetHref}">
  <style>
    .standalonePrintToolbar {
      display: flex;
      align-items: center;
      gap: 10px;
      justify-content: center;
      margin: 16px 0;
    }
    .standalonePrintHint {
      font: 13px system-ui, sans-serif;
      color: #334155;
    }
    @media print {
      .standalonePrintToolbar {
        display: none !important;
      }
    }
  </style>
</head>
<body class="printPreviewMode">
  <div class="standalonePrintToolbar">
    <button type="button" onclick="window.print()">${primaryAction}</button>
    <button type="button" onclick="window.close()">Закрыть</button>
    <span class="standalonePrintHint">${helperText}</span>
  </div>
  ${sheet.outerHTML}
</body>
</html>`;
  popup.document.open();
  popup.document.write(html);
  popup.document.close();
  popup.focus?.();
  setStatus("Страница печати открыта. Используйте кнопку «Печать» или Ctrl+P.");
  return true;
}

function exitPrintPreview() {
  document.body.classList.remove("printPreviewMode");
}

function incrementCardNumberInput() {
  const input = document.getElementById("cardNumber");
  if (input) input.value = String(nextCardNumberValue(input.value));
}

function renderCard(card, options = {}) {
  lastCard = card;
  runtimeByMode[appMode].lastCard = card;
  if (!options.skipHistory) updateGenerationHistory(card);
  document.getElementById("card").classList.remove("hidden");
  const cardMode = modeForCard(card);
  const twoDimensional = cardMode === MODE_2D;
  const tasks = card.tasks || [{ target: card.target, combos: card.combos, targetMode: card.targetMode, requestedComboCount: card.requestedComboCount, incomplete: card.incomplete }];
  const modeText = [...new Set(tasks.map((task) => task.targetMode).filter(Boolean))].length
    ? ` | ${[...new Set(tasks.map((task) => localizedTargetMode(task.targetMode)).filter(Boolean))].join("+")}`
    : "";
  const volumeText = tasks.length > 1 ? `объёмы ${tasks.map((task) => task.target.length).join("+")}` : `${twoDimensional ? "площадь" : "объём"} ${card.target.length}`;
  document.getElementById("meta").textContent = twoDimensional
    ? `seed ${card.seed} | поле ${boardLabelForCard(card)} | ${volumeText}${modeText} | ${card.activeLibrary}`
    : `seed ${card.seed} | ${boardLabelForCard(card)} | уровней: ${card.levels} | ${volumeText}${modeText} | ${card.activeLibrary}`;
  renderGameCardView(card);

  const layers = document.getElementById("layers");
  layers.innerHTML = "";
  tasks.forEach((task, taskIndex) => {
    for (let z = 0; z < (twoDimensional ? 1 : card.levels); z++) {
      const taskWidth = task.w ?? card.w;
      const taskHeight = task.h ?? card.h;
      const wrap = document.createElement("div");
      wrap.className = "layer";
      wrap.setAttribute("data-task-index", String(taskIndex));
      wrap.innerHTML = twoDimensional
        ? "<h4>Контур задачи</h4>"
        : `<h4>Задача ${taskIndex + 1}, слой ${z + 1}</h4>`;
      drawBoard(wrap, task.target, taskWidth, taskHeight, z);
      layers.appendChild(wrap);
    }
  });

  const allCombos = tasks.flatMap((task) => task.combos);
  const requestedComboCount = tasks.reduce((sum, task) => sum + (task.requestedComboCount || task.combos.length), 0);
  document.getElementById("combosTitle").textContent = `Наборы деталей: ${allCombos.length} из ${requestedComboCount || allCombos.length}`;
  const combos = document.getElementById("combos");
  combos.innerHTML = "";
  allCombos.forEach((combo, index) => {
    const div = document.createElement("div");
    div.className = "combo";
    const title = document.createElement("div");
    title.className = "comboTitle";
    title.innerHTML = `<span class="diceMark">${index + 1}</span>Вариант ${index + 1}`;
    div.appendChild(title);

    const previews = document.createElement("div");
    previews.className = "comboPreviews";
    combo.pieces.forEach((id) => {
      const piece = pieceById(id, cardMode);
      if (piece) previews.appendChild(createPiecePreview(piece, true));
    });
    div.appendChild(previews);
    combos.appendChild(div);
  });

  const solutions = document.getElementById("solutions");
  solutions.innerHTML = "";
  tasks.forEach((task, taskIndex) => task.combos.forEach((combo, comboIndex) => {
    const index = taskIndex * COMBOS_PER_TASK + comboIndex;
    const div = document.createElement("div");
    div.className = "solution";
    div.setAttribute("data-task-index", String(taskIndex));
    div.innerHTML = `<h4>${twoDimensional ? "Решение" : `Задача ${taskIndex + 1}, решение`} ${comboIndex + 1}: ${combo.pieces.join(", ")}</h4>`;
    const model = document.createElement("div");
    model.className = "solutionModel";
    drawSolutionPreview(model, combo.solution, cardMode);
    div.appendChild(model);
    for (let z = 0; z < (twoDimensional ? 1 : card.levels); z++) {
      const taskWidth = task.w ?? card.w;
      const taskHeight = task.h ?? card.h;
      const layer = document.createElement("div");
      layer.className = "layer";
      layer.innerHTML = twoDimensional ? "<h4>Раскладка</h4>" : `<h4>Слой ${z + 1}</h4>`;
      const board = document.createElement("div");
      board.className = "board";
      board.style.gridTemplateColumns = `repeat(${taskWidth}, 28px)`;
      board.style.setProperty("--cell-size", "28px");
      const labelByCell = {};
      combo.solution.forEach((placement) => placement.cubes.forEach((cell) => (labelByCell[key(cell)] = placement.id)));
      for (let y = 0; y < taskHeight; y++) {
        for (let x = 0; x < taskWidth; x++) {
          const cell = document.createElement("div");
          cell.className = "cell";
          const id = labelByCell[key([x, y, z])];
          if (id) {
            cell.classList.add("filled");
            cell.setAttribute("data-piece-id", id);
            const color = pieceColor(pieceById(id, cardMode));
            cell.style.backgroundColor = color;
            cell.style.color = textColorForBackground(color);
            cell.textContent = id;
          }
          board.appendChild(cell);
        }
      }
      layer.appendChild(board);
      div.appendChild(layer);
    }
    solutions.appendChild(div);
  }));
}

function clearCard() {
  lastCard = null;
  document.getElementById("card").classList.add("hidden");
  document.getElementById("meta").textContent = "";
  document.getElementById("layers").innerHTML = "";
  document.getElementById("combos").innerHTML = "";
  document.getElementById("solutions").innerHTML = "";
  document.getElementById("gameCardView").innerHTML = "";
  document.getElementById("combosTitle").textContent = "Наборы деталей";
}

function renderManualLayerEditorFor(editorId, cellsSet, w, h) {
  const editor = document.getElementById(editorId);
  if (!editor) return;
  const manualEnabled = !!document.getElementById("manualMode")?.checked;
  for (const cell of [...cellsSet]) {
    const [x, y] = cell.split(",").map(Number);
    if (x >= w || y >= h) cellsSet.delete(cell);
  }
  editor.innerHTML = "";
  editor.style.gridTemplateColumns = `repeat(${w}, 34px)`;
  editor.classList.toggle("disabled", !manualEnabled);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const cellKey = `${x},${y}`;
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "manualCell";
      cell.disabled = !manualEnabled;
      cell.setAttribute("aria-label", `Переключить клетку ${x + 1},${y + 1}`);
      if (cellsSet.has(cellKey)) cell.classList.add("filled");
      cell.onclick = () => {
        if (!document.getElementById("manualMode")?.checked) return;
        if (cellsSet.has(cellKey)) cellsSet.delete(cellKey);
        else cellsSet.add(cellKey);
        renderManualLayerEditor();
      };
      editor.appendChild(cell);
    }
  }
}

function renderManualLayerEditor() {
  const taskCount = selectedTaskCount();
  const dimsA = taskBoardDimensions(0, taskCount);
  renderManualLayerEditorFor("manualLayerEditorA", manualLayerCellsA, dimsA.w, dimsA.h);
  const editorB = document.getElementById("manualLayerEditorB");
  if (taskCount > 1) {
    const dimsB = taskBoardDimensions(1, taskCount);
    renderManualLayerEditorFor("manualLayerEditorB", manualLayerCellsB, dimsB.w, dimsB.h);
    if (editorB) editorB.classList.remove("hidden");
  } else if (editorB) {
    editorB.classList.add("hidden");
  }
  for (const id of ["clearManualLayer", "fillManualLayer"]) {
    const control = document.getElementById(id);
    if (control) control.disabled = !document.getElementById("manualMode")?.checked;
  }
}

function refreshPieceColorViews() {
  renderPieceColorControls();
  if (lastCard) renderCard(lastCard, { skipHistory: true });
}

function renderPieceColorControls() {
  const container = document.getElementById("pieceColors");
  if (!container) return;
  container.innerHTML = "";
  for (const piece of visiblePieces()) {
    const control = document.createElement("label");
    control.className = "pieceColorControl";
    if (!isPieceIncluded(piece.id)) control.classList.add("excludedPiece");

    const header = document.createElement("div");
    header.className = "pieceColorControlHeader";

    const include = document.createElement("input");
    include.type = "checkbox";
    include.className = "pieceIncludeToggle";
    include.checked = isPieceIncluded(piece.id);
    include.setAttribute("data-piece-id", piece.id);
    include.setAttribute("aria-label", `Использовать ${piece.id} в генерации`);
    include.onchange = () => {
      setPieceIncluded(piece.id, include.checked);
      refreshPieceColorViews();
    };

    const swatch = document.createElement("span");
    swatch.className = "pieceColorSwatch";
    swatch.style.background = pieceColor(piece);

    const name = document.createElement("span");
    name.className = "pieceColorName";
    name.textContent = piece.id;

    const input = document.createElement("input");
    input.type = "color";
    input.value = pieceColor(piece);
    input.setAttribute("data-piece-id", piece.id);
    input.onchange = () => {
      pieceColorsById[piece.id] = input.value;
      savePieceColors();
      refreshPieceColorViews();
    };

    const preview = document.createElement("div");
    preview.className = "pieceColorPreview";
    if (piece.mode === MODE_2D || piece.cells) {
      drawPiece2d(preview, piece, { compact: true, color: pieceColor(piece) });
    } else {
      drawPiece3d(preview, visualCubesForPiece(piece), { compact: true, color: pieceColor(piece) });
    }

    header.appendChild(include);
    header.appendChild(swatch);
    header.appendChild(name);
    header.appendChild(input);
    control.appendChild(header);
    control.appendChild(preview);
    container.appendChild(control);
  }
}

function nextFrame() {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(() => resolve());
    else setTimeout(resolve, 0);
  });
}

async function handleGenerateCard() {
  const generateButton = document.getElementById("generate");
  try {
    hideNewSessionAction();
    generateButton.disabled = true;
    setStatus("Генерация: ищем новую уникальную карточку…");
    showGenerationOverlay();
    await nextFrame();
    await nextFrame();
    loadPiecesFromText(activeLibrary);
    clearCard();
    const card = generateCardWithRetries();
    renderCard(card);
    addGeneratedCard(card);
    incrementCardNumberInput();
    const retryText = card.retryCount ? ` после ${card.retryCount + 1} попыток` : "";
    const unit = modeForCard(card) === MODE_2D ? "клеток" : "кубиков";
    const taskSummary = card.tasks ? ` Задачи: ${card.tasks.map((task, index) => `${index + 1}: ${task.target.length} ${unit}, вариантов ${task.combos.length}/${task.requestedComboCount}`).join("; ")}.` : "";
    const printSummary = ` Для печати выбрано: ${selectedPrintCardIds.length}/2.`;
    if (card.incomplete) {
      setStatus(`Создана лучшая доступная карточка${retryText}.${taskSummary}${printSummary} Для одной из задач найдено меньше вариантов, чем запрошено.`);
    } else {
      setStatus(`Готово: карточка создана${retryText}.${taskSummary}${printSummary}`);
    }
    return card;
  } catch (error) {
    clearCard();
    if (isSessionExhaustedError(error)) {
      showNewSessionAction();
      setStatus(SESSION_EXHAUSTED_STATUS_MESSAGE);
    } else {
      setStatus(`Ошибка: ${localizedErrorMessage(error.message)}`);
    }
    return null;
  } finally {
    hideGenerationOverlay();
    generateButton.disabled = false;
  }
}

document.getElementById("loadPieces").onclick = () => {
  try {
    loadPiecesFromText();
  } catch (error) {
    setStatus(`Ошибка: ${localizedErrorMessage(error.message)}`);
  }
};

document.getElementById("pieceFile").onchange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    setPieces(JSON.parse(await file.text()), file.name);
  } catch (error) {
    setStatus(`Ошибка: ${localizedErrorMessage(error.message)}`);
  }
};

document.getElementById("resetPieces").onclick = () => {
  if (is2dMode()) {
    setPieces(structuredClone(BUILTIN_2D_PIECES), "12 фигур с фотографии");
  } else {
    setPieces(structuredClone(BUILTIN_THINGIVERSE_PIECES), "Thingiverse 6534722 + 5072592 (встроенные)");
  }
};

document.getElementById("presetOldThingiverse").onclick = () => {
  applyPiecePreset("thingiverse6534722");
  setStatus(`Выбрана старая редакция: ${generationPieces().length} деталей.`);
};

document.getElementById("presetFamilyThingiverse").onclick = () => {
  applyPiecePreset("thingiverse5072592");
  setStatus(`Выбрана семейная редакция: ${generationPieces().length} деталей.`);
};

document.getElementById("presetCustomPieces").onclick = () => {
  applyPiecePreset("custom");
  setStatus(`Выбран пользовательский набор: ${generationPieces().length} деталей.`);
};

document.getElementById("presetAllPieces").onclick = () => {
  applyPiecePreset("all");
  setStatus(`Выбраны все детали: ${generationPieces().length}.`);
};

document.getElementById("resetPieceColors").onclick = () => {
  resetPieceColors();
  renderPieceColorControls();
  refreshPieceColorViews();
};

document.getElementById("togglePieceLibrary").onclick = () => {
  const panel = document.getElementById("pieceLibraryPanel");
  const button = document.getElementById("togglePieceLibrary");
  const shouldOpen = panel.classList.contains("hidden");
  panel.classList.toggle("hidden", !shouldOpen);
  button.setAttribute("aria-expanded", String(shouldOpen));
};

document.getElementById("pieceCount").onchange = renderManualLayerEditor;
document.getElementById("manualMode").onchange = renderManualLayerEditor;

document.getElementById("clearManualLayer").onclick = () => {
  manualLayerCellsA.clear();
  manualLayerCellsB.clear();
  renderManualLayerEditor();
};

document.getElementById("fillManualLayer").onclick = () => {
  const taskCount = selectedTaskCount();
  manualLayerCellsA.clear();
  manualLayerCellsB.clear();
  const dimsA = taskBoardDimensions(0, taskCount);
  for (let y = 0; y < dimsA.h; y++) {
    for (let x = 0; x < dimsA.w; x++) {
      manualLayerCellsA.add(`${x},${y}`);
    }
  }
  if (taskCount > 1) {
    const dimsB = taskBoardDimensions(1, taskCount);
    for (let y = 0; y < dimsB.h; y++) {
      for (let x = 0; x < dimsB.w; x++) {
        manualLayerCellsB.add(`${x},${y}`);
      }
    }
  }
  renderManualLayerEditor();
};

document.getElementById("generate").onclick = handleGenerateCard;
document.getElementById("mode2d").onclick = () => activateMode(MODE_2D);
document.getElementById("mode3d").onclick = () => activateMode(MODE_3D);
document.getElementById("newSession").onclick = () => {
  resetGenerationSession();
  hideNewSessionAction();
  setStatus("Новая сессия начата. Можно создавать карточку.");
};

document.getElementById("print").onclick = printReadyCards;
document.getElementById("printNow").onclick = printNow;
document.getElementById("exportPdf").onclick = exportPdf;
document.getElementById("exitPrintPreview").onclick = exitPrintPreview;

activateMode(appMode, { initial: true });
loadDefaultPieces();
