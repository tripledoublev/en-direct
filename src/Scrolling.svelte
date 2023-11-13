<script>
</script>

<div class="hwrap items-center">
  <div class="hmove justify-center text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl">
    <div class="hitem">10 years of Trippin • 10 years of Trippin • 10 years of Trippin • 10 years of Trippin • 10 years of Trippin •  10 years of Trippin • 10 years of Trippin • 10 years of Trippin • 10 years of Trippin • 10 years of Trippin •  10 years of Trippin • 10 years of Trippin • 10 years of Trippin • 10 years of Trippin • 10 years of Trippin •  10 years of Trippin • 10 years of Trippin • 10 years of Trippin • 10 years of Trippin • 10 years of Trippin •  10 years of Trippin • 10 years of Trippin • 10 years of Trippin • 10 years of Trippin • 10 years of Trippin •  </div>
    <div class="hitem">10 years of Trippin • 10 years of Trippin • 10 years of Trippin • 10 years of Trippin • 10 years of Trippin • </div>
    <div class="hitem">10 years of Trippin • 10 years of Trippin • 10 years of Trippin • 10 years of Trippin • 10 years of Trippin • </div>
    <div class="hitem">10 years of Trippin • 10 years of Trippin • 10 years of Trippin • 10 years of Trippin • 10 years of Trippin • </div>
   </div>
</div>

<style>
  .hwrap {
    overflow: hidden;
    background: black;
    width: 100vw;
    height: 8vh;
    z-index: 4;
    display: flex;
    position: relative;
  }

  .hmove {
    display: flex;
    align-items: center;
    position: absolute;
    white-space: nowrap;
    animation: tickerh linear 20s infinite;
    width: 100%;
  }

  @media (max-width:1200px) {
    .hmove { animation: tickerh linear 10s infinite; }
  }

  .hmove:hover { animation-play-state: paused; }

  .hitem {
    flex-shrink: 0;
    padding: 10px;
    text-align: center;
    font-family: monospace;
    font-style: normal;
    font-weight: 500;
    color: white;
    font-size: xx-large;
  }

  @keyframes tickerh {
    0% { transform: translateX(0%); }
    100% { transform: translateX(-70%); }
  }
</style>
