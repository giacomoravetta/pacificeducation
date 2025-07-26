<script lang="ts">
	import { gsap } from 'gsap';
	import { onMount } from 'svelte';

	let innerWidth = $state();
	let innerHeight = $state();
	let videoBox = $state();
	let isVideoLoaded = $state(false);
	let isAnimationRunning = $state(false);

	const tl = gsap.timeline();

	function startAnimation(tl) {
		// Ensure we have all required dimensions
		if (!videoBox?.width || !innerWidth || !innerHeight) {
			console.log('Waiting for dimensions...', {
				videoBox: videoBox?.width,
				innerWidth,
				innerHeight
			});
			return false;
		}

		console.log('Starting animation with:', { videoBox, innerWidth, innerHeight });

		const startX = -videoBox.width / 2;
		const startY = innerHeight / 2;
		const endX = innerWidth / 2 - videoBox.width / 2;

		// ✅ BEST PRACTICE: Use fromTo() for explicit control over start and end states
		tl.fromTo(
			'.turtle-video',
			{
				x: startX,
				y: startY,
				scale: 0.3,
				opacity: 0
			},
			{
				// TO state - end values with timing
				x: endX,
				y: innerHeight / 2 - videoBox.height / 2,
				scale: 1.5,
				opacity: 1,
				duration: 30,
				ease: 'sine.out'
			}
		).to('.turtle-video', {
			x: endX,
			y: innerHeight / 2 - videoBox.height / 2,
			scale: 0.4,
			opacity: 1,
			duration: 30,
			repeat: -1,
			yoyo: true, // Goes back and forth
			ease: 'power2.inOut'
		});

		isAnimationRunning = true;
		return true;
	}

	function handleVideoLoad() {
		console.log('Video loaded');

		isVideoLoaded = true;
	}

	// Effect to start animation when all conditions are met
	$effect(() => {
		if (isVideoLoaded && videoBox?.width && innerWidth && innerHeight) {
			console.log('All conditions met, starting animation');

			startAnimation(tl);
		}
	});

	onMount(() => {
		console.log('Component mounted');

		// Check if video element exists and is already loaded
		const videoElement = document.querySelector('.turtle-video') as HTMLVideoElement;

		if (videoElement) {
			// If video is already loaded (common after refresh)
			if (videoElement.readyState >= 2) {
				console.log('Video already loaded on mount');
				isVideoLoaded = true;
			}

			// Add event listeners for video loading
			videoElement.addEventListener('loadeddata', handleVideoLoad);
			videoElement.addEventListener('canplay', handleVideoLoad);
		}

		// Cleanup function
		return () => {
			gsap.killTweensOf('.turtle-video');
			tl.clear();
		};
	});
</script>

<svelte:window bind:innerWidth bind:innerHeight />

<section
	class="ocean-background relative flex min-h-screen w-full items-center justify-center overflow-hidden"
