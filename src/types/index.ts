export interface Topic {
  id: string;
  title: string;
  description: string;
  notes: string; // Detailed notes/explanation for the topic
  codeBlocks: CodeBlock[];
  createdAt: string;
  updatedAt: string;
}

export interface CodeBlock {
  id: string;
  title: string;
  description: string; // Explanation of what this command does
  code: string;
  language: string;
}

export interface Subcategory {
  id: string;
  name: string;
  description: string;
  topics: Topic[];
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  subcategories: Subcategory[];
}

export interface AppData {
  categories: Category[];
  version: string;
  exportedAt: string;
}
