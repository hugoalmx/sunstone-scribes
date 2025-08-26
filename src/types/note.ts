export type Mood = 'feliz' | 'neutro' | 'triste' | 'animado' | 'deboa';

export type Attachment = {
  type: 'image' | 'link' | 'file';
  url?: string;
  name?: string;
};

export type Note = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  attachments?: Attachment[];   // opcional
  archived: boolean;
  pinned: boolean;
  mood?: Mood;                  // opcional
  createdAt?: string;           // opcional
  updatedAt?: string;           // opcional
};
