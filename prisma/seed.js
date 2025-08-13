import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
async function main() {
    const adminEmail = 'admin@dance.local';
    const adminPass = 'admin123';
    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            passwordHash: await bcrypt.hash(adminPass, 10),
            name: 'Admin',
            role: 'ADMIN',
        },
    });
    const alice = await prisma.teacher.upsert({
        where: { id: 1 },
        update: {},
        create: { name: 'Alice', maxStudentsPerLesson: 5 },
    });
    const bob = await prisma.teacher.upsert({
        where: { id: 2 },
        update: {},
        create: { name: 'Bob', maxStudentsPerLesson: 3 },
    });
    await prisma.teacherAvailability.createMany({
        data: [
            { teacherId: alice.id, dayOfWeek: 1, startTime: '15:00', endTime: '18:00' },
            { teacherId: bob.id, dayOfWeek: 3, startTime: '10:00', endTime: '12:00' },
        ],
        skipDuplicates: true,
    });
    const studentEmail = 'student@dance.local';
    const student = await prisma.user.upsert({
        where: { email: studentEmail },
        update: {},
        create: {
            email: studentEmail,
            passwordHash: await bcrypt.hash('student123', 10),
            name: 'Student One',
            role: 'STUDENT',
        },
    });
    await prisma.studentTeacherPermission.createMany({
        data: [
            { studentId: student.id, teacherId: alice.id },
            { studentId: student.id, teacherId: bob.id },
        ],
        skipDuplicates: true,
    });
    const now = new Date();
    const start = new Date(now.getTime() + 60 * 60 * 1000);
    const end = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    await prisma.lesson.create({ data: { teacherId: alice.id, startAt: start, endAt: end, capacity: 3 } });
    console.log('Seed completed. Admin:', admin.email, 'Student:', student.email);
}
main().catch(e => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map