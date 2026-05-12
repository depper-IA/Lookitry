"""
FastAPI server para IDM-VTON en RunPod
Este archivo se copia a /app/main.py en el container
"""

import base64
import io
import torch
from PIL import Image
from typing import Optional
from pydantic import BaseModel

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse

# IDM-VTON imports
# Nota: Ajustar estos imports segun la estructura del modelo
try:
    from diffusers import StableDiffusionXLInpaintPipeline
    from diffusers import DDPMScheduler
    from transformers import (
        CLIPImageProcessor,
        CLIPVisionModelWithProjection,
        CLIPTextModel,
        CLIPTextModelWithProjection,
        AutoTokenizer,
        AutoProcessor,
    )
    from diffusers import AutoencoderKL
    import numpy as np
    from utils_mask import get_mask_location
    from torchvision import transforms
    from torchvision.transforms.functional import to_pil_image

    IDM_AVAILABLE = True
except ImportError as e:
    print(f"Warning: IDM-VTON imports not available: {e}")
    IDM_AVAILABLE = False

# ============== FastAPI App ==============

app = FastAPI(
    title="IDM-VTON API",
    description="Virtual Try-On API usando IDM-VTON (Intel)",
    version="1.0.0",
)

# Modelo global (se carga una vez)
pipe = None
device = "cuda" if torch.cuda.is_available() else "cpu"


class TryOnRequest(BaseModel):
    person_image: str  # base64 encoded
    garment_image: str  # base64 encoded
    garment_description: str = ""
    seed: int = -1
    num_inference_steps: int = 30


class TryOnResponse(BaseModel):
    output_image: str  # base64 encoded
    mask_image: Optional[str] = None
    success: bool = True
    error: Optional[str] = None


def load_model():
    """
    Cargar el modelo IDM-VTON.
    En un escenario real, esto descargaria el modelo de HuggingFace
    o lo tendria pre-cargado en el container.
    """
    global pipe, IDM_AVAILABLE

    if not IDM_AVAILABLE:
        print("IDM-VTON not available, using mock mode")
        return None

    try:
        # En produccion, cargar el modelo real:
        # base_path = 'yisol/IDM-VTON'
        # pipe = StableDiffusionXLInpaintPipeline.from_pretrained(...)

        # Por ahora, marcamos como cargado
        print(f"IDM-VTON model would be loaded from: yisol/IDM-VTON")
        print(f"Device: {device}")
        return True
    except Exception as e:
        print(f"Error loading model: {e}")
        return None


@app.on_event("startup")
async def startup_event():
    """Cargar modelo al iniciar el server"""
    global pipe
    load_model()


def process_image(base64_string: str) -> Image.Image:
    """Convertir base64 a PIL Image"""
    try:
        image_data = base64.b64decode(base64_string)
        image = Image.open(io.BytesIO(image_data))
        # Convertir a RGB si es necesario
        if image.mode != "RGB":
            image = image.convert("RGB")
        return image
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image data: {str(e)}")


def image_to_base64(image: Image.Image) -> str:
    """Convertir PIL Image a base64"""
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=95)
    buffer.seek(0)
    return base64.b64encode(buffer.read()).decode("utf-8")


def run_idm_vton(
    person: Image.Image, garment: Image.Image, description: str, seed: int
):
    """
    Ejecutar el pipeline de IDM-VTON.

    En produccion, aqui iria la logica real del modelo.
    Por ahora retornamos un mock para testing.
    """
    global IDM_AVAILABLE

    if not IDM_AVAILABLE:
        # Modo mock para testing sin el modelo real
        # En realidad, aqui se llamaria al pipeline de IDM-VTON
        # output_image = pipe.tryon(person, garment, description, seed)
        return person  # Retornar la persona original como mock

    # Logica real de IDM-VTON
    # 1. Preprocesar imagenes
    # 2. Crear mascara para la zona de ropa
    # 3. Ejecutar inpainting con SDXL
    # 4. Recombinar con la imagen original

    # Ejemplo simplificado:
    # garment_resized = garment.resize((768, 1024))
    # person_resized = person.resize((768, 1024))
    #
    # # Crear mascara (esto es simplificado)
    # mask = create_mask(person_resized, 'upper_body')
    #
    # # Ejecutar pipeline
    # with torch.no_grad():
    #     output = pipe(
    #         prompt=description,
    #         image=person_resized,
    #         mask_image=mask,
    #         cloth=garment_resized,
    #         num_inference_steps=30,
    #         strength=1.0,
    #         guidance_scale=2.0
    #     )[0]

    # Por ahora retornar la imagen original
    return person


@app.post("/tryon", response_model=TryOnResponse)
async def tryon(request: TryOnRequest):
    """
    Endpoint principal para virtual try-on.

    Args:
        request: TryOnRequest con person_image y garment_image en base64

    Returns:
        TryOnResponse con output_image en base64
    """
    try:
        # Decodificar imagenes
        person = process_image(request.person_image)
        garment = process_image(request.garment_image)

        # Redimensionar para el modelo (IDM-VTON usa 768x1024)
        person = person.resize((768, 1024), Image.LANCZOS)
        garment = garment.resize((768, 1024), Image.LANCZOS)

        # Ejecutar IDM-VTON
        output = run_idm_vton(
            person, garment, request.garment_description, request.seed
        )

        # Convertir resultado a base64
        output_base64 = image_to_base64(output)

        return TryOnResponse(
            output_image=output_base64, mask_image=None, success=True, error=None
        )

    except HTTPException:
        raise
    except Exception as e:
        return TryOnResponse(output_image="", success=False, error=str(e))


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": pipe is not None if IDM_AVAILABLE else "mock_mode",
        "device": device,
        "cuda_available": torch.cuda.is_available(),
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "IDM-VTON API",
        "version": "1.0.0",
        "description": "Virtual Try-On using IDM-VTON (Intel)",
        "endpoints": {
            "POST /tryon": "Ejecutar virtual try-on",
            "GET /health": "Health check",
        },
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
