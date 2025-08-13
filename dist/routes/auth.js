import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { requireAuth, requireRole } from '../middleware/auth.js';
export const router = Router();
const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(1),
});
router.post('/register', async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const { email, password, name } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
        return res.status(409).json({ error: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, passwordHash, name, role: 'STUDENT' } });
    res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
});
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });
router.post('/login', async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
        return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok)
        return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'change-me', {
        expiresIn: '7d',
    });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});
const createAdminSchema = z.object({ email: z.string().email(), password: z.string().min(6), name: z.string().min(1) });
router.post('/create-admin', requireAuth, requireRole('ADMIN'), async (req, res) => {
    const parsed = createAdminSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const { email, password, name } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
        return res.status(409).json({ error: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await prisma.user.create({ data: { email, passwordHash, name, role: 'ADMIN' } });
    res.json({ id: admin.id, email: admin.email, name: admin.name, role: admin.role });
});
//# sourceMappingURL=auth.js.map