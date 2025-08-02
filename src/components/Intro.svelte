<script lang="ts">
	import { gsap } from 'gsap';
	import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
	import { onMount } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';

	let videoBox = $state<DOMRectReadOnly>();
	let isVideoLoaded = $state(false);
	let videoSrc = $state('');
	let isDesktop = $state(false);

	const desktopQuery = new MediaQuery('(min-width: 1024px)');

	const shouldShowVideo = $derived(desktopQuery.current && isDesktop && videoSrc);
	const isReadyForAnimation = $derived(shouldShowVideo && isVideoLoaded && videoBox?.width);

	gsap.registerPlugin(ScrollToPlugin);

	function detectVideoSupport(): {
		supportsTransparentMOV: boolean;
		supportsTransparentWebM: boolean;
	} {
		const video = document.createElement('video');

		const supportsTransparentMOV = video.canPlayType('video/quicktime') !== '';

		const supportsTransparentWebM =
			video.canPlayType('video/webm; codecs="vp8"') !== '' ||
			video.canPlayType('video/webm; codecs="vp9"') !== '';

		return { supportsTransparentMOV, supportsTransparentWebM };
	}

	function setVideoSource(): void {
		// Only set video source on desktop
		if (!desktopQuery.current) {
			isDesktop = false;
			videoSrc = '';
			return;
		}

		isDesktop = true;
		const { supportsTransparentMOV, supportsTransparentWebM } = detectVideoSupport();

		if (supportsTransparentMOV) {
			videoSrc = '/Turtle.mov';
		} else if (supportsTransparentWebM) {
			videoSrc = '/Turtle.webm';
		} else {
			videoSrc = '/Turtle.webm';
		}
	}

	function handleClick(section: string): void {
		gsap.to(window, {
			duration: 2,
			scrollTo: `#${section}`,
			ease: 'power2.inOut'
		});
	}

	function createArrowAnimation(): void {
		const arrowSelector = '.call-to-arrow';
		const arrowSvgSelector = '.call-to-arrow svg';

		gsap.set(arrowSelector, {
			opacity: 0,
			scale: 0.9,
			y: 20
		});

		gsap.to(arrowSelector, {
			opacity: 1,
			scale: 1,
			y: 0,
			duration: 2,
			ease: 'back.out(1.2)'
		});

		gsap.to(arrowSelector, {
			y: -12,
			duration: 3,
			ease: 'sine.inOut',
			yoyo: true,
			repeat: -1,
			delay: 4
		});

		gsap.to(arrowSelector, {
			scale: 1.1,
			duration: 4,
			ease: 'sine.inOut',
			yoyo: true,
			repeat: -1,
			delay: 3
		});

		gsap.to(arrowSvgSelector, {
			y: -4,
			duration: 2,
			ease: 'sine.inOut',
			yoyo: true,
			repeat: -1,
			delay: 4.5
		});

		gsap.to(arrowSvgSelector, {
			rotation: 3,
			duration: 6,
			ease: 'sine.inOut',
			yoyo: true,
			repeat: -1,
			delay: 5
		});

		const arrowElement = document.querySelector(arrowSelector);
		arrowElement?.addEventListener('click', () => {
			gsap.to(arrowSelector, {
				scale: 0.95,
				duration: 0.1,
				ease: 'power2.out',
				yoyo: true,
				repeat: 1
			});

			gsap.fromTo(
				'.call-to-arrow > div',
				{ boxShadow: '0 0 0px rgba(255, 255, 255, 0.8)' },
				{
					boxShadow: '0 0 60px rgba(255, 255, 255, 0)',
					duration: 0.6,
					ease: 'power2.out'
				}
			);
		});
	}

	function startAnimation(): gsap.core.Timeline {
		if (!videoBox?.width || !desktopQuery.current) {
			return gsap.timeline();
		}

		const startX = -videoBox.width / 2;
		const startY = window.innerHeight / 2;
		const endX = window.innerWidth / 2 - videoBox.width / 2;
		const endY = window.innerHeight / 2 - videoBox.height / 2;

		const tl = gsap.timeline();

		tl.fromTo(
			'.turtle-video',
			{
				x: startX,
				y: startY,
				scale: 0.3,
				opacity: 0
			},
			{
				x: endX,
				y: endY,
				scale: 1.3,
				opacity: 1,
				duration: 40,
				ease: 'sine.out'
			}
		).to('.turtle-video', {
			x: endX,
			y: endY,
			scale: 0.4,
			opacity: 1,
			duration: 30,
			repeat: -1,
			yoyo: true,
			ease: 'power2.inOut'
		});

		return tl;
	}

	function handleVideoLoad(): void {
		isVideoLoaded = true;
	}

	function handleVideoError(event: Event): void {
		console.error('Video failed to load:', event);

		if (videoSrc.endsWith('.mov')) {
			console.log('MOV video failed, trying WebM fallback');
			videoSrc = '/Turtle.webm';
		} else {
			console.log('WebM video also failed, disabling video');
			videoSrc = '';
			isDesktop = false;
		}
	}

	function preloadVideo(): void {
		if (!shouldShowVideo || !videoSrc) return;

		const video = document.createElement('video');
		video.preload = 'auto';
		video.src = videoSrc;
	}

	let animationTimeline: gsap.core.Timeline;

	$effect(() => {
		const isCurrentlyDesktop = desktopQuery.current;
		if (isCurrentlyDesktop !== isDesktop) {
			setVideoSource();
		}
	});

	$effect(() => {
		if (isReadyForAnimation) {
			animationTimeline = startAnimation();
		}
	});

	onMount(async () => {
		setVideoSource();

		const arrowTimeout = setTimeout(createArrowAnimation, 500);

		if (shouldShowVideo && videoSrc) {
			preloadVideo();

			const videoTimeout = setTimeout(() => {
				const videoElement = document.querySelector('.turtle-video') as HTMLVideoElement;

				if (videoElement) {
					if (videoElement.readyState >= 3) {
						isVideoLoaded = true;
					}

					videoElement.addEventListener('canplaythrough', handleVideoLoad);
					videoElement.addEventListener('loadeddata', handleVideoLoad);
					videoElement.addEventListener('error', handleVideoError);
				}
			}, 100);

			return () => {
				clearTimeout(arrowTimeout);
				clearTimeout(videoTimeout);
			};
		}

		return () => {
			clearTimeout(arrowTimeout);

			// Cleanup animations
			if (animationTimeline) {
				animationTimeline.kill();
			}
			gsap.killTweensOf('.turtle-video');
			gsap.killTweensOf('.call-to-arrow');
			gsap.killTweensOf('.call-to-arrow svg');
			gsap.killTweensOf('.call-to-arrow > div');
		};
	});
