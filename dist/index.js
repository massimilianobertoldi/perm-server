import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { json } from 'express';
import { router as authRouter } from './routes/auth.js';
import { router as teachersRouter } from './routes/teachers.js';
import { router as lessonsRouter } from './routes/lessons.js';
import { router as studentsRouter } from './routes/students.js';
const app = express();
app.use(cors());
app.use(json());
app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/auth', authRouter);
app.use('/teachers', teachersRouter);
app.use('/lessons', lessonsRouter);
app.use('/students', studentsRouter);
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});
const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});
//# sourceMappingURL=index.js.map