import os


def test_scheduler_mockup_exists():
    path = '03_scheduling_automation/scheduler_ui_mockup.fig'
    assert os.path.exists(path)


def test_media_uploader_component_exists():
    path = (
        '03_scheduling_automation/browser_automation_service/'
        'frontend/src/components/MediaUploader.jsx'
    )
    assert os.path.exists(path)
