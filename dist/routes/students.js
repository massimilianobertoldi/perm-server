import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
export const router = Router();
// List students (admin)
router.get('/', requireAuth, requireRole('ADMIN'), async (_req, res) => {
    const students = await prisma.user.findMany({ where: { role: 'STUDENT' }, orderBy: { name: 'asc' } });
    res.json(students);
});
// Get student details (admin or self)
router.get('/:id', requireAuth, async (req, res) => {
    const id = Number(req.params.id);
    if (req.user.role !== 'ADMIN' && req.user.id !== id)
        return res.status(403).json({ error: 'Forbidden' });
    const student = await prisma.user.findUnique({ where: { id }, include: { permissions: true, enrollments: true } });
    res.json(student);
});
//# sourceMappingURL=students.js.map