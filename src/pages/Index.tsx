import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from "react-router-dom";

import { Note, Mood } from '@/types/note';
import { storage } from '@/lib/storage';
import { Header } from '@/components/Header';
import { SearchBar } from '@/components/SearchBar';
import { NoteCard } from '@/components/NoteCard';
import { NoteEditor } from '@/components/NoteEditor';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { StickyNote } from 'lucide-react';
import { Smile, Meh, Frown, Zap, Heart } from "lucide-react";
import { cn } from "@/lib/utils"; // se você já usa, mantenha





const Index = () => {
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedMood, setSelectedMood] = useState<Mood | undefined>(undefined);    

  const isMood = (m: any): m is Mood => ['feliz','neutro','triste','animado','deboa'].includes(m);

  // ✅ Normaliza cada nota vinda da API
  const normalizeNote = (n: any): Note => ({
    id: n.id ?? n._id ?? crypto.randomUUID(),
    title: n.title ?? "",
    content: n.content ?? "",
    tags: Array.isArray(n.tags) ? n.tags : [],
    attachments: Array.isArray(n.attachments) ? n.attachments : [],
    archived: !!n.archived,
    pinned: !!n.pinned,
    mood: isMood(n.mood) ? n.mood : 'neutro',
    createdAt: n.createdAt ?? n.created_at,
    updatedAt: n.updatedAt ?? n.updated_at ?? new Date().toISOString(),
    progress: (n.progress ?? 0) as 0 | 25 | 50 | 75 | 100,
  });

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    for (const n of notes) n.tags?.forEach(t => set.add(t));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [notes]);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await storage.getNotes({
        archived: showArchived,
        q: searchQuery || undefined,
        tags: selectedTags.length ? selectedTags : undefined,
        mood: selectedMood || undefined,
      });
      const normalized = raw.map(normalizeNote);
      setNotes(normalized);

      const sorted = [...normalized].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime();
      });
      setFilteredNotes(sorted);
    } catch (e: any) {
      console.error(e);
      toast({
        title: 'Erro ao carregar notas',
        description: e?.message ?? String(e),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [showArchived, searchQuery, selectedMood, selectedTags, toast]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
  const st = location.state as { editId?: string } | null
  if (!st?.editId) return

  ;(async () => {
    let n = notes.find(x => x.id === st.editId)

    if (!n) {
      try {
        const raw = await storage.getNotes({})
        const hit = raw.find((r: any) => r._id === st.editId || r.id === st.editId)
        if (hit) n = normalizeNote(hit)
      } catch {}
    }

    if (n) handleEditNote(n)
    navigate(".", { replace: true, state: null })
  })()
}, [location.state, notes])


  const handleNewNote = () => {
    setEditingNote(null);
    setIsEditorOpen(true);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setIsEditorOpen(true);
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await storage.deleteNote(id);
      await loadNotes();
      toast({ title: 'Nota excluída', description: 'A nota foi removida com sucesso' });
    } catch (e) {
      toast({ title: 'Erro ao excluir', description: String(e), variant: 'destructive' });
    }
  };

  const handleTogglePin = async (id: string) => {
    try {
      await storage.togglePin(id);
      await loadNotes();
      toast({ title: 'Fixação alterada' });
    } catch (e) {
      toast({ title: 'Erro ao fixar/desafixar', description: String(e), variant: 'destructive' });
    }
  };

  const handleToggleArchive = async (id: string) => {
    try {
      await storage.toggleArchive(id);
      await loadNotes();
      toast({ title: showArchived ? 'Nota desarquivada' : 'Nota arquivada' });
    } catch (e) {
      toast({ title: 'Erro ao arquivar/desarquivar', description: String(e), variant: 'destructive' });
    }
  };

  const handleSaveNote = async () => {
    await loadNotes();
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header
        onNewNote={handleNewNote}
        showArchived={showArchived}
        onToggleArchived={() => setShowArchived(!showArchived)}
        notesCount={notes.filter(n => !n.archived).length}
      />

      <main className="container mx-auto px-4 py-6 space-y-6">
        <SearchBar
          onSearch={setSearchQuery}
          onTagFilter={setSelectedTags}
          availableTags={availableTags}
          selectedTags={selectedTags}
        />

        <MoodFilter
          value={selectedMood}
          onChange={setSelectedMood}
        />

        {loading && <div className="text-sm text-muted-foreground">Carregando notas…</div>}

        {filteredNotes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredNotes.map(note => (
              <NoteCard
                key={(note as any).id ?? (note as any)._id ?? `${note.title}-${note.updatedAt}`}
                note={note}
                onEdit={handleEditNote}
                onDelete={handleDeleteNote}
                onTogglePin={handleTogglePin}
                onToggleArchive={handleToggleArchive}
              />
            ))}
          </div>
        ) : (
          !loading && (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="bg-gradient-primary p-6 rounded-full shadow-glow">
                <StickyNote className="w-16 h-16 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground">
                {showArchived ? "Nenhuma nota arquivada" : "Nenhuma nota encontrada"}
              </h2>
              <p className="text-muted-foreground text-center max-w-md">
                {searchQuery || selectedTags.length > 0
                  ? "Tente ajustar seus filtros de busca"
                  : showArchived
                  ? "Suas notas arquivadas aparecerão aqui"
                  : "Comece criando sua primeira nota"}
              </p>
              {!showArchived && !searchQuery && selectedTags.length === 0 && (
                <Button
                  onClick={handleNewNote}
                  className="gap-2 bg-gradient-primary shadow-glow hover:shadow-elevated hover:scale-105 transition-all duration-300"
                >
                  Criar primeira nota
                </Button>
              )}
            </div>
          )
        )}
      </main>

      <NoteEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        note={editingNote}
        onSave={async (data) => {
          if (editingNote?.id) {
            await storage.updateNote(editingNote.id, data);
          } else {
            await storage.createNote({
              title: data.title ?? "",
              content: data.content ?? "",
              tags: data.tags ?? [],
              mood: data.mood,
              attachments: data.attachments ?? [],
            });
          }
          await loadNotes();
        }}
      />
    </div>
  );
};


