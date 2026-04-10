# IDM-VTON Serverless Worker para RunPod Flash
# Deploy con: flash run
# Test: python gpu_worker.py

from runpod_flash import Endpoint, GpuType


@Endpoint(
    name="idm-vton-tryon",
    gpu=GpuType.NVIDIA_GEFORCE_RTX_4090,
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
    ],
    min_duration_seconds=15,
    max_duration_seconds=300,
)
def idm_vton_worker(input_data: dict) -> dict:
    """
    IDM-VTON Virtual Try-On worker.

    Args:
        input_data: dict con:
            - person_image: base64 encoded selfie
            - garment_image: base64 encoded imagen de ropa
            - garment_description: str (opcional)
            - seed: int (opcional, default -1)

    Returns:
        dict con:
            - success: bool
            - output_image: base64 encoded resultado
            - error: str (si hay error)
    """
    import base64
    import io
    import os
    import time

    start_time = time.time()

    person_base64 = input_data.get("person_image")
    garment_base64 = input_data.get("garment_image")
    garment_description = input_data.get("garment_description", "clothing item")
    seed = input_data.get("seed", -1)

    if not person_base64 or not garment_base64:
        return {"success": False, "error": "Faltan person_image o garment_image"}

    try:
        from PIL import Image
        import torch
        from diffusers import StableDiffusionXLInpaintPipeline

        # Decodificar imagenes
        person_image = Image.open(io.BytesIO(base64.b64decode(person_base64))).convert(
            "RGB"
        )
        garment_image = Image.open(
            io.BytesIO(base64.b64decode(garment_base64))
        ).convert("RGB")

        # Resize para el modelo
        person_image = person_image.resize((768, 1024), Image.LANCZOS)
        garment_image = garment_image.resize((768, 1024), Image.LANCZOS)

        # Cargar modelo (cache en /tmp)
        cache_dir = "/tmp/idm-vton-model"
        model_loaded = os.path.exists(os.path.join(cache_dir, "loaded.txt"))

        if not model_loaded:
            print("Primera vez: descargando modelo IDM-VTON (~10GB)...")
            os.makedirs(cache_dir, exist_ok=True)

            pipe = StableDiffusionXLInpaintPipeline.from_pretrained(
                "yisol/IDM-VTON",
                torch_dtype=torch.float16,
                safety_checker=None,
            )
            pipe = pipe.to("cuda")

            with open(os.path.join(cache_dir, "loaded.txt"), "w") as f:
                f.write("loaded")

            print(f"Modelo cargado en {time.time() - start_time:.1f}s")
        else:
            print("Usando modelo en cache...")
            pipe = StableDiffusionXLInpaintPipeline.from_pretrained(
                "yisol/IDM-VTON",
                torch_dtype=torch.float16,
                safety_checker=None,
            )
            pipe = pipe.to("cuda")

        # Generar
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

        # Convertir a base64
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


if __name__ == "__main__":
    import asyncio

    # Test local (solo verifica que el codigo corre, no tiene GPU)
    test_payload = {
        "person_image": "",
        "garment_image": "",
        "garment_description": "blue shirt",
        "seed": 42,
    }

    print("Test local - verificando sintaxis...")
    print("Para deployar: flash run")
