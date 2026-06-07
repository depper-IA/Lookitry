import io
import torch
import numpy as np
import cv2
from PIL import Image
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.responses import Response
from mobile_sam import sam_model_registry, SamPredictor
import os
import requests
import base64

app = FastAPI(title="Lookitry SAM Local Service")

# Model configuration
MODEL_TYPE = "vit_t"
CHECKPOINT_PATH = "mobile_sam.pt"
DEVICE = "cpu"

# Download weights if not present
if not os.path.exists(CHECKPOINT_PATH):
    print("Downloading MobileSAM weights...")
    url = "https://raw.githubusercontent.com/ChaoningZhang/MobileSAM/master/weights/mobile_sam.pt"
    response = requests.get(url)
    with open(CHECKPOINT_PATH, "wb") as f:
        f.write(response.content)
    print("Done.")

# Initialize model
mobile_sam = sam_model_registry[MODEL_TYPE](checkpoint=CHECKPOINT_PATH)
mobile_sam.to(device=DEVICE)
mobile_sam.eval()
predictor = SamPredictor(mobile_sam)

class PredictRequest(BaseModel):
    image: str # base64

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/predict")
async def predict(request: PredictRequest):
    try:
        # Decode base64
        image_data = base64.b64decode(request.image)
        image = Image.open(io.BytesIO(image_data)).convert("RGB")
        input_image = np.array(image)
        
        # Set image in predictor
        predictor.set_image(input_image)
        
        h, w, _ = input_image.shape
        
        # Multiple points distributed horizontally and vertically to capture the entire human figure
        # This handles split-color clothing (e.g. half-plaid, half-white shirts) and off-center poses
        input_point = np.array([
            [w // 2, int(h * 0.15)],       # Head / Face center
            [int(w * 0.4), int(h * 0.35)], # Upper torso / Left chest
            [w // 2, int(h * 0.35)],       # Upper torso / Center chest
            [int(w * 0.6), int(h * 0.35)], # Upper torso / Right chest
            [int(w * 0.4), int(h * 0.55)], # Mid torso / Left waist
            [w // 2, int(h * 0.55)],       # Mid torso / Center waist
            [int(w * 0.6), int(h * 0.55)], # Mid torso / Right waist
            [w // 2, int(h * 0.75)],       # Lower body / Center legs
        ])
        input_label = np.array([1, 1, 1, 1, 1, 1, 1, 1])
        
        masks, scores, logits = predictor.predict(
            point_coords=input_point,
            point_labels=input_label,
            multimask_output=True,
        )
        
        mask = masks[np.argmax(scores)]
        
        # Create mask image (255 where masked, 0 elsewhere)
        # To match base64 expectations of vertex service (which expects PNG base64 usually)
        mask_image = Image.fromarray((mask * 255).astype(np.uint8))
        
        buffered = io.BytesIO()
        mask_image.save(buffered, format="PNG")
        mask_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
        
        # Return format matching Vertex AI response
        return {
            "predictions": [
                {
                    "maskBase64": mask_base64
                }
            ]
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
