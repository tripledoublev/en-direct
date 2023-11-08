<script>
  import { onMount, tick } from "svelte";
  import { tweened } from "svelte/motion";
  import Video from "./Video.svelte";
  import videoCameras from "./video_cameras";

  const intervalDuration = 2222; // change this to the initial timer duration
  const preloadTime = intervalDuration * 0.75;
  const fadeTime = intervalDuration * 0.99;

  let videoUrls = videoCameras.map((video) => video.url);
  let currentVideoIndex = 0;
  let nextVideoIndex = 1;

  let currentVideoVisible = true;
  let nextVideoVisible = false;

  // Function to preload and transition to the next video
  async function transitionVideos() {
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
    const interval = setInterval(transitionVideos, intervalDuration);

    return () => {
      clearInterval(interval); // clear interval on component destruction
    };
  });

  // Make sure the videos are loaded in the DOM before playing
  $: loaded = false;
  onMount(() => {
    tick().then(() => {
      loaded = true;
    });
  });
</script>


<Video url={videoUrls[currentVideoIndex]} description={`Video ${currentVideoIndex + 1}`} visible={currentVideoVisible} />
<Video url={videoUrls[nextVideoIndex]} description={`Video ${nextVideoIndex + 1}`} visible={nextVideoVisible} />
