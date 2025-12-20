<script>
  import { onMount, onDestroy } from 'svelte';
  
  export let currentIndex = 0;
  export let description = '';
  export let intervalDuration = 5000;
  export let visible = true;
  
  let timeRemaining = intervalDuration / 1000;
  let intervalId;
  
  // Reset timer when index changes
  $: {
    if (currentIndex !== undefined) {
      timeRemaining = intervalDuration / 1000;
    }
  }
  
  onMount(() => {
    timeRemaining = intervalDuration / 1000;
    intervalId = setInterval(() => {
      timeRemaining -= 0.1;
      if (timeRemaining <= 0) {
        timeRemaining = intervalDuration / 1000;
      }
    }, 100);
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  });
  
  onDestroy(() => {
    if (intervalId) clearInterval(intervalId);
  });
  
  $: timeProgress = intervalDuration > 0 
    ? Math.max(0, Math.min(1, timeRemaining / (intervalDuration / 1000)))
    : 1;
  
  // Interpolate from white (1.0) to black (0.0)
  $: brightness = Math.round(timeProgress * 255);
  $: squareColor = `rgb(${brightness}, ${brightness}, ${brightness})`;
</script>

{#if visible}
<div class="notation">
  <div class="pixelated-wrapper">
    <div class="notation-top">
      <div class="timer">
        <div class="time-indicator" style="background-color: {squareColor}"></div>
      </div>
      <div class="description">{description}</div>
    </div>
  </div>
</div>
{/if}

<style>
  .notation {
    position: fixed;
    bottom: 0px;
    left: 0px;
    z-index: 100;
    background: rgba(0, 0, 0, 0.7);
    padding: 6px 8px;
    color: white;
    font-family: "Times New Roman", monospace;
    backdrop-filter: blur(10px);
    overflow: visible;
    pointer-events: none;
  }
  
  .pixelated-wrapper {
    /* Extreme pixelation: scale down 10x, then scale back up */
    display: inline-block;
    transform: scale(0.1);
    transform-origin: left bottom;
    image-rendering: pixelated;
    image-rendering: -moz-crisp-edges;
    image-rendering: crisp-edges;
    -webkit-font-smoothing: none;
    -moz-osx-font-smoothing: unset;
    font-smooth: never;
    text-rendering: optimizeSpeed;
    filter: contrast(2.5) brightness(1.3) saturate(0.7);
  }
  
  .notation-top {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    transform: scale(10);
    transform-origin: left bottom;
    image-rendering: pixelated;
    image-rendering: -moz-crisp-edges;
    image-rendering: crisp-edges;
    -webkit-font-smoothing: none;
    -moz-osx-font-smoothing: unset;
  }
  
  .timer {
    display: flex;
  }
  
  .time-indicator {
    margin-top: 9.99px;
    width: 8px;
    height: 22px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    transition: background-color 0.1s linear;
  }
  
  .description {
    font-size: 32px;
    color: #e0e0e0;
    line-height: 1.4;
    /* Extreme pixelated effect */
    -webkit-font-smoothing: none;
    -moz-osx-font-smoothing: unset;
    text-rendering: optimizeSpeed;
    image-rendering: pixelated;
    image-rendering: -moz-crisp-edges;
    image-rendering: crisp-edges;
  }
  @media (max-width: 769px) {
    .notation {
      width: 100vw;
    }
    .description {
      font-size: 22px;
    }
    .time-indicator {
      margin-top: 9.99px;
      height: 12px;
      width: 6px;
    }
  }
  @media (max-height: 699px) {
    .description {
      font-size: 22px;
    }
    .time-indicator {
      margin-top: 6.66px;
      height: 16px;
      width: 6px;
    }
  }
</style>
