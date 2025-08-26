import { Note, Mood } from '@/types/note';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Pin, PinOff, Trash2, Edit, Archive,
  Smile, Meh, Frown, Heart, Zap
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { cn } from '@/lib/utils';
import DOMPurify from 'dompurify';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleArchive: (id: string) => void;
}

const moodIcons: Record<Mood, React.ReactNode> = {
  feliz:   <Smile className="w-4 h-4" />,
  neutro:  <Meh className="w-4 h-4" />,
  triste:  <Frown className="w-4 h-4" />,
  animado: <Zap className="w-4 h-4" />,
  deboa:   <Heart className="w-4 h-4" />
};

const moodTone: Record<Mood, string> = {
  feliz:   'bg-yellow-500/20 text-yellow-300',
  neutro:  'bg-zinc-500/20 text-zinc-300',
  triste:  'bg-blue-500/20 text-blue-300',
  animado: 'bg-pink-500/20 text-pink-300',
  deboa:   'bg-emerald-500/20 text-emerald-300',
};

export function NoteCard({ note, onEdit, onDelete, onTogglePin, onToggleArchive }: NoteCardProps) {
  const id = note.id;
  const title = note.title ?? '';
  const content = note.content ?? '';
  const tags = Array.isArray(note.tags) ? note.tags : [];
  const mood = note.mood as Mood | undefined;

  const createdISO = note?.createdAt ?? note?.updatedAt ?? new Date().toISOString();
  const created = new Date(createdISO);
  const createdLabel = isNaN(created.getTime())
    ? ''
    : format(created, 'dd/MM/yyyy', { locale: ptBR });
  const relative = isNaN(created.getTime())
    ? ''
    : formatDistanceToNow(new Date(note.updatedAt ?? createdISO), {
        addSuffix: true,
        locale: ptBR,
      });

  const truncateContent = (text: string, maxLength = 150) =>
    text.length <= maxLength ? text : text.substring(0, maxLength) + '...';

  return (
    <Card
      className={cn(
        'group relative p-5 transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 bg-gradient-card border-border',
        note.pinned && 'border-primary shadow-glow'
      )}
    >
      {note.pinned && (
        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1.5 shadow-glow">
          <Pin className="w-3 h-3" />
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="text-sm text-muted-foreground">{createdLabel}</div>
            <h3 className="text-lg font-semibold text-foreground line-clamp-1">
              {title || 'Sem título'}
            </h3>
          </div>

          {mood && (
            <div
              className={cn(
                'px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1',
                moodTone[mood]
              )}
            >
              {moodIcons[mood]}
              <span className="capitalize hidden sm:inline">{mood}</span>
            </div>
          )}
        </div>

            <p
  className="text-muted-foreground text-sm line-clamp-3 prose prose-invert max-w-none"
  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(note.content || "Sem conteúdo...") }}
              />

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs bg-secondary/50 hover:bg-secondary"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <span className="text-xs text-muted-foreground">{relative}</span>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:text-primary"
              onClick={() => onEdit(note)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:text-primary"
              onClick={() => onTogglePin(id)}
            >
              {note.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:text-primary"
              onClick={() => onToggleArchive(id)}
            >
              <Archive className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:text-destructive"
              onClick={() => onDelete(id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
