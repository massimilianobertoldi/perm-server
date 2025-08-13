import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const router = Router();

// List teachers (public)
router.get('/', async (_req, res) => {
  const teachers = await prisma.teacher.findMany({
    include: { availabilities: true },
    orderBy: { name: 'asc' },
  });
  res.json(teachers);
});

// Create teacher (admin)
const createTeacherSchema = z.object({
  name: z.string().min(1),
  maxStudentsPerLesson: z.number().int().min(1),
});
router.post('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const parsed = createTeacherSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const teacher = await prisma.teacher.create({ data: parsed.data });
  res.json(teacher);
});

// Update teacher (admin)
const updateTeacherSchema = z.object({
  name: z.string().min(1).optional(),
  maxStudentsPerLesson: z.number().int().min(1).optional(),
});
router.put('/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const id = Number(req.params.id);
  const parsed = updateTeacherSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const data: any = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.maxStudentsPerLesson !== undefined) data.maxStudentsPerLesson = parsed.data.maxStudentsPerLesson;
  const teacher = await prisma.teacher.update({ where: { id }, data });
  res.json(teacher);
});

// Delete teacher (admin)
router.delete('/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const id = Number(req.params.id);
  await prisma.teacher.delete({ where: { id } });
  res.json({ ok: true });
});

// Manage availability (admin)
const availabilitySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});
router.post('/:id/availability', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const teacherId = Number(req.params.id);
  const parsed = availabilitySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const availability = await prisma.teacherAvailability.create({ data: { ...parsed.data, teacherId } });
  res.json(availability);
});

router.delete('/:id/availability/:availabilityId', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const availabilityId = Number(req.params.availabilityId);
  await prisma.teacherAvailability.delete({ where: { id: availabilityId } });
  res.json({ ok: true });
});

// Permissions: which teachers a student can enroll in (admin)
const setPermissionsSchema = z.object({ studentId: z.number().int().min(1), teacherIds: z.array(z.number().int().min(1)).default([]) });
router.post('/permissions/set', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const parsed = setPermissionsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { studentId, teacherIds } = parsed.data;

  // Remove old permissions not in the list
  await prisma.studentTeacherPermission.deleteMany({ where: { studentId, teacherId: { notIn: teacherIds } } });
  // Add missing permissions
  const existing = await prisma.studentTeacherPermission.findMany({ where: { studentId } });
  const existingSet = new Set(existing.map(p => p.teacherId));
  const toCreate = teacherIds.filter(id => !existingSet.has(id)).map(teacherId => ({ studentId, teacherId }));
  if (toCreate.length > 0) {
    await prisma.studentTeacherPermission.createMany({ data: toCreate });
  }
  const current = await prisma.studentTeacherPermission.findMany({ where: { studentId } });
  res.json(current);
});

// Get which teachers a student can enroll in (admin or the student themself)
router.get('/permissions/:studentId', requireAuth, async (req, res) => {
  const studentId = Number(req.params.studentId);
  if (req.user!.role !== 'ADMIN' && req.user!.id !== studentId) return res.status(403).json({ error: 'Forbidden' });
  const permissions = await prisma.studentTeacherPermission.findMany({ where: { studentId } });
  res.json(permissions);
});