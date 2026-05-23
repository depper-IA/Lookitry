#!/usr/bin/env python3
"""
Lookitry — Vertex AI Imagen 3 generator
Uso: python3 scripts/generate_image.py "prompt" --out frontend/public/images/output.webp

Rutas --out: relativas a la raíz del proyecto (donde está este script/../)
             o absolutas. El directorio se crea automáticamente.

Requiere: pip install google-auth requests pillow
Key:      backend/secrets/vertex-key.json
"""

import argparse
import base64
import sys
from pathlib import Path
import io

import requests
import google.auth.transport.requests
from google.oauth2 import service_account
from PIL import Image

PROJECT_ROOT = Path(__file__).resolve().parent.parent
KEY_FILE = PROJECT_ROOT / "backend/secrets/vertex-key.json"
PROJECT_ID = "gen-lang-client-0591001769"
LOCATION = "us-central1"
MODEL = "imagen-3.0-generate-002"

ENDPOINT = (
    f"https://{LOCATION}-aiplatform.googleapis.com/v1"
    f"/projects/{PROJECT_ID}/locations/{LOCATION}"
    f"/publishers/google/models/{MODEL}:predict"
)

# Aspect ratio → resolución aproximada generada por Imagen 3
ASPECT_INFO = {
    "1:1":  "1024×1024  — avatar, card cuadrada",
    "16:9": "1408×768   — hero banner, video thumbnail",
    "9:16": "768×1408   — mobile, story, vertical card",
    "4:3":  "1280×960   — megamenu card, blog cover",
    "3:4":  "960×1280   — product card, póster",
}

BRAND_SUFFIX = (
    ", professional product photography, clean lighting, "
    "warm tones, high quality, e-commerce ready"
)


def get_token() -> str:
    creds = service_account.Credentials.from_service_account_file(
        str(KEY_FILE),
        scopes=["https://www.googleapis.com/auth/cloud-platform"],
    )
    auth_req = google.auth.transport.requests.Request()
    creds.refresh(auth_req)
    return creds.token


def resolve_out(out_str: str) -> Path:
    p = Path(out_str)
    if not p.is_absolute():
        p = PROJECT_ROOT / p
    return p


def generate(
    prompt: str,
    out_path: Path,
    count: int = 1,
    aspect: str = "1:1",
    brand_suffix: str = BRAND_SUFFIX,
    quality: int = 90,
) -> list[Path]:
    token = get_token()

    payload = {
        "instances": [{"prompt": prompt + brand_suffix}],
        "parameters": {
            "sampleCount": count,
            "aspectRatio": aspect,
            "outputMimeType": "image/png",
            "safetyFilterLevel": "block_some",
            "personGeneration": "allow_adult",
        },
    }

    resp = requests.post(
        ENDPOINT,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=120,
    )

    if not resp.ok:
        print(f"Error {resp.status_code}: {resp.text}", file=sys.stderr)
        sys.exit(1)

    predictions = resp.json().get("predictions", [])
    saved: list[Path] = []

    out_path.parent.mkdir(parents=True, exist_ok=True)

    for i, pred in enumerate(predictions):
        img_b64 = pred.get("bytesBase64Encoded")
        if not img_b64:
            continue

        img_bytes = base64.b64decode(img_b64)
        suffix = f"_{i}" if len(predictions) > 1 else ""
        final_path = out_path.with_stem(out_path.stem + suffix)

        if final_path.suffix.lower() in (".webp", ".jpg", ".jpeg"):
            img = Image.open(io.BytesIO(img_bytes))
            img.save(str(final_path), "WEBP", quality=quality)
        else:
            final_path.write_bytes(img_bytes)

        saved.append(final_path)
        try:
            print(f"Guardado: {final_path.relative_to(PROJECT_ROOT)}")
        except ValueError:
            print(f"Guardado: {final_path}")

    return saved


def main():
    aspect_help = "\n".join(f"  {k}  {v}" for k, v in ASPECT_INFO.items())

    parser = argparse.ArgumentParser(
        description="Genera imágenes con Vertex AI Imagen 3",
        formatter_class=argparse.RawTextHelpFormatter,
    )
    parser.add_argument("prompt", help="Descripción de la imagen")
    parser.add_argument(
        "--out",
        required=True,
        help="Ruta de salida relativa al proyecto o absoluta\n"
             "Ej: frontend/public/megamenu/hero.webp",
    )
    parser.add_argument(
        "--count",
        type=int,
        default=1,
        choices=[1, 2, 3, 4],
        help="Variantes a generar (default: 1)",
    )
    parser.add_argument(
        "--aspect",
        default="1:1",
        choices=list(ASPECT_INFO.keys()),
        help=f"Relación de aspecto → resolución:\n{aspect_help}\n(default: 1:1)",
    )
    parser.add_argument(
        "--quality",
        type=int,
        default=90,
        metavar="1-100",
        help="Calidad WebP/JPEG (default: 90)",
    )
    parser.add_argument(
        "--no-brand",
        action="store_true",
        help="Omitir el sufijo de marca del prompt",
    )

    args = parser.parse_args()

    brand_suffix = "" if args.no_brand else BRAND_SUFFIX
    out_path = resolve_out(args.out)

    print(f"Prompt : {args.prompt!r}")
    if brand_suffix:
        print(f"Sufijo  : {brand_suffix!r}")
    print(f"Aspecto : {args.aspect}  ({ASPECT_INFO[args.aspect].split('—')[0].strip()})")
    print(f"Cantidad: {args.count}")
    try:
        display_out = out_path.relative_to(PROJECT_ROOT)
    except ValueError:
        display_out = out_path
    print(f"Salida  : {display_out}")
    print()

    saved = generate(
        args.prompt,
        out_path,
        count=args.count,
        aspect=args.aspect,
        brand_suffix=brand_suffix,
        quality=args.quality,
    )

    if saved:
        print(f"\n✓ {len(saved)} imagen(es) generada(s)")
    else:
        print("No se generaron imágenes", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
