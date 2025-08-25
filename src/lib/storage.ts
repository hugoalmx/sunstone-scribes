import { Note } from '@/types/note';

const STORAGE_KEY = 'diary_notes';

export const storage = {
  getNotes: (): Note[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading notes:', error);
      return [];
    }
  },

  saveNotes: (notes: Note[]): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  },

  createNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Note => {
    const newNote: Note = {
      ...note,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const notes = storage.getNotes();
    notes.unshift(newNote);
    storage.saveNotes(notes);
    
    return newNote;
  },

  updateNote: (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>): Note | null => {
    const notes = storage.getNotes();
    const index = notes.findIndex(n => n.id === id);
    
    if (index === -1) return null;
    
    notes[index] = {
      ...notes[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    storage.saveNotes(notes);
    return notes[index];
  },

  deleteNote: (id: string): boolean => {
    const notes = storage.getNotes();
    const filtered = notes.filter(n => n.id !== id);
    
    if (filtered.length === notes.length) return false;
    
    storage.saveNotes(filtered);
    return true;
  },

  searchNotes: (query: string, tags: string[] = []): Note[] => {
    const notes = storage.getNotes();
    const lowercaseQuery = query.toLowerCase();
    
    return notes.filter(note => {
      const matchesQuery = !query || 
        note.title.toLowerCase().includes(lowercaseQuery) ||
        note.content.toLowerCase().includes(lowercaseQuery);
      
      const matchesTags = tags.length === 0 ||
        tags.every(tag => note.tags.includes(tag));
      
      return matchesQuery && matchesTags && !note.archived;
    });
  },

  getAllTags: (): string[] => {
    const notes = storage.getNotes();
    const tagsSet = new Set<string>();
    
    notes.forEach(note => {
      note.tags.forEach(tag => tagsSet.add(tag));
    });
    
    return Array.from(tagsSet).sort();
  }
};