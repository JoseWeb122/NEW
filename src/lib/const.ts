export type SubjectSlug = "reading" | "math" | "spelling" | "science" | "english";

export interface Subject {
  slug: SubjectSlug;
  name: string;
  short: string;
  description: string;
  grades: string; // display range
  gradeMin: number; // 0 = K
  gradeMax: number;
  color: string;
  skills: string[];
}

export const SUBJECTS: Subject[] = [
  {
    slug: "reading",
    name: "Reading",
    short: "Comprehension, fluency & vocabulary",
    description:
      "From first sight words to advanced comprehension. We build fluency, vocabulary, and analytical reading skills tailored to each student's level.",
    grades: "K – 12",
    gradeMin: 0,
    gradeMax: 12,
    color: "#B4552D",
    skills: ["Comprehension", "Fluency", "Vocabulary", "Phonics", "Analysis"],
  },
  {
    slug: "math",
    name: "Math",
    short: "Foundations through advanced K–12 math",
    description:
      "Structured, step-by-step math instruction — from number sense and fractions to algebra, geometry, and pre-calculus concepts.",
    grades: "K – 12",
    gradeMin: 0,
    gradeMax: 12,
    color: "#2B50C8",
    skills: ["Number Sense", "Fractions", "Algebra", "Geometry", "Word Problems"],
  },
  {
    slug: "spelling",
    name: "Spelling",
    short: "Word recognition & spelling development",
    description:
      "Spelling patterns, roots and suffixes, word recognition, and writing support that turn spelling into a durable skill.",
    grades: "K – 8",
    gradeMin: 0,
    gradeMax: 8,
    color: "#8A4F7D",
    skills: ["Word Patterns", "Roots & Suffixes", "Recall", "Vocabulary"],
  },
  {
    slug: "science",
    name: "Science",
    short: "K–12 concepts, labs & enrichment",
    description:
      "Engaging science instruction across life, physical, and earth science — with homework support and hands-on enrichment.",
    grades: "K – 12",
    gradeMin: 0,
    gradeMax: 12,
    color: "#1E7A55",
    skills: ["Life Science", "Physical Science", "Earth Science", "Inquiry"],
  },
  {
    slug: "english",
    name: "English",
    short: "Grammar, writing & communication",
    description:
      "Grammar, structured writing, comprehension, and communication skills that give students a clear academic voice.",
    grades: "K – 12",
    gradeMin: 0,
    gradeMax: 12,
    color: "#6D5AA8",
    skills: ["Grammar", "Writing", "Comprehension", "Communication"],
  },
];

export const SUBJECT_MAP: Record<string, Subject> = Object.fromEntries(
  SUBJECTS.map((s) => [s.slug, s])
);

export const K = 0;

export const GRADES: { value: number; label: string }[] = [
  { value: 0, label: "Kindergarten" },
  ...Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `Grade ${i + 1}`,
  })),
];

export function gradeLabel(g: number) {
  return g === 0 ? "Kindergarten" : `Grade ${g}`;
}

export function gradeShort(g: number) {
  return g === 0 ? "K" : `G${g}`;
}

export interface Level {
  id: string;
  name: string;
  range: string;
  gradeRange: [number, number];
  description: string;
}

export const LEVELS: Level[] = [
  {
    id: "elementary",
    name: "Elementary School",
    range: "Kindergarten – Grade 5",
    gradeRange: [0, 5],
    description:
      "Foundational reading, math, and language skills with patient, structured instruction that builds confidence early.",
  },
  {
    id: "middle",
    name: "Middle School",
    range: "Grades 6 – 8",
    gradeRange: [6, 8],
    description:
      "Support through the critical transition years — pre-algebra, reading analysis, and study habits that stick.",
  },
  {
    id: "high",
    name: "High School",
    range: "Grades 9 – 12",
    gradeRange: [9, 12],
    description:
      "Course-level math and science, essay writing, and exam preparation with dedicated high-school tutors.",
  },
];

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const MEDIA = {
  hero: "https://images.pexels.com/photos/5212666/pexels-photo-5212666.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  live: "https://images.pexels.com/photos/5905711/pexels-photo-5905711.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  about: "https://images.pexels.com/photos/8926900/pexels-photo-8926900.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  group: "https://images.pexels.com/photos/6503101/pexels-photo-6503101.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  parent: "https://images.pexels.com/photos/4260325/pexels-photo-4260325.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  tutors: {
    "sarah-johnson": "https://images.pexels.com/photos/29811345/pexels-photo-29811345.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=640&w=520",
    "david-okafor": "https://images.pexels.com/photos/26834972/pexels-photo-26834972.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=640&w=520",
    "maria-santos": "https://images.pexels.com/photos/1181691/pexels-photo-1181691.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=640&w=520",
    "james-whitfield": "https://images.pexels.com/photos/12311549/pexels-photo-12311549.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=640&w=520",
    "priya-nair": "https://images.pexels.com/photos/37079379/pexels-photo-37079379.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=640&w=520",
    "tom-bennett": "https://images.pexels.com/photos/37148308/pexels-photo-37148308.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=640&w=520",
    "aisha-rahman": "https://images.pexels.com/photos/8154350/pexels-photo-8154350.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=640&w=520",
    "linda-park": "https://images.pexels.com/photos/27086916/pexels-photo-27086916.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=640&w=520",
  },
};

