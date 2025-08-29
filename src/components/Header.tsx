import { Button } from '@/components/ui/button';
import { PenSquare, Archive, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onNewNote: () => void;
  showArchived: boolean;
  onToggleArchived: () => void;
  notesCount: number;
}

export function Header({ onNewNote, showArchived, onToggleArchived, notesCount }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-gradient-subtle backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-primary p-2.5 rounded-xl shadow-glow">
              <FileText className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Diário de Anotações
              </h1>
              <p className="text-sm text-muted-foreground">
                {notesCount} {notesCount === 1 ? 'nota' : 'notas'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={showArchived ? "default" : "outline"}
              size="sm"
              onClick={onToggleArchived}
              className={cn(
                "gap-2",
                showArchived && "bg-gradient-primary shadow-glow"
              )}
            >
              <Archive className="w-4 h-4" />
              <span className="hidden sm:inline">Concluidas</span>
            </Button>
            
            <Button
              onClick={onNewNote}
              className="gap-2 bg-gradient-primary shadow-glow hover:shadow-elevated hover:scale-105 transition-all duration-300"
            >
              <PenSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Nova Nota</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}