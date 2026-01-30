import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { MainContent } from '@/components/MainContent';
import { MobileNav } from '@/components/MobileNav';
import { SearchDialog } from '@/components/SearchDialog';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { PanelLeftClose, PanelLeft } from 'lucide-react';

const Index = () => {
  const { categories } = useData();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const handleSelectCategory = (id: string) => {
    setSelectedCategoryId(id);
    setSelectedSubcategoryId(null);
    setSelectedTopicId(null);
  };

  const handleSelectSubcategory = (categoryId: string, subcategoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedSubcategoryId(subcategoryId);
    setSelectedTopicId(null);
  };

  const handleSelectTopic = (categoryId: string, subcategoryId: string, topicId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedSubcategoryId(subcategoryId);
    setSelectedTopicId(topicId);
  };

  const handleSearchNavigate = useCallback((categoryId: string, subcategoryId?: string, topicId?: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedSubcategoryId(subcategoryId || null);
    setSelectedTopicId(topicId || null);
  }, []);

  const handleBack = () => {
    if (selectedTopicId) {
      setSelectedTopicId(null);
    } else if (selectedSubcategoryId) {
      setSelectedSubcategoryId(null);
    } else {
      setSelectedCategoryId(null);
    }
  };

  // Ctrl+F keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header
        mobileNav={
          <MobileNav
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            selectedSubcategoryId={selectedSubcategoryId}
            selectedTopicId={selectedTopicId}
            onSelectCategory={handleSelectCategory}
            onSelectSubcategory={handleSelectSubcategory}
            onSelectTopic={handleSelectTopic}
          />
        }
        onOpenSearch={() => setSearchOpen(true)}
      />
      <SearchDialog 
        open={searchOpen} 
        onOpenChange={setSearchOpen}
        onNavigate={handleSearchNavigate}
      />
      <div className="flex relative">
        {/* Sidebar with integrated toggle */}
        <div className={`hidden lg:flex flex-col transition-all duration-300 ${sidebarVisible ? 'w-80' : 'w-0'}`}>
          {sidebarVisible && (
            <Sidebar
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              selectedSubcategoryId={selectedSubcategoryId}
              selectedTopicId={selectedTopicId}
              onSelectCategory={handleSelectCategory}
              onSelectSubcategory={handleSelectSubcategory}
              onSelectTopic={handleSelectTopic}
            />
          )}
        </div>

        {/* Sidebar Toggle Button - positioned at edge of sidebar */}
        <Button
          variant="ghost"
          size="icon"
          className={`fixed top-20 z-50 hidden lg:flex h-8 w-8 rounded-lg bg-card border border-border shadow-md hover:bg-secondary transition-all duration-300 ${
            sidebarVisible ? 'left-[19rem]' : 'left-2'
          }`}
          onClick={() => setSidebarVisible(!sidebarVisible)}
          title={sidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
        >
          {sidebarVisible ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeft className="h-4 w-4" />
          )}
        </Button>

        <main className="flex-1 p-4 md:p-6 overflow-y-auto h-[calc(100vh-4rem)]">
          <MainContent
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            selectedSubcategoryId={selectedSubcategoryId}
            selectedTopicId={selectedTopicId}
            onSelectCategory={handleSelectCategory}
            onSelectSubcategory={handleSelectSubcategory}
            onSelectTopic={handleSelectTopic}
            onBack={handleBack}
          />
        </main>
      </div>
    </div>
  );
};

export default Index;
