import { useEffect, useMemo, useState } from "react";
import ReactQuill from "react-quill";
import { Smile, Meh, Frown, Zap, Heart, X, Settings2 } from "lucide-react";
import type { Note, Mood } from "@/types/note";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { progressLabel, progressColorClass } from "@/lib/progress";

type NoteEditorProps = {
  isOpen: boolean;
  onClose: () => void;
  note: Note | null;
  onSave: (data: Partial<Note>) => void | Promise<void>;
};

const MOOD_OPTIONS: Array<{
  value: Mood; label: string; icon: React.ReactNode; ring: string; bg: string; text: string;
}> = [
  { value: "feliz",   label: "feliz",   icon: <Smile className="w-4 h-4" />,  ring: "ring-yellow-400/50",  bg: "bg-yellow-500/15",  text: "text-yellow-300" },
  { value: "neutro",  label: "neutro",  icon: <Meh className="w-4 h-4" />,    ring: "ring-zinc-400/40",    bg: "bg-zinc-500/15",    text: "text-zinc-300" },
  { value: "triste",  label: "triste",  icon: <Frown className="w-4 h-4" />,  ring: "ring-blue-400/50",    bg: "bg-blue-500/15",    text: "text-blue-300" },
  { value: "animado", label: "animado", icon: <Zap className="w-4 h-4" />,    ring: "ring-pink-400/50",    bg: "bg-pink-500/15",    text: "text-pink-300" },
  { value: "deboa",   label: "deboa",   icon: <Heart className="w-4 h-4" />,  ring: "ring-emerald-400/50", bg: "bg-emerald-500/15", text: "text-emerald-300" },
];

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    ["link", "image"],
    ["clean"],
  ],
};
const quillFormats = [
  "header","bold","italic","underline","strike","list","bullet","align","link","image"
];

export function NoteEditor({ isOpen, onClose, note, onSave }: NoteEditorProps) {
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>(""); // HTML do Quill
  const [tagsText, setTagsText] = useState<string>("");
  const [mood, setMood] = useState<Mood | undefined>(undefined);
  const [progress, setProgress] = useState<0|25|50|75|100>(0);

  // carrega dados quando abrir/nota mudar
  useEffect(() => {
    const t = note?.title ?? "";
    const c = note?.content ?? "";
    const tags = Array.isArray(note?.tags) ? note.tags : [];
    const m = note?.mood as Mood | undefined;
    const p = ([0,25,50,75,100].includes(Number(note?.progress)) ? Number(note?.progress) : 0) as 0|25|50|75|100;

    setTitle(t);
    setContent(c);
    setTagsText(tags.join(", "));
    setMood(m);
    setProgress(p);
  }, [note, isOpen]);

  const tagsArray = useMemo(
    () => tagsText.split(",").map(t => t.trim()).filter(Boolean),
    [tagsText]
  );

  const handleSubmit = async () => {
    const payload: Partial<Note> = {
      title: title.trim(),
      content,            // HTML do Quill
      tags: tagsArray,
      mood,
      progress,           // 👈 salva o progresso
      updatedAt: new Date().toISOString(),
    };
    await onSave(payload);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-background p-5 shadow-lg border">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{note ? "Editar nota" : "Nova nota"}</h2>
          <Button variant="ghost" onClick={onClose} className="h-8 px-2">
            Fechar
          </Button>
        </div>

        <div className="grid gap-4">
          {/* Título */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título"
            className="px-3 py-2 rounded-xl border bg-background"
          />

          {/* Editor Quill */}
          <div className="rounded-xl border overflow-hidden">
            <ReactQuill
              theme="bubble"
              value={content}
              onChange={setContent}
              modules={quillModules}
              formats={quillFormats}
              className="min-h-[220px] [&_.ql-container]:min-h-[180px] [&_.ql-toolbar]:bg-muted/30"
            />
          </div>

          {/* Tags */}
          <input
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="Tags (separe por vírgula)"
            className="px-3 py-2 rounded-xl border bg-background"
          />

          {/* Humor */}
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

          {/* Progresso */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Progresso</span>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{progressLabel(progress)} • {progress}%</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Settings2 className="w-4 h-4 mr-2" />
                      Alterar
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setProgress(0)}>Em aberto (0%)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setProgress(25)}>Iniciado (25%)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setProgress(50)}>Em progresso (50%)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setProgress(75)}>Ajustes finais (75%)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setProgress(100)}>Concluído (100%)</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Barra (shadcn) com overlay colorido por status */}
            <div className="relative">
              <Progress value={progress} className="h-2 [&>div]:bg-transparent" />
              <div
                className={`absolute left-0 top-0 h-2 rounded-full transition-all ${progressColorClass(progress)}`}
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progresso ${progress}% - ${progressLabel(progress)}`}
              />
            </div>

            {/* Botões rápidos (opcional) */}
            <div className="flex flex-wrap gap-2">
              {[0,25,50,75,100].map(v => (
                <Button
                  key={v}
                  type="button"
                  size="sm"
                  variant={progress === v ? "default" : "outline"}
                  onClick={() => setProgress(v as 0|25|50|75|100)}
                >
                  {progressLabel(v)} ({v}%)
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} className="bg-primary text-primary-foreground">
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}