</script>

<section class="relative flex min-h-screen w-full flex-col items-center justify-center">
	{#if shouldShowVideo && videoSrc}
		<div class="absolute inset-0">
			<video
				bind:contentRect={videoBox}
				src={videoSrc}
				autoplay
				loop
				muted
				playsinline
				webkit-playsinline="true"
				preload="auto"
				class="turtle-video absolute origin-center opacity-0"
				onloadeddata={handleVideoLoad}
				onerror={handleVideoError}
				style="will-change: transform; transform: translateZ(0);"
			>
				<source
					src={videoSrc}
					type={videoSrc.endsWith('.webm') ? 'video/webm' : 'video/quicktime'}
				/>
				<track kind="captions" />
			</video>
		</div>
	{/if}

	<div class="relative z-20 container mx-auto flex justify-center px-6 py-16 lg:px-8 lg:py-24">
		<div class="max-w-4xl">
			<div
				class="animate-fade-in mb-8 inline-flex items-center rounded-full border border-white/30 bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm"
			>
				<svg class="mr-2 size-4" fill="currentColor" viewBox="0 0 20 20">
					<path
						fill-rule="evenodd"
						d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.236 4.53L7.73 10.5a.75.75 0 00-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
						clip-rule="evenodd"
					/>
				</svg>
				Interactive Data Exploration
			</div>
			<div class="mb-8">
				<h1 class="mb-4 text-5xl leading-tight font-bold text-white lg:text-7xl">
					<span
						class="animate-gradient-x inline-block bg-linear-to-r from-yellow-300 via-orange-400 to-red-400 bg-clip-text text-transparent"
					>
						Reading and Counting
					</span>
					<br />
					<span
						class="inline-block -rotate-1 transform rounded-lg bg-white/95 bg-clip-text px-4 py-2 text-transparent shadow-lg"
					>
						Across the Pacific
					</span>
				</h1>
				<p class="text-xl font-light tracking-wide text-blue-100 lg:text-2xl">
					Mapping Essential Skills in Island Communities
				</p>
			</div>
			<div class="mb-12 space-y-6">
				<p class="max-w-3xl text-lg leading-relaxed text-white/90 lg:text-xl">
					Discover how many young learners across Pacific islands are mastering the fundamental
					skills that open doors to their future—from reading their first stories to solving their
					first math problems
				</p>
			</div>
		</div>
	</div>

	<button
		aria-label="Button to next section"
		onclick={() => handleClick('description')}
		class="call-to-arrow relative bottom-[10%] z-20 flex cursor-pointer justify-center opacity-0"
	>
		<div
			class="flex size-20 items-center justify-center rounded-full border-2 border-white/50 transition-all duration-300"
		>
			<svg class="size-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M19 14l-7 7m0 0l-7-7m7 7V3"
				/>
			</svg>
		</div>
	</button>
</section>

<style>
	.turtle-video {
		filter: blur(0.4px);
		transform: translateZ(0);
		backface-visibility: hidden;
		perspective: 1000px;
	}

	@media (prefers-reduced-motion: reduce) {
		.turtle-video {
			animation: none !important;
		}
		.call-to-arrow {
			animation: none !important;
		}
	}

	@keyframes gradient-x {
		0%,
		100% {
			background-size: 200% 200%;
			background-position: left center;
		}
		50% {
			background-size: 200% 200%;
			background-position: right center;
		}
	}

	.animate-gradient-x {
		animation: gradient-x 4s ease infinite;
	}

	.call-to-arrow {
		will-change: transform, opacity;
	}

	.call-to-arrow > div {
		will-change: border-color, box-shadow;
		background: transparent;
	}
</style>
