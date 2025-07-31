<!-- MinimalistUnderwaterBackground.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { gsap } from 'gsap';

	// Svelte 5 runes for reactive state
	let containerRef: HTMLElement;
	let bubblesRef: HTMLElement;
	let lightRaysRef: HTMLElement;

	let masterTimeline: gsap.core.Timeline;

	onMount(() => {
		if (!containerRef) return;

		// Create master timeline
		masterTimeline = gsap.timeline({ repeat: -1 });

		initializeAnimations();

		return () => {
			// Cleanup on destroy
			if (masterTimeline) {
				masterTimeline.kill();
			}
		};
	});

	function initializeAnimations() {
		createBubbleAnimation();
		createLightRayAnimation();
	}

	function createBubbleAnimation() {
		const bubbles = bubblesRef?.querySelectorAll('.bubble');
		if (!bubbles) return;

		bubbles.forEach((bubble, index) => {
			// Set initial position at bottom
			gsap.set(bubble, {
				x: Math.random() * window.innerWidth,
				y: window.innerHeight + 20,
				opacity: 0.4 + Math.random() * 0.4,
				scale: 0.5 + Math.random() * 0.5
			});

			// Animate upward with gentle sway
			const tl = gsap.timeline({ repeat: -1, delay: index * 2 });

			tl.to(bubble, {
				y: -50,
				x: `+=${(Math.random() - 0.5) * 100}`,
				rotation: 360,
				duration: 8 + Math.random() * 6,
				ease: 'none'
			});

			// Add gentle horizontal sway
			gsap.to(bubble, {
				x: `+=${20}`,
				duration: 3 + Math.random() * 2,
				ease: 'power2.inOut',
				repeat: -1,
				yoyo: true,
				delay: index * 0.5
			});
		});
	}

	function createLightRayAnimation() {
		const rays = lightRaysRef?.querySelectorAll('.light-ray');
		if (!rays) return;

		rays.forEach((ray, index) => {
			gsap.set(ray, {
				opacity: 0.1 + Math.random() * 0.15,
				scaleY: 0.8 + Math.random() * 0.4
			});

			// Gentle breathing animation
			gsap.to(ray, {
				opacity: 0.05 + Math.random() * 0.1,
				scaleY: 0.6 + Math.random() * 0.6,
				duration: 4 + index,
				ease: 'power2.inOut',
				repeat: -1,
				yoyo: true,
				delay: index * 1.5
			});
		});
	}
</script>

<!-- Fixed background container -->
<div
	bind:this={containerRef}
	class="ocean-background pointer-events-none fixed inset-0 overflow-hidden"
>
	<!-- Subtle light rays from above (hidden on mobile) -->
	<div bind:this={lightRaysRef} class="absolute inset-0 hidden md:block">
		{#each Array(3) as _, i}
			<div
				class="light-ray absolute top-0"
				style="
          left: {25 + i * 25}%;
          width: 1px;
          height: 100%;
          background: linear-gradient(to bottom,
            rgba(255, 255, 255, 0.08) 0%,
            rgba(255, 255, 255, 0.04) 30%,
            transparent 60%);
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.05);
          transform-origin: top center;
        "
			/>
		{/each}
	</div>

	<!-- Minimal floating bubbles -->
	<div bind:this={bubblesRef} class="absolute inset-0">
		{#each Array(8) as _, i}
			<div
				class="bubble absolute rounded-full"
				style="
          width: {6 + Math.random() * 8}px;
          height: {6 + Math.random() * 8}px;
          background: rgba(255, 255, 255, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(1px);
        "
			/>
		{/each}
	</div>

	<!-- Subtle water texture overlay -->
	<div class="absolute inset-0 opacity-5">
		<div
			class="h-full w-full"
			style="
        background-image:
          radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 70% 80%, rgba(255, 255, 255, 0.08) 0%, transparent 40%);
      "
		/>
	</div>
</div>

<style>
	.ocean-background {
		background: linear-gradient(
			135deg,
			#1e3a8a 0%,
			#1e40af 25%,
			#2563eb 50%,
			#3b82f6 75%,
			#60a5fa 100%
		);
	}

	/* Performance optimizations */
	.bubble,
	.light-ray {
		will-change: transform;
		backface-visibility: hidden;
	}
</style>
