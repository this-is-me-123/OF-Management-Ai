#!/usr/bin/env bash

# generate_video.sh
#
# Example script to generate a teaser video using FFmpeg or a video API.

PROMPT=$(head -n 1 ../prompt_templates/teaser_video_prompts.md)
echo "Using prompt: $PROMPT"

# Dummy command; replace with actual video generation logic
echo "Generating video..."
sleep 2
ffmpeg -f lavfi -i testsrc=duration=5:size=1280x720:rate=24 -vf "drawtext=text='Teaser':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2" ../assets/output_teaser.mp4
echo "Generated video saved to assets/output_teaser.mp4"
