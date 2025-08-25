export type Mood = 'happy' | 'neutral' | 'sad' | 'excited' | 'calm' | null;

export interface Attachment {
  type: 'image' | 'link' | 'file';
  url: string;
  caption?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  mood: Mood;
  pinned: boolean;
  archived: boolean;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface NotesState {
  notes: Note[];
  searchQuery: string;
  selectedTags: string[];
  selectedMood: Mood;
}