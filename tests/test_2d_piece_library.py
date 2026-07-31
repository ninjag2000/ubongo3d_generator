import json
from pathlib import Path


PIECES = json.loads(Path("data/pieces_2d_photo.json").read_text(encoding="utf-8"))


EXPECTED = {
    "D01": {(0, 0), (0, 1), (0, 2), (1, 2), (0, 3)},
    "D02": {(0, 0), (0, 1)},
    "D03": {(0, 0), (1, 0), (0, 1), (0, 2)},
    "D04": {(1, 0), (0, 1), (1, 1), (0, 2), (1, 2)},
    "D05": {(0, 0), (0, 1), (1, 1), (0, 2)},
    "D06": {(0, 0), (1, 0), (1, 1)},
    "D07": {(0, 0), (1, 0), (0, 1), (1, 1)},
    "D08": {(0, 0), (0, 1), (1, 1), (1, 2)},
    "D09": {(0, 0), (1, 0), (1, 1), (1, 2), (2, 2)},
    "D10": {(0, 0), (0, 1), (0, 2)},
    "D11": {(0, 0), (0, 1), (0, 2), (0, 3)},
    "D12": {(0, 0), (0, 1), (1, 1), (2, 1), (3, 1)},
}


def normalize(cells):
    min_x = min(x for x, _ in cells)
    min_y = min(y for _, y in cells)
    return tuple(sorted((x - min_x, y - min_y) for x, y in cells))


def orientations(cells):
    transforms = (
        lambda x, y: (x, y),
        lambda x, y: (-y, x),
        lambda x, y: (-x, -y),
        lambda x, y: (y, -x),
        lambda x, y: (-x, y),
        lambda x, y: (-y, -x),
        lambda x, y: (x, -y),
        lambda x, y: (y, x),
    )
    return {normalize([transform(x, y) for x, y in cells]) for transform in transforms}


def canonical(cells):
    return min(orientations(cells))


def test_photo_library_has_exact_recovered_geometry():
    assert len(PIECES) == 12
    assert {piece["id"] for piece in PIECES} == set(EXPECTED)
    for piece in PIECES:
        assert set(map(tuple, piece["cells"])) == EXPECTED[piece["id"]]
        assert piece["color"].startswith("#") and len(piece["color"]) == 7


def test_photo_library_area_and_shape_range():
    areas = [len(piece["cells"]) for piece in PIECES]
    assert sum(areas) == 48
    assert min(areas) == 2
    assert max(areas) == 5


def test_photo_library_has_no_rotation_or_reflection_duplicates():
    signatures = [canonical(piece["cells"]) for piece in PIECES]
    assert len(signatures) == len(set(signatures))
