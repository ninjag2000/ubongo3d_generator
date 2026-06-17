from pathlib import Path
import re


CSS = Path("style.css").read_text(encoding="utf-8")


def css_block(selector: str) -> str:
    match = re.search(rf"{re.escape(selector)}\s*\{{(?P<body>.*?)\n\}}", CSS, re.S)
    assert match, f"Missing CSS block for {selector}"
    return match.group("body")


def test_two_task_target_maps_sit_close_to_card_edges():
    left_map = css_block(".gameTargetMap1")
    right_map = css_block(".gameTargetMap2")

    assert "left: 3%;" in left_map
    assert "right: 3%;" in right_map


def test_game_card_background_is_set_by_renderer():
    card = css_block(".gameCardView")

    assert "ubongo-card-bg.png" not in card
    assert "width: var(--game-card-width, 110mm);" in card
    assert "height: var(--game-card-height, 157mm);" in card
    assert "background-color: #050505;" in card


def test_game_card_background_image_is_rotated_to_fit_portrait_card():
    background = css_block(".gameCardBackground")

    assert "position: absolute;" in background
    assert "width: var(--game-card-bg-width, 157mm);" in background
    assert "height: var(--game-card-bg-height, 110mm);" in background
    assert "object-fit: cover;" in background
    assert "transform: translate(-50%, -50%) rotate(-90deg);" in background
    assert "pointer-events: none;" in background


def test_game_target_cells_use_configurable_mm_size():
    cell = css_block(".gameTargetCell")

    assert "width: var(--game-target-cell-size, 14.5mm);" in cell
    assert "height: var(--game-target-cell-size, 14.5mm);" in cell


def test_piece_slots_stay_inside_black_play_area():
    piece_slots = css_block(".gamePieceSlots")

    assert "bottom: 14.5%;" in piece_slots
    assert "height: 30%;" in piece_slots


def test_five_piece_slots_are_raised_and_compacted():
    dense_slots = css_block(".gamePieceSlotsDense")
    large_dense_slots = css_block('.gameCardView[data-card-size="large"] .gamePieceSlotsDense')
    dense_preview = css_block('.gamePieceSlot[data-piece-count="5"] .gamePiecePreview + .gamePiecePreview')

    assert "bottom: 16%;" in dense_slots
    assert "--large-piece-area-top: 82mm;" in large_dense_slots
    assert "--large-piece-area-bottom: 23mm;" in large_dense_slots
    assert "--large-piece-area-gap: 2mm;" in large_dense_slots
    assert "top: var(--large-piece-area-top);" in large_dense_slots
    assert "bottom: calc(var(--large-piece-area-bottom) + var(--large-piece-area-gap));" in large_dense_slots
    assert "height: auto;" in large_dense_slots
    assert "margin-top: -2px;" in dense_preview


def test_level_badge_sits_in_striped_area():
    badge = css_block(".gameLevelBadge")
    large_badge = css_block('.gameCardView[data-card-size="large"] .gameLevelBadge')

    assert "left: 3%;" in badge
    assert "bottom: 44.8%;" in badge
    assert "width: 10mm;" in badge
    assert "height: 10mm;" in badge
    assert "bottom: 50.8%;" in large_badge


def test_game_card_code_sits_in_upper_right_corner():
    code = css_block(".gameCardCode")

    assert "position: absolute;" in code
    assert "top: 2.2mm;" in code
    assert "right: 3mm;" in code
    assert "background:" not in code
    assert "border:" not in code
    assert "border-radius:" not in code
    assert "box-shadow:" not in code


def test_piece_controls_are_combined_preview_cards():
    pieces = css_block(".pieceColors")
    control = css_block(".pieceColorControl")

    assert "grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));" in pieces
    assert "grid-template-rows: auto 1fr;" in control
    assert "min-height: 116px;" in control


