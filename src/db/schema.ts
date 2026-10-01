import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const tutors = pgTable("tutors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  photo: text("photo"),
  subjects: text("subjects").array().notNull(),
  gradeMin: integer("grade_min").notNull(),
  gradeMax: integer("grade_max").notNull(),
  bio: text("bio").notNull(),
  approach: text("approach").notNull(),
  qualifications: text("qualifications").array().notNull(),
  experienceYears: integer("experience_years").notNull(),
  rating: numeric("rating", { precision: 3, scale: 1 }).notNull(),
  reviewCount: integer("review_count").notNull(),
  rate30: integer("rate_30").notNull(),
  rate60: integer("rate_60").notNull(),
  formats: text("formats").array().notNull(),
  days: text("days").array().notNull(),
  slotStart: integer("slot_start").notNull().default(15),
  slotEnd: integer("slot_end").notNull().default(20),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  tutorId: integer("tutor_id").notNull(),
  author: text("author").notNull(),
  rating: integer("rating").notNull(),
  text: text("text").notNull(),
  date: timestamp("date",{withTimezone:true}).notNull().defaultNow(),
});

export const parents = pgTable("parents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  createdAt: timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
});

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  grade: integer("grade").notNull(),
  guardian: text("guardian").notNull(),
  email: text("email"),
  guardianId: integer("guardian_id"),
  hue: integer("hue").notNull().default(215),
  createdAt: timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
});

export const groupClasses = pgTable("group_classes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  grade: integer("grade").notNull(),
  tutorId: integer("tutor_id").notNull(),
  day: text("day").notNull(),
  time: text("time").notNull(),
  durationMin: integer("duration_min").notNull().default(45),
  capacity: integer("capacity").notNull().default(8),
  enrolled: integer("enrolled").notNull().default(0),
  fee: integer("fee").notNull().default(0),
  description: text("description").notNull(),
});

export const enrollments = pgTable(
  "enrollments",
  {
    id: serial("id").primaryKey(),
    classId: integer("class_id").notNull(),
    studentId: integer("student_id").notNull(),
    createdAt: timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("uniq_enroll").on(t.classId, t.studentId)]
);

export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  grade: integer("grade").notNull(),
  topic: text("topic").notNull(),
  difficulty: text("difficulty").notNull().default("Beginner"),
  durationMin: integer("duration_min").notNull().default(15),
  description: text("description").notNull(),
  popularity: integer("popularity").notNull().default(50),
  addedAt: timestamp("added_at",{withTimezone:true}).notNull().defaultNow(),
});

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    id: serial("id").primaryKey(),
    studentId: integer("student_id").notNull(),
    lessonId: integer("lesson_id").notNull(),
    percent: integer("percent").notNull().default(0),
    updatedAt: timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("uniq_lp").on(t.studentId, t.lessonId)]
);

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  ref: text("ref").notNull(),
  studentId: integer("student_id").notNull(),
  tutorId: integer("tutor_id").notNull(),
  subject: text("subject").notNull(),
  kind: text("kind").notNull().default("1on1"),
  scheduledAt: timestamp("scheduled_at",{withTimezone:true}).notNull(),
  durationMin: integer("duration_min").notNull().default(30),
  price: integer("price").notNull().default(0),
  status: text("status").notNull().default("upcoming"),
  notes: text("notes"),
  createdAt: timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  invoiceNo: text("invoice_no").notNull(),
  studentId: integer("student_id").notNull(),
  label: text("label").notNull(),
  type: text("type").notNull().default("session"),
  amount: integer("amount").notNull(),
  date: timestamp("date",{withTimezone:true}).notNull().defaultNow(),
  status: text("status").notNull().default("paid"),
});

export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  kind: text("kind").notNull().default("worksheet"),
  dueAt: timestamp("due_at",{withTimezone:true}).notNull().defaultNow(),
  status: text("status").notNull().default("todo"),
  score: integer("score"),
  feedback: text("feedback"),
});

export const tutorNotes = pgTable("tutor_notes", {
  id: serial("id").primaryKey(),
  tutorId: integer("tutor_id").notNull(),
  studentId: integer("student_id").notNull(),
  summary: text("summary").notNull(),
  focus: text("focus").notNull(),
  practice: text("practice").notNull(),
  createdAt: timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  topic: text("topic").notNull().default("general"),
  body: text("body").notNull(),
  createdAt: timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
});
