# Content Generation Pipeline

This document describes how the prototype scripts work together to create images, video clips, and captions.

## Workflow Steps

1. **Select a Prompt**
   - Choose or craft a prompt in `prompt_templates/`.

2. **Generate an Image**
   - Run `node pipeline_prototype/generate_image.js`.
   - Requires `IMAGE_ENGINE_API_KEY` for the external image engine API.
   - Output saved to `assets/output_cover.png`.

3. **Generate a Video**
   - Run `bash pipeline_prototype/generate_video.sh`.
   - If integrating with an external service, set `VIDEO_ENGINE_API_KEY`.
   - Demo script uses FFmpeg to create `assets/output_teaser.mp4`.

4. **Create a Caption**
   - Import `generate_caption` from `pipeline_prototype/caption_generator.py` or run the script directly.
   - Uses `OPENAI_API_KEY` when wired to a live LLM.

## Environment Variables

Add these variables to `common/env.example` and load them before running the scripts:

```
IMAGE_ENGINE_API_KEY=your_image_api_key
VIDEO_ENGINE_API_KEY=your_video_api_key
OPENAI_API_KEY=your_openai_key
```

These values enable API calls for image, video, and caption generation.
