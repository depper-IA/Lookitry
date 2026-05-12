"""
RunPod Flash Deployment Script para IDM-VTON
用法: python runpod_deploy.py
"""

import runpod
from runpod_flash import Endpoint, GpuType

# ============================================
# CONFIGURACION
# ============================================

RUNPOD_API_KEY = "TU_API_KEY_AQUI"
MODEL_NAME = "idm-vton-tryon"
GPU = GpuType.NVIDIA_GEFORCE_RTX_4090

# ============================================
# ENDPOINT
# ============================================


@Endpoint(
    name=MODEL_NAME,
    gpu=GPU,
    dependencies=[
        "torch",
        "torchvision",
        "diffusers==0.20.2",
        "transformers==4.33.2",
        "accelerate==0.24.1",
        "scipy==1.10.1",
        "opencv-python==4.7.0.72",
        "Pillow",
        "numpy",
        "albumentations",
        "matplotlib",
        "xformers==0.0.19",
        "triton==2.0.0",
        "open-clip-torch==2.19.0",
    ],
    min_duration_seconds=15,
    max_duration_seconds=300,
)
def idm_vton_endpoint(data):
    import base64
    import io
    import torch
    from PIL import Image
    from diffusers import StableDiffusionXLInpaintPipeline
    import os
    import time

    start_time = time.time()

    person_base64 = data.get("person_image")
    garment_base64 = data.get("garment_image")
    garment_description = data.get("garment_description", "clothing item")
    seed = data.get("seed", -1)

    if not person_base64 or not garment_base64:
        return {"success": False, "error": "Faltan imagenes"}

    try:
        person_image = Image.open(io.BytesIO(base64.b64decode(person_base64))).convert(
            "RGB"
        )
        garment_image = Image.open(
            io.BytesIO(base64.b64decode(garment_base64))
        ).convert("RGB")

        person_image = person_image.resize((768, 1024), Image.LANCZOS)
        garment_image = garment_image.resize((768, 1024), Image.LANCZOS)

        model_cache_dir = "/tmp/idm-vton-model"
        model_loaded = os.path.exists(os.path.join(model_cache_dir, "model_loaded.txt"))

        if not model_loaded:
            print("Descargando modelo IDM-VTON...")
            os.makedirs(model_cache_dir, exist_ok=True)

            base_path = "yisol/IDM-VTON"
            pipe = StableDiffusionXLInpaintPipeline.from_pretrained(
                base_path,
                torch_dtype=torch.float16,
                safety_checker=None,
            )
            pipe = pipe.to("cuda")

            with open(os.path.join(model_cache_dir, "model_loaded.txt"), "w") as f:
                f.write("loaded")
        else:
            base_path = "yisol/IDM-VTON"
            pipe = StableDiffusionXLInpaintPipeline.from_pretrained(
                base_path,
                torch_dtype=torch.float16,
                safety_checker=None,
            )
            pipe = pipe.to("cuda")

        prompt = f"model is wearing {garment_description}"

        generator = None
        if seed >= 0:
            generator = torch.Generator("cuda").manual_seed(seed)

        with torch.no_grad():
            output_image = pipe(
                prompt=prompt,
                image=person_image,
                mask_image=None,
                cloth=garment_image,
                num_inference_steps=30,
                strength=1.0,
                guidance_scale=2.0,
                generator=generator,
            ).images[0]

        output_buffer = io.BytesIO()
        output_image.save(output_buffer, format="JPEG", quality=95)
        output_base64 = base64.b64encode(output_buffer.getvalue()).decode("utf-8")

        elapsed = time.time() - start_time
        print(f"Completado en {elapsed:.1f}s")

        return {
            "success": True,
            "output_image": output_base64,
            "elapsed_seconds": elapsed,
        }

    except Exception as e:
        import traceback

        traceback.print_exc()
        return {"success": False, "error": str(e)}


async def main():
    import asyncio

    runpod.api_key = RUNPOD_API_KEY

    print("=" * 50)
    print("DEPLOYING IDM-VTON to RunPod Flash")
    print("=" * 50)

    endpoint = runpod.deploy(idm_vton_endpoint)

    print("=" * 50)
    print("DEPLOY SUCCESS!")
    print("=" * 50)
    print(f"Endpoint URL: {endpoint.url}")
    print(f"Endpoint ID: {endpoint.id}")
    print()
    print("Guarda estos valores:")
    print(f"  RUNPOD_API_URL={endpoint.url}")
    print(f"  RUNPOD_API_KEY={RUNPOD_API_KEY}")


if __name__ == "__main__":
    asyncio.run(main())