def test_generation_status_row_and_overlay_are_styled():
    status_row = css_block(".statusRow")
    selection_panel = css_block(".printSelectionPanel")
    selection_head = css_block(".printSelectionHead")
    selection_actions = css_block(".printSelectionActions")
    selection_count = css_block(".printSelectionCount")
    generated_row = css_block(".generatedCardRow")
    generated_preview = css_block(".generatedCardPreview")
    generated_preview_card = css_block(".generatedCardPreviewCard")
    overlay = css_block(".generationOverlay")
    overlay_visible = css_block(".generationOverlay.visible")
    spinner = css_block(".generationSpinner")

    assert "display: flex;" in status_row
    assert "align-items: center;" in status_row
    assert "padding-top: 16px;" in selection_panel
    assert "display: flex;" in selection_head
    assert "justify-content: space-between;" in selection_head
    assert "display: flex;" in selection_actions
    assert "font-weight: 700;" in selection_count
    assert "grid-template-columns: auto 96px 1fr auto;" in generated_row
    assert "width: 96px;" in generated_preview
    assert "height: 138px;" in generated_preview
    assert "transform: translate(-50%, -50%) scale(.225);" in generated_preview_card
    assert "display: none;" in overlay
    assert "position: fixed;" in overlay
    assert "inset: 0;" in overlay
    assert "display: flex;" in overlay_visible
    assert "border-top-color: #246b73;" in spinner
    assert "@keyframes generation-spin" in CSS


def test_solution_model_has_compact_preview_frame():
    model = css_block(".solutionModel")
    preview = css_block(".solution3dPreview")

    assert "display: flex;" in model
    assert "justify-content: center;" in model
    assert "background: #f8fafb;" in model
    assert "border: 1px solid #c9d2dc;" in model
    assert "max-width: 100%;" in preview
    assert "height: auto;" in preview


def test_solution_layers_are_arranged_in_one_row():
    solution = css_block(".solution")
    title = css_block(".solution > h4")
    model = css_block(".solutionModel")
    layer = css_block(".solution > .layer")

    assert "display: flex;" in solution
    assert "flex-wrap: wrap;" in solution
    assert "align-items: flex-start;" in solution
    assert "flex: 0 0 100%;" in title
    assert "flex: 0 0 100%;" in model
    assert "flex: 0 0 auto;" in layer


def test_print_sheet_places_two_cards_on_a4_landscape():
    sheet = css_block(".printSheet")
    preview_sheet = css_block("body.printPreviewMode .printSheet")
    toolbar = css_block(".printPreviewToolbar")

    assert "display: none;" in sheet
    assert "display: none;" in toolbar
    assert "display: grid;" in preview_sheet
    assert "@page" in CSS
    assert "size: A4 landscape;" in CSS
    assert "margin: 0;" in CSS
    assert "width: 297mm;" in CSS
    assert "height: 210mm;" in CSS
    assert "box-sizing: border-box;" in CSS
    assert "padding: 3mm;" in CSS
    assert "grid-template-columns: repeat(2, 144mm);" in CSS
    assert "grid-template-columns: 144mm;" in CSS
    assert "grid-template-rows: auto;" in CSS
    assert "grid-template-rows: 157mm;" not in CSS
    assert "gap: 3mm;" in CSS
    assert "display: grid !important;" in CSS
    assert ".printPreviewToolbar" in CSS
    assert ".pieceLibraryPanel" in CSS
    assert "#newSession" in CSS
    assert ".printSelectionPanel" in CSS
    assert ".generationOverlay" in CSS
    assert "body.printPreviewMode main > :not(.printSheet)" in CSS
    assert "body.printPreviewMode > :not(main)" in CSS
    assert "display: none !important;" in CSS


def test_print_sheet_includes_compact_solution_blocks_under_cards():
    package = css_block(".printCardPackage")
    block = css_block(".printSolutionBlock")
    grid = css_block(".printSolutionGrid")
    item = css_block(".printSolutionItem")
    mini_svg = css_block(".printSolutionMiniModel svg")

    assert "width: 144mm;" in package
    assert "display: flex;" in package
    assert "flex-direction: row;" in package
    assert "gap: 1mm;" in package
    assert "height: var(--print-card-height, 157mm);" in package
    assert "width: 33mm;" in block
    assert "height: var(--print-card-height, 157mm);" in block
    assert "padding: 1mm;" in block
    assert "overflow: hidden;" in block
    assert "grid-template-columns: 1fr;" in grid
    assert "gap: 0.8mm;" in grid
    assert "min-height: 23mm;" in item
    assert "break-inside: avoid;" in item
    assert "width: 104px;" in mini_svg
    assert "height: 74px;" in mini_svg
