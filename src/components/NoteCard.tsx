import { Note, Mood } from '@/types/note';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Pin, 
  PinOff, 
  Trash2, 
  Edit, 
  Archive,
  Smile,
  Meh,
  Frown,
  Heart,
  Zap,
  Link,
  Image,
  FileText
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleArchive: (id: string) => void;
}

const moodIcons: Record<NonNullable<Mood>, React.ReactNode> = {
  happy: <Smile className="w-4 h-4" />,
  neutral: <Meh className="w-4 h-4" />,
  sad: <Frown className="w-4 h-4" />,
  excited: <Zap className="w-4 h-4" />,
  calm: <Heart className="w-4 h-4" />
};

const attachmentIcons = {
  image: <Image className="w-3 h-3" />,
  link: <Link className="w-3 h-3" />,
  file: <FileText className="w-3 h-3" />
};

export function NoteCard({ note, onEdit, onDelete, onTogglePin, onToggleArchive }: NoteCardProps) {
  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <Card 
      className={cn(
        "group relative p-5 transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 bg-gradient-card border-border",
        note.pinned && "border-primary shadow-glow"
      )}
    >
      {note.pinned && (
        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1.5 shadow-glow">
          <Pin className="w-3 h-3" />
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold text-foreground line-clamp-1 flex-1">
            {note.title || 'Untitled Note'}
          </h3>
          {note.mood && (
            <div className={cn(
              "p-1.5 rounded-lg",
              `bg-mood-${note.mood}/20 text-mood-${note.mood}`
            )}>
              {moodIcons[note.mood]}
            </div>
          )}
        </div>

        <p className="text-muted-foreground text-sm line-clamp-3">
          {truncateContent(note.content) || 'No content...'}
        </p>

        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {note.tags.map(tag => (
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

        {note.attachments.length > 0 && (
          <div className="flex items-center gap-2 text-muted-foreground">
            {note.attachments.slice(0, 3).map((attachment, idx) => (
              <div key={idx} className="flex items-center gap-1 text-xs">
                {attachmentIcons[attachment.type]}
              </div>
            ))}
            {note.attachments.length > 3 && (
              <span className="text-xs">+{note.attachments.length - 3}</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
          </span>

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
              onClick={() => onTogglePin(note.id)}
            >
              {note.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:text-primary"
              onClick={() => onToggleArchive(note.id)}
            >
              <Archive className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:text-destructive"
              onClick={() => onDelete(note.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}