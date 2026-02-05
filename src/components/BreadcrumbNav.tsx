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
    <Breadcrumb className="mb-4 px-1">
      <BreadcrumbList className="flex-wrap gap-1 sm:gap-1.5">
        {/* Home button */}
        <BreadcrumbItem className="shrink-0">
          <BreadcrumbLink 
            onClick={onNavigateHome}
            className="cursor-pointer flex items-center gap-1 hover:text-foreground transition-colors rounded-md px-2 py-1 hover:bg-muted"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline text-sm">Home</span>
          </BreadcrumbLink>
        </BreadcrumbItem>

        <BreadcrumbSeparator className="shrink-0">
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        </BreadcrumbSeparator>

        {!subcategoryName ? (
          <BreadcrumbItem>
            <BreadcrumbPage className="font-medium text-sm truncate max-w-[150px] sm:max-w-[200px]">
              {categoryName}
            </BreadcrumbPage>
          </BreadcrumbItem>
        ) : (
          <>
            <BreadcrumbItem className="hidden sm:flex">
              <BreadcrumbLink 
                onClick={onNavigateCategory}
                className="cursor-pointer hover:text-foreground transition-colors text-sm truncate max-w-[120px] rounded-md px-2 py-1 hover:bg-muted"
              >
                {categoryName}
              </BreadcrumbLink>
            </BreadcrumbItem>

            {/* Mobile: show ellipsis for category when we have subcategory */}
            <BreadcrumbItem className="flex sm:hidden">
              <BreadcrumbLink 
                onClick={onNavigateCategory}
                className="cursor-pointer hover:text-foreground transition-colors text-sm rounded-md px-1.5 py-1 hover:bg-muted"
                title={categoryName}
              >
                ...
              </BreadcrumbLink>
            </BreadcrumbItem>

            <BreadcrumbSeparator className="shrink-0">
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            </BreadcrumbSeparator>

            {!topicName ? (
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium text-sm truncate max-w-[150px] sm:max-w-[200px]">
                  {subcategoryName}
                </BreadcrumbPage>
              </BreadcrumbItem>
            ) : (
              <>
                {/* Desktop: show full subcategory name */}
                <BreadcrumbItem className="hidden sm:flex">
                  <BreadcrumbLink 
                    onClick={onNavigateSubcategory}
                    className="cursor-pointer hover:text-foreground transition-colors text-sm truncate max-w-[120px] rounded-md px-2 py-1 hover:bg-muted"
                  >
                    {subcategoryName}
                  </BreadcrumbLink>
                </BreadcrumbItem>

                {/* Mobile: show ellipsis for subcategory when we have topic */}
                <BreadcrumbItem className="flex sm:hidden">
                  <BreadcrumbLink 
                    onClick={onNavigateSubcategory}
                    className="cursor-pointer hover:text-foreground transition-colors text-sm rounded-md px-1.5 py-1 hover:bg-muted"
                    title={subcategoryName}
                  >
                    ...
                  </BreadcrumbLink>
                </BreadcrumbItem>

                <BreadcrumbSeparator className="shrink-0">
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </BreadcrumbSeparator>

                <BreadcrumbItem>
                  <BreadcrumbPage className="font-medium text-sm truncate max-w-[120px] sm:max-w-[200px]">
                    {topicName}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
