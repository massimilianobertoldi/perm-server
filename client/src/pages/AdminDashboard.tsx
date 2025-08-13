import { useEffect, useState } from 'react';
import { api } from '../api';
import dayjs from 'dayjs';

export default function AdminDashboard() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const [ts, ls] = await Promise.all([api.getTeachers(), api.getLessons()]);
      setTeachers(ts);
      setLessons(ls);
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Admin</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <h3>Insegnanti</h3>
      <ul>
        {teachers.map(t => (
          <li key={t.id}>{t.name} (max {t.maxStudentsPerLesson})</li>
        ))}
      </ul>
      <h3>Lezioni</h3>
      <ul>
        {lessons.map(l => (
          <li key={l.id}>{dayjs(l.startAt).format('DD/MM HH:mm')} - {l.teacher?.name} ({l.enrollments.length}/{l.capacity})</li>
        ))}
      </ul>
    </div>
  );
}