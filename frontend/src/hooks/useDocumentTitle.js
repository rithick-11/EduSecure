import { useEffect } from 'react';

/**
 * Custom hook to set the document title dynamically.
 * Appends " | EduSecure" to the specific page title.
 */
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = `${title} | EduSecure`;
    
    // Cleanup function when component unmounts (optional, but good practice if you want to revert)
    return () => {
      document.title = 'EduSecure';
    };
  }, [title]);
}
