#!/usr/bin/env python3
"""
One-shot pipeline: PRISM LCA "Model" (a product graph from the LCA MCP's
list_product_graphs) -> EcoSpold v2 -> TIDAS package -> validated, ready-to-
upload .zip for the TianGong platform (https://github.com/tiangong-lca/platform).

Usage:
    python3 scripts/export_tidas.py "Jacket — 1 unit (3-tier)"
    python3 scripts/export_tidas.py --list
    python3 scripts/export_tidas.py --all
    python3 scripts/export_tidas.py --all --out-dir dist/tidas

Requires:
    pip install -r scripts/requirements.txt   # installs tidas-tools

Steps this runs, per target:
    1. export_ecospold.py's exporter -> EcoSpold v2 XML (schema-valid)
    2. `python -m tidas_tools.import_lca.cli` --from-format ecospold2 --target tidas
    3. `python -m tidas_tools.validate` --data-format tidas --report-format json
    4. Zip the TIDAS package contents at the zip root (tidas-import's own
       output layout already matches what the TianGong web upload expects)

Output per target, under --out-dir (default: scripts/tidas-export/<slug>/):
    tidas.zip                  - upload this to the TianGong platform
    conversion-report.json     - tidas-import's report
    validation-report.json     - tidas-validate's report (ok/errors/warnings)

Exits non-zero if either step reports errors, or if validation is not ok.
"""
import argparse
import glob
import json
import os
import subprocess
import sys
import zipfile

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPT_DIR)

from export_ecospold import GraphExporter, fetch_datasets, load_env, slugify, write_xml  # noqa: E402


def check_tidas_tools():
    try:
        import tidas_tools  # noqa: F401
    except ImportError:
        sys.exit(
            "tidas-tools is not installed. Run:\n"
            "  pip install -r scripts/requirements.txt"
        )


def dataset_version(doc):
    """Extract common:dataSetVersion from a TIDAS record, whatever its root key is."""
    root = next(iter(doc.values()), {})
    admin = root.get("administrativeInformation", {})
    version = admin.get("publicationAndOwnership", {}).get("common:dataSetVersion")
    return version or "00.00.001"


def apply_tiangong_filename_convention(tidas_dir, label):
    """
    Rename every '<category>/<uuid>.json' to '<category>/<uuid>_<version>.json'.

    The TianGong platform's own zip importer (tiangong-lca/worker,
    crates/solver-worker/src/package_execution.rs, parse_root_from_package_file_path)
    requires this exact filename shape — it rsplits on '_' to recover the id and
    version, and silently skips any file that doesn't match, which is why a package
    produced by plain `tidas-tools` (files named just '<uuid>.json') gets rejected
    with "the package does not contain any supported TIDAS datasets" even though it
    passes tidas-tools' own validator.
    """
    renamed = 0
    for path in glob.glob(os.path.join(tidas_dir, "*", "*.json")):
        fname = os.path.basename(path)
        stem = fname[:-len(".json")]
        if "_" in stem:
            continue  # already has a version suffix
        with open(path, encoding="utf-8") as f:
            doc = json.load(f)
        version = dataset_version(doc)
        new_path = os.path.join(os.path.dirname(path), f"{stem}_{version}.json")
        os.rename(path, new_path)
        renamed += 1
    print(f"[{label}] renamed {renamed} file(s) to the <uuid>_<version>.json convention TianGong expects")


def run_module(module, args):
    cmd = [sys.executable, "-m", module, *args]
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result


def export_and_convert(exporter, model_rows, target_dir, label):
    os.makedirs(target_dir, exist_ok=True)
    ecospold_dir = os.path.join(target_dir, "ecospold")
    os.makedirs(ecospold_dir, exist_ok=True)

    for model in model_rows:
        root = exporter.export_model(model)
        out_path = os.path.join(ecospold_dir, f"{slugify(model['name'])}.ecospold2.xml")
        write_xml(root, out_path)

    print(f"[{label}] wrote {len(model_rows)} EcoSpold v2 file(s) -> {ecospold_dir}")

    conversion_report = os.path.join(target_dir, "conversion-report.json")
    result = run_module(
        "tidas_tools.import_lca.cli",
        [
            "--input", ecospold_dir,
            "--output-dir", target_dir,
            "--from-format", "ecospold2",
            "--target", "tidas",
            "--write-mapping-csv",
            "--report", conversion_report,
        ],
    )
    print(result.stdout, end="")
    print(result.stderr, end="", file=sys.stderr)
    if result.returncode != 0:
        print(f"[{label}] tidas-import failed (exit {result.returncode})", file=sys.stderr)
        return False

    report = json.load(open(conversion_report))
    summary = report.get("summary", {})
    if summary.get("errors", 0):
        print(f"[{label}] tidas-import reported {summary['errors']} error(s), see {conversion_report}", file=sys.stderr)
        return False
    print(f"[{label}] converted: {summary}")

    tidas_dir = os.path.join(target_dir, "tidas")
    validation_report = os.path.join(target_dir, "validation-report.json")
    result = run_module(
        "tidas_tools.validate",
        [
            "--input-dir", tidas_dir,
            "--data-format", "tidas",
            "--report-format", "json",
        ],
    )
    if result.returncode != 0:
        print(f"[{label}] tidas-validate failed (exit {result.returncode}): {result.stderr}", file=sys.stderr)
        return False
    with open(validation_report, "w") as f:
        f.write(result.stdout)
    validation = json.loads(result.stdout)
    if not validation.get("ok"):
        print(f"[{label}] validation failed, see {validation_report}", file=sys.stderr)
        return False
    print(f"[{label}] validated ok: {validation['summary']}")

    apply_tiangong_filename_convention(tidas_dir, label)

    zip_path = os.path.join(target_dir, "tidas.zip")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for root_dir, _dirs, files in os.walk(tidas_dir):
            for fname in files:
                full = os.path.join(root_dir, fname)
                arc = os.path.relpath(full, tidas_dir)
                zf.write(full, arcname=arc)
    print(f"[{label}] wrote {zip_path} (ready to upload)")
    return True


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("model_name", nargs="?", help="Exact name of a Model row, e.g. 'Jacket — 1 unit (3-tier)'")
    parser.add_argument("--list", action="store_true", help="List available model names and exit")
    parser.add_argument("--all", action="store_true", help="Export every model into one combined TIDAS package")
    parser.add_argument("--out-dir", default=None, help="Directory to write output into (default: scripts/tidas-export/<slug>)")
    args = parser.parse_args()

    check_tidas_tools()

    repo_root = os.path.dirname(SCRIPT_DIR)
    env = load_env(repo_root)
    supabase_url = env.get("VITE_SUPABASE_URL")
    anon_key = env.get("VITE_SUPABASE_ANON_KEY")
    if not supabase_url or not anon_key:
        sys.exit("VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not found in .env")

    rows = fetch_datasets(supabase_url, anon_key)
    exporter = GraphExporter(rows)

    if args.list:
        for m in exporter.models:
            print(m["name"])
        return

    if args.all:
        label = "all-product-graphs"
        model_rows = exporter.models
    else:
        if not args.model_name:
            sys.exit("Pass a model name, or --list, or --all. See --help.")
        model = exporter.find_model(args.model_name)
        if model is None:
            sys.exit(f"No model named '{args.model_name}'. Run with --list to see options.")
        label = slugify(model["name"])
        model_rows = [model]

    out_dir = args.out_dir or os.path.join(SCRIPT_DIR, "tidas-export", label)
    ok = export_and_convert(exporter, model_rows, out_dir, label)
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
