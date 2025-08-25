import { useState, useEffect, useCallback } from 'react';
import { Note, Mood, Attachment } from '@/types/note';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  X, 
  Hash, 
  Smile, 
  Meh, 
  Frown, 
  Zap, 
  Heart,
  Link,
  Image as ImageIcon,
  FileText,
  Plus,
  Save
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { storage } from '@/lib/storage';
import { useToast } from '@/components/ui/use-toast';

interface NoteEditorProps {
  isOpen: boolean;
  onClose: () => void;
  note?: Note | null;
  onSave: () => void;
}

const moods: { value: Mood; icon: React.ReactNode; label: string }[] = [
  { value: 'happy', icon: <Smile className="w-5 h-5" />, label: 'Happy' },
  { value: 'neutral', icon: <Meh className="w-5 h-5" />, label: 'Neutral' },
  { value: 'sad', icon: <Frown className="w-5 h-5" />, label: 'Sad' },
  { value: 'excited', icon: <Zap className="w-5 h-5" />, label: 'Excited' },
  { value: 'calm', icon: <Heart className="w-5 h-5" />, label: 'Calm' },
];

export function NoteEditor({ isOpen, onClose, note, onSave }: NoteEditorProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [mood, setMood] = useState<Mood>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentType, setAttachmentType] = useState<Attachment['type']>('link');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags);
      setMood(note.mood);
      setAttachments(note.attachments);
    } else {
      resetForm();
    }
  }, [note]);

  // Autosave
  useEffect(() => {
    if (!isOpen || !note) return;

    const timer = setTimeout(() => {
      handleSave(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [title, content, tags, mood, attachments]);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setTags([]);
    setTagInput('');
    setMood(null);
    setAttachments([]);
    setAttachmentUrl('');
  };

  const handleSave = useCallback(async (isAutosave = false) => {
    if (!title.trim() && !content.trim()) {
      if (!isAutosave) {
        toast({
          title: "Cannot save empty note",
          description: "Please add a title or content",
          variant: "destructive"
        });
      }
      return;
    }

    setIsSaving(true);
    
    try {
      const noteData = {
        title,
        content,
        tags,
        mood,
        attachments,
        pinned: note?.pinned || false,
        archived: note?.archived || false
      };

      if (note) {
        storage.updateNote(note.id, noteData);
      } else {
        storage.createNote(noteData);
      }

      if (!isAutosave) {
        toast({
          title: note ? "Note updated" : "Note created",
          description: isAutosave ? "Autosaved" : "Your note has been saved successfully"
        });
        onSave();
        onClose();
        resetForm();
      }
    } catch (error) {
      toast({
        title: "Error saving note",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  }, [title, content, tags, mood, attachments, note, onSave, onClose, toast]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleAddAttachment = () => {
    if (attachmentUrl.trim()) {
      setAttachments([...attachments, { type: attachmentType, url: attachmentUrl.trim() }]);
      setAttachmentUrl('');
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl text-foreground">
            {note ? 'Edit Note' : 'New Note'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Input
              placeholder="Note title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-semibold bg-background border-input"
            />
          </div>

          <div>
            <Textarea
              placeholder="Write your thoughts..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px] bg-background border-input resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Mood</Label>
            <div className="flex gap-2">
              {moods.map(({ value, icon, label }) => (
                <Button
                  key={value}
                  type="button"
                  variant={mood === value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMood(mood === value ? null : value)}
                  className={cn(
                    "gap-2",
                    mood === value && `bg-mood-${value} hover:bg-mood-${value}/90 text-white border-transparent`
                  )}
                >
                  {icon}
                  <span className="hidden sm:inline">{label}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Tags</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 bg-background border-input"
              />
              <Button type="button" onClick={handleAddTag} size="icon" variant="outline">
                <Hash className="w-4 h-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    #{tag}
                    <X 
                      className="w-3 h-3 cursor-pointer hover:text-destructive" 
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Attachments</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add URL..."
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                className="flex-1 bg-background border-input"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setAttachmentType('link')}
                className={attachmentType === 'link' ? 'bg-primary text-primary-foreground' : ''}
              >
                <Link className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setAttachmentType('image')}
                className={attachmentType === 'image' ? 'bg-primary text-primary-foreground' : ''}
              >
                <ImageIcon className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setAttachmentType('file')}
                className={attachmentType === 'file' ? 'bg-primary text-primary-foreground' : ''}
              >
                <FileText className="w-4 h-4" />
              </Button>
              <Button type="button" onClick={handleAddAttachment} size="icon" variant="default">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {attachments.length > 0 && (
              <div className="space-y-1">
                {attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                    {attachment.type === 'link' && <Link className="w-4 h-4" />}
                    {attachment.type === 'image' && <ImageIcon className="w-4 h-4" />}
                    {attachment.type === 'file' && <FileText className="w-4 h-4" />}
                    <span className="flex-1 truncate">{attachment.url}</span>
                    <X 
                      className="w-4 h-4 cursor-pointer hover:text-destructive" 
                      onClick={() => handleRemoveAttachment(index)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Note'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}