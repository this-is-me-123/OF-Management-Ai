import unittest
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CAPTION_PATH = ROOT / '04_content_generation' / 'pipeline_prototype'
if str(CAPTION_PATH) not in sys.path:
    sys.path.insert(0, str(CAPTION_PATH))

from caption_generator import generate_caption

class TestCaptionGenerator(unittest.TestCase):
    def test_generate_caption_includes_context(self):
        result = generate_caption('beach day')
        self.assertIn('beach day', result)
        self.assertTrue(result.startswith('Serving looks'))

if __name__ == '__main__':
    unittest.main()
