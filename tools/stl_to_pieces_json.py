#!/usr/bin/env python3
"""Convert Ubongo STL pieces into normalized polycube JSON."""

from __future__ import annotations

import argparse
import json
import math
import struct
import zipfile
from collections import defaultdict
from pathlib import Path
from xml.etree import ElementTree as ET


EPS = 1e-5


def parse_stl(path: Path) -> list[tuple[tuple[float, float, float], ...]]:
    data = path.read_bytes()
    if len(data) >= 84:
        tri_count = struct.unpack("<I", data[80:84])[0]
        expected = 84 + tri_count * 50
        if expected == len(data):
            triangles = []
            offset = 84
            for _ in range(tri_count):
                values = struct.unpack("<12fH", data[offset : offset + 50])[:12]
                triangles.append(
                    (
                        tuple(values[3:6]),
                        tuple(values[6:9]),
                        tuple(values[9:12]),
                    )
                )
                offset += 50
            return triangles

    triangles = []
    current = []
    for line in data.decode("utf-8", errors="ignore").splitlines():
        parts = line.strip().split()
        if len(parts) == 4 and parts[0].lower() == "vertex":
            current.append(tuple(float(v) for v in parts[1:4]))
            if len(current) == 3:
                triangles.append(tuple(current))
                current = []
    if not triangles:
        raise ValueError(f"{path.name}: no triangles found")
    return triangles


def bounds(triangles):
    vertices = [v for tri in triangles for v in tri]
    mins = [min(v[i] for v in vertices) for i in range(3)]
    maxs = [max(v[i] for v in vertices) for i in range(3)]
    return mins, maxs


def infer_pitch(triangles, mins, maxs):
    edge_lengths = defaultdict(int)
    for tri in triangles:
        for a, b in ((tri[0], tri[1]), (tri[1], tri[2]), (tri[2], tri[0])):
            deltas = [abs(a[i] - b[i]) for i in range(3)]
            non_zero = [d for d in deltas if d > EPS]
            if len(non_zero) == 1:
                edge_lengths[round(non_zero[0], 3)] += 1
    if edge_lengths:
        return max(edge_lengths.items(), key=lambda item: (item[1], -item[0]))[0]

    spans = [maxs[i] - mins[i] for i in range(3) if maxs[i] - mins[i] > EPS]
    scaled = [round(span * 1000) for span in spans]
    gcd = scaled[0]
    for span in scaled[1:]:
        gcd = math.gcd(gcd, span)
    pitch = gcd / 1000
    if pitch <= EPS:
        raise ValueError("could not infer cube pitch")
    return pitch


def point_in_triangle_2d(point, tri):
    px, py = point
    (ax, ay), (bx, by), (cx, cy) = tri
    denominator = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy)
    if abs(denominator) < EPS:
        return False
    u = ((by - cy) * (px - cx) + (cx - bx) * (py - cy)) / denominator
    v = ((cy - ay) * (px - cx) + (ax - cx) * (py - cy)) / denominator
    w = 1 - u - v
    return u >= -EPS and v >= -EPS and w >= -EPS


def contains_point(point, triangles):
    px, py, pz = point
    intersections = set()
    for tri in triangles:
        xs = [v[0] for v in tri]
        if max(xs) - min(xs) > EPS:
            continue
        x = xs[0]
        if x <= px + EPS:
            continue
        yz_tri = [(v[1], v[2]) for v in tri]
        if point_in_triangle_2d((py, pz), yz_tri):
            intersections.add(round(x, 6))
    return len(intersections) % 2 == 1


def triangles_to_cubes(triangles, label="mesh") -> list[list[int]]:
    mins, maxs = bounds(triangles)
    pitch = infer_pitch(triangles, mins, maxs)
    dims = [max(1, round((maxs[i] - mins[i]) / pitch)) for i in range(3)]

    cubes = []
    for x in range(dims[0]):
        for y in range(dims[1]):
            for z in range(dims[2]):
                point = (
                    mins[0] + (x + 0.5) * pitch,
                    mins[1] + (y + 0.5) * pitch,
                    mins[2] + (z + 0.5) * pitch,
                )
                if contains_point(point, triangles):
                    cubes.append([x, y, z])

    if not cubes:
        raise ValueError(f"{label}: produced an empty piece")
    return normalize(cubes)


