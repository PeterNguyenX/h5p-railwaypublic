/**
 * Utility functions for handling video thumbnails
 */

export const DEFAULT_THUMBNAIL_URL = '/api/default-thumbnail.svg';

/**
 * Get the correct thumbnail URL for a video
 * @param thumbnailPath - The thumbnail path from the backend
 * @returns A properly formatted thumbnail URL
 */
export const getThumbnailUrl = (thumbnailPath?: string | null): string => {
  // If no thumbnail path provided, use default
  if (!thumbnailPath || thumbnailPath === '') {
    return DEFAULT_THUMBNAIL_URL;
  }
  
  // If already pointing to default, return as is
  if (thumbnailPath === '/default-thumbnail.svg' || thumbnailPath === DEFAULT_THUMBNAIL_URL) {
    return DEFAULT_THUMBNAIL_URL;
  }
  
  // If the path already starts with /api/, use it as is
  if (thumbnailPath.startsWith('/api/')) {
    return thumbnailPath;
  }
  
  // If it's a relative path from backend (like "uploads/hls/video/thumbnail.jpg"), 
  // convert it to API path
  if (thumbnailPath.startsWith('uploads/')) {
    return `/api/${thumbnailPath}`;
  }
  
  // If it starts with /, assume it's already an API path but may need /api prefix
  if (thumbnailPath.startsWith('/')) {
    // Check if it's already a proper API path
    if (thumbnailPath.startsWith('/uploads/') || thumbnailPath.startsWith('/public/')) {
      return `/api${thumbnailPath}`;
    }
    return thumbnailPath;
  }
  
  // Default case: prepend /api/ to make it accessible
  return `/api/${thumbnailPath}`;
};

/**
 * Handle image loading errors by falling back to default thumbnail
 * @param event - The error event from the img element
 */
export const handleThumbnailError = (event: React.SyntheticEvent<HTMLImageElement, Event>): void => {
  const target = event.target as HTMLImageElement;
  if (target.src && !target.src.includes('default-thumbnail.svg')) {
    console.log(`Thumbnail failed to load: ${target.src}, falling back to default`);
    target.src = DEFAULT_THUMBNAIL_URL;
  }
};

/**
 * Preload a thumbnail and return a promise that resolves with the URL or fallback
 * @param thumbnailPath - The thumbnail path to preload
 * @returns Promise that resolves with the working URL
 */
export const preloadThumbnail = (thumbnailPath?: string | null): Promise<string> => {
  return new Promise((resolve) => {
    const url = getThumbnailUrl(thumbnailPath);
    
    // If it's already the default, resolve immediately
    if (url === DEFAULT_THUMBNAIL_URL) {
      resolve(url);
      return;
    }
    
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => {
      console.log(`Failed to preload thumbnail: ${url}, using default`);
      resolve(DEFAULT_THUMBNAIL_URL);
    };
    img.src = url;
  });
};