>
	<!-- Video layer - positioned above background, below content -->
	<div class="absolute inset-0 z-10 overflow-hidden">
		<video
			bind:contentRect={videoBox}
			src="assets/TurtleTransparent.webm"
			autoplay
			loop
			muted
			playsinline
			class="turtle-video absolute origin-center opacity-0"
			onloadeddata={handleVideoLoad}
		>
			<!-- Fallback for browsers that don't support your video format -->
			<track kind="captions" />
			Your browser does not support the video tag.
		</video>
	</div>

	<div class="relative z-20 container mx-auto flex justify-center px-6 py-16 lg:px-8 lg:py-24">
		<div class="max-w-4xl">
			<!-- Badge/Label -->
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

			<!-- Main heading with enhanced typography -->
			<div class="mb-8">
				<h1 class="mb-4 text-5xl leading-tight font-bold text-white lg:text-7xl">
					<span
						class="animate-gradient-x inline-block bg-linear-to-r from-yellow-300 via-orange-400 to-red-400 bg-clip-text text-transparent"
					>
						Education Across
					</span>
					<br />
					<span
						class="inline-block -rotate-1 transform rounded-lg bg-white/95 bg-clip-text px-4 py-2 text-transparent shadow-lg"
					>
						the Pacific
					</span>
				</h1>
				<p class="text-xl font-light tracking-wide text-blue-100 lg:text-2xl">
					Navigating Learning in Island Communities
				</p>
			</div>

			<!-- Enhanced subtitle with better spacing -->
			<div class="mb-12 space-y-6">
				<p class="max-w-3xl text-lg leading-relaxed text-white/90 lg:text-xl">
					An interactive exploration of educational systems, challenges, and opportunities across
					the diverse island nations of the Pacific Ocean.
				</p>

				<!-- Key stats cards -->
				<div class="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
					<div
						class="transform rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white/15"
					>
						<div class="text-2xl font-bold text-white">22</div>
						<div class="text-sm text-blue-100">Island Nations</div>
					</div>
					<div
						class="transform rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white/15"
					>
						<div class="text-2xl font-bold text-white">100+</div>
						<div class="text-sm text-blue-100">Languages</div>
					</div>
					<div
						class="transform rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white/15"
					>
						<div class="text-2xl font-bold text-white">2M+</div>
						<div class="text-sm text-blue-100">Students</div>
					</div>
				</div>
			</div>

			<!-- Enhanced description with better visual hierarchy -->
			<div class="mb-12 space-y-6">
				<div class="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm lg:p-8">
					<p class="mb-4 leading-relaxed text-white/85">
						The Pacific Islands present a unique educational landscape where geography, culture, and
						climate intersect to create both extraordinary challenges and innovative solutions. From
						the coral atolls of Tuvalu to the volcanic peaks of Fiji, students and educators
						navigate distances measured in ocean miles, preserve indigenous knowledge systems, and
						adapt to rising sea levels that threaten entire communities.
					</p>
					<p class="leading-relaxed text-white/85">
						This visualization brings together data from 22 Pacific Island nations and territories,
						examining enrollment patterns, language preservation efforts, infrastructure challenges,
						and the resilient strategies these communities employ to ensure every child has access
						to quality education—no matter how remote their island home.
					</p>
				</div>
			</div>

			<!-- Call-to-action buttons -->
			<div class="mb-16 flex flex-col gap-4 sm:flex-row">
				<button
					class="inline-flex transform items-center rounded-full bg-white px-8 py-4 font-semibold text-blue-600 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-blue-50 hover:shadow-xl"
				>
					<svg class="mr-2 size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 10V3L4 14h7v7l9-11h-7z"
						/>
					</svg>
					Explore Interactive Data
				</button>
				<button
					class="inline-flex transform items-center rounded-full border border-white/30 bg-white/10 px-8 py-4 font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white/20"
				>
					<svg class="mr-2 size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
						/>
					</svg>
					Read Methodology
				</button>
			</div>

			<!-- Enhanced methodology section -->
			<div
				class="rounded-2xl border border-white/20 bg-gradient-to-r from-white/5 to-white/10 p-6 backdrop-blur-sm lg:p-8"
			>
				<div class="flex items-start space-x-4">
					<div class="flex-shrink-0">
						<div class="flex size-12 items-center justify-center rounded-xl bg-yellow-400/20">
							<svg
								class="size-6 text-yellow-300"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v6a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
								/>
							</svg>
						</div>
					</div>
					<div>
						<h3 class="mb-3 text-xl font-semibold text-white">Data Sources & Methodology</h3>
						<p class="leading-relaxed text-white/80">
							This analysis combines data from UNESCO Institute for Statistics, Pacific Islands
							Forum Secretariat, and national education ministries across the region. Special
							attention has been given to indigenous education systems and multilingual learning
							environments that are often underrepresented in global education datasets.
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Scroll indicator -->
	<div class="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 transform animate-bounce">
		<div class="flex size-8 items-center justify-center rounded-full border-2 border-white/50">
			<svg class="size-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M19 14l-7 7m0 0l-7-7m7 7V3"
				/>
			</svg>
		</div>
	</div>
</section>

<style>
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

	.turtle-video {
		filter: blur(0.4px);
	}
</style>