type MoodOption = { value: Mood; label: string; icon: React.ReactNode; tone: string };

const MOOD_OPTIONS: MoodOption[] = [
  { value: "feliz",   label: "feliz",   icon: <Smile className="w-4 h-4" />,  tone: "bg-yellow-500/15 text-yellow-300 ring-yellow-400/50" },
  { value: "neutro",  label: "neutro",  icon: <Meh className="w-4 h-4" />,    tone: "bg-zinc-500/15 text-zinc-300 ring-zinc-400/40" },
  { value: "triste",  label: "triste",  icon: <Frown className="w-4 h-4" />,  tone: "bg-blue-500/15 text-blue-300 ring-blue-400/50" },
  { value: "animado", label: "animado", icon: <Zap className="w-4 h-4" />,    tone: "bg-pink-500/15 text-pink-300 ring-pink-400/50" },
  { value: "deboa",   label: "deboa",   icon: <Heart className="w-4 h-4" />,  tone: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/50" },
];

function MoodFilter({
  value,
  onChange,
}: {
  value?: Mood;
  onChange: (m?: Mood) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Chip "Todos" */}
      <button
        type="button"
        onClick={() => onChange(undefined)}
        className={cn(
          "px-3 py-1.5 rounded-full text-xs border transition",
          value === undefined
            ? "bg-primary text-primary-foreground border-transparent"
            : "border-border hover:bg-muted/30"
        )}
      >
        Todos
      </button>

      {MOOD_OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(active ? undefined : opt.value)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs border flex items-center gap-1 transition",
              active
                ? `border-transparent ring-2 ${opt.tone}`
                : "border-border hover:bg-muted/30"
            )}
            aria-pressed={active}
            title={`Humor ${opt.label}`}
          >
            {opt.icon}
            <span className="capitalize">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
export default Index;
