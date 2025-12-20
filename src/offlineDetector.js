/**
 * Detects if a video feed is showing the offline message from Transports Québec
 * The offline message has:
 * - White background
 * - Blue text in center
 * - Dark grey overlay at bottom
 * - Transports Québec logo at top
 */

/**
 * Analyzes a video frame to detect if it shows the offline message
 * @param {HTMLVideoElement} videoElement - The video element to analyze
 * @returns {Promise<boolean>} - True if offline message is detected
 */
export async function detectOfflineMessage(videoElement) {
  if (!videoElement || videoElement.readyState < 2) {
    return false;
  }

  try {
    // Create a canvas to capture the video frame
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = videoElement.videoWidth || videoElement.clientWidth;
    canvas.height = videoElement.videoHeight || videoElement.clientHeight;
    
    if (canvas.width === 0 || canvas.height === 0) {
      return false;
    }
    
    // Draw the current video frame to canvas
    // This may fail due to CORS if video doesn't have crossOrigin set
    try {
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    } catch (drawError) {
      // CORS error - can't analyze frame, assume not offline
      // Silently return false instead of logging error
      return false;
    }
    
    // Get image data - this can also fail with CORS even if drawImage succeeded
    let imageData;
    try {
      imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } catch (getImageDataError) {
      // CORS error - canvas is tainted, can't read pixel data
      // Silently return false instead of logging error
      return false;
    }
    
    const data = imageData.data;
    
    // Analyze key regions of the offline message
    return analyzeFrameForOfflinePattern(data, canvas.width, canvas.height);
  } catch (error) {
    // Only log non-CORS/Security errors
    const isSecurityError = error.name === 'SecurityError' || 
                           error.message?.includes('tainted') ||
                           error.message?.includes('cross-origin') ||
                           error.message?.includes('CORS') ||
                           error.message?.includes('insecure');
    
    if (!isSecurityError) {
      console.error('Error detecting offline message:', error);
    }
    return false;
  }
}

/**
 * Analyzes frame data for patterns characteristic of the offline message
 */
function analyzeFrameForOfflinePattern(data, width, height) {
  if (width === 0 || height === 0) return false;
  
  // Sample regions:
  // 1. Top region (logo area) - should have dark text/logo
  // 2. Center region (message area) - should have blue text on white
  // 3. Bottom region (overlay) - should be dark grey
  
  const samples = {
    top: sampleRegion(data, width, height, 0.1, 0.05, 0.9, 0.25), // Top 25% of screen
    center: sampleRegion(data, width, height, 0.15, 0.35, 0.85, 0.5), // Center region (35-85% height)
    bottom: sampleRegion(data, width, height, 0, 0.80, 1.0, 0.20) // Bottom 20%
  };
  
  // Check for offline message characteristics:
  // 1. Center should have blue text (RGB values around 0, 0, 150-255 for blue)
  // 2. Bottom should be dark grey (low brightness, greyish)
  // 3. Overall should be mostly white background
  
  const hasBlueText = detectBlueText(samples.center);
  const hasDarkOverlay = detectDarkOverlay(samples.bottom);
  const isMostlyWhite = detectWhiteBackground(data, width, height);
  
  // If we detect blue text in center AND dark overlay at bottom AND mostly white background,
  // it's likely the offline message
  // We require at least 2 out of 3 indicators to be more robust
  const indicators = [hasBlueText, hasDarkOverlay, isMostlyWhite].filter(Boolean).length;
  return indicators >= 2 && (hasBlueText || hasDarkOverlay); // Must have at least blue text or dark overlay
}

/**
 * Samples a region of the image data
 */
function sampleRegion(data, width, height, startX, startY, endX, endY) {
  const samples = [];
  const stepX = Math.max(1, Math.floor(width * (endX - startX) / 20));
  const stepY = Math.max(1, Math.floor(height * (endY - startY) / 20));
  
  for (let y = Math.floor(height * startY); y < Math.floor(height * endY); y += stepY) {
    for (let x = Math.floor(width * startX); x < Math.floor(width * endX); x += stepX) {
      const index = (y * width + x) * 4;
      if (index < data.length - 3) {
        samples.push({
          r: data[index],
          g: data[index + 1],
          b: data[index + 2],
          a: data[index + 3]
        });
      }
    }
  }
  
  return samples;
}

/**
 * Detects blue text in the sampled region
 * Blue text typically has: high blue value, low red, low green
 */
function detectBlueText(samples) {
  if (samples.length === 0) return false;
  
  let blueTextCount = 0;
  const threshold = samples.length * 0.05; // At least 5% should be blue (text is relatively sparse)
  
  for (const pixel of samples) {
    // Blue text: B > 120, B significantly higher than R and G
    // Typical blue text: R < 80, G < 80, B > 120
    if (pixel.b > 120 && pixel.b > pixel.r + 40 && pixel.b > pixel.g + 40 && pixel.r < 100 && pixel.g < 100) {
      blueTextCount++;
    }
  }
  
  return blueTextCount >= threshold;
}

/**
 * Detects dark grey overlay at bottom
 * Dark grey: low brightness, relatively balanced RGB
 */
function detectDarkOverlay(samples) {
  if (samples.length === 0) return false;
  
  let darkCount = 0;
  const threshold = samples.length * 0.2; // At least 20% should be dark (overlay covers significant portion)
  
  for (const pixel of samples) {
    const brightness = (pixel.r + pixel.g + pixel.b) / 3;
    // Dark grey overlay: brightness < 120, and colors are relatively balanced (greyish)
    const colorBalance = Math.abs(pixel.r - pixel.g) + Math.abs(pixel.g - pixel.b) + Math.abs(pixel.r - pixel.b);
    if (brightness < 120 && colorBalance < 80) {
      darkCount++;
    }
  }
  
  return darkCount >= threshold;
}

/**
 * Detects if the overall frame is mostly white background
 */
function detectWhiteBackground(data, width, height) {
  // Sample random pixels across the frame
  const sampleSize = Math.min(1000, width * height);
  const step = Math.floor((width * height) / sampleSize);
  let whiteCount = 0;
  
  for (let i = 0; i < data.length; i += step * 4) {
    if (i + 2 < data.length) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;
      
      // White: high brightness (> 200) and colors are close together
      if (brightness > 200 && Math.abs(r - g) < 30 && Math.abs(g - b) < 30) {
        whiteCount++;
      }
    }
  }
  
  // At least 40% should be white
  return whiteCount / sampleSize > 0.4;
}

