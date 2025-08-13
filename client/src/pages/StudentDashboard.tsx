import { useEffect, useState } from 'react';
import { api } from '../api';
import dayjs from 'dayjs';

export default function StudentDashboard() {
  const [lessons, setLessons] = useState<any[]>([]);
  const [mine, setMine] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const [ls, me] = await Promise.all([api.getLessons(), api.myEnrollments()]);
      setLessons(ls);
      setMine(me);
    } catch (e: any) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function enroll(id: number) {
    await api.enroll(id);
    await load();
  }
  async function unenroll(id: number) {
    await api.unenroll(id);
    await load();
  }

  const mineSet = new Set(mine.map(m => m.lessonId));

  return (
    <div style={{ padding: 20 }}>
      <h2>Lezioni</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul>
        {lessons.map(l => (
          <li key={l.id} style={{ marginBottom: 8 }}>
            {dayjs(l.startAt).format('DD/MM HH:mm')} - {dayjs(l.endAt).format('HH:mm')} | Docente: {l.teacher?.name} |
            Capienza: {l.capacity} | Iscritti: {l.enrollments.length}
            {mineSet.has(l.id) ? (
              <button onClick={() => unenroll(l.id)} style={{ marginLeft: 8 }}>Ritirati</button>
            ) : (
              <button onClick={() => enroll(l.id)} style={{ marginLeft: 8 }}>Iscriviti</button>
            )}
          </li>
        ))}
      </ul>
      <h3>Le mie prenotazioni</h3>
      <ul>
        {mine.map(m => (
          <li key={m.id}>{dayjs(m.lesson.startAt).format('DD/MM HH:mm')} - {m.lesson.teacher?.name}</li>
        ))}
      </ul>
    </div>
  );
}