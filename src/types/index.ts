export interface Topic {
  id: string;
  title: string;
  description: string;
  codeBlocks: CodeBlock[];
  createdAt: string;
  updatedAt: string;
}

export interface CodeBlock {
  id: string;
  title: string;
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
