import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Sidebar } from './Sidebar';
import { Category } from '@/types';

interface MobileNavProps {
  categories: Category[];
  selectedCategoryId: string | null;
  selectedSubcategoryId: string | null;
  selectedTopicId: string | null;
  onSelectCategory: (id: string) => void;
  onSelectSubcategory: (categoryId: string, subcategoryId: string) => void;
  onSelectTopic: (categoryId: string, subcategoryId: string, topicId: string) => void;
}

export function MobileNav({
  categories,
  selectedCategoryId,
  selectedSubcategoryId,
  selectedTopicId,
  onSelectCategory,
  onSelectSubcategory,
  onSelectTopic
}: MobileNavProps) {
  const [open, setOpen] = useState(false);

  const handleSelectCategory = (id: string) => {
    onSelectCategory(id);
    setOpen(false);
  };

  const handleSelectSubcategory = (categoryId: string, subcategoryId: string) => {
    onSelectSubcategory(categoryId, subcategoryId);
    setOpen(false);
  };

  const handleSelectTopic = (categoryId: string, subcategoryId: string, topicId: string) => {
    onSelectTopic(categoryId, subcategoryId, topicId);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-80">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <Sidebar
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          selectedSubcategoryId={selectedSubcategoryId}
          selectedTopicId={selectedTopicId}
          onSelectCategory={handleSelectCategory}
          onSelectSubcategory={handleSelectSubcategory}
          onSelectTopic={handleSelectTopic}
          isMobile
        />
      </SheetContent>
    </Sheet>
  );
}
