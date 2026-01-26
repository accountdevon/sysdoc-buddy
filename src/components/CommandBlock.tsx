import { useState } from 'react';
import { Copy, Check, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CodeBlock as CodeBlockType } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface CommandBlockProps {
  block: CodeBlockType;
  onEdit?: () => void;
  onDelete?: () => void;
}

const LANGUAGE_OPTIONS = [
  { value: 'bash', label: 'bash' },
  { value: 'shell', label: 'shell' },
  { value: 'python', label: 'python' },
  { value: 'javascript', label: 'javascript' },
  { value: 'typescript', label: 'typescript' },
  { value: 'sql', label: 'sql' },
  { value: 'yaml', label: 'yaml' },
  { value: 'json', label: 'json' },
  { value: 'dockerfile', label: 'dockerfile' },
  { value: 'nginx', label: 'nginx' },
  { value: 'apache', label: 'apache' },
  { value: 'systemd', label: 'systemd' },
  { value: 'ini', label: 'ini' },
  { value: 'conf', label: 'config' },
  { value: 'powershell', label: 'powershell' },
  { value: 'other', label: 'other' },
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
    <div className="command-block space-y-3">
      {/* 1. Command Title with admin actions */}
      {block.title && (
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-foreground">{block.title}</h4>
          {isAdmin && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-destructive hover:text-destructive" 
                onClick={onDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 2. Description - What does this command do */}
      {block.description && (
        <p className="text-sm text-muted-foreground leading-relaxed">{block.description}</p>
      )}

      {/* 3. Code block - minimal dark style like reference */}
      <div className="rounded-lg overflow-hidden bg-[#1e1e1e] border border-[#333]">
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-sm text-[#888]">{languageLabel}</span>
          <button 
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-sm text-[#888] hover:text-[#ccc] transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copy code</span>
              </>
            )}
          </button>
        </div>
        <pre className="px-4 pb-4 pt-0 overflow-x-auto scrollbar-thin">
          <code className="text-sm leading-relaxed text-[#d4d4d4]">
            {block.code}
          </code>
        </pre>
      </div>
    </div>
  );
}

// Export language options for use in forms
export { LANGUAGE_OPTIONS };
