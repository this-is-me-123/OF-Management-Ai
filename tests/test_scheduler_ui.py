import os


def test_scheduler_mockup_exists():
    path = '03_scheduling_automation/scheduler_ui_mockup.fig'
    assert os.path.exists(path)
