#!/usr/bin/env bash
set -euo pipefail
WORKDIR="$(cd "$(dirname "$0")/.." && pwd)"
BIB="$WORKDIR/thesis 3/references.bib"
OUT="$WORKDIR/thesis 3/data/bib_check_report.md"
mkdir -p "$(dirname "$OUT")"
echo "# Bibliography check report" > "$OUT"
echo "Generated: $(date -u)" >> "$OUT"
echo "" >> "$OUT"

# Extract DOIs and URLs
grep -i "doi\s*=\|howpublished\|url\s*=\"" -n "$BIB" | sed 's/^/\n- /' >> "$OUT"

echo "\n## Link status" >> "$OUT"

# For each DOI entry, try DOI resolver
grep -i "doi\s*=" "$BIB" | while read -r line; do
  # extract DOI value robustly (between braces or quotes) using perl
  doi=$(perl -ne 'if (/doi\s*=\s*\{([^}]*)\}/i){print $1} elsif (/doi\s*=\s*"([^"]*)"/i){print $1}' <<< "$line")
  doi=$(echo "$doi" | sed 's/[[:space:]]//g')
  if [ -z "$doi" ]; then continue; fi
  url="https://doi.org/$doi"
  echo "Checking DOI: $doi -> $url" >> "$OUT"
  status=$(curl -s -o /dev/null -w "%{http_code}" -L --max-redirs 5 "$url" || echo "000")
  echo "- DOI: [$doi](https://doi.org/$doi) — HTTP $status" >> "$OUT"
done

# Check explicit URLs written as \url{...} or url = "..."
grep -i "\\url{\|url\s*=\s*\"" "$BIB" | while read -r line; do
  url=$(echo "$line" | sed -E 's/.*\\url\{([^}]*)\}.*/\1/i; s/.*url\s*=\s*"([^"]*)".*/\1/i')
  url=$(echo "$url" | sed 's/[[:space:]]//g')
  if [ -z "$url" ]; then continue; fi
  echo "Checking URL: $url" >> "$OUT"
  status=$(curl -s -o /dev/null -w "%{http_code}" -L --max-redirs 5 "$url" || echo "000")
  echo "- URL: <$url> — HTTP $status" >> "$OUT"
done

# Summarize failures
echo "\n## Summary" >> "$OUT"
awk '/HTTP [0-9]{3}/{print}' "$OUT" | grep -v "HTTP 200" | sed 's/^/- Failure: /' >> "$OUT" || true

echo "\nReport written to $OUT"
chmod +x "$WORKDIR/scripts/check_bib.sh"
