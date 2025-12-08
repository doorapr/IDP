import argparse
import pathlib
import sys
import pandas as pd

#!/usr/bin/env python3
"""
xlsx_to_csv.py - simple converter from .xlsx to .csv

Usage:
    python xlsx_to_csv.py input.xlsx [-o output.csv] [-s SHEET] [--all]

- By default exports the first sheet to input.csv
- Use -s to select a sheet by name or zero-based index
- Use --all to export all sheets to separate CSVs named file_sheetname.csv
Requires: pandas, openpyxl
Install: pip install pandas openpyxl
"""

def main():
        p = argparse.ArgumentParser(description="Convert .xlsx to .csv")
        p.add_argument("input", help="Input .xlsx file")
        p.add_argument("-o", "--output", help="Output .csv file (default: input.csv)")
        p.add_argument("-s", "--sheet", help="Sheet name or zero-based index (default: first sheet)")
        p.add_argument("--all", action="store_true", help="Export all sheets to separate CSV files")
        args = p.parse_args()

        inp = pathlib.Path(args.input)
        if not inp.exists():
                sys.exit(f"Input file not found: {inp}")

        if args.all:
                sheets = pd.read_excel(inp, sheet_name=None, engine="openpyxl")
                for name, df in sheets.items():
                        safe_name = str(name).replace("/", "_").replace("\\", "_")
                        out = inp.with_name(f"{inp.stem}_{safe_name}.csv")
                        df.to_csv(out, index=False)
                print(f"Exported {len(sheets)} sheets to CSV files.")
                return

        sheet = args.sheet
        if sheet is None:
                sheet = 0
        else:
                # try to convert numeric index
                try:
                        sheet = int(sheet)
                except Exception:
                        pass

        df = pd.read_excel(inp, sheet_name=sheet, engine="openpyxl")
        out = pathlib.Path(args.output) if args.output else inp.with_suffix(".csv")
        df.to_csv(out, index=False)
        print(f"Saved: {out}")

if __name__ == "__main__":
        main()