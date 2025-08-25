import { useState, useEffect } from 'react';
import { Note } from '@/types/note';
import { storage } from '@/lib/storage';
import { Header } from '@/components/Header';
import { SearchBar } from '@/components/SearchBar';
import { NoteCard } from '@/components/NoteCard';
import { NoteEditor } from '@/components/NoteEditor';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { StickyNote } from 'lucide-react';

const Index = () => {
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  // Load notes on mount
  useEffect(() => {
    loadNotes();
  }, []);

  // Filter notes when search or tags change
  useEffect(() => {
    filterNotes();
  }, [notes, searchQuery, selectedTags, showArchived]);

  // Update available tags when notes change
  useEffect(() => {
    setAvailableTags(storage.getAllTags());
  }, [notes]);

  const loadNotes = () => {
    const loadedNotes = storage.getNotes();
    setNotes(loadedNotes);
  };

  const filterNotes = () => {
    let filtered = notes;
    
    // Filter by archived status
    filtered = filtered.filter(note => note.archived === showArchived);
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query)
      );
    }
    
    // Filter by selected tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(note =>
        selectedTags.every(tag => note.tags.includes(tag))
      );
    }
    
    // Sort by pinned first, then by updated date
    filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    
    setFilteredNotes(filtered);
  };

  const handleNewNote = () => {
    setEditingNote(null);
    setIsEditorOpen(true);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setIsEditorOpen(true);
  };

  const handleDeleteNote = (id: string) => {
    if (storage.deleteNote(id)) {
      loadNotes();
      toast({
        title: "Nota excluída",
        description: "A nota foi removida com sucesso",
      });
    }
  };

  const handleTogglePin = (id: string) => {
    const note = notes.find(n => n.id === id);
    if (note) {
      storage.updateNote(id, { pinned: !note.pinned });
      loadNotes();
      toast({
        title: note.pinned ? "Nota desafixada" : "Nota fixada",
        description: note.pinned ? "A nota foi removida dos destaques" : "A nota foi adicionada aos destaques",
      });
    }
  };

  const handleToggleArchive = (id: string) => {
    const note = notes.find(n => n.id === id);
    if (note) {
      storage.updateNote(id, { archived: !note.archived });
      loadNotes();
      toast({
        title: note.archived ? "Nota desarquivada" : "Nota arquivada",
        description: note.archived ? "A nota foi restaurada" : "A nota foi arquivada",
      });
    }
  };

  const handleSaveNote = () => {
    loadNotes();
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

        {filteredNotes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredNotes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={handleEditNote}
                onDelete={handleDeleteNote}
                onTogglePin={handleTogglePin}
                onToggleArchive={handleToggleArchive}
              />
            ))}
          </div>
        ) : (
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
        )}
      </main>

      <NoteEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        note={editingNote}
        onSave={handleSaveNote}
      />
    </div>
  );
};

export default Index;