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

## Quickstart Example

```bash
# (Optional) Install Python dependencies
pip install -r ../common/requirements.txt

# (Optional) Install Node dependencies
npm install axios dotenv

# Generate a cover image using the Python script
python pipeline_prototype/prompt_to_image.py --prompt_file prompt_templates/cover_image_prompts.json --output assets/cover1.jpg

# Generate a cover image using the Node script
node pipeline_prototype/generate_image.js --prompt "See prompt_templates/cover_image_prompts.md"

# Create a caption
python pipeline_prototype/caption_generator.py --prompt "fun, engaging caption"
```

Example image output will be written to `assets/cover1.jpg`. The caption script prints to stdout, so redirect if you want to save it to a file.

## Troubleshooting

* **Missing dependencies** – Ensure Python packages from `../common/requirements.txt` are installed and Node packages such as `axios` and `dotenv` are available.
* **API errors** – Confirm that `IMAGE_ENGINE_API_KEY`, `VIDEO_ENGINE_API_KEY`, and `OPENAI_API_KEY` are exported in your environment.
* **File paths** – Verify the prompt and output paths exist and are writable.
