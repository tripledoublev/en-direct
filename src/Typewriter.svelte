<script>
  import { onMount, onDestroy } from 'svelte';
  
  export let strings = [];
  export let typingSpeed = 100; // milliseconds per character when typing
  export let deletingSpeed = 50; // milliseconds per character when deleting
  export let pauseAfterTyping = 2000; // pause after finishing typing (ms)
  export let pauseAfterDeleting = 500; // pause after finishing deleting (ms)
  
  let currentStringIndex = 0;
  let currentText = '';
  let isTyping = true;
  let isDeleting = false;
  let timeoutId;
  let dateUpdateInterval;
  let montrealTime = new Date();
  
  // French month names
  const frenchMonths = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ];
  
  // Get Montreal time components
  function getMontrealTimeParts() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Montreal',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false
    });
    
    const parts = formatter.formatToParts(now);
    const partMap = {};
    parts.forEach(part => {
      partMap[part.type] = part.value;
    });
    
    return {
      year: parseInt(partMap.year),
      month: parseInt(partMap.month) - 1, // Convert to 0-indexed
      day: parseInt(partMap.day),
      hour: parseInt(partMap.hour),
      minute: parseInt(partMap.minute),
      second: parseInt(partMap.second)
    };
  }
  
  // Replace date/time placeholders in a string
  function replaceDatePlaceholders(str) {
    if (!str) return str;
    
    const now = new Date();
    const montrealParts = getMontrealTimeParts();
    let result = str;
    
    // Replace [jour] with day of month (Montreal time)
    result = result.replace(/\[jour\]/gi, montrealParts.day.toString());
    
    // Replace [mois en mot] with French month name (Montreal time)
    result = result.replace(/\[mois en mot\]/gi, frenchMonths[montrealParts.month]);
    
    // Replace [année] or [ann/e] with year (Montreal time)
    result = result.replace(/\[année\]/gi, montrealParts.year.toString());
    result = result.replace(/\[ann\/e\]/gi, montrealParts.year.toString());
    
    // Replace [heure de montreal] with Montreal time
    let timeStr;
    try {
      timeStr = now.toLocaleTimeString('fr-FR', { 
        timeZone: 'America/Montreal',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      // Fallback: format manually using Montreal time parts
      timeStr = `${String(montrealParts.hour).padStart(2, '0')}:${String(montrealParts.minute).padStart(2, '0')}:${String(montrealParts.second).padStart(2, '0')}`;
    }
    
    // Replace [heure de montreal] (with closing bracket) - do this first
    result = result.replace(/\[heure de montreal\]/gi, timeStr);
    
    // Also handle incomplete placeholder [heure de montreal (without closing bracket)
    // Match [heure de montreal that's not followed by ]
    // Use a negative lookahead to ensure we don't match if there's a closing bracket
    result = result.replace(/\[heure de montreal(?!\])/gi, timeStr);
    
    return result;
  }
  
  // Raw strings from URL or props (without date replacements)
  let rawStrings = [];
  
  // Track if we've initialized
  let initialized = false;
  
  // Process strings from URL or props
  function processStrings(inputStrings) {
    // Replace date placeholders in each string
    return inputStrings.map(str => replaceDatePlaceholders(str));
  }
  
  // Get processed strings with date replacements
  let processedStrings = [];
  
  // Initialize raw strings from URL or props
  function initializeRawStrings() {
    // Check URL params first - handle malformed URLs with multiple ? characters
    let search = window.location.search;
    // Fix malformed URLs like ?v=1.99?strings=... to ?v=1.99&strings=...
    if (search.includes('?') && search.indexOf('?') !== search.lastIndexOf('?')) {
      search = search.replace(/\?/g, (match, offset) => offset === 0 ? match : '&');
    }
    
    const urlParams = new URLSearchParams(search);
    const urlStrings = urlParams.get('strings') || urlParams.get('text');
    
    if (urlStrings) {
      // Parse the URL parameter - handle both comma-separated and bracket-delimited formats
      let parsedStrings = [];
      
      // Decode URL entities and handle literal \n sequences
      let decoded = urlStrings;
      try {
        decoded = decodeURIComponent(urlStrings);
      } catch (e) {
        // If decoding fails, use original string
        decoded = urlStrings;
      }
      decoded = decoded.replace(/\\n/g, '\n').replace(/%0A/g, '\n');
      
      // Remove outer brackets (handle [[[[...]]]] format)
      let content = decoded.replace(/^\[+\s*/, '').replace(/\s*\]+$/, '');
      
      // If content contains newlines, split by newline first, then by comma
      if (content.includes('\n')) {
        // Split by newline, then by comma within each line
        const lines = content.split('\n');
        parsedStrings = lines
          .flatMap(line => line.split(',').map(s => s.trim()))
          .filter(s => s.length > 0);
      } else {
        // Split by comma
        parsedStrings = content.split(',').map(s => s.trim()).filter(s => s.length > 0);
      }
      
      rawStrings = parsedStrings;
    } else {
      // Fallback to prop strings
      rawStrings = [...strings];
    }
    
    // Process with current date/time
    processedStrings = processStrings(rawStrings);
  }
  
  function typeWriter() {
    const currentString = processedStrings[currentStringIndex] || '';
    
    if (isTyping && !isDeleting) {
      // Typing phase
      if (currentText.length < currentString.length) {
        currentText = currentString.substring(0, currentText.length + 1);
        timeoutId = setTimeout(typeWriter, typingSpeed);
      } else {
        // Finished typing, pause then start deleting
        isTyping = false;
        timeoutId = setTimeout(() => {
          isDeleting = true;
          typeWriter();
        }, pauseAfterTyping);
      }
    } else if (isDeleting) {
      // Deleting phase
      if (currentText.length > 0) {
        currentText = currentText.substring(0, currentText.length - 1);
        timeoutId = setTimeout(typeWriter, deletingSpeed);
      } else {
        // Finished deleting, move to next string
        isDeleting = false;
        currentStringIndex = (currentStringIndex + 1) % processedStrings.length;
        isTyping = true;
        timeoutId = setTimeout(() => {
          typeWriter();
        }, pauseAfterDeleting);
      }
    }
  }
  
  // Update date/time every second
  function updateDateTime() {
    // Update montrealTime for reference (though we use getMontrealTimeParts in replaceDatePlaceholders)
    montrealTime = new Date();
    // Reprocess strings to update date/time placeholders
    const updatedStrings = processStrings(rawStrings);
    
    // If we're currently displaying a string, update it if it contains date/time
    if (processedStrings.length > 0 && currentStringIndex < processedStrings.length) {
      const currentOriginal = processedStrings[currentStringIndex];
      const currentUpdated = updatedStrings[currentStringIndex];
      
      // Update the processed strings array
      processedStrings = updatedStrings;
      
      // If the string changed (due to time update), update currentText
      if (currentOriginal !== currentUpdated) {
        // If we've finished typing and are paused, update the text
        if (!isTyping && !isDeleting) {
          currentText = currentUpdated;
        }
        // If we're in the middle of typing, update to the new string (might cause slight jump)
        else if (isTyping && !isDeleting && currentText.length === currentOriginal.length) {
          currentText = currentUpdated;
        }
      }
    } else {
      processedStrings = updatedStrings;
    }
  }
  
  onMount(() => {
    initializeRawStrings();
    initialized = true;
    
    // Update date/time every second
    dateUpdateInterval = setInterval(updateDateTime, 1000);
    
    if (processedStrings.length > 0) {
      typeWriter();
    } else {
      console.warn('No strings to display in Typewriter component');
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (dateUpdateInterval) clearInterval(dateUpdateInterval);
    };
  });
  
  onDestroy(() => {
    if (timeoutId) clearTimeout(timeoutId);
    if (dateUpdateInterval) clearInterval(dateUpdateInterval);
  });
  
  // Watch for changes in strings prop
  $: if (strings.length > 0 && initialized) {
    const urlParams = new URLSearchParams(window.location.search);
    const urlStrings = urlParams.get('strings') || urlParams.get('text');
    // Only update if no URL param (use prop instead)
    if (!urlStrings) {
      rawStrings = [...strings];
      if (timeoutId) clearTimeout(timeoutId);
      currentStringIndex = 0;
      currentText = '';
      isTyping = true;
      isDeleting = false;
      processedStrings = processStrings(rawStrings);
      typeWriter();
    }
  }
</script>

<div class="typewriter">
  <span class="text">{currentText}</span>
  <span class="cursor">|</span>
</div>

<style>
  .typewriter {
    font-size: 4rem;
    font-weight: bold;
    color: rgba(255, 255, 255, 0.87);
    text-align: center;
    font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
    line-height: 1.2;
  }
  
  .text {
    display: inline-block;
  }
  
  .cursor {
    display: inline-block;
    animation: blink 1s infinite;
    margin-left: 2px;
  }
  
  @keyframes blink {
    0%, 50% {
      opacity: 1;
    }
    51%, 100% {
      opacity: 0;
    }
  }
  
  @media (max-width: 768px) {
    .typewriter {
      font-size: 2.5rem;
    }
  }
  
  @media (max-width: 480px) {
    .typewriter {
      font-size: 1.8rem;
    }
  }
</style>

