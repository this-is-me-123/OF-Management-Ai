# Content Generation

This module manages AI-driven image/video enhancements and caption creation.

## Structure
- `prompt_templates/` - Library of prompt templates for different asset types.
- `pipeline_prototype/` - Proof-of-concept scripts to generate content.
- `pipeline_spec.md` - Overview of the generation workflow and required env vars.
- `assets/` - Sample output files to verify pipeline.

## Getting Started
1. Choose a prompt from `prompt_templates/`.
2. Run `node pipeline_prototype/generate_image.js` to generate an image.
3. Run `python pipeline_prototype/caption_generator.py` to create a caption.
4. Verify output files in `assets/`.

Environment variables such as `IMAGE_ENGINE_API_KEY`, `VIDEO_ENGINE_API_KEY`,
and `OPENAI_API_KEY` must be set (see `pipeline_spec.md`).
