/**
 * Utility to update meta tags dynamically
 * Note: Social media crawlers don't execute JS, so this mainly helps with browser tabs
 * For social sharing, the initial HTML meta tags should point to the PHP endpoint with query params
 */

// Configuration - UPDATE THIS with your FTP server URL
const OG_IMAGE_BASE_URL = 'https://charlebois.solutions/php/og-image.php';
const SITE_BASE_URL = 'https://tripledoublev.github.io/en-direct/';

/**
 * Update meta tags based on current camera
 * @param {number} index - Camera index in original array
 * @param {string} description - Camera description
 */
export function updateMetaTags(index, description) {
  const encodedDesc = encodeURIComponent(description);
  const ogImageUrl = `${OG_IMAGE_BASE_URL}?i=${index}&desc=${encodedDesc}`;
  const currentUrl = `${SITE_BASE_URL}${index !== null ? `?i=${index}` : ''}`;
  
  // Update OG tags
  updateMetaTag('og:image', ogImageUrl);
  updateMetaTag('og:url', currentUrl);
  updateMetaTag('og:title', `En direct: ${description}`);
  updateMetaTag('og:description', description);
  
  // Update Twitter tags
  updateMetaTag('twitter:image', ogImageUrl);
  updateMetaTag('twitter:url', currentUrl);
  updateMetaTag('twitter:title', `En direct: ${description}`);
  updateMetaTag('twitter:description', description);
  
  // Update page title
  document.title = `En direct: ${description}`;
}

/**
 * Update a specific meta tag by property name
 */
function updateMetaTag(property, content) {
  // Try property attribute first (OG tags)
  let meta = document.querySelector(`meta[property="${property}"]`);
  if (meta) {
    meta.setAttribute('content', content);
    return;
  }
  
  // Try name attribute (Twitter tags sometimes use name)
  meta = document.querySelector(`meta[name="${property}"]`);
  if (meta) {
    meta.setAttribute('content', content);
    return;
  }
  
  // If not found, create it
  meta = document.createElement('meta');
  if (property.startsWith('twitter:')) {
    meta.setAttribute('name', property);
  } else {
    meta.setAttribute('property', property);
  }
  meta.setAttribute('content', content);
  document.head.appendChild(meta);
}

/**
 * Generate OG image URL for a specific camera
 * This can be used in initial HTML generation if needed
 */
export function getOgImageUrl(index, description) {
  const encodedDesc = encodeURIComponent(description);
  return `${OG_IMAGE_BASE_URL}?i=${index}&desc=${encodedDesc}`;
}

