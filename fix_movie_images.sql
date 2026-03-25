-- ============================================================
-- CineSpark: Fix Movie Poster & Backdrop URLs
-- Run this in phpMyAdmin → cinespark database → SQL tab
-- ============================================================

-- Snow White (2025)
UPDATE movies
SET
  poster_url   = 'https://media.themoviedb.org/t/p/w500/xWWg47tTfparvjK0WJNX4xL8lW2.jpg',
  backdrop_url = 'https://image.tmdb.org/t/p/w1280/tyfO9jHgkhypUFizRVYD0bytPjP.jpg'
WHERE title LIKE '%Snow White%';

-- A Minecraft Movie (2025)
UPDATE movies
SET
  poster_url   = 'https://media.themoviedb.org/t/p/w500/yFHHfHcUgGAxziP1C3lLt0q2T4s.jpg',
  backdrop_url = 'https://image.tmdb.org/t/p/w1280/2Nti3gYAX513wvhp8IiLL6ZDyOm.jpg'
WHERE title LIKE '%Minecraft%';

-- Moana 2 (2024)
UPDATE movies
SET
  poster_url   = 'https://media.themoviedb.org/t/p/w500/aLVkiINlIeCkcZIzb7XHzPYgO6L.jpg',
  backdrop_url = 'https://image.tmdb.org/t/p/w1280/zo8CIjJ2nfNOevqNajwMRO6Hwka.jpg'
WHERE title LIKE '%Moana%';

-- Captain America: Brave New World (2025)
UPDATE movies
SET
  poster_url   = 'https://media.themoviedb.org/t/p/w500/pzIddUEMWhWzfvLI3TwxUG2wGoi.jpg',
  backdrop_url = 'https://image.tmdb.org/t/p/w1280/8eifdha9GQeZAkexgtD45546XKx.jpg'
WHERE title LIKE '%Captain America%' OR title LIKE '%Brave New World%';

-- ── Verify results ──────────────────────────────────────────
SELECT id, title, poster_url, backdrop_url FROM movies ORDER BY id;
