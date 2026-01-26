import { Category, Subcategory, Topic } from '@/types';
import { CategoryCard } from './CategoryCard';
import { TopicView } from './TopicView';
import { Terminal, FileText, FolderOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

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

  // Find selected items
  const selectedCategory = categories.find(c => c.id === selectedCategoryId);
  const selectedSubcategory = selectedCategory?.subcategories.find(s => s.id === selectedSubcategoryId);
  const selectedTopic = selectedSubcategory?.topics.find(t => t.id === selectedTopicId);

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
        <div>
          <h2 className="text-2xl font-semibold">{selectedSubcategory.name}</h2>
          <p className="text-muted-foreground mt-1">{selectedSubcategory.description}</p>
        </div>

        {selectedSubcategory.topics.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No topics in this subcategory yet.</p>
            {isAdmin && <p className="text-sm mt-2">Use the sidebar to add topics.</p>}
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {selectedSubcategory.topics.map((topic) => (
              <div
                key={topic.id}
                className="category-card cursor-pointer"
                onClick={() => onSelectTopic(selectedCategoryId, selectedSubcategoryId, topic.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium">{topic.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{topic.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">{topic.codeBlocks.length} commands</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // If viewing a category's subcategories
  if (selectedCategory) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">{selectedCategory.name}</h2>
          <p className="text-muted-foreground mt-1">{selectedCategory.description}</p>
        </div>

        {selectedCategory.subcategories.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No subcategories yet.</p>
            {isAdmin && <p className="text-sm mt-2">Use the sidebar to add subcategories.</p>}
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {selectedCategory.subcategories.map((subcategory) => (
              <div
                key={subcategory.id}
                className="category-card cursor-pointer"
                onClick={() => onSelectSubcategory(selectedCategory.id, subcategory.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary">
                    <FolderOpen className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium">{subcategory.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{subcategory.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">{subcategory.topics.length} topics</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Default: show all categories
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 terminal-border">
          <Terminal className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Linux Command Reference</h2>
          <p className="text-muted-foreground">Your personal collection of Linux commands and configurations</p>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Terminal className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No categories yet.</p>
          {isAdmin && <p className="text-sm mt-2">Click the + button in the sidebar to create your first category.</p>}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              isSelected={false}
              onClick={() => onSelectCategory(category.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
