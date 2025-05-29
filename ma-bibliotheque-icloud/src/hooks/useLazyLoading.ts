import { useEffect, useRef, useState } from 'react';

interface UseLazyLoadingOptions {
  rootMargin?: string;
  threshold?: number;
}

export function useLazyLoading({
  rootMargin = '200px 0px',
  threshold = 0.1
}: UseLazyLoadingOptions = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Une fois que l'élément est visible, nous n'avons plus besoin de l'observer
          observer.unobserve(element);
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [rootMargin, threshold]);

  return { elementRef, isVisible };
}
