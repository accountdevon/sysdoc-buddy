import { useState } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { MainContent } from '@/components/MainContent';
import { useData } from '@/contexts/DataContext';

const Index = () => {
  const { categories } = useData();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

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

  const handleBack = () => {
    if (selectedTopicId) {
      setSelectedTopicId(null);
    } else if (selectedSubcategoryId) {
      setSelectedSubcategoryId(null);
    } else {
      setSelectedCategoryId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          selectedSubcategoryId={selectedSubcategoryId}
          selectedTopicId={selectedTopicId}
          onSelectCategory={handleSelectCategory}
          onSelectSubcategory={handleSelectSubcategory}
          onSelectTopic={handleSelectTopic}
        />
        <main className="flex-1 p-6 overflow-y-auto h-[calc(100vh-4rem)]">
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
