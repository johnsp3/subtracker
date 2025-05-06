/**
 * Generates a monogram (initials) from a subscription name
 * @param name The subscription name
 * @returns The initials (1-2 characters)
 */
export function generateMonogram(name: string): string {
  if (!name || name.trim() === '') {
    return 'S'; // Default to 'S' for Subscription if no name provided
  }

  // Extract initials - either first letter or first letters of multiple words
  const words = name.trim().split(/\s+/);
  let initials = '';
  
  if (words.length === 1) {
    // Single word - use first letter (always uppercase)
    initials = words[0].charAt(0).toUpperCase();
  } else if (words.length >= 2) {
    // Multiple words - use first letter of first and second word (both uppercase)
    initials = words[0].charAt(0).toUpperCase() + words[1].charAt(0).toUpperCase();
    
    // If we have more than 2 characters, trim to 2
    initials = initials.substring(0, 2);
  }
  
  return initials;
}

/**
 * Generates a background color based on a subscription name
 * @param name The subscription name
 * @returns CSS color value (hsl format)
 */
export function generateBackgroundColor(name: string): string {
  // Generate a color based on the name for consistency
  const hue = hashStringToNumber(name) % 360;
  return `hsl(${hue}, 65%, 75%)`;
}

/**
 * Hashes a string to a number for consistent color generation
 */
function hashStringToNumber(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
} 