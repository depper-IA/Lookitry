import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  light?: boolean;
}

export function Breadcrumbs({ items, className = '', light = false }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={`flex ${className}`}>
      <ol className="flex items-center space-x-2 text-[11px] font-medium tracking-wide uppercase">
        <li>
          <Link
            href="/"
            className={`transition-colors ${
              light 
                ? 'text-gray-400 hover:text-white' 
                : 'text-gray-500 hover:text-black'
            }`}
          >
            Inicio
          </Link>
        </li>
        
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center space-x-2">
            <svg
              className={`w-2.5 h-2.5 flex-shrink-0 ${light ? 'text-gray-600' : 'text-gray-300'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            
            {item.href ? (
              <Link
                href={item.href}
                className={`transition-colors ${
                  light 
                    ? 'text-gray-400 hover:text-white' 
                    : 'text-gray-500 hover:text-black'
                }`}
              >
                {item.label}
              </Link>
            ) : (
              <span className={light ? 'text-accent' : 'text-accent'}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
