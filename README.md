# Ubongo 3D Card Generator

Local browser tool for generating Ubongo 3D-style challenge cards. Each card contains one target 3D volume and six different piece combinations that solve that same volume.

## Run

Open `index.html` directly, or serve the folder locally:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

The app tries to load the combined real piece library from:

```text
data/pieces_thingiverse_6534722.json
```

Some browsers block `fetch()` from `file://`. If that happens, use the **Load pieces.json** button and select the generated JSON manually.

## Real Piece Sources

The main STL source is Thingiverse thing 6534722:

```text
https://www.thingiverse.com/thing:6534722/files
```

Search metadata identifies it as **UBONGO 3D by PegFranck**, published under Creative Commons Attribution / CC BY. The extracted files are in:

```text
source_stl/thingiverse_6534722/files/
```

The app also includes non-duplicate models from Thingiverse thing 5072592:

```text
https://www.thingiverse.com/thing:5072592/files
```

That source contains 8 STL files. Seven are rotational duplicates of existing 6534722 pieces, so only `1red.STL` is added to the active library as `P17`.

## Regenerate Pieces JSON

Run:

```bash
python tools/stl_to_pieces_json.py source_stl/thingiverse_6534722 data/pieces_thingiverse_6534722.json
```

The converter:

- reads binary or ASCII STL files recursively;
- infers the cube pitch from STL edge geometry;
- voxelizes each mesh into integer cube coordinates;
- normalizes each piece to start at `[0,0,0]`;
- merges only rotational duplicates, not mirrored shapes;
- writes `id`, `sourceFiles`, and `cubes` for each piece;
- prints a quality report with file count, unique shape count, volume, dimensions, and source files.

Expected current 6534722 report:

```text
Loaded STL files: 16
Unique shapes: 16
```

For Thingiverse 5072592:

```bash
python tools/stl_to_pieces_json.py source_stl/thingiverse_5072592 data/pieces_thingiverse_5072592.json
```

Expected 5072592 report:

```text
Loaded STL files: 8
Unique shapes: 8
```

## Tests

Run:

```bash
python -m pytest -q
```

The tests cover binary STL voxel conversion, nested Thingiverse-style file layouts, and rotational duplicate merging.
