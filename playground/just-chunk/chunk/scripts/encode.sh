#!/bin/bash
set -e

to_absolute_path() {
    local path="$1"
    if [[ "$path" != /* ]]; then
        path="$PWD/$path"
    fi
    echo "$(cd "$(dirname "$path")" && pwd)/$(basename "$path")"
}

TARGET_PATH=$(to_absolute_path "$1")
OUTPUT_PATH=$(to_absolute_path "$2")

cd "$(dirname "$0")"

node ../index.js -t "$TARGET_PATH" -o "$OUTPUT_PATH"