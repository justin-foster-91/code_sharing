BEGIN;

TRUNCATE
  users,
  instances,
  follows,
  permissions
  RESTART IDENTITY CASCADE;

INSERT INTO users (username, password)
VALUES
  ('dunder', '$2a$12$lHK6LVpc15/ZROZcKU00QeiD.RyYq5dVlV/9m4kKYbGibkRc5l4Ne'),
  ('testUser1', 'password'),
  ('testUser2', 'password'),
  ('testUser3', 'password');

-- Create ship_parts that references tier, frame, engine, power core, etc.
INSERT INTO instances (user_id, name, description, text, is_public, is_deleted, locked)
VALUES
  (1, 'Apple Storm', 'Swirling storm of apples', '(displayln "Hello")', true, false, false),
  (1, 'Cozy Cabin', 'Summons a log cabin', '(displayln "Hello")', true, false, false),
  (1, 'Deleted & Public', 'Test', '(displayln "Hello")', true, true, false),
  (1, 'Deleted, not public', 'Test', '(displayln "Hello")', false, true, false),
  (1, 'Neither deleted nor public', 'Test', '(displayln "Hello")', false, false, false),
  (1, 'Safely Locked!', 'This instance is set as locked by default', '(displayln "Go Away")', true, false, true),
  (2, 'User 2 Code Snippit', 'Demo spell from a non-default user', '(displayln "Hello")', true, false, false),
  (2, 'User 2 private code', 'This should be hidden from other users', '(displayln "Hello")', false, false, false),
  (3, 'Wind Blast', 'Shoot a blast of wind', '(displayln "Hello")', true, false, false),
  (3, 'Frost Fall', 'Makes it snow', '(displayln "Hello")', true, false, false);

INSERT INTO follows (user_id, follower_id)
VALUES
  (1, 2),
  (1, 3),
  (1, 4);

INSERT INTO permissions (type)
VALUES
  ('read'),
  ('readwrite');

COMMIT;
