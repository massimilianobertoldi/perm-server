export type Role = 'ADMIN' | 'STUDENT';
export type User = { id: number; email: string; name: string; role: Role };

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function getToken() {
  return localStorage.getItem('token');
}

function setToken(token: string | null) {
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
  return res.json();
}

export const api = {
  setToken,
  async login(email: string, password: string) {
    const data = await request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    return data.user;
  },
  async register(name: string, email: string, password: string) {
    return request<User>('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
  },
  async getTeachers() {
    return request<any[]>('/teachers');
  },
  async getLessons(params?: { teacherId?: number; from?: string; to?: string }) {
    const qs = new URLSearchParams();
    if (params?.teacherId) qs.set('teacherId', String(params.teacherId));
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    const qp = qs.toString() ? `?${qs.toString()}` : '';
    return request<any[]>(`/lessons${qp}`);
  },
  async enroll(lessonId: number) {
    return request('/lessons/enroll', { method: 'POST', body: JSON.stringify({ lessonId }) });
  },
  async unenroll(lessonId: number) {
    return request('/lessons/unenroll', { method: 'POST', body: JSON.stringify({ lessonId }) });
  },
  async myEnrollments() {
    return request<any[]>('/lessons/me/enrollments');
  },
};