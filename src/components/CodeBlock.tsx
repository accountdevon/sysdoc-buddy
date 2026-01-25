import { useState } from 'react';
import { Copy, Check, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CodeBlock as CodeBlockType } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface CodeBlockProps {
  block: CodeBlockType;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function CodeBlock({ block, onEdit, onDelete }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const { isAdmin } = useAuth();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(block.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[hsl(var(--code-border))] bg-[hsl(var(--code-bg))]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {block.language}
          </span>
          {block.title && (
            <>
              <span className="text-muted-foreground/50">•</span>
              <span className="text-sm text-foreground/80">{block.title}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isAdmin && (
            <>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onDelete}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
            {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
      <pre className="p-4 overflow-x-auto scrollbar-thin">
        <code className="text-sm leading-relaxed">
          <span className="text-primary">$</span> {block.code}
        </code>
      </pre>
    </div>
  );
}
