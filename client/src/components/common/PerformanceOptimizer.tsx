import React, { memo, useMemo, useCallback, lazy, Suspense } from 'react';

// Simple debounce implementation to avoid lodash dependency
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Performance monitoring utilities
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();
  
  static startTiming(label: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (!this.metrics.has(label)) {
        this.metrics.set(label, []);
      }
      
      this.metrics.get(label)!.push(duration);
      
      // Keep only last 100 measurements
      if (this.metrics.get(label)!.length > 100) {
        this.metrics.get(label)!.shift();
      }
      
      console.log(`Performance: ${label} took ${duration.toFixed(2)}ms`);
    };
  }
  
  static getAverageTime(label: string): number {
    const times = this.metrics.get(label);
    if (!times || times.length === 0) return 0;
    
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }
  
  static getAllMetrics(): Record<string, { average: number; count: number }> {
    const result: Record<string, { average: number; count: number }> = {};
    
    this.metrics.forEach((times, label) => {
      result[label] = {
        average: this.getAverageTime(label),
        count: times.length
      };
    });
    
    return result;
  }
}

// Cache implementation
class Cache {
  private static instance: Cache;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  
  static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache();
    }
    return Cache.instance;
  }
  
  set(key: string, data: any, ttl: number = 5 * 60 * 1000): void { // 5 minutes default TTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  
  get(key: string): any | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  size(): number {
    return this.cache.size;
  }
}

// Lazy loaded components
export const LazyDashboard = lazy(() => import('../admin/Dashboard'));
export const LazyReportManagement = lazy(() => import('../admin/ReportManagement'));
export const LazyUserManagement = lazy(() => import('../admin/UserManagement'));
export const LazyCollectorDashboard = lazy(() => import('../collector/CollectorDashboard'));
export const LazyReportDetails = lazy(() => import('../collector/ReportDetails'));
export const LazyCitizenDashboard = lazy(() => import('../citizen/CitizenDashboard'));
export const LazyReportForm = lazy(() => import('../citizen/ReportForm'));
export const LazyRewardsPage = lazy(() => import('../citizen/RewardsPage'));
export const LazyNotificationCenter = lazy(() => import('./NotificationCenter'));
export const LazyMapView = lazy(() => import('./MapView'));

// Loading component
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
    <span className="text-gray-600">{message}</span>
  </div>
);

// HOC for performance monitoring
export function withPerformanceMonitoring<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  componentName: string
) {
  return memo((props: T) => {
    const endTiming = useMemo(() => {
      return PerformanceMonitor.startTiming(`${componentName}_render`);
    }, []);
    
    React.useEffect(() => {
      endTiming();
    });
    
    return <WrappedComponent {...props} />;
  });
}

// HOC for caching
export function withCaching<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  cacheKey: (props: T) => string,
  ttl?: number
) {
  return memo((props: T) => {
    const cache = Cache.getInstance();
    const key = cacheKey(props);
    
    const cachedResult = cache.get(key);
    
    if (cachedResult) {
      return cachedResult;
    }
    
    const result = <WrappedComponent {...props} />;
    cache.set(key, result, ttl);
    
    return result;
  });
}

// Debounced search hook
export function useDebouncedSearch(
  searchFunction: (query: string) => void,
  delay: number = 300
) {
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      searchFunction(query);
    }, delay),
    [searchFunction, delay]
  );
  
  return debouncedSearch;
}

// Virtual list component for large datasets
interface VirtualListProps {
  items: any[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: any, index: number) => React.ReactNode;
}

export const VirtualList: React.FC<VirtualListProps> = memo(({
  items,
  itemHeight,
  containerHeight,
  renderItem
}) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );
  
  const visibleItems = items.slice(visibleStart, visibleEnd);
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);
  
  return (
    <div
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${visibleStart * itemHeight}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) =>
            renderItem(item, visibleStart + index)
          )}
        </div>
      </div>
    </div>
  );
});

// Image optimization component
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  lazy?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = memo(({
  src,
  alt,
  width,
  height,
  className,
  lazy = true
}) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [error, setError] = React.useState(false);
  
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);
  
  const handleError = useCallback(() => {
    setError(true);
  }, []);
  
  if (error) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-500 text-sm">Failed to load image</span>
      </div>
    );
  }
  
  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {!isLoaded && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center"
        >
          <span className="text-gray-500 text-sm">Loading...</span>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={lazy ? 'lazy' : 'eager'}
        onLoad={handleLoad}
        onError={handleError}
        className={`${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
      />
    </div>
  );
});

// Lazy wrapper component
interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const LazyWrapper: React.FC<LazyWrapperProps> = ({ 
  children, 
  fallback = <LoadingSpinner /> 
}) => (
  <Suspense fallback={fallback}>
    {children}
  </Suspense>
);

// Performance dashboard component
export const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = React.useState<Record<string, { average: number; count: number }>>({});
  const cache = Cache.getInstance();
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(PerformanceMonitor.getAllMetrics());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const clearCache = useCallback(() => {
    cache.clear();
  }, [cache]);
  
  const clearMetrics = useCallback(() => {
    PerformanceMonitor['metrics'].clear();
    setMetrics({});
  }, []);
  
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Performance Dashboard</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 p-3 rounded">
          <h4 className="font-medium mb-2">Cache Statistics</h4>
          <p className="text-sm text-gray-600">Cache Size: {cache.size()} items</p>
          <button
            onClick={clearCache}
            className="mt-2 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
          >
            Clear Cache
          </button>
        </div>
        
        <div className="bg-gray-50 p-3 rounded">
          <h4 className="font-medium mb-2">Performance Metrics</h4>
          <p className="text-sm text-gray-600">
            Tracked Components: {Object.keys(metrics).length}
          </p>
          <button
            onClick={clearMetrics}
            className="mt-2 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
          >
            Clear Metrics
          </button>
        </div>
      </div>
      
      {Object.keys(metrics).length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Component</th>
                <th className="px-4 py-2 text-left">Average Time (ms)</th>
                <th className="px-4 py-2 text-left">Render Count</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(metrics).map(([component, data]) => (
                <tr key={component} className="border-b">
                  <td className="px-4 py-2">{component}</td>
                  <td className="px-4 py-2">{data.average.toFixed(2)}</td>
                  <td className="px-4 py-2">{data.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export { Cache };