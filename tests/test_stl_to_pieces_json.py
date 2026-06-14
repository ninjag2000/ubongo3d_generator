import importlib.util
import json
import struct
import subprocess
import sys
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MODULE_PATH = ROOT / "tools" / "stl_to_pieces_json.py"


def load_converter():
    spec = importlib.util.spec_from_file_location("stl_to_pieces_json", MODULE_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def write_binary_stl(path, cubes, pitch=10.0):
    dirs = [
        ((1, 0, 0), [(1, 0, 0), (1, 1, 0), (1, 1, 1), (1, 0, 1)]),
        ((-1, 0, 0), [(0, 0, 0), (0, 0, 1), (0, 1, 1), (0, 1, 0)]),
        ((0, 1, 0), [(0, 1, 0), (0, 1, 1), (1, 1, 1), (1, 1, 0)]),
        ((0, -1, 0), [(0, 0, 0), (1, 0, 0), (1, 0, 1), (0, 0, 1)]),
        ((0, 0, 1), [(0, 0, 1), (1, 0, 1), (1, 1, 1), (0, 1, 1)]),
        ((0, 0, -1), [(0, 0, 0), (0, 1, 0), (1, 1, 0), (1, 0, 0)]),
    ]
    cube_set = set(cubes)
    triangles = []
    for cube in cube_set:
        cx, cy, cz = cube
        for normal, face in dirs:
            nx, ny, nz = normal
            if (cx + nx, cy + ny, cz + nz) in cube_set:
                continue
            pts = [
                ((cx + x) * pitch, (cy + y) * pitch, (cz + z) * pitch)
                for x, y, z in face
            ]
            triangles.append((normal, pts[0], pts[1], pts[2]))
            triangles.append((normal, pts[0], pts[2], pts[3]))

    data = bytearray(b"test stl".ljust(80, b"\0"))
    data.extend(struct.pack("<I", len(triangles)))
    for normal, a, b, c in triangles:
        data.extend(struct.pack("<12fH", *normal, *a, *b, *c, 0))
    path.write_bytes(data)


def cube_triangles(cubes, pitch=10.0):
    dirs = [
        ((1, 0, 0), [(1, 0, 0), (1, 1, 0), (1, 1, 1), (1, 0, 1)]),
        ((-1, 0, 0), [(0, 0, 0), (0, 0, 1), (0, 1, 1), (0, 1, 0)]),
        ((0, 1, 0), [(0, 1, 0), (0, 1, 1), (1, 1, 1), (1, 1, 0)]),
        ((0, -1, 0), [(0, 0, 0), (1, 0, 0), (1, 0, 1), (0, 0, 1)]),
        ((0, 0, 1), [(0, 0, 1), (1, 0, 1), (1, 1, 1), (0, 1, 1)]),
        ((0, 0, -1), [(0, 0, 0), (0, 1, 0), (1, 1, 0), (1, 0, 0)]),
    ]
    cube_set = set(cubes)
    triangles = []
    for cube in cube_set:
        cx, cy, cz = cube
        for normal, face in dirs:
            nx, ny, nz = normal
            if (cx + nx, cy + ny, cz + nz) in cube_set:
                continue
            pts = [
                ((cx + x) * pitch, (cy + y) * pitch, (cz + z) * pitch)
                for x, y, z in face
            ]
            triangles.append((pts[0], pts[1], pts[2]))
            triangles.append((pts[0], pts[2], pts[3]))
    return triangles


def object_model_xml(object_id, cubes):
    vertices = []
    vertex_ids = {}
    triangle_tags = []
    for tri in cube_triangles(cubes):
        ids = []
        for vertex in tri:
            if vertex not in vertex_ids:
                vertex_ids[vertex] = len(vertices)
                vertices.append(vertex)
            ids.append(vertex_ids[vertex])
        triangle_tags.append(f'<triangle v1="{ids[0]}" v2="{ids[1]}" v3="{ids[2]}"/>')
    vertex_tags = [
        f'<vertex x="{x}" y="{y}" z="{z}"/>'
        for x, y, z in vertices
    ]
    return (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<model unit="millimeter" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">'
        '<resources>'
        f'<object id="{object_id}" type="model"><mesh><vertices>'
        + "".join(vertex_tags)
        + '</vertices><triangles>'
        + "".join(triangle_tags)
        + '</triangles></mesh></object></resources></model>'
    )


def write_3mf(path, object_cubes):
    main_objects = []
    build_items = []
    files = {}
    for index, cubes in enumerate(object_cubes, 1):
        object_path = f"3D/Objects/object_{index}.model"
        files[object_path] = object_model_xml(index, cubes)
        main_id = index * 2
        main_objects.append(
            f'<object id="{main_id}" type="model"><components>'
            f'<component p:path="/{object_path}" objectid="{index}" '
            'transform="1 0 0 0 1 0 0 0 1 0 0 0"/>'
            '</components></object>'
        )
        build_items.append(
            f'<item objectid="{main_id}" transform="1 0 0 0 1 0 0 0 1 {index * 20} 0 0"/>'
        )
    main = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<model unit="millimeter" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" '
        'xmlns:p="http://schemas.microsoft.com/3dmanufacturing/production/2015/06">'
        '<resources>'
        + "".join(main_objects)
        + '</resources><build>'
        + "".join(build_items)
        + '</build></model>'
    )
    with zipfile.ZipFile(path, "w") as archive:
        archive.writestr("[Content_Types].xml", "<Types/>")
        archive.writestr("3D/3dmodel.model", main)
        for name, data in files.items():
            archive.writestr(name, data)


