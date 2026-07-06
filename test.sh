#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 || $# -gt 3 ]]; then
	echo "Usage: $0 <prompt.txt> <input.txt> [gemini]"
	echo "Example:"
	echo "  $0 prompt.txt transcript.txt"
	echo "  $0 prompt.txt transcript.txt true"
	exit 1
fi

PROMPT_FILE="$1"
INPUT_FILE="$2"
USE_GEMINI="${3:-false}"

[[ -f "$PROMPT_FILE" ]] || {
	echo "File not found: $PROMPT_FILE"
	exit 1
}
[[ -f "$INPUT_FILE" ]] || {
	echo "File not found: $INPUT_FILE"
	exit 1
}

PROMPT="$(cat "$PROMPT_FILE")

$(cat "$INPUT_FILE")"

strip_markdown() {
	sed -E '
        1s/^```json[[:space:]]*$//
        1s/^```[[:space:]]*$//
        $s/^```$//
    '
}

if [[ "$USE_GEMINI" == "true" ]]; then
	: "${GEMINI_API_KEY:?Please set GEMINI_API_KEY}"

	jq -n \
		--arg text "$PROMPT" \
		'{
            contents: [
                {
                    parts: [
                        {
                            text: $text
                        }
                    ]
                }
            ]
        }' |
		curl -sS \
			-H "Content-Type: application/json" \
			-X POST \
			"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=$GEMINI_API_KEY" \
			-d @- |
		jq -r '.candidates[0].content.parts[0].text' |
		strip_markdown
else
	jq -n \
		--arg model "gemma3:1b" \
		--arg input "$PROMPT" \
		'{
            model: $model,
            input: $input
        }' |
		curl -sS \
			"http://localhost:11434/v1/responses" \
			-H "Content-Type: application/json" \
			-d @- |
		jq -r '
        .output[]
        | select(.type == "message")
        | .content[]
        | select(.type == "output_text")
        | .text
    ' |
		strip_markdown
fi
