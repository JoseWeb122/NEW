// Demo dataset for JS Tutoring Academy.
// Every date is relative to NOW(), so upcoming sessions, due assignments and recent
// payments always look current right after seeding. Used by:
//   • the runtime auto-setup on an empty database (src/db/setup.ts)
//   • POST /api/setup { action: "reset" } and the admin "Reset demo data" button
//   • the optional daily Vercel Cron refresh (/api/cron/reset-demo)
//   • node scripts/db-setup.mjs [--reset]
import { APP_TABLES } from "../config.mjs";

const tableList = APP_TABLES.map((t) => `'${t}'`).join(", ");

// Restart the id sequence of every *empty* table so seeded rows get ids 1..n
// (the seed's cross-table references rely on that).
const PREPARE_SQL = `DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[${tableList}] LOOP
    EXECUTE format('SELECT setval(pg_get_serial_sequence(%L, ''id''), 1, false) WHERE NOT EXISTS (SELECT 1 FROM %I)', t, t);
  END LOOP;
END $$;`;

const DATA_SQL = `
-- ---------- Tutors ----------
INSERT INTO tutors (name, slug, title, photo, subjects, grade_min, grade_max, bio, approach, qualifications, experience_years, rating, review_count, rate_30, rate_60, formats, days, slot_start, slot_end) VALUES
('Sarah Johnson', 'sarah-johnson', 'Math & English Specialist, Grades 3–8',
 'https://images.pexels.com/photos/29811345/pexels-photo-29811345.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=640&w=520',
 '{math,english}', 3, 8,
 'Sarah has spent seven years turning math anxiety into math confidence. Her sessions are structured, visual, and full of small wins — students finish knowing exactly what they can do next.',
 'I start every session with a two-minute warm-up, teach the concept with visuals, then let the student drive the practice problems. Mistakes are data, not failure — we track them and celebrate the fix.',
 '{B.S. Mathematics, State Teaching License, Academy Curriculum Trainer}', 7, '4.9', 128, 26, 46, '{1on1,group}', '{Mon,Wed,Thu}', 15, 20),

('David Okafor', 'david-okafor', 'Math & Science Instructor, Grades 6–12',
 'https://images.pexels.com/photos/26834972/pexels-photo-26834972.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=640&w=520',
 '{math,science}', 6, 12,
 'A former high-school department lead, David coaches middle and high-school students through algebra, chemistry, and physics — with a special knack for making abstract topics feel concrete.',
 'I teach in layers: the idea, the method, then the muscle memory. For exam seasons, we build a personal study map and work it week by week.',
 '{B.S. Physics, M.Ed., 10 years classroom experience}', 10, '4.8', 96, 28, 48, '{1on1,group}', '{Tue,Thu,Fri}', 15, 20),

('Maria Santos', 'maria-santos', 'Early Literacy Lead, K–Grade 3',
 'https://images.pexels.com/photos/1181691/pexels-photo-1181691.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=640&w=520',
 '{reading,spelling}', 0, 3,
 'Maria builds readers from the very first words. Kindergarten and early elementary families love her patient, play-structured sessions that still cover serious phonics and comprehension goals.',
 'Short bursts, big encouragement. We warm up with sounds, read together, play a word game, and always end with the student reading to me.',
 '{B.A. Early Childhood Education, Orton-Gillingham trained}', 6, '5.0', 84, 22, 40, '{1on1,group}', '{Mon,Tue,Wed}', 15, 19),

('James Whitfield', 'james-whitfield', 'STEM Tutor, Grades 9–12',
 'https://images.pexels.com/photos/12311549/pexels-photo-12311549.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=640&w=520',
 '{science,math}', 9, 12,
 'Twelve years with high-school students, from chemistry labs to pre-calculus. James is the tutor parents call when the coursework gets serious.',
 'Rigorous but never cold. We set a goal at the start of every session, work to it, and close with a 60-second recap from the student.',
 '{B.S. Chemistry, Advanced Placement exam reader, State Teaching License}', 12, '4.9', 71, 30, 52, '{1on1,group}', '{Wed,Thu,Fri}', 16, 20),

('Priya Nair', 'priya-nair', 'English & Reading Coach, Grades 4–10',
 'https://images.pexels.com/photos/37079379/pexels-photo-37079379.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=640&w=520',
 '{english,reading}', 4, 10,
 'Priya teaches students to write with structure and read with intent. Her essay workshop students leave every session with a clearer draft than they arrived with.',
 'Writing is a process, so we treat it like one: brainstorm, outline, draft, revise. Reading sessions focus on asking better questions of the text.',
 '{B.A. English Literature, M.Ed., Certified Writing Instructor}', 8, '4.8', 92, 27, 47, '{1on1,group}', '{Mon,Tue,Thu}', 15, 19),

('Tom Bennett', 'tom-bennett', 'Elementary Math Tutor, Grades 1–6',
 'https://images.pexels.com/photos/37148308/pexels-photo-37148308.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=640&w=520',
 '{math}', 1, 6,
 'Tom is the fraction whisperer. Number sense, times tables, and word problems — he makes elementary math feel like the best part of the day.',
 'Concrete before abstract: blocks, drawings, then symbols. If a student can teach me the trick, the trick is theirs.',
 '{B.S. Mathematics, Elementary Teaching License}', 5, '4.7', 64, 24, 44, '{1on1,group}', '{Mon,Wed}', 15, 19),

('Aisha Rahman', 'aisha-rahman', 'Spelling & Literacy Tutor, K–Grade 5',
 'https://images.pexels.com/photos/8154350/pexels-photo-8154350.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=640&w=520',
 '{spelling,english,reading}', 0, 5,
 'Aisha turns spelling into a game with a system. Word patterns, roots, and rhythm — her students remember words because they understand them.',
 'We chunk lists into patterns, say words out loud, and use spaced repetition. Ten focused minutes beat an hour of flashcards.',
 '{B.A. Linguistics, Phonics & Spelling Specialist}', 4, '4.9', 58, 22, 40, '{1on1,group}', '{Tue,Wed,Fri}', 15, 19),

('Linda Park', 'linda-park', 'Science & Reading Tutor, Grades 2–8',
 'https://images.pexels.com/photos/27086916/pexels-photo-27086916.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=640&w=520',
 '{science,reading}', 2, 8,
 'Linda makes science hands-on even over a screen — real phenomena, real questions, and experiments students can try at the kitchen table.',
 'Question first, answer later. Every session opens with a mystery and closes with the student explaining the why.',
 '{B.S. Biology, Middle School Science Specialist}', 6, '4.8', 77, 25, 45, '{1on1,group}', '{Tue,Thu}', 15, 20);

-- ---------- Reviews ----------
INSERT INTO reviews (tutor_id, author, rating, text, date) VALUES
(1, 'Rachel M. (Parent of Emma, G4)', 5, 'Sarah turned our math homework battles into calm, focused sessions. Emma now asks to start early.', NOW() - INTERVAL '12 days'),
(1, 'Kevin T. (Parent, G6)', 5, 'Structured, warm, and always follows up with written notes. Worth every minute.', NOW() - INTERVAL '34 days'),
(2, 'Susan K. (Parent of Grace, G11)', 5, 'David made chemistry actually make sense. Grade went from a C to an A- in one term.', NOW() - INTERVAL '20 days'),
(2, 'Marcus L. (G8 student)', 5, 'He explains until it clicks and never makes you feel bad for asking twice.', NOW() - INTERVAL '45 days'),
(3, 'Anita P. (Parent of Noah, G2)', 5, 'Maria is magical. Noah reads whole sentences now and LOVES his sessions.', NOW() - INTERVAL '9 days'),
(3, 'Holly R. (Parent, K)', 5, 'Patient, structured, and kind. Exactly what a kindergartner needs.', NOW() - INTERVAL '28 days'),
(4, 'Dana W. (Parent of Alex, G10)', 5, 'James is the real deal — rigorous prep, honest feedback, real results.', NOW() - INTERVAL '16 days'),
(4, 'Tom H. (Parent, G9)', 4, 'Very strong with algebra. Sessions run exactly on time.', NOW() - INTERVAL '50 days'),
(5, 'Nina S. (Parent of Maya, G7)', 5, 'Priya restructured my daughters entire approach to essays. Her writing has a voice now.', NOW() - INTERVAL '14 days'),
(5, 'Owen B. (G9 student)', 5, 'The outline method changed everything. First A on my argumentative essay.', NOW() - INTERVAL '38 days'),
(6, 'Carla D. (Parent of Ben, G3)', 5, 'Tom made fractions finally click. Ben explains them to his little sister now.', NOW() - INTERVAL '11 days'),
(6, 'Paul E. (Parent, G5)', 4, 'Fun, fast, and effective. Times tables are solid after six weeks.', NOW() - INTERVAL '30 days'),
(7, 'Grace L. (Parent, G4)', 5, 'Aisha made spelling a game. My daughter reviews her list voluntarily now.', NOW() - INTERVAL '7 days'),
(7, 'Yusuf A. (Parent, G2)', 5, 'Calm, structured, and full of clever word tricks. Highly recommend.', NOW() - INTERVAL '25 days'),
(8, 'Monica F. (Parent of Ivy, G5)', 5, 'Linda makes science feel like detective work. Ivy does the kitchen experiments.', NOW() - INTERVAL '18 days'),
(8, 'Sam O. (G7 student)', 5, 'She never just gives the answer — she gets YOU to find it. Best tutor I have had.', NOW() - INTERVAL '41 days');

-- ---------- Parents & Students ----------
INSERT INTO parents (id, name, email, phone) VALUES
(1, 'Maria Rivera', 'maria.rivera@example.com', '(555) 019-2841'),
(2, 'Daniel Chen', 'daniel.chen@example.com', '(555) 014-7712'),
(3, 'Anita Patel', 'anita.patel@example.com', '(555) 016-3390'),
(4, 'Susan Kim', 'susan.kim@example.com', '(555) 012-9084');

INSERT INTO students (id, name, grade, guardian, email, guardian_id, hue) VALUES
(1, 'Emma Rivera', 4, 'Maria Rivera', 'emma.rivera@example.com', 1, 205),
(2, 'James Rivera', 8, 'Maria Rivera', 'james.rivera@example.com', 1, 260),
(3, 'Olivia Chen', 7, 'Daniel Chen', 'olivia.chen@example.com', 2, 150),
(4, 'Noah Patel', 2, 'Anita Patel', 'noah.patel@example.com', 3, 30),
(5, 'Grace Kim', 11, 'Susan Kim', 'grace.kim@example.com', 4, 300);

-- ---------- Group classes ----------
INSERT INTO group_classes (id, title, subject, grade, tutor_id, day, time, duration_min, capacity, enrolled, fee, description) VALUES
(1, 'Grade 5 Math — Fractions & Decimals', 'math', 5, 1, 'Tue', '5:00 PM', 45, 8, 3, 35,
 'A weekly deep-dive into fractions and decimals: equivalent forms, ordering, and real-world word problems. Grade-matched to a small group so every student gets airtime.'),
(2, 'Kindergarten Reading Circles', 'reading', 0, 3, 'Mon', '4:00 PM', 30, 6, 1, 30,
 'A gentle, play-structured reading circle for kindergarteners. Sight words, phonics games, and shared read-alouds in a group of six.'),
(3, 'Grade 8 Science — Physical Science Labs', 'science', 8, 2, 'Wed', '4:30 PM', 50, 8, 2, 35,
 'Hands-on physical science: forces, motion, and energy. Students follow guided lab protocols and explain the why behind every result.'),
(4, 'Grade 10 English — Essay Workshop', 'english', 10, 5, 'Thu', '6:00 PM', 60, 8, 2, 40,
 'A writing workshop built around process: thesis, structure, evidence, and revision. Each student leaves with a stronger draft.'),
(5, 'Grade 2 Spelling Sprint', 'spelling', 2, 7, 'Fri', '4:00 PM', 30, 8, 2, 25,
 'Ten minutes of pattern games, five of rhythm drills, and a victory list every Friday. Spelling that sticks.'),
(6, 'Grade 7 Math — Pre-Algebra Bootcamp', 'math', 7, 2, 'Sat', '4:00 PM', 60, 8, 3, 40,
 'Six weeks from fractions to first equations. Saturdays keep the momentum going without interrupting the school week.');

INSERT INTO enrollments (class_id, student_id) VALUES
(1, 1), (1, 2), (1, 3),
(2, 4),
(3, 2), (3, 3),
(4, 5), (4, 2),
(5, 4), (5, 1),
(6, 2), (6, 3), (6, 1);

-- ---------- Recorded lessons ----------
INSERT INTO lessons (id, title, subject, grade, topic, difficulty, duration_min, description, popularity, added_at) VALUES
(1, 'Understanding Fractions', 'math', 4, 'Fractions', 'Intermediate', 18, 'What a fraction really means: parts, wholes, and equivalent forms — with visuals that make it click.', 96, NOW() - INTERVAL '2 days'),
(2, 'Multiplication Strategies', 'math', 3, 'Arithmetic', 'Beginner', 14, 'Build fast, confident multiplication with arrays, doubles, and the distributive trick.', 74, NOW() - INTERVAL '9 days'),
(3, 'Decimals & Money', 'math', 5, 'Decimals', 'Beginner', 16, 'Connecting decimals to dollars and cents: place value, adding, and comparing amounts.', 88, NOW() - INTERVAL '5 days'),
(4, 'Intro to Algebra', 'math', 7, 'Algebra', 'Intermediate', 22, 'Variables are just boxes with secrets. Solve your first equations with balance logic.', 91, NOW() - INTERVAL '3 days'),
(5, 'Ratios & Proportions', 'math', 8, 'Ratios', 'Intermediate', 20, 'From map scale to recipe math — see how proportions run the real world.', 82, NOW() - INTERVAL '1 day'),
(6, 'Functions & Graphing', 'math', 9, 'Functions', 'Advanced', 24, 'Input, output, and everything in between. Read graphs like a story.', 69, NOW() - INTERVAL '12 days'),
(7, 'Sight Words Adventure', 'reading', 0, 'Phonics', 'Beginner', 12, 'The first 100 sight words, taught through rhythm, repetition, and a little play.', 93, NOW() - INTERVAL '7 days'),
(8, 'Character & Setting', 'reading', 3, 'Comprehension', 'Beginner', 15, 'How to find the who, where, and why in any story — with guided examples.', 85, NOW() - INTERVAL '4 days'),
(9, 'Inference Skills', 'reading', 6, 'Comprehension', 'Intermediate', 17, 'Reading what is NOT on the page: clues, context, and confident guessing.', 79, NOW() - INTERVAL '2 days'),
(10, 'Analyzing Persuasive Texts', 'reading', 9, 'Analysis', 'Advanced', 20, 'Spot the argument, the audience, and the tactics. Critical reading for older students.', 66, NOW() - INTERVAL '10 days'),
(11, 'Beginning Sounds', 'spelling', 0, 'Phonics', 'Beginner', 10, 'First sounds, first words: the foundation every young speller builds on.', 71, NOW() - INTERVAL '8 days'),
(12, 'Suffixes: -er, -ing, -ed', 'spelling', 2, 'Word Patterns', 'Beginner', 13, 'Three little word-builders that turn play into player and jump into jumping.', 77, NOW() - INTERVAL '6 days'),
(13, 'Commonly Misspelled Words', 'spelling', 4, 'Word Patterns', 'Intermediate', 15, 'The 50 words everyone gets wrong, with memory hooks that actually work.', 83, NOW() - INTERVAL '3 days'),
(14, 'Roots & Affixes', 'spelling', 7, 'Word Patterns', 'Advanced', 19, 'Decode any word: Latin and Greek roots that unlock vocabulary on test day.', 61, NOW() - INTERVAL '11 days'),
(15, 'States of Matter', 'science', 2, 'Physical Science', 'Beginner', 14, 'Solid, liquid, gas — and the amazing changes between them.', 80, NOW() - INTERVAL '5 days'),
(16, 'Ecosystems', 'science', 5, 'Life Science', 'Beginner', 18, 'Food webs, habitats, and what happens when one piece moves.', 87, NOW() - INTERVAL '2 days'),
(17, 'The Human Body', 'science', 8, 'Life Science', 'Intermediate', 21, 'Systems that keep us going: circulatory, respiratory, and beyond.', 75, NOW() - INTERVAL '9 days'),
(18, 'Chemical Reactions', 'science', 11, 'Physical Science', 'Advanced', 26, 'Balancing equations and predicting products — the language of chemistry.', 58, NOW() - INTERVAL '13 days'),
(19, 'Parts of Speech', 'english', 3, 'Grammar', 'Beginner', 15, 'Nouns, verbs, and the rest of the toolbox — with sentences you can build.', 72, NOW() - INTERVAL '6 days'),
(20, 'Writing Structure', 'english', 6, 'Writing', 'Intermediate', 19, 'Paragraphs with a spine: topic sentences, evidence, and transitions.', 78, NOW() - INTERVAL '4 days'),
(21, 'Essay Fundamentals', 'english', 10, 'Writing', 'Advanced', 23, 'Thesis, body, conclusion — a reliable structure for every essay prompt.', 64, NOW() - INTERVAL '8 days');

-- ---------- Lesson progress (Emma=1, James=2) ----------
INSERT INTO lesson_progress (student_id, lesson_id, percent, updated_at) VALUES
(1, 1, 100, NOW() - INTERVAL '1 day'),
(1, 2, 100, NOW() - INTERVAL '4 days'),
(1, 3, 100, NOW() - INTERVAL '6 days'),
(1, 13, 60, NOW() - INTERVAL '2 days'),
(1, 15, 45, NOW() - INTERVAL '3 days'),
(1, 19, 100, NOW() - INTERVAL '8 days'),
(2, 4, 100, NOW() - INTERVAL '5 days'),
(2, 5, 70, NOW() - INTERVAL '2 days'),
(2, 14, 30, NOW() - INTERVAL '4 days'),
(2, 17, 100, NOW() - INTERVAL '9 days'),
(2, 20, 100, NOW() - INTERVAL '7 days');

-- ---------- Bookings ----------
INSERT INTO bookings (ref, student_id, tutor_id, subject, kind, scheduled_at, duration_min, price, status, notes, created_at) VALUES
('JS-EM401', 1, 1, 'math', '1on1', (NOW() + INTERVAL '1 day')::date + TIME '16:00', 30, 26, 'upcoming', 'Focus on fraction word problems', NOW() - INTERVAL '3 days'),
('JS-EM372', 1, 1, 'math', '1on1', (NOW() - INTERVAL '2 days')::date + TIME '15:00', 30, 26, 'completed', NULL, NOW() - INTERVAL '6 days'),
('JS-EM318', 1, 7, 'spelling', '1on1', (NOW() - INTERVAL '5 days')::date + TIME '17:00', 30, 22, 'completed', NULL, NOW() - INTERVAL '9 days'),
('JS-EM415', 1, 1, 'math', '1on1', (NOW() + INTERVAL '7 days')::date + TIME '16:00', 60, 46, 'upcoming', 'Exam prep starts', NOW() - INTERVAL '1 day'),
('JS-JR205', 2, 2, 'science', '1on1', (NOW() + INTERVAL '2 days')::date + TIME '17:30', 60, 48, 'upcoming', 'Forces and motion lab review', NOW() - INTERVAL '4 days'),
('JS-JR167', 2, 2, 'math', '1on1', (NOW() - INTERVAL '1 day')::date + TIME '16:00', 60, 48, 'completed', NULL, NOW() - INTERVAL '8 days'),
('JS-JR214', 2, 5, 'english', '1on1', (NOW() + INTERVAL '4 days')::date + TIME '16:00', 30, 27, 'upcoming', 'Essay draft due next week', NOW() - INTERVAL '2 days'),
('JS-JR098', 2, 2, 'math', '1on1', (NOW() - INTERVAL '7 days')::date + TIME '16:00', 60, 48, 'cancelled', 'Family travel', NOW() - INTERVAL '12 days'),
('JS-OC042', 3, 2, 'math', '1on1', (NOW() + INTERVAL '1 day')::date + TIME '18:00', 60, 48, 'upcoming', NULL, NOW() - INTERVAL '2 days'),
('JS-NP011', 4, 3, 'reading', '1on1', (NOW() + INTERVAL '3 days')::date + TIME '15:00', 30, 22, 'upcoming', NULL, NOW() - INTERVAL '1 day'),
('JS-GK330', 5, 4, 'science', '1on1', (NOW() - INTERVAL '3 days')::date + TIME '17:00', 60, 52, 'completed', NULL, NOW() - INTERVAL '10 days');

-- ---------- Payments ----------
INSERT INTO payments (invoice_no, student_id, label, type, amount, date, status) VALUES
('INV-2610', 1, 'Monthly tutoring plan — Rivera family', 'plan', 129, NOW() - INTERVAL '38 days', 'paid'),
('INV-2611', 2, 'Monthly tutoring plan — Rivera family', 'plan', 129, NOW() - INTERVAL '38 days', 'paid'),
('INV-2609', 2, 'Group class — Grade 7 Math Pre-Algebra Bootcamp', 'class', 40, NOW() - INTERVAL '40 days', 'paid'),
('INV-2608', 5, '1-on-1 science session — James Whitfield', 'session', 52, NOW() - INTERVAL '35 days', 'paid'),
('INV-2605', 3, '1-on-1 math session — David Okafor', 'session', 48, NOW() - INTERVAL '30 days', 'paid'),
('INV-2603', 1, 'Group class — Grade 5 Math Fractions & Decimals', 'class', 35, NOW() - INTERVAL '20 days', 'paid'),
('INV-2607', 4, '1-on-1 reading session — Maria Santos', 'session', 22, NOW() - INTERVAL '16 days', 'paid'),
('INV-2604', 2, '1-on-1 math session — David Okafor', 'session', 48, NOW() - INTERVAL '12 days', 'paid'),
('INV-2601', 1, '1-on-1 math session — Sarah Johnson', 'session', 26, NOW() - INTERVAL '2 days', 'paid'),
('INV-2602', 2, '1-on-1 science session — David Okafor', 'session', 48, NOW() - INTERVAL '1 day', 'paid'),
('INV-2606', 1, '1-on-1 spelling session — Aisha Rahman', 'session', 22, NOW() - INTERVAL '5 days', 'paid');

-- ---------- Assignments ----------
INSERT INTO assignments (student_id, title, subject, kind, due_at, status, score, feedback) VALUES
(1, 'Fractions practice worksheet', 'math', 'worksheet', (NOW() + INTERVAL '2 days')::date + TIME '23:00', 'todo', NULL, NULL),
(1, 'Equivalent fractions review', 'math', 'practice', (NOW() - INTERVAL '1 day')::date + TIME '23:00', 'done', 92, 'Great work on cross-multiplication — keep this pace!'),
(1, 'Spelling list: week 12', 'spelling', 'homework', (NOW() + INTERVAL '1 day')::date + TIME '23:00', 'todo', NULL, NULL),
(1, 'Reading log: Chapter 3', 'reading', 'reading', (NOW() - INTERVAL '3 days')::date + TIME '23:00', 'done', 88, 'Strong inference answers. Lovely detailed notes.'),
(2, 'Algebra: solving linear equations', 'math', 'practice', (NOW() + INTERVAL '3 days')::date + TIME '23:00', 'todo', NULL, NULL),
(2, 'Lab report: forces and motion', 'science', 'homework', (NOW() + INTERVAL '5 days')::date + TIME '23:00', 'todo', NULL, NULL),
(2, 'Essay: compare and contrast draft', 'english', 'writing', (NOW() - INTERVAL '2 days')::date + TIME '23:00', 'done', 90, 'Clear thesis — watch your paragraph transitions.'),
(4, 'Sight words: set 4 flashcards', 'reading', 'practice', (NOW() + INTERVAL '1 day')::date + TIME '23:00', 'todo', NULL, NULL);

-- ---------- Tutor notes ----------
INSERT INTO tutor_notes (tutor_id, student_id, summary, focus, practice, created_at) VALUES
(1, 1, 'Emma is improving quickly with equivalent fractions; confident with visuals, needs speed on word problems.', 'Word problems', '10 problems daily before Friday', NOW() - INTERVAL '2 days'),
(1, 1, 'Completed the multiplication strategies lesson; fluency is improving week over week.', 'Multi-digit multiplication', '5 minutes of timed drills', NOW() - INTERVAL '9 days'),
(2, 2, 'James handled ratio word problems well. Struggled with unit conversions under time pressure.', 'Unit conversions', 'Conversion table drills, 3x this week', NOW() - INTERVAL '1 day'),
(2, 2, 'Strong session on the forces and motion lab. Graph interpretation still needs reps.', 'Graph interpretation', 'Two graph problems this week', NOW() - INTERVAL '15 days'),
(7, 1, 'Spelling recall is strong for suffix patterns. The week 12 list is nearly mastered.', 'Commonly misspelled words', 'Review list on Sunday evening', NOW() - INTERVAL '5 days'),
(3, 4, 'Noah read three sight-word sentences in a row — a big milestone for his reading fluency.', 'Fluency', '10 min of read-aloud daily', NOW() - INTERVAL '3 days');
`;

// Move every sequence past the highest id so new rows never collide with seeded ones.
const SEQUENCE_SQL = APP_TABLES.map(
  (t) =>
    `SELECT setval(pg_get_serial_sequence('${t}', 'id'), COALESCE((SELECT MAX(id) FROM ${t}), 1), (SELECT MAX(id) FROM ${t}) IS NOT NULL);`
).join("\n");

/** Inserts the demo dataset into empty tables and realigns id sequences. */
export const SEED_SQL = [PREPARE_SQL, DATA_SQL, SEQUENCE_SQL].join("\n");

/** Truncates every table, then reloads the demo dataset. */
export const RESET_SQL = `TRUNCATE ${APP_TABLES.join(", ")} RESTART IDENTITY CASCADE;\n${SEED_SQL}`;
