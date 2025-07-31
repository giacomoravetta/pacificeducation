<script lang="ts">
	import { gsap } from 'gsap';
	import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

	gsap.registerPlugin(ScrollToPlugin);

	const handleClick = (section: string) => {
		gsap.to(window, {
			duration: 2,
			scrollTo: `#${section}`,
			ease: 'power2.inOut'
		});
	};
</script>

<section
	id="description"
	class="relative flex min-h-screen items-center justify-center overflow-hidden"
>
	<div class="relative container mx-auto px-6 py-20 lg:px-8 lg:py-32">
		<div class="mx-auto max-w-5xl">
			<div class="mb-16 space-y-8">
				<div
					class="group relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-8 backdrop-blur-md transition-all duration-500 hover:border-white/30 hover:bg-white/15 hover:shadow-2xl hover:shadow-blue-500/10 lg:p-10"
				>
					<div
						class="absolute -top-20 -right-20 size-40 rounded-full bg-gradient-to-br from-blue-400/20 to-transparent blur-3xl transition-all duration-500 group-hover:scale-110"
					></div>
					<p class="relative text-lg leading-relaxed text-white/90 lg:text-xl">
						Across the vast expanse of the Pacific Ocean millions of children are building the
						fundamental skills that will shape their futures. Reading and counting—the twin pillars
						of learning—hold the key to unlocking opportunities in island communities where
						education must bridge traditional knowledge with global connectivity.
					</p>
				</div>

				<div
					class="group relative overflow-hidden rounded-3xl border border-amber-200/30 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent p-8 backdrop-blur-md transition-all duration-500 hover:border-amber-200/50 hover:bg-amber-500/15 hover:shadow-2xl hover:shadow-amber-500/20 lg:p-10"
				>
					<div
						class="absolute -top-20 -left-20 size-40 rounded-full bg-gradient-to-br from-amber-400/20 to-transparent blur-3xl transition-all duration-500 group-hover:scale-110"
					></div>

					<div class="mb-6 flex justify-center">
						<div
							class="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/20 backdrop-blur-sm"
						>
							<svg
								class="size-8 text-amber-300"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						</div>
					</div>

					<div class="relative text-center">
						<p class="mb-6 text-xl leading-relaxed font-bold text-white/95 lg:text-2xl">
							But how are Pacific Island children and young people truly performing in these
							essential skills?
						</p>
						<p class="text-lg leading-relaxed font-semibold text-amber-200/90 lg:text-xl">
							Are students in remote island schools reaching the minimum proficiency levels needed
							to thrive in their communities and beyond?
						</p>
					</div>
				</div>

				<!-- Conclusion card -->
				<div
					class="group relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-8 backdrop-blur-md transition-all duration-500 hover:border-white/30 hover:bg-white/15 hover:shadow-2xl hover:shadow-emerald-500/10 lg:p-10"
				>
					<div
						class="absolute -right-20 -bottom-20 size-40 rounded-full bg-gradient-to-br from-emerald-400/20 to-transparent blur-3xl transition-all duration-500 group-hover:scale-110"
					></div>
					<p class="relative text-lg leading-relaxed text-white/90 lg:text-xl">
						This visualization examines the critical gaps and achievements in reading and counting
						proficiency across Pacific Island nations, revealing where children are excelling and
						where urgent support is needed. As climate change and economic pressures reshape these
						island communities, ensuring every child masters these fundamental skills becomes not
						just an educational priority, but a pathway to
						<span class="font-semibold text-emerald-300">resilient, sustainable futures</span> for the
						Pacific region.
					</p>
				</div>
			</div>

			<div class="flex justify-center">
				<div class="group relative">
					<div
						class="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 opacity-30 blur-lg transition-all duration-500 group-hover:opacity-50 group-hover:blur-xl"
					></div>

					<button
						onclick={() => {
							handleClick('dataviz-section');
						}}
						class="hover:shadow-3xl relative inline-flex transform items-center rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 px-10 py-5 text-lg font-bold text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:from-blue-500 hover:to-cyan-500 hover:shadow-blue-500/25 lg:px-12 lg:py-6 lg:text-xl"
					>
						<!-- Button background glow -->
						<div
							class="absolute inset-0 rounded-full bg-gradient-to-r from-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
						></div>

						<!-- Icon with animation -->
						<svg
							class="mr-3 size-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12 lg:size-7"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2.5"
								d="M13 10V3L4 14h7v7l9-11h-7z"
							/>
						</svg>

						<span class="relative">Explore Interactive Data</span>
					</button>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	/* Custom animations */
	@keyframes float {
		0%,
		100% {
			transform: translateY(0px) rotate(0deg);
		}
		50% {
			transform: translateY(-20px) rotate(180deg);
		}
	}

	@keyframes float-delayed {
		0%,
		100% {
			transform: translateY(0px) rotate(0deg);
		}
		50% {
			transform: translateY(-30px) rotate(-180deg);
		}
	}

	@keyframes float-slow {
		0%,
		100% {
			transform: translateY(0px) rotate(0deg);
		}
		50% {
			transform: translateY(-15px) rotate(90deg);
		}
	}
</style>
