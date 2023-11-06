<script>
    export let text; // Prop for the description text
</script>

<div class="description">
    {text}
</div>

<style>
    .description {
        position: absolute;
        bottom: 0;
        right: 0;
        color: white;
        font-family: monospace;
        font-weight: bolder;
        font-size: xx-large;
        width: 100%;
        padding: 1em;
        box-sizing: border-box;
        text-align: center;
    }
</style>
