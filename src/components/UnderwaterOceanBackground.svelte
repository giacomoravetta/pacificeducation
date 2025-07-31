<!-- MinimalistUnderwaterBackground.svelte -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { gsap } from 'gsap';

	let containerRef = $state<HTMLElement>();
	let bubblesRef = $state<HTMLElement>();
	let masterTimeline: gsap.core.Timeline;
	let isDestroyed = $state(false);

	let innerWidth = $state(0);
	let innerHeight = $state(0);

	const bubbleData = $state(
		Array.from({ length: 8 }, (_, i) => ({
			id: i,
			size: 6 + Math.random() * 8,
			opacity: 0.2 + Math.random() * 0.3,
			delay: i * 2
		}))
	);

	onMount(() => {
		if (!containerRef || !bubblesRef) return;

		setTimeout(() => {
			if (!isDestroyed) {
				initializeAnimations();
			}
		}, 100);

		return () => {
			cleanup();
		};
	});

	onDestroy(() => {
		cleanup();
	});

	function cleanup() {
		isDestroyed = true;
		if (masterTimeline) {
			masterTimeline.kill();
			masterTimeline = null;
		}
	}

	function initializeAnimations() {
		if (!bubblesRef || isDestroyed) return;

		try {
			masterTimeline = gsap.timeline({
				repeat: -1
			});

			createBubbleAnimation();
		} catch (error) {
			console.warn('Animation initialization failed:', error);
		}
	}

	function createBubbleAnimation() {
		if (!bubblesRef || isDestroyed) return;

		const bubbles = bubblesRef.querySelectorAll('.bubble');
		if (!bubbles || bubbles.length === 0) return;

		bubbles.forEach((bubble, index) => {
			if (isDestroyed) return;

			try {
				const viewportWidth = innerWidth || 1200;
				const viewportHeight = innerHeight || 800;

				gsap.set(bubble, {
					x: Math.random() * Math.max(viewportWidth - 50, 300),
					y: viewportHeight + 20,
					opacity: 0,
					scale: 1 + Math.random() * 0.5,
					rotation: 0
				});

				const bubbleTl = gsap.timeline({
					repeat: -1,
					delay: bubbleData[index]?.delay || index * 2,
					onComplete: () => {
						if (!isDestroyed) {
							gsap.set(bubble, {
								x: Math.random() * Math.max(viewportWidth - 50, 300),
								y: viewportHeight + 20,
								opacity: 0
							});
						}
					}
				});

				bubbleTl.to(bubble, {
					opacity: bubbleData[index]?.opacity || 0.4,
					y: -100,
					x: `+=${(Math.random() - 0.5) * 150}`,
					rotation: 360 + Math.random() * 180,
					duration: 12 + Math.random() * 8,
					ease: 'none'
				});

				bubbleTl.to(
					bubble,
					{
						opacity: 0,
						duration: 2,
						ease: 'power2.out'
					},
					'-=2'
				);

				gsap.to(bubble, {
					x: '+=30',
					duration: 4 + Math.random() * 3,
					ease: 'sine.inOut',
					repeat: -1,
					yoyo: true,
					delay: index * 0.3
				});

				gsap.to(bubble, {
					scale: '+=0.2',
					duration: 3 + Math.random() * 2,
					ease: 'sine.inOut',
					repeat: -1,
					yoyo: true,
					delay: index * 0.7
				});
			} catch (error) {
				console.warn(`Bubble animation failed for index ${index}:`, error);
			}
		});
	}

	$effect(() => {
		if (innerWidth && innerHeight && masterTimeline && !isDestroyed) {
			masterTimeline.kill();
			setTimeout(() => {
				if (!isDestroyed) {
					initializeAnimations();
				}
			}, 100);
		}
	});

	onMount(() => {
		if (!containerRef || !bubblesRef) return;

		setTimeout(() => {
			if (!isDestroyed) {
				initializeAnimations();
			}
		}, 100);

		return () => {
			cleanup();
		};
	});
</script>

<div
	bind:this={containerRef}
	class="ocean-background pointer-events-none fixed inset-0 z-0 overflow-hidden"
	role="presentation"
	aria-hidden="true"
>
	<div bind:this={bubblesRef} class="absolute inset-0">
		{#each bubbleData as bubble (bubble.id)}
			<div
				class="bubble absolute rounded-full opacity-0 will-change-transform"
				style:width="{bubble.size}px"
				style:height="{bubble.size}px"
				style:background="rgba(255, 255, 255, {bubble.opacity})"
				style:border="1px solid rgba(255, 255, 255, 0.2)"
				style:backdrop-filter="blur(1px)"
				style:box-shadow="inset 0 1px 2px rgba(255, 255, 255, 0.3)"
			></div>
		{/each}
	</div>
</div>

<style>
	.bubble {
		will-change: transform, opacity;
		backface-visibility: hidden;
		transform-style: preserve-3d;
		transform: translateZ(0);
	}
</style>
