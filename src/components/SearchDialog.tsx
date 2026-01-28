import { useState, useMemo, useEffect } from 'react';
import { Search, FileText, FolderOpen, Folder, Code, X, Command } from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { useData } from '@/contexts/DataContext';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SearchResult {
  type: 'category' | 'subcategory' | 'topic' | 'command';
  id: string;
  title: string;
  path: string[];
  categoryId: string;
  subcategoryId?: string;
  topicId?: string;
  matchedText?: string;
}

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (categoryId: string, subcategoryId?: string, topicId?: string) => void;
}

export function SearchDialog({ open, onOpenChange, onNavigate }: SearchDialogProps) {
  const { categories } = useData();
  const [query, setQuery] = useState('');

  // Reset query when dialog opens
  useEffect(() => {
    if (open) {
      setQuery('');
    }
  }, [open]);

  // Ctrl+F keyboard shortcut is handled in Index.tsx

  const results = useMemo(() => {
    if (!query.trim()) return [];

    const searchResults: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    categories.forEach(category => {
      // Search categories
      if (category.name.toLowerCase().includes(lowerQuery) || 
          category.description.toLowerCase().includes(lowerQuery)) {
        searchResults.push({
          type: 'category',
          id: category.id,
          title: category.name,
          path: [category.name],
          categoryId: category.id,
          matchedText: category.description
        });
      }

      category.subcategories.forEach(subcategory => {
        // Search subcategories
        if (subcategory.name.toLowerCase().includes(lowerQuery) || 
            subcategory.description.toLowerCase().includes(lowerQuery)) {
          searchResults.push({
            type: 'subcategory',
            id: subcategory.id,
            title: subcategory.name,
            path: [category.name, subcategory.name],
            categoryId: category.id,
            subcategoryId: subcategory.id,
            matchedText: subcategory.description
          });
        }

        subcategory.topics.forEach(topic => {
          // Search topics
          if (topic.title.toLowerCase().includes(lowerQuery) || 
              topic.description.toLowerCase().includes(lowerQuery) ||
              topic.notes?.toLowerCase().includes(lowerQuery)) {
            searchResults.push({
              type: 'topic',
              id: topic.id,
              title: topic.title,
              path: [category.name, subcategory.name, topic.title],
              categoryId: category.id,
              subcategoryId: subcategory.id,
              topicId: topic.id,
              matchedText: topic.description
            });
          }

          // Search commands/code blocks
          topic.codeBlocks.forEach(block => {
            if (block.title?.toLowerCase().includes(lowerQuery) || 
                block.description?.toLowerCase().includes(lowerQuery) ||
                block.code.toLowerCase().includes(lowerQuery)) {
              searchResults.push({
                type: 'command',
                id: block.id,
                title: block.title || block.code.substring(0, 40),
                path: [category.name, subcategory.name, topic.title],
                categoryId: category.id,
                subcategoryId: subcategory.id,
                topicId: topic.id,
                matchedText: block.code.substring(0, 60)
              });
            }
          });
        });
      });
    });

    return searchResults.slice(0, 20);
  }, [query, categories]);

  const handleSelect = (result: SearchResult) => {
    onNavigate(result.categoryId, result.subcategoryId, result.topicId);
    onOpenChange(false);
  };

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'category': return <Folder className="h-4 w-4 text-primary" />;
      case 'subcategory': return <FolderOpen className="h-4 w-4 text-primary/80" />;
      case 'topic': return <FileText className="h-4 w-4 text-muted-foreground" />;
      case 'command': return <Code className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'category': return 'Category';
      case 'subcategory': return 'Subcategory';
      case 'topic': return 'Topic';
      case 'command': return 'Command';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden bg-card border-border shadow-2xl [&>button]:hidden">
        {/* Search Header */}
        <div className="relative border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
              <Search className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search categories, topics, commands..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent text-base font-medium placeholder:text-muted-foreground/60 focus:outline-none"
                autoFocus
              />
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">Ctrl</kbd>
                <span>+</span>
                <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">F</kbd>
                <span className="mx-1">to open</span>
                <span className="text-muted-foreground/50">•</span>
                <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">Esc</kbd>
                <span>to close</span>
              </div>
            </div>
            <button 
              onClick={() => onOpenChange(false)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
        
        {/* Results */}
        <ScrollArea className="max-h-[60vh] min-h-[250px]">
          {query.trim() && results.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                <Search className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <p className="font-medium text-foreground mb-1">No results found</p>
              <p className="text-sm text-muted-foreground">
                Try different keywords for "{query}"
              </p>
            </div>
          ) : results.length > 0 ? (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {results.length} result{results.length !== 1 ? 's' : ''} found
              </div>
              <div className="space-y-1">
                {results.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    className="w-full text-left p-3 rounded-xl hover:bg-secondary/80 transition-all duration-200 flex items-start gap-3 group border border-transparent hover:border-border/50"
                  >
                    <div className="mt-0.5 p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                      {getIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium truncate group-hover:text-primary transition-colors">
                          {result.title}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0 uppercase tracking-wider font-medium">
                          {getTypeLabel(result.type)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground/70 truncate flex items-center gap-1">
                        {result.path.map((p, i) => (
                          <span key={i} className="flex items-center gap-1">
                            {i > 0 && <span className="text-muted-foreground/40">›</span>}
                            <span>{p}</span>
                          </span>
                        ))}
                      </div>
                      {result.matchedText && (
                        <div className="text-xs text-muted-foreground/60 truncate mt-1.5 font-mono bg-muted/50 px-2 py-1 rounded">
                          {result.matchedText}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                <Command className="h-10 w-10 text-primary/40" />
              </div>
              <p className="font-medium text-foreground mb-1">Quick Search</p>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Find categories, subcategories, topics, and commands instantly
              </p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
