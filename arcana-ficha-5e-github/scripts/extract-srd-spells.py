#!/usr/bin/env python3
"""Extract the open spell compendium from the official SRD 5.2.1 PDF.

The source PDF is two-column. Poppler's full-page extraction occasionally
interleaves both columns, so each page is cropped and read left-to-right.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
from pathlib import Path


SPELL_PAGES = range(107, 176)
COLUMNS = (35, 304)


def extract_columns(pdf: Path) -> list[str]:
    chunks: list[str] = []
    for page in SPELL_PAGES:
        for x in COLUMNS:
            result = subprocess.run(
                [
                    "pdftotext",
                    "-f",
                    str(page),
                    "-l",
                    str(page),
                    "-x",
                    str(x),
                    "-y",
                    "35",
                    "-W",
                    "255",
                    "-H",
                    "700",
                    "-nopgbrk",
                    str(pdf),
                    "-",
                ],
                check=True,
                capture_output=True,
                text=True,
            )
            chunks.append(result.stdout)
    return "\n".join(chunks).splitlines()


def compact(lines: list[str]) -> str:
    output: list[str] = []
    for raw in lines:
        line = raw.strip()
        if not line or line == "Spell Descriptions":
            continue
        if output and output[-1].endswith("-") and line[:1].islower():
            output[-1] = output[-1][:-1] + line
        else:
            output.append(line)
    return " ".join(output).replace("  ", " ").strip()


def parse_spells(lines: list[str]) -> list[dict[str, object]]:
    meta_re = re.compile(r"^(?:Level [1-9] [A-Za-z]+|[A-Za-z]+ Cantrip)\b")
    casting_positions = [i for i, line in enumerate(lines) if line.startswith("Casting Time:")]
    starts: list[tuple[int, int, int]] = []

    for casting_index in casting_positions:
        meta_index = next(
            (
                i
                for i in range(casting_index - 1, max(-1, casting_index - 9), -1)
                if meta_re.match(lines[i].strip())
            ),
            None,
        )
        if meta_index is None:
            raise RuntimeError(f"Spell metadata not found near line {casting_index}")

        title_index = meta_index - 1
        while title_index >= 0 and not lines[title_index].strip():
            title_index -= 1
        starts.append((title_index, meta_index, casting_index))

    spells: list[dict[str, object]] = []
    for position, (title_index, meta_index, casting_index) in enumerate(starts):
        title = lines[title_index].strip()
        metadata = compact(lines[meta_index:casting_index])

        level_match = re.match(r"Level ([1-9]) ([A-Za-z]+) \((.*)\)$", metadata)
        cantrip_match = re.match(r"([A-Za-z]+) Cantrip \((.*)\)$", metadata)
        if level_match:
            level = int(level_match.group(1))
            school = level_match.group(2)
            classes_raw = level_match.group(3)
        elif cantrip_match:
            level = 0
            school = cantrip_match.group(1)
            classes_raw = cantrip_match.group(2)
        else:
            raise RuntimeError(f"Unrecognized metadata for {title}: {metadata}")

        end_index = starts[position + 1][0] if position + 1 < len(starts) else len(lines)

        range_index = next(
            i for i in range(casting_index + 1, min(casting_index + 8, end_index)) if lines[i].startswith("Range:")
        )
        components_index = next(
            i
            for i in range(range_index + 1, min(range_index + 8, end_index))
            if lines[i].startswith(("Components:", "Component:"))
        )
        duration_index = next(
            i
            for i in range(components_index + 1, min(components_index + 8, end_index))
            if lines[i].startswith("Duration:")
        )

        components = compact(lines[components_index:duration_index])
        components = re.sub(r"^Components?:\s*", "", components)
        description = compact(lines[duration_index + 1 : end_index])

        spells.append(
            {
                "id": re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-"),
                "name": title,
                "level": level,
                "school": school,
                "classes": [item.strip() for item in classes_raw.split(",")],
                "castingTime": lines[casting_index].split(":", 1)[1].strip(),
                "range": lines[range_index].split(":", 1)[1].strip(),
                "components": components,
                "duration": lines[duration_index].split(":", 1)[1].strip(),
                "concentration": "Concentration" in lines[duration_index],
                "ritual": "Ritual" in lines[casting_index],
                "description": description,
                "source": "SRD 5.2.1",
            }
        )

    return spells


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    spells = parse_spells(extract_columns(args.pdf))
    if len(spells) != 339:
        raise RuntimeError(f"Expected 339 spells, extracted {len(spells)}")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(spells, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"Extracted {len(spells)} spells to {args.output}")


if __name__ == "__main__":
    main()