export const DEMO_ACCOUNTS = [
  {
    role: "student",
    label: "Student",
    name: "Emma Rivera",
    sub: "Grade 4 • Rivera family",
    id: 1,
    href: "/portal/student",
  },
  {
    role: "parent",
    label: "Parent",
    name: "Maria Rivera",
    sub: "Parent of Emma (G4) & James (G8)",
    id: 1,
    href: "/portal/parent",
  },
  {
    role: "tutor",
    label: "Tutor",
    name: "Sarah Johnson",
    sub: "Math & English • Grades 3–8",
    id: 1,
    slug: "sarah-johnson",
    href: "/portal/tutor",
  },
  {
    role: "admin",
    label: "Administrator",
    name: "Academy Admin",
    sub: "JS Tutoring Academy",
    id: 1,
    href: "/portal/admin",
  },
];

export const TESTIMONIALS = [
  {
    name: "Daniel Chen",
    role: "Parent of Olivia, Grade 7",
    quote:
      "The parent dashboard changed everything for us. I can see exactly what Olivia is working on, which sessions she attended, and how her math progress is trending — without asking her to explain it.",
  },
  {
    name: "Anita Patel",
    role: "Parent of Noah, Grade 2",
    quote:
      "Noah used to dread reading practice. His tutor made sessions feel like a game, and the recorded lessons mean we can repeat a topic at home. He's reading whole sentences now.",
  },
  {
    name: "Grace Kim",
    role: "Grade 11 Student",
    quote:
      "I book my chemistry sessions around school and sports. The tutor's notes after every session tell me exactly what to practice, so my time actually counts.",
  },
];

export const HOW_STEPS = [
  {
    n: "01",
    title: "Choose Your Learning Path",
    desc: "Select your grade level and the subjects that need support — reading, math, spelling, science, or English.",
  },
  {
    n: "02",
    title: "Find the Right Tutor",
    desc: "Browse qualified tutors by subject, grade, availability, and format, or pick a group class that fits your schedule.",
  },
  {
    n: "03",
    title: "Schedule & Learn",
    desc: "Book live 1-on-1 sessions, enroll in group classes, or stream recorded lessons whenever it works best.",
  },
  {
    n: "04",
    title: "Track Progress",
    desc: "Parents and students review completed lessons, assignments, attendance, and tutor feedback in one place.",
  },
];

export const TRUST_POINTS = [
  {
    icon: "award",
    title: "Experienced Tutors",
    desc: "Every tutor teaches the grade bands they specialize in, with years of K–12 classroom or tutoring experience.",
  },
  {
    icon: "grad",
    title: "K–12 Focused Learning",
    desc: "Curriculum aligned to what students actually face — kindergarten foundations through high-school coursework.",
  },
  {
    icon: "target",
    title: "Personalized Support",
    desc: "Sessions adapt to each learner's pace. Tutors document progress and adjust focus areas session by session.",
  },
  {
    icon: "calendar",
    title: "Flexible Scheduling",
    desc: "Evening and weekend slots, reschedule with one click, and a calendar that respects family life.",
  },
  {
    icon: "layers",
    title: "Multiple Learning Formats",
    desc: "Live 1-on-1 tutoring, small group classes, and a growing library of recorded lessons for every style.",
  },
  {
    icon: "eye",
    title: "Parent Visibility",
    desc: "Attendance, completed lessons, tutor feedback, and payments — all visible to parents in real time.",
  },
];