def stl_to_cubes(path: Path) -> list[list[int]]:
    return triangles_to_cubes(parse_stl(Path(path)), Path(path).name)


def ns_for(root):
    if root.tag.startswith("{"):
        return {"m": root.tag.split("}")[0].strip("{")}
    return {}


def findall(node, pattern, ns):
    return node.findall(pattern, ns) if ns else node.findall(pattern.replace("m:", ""))


def find(node, pattern, ns):
    return node.find(pattern, ns) if ns else node.find(pattern.replace("m:", ""))


def mesh_triangles_from_model(data):
    root = ET.fromstring(data)
    ns = ns_for(root)
    entries = []
    for obj in findall(root, ".//m:object", ns):
        mesh = find(obj, "m:mesh", ns)
        if mesh is None:
            continue
        vertices_node = find(mesh, "m:vertices", ns)
        triangles_node = find(mesh, "m:triangles", ns)
        if vertices_node is None or triangles_node is None:
            continue
        vertices = []
        for vertex in findall(vertices_node, "m:vertex", ns):
            vertices.append(
                (
                    float(vertex.attrib["x"]),
                    float(vertex.attrib["y"]),
                    float(vertex.attrib["z"]),
                )
            )
        triangles = []
        for tri in findall(triangles_node, "m:triangle", ns):
            triangles.append(
                (
                    vertices[int(tri.attrib["v1"])],
                    vertices[int(tri.attrib["v2"])],
                    vertices[int(tri.attrib["v3"])],
                )
            )
        if triangles:
            entries.append((obj.attrib.get("id", str(len(entries) + 1)), triangles))
    return entries


def parse_3mf(path: Path):
    entries = {}
    with zipfile.ZipFile(path) as archive:
        model_paths = [name for name in archive.namelist() if name.endswith(".model")]
        for model_path in model_paths:
            for obj_id, triangles in mesh_triangles_from_model(archive.read(model_path)):
                key_name = f"{model_path}#object-{obj_id}"
                entries[key_name] = triangles

        main_models = [name for name in model_paths if name.endswith("3dmodel.model")]
        for main_model in main_models:
            root = ET.fromstring(archive.read(main_model))
            ns = ns_for(root)
            for component in findall(root, ".//m:component", ns):
                component_path = None
                for attr, value in component.attrib.items():
                    if attr.endswith("path"):
                        component_path = value.lstrip("/")
                        break
                if component_path and component_path in archive.namelist():
                    for obj_id, triangles in mesh_triangles_from_model(archive.read(component_path)):
                        key_name = f"{component_path}#object-{obj_id}"
                        entries[key_name] = triangles

    if not entries:
        raise ValueError(f"{path.name}: no mesh objects found")
    return sorted(entries.items())


def connected_components(cubes):
    cube_set = {tuple(c) for c in cubes}
    components = []
    while cube_set:
        start = cube_set.pop()
        stack = [start]
        component = [start]
        while stack:
            x, y, z = stack.pop()
            for dx, dy, dz in (
                (1, 0, 0),
                (-1, 0, 0),
                (0, 1, 0),
                (0, -1, 0),
                (0, 0, 1),
                (0, 0, -1),
            ):
                neighbor = (x + dx, y + dy, z + dz)
                if neighbor in cube_set:
                    cube_set.remove(neighbor)
                    stack.append(neighbor)
                    component.append(neighbor)
        components.append(normalize([list(c) for c in component]))
    return sorted(components, key=lambda c: (len(c), serialize(c)))


def key(cube):
    return ",".join(str(v) for v in cube)


def normalize(cubes):
    mins = [min(c[i] for c in cubes) for i in range(3)]
    return sorted(
        [[c[0] - mins[0], c[1] - mins[1], c[2] - mins[2]] for c in cubes],
        key=key,
    )


def serialize(cubes):
    return ";".join(key(c) for c in normalize(cubes))


