#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
	echo "Usage: $0 <file1> <file2>"
	exit 1
fi

FILE1="$1"
FILE2="$2"

if [[ ! -f "$FILE1" ]]; then
	echo "File not found: $FILE1"
	exit 1
fi

if [[ ! -f "$FILE2" ]]; then
	echo "File not found: $FILE2"
	exit 1
fi

PROMPT=$(
	cat <<EOF
$(<"$FILE1")

---

$(<"$FILE2")
EOF
)

jq -n \
	--arg model "gemma3:1b" \
	--arg input "$PROMPT" \
	'{
        model: $model,
        input: $input
    }' |
	curl "http://localhost:11434/v1/responses" \
		-sS \
		-H "Content-Type: application/json" \
		-d @- |
	jq -r '
    .output[]
    | select(.type == "message")
    | .content[]
    | select(.type == "output_text")
    | .text
' |
	sed -E '
    1s/^```json[[:space:]]*$//
    1s/^```[[:space:]]*$//
    $s/^```$//
'