def test_binary_stl_is_converted_to_normalized_cubes(tmp_path):
    converter = load_converter()
    stl = tmp_path / "piece.stl"
    write_binary_stl(stl, [(4, 2, 1), (5, 2, 1), (5, 3, 1)])

    assert converter.stl_to_cubes(stl) == [[0, 0, 0], [1, 0, 0], [1, 1, 0]]


def test_three_mf_meshes_are_converted_and_deduplicated(tmp_path):
    converter = load_converter()
    src = tmp_path / "source"
    src.mkdir()
    write_3mf(
        src / "pieces.3mf",
        [
            [(0, 0, 0), (1, 0, 0)],
            [(0, 0, 0), (0, 1, 0)],
            [(0, 0, 0), (1, 0, 0), (1, 1, 0)],
        ],
    )

    stl_files, three_mf_files, pieces = converter.convert_directory(src)

    assert stl_files == []
    assert [path.name for path in three_mf_files] == ["pieces.3mf"]
    assert [piece["cubes"] for piece in pieces] == [
        [[0, 0, 0], [1, 0, 0]],
        [[0, 0, 0], [1, 0, 0], [1, 1, 0]],
    ]


def test_cli_recurses_nested_zip_layout_and_merges_rotations(tmp_path):
    src = tmp_path / "source"
    nested = src / "files"
    nested.mkdir(parents=True)
    write_binary_stl(nested / "A.stl", [(0, 0, 0), (1, 0, 0)])
    write_binary_stl(nested / "B.stl", [(0, 0, 0), (0, 1, 0)])
    dst = tmp_path / "pieces.json"

    proc = subprocess.run(
        [sys.executable, str(MODULE_PATH), str(src), str(dst)],
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )

    assert proc.returncode == 0, proc.stderr
    assert "Loaded STL files: 2" in proc.stdout
    assert "Unique shapes: 1" in proc.stdout
    pieces = json.loads(dst.read_text(encoding="utf-8"))
    assert pieces == [
        {
            "id": "P01",
            "sourceFiles": ["A.stl", "B.stl"],
            "cubes": [[0, 0, 0], [1, 0, 0]],
        }
    ]


def test_active_piece_library_has_no_rotation_duplicates():
    converter = load_converter()
    pieces = json.loads((ROOT / "data" / "pieces_thingiverse_6534722.json").read_text(encoding="utf-8"))
    signatures_by_piece = {}
    for piece in pieces:
        signatures_by_piece.setdefault(converter.canonical(piece["cubes"]), []).append(piece["id"])

    duplicate_groups = [sorted(ids) for ids in signatures_by_piece.values() if len(ids) > 1]
    assert duplicate_groups == []
    assert not any(piece["id"] == "P05" for piece in pieces)
    assert any(piece == {
        "id": "P17",
        "sourceFiles": ["thingiverse_5072592/1red.STL"],
        "cubes": [[0, 0, 0], [0, 1, 0]],
    } for piece in pieces)
    assert pieces[-1] == {
        "id": "P18",
        "sourceFiles": ["JAUNE_1_UBONGO.stl", "Ubongo_3D_3Layers.3mf/manual-brown-layers-100-111-000-010"],
        "cubes": [[0, 1, 0], [1, 0, 0], [1, 1, 0], [2, 1, 0], [2, 1, 1]],
    }