def rotations(cubes):
    maps = [
        lambda c: [c[0], c[1], c[2]],
        lambda c: [c[0], -c[1], -c[2]],
        lambda c: [c[0], c[2], -c[1]],
        lambda c: [c[0], -c[2], c[1]],
        lambda c: [-c[0], c[1], -c[2]],
        lambda c: [-c[0], -c[1], c[2]],
        lambda c: [-c[0], c[2], c[1]],
        lambda c: [-c[0], -c[2], -c[1]],
        lambda c: [c[1], c[0], -c[2]],
        lambda c: [c[1], -c[0], c[2]],
        lambda c: [c[1], c[2], c[0]],
        lambda c: [c[1], -c[2], -c[0]],
        lambda c: [-c[1], c[0], c[2]],
        lambda c: [-c[1], -c[0], -c[2]],
        lambda c: [-c[1], c[2], -c[0]],
        lambda c: [-c[1], -c[2], c[0]],
        lambda c: [c[2], c[0], c[1]],
        lambda c: [c[2], -c[0], -c[1]],
        lambda c: [c[2], c[1], -c[0]],
        lambda c: [c[2], -c[1], c[0]],
        lambda c: [-c[2], c[0], -c[1]],
        lambda c: [-c[2], -c[0], c[1]],
        lambda c: [-c[2], c[1], c[0]],
        lambda c: [-c[2], -c[1], -c[0]],
    ]
    out = []
    seen = set()
    for mapper in maps:
        rotated = normalize([mapper(c) for c in cubes])
        sig = serialize(rotated)
        if sig not in seen:
            seen.add(sig)
            out.append(rotated)
    return out


def canonical(cubes):
    return min(serialize(r) for r in rotations(cubes))


def dimensions(cubes):
    return [1 + max(c[i] for c in cubes) for i in range(3)]


def source_meshes(source: Path):
    source = Path(source)
    roots = [source] if source.is_file() else sorted(source.rglob("*"))
    meshes = []
    stl_files = []
    three_mf_files = []
    for item in roots:
        suffix = item.suffix.lower()
        if suffix == ".stl":
            cubes = stl_to_cubes(item)
            stl_files.append(item)
            for index, component in enumerate(connected_components(cubes), 1):
                name = item.name if index == 1 else f"{item.name}#component-{index}"
                meshes.append((name, component))
        elif suffix == ".3mf":
            three_mf_files.append(item)
            for entry_name, triangles in parse_3mf(item):
                cubes = triangles_to_cubes(triangles, f"{item.name}:{entry_name}")
                for index, component in enumerate(connected_components(cubes), 1):
                    name = f"{item.name}:{entry_name}"
                    if index > 1:
                        name += f"#component-{index}"
                    meshes.append((name, component))

    if not meshes:
        raise ValueError(f"no STL or 3MF meshes found in {source}")
    return stl_files, three_mf_files, meshes


def convert_directory(source: Path):
    stl_files, three_mf_files, meshes = source_meshes(source)

    grouped = defaultdict(lambda: {"sourceFiles": [], "cubes": None})
    for source_name, cubes in meshes:
        sig = canonical(cubes)
        grouped[sig]["sourceFiles"].append(source_name)
        if grouped[sig]["cubes"] is None:
            grouped[sig]["cubes"] = cubes

    pieces = []
    for index, item in enumerate(sorted(grouped.values(), key=lambda p: p["sourceFiles"][0]), 1):
        pieces.append(
            {
                "id": f"P{index:02d}",
                "sourceFiles": sorted(item["sourceFiles"]),
                "cubes": item["cubes"],
            }
        )
    return stl_files, three_mf_files, pieces


def print_report(stl_files, three_mf_files, pieces):
    print(f"Loaded STL files: {len(stl_files)}")
    if three_mf_files:
        print(f"Loaded 3MF files: {len(three_mf_files)}")
    print(f"Unique shapes: {len(pieces)}")
    for piece in pieces:
        dims = dimensions(piece["cubes"])
        print(
            f"Piece {piece['id']}: volume {len(piece['cubes'])} cubes, "
            f"dims {dims[0]}x{dims[1]}x{dims[2]}, files: {', '.join(piece['sourceFiles'])}"
        )


def main(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args(argv)

    stl_files, three_mf_files, pieces = convert_directory(args.source)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(pieces, ensure_ascii=False, indent=2), encoding="utf-8")
    print_report(stl_files, three_mf_files, pieces)


if __name__ == "__main__":
    main()
