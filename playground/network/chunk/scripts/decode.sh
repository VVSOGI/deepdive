#!/bin/bash
set -e

to_absolute_path() {
    local path="$1"
    if [[ "$path" != /* ]]; then
        path="$PWD/$path"
    fi
    echo "$(cd "$(dirname "$path")" && pwd)/$(basename "$path")"
}

TARGET_DECODE_PATH=$(to_absolute_path "$1")

cd "$(dirname "$0")"

node ../index.js -d "$TARGET_DECODE_PATH"