import assert from 'node:assert/strict';
import {
  getImageRotationWindow,
  getImageRotationRemainingMs,
  IMAGE_ROTATION_WINDOW_MS,
  pickBackdropByPreference,
  pickPosterByPreference,
} from '../lib/tmdbImageSelection';

const image = (file_path: string, language: string | null) => ({ file_path, iso_639_1: language });

const run = () => {
  assert.equal(getImageRotationWindow(IMAGE_ROTATION_WINDOW_MS * 5 + 123), 5);
  assert.equal(getImageRotationRemainingMs(IMAGE_ROTATION_WINDOW_MS * 5 + 123), IMAGE_ROTATION_WINDOW_MS - 123);

  const posters = [
    image('/it-a.jpg', 'it'),
    image('/it-b.jpg', 'it'),
    image('/en.jpg', 'en'),
    image('/clean-1.jpg', null),
    image('/clean-2.jpg', null),
  ];

  // No rotation window: previous static behavior is preserved.
  assert.equal(pickPosterByPreference(posters, 'default', 'it', 'en')?.file_path, '/it-a.jpg');
  assert.equal(pickPosterByPreference(posters, 'clean', 'it', 'en')?.file_path, '/clean-1.jpg');

  // Clean rotates across textless artwork only, one step per day window.
  assert.equal(pickPosterByPreference(posters, 'clean', 'it', 'en', null, 0)?.file_path, '/clean-1.jpg');
  assert.equal(pickPosterByPreference(posters, 'clean', 'it', 'en', null, 1)?.file_path, '/clean-2.jpg');
  assert.equal(pickPosterByPreference(posters, 'clean', 'it', 'en', null, 2)?.file_path, '/clean-1.jpg');

  // Default rotates but never leaves the preferred language.
  assert.equal(pickPosterByPreference(posters, 'default', 'it', 'en', null, 0)?.file_path, '/it-a.jpg');
  assert.equal(pickPosterByPreference(posters, 'default', 'it', 'en', null, 1)?.file_path, '/it-b.jpg');
  assert.equal(pickPosterByPreference(posters, 'default', 'it', 'en', null, 2)?.file_path, '/it-a.jpg');

  // Alternative keeps language matching and excludes the default/clean picks.
  assert.equal(pickPosterByPreference(posters, 'alternative', 'it', 'en', null, 0)?.file_path, '/it-b.jpg');
  assert.equal(pickPosterByPreference(posters, 'alternative', 'it', 'en', null, 7)?.file_path, '/it-b.jpg');

  // Default falls back to the fallback language pool when preferred is missing.
  const englishOnly = [image('/it.jpg', 'it'), image('/en-a.jpg', 'en'), image('/en-b.jpg', 'en')];
  assert.equal(pickPosterByPreference(englishOnly, 'default', 'it', 'en', null, 0)?.file_path, '/it.jpg');
  assert.equal(pickPosterByPreference(englishOnly, 'default', 'fr', 'en', null, 0)?.file_path, '/en-a.jpg');
  assert.equal(pickPosterByPreference(englishOnly, 'default', 'fr', 'en', null, 1)?.file_path, '/en-b.jpg');

  // Backdrop-as-poster uses the same rotation rules.
  const backdrops = [image('/bd-it.jpg', 'it'), image('/bd-clean-1.jpg', null), image('/bd-clean-2.jpg', null)];
  assert.equal(pickBackdropByPreference(backdrops, 'clean', 'it', 'en', null, 3)?.file_path, '/bd-clean-2.jpg');
  assert.equal(pickBackdropByPreference(backdrops, 'default', 'it', 'en', null, 3)?.file_path, '/bd-it.jpg');

  console.log('poster rotation tests: ok');
};

run();
