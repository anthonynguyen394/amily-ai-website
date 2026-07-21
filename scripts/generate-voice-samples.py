#!/usr/bin/env python3
"""Regenerate the /voice page sample MP3s from data/voice-profiles.json.

Reads the TTS API key from ~/.secrets/.elevenlabs.key (never printed).
Writes public/assets/voice/<slug>.mp3 for each voice in the profile file.
Skips voices whose MP3 already exists unless --force is passed.
"""
import json
import pathlib
import sys
import urllib.request

REPO = pathlib.Path(__file__).resolve().parent.parent
PROFILES = REPO / "scripts" / "voice-profiles.json"
OUT_DIR = REPO / "public" / "assets" / "voice"
KEY_FILE = pathlib.Path.home() / ".secrets" / ".elevenlabs.key"

API = "https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format=mp3_44100_128"


def main() -> None:
    force = "--force" in sys.argv
    key = KEY_FILE.read_text().strip()
    data = json.loads(PROFILES.read_text())
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for voice in data["voices"]:
        out = OUT_DIR / f"{voice['slug']}.mp3"
        if out.exists() and not force:
            print(f"skip  {out.name} (exists)")
            continue
        text = data["sample_script"].replace("{name}", voice["display_name"])
        body = json.dumps({
            "text": text,
            "model_id": data["model_id"],
            "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
        }).encode()
        req = urllib.request.Request(
            API.format(voice_id=voice["voice_id"]),
            data=body,
            headers={"xi-api-key": key, "Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                audio = resp.read()
        except urllib.error.HTTPError as e:
            print(f"FAIL  {voice['slug']}: HTTP {e.code} {e.read().decode(errors='replace')[:200]}")
            continue
        out.write_bytes(audio)
        print(f"wrote {out.name} ({len(audio) // 1024} KB)")


if __name__ == "__main__":
    main()
