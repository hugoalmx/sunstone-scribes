import type { Mood, Note } from "@/types/note";

export interface StorageAPI {
  getNotes(params?: { q?: string; tags?: string[]; archived?: boolean;  mood?: Mood; }): Promise<Note[]>;
  createNote(data: Pick<Note, "title" | "content" | "tags"> & Partial<Pick<Note, "mood" | "attachments">>): Promise<Note>;
  updateNote(id: string, patch: Partial<Note>): Promise<Note>;
  deleteNote(id: string): Promise<void>;
  togglePin(id: string): Promise<Note>;
  toggleArchive(id: string): Promise<Note>;
  getAllTags(): Promise<string[]>;
   
}

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

// 🔎 debug: ver no console do site qual API está sendo usada
if (typeof window !== "undefined") {
  // só loga uma vez
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__API = API;
  // use console.info pra ficar fácil de achar
  // comente depois do diagnóstico
  console.info("[Sunstone] VITE_API_URL em runtime:", API);
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API}${path}`;
  try {
    const res = await fetch(url, init);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} @ ${url}`);
    return (await res.json()) as T;
  } catch (err) {
    console.error("[Sunstone] Fetch falhou:", url, err);
    throw err;
  }
}



export async function getNoteById(id: string) {
  const res = await fetch(`${API}/notes/${id}`)
  if (!res.ok) throw new Error("Nota não encontrada")
  return (await res.json()) as Note;
}

export const storage: StorageAPI = {
  async getNotes(params) {
    const qp = new URLSearchParams();
    if (params?.q) qp.set("q", params.q);
    if (params?.mood) qp.set("mood", params.mood);
    if (params?.archived !== undefined) qp.set("archived", String(params.archived));
    if (params?.tags?.length) qp.set("tags", params.tags.join(","));
    const res = await fetch(`${API}/notes?${qp.toString()}`);
    if (!res.ok) throw new Error("Erro ao listar notas");
    return res.json();

  },
  

  

  async createNote(data) {
      const plain = (html = '') =>
     String(html)
       .replace(/<[^>]*>/g, ' ')
       .replace(/&nbsp;/g, ' ')
       .replace(/\s+/g, ' ')
       .trim();
   if (!data?.content || plain(data.content).length === 0) {
     throw new Error('Conteúdo não pode ser vazio');
   }
    const res = await fetch(`${API}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Erro ao criar nota");
    return res.json();
  },

  async updateNote(id, patch) {
    const res = await fetch(`${API}/notes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error("Erro ao atualizar nota");
    return res.json();
  },

  async deleteNote(id) {
    const res = await fetch(`${API}/notes/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Erro ao excluir nota");
  },

  async togglePin(id) {
    const res = await fetch(`${API}/notes/${id}/pin`, { method: "PATCH" });
    if (!res.ok) throw new Error("Erro ao fixar/desafixar");
    return res.json();
  },

  async toggleArchive(id) {
    const res = await fetch(`${API}/notes/${id}/archive`, { method: "PATCH" });
    if (!res.ok) throw new Error("Erro ao arquivar/desarquivar");
    return res.json();
  },

  async getAllTags() {
    const res = await fetch(`${API}/tags`);
    if (!res.ok) throw new Error("Erro ao obter tags");
    return res.json();
  },

}





