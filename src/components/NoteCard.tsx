import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Note, Mood } from '@/types/note';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Pin, PinOff, Trash2, Edit, Archive,
  Smile, Meh, Frown, Heart, Zap, Settings2
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { cn } from '@/lib/utils';
import DOMPurify from 'dompurify';

import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';

import { progressColorClass, progressLabel } from '@/lib/progress';
import { storage } from '@/lib/storage';

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
  const navigate = useNavigate();
  const id = (note as any)._id ?? (note as any).id;

  const title = note.title ?? '';
  const tags = Array.isArray(note.tags) ? note.tags : [];
  const mood = note.mood as Mood | undefined;

  // progresso normalizado (0 | 50 | 75 | 100)
  const initialP = ([0, 25, 50, 75, 100].includes(Number(note.progress)) ? Number(note.progress) : 0) as 0|25|50|75|100;
  const [p, setP] = useState<0|25|50|75|100>(initialP);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // se o note mudar externamente, sincroniza o local
    const next = ([0, 25, 50, 75, 100].includes(Number(note.progress)) ? Number(note.progress) : 0) as 0|25|50|75|100;
    setP(next);
  }, [note.progress]);

  // datas
  const createdISO = note?.createdAt ?? note?.updatedAt ?? new Date().toISOString();
  const created = new Date(createdISO);
  const createdLabel = isNaN(created.getTime()) ? '' : format(created, 'dd/MM/yyyy', { locale: ptBR });
  const relative = isNaN(created.getTime())
    ? ''
    : formatDistanceToNow(new Date(note.updatedAt ?? createdISO), { addSuffix: true, locale: ptBR });

  // handlers
  const changeProgress = async (val: 0|25|50|75|100) => {
    if (!id) return;
    setP(val);            // feedback instantâneo
    setSaving(true);
    try {
      // se você criar storage.setProgress, troque por ele; aqui uso updateNote que você já tem
      await storage.updateNote(id, { progress: val } as any);
    } catch (e) {
      // rollback visual se falhar
      setP(initialP);
      // opcional: usar seu toast aqui
      console.error('Erro ao atualizar progresso', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      className={cn(
        'group relative p-5 transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 bg-gradient-card border-border cursor-pointer',
        note.pinned && 'border-primary shadow-glow'
      )}
      onClick={() => navigate(`/note/${id}`)}
      role="button"
      aria-label={`Abrir nota ${title || 'Sem título'}`}
    >
      {note.pinned && (
        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1.5 shadow-glow">
          <Pin className="w-3 h-3" />
        </div>
      )}

      <div className="space-y-3">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="text-sm text-muted-foreground">{createdLabel}</div>
            <h3 className="text-lg font-semibold text-foreground line-clamp-1">
              {title || 'Sem título'}
            </h3>
          </div>

          {mood && (
            <div className={cn('px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1', moodTone[mood])}>
              {moodIcons[mood]}
              <span className="capitalize hidden sm:inline">{mood}</span>
            </div>
          )}
        </div>

        {/* Preview seguro do conteúdo */}
        <div
          className="text-muted-foreground text-sm line-clamp-3 prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(note.content || "Sem conteúdo...") }}
        />

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs bg-secondary/50 hover:bg-secondary">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* CTA Ler nota */}
        <div className="pt-1">
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => { e.stopPropagation(); navigate(`/note/${id}`); }}
          >
            Ler nota
          </Button>
        </div>

        {/* PROGRESSO */}
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Status: {progressLabel(p)}</span>
            <span>{p}%</span>
          </div>

          {/* usamos Progress do shadcn, apagamos a cor interna e sobrepomos nossa barra colorida */}
          <div className="relative">
            <Progress value={p} className="h-2 [&>div]:bg-transparent" />
            <div
              className={cn('absolute left-0 top-0 h-2 rounded-full transition-all', progressColorClass(p), saving && 'animate-pulse')}
              style={{ width: `${p}%` }}
              role="progressbar"
              aria-valuenow={p}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progresso ${p}% - ${progressLabel(p)}`}
            />
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <span className="text-xs text-muted-foreground">{relative}</span>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:text-primary"
              onClick={(e) => { e.stopPropagation(); onEdit(note); }}
            >
              <Edit className="w-4 h-4" />
            </Button>

            {/* MENU DE STATUS */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:text-primary"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Settings2 className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => changeProgress(0)}> {progressLabel(0)} (0%) </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeProgress(25)}> {progressLabel(25)} (25%) </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeProgress(50)}> {progressLabel(50)} (50%) </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeProgress(75)}> {progressLabel(75)} (75%) </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeProgress(100)}> {progressLabel(100)} (100%) </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:text-primary"
              onClick={(e) => { e.stopPropagation(); onTogglePin(id); }}
            >
              {note.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:text-primary"
              onClick={(e) => { e.stopPropagation(); onToggleArchive(id); }}
            >
              <Archive className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete(id); }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
