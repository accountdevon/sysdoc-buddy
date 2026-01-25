import { Server, Network, HardDrive, Shield, Folder, Settings, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Category } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  server: Server,
  network: Network,
  storage: HardDrive,
  security: Shield,
  folder: Folder,
  settings: Settings,
};

interface CategoryCardProps {
  category: Category;
  isSelected: boolean;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function CategoryCard({ category, isSelected, onClick, onEdit, onDelete }: CategoryCardProps) {
  const { isAdmin } = useAuth();
  const Icon = iconMap[category.icon] || Folder;

  return (
    <div
      className={`category-card cursor-pointer ${isSelected ? 'border-primary terminal-glow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-medium">{category.name}</h3>
            <p className="text-sm text-muted-foreground">{category.subcategories.length} subcategories</p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{category.description}</p>
    </div>
  );
}
