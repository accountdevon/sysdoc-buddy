import { useState, useMemo, useEffect } from 'react';
import { Search, FileText, FolderOpen, Folder, Code } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
      <DialogContent className="max-w-lg p-0 gap-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="sr-only">Search</DialogTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories, topics, commands..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          {query.trim() && results.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No results found for "{query}"
            </div>
          ) : results.length > 0 ? (
            <div className="p-2">
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result)}
                  className="w-full text-left p-3 rounded-lg hover:bg-secondary/50 transition-colors flex items-start gap-3"
                >
                  <div className="mt-0.5">{getIcon(result.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{result.title}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                        {getTypeLabel(result.type)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                      {result.path.join(' › ')}
                    </div>
                    {result.matchedText && (
                      <div className="text-sm text-muted-foreground truncate mt-1">
                        {result.matchedText}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              Type to search...
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
