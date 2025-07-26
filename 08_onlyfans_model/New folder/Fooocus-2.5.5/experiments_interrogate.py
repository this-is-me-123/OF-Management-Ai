import cv2
from extras.interrogate import default_interrogator as default_interrogator_photo
from extras.wd14tagger import default_interrogator as default_interrogator_anime

import os

# Load and validate red_box.jpg
img = cv2.imread(os.path.join(os.path.dirname(__file__), 'test_imgs', 'red_box.jpg'))
if img is None:
    raise FileNotFoundError('red_box.jpg not found')
img = img[:, :, ::-1].copy()
print(default_interrogator_photo(img))

# Load and validate miku.jpg
img = cv2.imread(os.path.join(os.path.dirname(__file__), 'test_imgs', 'miku.jpg'))
if img is None:
    raise FileNotFoundError('miku.jpg not found')
img = img[:, :, ::-1].copy()
print(default_interrogator_anime(img))
