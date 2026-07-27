#!/usr/bin/env python3
"""Post the next queued pin to Pinterest. Runs on a schedule via GitHub Actions.
State (which pin is next) lives in scripts/state.json and is committed back by the workflow.
Secrets required: PINTEREST_APP_ID, PINTEREST_APP_SECRET, PINTEREST_REFRESH_TOKEN, PINTEREST_BOARD_ID
"""
import json, os, sys, base64, urllib.request, urllib.parse

API = "https://api.pinterest.com/v5"

def refresh_access_token():
    app_id = os.environ["PINTEREST_APP_ID"]
    secret = os.environ["PINTEREST_APP_SECRET"]
    refresh = os.environ["PINTEREST_REFRESH_TOKEN"]
    basic = base64.b64encode(f"{app_id}:{secret}".encode()).decode()
    data = urllib.parse.urlencode({
        "grant_type": "refresh_token",
        "refresh_token": refresh,
    }).encode()
    req = urllib.request.Request(f"{API}/oauth/token", data=data, method="POST",
        headers={"Authorization": f"Basic {basic}",
                 "Content-Type": "application/x-www-form-urlencoded"})
    with urllib.request.urlopen(req) as r:
        tok = json.load(r)
    return tok["access_token"]

def post_pin(token, pin, board_id):
    body = json.dumps({
        "board_id": board_id,
        "title": pin["title"][:100],
        "description": pin["description"][:800],
        "link": pin["link"],
        "alt_text": pin.get("alt_text", "")[:500],
        "media_source": {"source_type": "image_url", "url": pin["image"]},
    }).encode()
    req = urllib.request.Request(f"{API}/pins", data=body, method="POST",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req) as r:
        return json.load(r)

def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    with open(os.path.join(root, "pins.json")) as f:
        pins = json.load(f)["pins"]
    state_path = os.path.join(root, "scripts", "state.json")
    state = {"next": 0}
    if os.path.exists(state_path):
        with open(state_path) as f:
            state = json.load(f)
    idx = state.get("next", 0) % len(pins)
    pin = pins[idx]
    print(f"Posting pin {idx + 1}/{len(pins)}: {pin['title']}")
    token = refresh_access_token()
    result = post_pin(token, pin, os.environ["PINTEREST_BOARD_ID"])
    print("Created pin id:", result.get("id"))
    state["next"] = idx + 1
    with open(state_path, "w") as f:
        json.dump(state, f)

if __name__ == "__main__":
    try:
        main()
    except urllib.error.HTTPError as e:
        print("Pinterest API error:", e.code, e.read().decode()[:500])
        sys.exit(1)
