import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const router = Router();

// List lessons, filters optional
router.get('/', async (req, res) => {
  const { teacherId, from, to } = req.query as { teacherId?: string; from?: string; to?: string };
  const where: any = {};
  if (teacherId) where.teacherId = Number(teacherId);
  if (from || to) {
    where.startAt = {};
    if (from) (where.startAt as any).gte = new Date(from);
    if (to) (where.startAt as any).lte = new Date(to);
  }
  const lessons = await prisma.lesson.findMany({ where, include: { enrollments: true, teacher: true }, orderBy: { startAt: 'asc' } });
  res.json(lessons);
});

// Create a lesson (admin)
const createLessonSchema = z.object({
  teacherId: z.number().int().min(1),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  capacity: z.number().int().min(1),
});
router.post('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const parsed = createLessonSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { teacherId, startAt, endAt, capacity } = parsed.data;

  // Fetch teacher to enforce maxStudentsPerLesson
  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
  const finalCapacity = Math.min(capacity, teacher.maxStudentsPerLesson);

  const lesson = await prisma.lesson.create({ data: { teacherId, startAt, endAt, capacity: finalCapacity } });
  res.json(lesson);
});

// Update a lesson (admin)
const updateLessonSchema = z.object({
  startAt: z.coerce.date().optional(),
  endAt: z.coerce.date().optional(),
  capacity: z.number().int().min(1).optional(),
});
router.put('/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const id = Number(req.params.id);
  const parsed = updateLessonSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const data: any = {};
  if (parsed.data.startAt) data.startAt = parsed.data.startAt;
  if (parsed.data.endAt) data.endAt = parsed.data.endAt;
  if (parsed.data.capacity) data.capacity = parsed.data.capacity;
  const updated = await prisma.lesson.update({ where: { id }, data });
  res.json(updated);
});

// Delete lesson (admin)
router.delete('/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const id = Number(req.params.id);
  await prisma.lesson.delete({ where: { id } });
  res.json({ ok: true });
});

// Enroll a student (student)
const enrollSchema = z.object({ lessonId: z.number().int().min(1) });
router.post('/enroll', requireAuth, requireRole('STUDENT'), async (req, res) => {
  const parsed = enrollSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { lessonId } = parsed.data;
  const studentId = req.user!.id;

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { enrollments: true, teacher: true } });
  if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

  // Check permission to enroll with this teacher
  const permitted = await prisma.studentTeacherPermission.findFirst({ where: { studentId, teacherId: lesson.teacherId } });
  if (!permitted) return res.status(403).json({ error: 'Not permitted to enroll with this teacher' });

  // Check capacity
  const current = await prisma.enrollment.count({ where: { lessonId } });
  if (current >= lesson.capacity) return res.status(409).json({ error: 'Lesson is full' });

  // Create enrollment
  const enrollment = await prisma.enrollment.create({ data: { lessonId, studentId } });
  res.json(enrollment);
});

// Unenroll (student)
const unenrollSchema = z.object({ lessonId: z.number().int().min(1) });
router.post('/unenroll', requireAuth, requireRole('STUDENT'), async (req, res) => {
  const parsed = unenrollSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { lessonId } = parsed.data;
  const studentId = req.user!.id;

  await prisma.enrollment.delete({ where: { lessonId_studentId: { lessonId, studentId } } });
  res.json({ ok: true });
});

// List my enrollments (student)
router.get('/me/enrollments', requireAuth, requireRole('STUDENT'), async (req, res) => {
  const studentId = req.user!.id;
  const enrollments = await prisma.enrollment.findMany({ where: { studentId }, include: { lesson: true } });
  res.json(enrollments);
});

// Admin: enroll any student into a lesson
const adminEnrollSchema = z.object({ studentId: z.number().int().min(1) });
router.post('/:lessonId/enroll-student', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const lessonId = Number(req.params.lessonId);
  const parsed = adminEnrollSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { studentId } = parsed.data;

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { enrollments: true } });
  if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

  const current = await prisma.enrollment.count({ where: { lessonId } });
  if (current >= lesson.capacity) return res.status(409).json({ error: 'Lesson is full' });

  const enrollment = await prisma.enrollment.create({ data: { lessonId, studentId } });
  res.json(enrollment);
});

// Admin: unenroll any student from a lesson
router.post('/:lessonId/unenroll-student', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const lessonId = Number(req.params.lessonId);
  const parsed = adminEnrollSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { studentId } = parsed.data;

  await prisma.enrollment.delete({ where: { lessonId_studentId: { lessonId, studentId } } });
  res.json({ ok: true });
});

// Admin: list enrollments for a lesson
router.get('/:lessonId/enrollments', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const lessonId = Number(req.params.lessonId);
  const enrollments = await prisma.enrollment.findMany({ where: { lessonId }, include: { student: true } as any });
  res.json(enrollments);
});