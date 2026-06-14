from pathlib import Path
import re


HTML = Path("index.html").read_text(encoding="utf-8")


def test_variants_per_card_is_fixed_to_six():
    match = re.search(r'<input id="comboCount"(?P<attrs>[^>]*)>', HTML)
    assert match, "Missing comboCount input"
    attrs = match.group("attrs")

    assert 'value="6"' in attrs
    assert 'min="6"' in attrs
    assert 'max="6"' in attrs
    assert "disabled" in attrs
    assert 'aria-describedby="comboCountHint"' in attrs


def test_variants_per_card_hint_explains_task_split():
    assert 'id="comboCountHint"' in HTML
    assert "6 total" in HTML
    assert "3-piece cards get 2 tasks with 3 variants each" in HTML
    assert "larger piece counts get 1 task with 6 variants" in HTML


def test_card_number_control_is_rendered():
    match = re.search(r'<input id="cardNumber"(?P<attrs>[^>]*)>', HTML)
    assert match, "Missing cardNumber input"
    attrs = match.group("attrs")

    assert "Card number" in HTML
    assert 'type="number"' in attrs
    assert 'min="1"' in attrs
    assert 'max="99"' in attrs
    assert 'value="1"' in attrs


def test_target_cell_size_control_offers_supported_mm_sizes():
    assert "Target cell size" in HTML
    assert 'id="targetCellSize"' in HTML
    assert '<option value="14.5" selected>14.5 mm</option>' in HTML
    assert '<option value="13">13 mm</option>' in HTML


def test_tasks_per_card_control_is_not_rendered():
    assert 'id="taskCount"' not in HTML
    assert "Tasks per card" not in HTML


def test_piece_library_is_opened_by_button_only():
    assert '<button id="togglePieceLibrary" type="button"' in HTML
    assert 'aria-controls="pieceLibraryPanel"' in HTML
    assert 'aria-expanded="false"' in HTML
    assert '<section id="pieceLibraryPanel" class="panel pieceLibraryPanel hidden">' in HTML


def test_piece_library_does_not_render_separate_preview_block():
    assert 'id="piecePreview"' not in HTML


def test_piece_library_preset_buttons_are_rendered():
    assert 'class="piecePresetBar"' in HTML
    assert 'id="presetOldThingiverse"' in HTML
    assert ">Old Edition<" in HTML
    assert 'id="presetFamilyThingiverse"' in HTML
    assert ">Family Edition<" in HTML
    assert 'id="presetCustomPieces"' in HTML
    assert ">Custom<" in HTML
    assert 'id="presetAllPieces"' in HTML
    assert "All pieces" in HTML


def test_unique_piece_sets_control_is_not_rendered():
    assert 'id="uniqueSets"' not in HTML
    assert "unique piece sets" not in HTML


def test_print_sheet_container_exists():
    assert 'id="printPreviewToolbar"' in HTML
    assert 'id="printNow"' in HTML
    assert "Print now" in HTML
    assert 'id="exitPrintPreview"' in HTML
    assert "Exit print preview" in HTML
    assert '<section id="printSheet" class="printSheet" aria-hidden="true"></section>' in HTML
