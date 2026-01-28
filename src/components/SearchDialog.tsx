import { useState, useMemo, useEffect } from 'react';
import { Search, FileText, FolderOpen, Folder, Code } from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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

    return searchResults.slice(0, 20); // Limit to 20 results
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
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden bg-card border-border shadow-2xl">
        {/* Search Input */}
        <div className="border-b border-border p-4 bg-card/80">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search categories, topics, commands..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-12 pr-4 h-12 text-base bg-secondary/50 border-border focus:border-primary focus:ring-1 focus:ring-primary"
              autoFocus
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press <kbd className="px-1.5 py-0.5 rounded bg-secondary text-xs font-mono">Esc</kbd> to close
          </p>
        </div>
        
        {/* Results */}
        <ScrollArea className="max-h-[50vh] min-h-[200px]">
          {query.trim() && results.length === 0 ? (
            <div className="p-12 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">No results found for "{query}"</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Try different keywords</p>
            </div>
          ) : results.length > 0 ? (
            <div className="p-2 space-y-1">
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result)}
                  className="w-full text-left p-3 rounded-lg hover:bg-secondary/70 transition-colors flex items-start gap-3 group"
                >
                  <div className="mt-0.5 p-2 rounded-md bg-secondary group-hover:bg-primary/10">
                    {getIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{result.title}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground shrink-0">
                        {getTypeLabel(result.type)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate mt-1">
                      {result.path.join(' › ')}
                    </div>
                    {result.matchedText && (
                      <div className="text-sm text-muted-foreground/80 truncate mt-1.5 font-mono text-xs">
                        {result.matchedText}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/50 flex items-center justify-center">
                <Search className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground">Start typing to search</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Find categories, topics, and commands
              </p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
