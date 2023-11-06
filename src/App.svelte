<!-- App.svelte -->
<script>
  import { onMount } from "svelte";
  import Video from "./Video.svelte";
  import videoCameras from "./video_cameras";

  let currentVideoIndex = 0;
  let videoUrls = videoCameras.map(video => video.url); // assuming videoCameras is an array of objects with a url field

  // Function to cycle through videos
  function cycleVideos() {
    currentVideoIndex = (currentVideoIndex + 1) % videoUrls.length;
  }

  // Start cycling videos on mount
  onMount(() => {
    const interval = setInterval(cycleVideos, 3000);
    return () => {
      clearInterval(interval); // clear interval on component destruction
    };
  });
</script>

<!-- Passing only the current URL to the Video component -->
<Video url={videoUrls[currentVideoIndex]} description={`Video ${currentVideoIndex + 1}`} />
