import { useEffect, useMemo, useState } from "react";
import { Smile, Meh, Frown, Zap, Heart, X } from 'lucide-react';
import type { Note, Mood } from "@/types/note";
import { cn } from '@/lib/utils';

type NoteEditorProps = {
  isOpen: boolean;
  onClose: () => void;
  note: Note | null;
  onSave: (data: Partial<Note>) => void | Promise<void>;
};

// --------- HUMOR (PT-BR) ----------
const MOODS: Mood[] = ["feliz", "neutro", "triste", "animado", "deboa"];
const isMood = (m: any): m is Mood => MOODS.includes(m);

const MOOD_OPTIONS: Array<{
  value: Mood;
  label: string;
  icon: React.ReactNode;
  ring: string;
  bg: string;
  text: string;
}> = [
  { value: "feliz",   label: "feliz",   icon: <Smile className="w-4 h-4" />,  ring: "ring-yellow-400/50",  bg: "bg-yellow-500/15",  text: "text-yellow-300" },
  { value: "neutro",  label: "neutro",  icon: <Meh className="w-4 h-4" />,    ring: "ring-zinc-400/40",    bg: "bg-zinc-500/15",    text: "text-zinc-300" },
  { value: "triste",  label: "triste",  icon: <Frown className="w-4 h-4" />,  ring: "ring-blue-400/50",    bg: "bg-blue-500/15",    text: "text-blue-300" },
  { value: "animado", label: "animado", icon: <Zap className="w-4 h-4" />,    ring: "ring-pink-400/50",    bg: "bg-pink-500/15",    text: "text-pink-300" },
  { value: "deboa",   label: "deboa",   icon: <Heart className="w-4 h-4" />,  ring: "ring-emerald-400/50", bg: "bg-emerald-500/15", text: "text-emerald-300" },
];

export function NoteEditor({ isOpen, onClose, note, onSave }: NoteEditorProps) {
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [tagsText, setTagsText] = useState<string>("");
  const [mood, setMood] = useState<Mood | undefined>(undefined);
  const [attachments, setAttachments] = useState<any[]>([]);

  useEffect(() => {
    const t = note?.title ?? "";
    const c = note?.content ?? "";
    const tags = Array.isArray(note?.tags) ? note.tags : [];
    const m = isMood(note?.mood) ? (note!.mood as Mood) : undefined;
    const atts = Array.isArray(note?.attachments) ? note.attachments! : [];
    setTitle(t);
    setContent(c);
    setTagsText(tags.join(", "));
    setMood(m);
    setAttachments(atts);
  }, [note, isOpen]);

  const tagsArray = useMemo(
    () => tagsText.split(",").map(t => t.trim()).filter(Boolean),
    [tagsText]
  );

  const handleSubmit = async () => {
    const payload: Partial<Note> = {
      title: title.trim(),
      content,
      tags: tagsArray,
      mood,                  // 👈 salva o humor PT-BR
      attachments,
      updatedAt: new Date().toISOString(),
    };
    await onSave(payload);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-background p-5 shadow-lg border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{note ? "Editar nota" : "Nova nota"}</h2>
          <button onClick={onClose} className="px-2 py-1 rounded-lg hover:bg-muted">Fechar</button>
        </div>

        <div className="grid gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título"
            className="px-3 py-2 rounded-xl border bg-background"
          />

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Conteúdo"
            className="min-h-[160px] px-3 py-2 rounded-xl border bg-background"
          />

          <div className="grid sm:grid-cols-2 gap-3">
            <input
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="Tags (separe por vírgula)"
              className="px-3 py-2 rounded-xl border bg-background"
            />

            {/* 🔥 Seletor de humor com ícones */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Humor</span>
                {mood && (
                  <button
                    type="button"
                    onClick={() => setMood(undefined)}
                    className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                    aria-label="Limpar humor"
                  >
                    <X className="w-3 h-3" /> limpar
                  </button>
                )}
              </div>

              <div className="grid grid-cols-5 gap-2">
                {MOOD_OPTIONS.map(opt => {
                  const active = mood === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setMood(opt.value)}
                      className={cn(
                        "w-full rounded-xl px-2 py-2 border text-xs flex flex-col items-center gap-1 transition",
                        active
                          ? `border-transparent ring-2 ${opt.ring} ${opt.bg} ${opt.text}`
                          : "border-border hover:bg-muted/30"
                      )}
                      aria-pressed={active}
                      aria-label={`Humor ${opt.label}`}
                      title={opt.label}
                    >
                      {opt.icon}
                      <span className="capitalize">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Se não usar attachments, remova este bloco */}
          {/* <div className="flex items-center gap-2 text-sm">
            <button
              className="px-3 py-1.5 rounded-lg border"
              onClick={() => setAttachments((a) => [...a, { type: "file" }])}
            >
              + Anexo
            </button>
            <span className="text-muted-foreground">{attachments.length} anexo(s)</span>
          </div> */}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border">Cancelar</button>
          <button onClick={handleSubmit} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground">
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
  