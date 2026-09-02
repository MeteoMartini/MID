from __future__ import annotations

import hmac
import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from .decoder import DecoderError, REQUEST_SCHEMA, decode_request, eccodes_available

MAX_REQUEST_BYTES = 2 * 1024 * 1024


def _port() -> int:
    try:
        return max(1, min(65535, int(os.environ.get("PORT", os.environ.get("MID_KNMI_DECODER_PORT", "8080")))))
    except ValueError:
        return 8080


def _configured_token() -> str:
    return str(os.environ.get("MID_KNMI_HARMONIE_EPS_POINT_TOKEN", "")).strip()


class Handler(BaseHTTPRequestHandler):
    server_version = "MID-KNMI-EPS-Decoder/1"

    def log_message(self, fmt: str, *args) -> None:
        # Never log request bodies, signed URLs or Authorization headers.
        print("MID-KNMI-EPS-Decoder", self.command, self.path.split("?", 1)[0], args[1] if len(args) > 1 else "")

    def _json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        if self.path.split("?", 1)[0] not in ("/", "/health"):
            self._json(404, {"error": "not found"})
            return
        self._json(200 if eccodes_available() else 503, {
            "ok": eccodes_available(),
            "schema": REQUEST_SCHEMA,
            "eccodes": eccodes_available(),
            "authConfigured": bool(_configured_token()),
            "signedUrlLogging": False,
        })

    def do_POST(self) -> None:
        if self.path.split("?", 1)[0] not in ("/", "/knmi-harmonie-eps"):
            self._json(404, {"error": "not found"})
            return
        token = _configured_token()
        if token:
            supplied = self.headers.get("Authorization", "")
            expected = f"Bearer {token}"
            if not hmac.compare_digest(supplied, expected):
                self._json(401, {"error": "unauthorized"})
                return
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            length = 0
        if length <= 0 or length > MAX_REQUEST_BYTES:
            self._json(413, {"error": "request body too large or missing"})
            return
        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            result = decode_request(payload)
        except DecoderError as exc:
            self._json(422, {"error": str(exc)})
            return
        except (json.JSONDecodeError, UnicodeDecodeError):
            self._json(400, {"error": "invalid json"})
            return
        except Exception:
            self._json(502, {"error": "KNMI-Punktdekodierung vorübergehend fehlgeschlagen."})
            return
        self._json(200, result)


def main() -> None:
    server = ThreadingHTTPServer(("0.0.0.0", _port()), Handler)
    print(f"MID KNMI EPS decoder listening on :{_port()}")
    server.serve_forever()


if __name__ == "__main__":
    main()
