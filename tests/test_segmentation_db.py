import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = ROOT / '05_crm_subscriber_management'
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from crm.db import init_db, get_session, get_segment_rules
from crm.models import SegmentRule
from sqlmodel import select


def test_segment_rules_loaded(tmp_path, monkeypatch):
    monkeypatch.setenv('DATABASE_URL', f'sqlite:///{tmp_path}/test.db')
    init_db()
    rules = get_segment_rules()
    with get_session() as session:
        db_rules = session.exec(select(SegmentRule)).all()
    assert len(db_rules) == len(rules)
