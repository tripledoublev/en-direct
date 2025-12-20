<script>
  	import { fade } from 'svelte/transition';
    import { onMount, onDestroy } from 'svelte';
    import { detectOfflineMessage } from './offlineDetector';
    import { createEventDispatcher } from 'svelte';

    export let url;
    export let description;
    export let fadeTime = 100;
    export let visible = true;
    export let refreshInterval = null; // Optional refresh interval for single source mode

    const dispatch = createEventDispatcher();
    let videoElement;
    let offlineCheckInterval;
    let refreshIntervalId = null;
    let isOffline = false;
    let lastUrl = null;

    $: if (videoElement && url) {
      // Only reload if URL actually changed
      if (url !== lastUrl) {
        lastUrl = url;
        changeSource();
      }
    }
    
    // Set up refresh interval for single source mode
    // Reactive to refreshInterval, url, and visible changes
    $: if (refreshInterval && refreshInterval > 0 && videoElement && url) {
      // Clear existing interval
      if (refreshIntervalId) {
        clearInterval(refreshIntervalId);
        refreshIntervalId = null;
      }
      
      // Set up new refresh interval
      refreshIntervalId = setInterval(() => {
        if (videoElement && url && visible) {
          // Force reload by updating src with cache-busting parameter
          // Temporarily update lastUrl to prevent reactive statement from triggering
          const separator = url.includes('?') ? '&' : '?';
          const refreshUrl = url + separator + '_refresh=' + Date.now();
          const savedLastUrl = lastUrl;
          lastUrl = refreshUrl; // Prevent reactive trigger
          videoElement.src = refreshUrl;
          videoElement.load();
          videoElement.play().catch(e => {
            console.error('Error refreshing video:', e);
          });
          // Restore lastUrl after a moment to allow normal URL changes
          setTimeout(() => {
            lastUrl = savedLastUrl;
          }, 100);
        }
      }, refreshInterval);
    } else if (!refreshInterval && refreshIntervalId) {
      // Clear interval if refreshInterval is removed
      clearInterval(refreshIntervalId);
      refreshIntervalId = null;
    }
  
    // Check offline status when video becomes visible
    $: if (visible && videoElement && videoElement.readyState >= 2) {
      // Delay check to ensure frame is rendered
      setTimeout(() => {
        checkOfflineStatus();
      }, 1000);
    }
  
    async function changeSource() {
      isOffline = false;
      if (offlineCheckInterval) {
        clearInterval(offlineCheckInterval);
        offlineCheckInterval = null;
      }
      
      videoElement.src = url;
      videoElement.load();
      try {
        await videoElement.play();
        
        // Wait for video to load a frame, then check for offline message
        const checkWhenReady = () => {
          if (videoElement.readyState >= 2) {
            setTimeout(() => {
              if (visible) {
                checkOfflineStatus();
              }
            }, 1000);
          } else {
            videoElement.addEventListener('loadeddata', checkWhenReady, { once: true });
          }
        };
        checkWhenReady();
        
        // Set up periodic checking for visible videos (every 3 seconds)
        if (offlineCheckInterval) {
          clearInterval(offlineCheckInterval);
        }
        offlineCheckInterval = setInterval(() => {
          if (visible && videoElement && videoElement.readyState >= 2) {
            checkOfflineStatus();
          }
        }, 3000);
      } catch (e) {
        console.error('Error playing video:', e);
      }
    }

    async function checkOfflineStatus() {
      if (!videoElement || !visible) return;
      
      try {
        const detected = await detectOfflineMessage(videoElement);
        if (detected !== isOffline) {
          isOffline = detected;
          dispatch('offlineStatus', { 
            url, 
            description, 
            isOffline: detected 
          });
        }
      } catch (error) {
        console.error('Error checking offline status:', error);
      }
    }
    
    // Cleanup on destroy
    onDestroy(() => {
      if (offlineCheckInterval) {
        clearInterval(offlineCheckInterval);
      }
      if (refreshIntervalId) {
        clearInterval(refreshIntervalId);
      }
    });
  </script>

<video
  bind:this={videoElement}
  width="100%"
  muted
  autoplay
  preload="auto"
  aria-label={description}
  on:stalled={() => console.warn('Video stalled')}
  on:click={() => {
    dispatch('videoClick');
  }}
  in:fade={{ duration: fadeTime }}  
  out:fade={{ duration: fadeTime }} 
  class:visible={visible}
>
  <source src={url} type="video/mp4" />
  Your browser does not support the video tag.
</video>
  
  <style>
    video {
      position: fixed;
      top: -2px;
      left: 50%;
      transform: translateX(-50%);
      min-width: 100vw;
      min-height: 69.25vw;
      width: auto;
      height: auto;
      z-index: 1;
      transition: opacity 1s ease-in-out;
      cursor: pointer;
    }

    @media (max-width: 769px) {
      video {
        left: 39%;
        min-height: 100vh;
      }
    }
    @media (max-height: 699px) {
      video {
        left: 50%;
        min-height: 100vh;
      }
    }
  </style>
  