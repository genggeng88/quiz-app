-- ===== Extensions (optional but handy) =====
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===== Drop old (dev only) =====
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='quizquestion') THEN
    DROP TABLE IF EXISTS quizquestion CASCADE;
  END IF;
END$$;

DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS category CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS choice CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS quizquestion CASCADE;

-- ===== Core tables =====

-- User
CREATE TABLE users (
  user_id       BIGSERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  firstname     TEXT NOT NULL,
  lastname      TEXT NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  is_admin      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Category
CREATE TABLE category (
  category_id BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE
);

-- Question
CREATE TABLE questions (
  question_id BIGSERIAL PRIMARY KEY,
  category_id BIGINT NOT NULL REFERENCES category(category_id) ON DELETE RESTRICT,
  description TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Choice (answers for a question)
CREATE TABLE choice (
  choice_id   BIGSERIAL PRIMARY KEY,
  question_id BIGINT NOT NULL REFERENCES questions(question_id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  is_correct  BOOLEAN NOT NULL DEFAULT FALSE
);

-- Enforce: at most ONE correct choice per question
CREATE UNIQUE INDEX uniq_one_correct_per_question
  ON choice(question_id)
  WHERE is_correct = TRUE;

-- Quiz (a user taking a quiz for a category)
CREATE TABLE quizzes (
  quiz_id      BIGSERIAL PRIMARY KEY,
  user_id      BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  category_id  BIGINT NOT NULL REFERENCES category(category_id) ON DELETE RESTRICT,
  name         TEXT,  -- optional display name
  time_start   TIMESTAMPTZ NOT NULL DEFAULT now(),
  time_end     TIMESTAMPTZ,
  correct_rate FLOAT DEFAULT 0  -- <--- add this line
);

-- QuizQuestion (which questions were asked and what user chose)
CREATE TABLE quizquestion (
  qq_id          BIGSERIAL PRIMARY KEY,
  quiz_id        BIGINT NOT NULL REFERENCES quizzes(quiz_id) ON DELETE CASCADE,
  question_id    BIGINT NOT NULL REFERENCES questions(question_id) ON DELETE RESTRICT,
  user_choice_id BIGINT REFERENCES choice(choice_id) ON DELETE SET NULL
);

-- Prevent duplicate (quiz, question)
CREATE UNIQUE INDEX uq_quiz_question ON quizquestion(quiz_id, question_id);

-- Contact
CREATE TABLE contacts (
  contact_id BIGSERIAL PRIMARY KEY,
  subject    TEXT NOT NULL,
  message    TEXT NOT NULL,
  email      TEXT NOT NULL,
  time       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== Helpful indexes =====
CREATE INDEX idx_question_category ON questions(category_id) WHERE is_active;
CREATE INDEX idx_choice_question ON choice(question_id);
CREATE INDEX idx_quiz_user ON quizzes(user_id);
CREATE INDEX idx_quiz_category ON quizzes(category_id);
CREATE INDEX idx_quiz_time_start ON quizzes(time_start DESC);

-- ===== Data integrity beyond FKs =====
-- Ensure the chosen choice belongs to the same question as quizquestion.question_id
CREATE OR REPLACE FUNCTION ensure_choice_matches_question()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.user_choice_id IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM 1
  FROM choice c
  WHERE c.choice_id = NEW.user_choice_id
    AND c.question_id = NEW.question_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Chosen choice % does not belong to question %',
      NEW.user_choice_id, NEW.question_id;
  END IF;

  RETURN NEW;
END
$$;

CREATE TRIGGER trg_choice_matches_question
  BEFORE INSERT OR UPDATE OF user_choice_id, question_id
  ON quizquestion
  FOR EACH ROW
  EXECUTE FUNCTION ensure_choice_matches_question();


-- Users (passwords here are plain words; in real life, store bcrypt/scrypt/argon2 hashes)
INSERT INTO users(email, password_hash, firstname, lastname, is_admin) VALUES
('admin@example.com',  'admin-hash', 'Ada',  'Admin', TRUE),
('alice@example.com',  'alice-hash', 'Alice','Lee',  FALSE),
('bob@example.com',    'bob-hash',   'Bob',  'Lin',  FALSE);

-- Categories
INSERT INTO category(name) VALUES
('Math'), ('Physics'), ('Chemistry'), ('Computer Science');

-- Questions + choices (a few per category)
-- ===== Math =====
INSERT INTO questions(category_id, description) SELECT category_id, 'What is 7 × 6?' FROM category WHERE name='Math';
WITH q AS (SELECT question_id FROM questions ORDER BY question_id DESC LIMIT 1)
INSERT INTO choice(question_id, description, is_correct)
SELECT q.question_id, x.description, x.correct FROM q, (VALUES ('42',TRUE),('36',FALSE),('49',FALSE),('56',FALSE)) AS x(description,correct);

INSERT INTO questions(category_id, description) SELECT category_id, 'Derivative of x²?' FROM category WHERE name='Math';
WITH q AS (SELECT question_id FROM questions ORDER BY question_id DESC LIMIT 1)
INSERT INTO choice(question_id, description, is_correct)
SELECT q.question_id, x.description, x.correct FROM q, (VALUES ('2x',TRUE),('x',FALSE),('x²',FALSE),('1',FALSE)) AS x(description,correct);

INSERT INTO questions(category_id, description) SELECT category_id, 'Value of π (rounded)?' FROM category WHERE name='Math';
WITH q AS (SELECT question_id FROM questions ORDER BY question_id DESC LIMIT 1)
INSERT INTO choice(question_id, description, is_correct)
SELECT q.question_id, x.description, x.correct FROM q, (VALUES ('3.14',TRUE),('2.71',FALSE),('1.62',FALSE),('3.41',FALSE)) AS x(description,correct);

INSERT INTO questions(category_id, description) SELECT category_id, 'What is 15% of 200?' FROM category WHERE name='Math';
WITH q AS (SELECT question_id FROM questions ORDER BY question_id DESC LIMIT 1)
INSERT INTO choice(question_id, description, is_correct)
SELECT q.question_id, x.description, x.correct FROM q, (VALUES ('30',TRUE),('20',FALSE),('15',FALSE),('25',FALSE)) AS x(description,correct);

INSERT INTO questions(category_id, description) SELECT category_id, 'Solve: 2x = 10' FROM category WHERE name='Math';
WITH q AS (SELECT question_id FROM questions ORDER BY question_id DESC LIMIT 1)
INSERT INTO choice(question_id, description, is_correct)
SELECT q.question_id, x.description, x.correct FROM q, (VALUES ('x=5',TRUE),('x=10',FALSE),('x=2',FALSE),('x=20',FALSE)) AS x(description,correct);

INSERT INTO questions(category_id, description) SELECT category_id, 'Area of a circle formula?' FROM category WHERE name='Math';
WITH q AS (SELECT question_id FROM questions ORDER BY question_id DESC LIMIT 1)
INSERT INTO choice(question_id, description, is_correct)
SELECT q.question_id, x.description, x.correct FROM q, (VALUES ('πr²',TRUE),('2πr',FALSE),('πd',FALSE),('r²',FALSE)) AS x(description,correct);

INSERT INTO questions(category_id, description) SELECT category_id, 'What is the square root of 144?' FROM category WHERE name='Math';
WITH q AS (SELECT question_id FROM questions ORDER BY question_id DESC LIMIT 1)
INSERT INTO choice(question_id, description, is_correct)
SELECT q.question_id, x.description, x.correct FROM q, (VALUES ('12',TRUE),('14',FALSE),('10',FALSE),('16',FALSE)) AS x(description,correct);

INSERT INTO questions(category_id, description) SELECT category_id, 'What is 9³?' FROM category WHERE name='Math';
WITH q AS (SELECT question_id FROM questions ORDER BY question_id DESC LIMIT 1)
INSERT INTO choice(question_id, description, is_correct)
SELECT q.question_id, x.description, x.correct FROM q, (VALUES ('729',TRUE),('81',FALSE),('243',FALSE),('27',FALSE)) AS x(description,correct);

INSERT INTO questions(category_id, description) SELECT category_id, 'What is the next prime after 7?' FROM category WHERE name='Math';
WITH q AS (SELECT question_id FROM questions ORDER BY question_id DESC LIMIT 1)
INSERT INTO choice(question_id, description, is_correct)
SELECT q.question_id, x.description, x.correct FROM q, (VALUES ('11',FALSE),('13',FALSE),('17',FALSE),('11',TRUE)) AS x(description,correct);

INSERT INTO questions(category_id, description) SELECT category_id, 'What is the value of 0!' FROM category WHERE name='Math';
WITH q AS (SELECT question_id FROM questions ORDER BY question_id DESC LIMIT 1)
INSERT INTO choice(question_id, description, is_correct)
SELECT q.question_id, x.description, x.correct FROM q, (VALUES ('1',TRUE),('0',FALSE),('Undefined',FALSE),('10',FALSE)) AS x(description,correct);

-- ===== Physics =====
INSERT INTO questions(category_id, description) SELECT category_id, 'Acceleration due to gravity (m/s²)?' FROM category WHERE name='Physics';
WITH q AS (SELECT question_id FROM questions ORDER BY question_id DESC LIMIT 1)
INSERT INTO choice(question_id, description, is_correct)
SELECT q.question_id, x.description, x.correct FROM q, (VALUES ('9.8',TRUE),('8.9',FALSE),('10.8',FALSE),('7.8',FALSE)) AS x(description,correct);

INSERT INTO questions(category_id, description) SELECT category_id, 'Who discovered X-rays?' FROM category WHERE name='Physics';
WITH q AS (SELECT question_id FROM questions ORDER BY question_id DESC LIMIT 1)
INSERT INTO choice(question_id, description, is_correct)
SELECT q.question_id, x.description, x.correct FROM q, (VALUES ('Röntgen',TRUE),('Newton',FALSE),('Einstein',FALSE),('Curie',FALSE)) AS x(description,correct);

INSERT INTO questions(category_id, description) SELECT category_id, 'Unit of electric current?' FROM category WHERE name='Physics';
WITH q AS (SELECT question_id FROM questions ORDER BY question_id DESC LIMIT 1)
INSERT INTO choice(question_id, description, is_correct)
SELECT q.question_id, x.description, x.correct FROM q, (VALUES ('Ampere',TRUE),('Volt',FALSE),('Ohm',FALSE),('Watt',FALSE)) AS x(description,correct);

INSERT INTO questions(category_id, description) SELECT category_id, 'First law of thermodynamics is about?' FROM category WHERE name='Physics';
WITH q AS (SELECT question_id FROM questions ORDER BY question_id DESC LIMIT 1)
INSERT INTO choice(question_id, description, is_correct)
SELECT q.question_id, x.description, x.correct FROM q, (VALUES ('Conservation of energy',TRUE),('Entropy',FALSE),('Heat transfer',FALSE),('Pressure',FALSE)) AS x(description,correct);

INSERT INTO questions(category_id, description) SELECT category_id, 'Speed of sound in air (m/s)?' FROM category WHERE name='Physics';
WITH q AS (SELECT question_id FROM questions ORDER BY question_id DESC LIMIT 1)
INSERT INTO choice(question_id, description, is_correct)
SELECT q.question_id, x.description, x.correct FROM q, (VALUES ('343',TRUE),('300',FALSE),('400',FALSE),('500',FALSE)) AS x(description,correct);

INSERT INTO questions(category_id, description) SELECT category_id, 'Who formulated laws of motion?' FROM category WHERE name='Physics';
WITH q AS (SELECT question_id FROM questions ORDER BY question_id DESC LIMIT 1)
INSERT INTO choice(question_id, description, is_correct)
SELECT q.question_id, x.description, x.correct FROM q, (VALUES ('Newton',TRUE),('Galileo',FALSE),('Einstein',FALSE),('Tesla',FALSE)) AS x(description,correct);

INSERT INTO questions(category_id, description) SELECT category_id, 'What is Ohm''s Law?' FROM category WHERE name='Physics';
WITH q AS (SELECT question_id FROM questions ORDER BY question_id DESC LIMIT 1)
INSERT INTO choice(question_id, description, is_correct)
SELECT q.question_id, x.description, x.correct FROM q, (VALUES ('V = IR',TRUE),('P = IV',FALSE),('E = mc²',FALSE),('F = ma',FALSE)) AS x(description,correct);

INSERT INTO questions(category_id, description) SELECT category_id, 'Who discovered radioactivity?' FROM category WHERE name='Physics';
WITH q AS (SELECT question_id FROM questions ORDER BY question_id DESC LIMIT 1)
INSERT INTO choice(question_id, description, is_correct)
SELECT q.question_id, x.description, x.correct FROM q, (VALUES ('Becquerel',TRUE),('Curie',FALSE),('Rutherford',FALSE),('Bohr',FALSE)) AS x(description,correct);

INSERT INTO questions(category_id, description) SELECT category_id, 'Unit of frequency?' FROM category WHERE name='Physics';
WITH q AS (SELECT question_id FROM questions ORDER BY question_id DESC LIMIT 1)
INSERT INTO choice(question_id, description, is_correct)
SELECT q.question_id, x.description, x.correct FROM q, (VALUES ('Hertz',TRUE),('Newton',FALSE),('Joule',FALSE),('Pascal',FALSE)) AS x(description,correct);

INSERT INTO questions(category_id, description) SELECT category_id, 'Who discovered electron?' FROM category WHERE name='Physics';
WITH q AS (SELECT question_id FROM questions ORDER BY question_id DESC LIMIT 1)
INSERT INTO choice(question_id, description, is_correct)
SELECT q.question_id, x.description, x.correct FROM q, (VALUES ('Thomson',TRUE),('Bohr',FALSE),('Rutherford',FALSE),('Einstein',FALSE)) AS x(description,correct);

-- ===== Chemistry =====
INSERT INTO questions(category_id, description) SELECT category_id, 'Chemical symbol for Gold?' FROM category WHERE name='Chemistry';
WITH q AS (SELECT question_id FROM questions ORDER BY question_id DESC LIMIT 1)
INSERT INTO choice(question_id, description, is_correct)
SELECT q.question_id, x.description, x.correct FROM q, (VALUES ('Au',TRUE),('Ag',FALSE),('Gd',FALSE),('Go',FALSE)) AS x(description,correct);

INSERT INTO questions(category_id, description) SELECT category_id, 'H₂O is the chemical formula for?' FROM category WHERE name='Chemistry';
WITH q AS (SELECT question_id FROM questions ORDER BY question_id DESC LIMIT 1)
INSERT INTO choice(question_id, description, is_correct)
SELECT q.question_id, x.description, x.correct FROM q, (VALUES ('Water',TRUE),('Hydrogen',FALSE),('Oxygen',FALSE),('Salt',FALSE)) AS x(description,correct);

INSERT INTO questions(category_id, description) SELECT category_id, 'Atomic number of Carbon?' FROM category WHERE name='Chemistry';
WITH q AS (SELECT question_id FROM questions ORDER BY question_id DESC LIMIT 1)
INSERT INTO choice(question_id, description, is_correct)
SELECT q.question_id, x.description, x.correct FROM q, (VALUES ('6',TRUE),('12',FALSE),('8',FALSE),('14',FALSE)) AS x(description,correct);

INSERT INTO questions(category_id, description) SELECT category_id, 'pH value of neutral solution?' FROM category WHERE name='Chemistry';
WITH q AS (SELECT question_id FROM questions ORDER BY question_id DESC LIMIT 1)
INSERT INTO choice(question_id, description, is_correct)
SELECT q.question_id, x.description, x.correct FROM q, (VALUES ('7',TRUE),('0',FALSE),('14',FALSE),('1',FALSE)) AS x(description,correct);

INSERT INTO questions(category_id, description) SELECT category_id, 'Who discovered Oxygen?' FROM category WHERE name='Chemistry';
WITH q AS (SELECT question_id FROM questions ORDER BY question_id DESC LIMIT 1)
INSERT INTO choice(question_id, description, is_correct)
SELECT q.question_id, x.description, x.correct FROM q, (VALUES ('Priestley',TRUE),('Lavoisier',FALSE),('Dalton',FALSE),('Mendeleev',FALSE)) AS x(description,correct);

INSERT INTO questions(category_id, description) SELECT category_id, 'Formula for table salt?' FROM category WHERE name='Chemistry';
WITH q AS (SELECT question_id FROM questions ORDER BY question_id DESC LIMIT 1)
INSERT INTO choice(question_id, description, is_correct)
SELECT q.question_id, x.description, x.correct FROM q, (VALUES ('NaCl',TRUE),('KCl',FALSE),('NaOH',FALSE),('HCl',FALSE)) AS x(description,correct);

INSERT INTO questions(category_id, description) SELECT category_id, 'Most abundant gas in air?' FROM category WHERE name='Chemistry';
WITH q AS (SELECT question_id FROM questions ORDER BY question_id DESC LIMIT 1)
INSERT INTO choice(question_id, description, is_correct)
SELECT q.question_id, x.description, x.correct FROM q, (VALUES ('Nitrogen',TRUE),('Oxygen',FALSE),('Carbon Dioxide',FALSE),('Hydrogen',FALSE)) AS x(description,correct);

INSERT INTO questions(category_id, description) SELECT category_id, 'Who invented the periodic table?' FROM category WHERE name='Chemistry';
WITH q AS (SELECT question_id FROM questions ORDER BY question_id DESC LIMIT 1)
INSERT INTO choice(question_id, description, is_correct)
SELECT q.question_id, x.description, x.correct FROM q, (VALUES ('Mendeleev',TRUE),('Curie',FALSE),('Dalton',FALSE),('Priestley',FALSE)) AS x(description,correct);

INSERT INTO questions(category_id, description) SELECT category_id, 'What is the chemical formula for methane?' FROM category WHERE name='Chemistry';
WITH q AS (SELECT question_id FROM questions ORDER BY question_id DESC LIMIT 1)
INSERT INTO choice(question_id, description, is_correct)
SELECT q.question_id, x.description, x.correct FROM q, (VALUES ('CH₄',TRUE),('C₂H₆',FALSE),('CO₂',FALSE),('H₂O',FALSE)) AS x(description,correct);

INSERT INTO questions(category_id, description) SELECT category_id, 'Which acid is found in vinegar?' FROM category WHERE name='Chemistry';
WITH q AS (SELECT question_id FROM questions ORDER BY question_id DESC LIMIT 1)
INSERT INTO choice(question_id, description, is_correct)
SELECT q.question_id, x.description, x.correct FROM q, (VALUES ('Acetic acid',TRUE),('Citric acid',FALSE),('Sulfuric acid',FALSE),('Hydrochloric acid',FALSE)) AS x(description,correct);

-- ===== Computer Science =====
INSERT INTO questions(category_id, description) SELECT category_id, 'Who invented the World Wide Web?' FROM category WHERE name='Computer Science';
WITH q AS (SELECT question_id FROM questions ORDER BY question_id DESC LIMIT 1)
INSERT INTO choice(question_id, description, is_correct)
SELECT q.question_id, x.description, x.correct FROM q, (VALUES ('Tim Berners-Lee',TRUE),('Bill Gates',FALSE),('Steve Jobs',FALSE),('Linus Torvalds',FALSE)) AS x(description,correct);

INSERT INTO questions(category_id, description) SELECT category_id, 'What does CPU stand for?' FROM category WHERE name='Computer Science';
WITH q AS (SELECT question_id FROM questions ORDER BY question_id DESC LIMIT 1)
INSERT INTO choice(question_id, description, is_correct)
SELECT q.question_id, x.description, x.correct FROM q, (VALUES ('Central Processing Unit',TRUE),('Computer Personal Unit',FALSE),('Central Print Unit',FALSE),('Control Processing Unit',FALSE)) AS x(description,correct);

INSERT INTO questions(category_id, description) SELECT category_id, 'Binary of decimal 5?' FROM category WHERE name='Computer Science';
WITH q AS (SELECT question_id FROM questions ORDER BY question_id DESC LIMIT 1)
INSERT INTO choice(question_id, description, is_correct)
SELECT q.question_id, x.description, x.correct FROM q, (VALUES ('101',TRUE),('110',FALSE),('100',FALSE),('111',FALSE)) AS x(description,correct);

INSERT INTO questions(category_id, description) SELECT category_id, 'HTML stands for?' FROM category WHERE name='Computer Science';
WITH q AS (SELECT question_id FROM questions ORDER BY question_id DESC LIMIT 1)
INSERT INTO choice(question_id, description, is_correct)
SELECT q.question_id, x.description, x.correct FROM q, (VALUES ('HyperText Markup Language',TRUE),('HighText Machine Language',FALSE),('HyperTabular Markup Language',FALSE),('None of these',FALSE)) AS x(description,correct);

INSERT INTO questions(category_id, description) SELECT category_id, 'Python is a ___ language?' FROM category WHERE name='Computer Science';
WITH q AS (SELECT question_id FROM questions ORDER BY question_id DESC LIMIT 1)
INSERT INTO choice(question_id, description, is_correct)
SELECT q.question_id, x.description, x.correct FROM q, (VALUES ('High-level',TRUE),('Low-level',FALSE),('Assembly',FALSE),('Machine',FALSE)) AS x(description,correct);

INSERT INTO questions(category_id, description) SELECT category_id, 'What is the value of 2^5?' FROM category WHERE name='Computer Science';
WITH q AS (SELECT question_id FROM questions ORDER BY question_id DESC LIMIT 1)
INSERT INTO choice(question_id, description, is_correct)
SELECT q.question_id, x.description, x.correct FROM q, (VALUES ('32',TRUE),('16',FALSE),('64',FALSE),('8',FALSE)) AS x(description,correct);

INSERT INTO questions(category_id, description) SELECT category_id, 'Which is not a programming language?' FROM category WHERE name='Computer Science';
WITH q AS (SELECT question_id FROM questions ORDER BY question_id DESC LIMIT 1)
INSERT INTO choice(question_id, description, is_correct)
SELECT q.question_id, x.description, x.correct FROM q, (VALUES ('HTML',TRUE),('Python',FALSE),('Java',FALSE),('C++',FALSE)) AS x(description,correct);

INSERT INTO questions(category_id, description) SELECT category_id, 'What is the output of print(2+3)?' FROM category WHERE name='Computer Science';
WITH q AS (SELECT question_id FROM questions ORDER BY question_id DESC LIMIT 1)
INSERT INTO choice(question_id, description, is_correct)
SELECT q.question_id, x.description, x.correct FROM q, (VALUES ('5',TRUE),('23',FALSE),('2+3',FALSE),('None',FALSE)) AS x(description,correct);

INSERT INTO questions(category_id, description) SELECT category_id, 'Which company developed Java?' FROM category WHERE name='Computer Science';
WITH q AS (SELECT question_id FROM questions ORDER BY question_id DESC LIMIT 1)
INSERT INTO choice(question_id, description, is_correct)
SELECT q.question_id, x.description, x.correct FROM q, (VALUES ('Sun Microsystems',TRUE),('Microsoft',FALSE),('Apple',FALSE),('Google',FALSE)) AS x(description,correct);

INSERT INTO questions(category_id, description) SELECT category_id, 'What is the time complexity of binary search?' FROM category WHERE name='Computer Science';
WITH q AS (SELECT question_id FROM questions ORDER BY question_id DESC LIMIT 1)
INSERT INTO choice(question_id, description, is_correct)
SELECT q.question_id, x.description, x.correct FROM q, (VALUES ('O(log n)',TRUE),('O(n)',FALSE),('O(1)',FALSE),('O(n log n)',FALSE)) AS x(description,correct);


-- A couple of contact messages
INSERT INTO contacts(subject, message, email) VALUES
('Account help', 'Please reset my password.', 'alice@example.com'),
('Feature request', 'Could we have dark mode?', 'bob@example.com');
