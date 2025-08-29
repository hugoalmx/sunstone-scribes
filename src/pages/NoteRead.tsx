import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Printer, Share2, Pencil, Link as LinkIcon,
  Smile, Meh, Frown, Zap, Heart, Settings2, Check, X
} from "lucide-react";
import type { Note, Mood } from "@/types/note";
import { getNoteById, storage } from "@/lib/storage";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { progressLabel, progressColorClass } from "@/lib/progress";
import ReactQuill from "react-quill";

// Quill (mesma config do seu editor)
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

const moodIcon: Record<Mood, any> = {
  feliz: Smile, neutro: Meh, triste: Frown, animado: Zap, deboa: Heart,
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

function readingTimeFromHtml(html: string) {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const words = text ? text.split(" ").length : 0;
  return `${Math.max(1, Math.round(words / 200))} min de leitura`;
}

export default function NoteRead() {
  const params = useParams();
  // aceita /note/:id OU /note/:_id
  const id = (params as any).id ?? (params as any)._id ?? "";
  const navigate = useNavigate();

  const [note, setNote] = useState<Note | null>(null);
  const [html, setHtml] = useState("");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  // edição inline
  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [contentDraft, setContentDraft] = useState("");
  const [moodDraft, setMoodDraft] = useState<Mood | undefined>(undefined);

  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        const n = await getNoteById(id);
        setNote(n);
        setHtml(DOMPurify.sanitize(n.content));
        setTitleDraft(n.title ?? "");
        setContentDraft(n.content ?? "");
        setMoodDraft(n.mood as Mood | undefined);
      } catch {
        setNote(null);
        setHtml("");
      }
    })();
  }, [id]);

  const readingTime = useMemo(() => readingTimeFromHtml(html), [html]);
  const p = (note?.progress ?? 0) as 0|25|50|75|100;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  const changeProgress = async (val: 0|25|50|75|100) => {
    if (!note) return;
    setSaving(true);
    try {
      const updated = await storage.updateNote((note as any)._id ?? (note as any).id, { progress: val } as any);
      setNote(updated as Note);
    } finally {
      setSaving(false);
    }
  };

  // entrar/sair/salvar edição
  const enterEdit = () => {
    if (!note) return;
    setTitleDraft(note.title ?? "");
    setContentDraft(note.content ?? "");
    setMoodDraft(note.mood as Mood | undefined);
    setEditing(true);
  };

  const cancelEdit = () => {
    setTitleDraft(note?.title ?? "");
    setContentDraft(note?.content ?? "");
    setMoodDraft(note?.mood as Mood | undefined);
    setEditing(false);
  };

  const saveEdit = async () => {
    if (!note) return;
    setSaving(true);
    try {
      const updated = await storage.updateNote((note as any)._id ?? (note as any).id, {
        title: titleDraft.trim(),
        content: contentDraft,
        mood: moodDraft,
      } as any);
      setNote(updated as Note);
      setHtml(DOMPurify.sanitize((updated as any).content ?? ""));
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (!note) {
    return (
      <div className="container mx-auto p-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <p className="text-muted-foreground">Nota não encontrada.</p>
      </div>
    );
  }

  const Icon = moodIcon[(editing ? (moodDraft ?? note.mood) : note.mood) as Mood];

  return (
    <div className="min-h-screen">
      {/* barra de progresso de leitura */}
      <div id="read-progress" aria-hidden className="fixed top-0 left-0 right-0 h-1 bg-transparent z-40">
        <div className="h-full bg-primary/70 transition-[width] duration-150" style={{ width: "var(--w, 0%)" }} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-6 print:px-0">
        {/* actions */}
        <div className="mb-6 flex items-center justify-between print:hidden">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>

          {!editing ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" /> Imprimir
              </Button>
              <Button variant="outline" onClick={() => (navigator as any).share?.({ title: note.title, url: window.location.href })}>
                <Share2 className="mr-2 h-4 w-4" /> Compartilhar
              </Button>
              <Button variant="outline" onClick={copyLink} className={copied ? "border-green-500 text-green-600" : ""}>
                <LinkIcon className="mr-2 h-4 w-4" /> {copied ? "Link copiado" : "Copiar link"}
              </Button>
              <Button onClick={enterEdit}>
                <Pencil className="mr-2 h-4 w-4" /> Editar
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={cancelEdit} disabled={saving}>
                <X className="mr-2 h-4 w-4" /> Cancelar
              </Button>
              <Button onClick={saveEdit} disabled={saving}>
                <Check className="mr-2 h-4 w-4" /> Salvar
              </Button>
            </div>
          )}
        </div>

        {/* header */}
        <header className="mx-auto mb-6 max-w-3xl">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            {Icon && <Icon className="h-4 w-4" aria-hidden />}
            <span className="sr-only">Humor:</span>
            <span className="capitalize">{editing ? (moodDraft ?? note.mood) : note.mood}</span>
            <span>•</span>
            <time dateTime={note.updatedAt || note.createdAt!}>
              {new Date(note.updatedAt || note.createdAt!).toLocaleString()}
            </time>
            <span>•</span>
            <span>{readingTime}</span>
          </div>

          {!editing ? (
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{note.title}</h1>
          ) : (
            <input
              className="w-full bg-transparent text-3xl sm:text-4xl font-bold tracking-tight outline-none border-b border-border/40 focus:border-primary/50 pb-1"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              placeholder="Título"
              autoFocus
            />
          )}

          {/* tags somente em leitura (mantive como estava) */}
          {!!note.tags?.length && !editing && (
            <div className="mt-3 flex flex-wrap gap-2">
              {note.tags.map((t) => (
                <Badge key={t} variant="secondary">#{t}</Badge>
              ))}
            </div>
          )}
        </header>

        {/* HUMOR inline quando editando */}
        {editing && (
          <section className="mx-auto mb-6 max-w-3xl">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Humor</span>
              {moodDraft && (
                <button
                  type="button"
                  onClick={() => setMoodDraft(undefined)}
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> limpar
                </button>
              )}
            </div>
            <div className="grid grid-cols-5 gap-2">
              {MOOD_OPTIONS.map(opt => {
                const active = moodDraft === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMoodDraft(opt.value)}
                    className={[
                      "w-full rounded-xl px-2 py-2 border text-xs flex flex-col items-center gap-1 transition",
                      active
                        ? `border-transparent ring-2 ${opt.ring} ${opt.bg} ${opt.text}`
                        : "border-border hover:bg-muted/30",
                    ].join(" ")}
                    aria-pressed={active}
                    title={opt.label}
                  >
                    {opt.icon}
                    <span className="capitalize">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* PROGRESSO */}
        <section className="mx-auto mb-8 max-w-3xl">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Status: {progressLabel(p)}</span>
            <div className="flex items-center gap-2">
              <span>{p}%</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" disabled={saving}>
                    <Settings2 className="w-4 h-4 mr-2" />
                    Alterar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => changeProgress(0)}>Em aberto (0%)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeProgress(25)}>Iniciado (25%)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeProgress(50)}>Em progresso (50%)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeProgress(75)}>Ajustes finais (75%)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeProgress(100)}>Concluído (100%)</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="relative">
            <Progress value={p} className="h-2 [&>div]:bg-transparent" />
            <div
              className={`absolute left-0 top-0 h-2 rounded-full transition-all ${progressColorClass(p)} ${saving ? "animate-pulse" : ""}`}
              style={{ width: `${p}%` }}
              role="progressbar"
              aria-valuenow={p}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progresso ${p}% - ${progressLabel(p)}`}
            />
          </div>
        </section>

        {/* conteúdo: leitura vs edição */}
        {!editing ? (
          <article
            id="note-article"
            className="prose prose-neutral max-w-3xl mx-auto dark:prose-invert prose-headings:scroll-mt-24 prose-a:text-primary prose-code:text-primary"
          >
            <div
              className="text-foreground text-base leading-7"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </article>
        ) : (
          <div className="max-w-3xl mx-auto rounded-xl border overflow-hidden">
            <ReactQuill
              theme="bubble"
              value={contentDraft}
              onChange={setContentDraft}
              modules={quillModules}
              formats={quillFormats}
              className="min-h-[260px] [&_.ql-container]:min-h-[220px] [&_.ql-toolbar]:bg-muted/30"
            />
          </div>
        )}
      </div>
    </div>
  );
}
