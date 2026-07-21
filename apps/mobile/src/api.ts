export const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") || "http://192.168.100.3:8001";

export type Exam = {
  id: string;
  title: string;
  subject: string;
  answer_key_text: string;
  max_score: number;
  created_at: string;
};

export type HandwritingRating = "excellent" | "good" | "fair" | "poor";

export type GradeResult = {
  spelling_errors: { word: string; suggestion: string; context: string }[];
  grammar_issues: { text: string; suggestion: string; context: string }[];
  answer_feedback: {
    question_ref: string;
    expected: string;
    student: string;
    verdict: string;
    comment: string;
  }[];
  summary: string;
  auto_score: number | null;
  suggested_score: number | null;
  max_score: number | null;
  handwriting_max: number | null;
  ocr_provider_used?: string | null;
};

export type Job = {
  id: string;
  exam_id: string;
  status: string;
  status_message: string;
  ocr_text: string;
  grade_json: GradeResult | null;
  suggested_score: number | null;
  teacher_marks: number | null;
  teacher_note: string;
  ocr_provider_used: string;
  error: string | null;
  created_at: string;
  updated_at: string;
  image_urls: string[];
  exam_title: string | null;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers || {});
  // localtunnel interstitial bypass when using *.loca.lt
  if (API_URL.includes("loca.lt")) {
    headers.set("Bypass-Tunnel-Reminder", "true");
    headers.set("User-Agent", "ExamChecker/1.0");
  }
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ? JSON.stringify(body.detail) : detail;
    } catch {
      /* ignore */
    }
    throw new Error(`${res.status}: ${detail}`);
  }
  return res.json() as Promise<T>;
}

export function imageUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${API_URL}${path}`;
}

export const api = {
  health: () => request<{ ok: boolean; ocr_provider: string }>("/health"),

  listExams: () => request<Exam[]>("/exams"),

  createExam: (body: {
    title: string;
    subject?: string;
    answer_key_text?: string;
    max_score?: number;
  }) =>
    request<Exam>("/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  getExam: (id: string) => request<Exam>(`/exams/${id}`),

  updateExam: (
    id: string,
    body: Partial<{
      title: string;
      subject: string;
      answer_key_text: string;
      max_score: number;
    }>
  ) =>
    request<Exam>(`/exams/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  listJobs: (examId?: string) =>
    request<Job[]>(examId ? `/jobs?exam_id=${encodeURIComponent(examId)}` : "/jobs"),

  getJob: (id: string) => request<Job>(`/jobs/${id}`),

  createJob: async (examId: string, imageUris: string[]) => {
    const form = new FormData();
    form.append("exam_id", examId);
    imageUris.forEach((uri, index) => {
      const name = `page_${index + 1}.jpg`;
      form.append("images", {
        uri,
        name,
        type: "image/jpeg",
      } as unknown as Blob);
    });
    return request<Job>("/jobs", {
      method: "POST",
      body: form,
      // Let fetch set multipart boundary
    });
  },

  setMarks: (
    jobId: string,
    body: {
      handwriting_rating?: HandwritingRating;
      teacher_marks?: number;
      teacher_note?: string;
    }
  ) =>
    request<Job>(`/jobs/${jobId}/marks`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  regrade: (jobId: string, ocr_text: string) =>
    request<Job>(`/jobs/${jobId}/regrade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ocr_text }),
    }),
};
