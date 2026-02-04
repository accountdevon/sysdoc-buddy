import { Home, ChevronRight } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface BreadcrumbNavProps {
  categoryName?: string;
  subcategoryName?: string;
  topicName?: string;
  onNavigateHome: () => void;
  onNavigateCategory: () => void;
  onNavigateSubcategory: () => void;
}

export function BreadcrumbNav({
  categoryName,
  subcategoryName,
  topicName,
  onNavigateHome,
  onNavigateCategory,
  onNavigateSubcategory,
}: BreadcrumbNavProps) {
  // Don't show breadcrumbs on home
  if (!categoryName) return null;

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink 
            onClick={onNavigateHome}
            className="cursor-pointer flex items-center gap-1.5 hover:text-foreground"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Home</span>
          </BreadcrumbLink>
        </BreadcrumbItem>

        <BreadcrumbSeparator>
          <ChevronRight className="h-4 w-4" />
        </BreadcrumbSeparator>

        {!subcategoryName ? (
          <BreadcrumbItem>
            <BreadcrumbPage>{categoryName}</BreadcrumbPage>
          </BreadcrumbItem>
        ) : (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink 
                onClick={onNavigateCategory}
                className="cursor-pointer hover:text-foreground"
              >
                {categoryName}
              </BreadcrumbLink>
            </BreadcrumbItem>

            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>

            {!topicName ? (
              <BreadcrumbItem>
                <BreadcrumbPage>{subcategoryName}</BreadcrumbPage>
              </BreadcrumbItem>
            ) : (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink 
                    onClick={onNavigateSubcategory}
                    className="cursor-pointer hover:text-foreground"
                  >
                    {subcategoryName}
                  </BreadcrumbLink>
                </BreadcrumbItem>

                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>

                <BreadcrumbItem>
                  <BreadcrumbPage className="max-w-[200px] truncate">{topicName}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
