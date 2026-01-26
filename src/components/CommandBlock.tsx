import { useState } from 'react';
import { Copy, Check, Pencil, Trash2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CodeBlock as CodeBlockType } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CommandBlockProps {
  block: CodeBlockType;
  onEdit?: () => void;
  onDelete?: () => void;
}

const LANGUAGE_OPTIONS = [
  { value: 'bash', label: 'Bash' },
  { value: 'shell', label: 'Shell' },
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'sql', label: 'SQL' },
  { value: 'yaml', label: 'YAML' },
  { value: 'json', label: 'JSON' },
  { value: 'dockerfile', label: 'Dockerfile' },
  { value: 'nginx', label: 'Nginx' },
  { value: 'apache', label: 'Apache' },
  { value: 'systemd', label: 'Systemd' },
  { value: 'ini', label: 'INI' },
  { value: 'conf', label: 'Config' },
  { value: 'powershell', label: 'PowerShell' },
  { value: 'other', label: 'Other' },
];

export function CommandBlock({ block, onEdit, onDelete }: CommandBlockProps) {
  const [copied, setCopied] = useState(false);
  const { isAdmin } = useAuth();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(block.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const languageLabel = LANGUAGE_OPTIONS.find(l => l.value === block.language)?.label || block.language;

  return (
    <div className="command-block rounded-xl border border-border bg-card overflow-hidden">
      {/* Header with title and actions */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
        <div className="flex-1 min-w-0">
          {block.title && (
            <h4 className="font-medium text-foreground truncate">{block.title}</h4>
          )}
        </div>
        <div className="flex items-center gap-1 ml-2">
          {isAdmin && (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-destructive hover:text-destructive" 
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Description - What does this command do */}
      {block.description && (
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <p className="text-sm text-muted-foreground leading-relaxed">{block.description}</p>
        </div>
      )}

      {/* Code block with language indicator and copy button */}
      <div className="code-block border-0 rounded-none">
        <div className="flex items-center justify-between px-4 py-2 border-b border-[hsl(var(--code-border))] bg-[hsl(var(--code-bg))]">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
              {languageLabel}
            </span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
            {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
        <pre className="p-4 overflow-x-auto scrollbar-thin">
          <code className="text-sm leading-relaxed">
            <span className="text-primary">$</span> {block.code}
          </code>
        </pre>
      </div>
    </div>
  );
}

// Export language options for use in forms
export { LANGUAGE_OPTIONS };
