#!/usr/bin/env bash
# traverse_tree.sh
# Usage:
#   ./traverse_tree.sh /path/to/rootdir [--dirs-only] [--out=filename]
#
# Examples:
#   ./traverse_tree.sh /home/username/projects/myproject --dirs-only --out=myproject_tree.txt
# https://chatgpt.com/share/68e508d0-4328-800c-a333-925e4b99908b
set -euo pipefail

root_dir="${1:-}"
if [[ -z "$root_dir" ]]; then
  echo "Usage: $0 /path/to/rootdir [--dirs-only] [--out=filename]"
  exit 1
fi

dirs_only=false
outfile=""

shift || true
for arg in "$@"; do
  case "$arg" in
    --dirs-only) dirs_only=true ;;
    --out=*) outfile="${arg#--out=}" ;;
    *) ;;
  esac
done

# Normalize the path
root_dir="$(realpath -- "$root_dir")"

# Build find command
if $dirs_only; then
  find_cmd=(find "$root_dir" -type d)
else
  find_cmd=(find "$root_dir")
fi

# Collect lines into array
output_lines=()
while IFS= read -r path; do
  if [[ "$path" == "$root_dir" ]]; then
    continue
  fi
  rel="${path#$root_dir/}"
  depth=$(awk -F"/" '{print NF-1}' <<< "$rel")
  indent=""
  for ((i=0;i<depth;i++)); do indent+="│   "; done
  base="$(basename -- "$path")"
  if [[ -d "$path" ]]; then
    line="${indent}├── ${base}/"
  else
    line="${indent}├── ${base}"
  fi
  output_lines+=("$line")
done < <("${find_cmd[@]}" 2>/dev/null | sort)

header="${root_dir%/}/"
{
  echo "$header"
  for l in "${output_lines[@]}"; do
    echo "$l"
  done
} > "${outfile:-/dev/stdout}"

if [[ -n "$outfile" ]]; then
  echo "Wrote output to $outfile"
fi
