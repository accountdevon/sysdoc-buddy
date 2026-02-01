import { useState } from 'react';
import { Category, Subcategory, Topic } from '@/types';
import { CategoryCard } from './CategoryCard';
import { TopicView } from './TopicView';
import { Terminal, FileText, FolderOpen, Plus, Pencil, Trash2, MoreVertical } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

const iconOptions = [
  { value: 'server', label: 'Server' },
  { value: 'network', label: 'Network' },
  { value: 'storage', label: 'Storage' },
  { value: 'security', label: 'Security' },
  { value: 'folder', label: 'Folder' },
  { value: 'settings', label: 'Settings' },
];

interface MainContentProps {
  categories: Category[];
  selectedCategoryId: string | null;
  selectedSubcategoryId: string | null;
  selectedTopicId: string | null;
  onSelectCategory: (id: string) => void;
  onSelectSubcategory: (categoryId: string, subcategoryId: string) => void;
  onSelectTopic: (categoryId: string, subcategoryId: string, topicId: string) => void;
  onBack: () => void;
}

export function MainContent({
  categories,
  selectedCategoryId,
  selectedSubcategoryId,
  selectedTopicId,
  onSelectCategory,
  onSelectSubcategory,
  onSelectTopic,
  onBack
}: MainContentProps) {
  const { isAdmin } = useAuth();
  const isMobile = useIsMobile();
  const { 
    addCategory, updateCategory, deleteCategory,
    addSubcategory, updateSubcategory, deleteSubcategory,
    addTopic, updateTopic, deleteTopic
  } = useData();
  
  // Category state
  const [addingCategory, setAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', icon: 'folder' });

  // Subcategory state
  const [addingSubcategory, setAddingSubcategory] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [subcategoryForm, setSubcategoryForm] = useState({ name: '', description: '' });

  // Topic state
  const [addingTopic, setAddingTopic] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [topicForm, setTopicForm] = useState({ title: '', description: '', notes: '', codeBlocks: [] as any[] });

  // Find selected items
  const selectedCategory = categories.find(c => c.id === selectedCategoryId);
  const selectedSubcategory = selectedCategory?.subcategories.find(s => s.id === selectedSubcategoryId);
  const selectedTopic = selectedSubcategory?.topics.find(t => t.id === selectedTopicId);

  // Category handlers
  const handleAddCategory = () => {
    addCategory(categoryForm);
    setAddingCategory(false);
    setCategoryForm({ name: '', description: '', icon: 'folder' });
    toast.success('Category added');
  };

  const handleEditCategory = () => {
    if (!editingCategory) return;
    updateCategory(editingCategory.id, categoryForm);
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '', icon: 'folder' });
    toast.success('Category updated');
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm('Delete this category and all its contents?')) {
      deleteCategory(id);
      toast.success('Category deleted');
    }
  };

  // Subcategory handlers
  const handleAddSubcategory = () => {
    if (!selectedCategoryId) return;
    addSubcategory(selectedCategoryId, subcategoryForm);
    setAddingSubcategory(false);
    setSubcategoryForm({ name: '', description: '' });
    toast.success('Subcategory added');
  };

  const handleEditSubcategory = () => {
    if (!editingSubcategory || !selectedCategoryId) return;
    updateSubcategory(selectedCategoryId, editingSubcategory.id, subcategoryForm);
    setEditingSubcategory(null);
    setSubcategoryForm({ name: '', description: '' });
    toast.success('Subcategory updated');
  };

  const handleDeleteSubcategory = (subcategoryId: string) => {
    if (!selectedCategoryId) return;
    if (confirm('Delete this subcategory and all its topics?')) {
      deleteSubcategory(selectedCategoryId, subcategoryId);
      toast.success('Subcategory deleted');
    }
  };

  // Topic handlers
  const handleAddTopic = () => {
    if (!selectedCategoryId || !selectedSubcategoryId) return;
    addTopic(selectedCategoryId, selectedSubcategoryId, topicForm);
    setAddingTopic(false);
    setTopicForm({ title: '', description: '', notes: '', codeBlocks: [] });
    toast.success('Topic added');
  };

  const handleEditTopic = () => {
    if (!editingTopic || !selectedCategoryId || !selectedSubcategoryId) return;
    updateTopic(selectedCategoryId, selectedSubcategoryId, editingTopic.id, topicForm);
    setEditingTopic(null);
    setTopicForm({ title: '', description: '', notes: '', codeBlocks: [] });
    toast.success('Topic updated');
  };

  const handleDeleteTopic = (topicId: string) => {
    if (!selectedCategoryId || !selectedSubcategoryId) return;
    if (confirm('Delete this topic?')) {
      deleteTopic(selectedCategoryId, selectedSubcategoryId, topicId);
      toast.success('Topic deleted');
    }
  };

  // Action buttons component for cards
  const CardActions = ({ 
    onEdit, 
    onDelete 
  }: { 
    onEdit: () => void; 
    onDelete: () => void;
  }) => {
    if (!isAdmin) return null;
    
    return (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        {isMobile ? (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={5}>
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    );
  };

  // If viewing a topic
  if (selectedTopic && selectedCategoryId && selectedSubcategoryId) {
    return (
      <TopicView
        topic={selectedTopic}
        categoryId={selectedCategoryId}
        subcategoryId={selectedSubcategoryId}
        onBack={onBack}
      />
    );
  }

  // If viewing a subcategory's topics
  if (selectedSubcategory && selectedCategoryId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">{selectedSubcategory.name}</h2>
            <p className="text-muted-foreground mt-1">{selectedSubcategory.description}</p>
          </div>
          {isAdmin && (
            <Button onClick={() => setAddingTopic(true)} className="gap-2 shrink-0">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Topic</span>
            </Button>
          )}
        </div>

        {selectedSubcategory.topics.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No topics in this subcategory yet.</p>
            {isAdmin && (
              <Button onClick={() => setAddingTopic(true)} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Create your first topic
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {selectedSubcategory.topics.map((topic) => (
              <div
                key={topic.id}
                className="category-card cursor-pointer group"
                onClick={() => onSelectTopic(selectedCategoryId, selectedSubcategoryId, topic.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary shrink-0">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium">{topic.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{topic.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">{topic.codeBlocks.length} commands</p>
                    </div>
                  </div>
                  <CardActions
                    onEdit={() => {
                      setEditingTopic(topic);
                      setTopicForm({ 
                        title: topic.title, 
                        description: topic.description, 
                        notes: topic.notes, 
                        codeBlocks: topic.codeBlocks 
                      });
                    }}
                    onDelete={() => handleDeleteTopic(topic.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Topic Dialog */}
        <Dialog open={addingTopic} onOpenChange={setAddingTopic}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Topic</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder="Topic title"
                value={topicForm.title}
                onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
              />
              <Textarea
                placeholder="Short description"
                value={topicForm.description}
                onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
              />
              <Textarea
                placeholder="Detailed notes (optional)"
                value={topicForm.notes}
                onChange={(e) => setTopicForm({ ...topicForm, notes: e.target.value })}
                rows={4}
              />
              <Button onClick={handleAddTopic} className="w-full">Add Topic</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Topic Dialog */}
        <Dialog open={!!editingTopic} onOpenChange={(open) => !open && setEditingTopic(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Topic</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder="Topic title"
                value={topicForm.title}
                onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
              />
              <Textarea
                placeholder="Short description"
                value={topicForm.description}
                onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
              />
              <Textarea
                placeholder="Detailed notes (optional)"
                value={topicForm.notes}
                onChange={(e) => setTopicForm({ ...topicForm, notes: e.target.value })}
                rows={4}
              />
              <Button onClick={handleEditTopic} className="w-full">Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // If viewing a category's subcategories
  if (selectedCategory) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">{selectedCategory.name}</h2>
            <p className="text-muted-foreground mt-1">{selectedCategory.description}</p>
          </div>
          {isAdmin && (
            <Button onClick={() => setAddingSubcategory(true)} className="gap-2 shrink-0">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Subcategory</span>
            </Button>
          )}
        </div>

        {selectedCategory.subcategories.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No subcategories yet.</p>
            {isAdmin && (
              <Button onClick={() => setAddingSubcategory(true)} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Create your first subcategory
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {selectedCategory.subcategories.map((subcategory) => (
              <div
                key={subcategory.id}
                className="category-card cursor-pointer group"
                onClick={() => onSelectSubcategory(selectedCategory.id, subcategory.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary shrink-0">
                      <FolderOpen className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium">{subcategory.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{subcategory.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">{subcategory.topics.length} topics</p>
                    </div>
                  </div>
                  <CardActions
                    onEdit={() => {
                      setEditingSubcategory(subcategory);
                      setSubcategoryForm({ name: subcategory.name, description: subcategory.description });
                    }}
                    onDelete={() => handleDeleteSubcategory(subcategory.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Subcategory Dialog */}
        <Dialog open={addingSubcategory} onOpenChange={setAddingSubcategory}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Subcategory</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder="Subcategory name"
                value={subcategoryForm.name}
                onChange={(e) => setSubcategoryForm({ ...subcategoryForm, name: e.target.value })}
              />
              <Textarea
                placeholder="Description"
                value={subcategoryForm.description}
                onChange={(e) => setSubcategoryForm({ ...subcategoryForm, description: e.target.value })}
              />
              <Button onClick={handleAddSubcategory} className="w-full">Add Subcategory</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Subcategory Dialog */}
        <Dialog open={!!editingSubcategory} onOpenChange={(open) => !open && setEditingSubcategory(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Subcategory</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder="Subcategory name"
                value={subcategoryForm.name}
                onChange={(e) => setSubcategoryForm({ ...subcategoryForm, name: e.target.value })}
              />
              <Textarea
                placeholder="Description"
                value={subcategoryForm.description}
                onChange={(e) => setSubcategoryForm({ ...subcategoryForm, description: e.target.value })}
              />
              <Button onClick={handleEditSubcategory} className="w-full">Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Default: show all categories
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 terminal-border">
            <Terminal className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Linux Command Reference</h2>
            <p className="text-muted-foreground">Your personal collection of Linux commands and configurations</p>
          </div>
        </div>
        {isAdmin && (
          <Button onClick={() => setAddingCategory(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Category</span>
          </Button>
        )}
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Terminal className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No categories yet.</p>
          {isAdmin && (
            <Button onClick={() => setAddingCategory(true)} className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Create your first category
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              isSelected={false}
              onClick={() => onSelectCategory(category.id)}
              onEdit={() => {
                setEditingCategory(category);
                setCategoryForm({ name: category.name, description: category.description, icon: category.icon });
              }}
              onDelete={() => handleDeleteCategory(category.id)}
            />
          ))}
        </div>
      )}

      {/* Add Category Dialog */}
      <Dialog open={addingCategory} onOpenChange={setAddingCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Category name"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
            />
            <Textarea
              placeholder="Description"
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
            />
            <Select value={categoryForm.icon} onValueChange={(v) => setCategoryForm({ ...categoryForm, icon: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select icon" />
              </SelectTrigger>
              <SelectContent>
                {iconOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddCategory} className="w-full">Add Category</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Category name"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
            />
            <Textarea
              placeholder="Description"
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
            />
            <Select value={categoryForm.icon} onValueChange={(v) => setCategoryForm({ ...categoryForm, icon: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select icon" />
              </SelectTrigger>
              <SelectContent>
                {iconOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleEditCategory} className="w-full">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
