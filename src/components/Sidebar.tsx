import { useState } from 'react';
import { ChevronRight, ChevronDown, Plus, Pencil, Trash2, FileText, ChevronUp, MoreVertical, PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Category, Subcategory, Topic } from '@/types';
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

interface SidebarProps {
  categories: Category[];
  selectedCategoryId: string | null;
  selectedSubcategoryId: string | null;
  selectedTopicId: string | null;
  onSelectCategory: (id: string) => void;
  onSelectSubcategory: (categoryId: string, subcategoryId: string) => void;
  onSelectTopic: (categoryId: string, subcategoryId: string, topicId: string) => void;
  isMobile?: boolean;
  sidebarVisible?: boolean;
  onToggleSidebar?: () => void;
}

const iconOptions = [
  { value: 'server', label: 'Server' },
  { value: 'network', label: 'Network' },
  { value: 'storage', label: 'Storage' },
  { value: 'security', label: 'Security' },
  { value: 'folder', label: 'Folder' },
  { value: 'settings', label: 'Settings' },
];

export function Sidebar({
  categories,
  selectedCategoryId,
  selectedSubcategoryId,
  selectedTopicId,
  onSelectCategory,
  onSelectSubcategory,
  onSelectTopic,
  isMobile = false,
  sidebarVisible = true,
  onToggleSidebar
}: SidebarProps) {
  const { isAdmin } = useAuth();
  const { addCategory, updateCategory, deleteCategory, moveCategoryUp, moveCategoryDown, addSubcategory, updateSubcategory, deleteSubcategory, moveSubcategoryUp, moveSubcategoryDown, addTopic } = useData();
  const isMobileDevice = useIsMobile();
  
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());
  
  const [addingCategory, setAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [addingSubcategory, setAddingSubcategory] = useState<string | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<{ categoryId: string; subcategory: Subcategory } | null>(null);
  const [addingTopic, setAddingTopic] = useState<{ categoryId: string; subcategoryId: string } | null>(null);
  
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', icon: 'folder' });
  const [subcategoryForm, setSubcategoryForm] = useState({ name: '', description: '' });
  const [topicForm, setTopicForm] = useState({ title: '', description: '' });

  const toggleCategory = (id: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleSubcategory = (id: string) => {
    const newExpanded = new Set(expandedSubcategories);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSubcategories(newExpanded);
  };

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

  const handleAddSubcategory = () => {
    if (!addingSubcategory) return;
    addSubcategory(addingSubcategory, subcategoryForm);
    setAddingSubcategory(null);
    setSubcategoryForm({ name: '', description: '' });
    toast.success('Subcategory added');
  };

  const handleEditSubcategory = () => {
    if (!editingSubcategory) return;
    updateSubcategory(editingSubcategory.categoryId, editingSubcategory.subcategory.id, subcategoryForm);
    setEditingSubcategory(null);
    setSubcategoryForm({ name: '', description: '' });
    toast.success('Subcategory updated');
  };

  const handleDeleteSubcategory = (categoryId: string, subcategoryId: string) => {
    if (confirm('Delete this subcategory and all its topics?')) {
      deleteSubcategory(categoryId, subcategoryId);
      toast.success('Subcategory deleted');
    }
  };

  const handleMoveSubcategoryUp = (categoryId: string, subcategoryId: string) => {
    moveSubcategoryUp(categoryId, subcategoryId);
  };

  const handleMoveSubcategoryDown = (categoryId: string, subcategoryId: string) => {
    moveSubcategoryDown(categoryId, subcategoryId);
  };

  const handleAddTopic = () => {
    if (!addingTopic) return;
    addTopic(addingTopic.categoryId, addingTopic.subcategoryId, { ...topicForm, notes: '', codeBlocks: [] });
    setAddingTopic(null);
    setTopicForm({ title: '', description: '' });
    toast.success('Topic added');
  };

  // Don't render sidebar if hidden on desktop (but always show on mobile)
  if (!sidebarVisible && !isMobile) {
    return (
      <div className="hidden lg:flex items-start pt-4 pl-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg bg-card border border-border shadow-sm hover:bg-secondary"
          onClick={onToggleSidebar}
          title="Show sidebar"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <aside className={`${isMobile ? 'w-full h-full' : 'w-80 hidden lg:flex'} border-r border-border bg-card/50 flex flex-col h-[calc(100vh-4rem)]`}>
      <div className={`p-4 border-b border-border flex items-center justify-between gap-2 ${isMobile ? 'pr-14' : ''}`}> 
        <h2 className="font-semibold">Categories</h2>
        <div className="flex items-center gap-1">
          {isAdmin && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setAddingCategory(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          )}
          {!isMobile && onToggleSidebar && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onToggleSidebar}
              title="Hide sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
        {categories.map((category) => (
          <div key={category.id} className="mb-1">
            <div
              className={`nav-item flex items-center justify-between group ${selectedCategoryId === category.id && !selectedSubcategoryId ? 'active' : ''}`}
              onClick={() => {
                toggleCategory(category.id);
                onSelectCategory(category.id);
              }}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {expandedCategories.has(category.id) ? (
                  <ChevronDown className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0" />
                )}
                <span className="truncate">{category.name}</span>
              </div>
              {isAdmin && (
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={5} className="bg-popover border-border z-[100] min-w-[160px]">
                      <DropdownMenuItem onClick={() => moveCategoryUp(category.id)}>
                        <ChevronUp className="h-3 w-3 mr-2" />
                        Move Up
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => moveCategoryDown(category.id)}>
                        <ChevronDown className="h-3 w-3 mr-2" />
                        Move Down
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setAddingSubcategory(category.id);
                        setExpandedCategories(new Set([...expandedCategories, category.id]));
                      }}>
                        <Plus className="h-3 w-3 mr-2" />
                        Add Subcategory
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setEditingCategory(category);
                        setCategoryForm({ name: category.name, description: category.description, icon: category.icon });
                      }}>
                        <Pencil className="h-3 w-3 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
            
            {expandedCategories.has(category.id) && (
              <div className="ml-4 mt-1 space-y-1">
                {category.subcategories.map((subcategory) => (
                  <div key={subcategory.id}>
                    <div
                      className={`nav-item flex items-center justify-between group ${selectedSubcategoryId === subcategory.id && !selectedTopicId ? 'active' : ''}`}
                      onClick={() => {
                        toggleSubcategory(subcategory.id);
                        onSelectSubcategory(category.id, subcategory.id);
                      }}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {expandedSubcategories.has(subcategory.id) ? (
                          <ChevronDown className="h-3 w-3 shrink-0" />
                        ) : (
                          <ChevronRight className="h-3 w-3 shrink-0" />
                        )}
                        <span className="truncate text-sm">{subcategory.name}</span>
                      </div>
                      {isAdmin && (
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-5 w-5">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" sideOffset={5} className="bg-popover border-border z-[100] min-w-[160px]">
                                              <DropdownMenuItem onClick={() => handleMoveSubcategoryUp(category.id, subcategory.id)}>
                                                <ChevronUp className="h-3 w-3 mr-2" />
                                                Move Up
                                              </DropdownMenuItem>
                                              <DropdownMenuItem onClick={() => handleMoveSubcategoryDown(category.id, subcategory.id)}>
                                                <ChevronDown className="h-3 w-3 mr-2" />
                                                Move Down
                                              </DropdownMenuItem>
                                              <DropdownMenuItem onClick={() => {
                                                setAddingTopic({ categoryId: category.id, subcategoryId: subcategory.id });
                                                setExpandedSubcategories(new Set([...expandedSubcategories, subcategory.id]));
                                              }}>
                                                <Plus className="h-3 w-3 mr-2" />
                                                Add Topic
                                              </DropdownMenuItem>
                                              <DropdownMenuItem onClick={() => {
                                                setEditingSubcategory({ categoryId: category.id, subcategory });
                                                setSubcategoryForm({ name: subcategory.name, description: subcategory.description });
                                              }}>
                                                <Pencil className="h-3 w-3 mr-2" />
                                                Edit
                                              </DropdownMenuItem>
                                              <DropdownMenuItem 
                                                className="text-destructive focus:text-destructive"
                                                onClick={() => handleDeleteSubcategory(category.id, subcategory.id)}
                                              >
                                                <Trash2 className="h-3 w-3 mr-2" />
                                                Delete
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                    
                    {expandedSubcategories.has(subcategory.id) && (
                      <div className="ml-4 mt-1 space-y-0.5">
                        {subcategory.topics.map((topic) => (
                          <div
                            key={topic.id}
                            className={`nav-item flex items-center gap-2 text-sm ${selectedTopicId === topic.id ? 'active' : ''}`}
                            onClick={() => onSelectTopic(category.id, subcategory.id, topic.id)}
                          >
                            <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
                            <span className="truncate">{topic.title}</span>
                          </div>
                        ))}
                        {subcategory.topics.length === 0 && (
                          <div className="text-xs text-muted-foreground px-3 py-2">No topics yet</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {category.subcategories.length === 0 && (
                  <div className="text-xs text-muted-foreground px-3 py-2">No subcategories yet</div>
                )}
              </div>
            )}
          </div>
        ))}
        
        {categories.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No categories yet.
            {isAdmin && ' Click + to create one.'}
          </div>
        )}
      </div>

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

      {/* Add Subcategory Dialog */}
      <Dialog open={!!addingSubcategory} onOpenChange={(open) => !open && setAddingSubcategory(null)}>
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

      {/* Add Topic Dialog */}
      <Dialog open={!!addingTopic} onOpenChange={(open) => !open && setAddingTopic(null)}>
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
              placeholder="Description"
              value={topicForm.description}
              onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
            />
            <Button onClick={handleAddTopic} className="w-full">Add Topic</Button>
          </div>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
