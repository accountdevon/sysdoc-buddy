import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Category, Subcategory, Topic, CodeBlock, AppData } from '@/types';

interface DataContextType {
  categories: Category[];
  addCategory: (category: Omit<Category, 'id' | 'subcategories'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  addSubcategory: (categoryId: string, subcategory: Omit<Subcategory, 'id' | 'topics'>) => void;
  updateSubcategory: (categoryId: string, subcategoryId: string, updates: Partial<Subcategory>) => void;
  deleteSubcategory: (categoryId: string, subcategoryId: string) => void;
  addTopic: (categoryId: string, subcategoryId: string, topic: Omit<Topic, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTopic: (categoryId: string, subcategoryId: string, topicId: string, updates: Partial<Topic>) => void;
  deleteTopic: (categoryId: string, subcategoryId: string, topicId: string) => void;
  exportData: () => string;
  importData: (jsonString: string) => boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEY = 'linux_admin_data';

const generateId = () => Math.random().toString(36).substring(2, 15);

const defaultData: Category[] = [
  {
    id: '1',
    name: 'System Administration',
    description: 'Core system management commands and configurations',
    icon: 'server',
    subcategories: [
      {
        id: '1-1',
        name: 'User Management',
        description: 'Managing users and groups',
        topics: [
          {
            id: '1-1-1',
            title: 'Add New User',
            description: 'Create a new user account on the system',
            codeBlocks: [
              {
                id: 'cb1',
                title: 'Create user with home directory',
                code: 'sudo useradd -m -s /bin/bash username',
                language: 'bash'
              },
              {
                id: 'cb2',
                title: 'Set password for user',
                code: 'sudo passwd username',
                language: 'bash'
              }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      }
    ]
  },
  {
    id: '2',
    name: 'Networking',
    description: 'Network configuration and troubleshooting',
    icon: 'network',
    subcategories: [
      {
        id: '2-1',
        name: 'Network Diagnostics',
        description: 'Tools for diagnosing network issues',
        topics: [
          {
            id: '2-1-1',
            title: 'Check Network Connectivity',
            description: 'Various commands to test network connectivity',
            codeBlocks: [
              {
                id: 'cb3',
                title: 'Ping a host',
                code: 'ping -c 4 google.com',
                language: 'bash'
              },
              {
                id: 'cb4',
                title: 'Trace route to host',
                code: 'traceroute google.com',
                language: 'bash'
              }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      }
    ]
  }
];

export function DataProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCategories(parsed);
      } catch {
        setCategories(defaultData);
      }
    } else {
      setCategories(defaultData);
    }
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    }
  }, [categories]);

  const addCategory = (category: Omit<Category, 'id' | 'subcategories'>) => {
    setCategories(prev => [...prev, { ...category, id: generateId(), subcategories: [] }]);
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(cat => cat.id === id ? { ...cat, ...updates } : cat));
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== id));
  };

  const addSubcategory = (categoryId: string, subcategory: Omit<Subcategory, 'id' | 'topics'>) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          subcategories: [...cat.subcategories, { ...subcategory, id: generateId(), topics: [] }]
        };
      }
      return cat;
    }));
  };

  const updateSubcategory = (categoryId: string, subcategoryId: string, updates: Partial<Subcategory>) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          subcategories: cat.subcategories.map(sub =>
            sub.id === subcategoryId ? { ...sub, ...updates } : sub
          )
        };
      }
      return cat;
    }));
  };

  const deleteSubcategory = (categoryId: string, subcategoryId: string) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          subcategories: cat.subcategories.filter(sub => sub.id !== subcategoryId)
        };
      }
      return cat;
    }));
  };

  const addTopic = (categoryId: string, subcategoryId: string, topic: Omit<Topic, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    setCategories(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          subcategories: cat.subcategories.map(sub => {
            if (sub.id === subcategoryId) {
              return {
                ...sub,
                topics: [...sub.topics, { ...topic, id: generateId(), createdAt: now, updatedAt: now }]
              };
            }
            return sub;
          })
        };
      }
      return cat;
    }));
  };

  const updateTopic = (categoryId: string, subcategoryId: string, topicId: string, updates: Partial<Topic>) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          subcategories: cat.subcategories.map(sub => {
            if (sub.id === subcategoryId) {
              return {
                ...sub,
                topics: sub.topics.map(topic =>
                  topic.id === topicId ? { ...topic, ...updates, updatedAt: new Date().toISOString() } : topic
                )
              };
            }
            return sub;
          })
        };
      }
      return cat;
    }));
  };

  const deleteTopic = (categoryId: string, subcategoryId: string, topicId: string) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          subcategories: cat.subcategories.map(sub => {
            if (sub.id === subcategoryId) {
              return {
                ...sub,
                topics: sub.topics.filter(topic => topic.id !== topicId)
              };
            }
            return sub;
          })
        };
      }
      return cat;
    }));
  };

  const exportData = (): string => {
    const data: AppData = {
      categories,
      version: '1.0.0',
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  };

  const importData = (jsonString: string): boolean => {
    try {
      const data: AppData = JSON.parse(jsonString);
      if (data.categories && Array.isArray(data.categories)) {
        setCategories(data.categories);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <DataContext.Provider value={{
      categories,
      addCategory,
      updateCategory,
      deleteCategory,
      addSubcategory,
      updateSubcategory,
      deleteSubcategory,
      addTopic,
      updateTopic,
      deleteTopic,
      exportData,
      importData
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
