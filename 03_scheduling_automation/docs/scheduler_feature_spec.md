# Scheduler UI Feature Spec

This document outlines the major components of the scheduler interface. Detailed layouts can be found in [scheduler_ux_templates.md](scheduler_ux_templates.md).

## Core Features
- Media upload with drag-and-drop support
- Caption input with character count
- Time scheduling with timezone awareness
- Cross-platform posting (OnlyFans, Hootsuite)

## Workflow Details

### 1. Date/Time Selection
- Users begin on the **Schedule a Post** screen showing a calendar view.
- Selecting a date opens a time picker with hour, minute, and timezone fields.
- Shortcuts include *Today*, *Next Available*, and *Same Time Tomorrow*.
- Dots indicate existing scheduled posts; hovering reveals a quick preview.

### 2. Media Attachment
- In the Post Editor, the left pane is a drop zone for uploading images or video.
- Thumbnails appear in a horizontal carousel; clicking one opens basic crop/trim controls.
- Each file shows an upload progress bar and a checkmark when complete.

### 3. Caption & Hashtag Editing
- The right pane contains a text area with live character count.
- A button below fetches AI-generated caption and hashtag suggestions.
- Suggested hashtags are presented with checkboxes; selected tags update a total count.

### 4. Final Actions
- Buttons at the bottom allow **Save as Draft** or **Schedule**.
- A confirmation dialog summarizes the date/time, attached media, and caption before finalizing.
- Errors from the API are displayed inline with guidance on next steps.
