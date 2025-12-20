<script>
  import { onMount } from "svelte";
  import Video from "./Video.svelte";
  import videoCameras from "./video_cameras";
  import Notation from "./Notation.svelte";
  import Typewriter from "./Typewriter.svelte";

  // Check URL params for interval duration (in seconds) and specific index
  const urlParams = new URLSearchParams(window.location.search);
  const intervalSeconds = urlParams.get('v');
  const specificIndex = urlParams.get('i');
  
  const baseInterval = 1990; // default 1.99 seconds in milliseconds
  const intervalDuration = intervalSeconds 
    ? parseFloat(intervalSeconds) * 1000 || baseInterval 
    : baseInterval;
  const preloadTime = intervalDuration * 0.75;
  const fadeTime = intervalDuration * 0.99;
  
  // If specific index is provided, use it (no rotation)
  const useSpecificIndex = specificIndex !== null;
  const requestedIndex = specificIndex !== null ? parseInt(specificIndex, 10) : null;

  // Track offline cameras by URL
  let offlineCameras = new Set();
  
  // Filter out offline cameras
  $: availableCameras = videoCameras.filter(camera => !offlineCameras.has(camera.url));
  $: videoUrls = availableCameras.map((video) => video.url);
  
  // Initialize index based on URL parameter or default to 0
  let currentVideoIndex = 0;
  let nextVideoIndex = 1;
  let specificIndexInitialized = false;

  let currentVideoVisible = true;
  let nextVideoVisible = false;
  let notationVisible = false;
  
  // Adjust current index based on URL parameter and available cameras
  $: if (availableCameras.length > 0) {
    if (useSpecificIndex && requestedIndex !== null && !isNaN(requestedIndex)) {
      // For specific index mode, find the camera at the requested index in original array
      const originalIndex = Math.max(0, Math.min(requestedIndex, videoCameras.length - 1));
      const requestedCamera = videoCameras[originalIndex];
      
      // Find this camera in the available cameras array
      const availableIndex = availableCameras.findIndex(cam => cam.url === requestedCamera.url);
      
      if (availableIndex !== -1) {
        // Use the specific camera if available (always restore when it comes back online)
        currentVideoIndex = availableIndex;
        specificIndexInitialized = true;
      } else if (!specificIndexInitialized) {
        // Camera is offline on first load, use first available
        currentVideoIndex = 0;
        specificIndexInitialized = true;
      }
      // Keep nextVideoIndex same as current in single source mode
      nextVideoIndex = currentVideoIndex;
    } else {
      // Normal rotation mode
      if (currentVideoIndex >= availableCameras.length) {
        currentVideoIndex = 0;
        nextVideoIndex = 1;
      }
    }
  } else if (availableCameras.length === 0) {
    currentVideoIndex = 0;
    nextVideoIndex = 0;
  }
  
  $: currentVideoDescription = availableCameras[currentVideoIndex]?.description || '';
  $: totalAvailableVideos = availableCameras.length;
  $: currentVideoUrl = videoUrls[currentVideoIndex] || null;
  $: nextVideoUrl = videoUrls[nextVideoIndex] || null;

  // Handle offline status updates from Video components
  function handleOfflineStatus(event) {
    const { url, isOffline } = event.detail;
    
    if (isOffline) {
      offlineCameras.add(url);
      console.log(`Camera marked as offline: ${url}`);
      
      // If the current video just went offline, move to next available
      // But don't auto-advance if using specific index mode
      if (url === currentVideoUrl && availableCameras.length > 1 && !useSpecificIndex) {
        currentVideoIndex = (currentVideoIndex + 1) % availableCameras.length;
      }
    } else {
      offlineCameras.delete(url);
      console.log(`Camera back online: ${url}`);
    }
    
    // Force reactivity update
    offlineCameras = offlineCameras;
  }

  // Function to preload and transition to the next video
  async function transitionVideos() {
    if (videoUrls.length === 0) {
      console.warn('No available videos');
      return;
    }
    
    // Don't rotate if using specific index
    if (useSpecificIndex) {
      return;
    }
    
    // Preload next video at 80% of the interval
    setTimeout(() => {
      nextVideoIndex = (currentVideoIndex + 1) % videoUrls.length;
    }, preloadTime);

    // Fade current video out and next video in at 98% of the interval
    setTimeout(() => {
      currentVideoVisible = false;
      nextVideoVisible = true;
    }, fadeTime);

    // Switch videos at 100% of the interval
    setTimeout(() => {
      currentVideoIndex = nextVideoIndex;
    }, intervalDuration);
  }

  onMount(() => {
    // Only set up rotation interval if not using specific index
    if (!useSpecificIndex) {
      const interval = setInterval(transitionVideos, intervalDuration);

      return () => {
        clearInterval(interval); // clear interval on component destruction
      };
    }
  });
</script>


{#if videoUrls.length > 0}
  <Video 
    url={videoUrls[currentVideoIndex]} 
    description={`Video ${currentVideoIndex + 1}`} 
    visible={currentVideoVisible}
    refreshInterval={useSpecificIndex ? intervalDuration : null}
    on:offlineStatus={handleOfflineStatus}
    on:videoClick={() => {
      notationVisible = !notationVisible;
    }}
  />
  {#if !useSpecificIndex}
    <Video 
      url={videoUrls[nextVideoIndex]} 
      description={`Video ${nextVideoIndex + 1}`} 
      visible={nextVideoVisible}
      on:offlineStatus={handleOfflineStatus}
      on:videoClick={() => {
      notationVisible = !notationVisible;
    }}
    />
  {/if}
  <Notation 
    currentIndex={currentVideoIndex} 
    description={currentVideoDescription}
    intervalDuration={intervalDuration}
    visible={notationVisible}
  />
  <Typewriter />
{:else}
  <div class="no-videos">
    <p>Tous les flux vidéo sont actuellement hors ligne.</p>
    <p>All video feeds are currently offline.</p>
  </div>
{/if}
<!--
  <div class='bottom'>
  <Scrolling />
</div>
-->

<style>
 .bottom {
   position: absolute;
   bottom:0;
   left:0;
 }
 
 .no-videos {
   position: fixed;
   top: 50%;
   left: 50%;
   transform: translate(-50%, -50%);
   text-align: center;
   color: white;
   font-size: 24px;
   z-index: 1000;
 }
 
 :global(.typewriter) {
   position: fixed;
   top: 50%;
   left: 50%;
   transform: translate(-50%, -50%);
   z-index: 200;
   pointer-events: none;
 }
</style>