import { useState } from 'react';
import { ArrowLeft, Plus, Pencil, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Topic, CodeBlock as CodeBlockType } from '@/types';
import { CodeBlock } from './CodeBlock';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface TopicViewProps {
  topic: Topic;
  categoryId: string;
  subcategoryId: string;
  onBack: () => void;
}

export function TopicView({ topic, categoryId, subcategoryId, onBack }: TopicViewProps) {
  const { isAdmin } = useAuth();
  const { updateTopic, deleteTopic } = useData();
  const [editingTopic, setEditingTopic] = useState(false);
  const [editingCodeBlock, setEditingCodeBlock] = useState<CodeBlockType | null>(null);
  const [addingCodeBlock, setAddingCodeBlock] = useState(false);
  const [topicForm, setTopicForm] = useState({ title: topic.title, description: topic.description, notes: topic.notes || '' });
  const [codeForm, setCodeForm] = useState({ title: '', description: '', code: '', language: 'bash' });

  const handleUpdateTopic = () => {
    updateTopic(categoryId, subcategoryId, topic.id, topicForm);
    setEditingTopic(false);
    toast.success('Topic updated');
  };

  const handleDeleteTopic = () => {
    if (confirm('Are you sure you want to delete this topic?')) {
      deleteTopic(categoryId, subcategoryId, topic.id);
      onBack();
      toast.success('Topic deleted');
    }
  };

  const handleAddCodeBlock = () => {
    const newBlock: CodeBlockType = {
      id: Math.random().toString(36).substring(2, 15),
      ...codeForm
    };
    updateTopic(categoryId, subcategoryId, topic.id, {
      codeBlocks: [...topic.codeBlocks, newBlock]
    });
    setAddingCodeBlock(false);
    setCodeForm({ title: '', description: '', code: '', language: 'bash' });
    toast.success('Code block added');
  };

  const handleEditCodeBlock = (block: CodeBlockType) => {
    setEditingCodeBlock(block);
    setCodeForm({ title: block.title, description: block.description || '', code: block.code, language: block.language });
  };

  const handleUpdateCodeBlock = () => {
    if (!editingCodeBlock) return;
    const updatedBlocks = topic.codeBlocks.map(b =>
      b.id === editingCodeBlock.id ? { ...b, ...codeForm } : b
    );
    updateTopic(categoryId, subcategoryId, topic.id, { codeBlocks: updatedBlocks });
    setEditingCodeBlock(null);
    setCodeForm({ title: '', description: '', code: '', language: 'bash' });
    toast.success('Code block updated');
  };

  const handleDeleteCodeBlock = (blockId: string) => {
    if (confirm('Delete this code block?')) {
      const updatedBlocks = topic.codeBlocks.filter(b => b.id !== blockId);
      updateTopic(categoryId, subcategoryId, topic.id, { codeBlocks: updatedBlocks });
      toast.success('Code block deleted');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-semibold">{topic.title}</h2>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Updated {formatDate(topic.updatedAt)}
            </span>
          </div>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditingTopic(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={handleDeleteTopic}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
      </div>

      <p className="text-muted-foreground">{topic.description}</p>

      {topic.notes && (
        <div className="bg-secondary/50 border border-border rounded-lg p-4">
          <h4 className="font-medium text-sm text-muted-foreground mb-2">Notes</h4>
          <p className="text-foreground whitespace-pre-wrap">{topic.notes}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Commands</h3>
          {isAdmin && (
            <Button size="sm" onClick={() => setAddingCodeBlock(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Command
            </Button>
          )}
        </div>

        {topic.codeBlocks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No commands yet. {isAdmin && 'Click "Add Command" to create one.'}
          </div>
        ) : (
          <div className="space-y-4">
            {topic.codeBlocks.map((block) => (
              <CodeBlock
                key={block.id}
                block={block}
                onEdit={() => handleEditCodeBlock(block)}
                onDelete={() => handleDeleteCodeBlock(block.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Topic Dialog */}
      <Dialog open={editingTopic} onOpenChange={setEditingTopic}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Topic</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Title</label>
              <Input
                placeholder="Topic title"
                value={topicForm.title}
                onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Short Description</label>
              <Textarea
                placeholder="Brief description of the topic"
                value={topicForm.description}
                onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Detailed Notes</label>
              <Textarea
                placeholder="Add detailed explanations, best practices, warnings, or additional context..."
                value={topicForm.notes}
                onChange={(e) => setTopicForm({ ...topicForm, notes: e.target.value })}
                rows={4}
              />
            </div>
            <Button onClick={handleUpdateTopic} className="w-full">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Code Block Dialog */}
      <Dialog open={addingCodeBlock || !!editingCodeBlock} onOpenChange={(open) => {
        if (!open) {
          setAddingCodeBlock(false);
          setEditingCodeBlock(null);
          setCodeForm({ title: '', description: '', code: '', language: 'bash' });
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCodeBlock ? 'Edit Command' : 'Add Command'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Command Title</label>
              <Input
                placeholder="e.g., List all files"
                value={codeForm.title}
                onChange={(e) => setCodeForm({ ...codeForm, title: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Command/Code</label>
              <Textarea
                placeholder="ls -la"
                className="font-mono"
                value={codeForm.code}
                onChange={(e) => setCodeForm({ ...codeForm, code: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">What does this command do?</label>
              <Textarea
                placeholder="Explain what this command does, its options, and when to use it..."
                value={codeForm.description}
                onChange={(e) => setCodeForm({ ...codeForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Language</label>
              <Input
                placeholder="bash, python, etc."
                value={codeForm.language}
                onChange={(e) => setCodeForm({ ...codeForm, language: e.target.value })}
              />
            </div>
            <Button
              onClick={editingCodeBlock ? handleUpdateCodeBlock : handleAddCodeBlock}
              className="w-full"
            >
              {editingCodeBlock ? 'Save Changes' : 'Add Command'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
