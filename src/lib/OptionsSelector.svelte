<script lang="ts">
	import { appData } from '../state.svelte';
	import { translate } from '../translate_util';
	import { onMount } from 'svelte';

	import { gsap } from 'gsap';
	import { Draggable } from 'gsap/Draggable';
	import { InertiaPlugin } from 'gsap/InertiaPlugin';
	import { Drawer, CloseButton, Button } from 'flowbite-svelte';
	import { InfoCircleSolid } from 'flowbite-svelte-icons';

	gsap.registerPlugin(Draggable, InertiaPlugin);
	let hiddenDrawer = $state(true);
	interface Props {
		optionsState: {
			selectedSkills: string[];
			selectedEducation: string[];
			selectedSexes: string[];
			selectedIslands: string[];
			colorsIslands: Record<string, string>;
		};
		onSkillToggle?: (skill: string) => void;
		onEducationToggle?: (education: string) => void;
		onSexToggle?: (sex: string) => void;
		onIslandToggle?: (island: string) => void;
		compare?: boolean;
		enableIslands?: boolean;
		hidden: boolean;
	}

	let {
		optionsState,
		onSkillToggle,
		onEducationToggle,
		onSexToggle,
		onIslandToggle,
		compare,
		enableIslands = true,
		hidden = $bindable()
	}: Props = $props();

	// Derive static lists from data using Svelte 5 runes
	const skills = $derived([
		...new Set(appData.skills.map((skill) => skill['COMPOSITE_BREAKDOWN']))
	]);
	const educationTypes = $derived([...new Set(appData.skills.map((skill) => skill['EDUCATION']))]);
	const sexes = $derived([...new Set(appData.skills.map((skill) => skill['SEX']))]);

	// Filter data based on current selections
	const filteredData = $derived.by(() => {
		return appData.skills.filter((d) => {
			const skillMatch =
				optionsState.selectedSkills.length === 0 ||
				optionsState.selectedSkills.includes(d.COMPOSITE_BREAKDOWN);

			const educationMatch =
				optionsState.selectedEducation.length === 0 ||
				optionsState.selectedEducation.includes(d.EDUCATION);

			const sexMatch =
				optionsState.selectedSexes.length === 0 || optionsState.selectedSexes.includes(d.SEX);

			return skillMatch && educationMatch && sexMatch;
		});
	});

	// Derive available islands from filtered data
	const islands = $derived([...new Set(filteredData.map((d) => d['GEO_PICT']))]);

	// Store GSAP draggable instances for cleanup
	let draggableInstances: any[] = [];

	// Utility functions
	const determineOptionType = (selectedOption: string): string | undefined => {
		if (islands.includes(selectedOption)) return 'island';
		if (skills.includes(selectedOption)) return 'skill';
		if (educationTypes.includes(selectedOption)) return 'education';
		if (sexes.includes(selectedOption)) return 'sex';
		return undefined;
	};

	// Handler for filter selection
	const handleFilterClick = (e: MouseEvent) => {
		const target = e.currentTarget as HTMLElement;
		const selectedOption = translate(target.innerText.trim());
		const optionType = determineOptionType(selectedOption);

		switch (optionType) {
			case 'island':
				onIslandToggle?.(selectedOption);
				break;
			case 'skill':
				onSkillToggle?.(selectedOption);
				break;
			case 'education':
				onEducationToggle?.(selectedOption);
				break;
			case 'sex':
				onSexToggle?.(selectedOption);
				break;
		}
	};

	// GSAP drag scrolling implementation - using container approach
	function gsapDragScroll(node: HTMLElement) {
		let isDragging = false;
		let startTime = 0;

		// Find the scrollable content wrapper
		const contentWrapper = node.querySelector('.scroll-content') as HTMLElement;
		if (!contentWrapper) return { destroy: () => {} };

		// Calculate bounds for dragging
		const getBounds = () => {
			const containerWidth = node.offsetWidth;
			const contentWidth = contentWrapper.scrollWidth;
			const maxScroll = Math.max(0, contentWidth - containerWidth);
			return {
				minX: -maxScroll,
				maxX: 0
			};
		};

		const draggableInstance = Draggable.create(contentWrapper, {
			type: 'x',
			inertia: true,
			edgeResistance: 0.65,
			bounds: getBounds,
			cursor: 'grab',
			minimumMovement: 3,
			allowContextMenu: true,
			onPress() {
				gsap.killTweensOf(contentWrapper);
				isDragging = false;
				startTime = Date.now();
			},
			onDragStart() {
				isDragging = true;
				node.classList.add('cursor-grabbing');
				contentWrapper.style.cursor = 'grabbing';
			},
			onDragEnd() {
				node.classList.remove('cursor-grabbing');
				contentWrapper.style.cursor = 'grab';

				// Prevent clicks for a short time after drag
				setTimeout(
					() => {
						isDragging = false;
					},
					Math.max(50, Date.now() - startTime > 200 ? 100 : 50)
				);
			},
			onDrag() {
				// Update bounds dynamically in case content changes
				this.applyBounds(getBounds());

				// Mark as dragging for click prevention
				if (node.classList.contains('islands-section')) {
					node.dataset.dragging = 'true';
				}
			}
		})[0];

		// Handle click prevention during drag
		const handleClick = (e: MouseEvent) => {
			if (isDragging || node.dataset.dragging === 'true') {
				e.preventDefault();
				e.stopPropagation();
				e.stopImmediatePropagation();
				// Clean up dragging flag
				setTimeout(() => {
					delete node.dataset.dragging;
				}, 10);
				return false;
			}
		};

		// Add click handler with capture
		node.addEventListener('click', handleClick, true);
		node.addEventListener('mousedown', handleClick, true);

		// Store instance for cleanup
		draggableInstances.push(draggableInstance);

		return {
			destroy() {
				if (draggableInstance) {
					draggableInstance.kill();
					const index = draggableInstances.indexOf(draggableInstance);
					if (index > -1) {
						draggableInstances.splice(index, 1);
					}
				}

				// Remove event listeners
				node.removeEventListener('click', handleClick, true);
				node.removeEventListener('mousedown', handleClick, true);
			}
		};
	}

	// Cleanup GSAP instances on component destroy
	onMount(() => {
		return () => {
			draggableInstances.forEach((instance) => {
				if (instance && instance.kill) {
					instance.kill();
				}
			});
			draggableInstances = [];
		};
	});

	// Helper functions for determining chip states
	const isSkillAvailable = (skill: string) => {
		return (
			filteredData.some((d) => d['COMPOSITE_BREAKDOWN'] === skill) ||
			optionsState.selectedSkills.includes(skill) ||
			optionsState.selectedSkills.length === 0
		);
	};

	const isEducationAvailable = (education: string) => {
		return (
			filteredData.some((d) => d['EDUCATION'] === education) ||
			optionsState.selectedEducation.includes(education) ||
			optionsState.selectedEducation.length === 0
		);
	};

	const isSexAvailable = (sex: string) => {
		return (
			filteredData.some((d) => d['SEX'] === sex) ||
			optionsState.selectedSexes.includes(sex) ||
			optionsState.selectedSexes.length === 0
		);
	};

	const areIslandsEnabled = () => {
		return (
			optionsState.selectedSkills.length > 0 &&
			optionsState.selectedEducation.length > 0 &&
			optionsState.selectedSexes.length > 0
		);
	};
</script>

<div
	class="ocean-background
	relative flex w-full max-w-[90dvw] flex-col
	overflow-hidden
	rounded-xl
	shadow-[0_20px_25px_-5px_rgb(0_0_0_/_0.1),0_10px_10px_-5px_rgb(0_0_0_/_0.04)]
	backdrop-blur-lg
	before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent
	md:max-w-[80dvw]
"
>
	<div class="flex items-center justify-between px-6 pt-6">
		<Button
			class="w-0 border border-white bg-transparent text-xl text-white hover:bg-blue-600"
			onclick={() => (hiddenDrawer = false)}><InfoCircleSolid /></Button
		>

		<CloseButton
			onclick={() => {
				hidden = true;
			}}
			class=" text-white hover:bg-blue-600"
		/>
	</div>
	<!-- Skills Section -->
	<div
		class="
		relative border-b border-white/15
		px-6 py-6
		transition-all duration-300 ease-out
		hover:bg-white/5
	"
	>
		<div class="mb-4 flex items-center gap-3">
			<div
				class="
				flex h-8 w-8
				items-center justify-center rounded-lg
				bg-white/20 text-[min(3dvw,17px)]
				text-white backdrop-blur-sm
			"
			>
				🧮
			</div>
			<h3 class=" text-[min(3dvw,17px)] font-semibold tracking-wide text-white">Skills</h3>
		</div>
		<div
			class="
			cursor-grab
			overflow-hidden
			active:cursor-grabbing
			[&::-webkit-scrollbar]:h-2
			[&::-webkit-scrollbar-thumb]:rounded-full
			[&::-webkit-scrollbar-thumb]:border-2
			[&::-webkit-scrollbar-thumb]:border-white/20
			[&::-webkit-scrollbar-thumb]:bg-gradient-to-r
			[&::-webkit-scrollbar-thumb]:from-blue-400/60
			[&::-webkit-scrollbar-thumb]:to-cyan-300/60
			[&::-webkit-scrollbar-thumb]:backdrop-blur-sm
			[&::-webkit-scrollbar-thumb]:transition-all
			[&::-webkit-scrollbar-thumb]:duration-300 hover:[&::-webkit-scrollbar-thumb]:from-blue-300/80
			hover:[&::-webkit-scrollbar-thumb]:to-cyan-200/80 hover:[&::-webkit-scrollbar-thumb]:shadow-lg
			hover:[&::-webkit-scrollbar-thumb]:shadow-blue-500/30 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-white/10 [&::-webkit-scrollbar-track]:backdrop-blur-sm
		"
			style="scrollbar-width: thin; scrollbar-color: rgba(96, 165, 250, 0.6) rgba(255, 255, 255, 0.1);"
			use:gsapDragScroll
		>
			<div class="scroll-content flex gap-3 pb-2 text-white" style="width: max-content;">
				{#each skills as skill (skill)}
					{@const isSelected = optionsState.selectedSkills.includes(skill)}
					{@const isAvailable = isSkillAvailable(skill)}
					<button
						disabled={!isAvailable}
						onclick={handleFilterClick}
						class="
							cubic-bezier(0.4, 0, 0.2, 1) flex flex-shrink-0 transform-gpu
							items-center gap-2 rounded-2xl
							border border-white/20 bg-white/15
							px-5 py-3
							text-[min(3dvw,17px)] font-medium whitespace-nowrap backdrop-blur-sm
							transition-all
							duration-300

							{isSelected ? 'border-white/80 bg-white/90 text-blue-900 shadow-lg' : ''}
							{!isAvailable
							? 'pointer-events-none cursor-not-allowed opacity-30'
							: 'hover:border-white/40 hover:bg-white/25 hover:shadow-lg active:scale-95'}
						"
					>
						<span>{translate(skill)}</span>
					</button>
				{/each}
			</div>
		</div>
	</div>

	<!-- Education Section -->
	<div
		class="
		relative border-b border-white/15
		px-6 py-6
		transition-all duration-300 ease-out
		hover:bg-white/5
	"
	>
		<div class="mb-4 flex items-center gap-3">
			<div
				class="
				flex h-8 w-8
				items-center justify-center rounded-lg
				bg-white/20 text-[min(3dvw,17px)]
				text-white
				backdrop-blur-sm
			"
			>
				📚
			</div>
			<h3 class=" text-[min(3dvw,17px)] font-semibold tracking-wide text-white">Education</h3>
		</div>
		<div
			class="
			cursor-grab
			overflow-hidden
			active:cursor-grabbing
			[&::-webkit-scrollbar]:h-2
			[&::-webkit-scrollbar-thumb]:rounded-full
			[&::-webkit-scrollbar-thumb]:border-2
			[&::-webkit-scrollbar-thumb]:border-white/20
			[&::-webkit-scrollbar-thumb]:bg-gradient-to-r
			[&::-webkit-scrollbar-thumb]:from-emerald-400/60
			[&::-webkit-scrollbar-thumb]:to-teal-300/60
			[&::-webkit-scrollbar-thumb]:backdrop-blur-sm
			[&::-webkit-scrollbar-thumb]:transition-all
			[&::-webkit-scrollbar-thumb]:duration-300 hover:[&::-webkit-scrollbar-thumb]:from-emerald-300/80
			hover:[&::-webkit-scrollbar-thumb]:to-teal-200/80
			hover:[&::-webkit-scrollbar-thumb]:shadow-lg hover:[&::-webkit-scrollbar-thumb]:shadow-emerald-500/30 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-white/10 [&::-webkit-scrollbar-track]:backdrop-blur-sm
		"
			style="scrollbar-width: thin; scrollbar-color: rgba(52, 211, 153, 0.6) rgba(255, 255, 255, 0.1);"
			use:gsapDragScroll
		>
			<div class="scroll-content flex gap-3 pb-2 text-white" style="width: max-content;">
				{#each educationTypes as education (education)}
					{@const isSelected = optionsState.selectedEducation.includes(education)}
					{@const isAvailable = isEducationAvailable(education)}
					<button
						disabled={!isAvailable}
						onclick={handleFilterClick}
						class="
							cubic-bezier(0.4, 0, 0.2, 1) flex flex-shrink-0
							transform-gpu items-center gap-2
							rounded-2xl border border-white/20
							bg-white/15 px-5
							py-3 text-[min(3dvw,17px)] font-medium
							whitespace-nowrap
							backdrop-blur-sm transition-all
							duration-300

							{isSelected ? 'border-white/80 bg-white/90 text-blue-900 shadow-lg' : ''}
							{!isAvailable
							? 'pointer-events-none cursor-not-allowed opacity-30'
							: 'hover:border-white/40 hover:bg-white/25 hover:shadow-lg active:scale-95'}

						"
					>
						<span>{translate(education)}</span>
					</button>
				{/each}
			</div>
		</div>
	</div>

	<!-- Gender Section -->
	<div
		class="
		relative border-b border-white/15
		px-6 py-6
		transition-all duration-300 ease-out
		hover:bg-white/5
	"
	>
		<div class="mb-4 flex items-center gap-3">
			<div
				class="
				flex h-8 w-8
				items-center justify-center rounded-lg
				bg-white/20 text-[min(3dvw,17px)]
				text-white backdrop-blur-sm
			"
			>
				🧑
			</div>
			<h3 class=" text-[min(3dvw,17px)] font-semibold tracking-wide text-white">Gender</h3>
		</div>
		<div
			class="
			cursor-grab
			overflow-hidden
			active:cursor-grabbing
			[&::-webkit-scrollbar]:h-2
			[&::-webkit-scrollbar-thumb]:rounded-full
			[&::-webkit-scrollbar-thumb]:border-2
			[&::-webkit-scrollbar-thumb]:border-white/20
			[&::-webkit-scrollbar-thumb]:bg-gradient-to-r
			[&::-webkit-scrollbar-thumb]:from-purple-400/60
			[&::-webkit-scrollbar-thumb]:to-pink-300/60
			[&::-webkit-scrollbar-thumb]:backdrop-blur-sm
			[&::-webkit-scrollbar-thumb]:transition-all
			[&::-webkit-scrollbar-thumb]:duration-300 hover:[&::-webkit-scrollbar-thumb]:from-purple-300/80
			hover:[&::-webkit-scrollbar-thumb]:to-pink-200/80
			hover:[&::-webkit-scrollbar-thumb]:shadow-lg hover:[&::-webkit-scrollbar-thumb]:shadow-purple-500/30 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-white/10 [&::-webkit-scrollbar-track]:backdrop-blur-sm
		"
			style="scrollbar-width: thin; scrollbar-color: rgba(196, 181, 253, 0.6) rgba(255, 255, 255, 0.1);"
			use:gsapDragScroll
		>
			<div class="scroll-content flex gap-3 pb-2 text-white" style="width: max-content;">
				{#each sexes as sex (sex)}
					{@const isSelected = optionsState.selectedSexes.includes(sex)}
					{@const isAvailable = isSexAvailable(sex)}
					<button
						disabled={!isAvailable}
						onclick={handleFilterClick}
						class="
							cubic-bezier(0.4, 0, 0.2, 1) flex flex-shrink-0
							transform-gpu items-center gap-2
							rounded-2xl border border-white/20
							bg-white/15 px-5
							py-3 text-[min(3dvw,17px)] font-medium
							whitespace-nowrap
							backdrop-blur-sm
							transition-all duration-300

							{isSelected ? 'border-white/80 bg-white/90 text-blue-900 shadow-lg' : ''}
							{!isAvailable
							? 'pointer-events-none cursor-not-allowed opacity-30'
							: 'hover:border-white/40 hover:bg-white/25 hover:shadow-lg active:scale-95'}
						"
					>
						<span>{translate(sex)}</span>
					</button>
				{/each}
			</div>
		</div>
	</div>

	<!-- Islands Section -->

	{#if enableIslands}
		<div
			class="
		relative px-6 py-6
		transition-all duration-300 ease-out
		hover:bg-white/5
	"
		>
			<div class="mb-4 flex items-center gap-3">
				<div
					class="
				flex h-8 w-8
				items-center justify-center rounded-lg
				bg-white/20 text-[min(3dvw,17px)]
				text-white backdrop-blur-sm
			"
				>
					🏝️
				</div>
				<h3 class=" text-[min(3dvw,17px)] font-semibold tracking-wide text-white">Islands</h3>
			</div>
			<div
				class="
			islands-section
			cursor-grab
			overflow-hidden
			active:cursor-grabbing
			[&::-webkit-scrollbar]:h-2
			[&::-webkit-scrollbar-thumb]:rounded-full
			[&::-webkit-scrollbar-thumb]:border-2
			[&::-webkit-scrollbar-thumb]:border-white/20
			[&::-webkit-scrollbar-thumb]:bg-gradient-to-r
			[&::-webkit-scrollbar-thumb]:from-orange-400/60
			[&::-webkit-scrollbar-thumb]:via-amber-300/60
			[&::-webkit-scrollbar-thumb]:to-yellow-300/60
			[&::-webkit-scrollbar-thumb]:backdrop-blur-sm
			[&::-webkit-scrollbar-thumb]:transition-all
			[&::-webkit-scrollbar-thumb]:duration-300
			hover:[&::-webkit-scrollbar-thumb]:from-orange-300/80 hover:[&::-webkit-scrollbar-thumb]:via-amber-200/80
			hover:[&::-webkit-scrollbar-thumb]:to-yellow-200/80
			hover:[&::-webkit-scrollbar-thumb]:shadow-lg hover:[&::-webkit-scrollbar-thumb]:shadow-amber-500/30 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-white/10
			[&::-webkit-scrollbar-track]:backdrop-blur-sm
		"
				style="scrollbar-width: thin; scrollbar-color: rgba(251, 191, 36, 0.6) rgba(255, 255, 255, 0.1);"
				use:gsapDragScroll
			>
				<div class="scroll-content flex gap-3 pb-2 text-white" style="width: max-content;">
					{#each islands as island (island)}
						{@const isSelected = optionsState.selectedIslands.includes(island)}
						{@const isEnabled = areIslandsEnabled()}
						{@const islandColor = optionsState.colorsIslands[island] || '#3b82f6'}
						<button
							disabled={!isEnabled ||
								(!isSelected && optionsState.selectedIslands.length != 0 && compare)}
							onclick={handleFilterClick}
							class="
						cubic-bezier(0.4, 0,
							0.2, 1) flex flex-shrink-0 transform-gpu items-center
							gap-2 rounded-2xl px-5
							py-3 text-[min(3dvw,17px)] font-medium whitespace-nowrap text-white backdrop-blur-sm
							transition-all
							duration-300
							{isSelected ? `border shadow-lg` : 'border border-white/20 bg-white/15'}
							{!isEnabled || (!isSelected && optionsState.selectedIslands.length != 0 && compare)
								? 'pointer-events-none cursor-not-allowed opacity-30'
								: 'hover:bg-white/25 hover:shadow-lg '}
						"
							style="
							{isSelected ? `background: ${islandColor}; border-color: ${islandColor};` : ''}
						"
						>
							<span>{island}</span>
						</button>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>

<Drawer
	position="absolute"
	class="ocean-background top-1/2 left-1/2 h-full w-full -translate-1/2 md:max-h-[80dvh] md:max-w-[80dvw]"
	bind:hidden={hiddenDrawer}
	id="sidebar"
	aria-controls="sidebar"
	aria-labelledby="sidebar"
>
	<div class="overflow-hidden">
		<div class="flex w-full justify-end">
			<CloseButton onclick={() => (hiddenDrawer = true)} class="mb-4 text-white" />
		</div>

		<div class="relative p-8 text-white">
			<div class="mb-8 text-center">
				<div
					class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 shadow-lg"
				>
					<svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
						/>
					</svg>
				</div>
				<h1
					class="bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 bg-clip-text text-3xl font-bold text-transparent"
				>
					How to Use Options Selector
				</h1>
				<p class="mt-2 text-blue-100/80">Master these simple controls to explore your data</p>
			</div>

			<!-- Instructions grid -->
			<div class="flex w-full justify-center">
				<div class="flex flex-col items-center justify-center gap-6 md:max-w-[40%]">
					<div
						class="group relative w-full overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:border-white/30 hover:bg-white/15"
					>
						<div
							class="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
						></div>
						<div class="relative flex items-start space-x-4">
							<div class="min-w-0 flex-1">
								<h3 class="mb-2 text-xl font-semibold text-white">Navigate</h3>
								<p class="leading-relaxed text-blue-100/90">
									<span
										class="inline-block rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 px-3 py-1 text-sm font-medium text-white shadow-sm"
									>
										Drag left and right
									</span>
									<span class="ml-2">to see all available options in each category.</span>
								</p>
							</div>
						</div>
					</div>

					<div
						class="group relative w-full overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:border-white/30 hover:bg-white/15"
					>
						<div
							class="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
						></div>

						<div class="min-w-0 flex-1">
							<h3 class="mb-2 text-xl font-semibold text-white">Select Options</h3>
							<p class="leading-relaxed text-blue-100/90">
								<span
									class="inline-block rounded-full bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-1 text-sm font-medium text-white shadow-sm"
								>
									Tap or click
								</span>
								<span class="ml-2">any option to select it. Selected options are highlighted.</span>
							</p>
						</div>
					</div>

					<div
						class="group relative w-full overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:border-white/30 hover:bg-white/15"
					>
						<div
							class="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
						></div>

						<div class="min-w-0 flex-1">
							<h3 class="mb-2 text-xl font-semibold text-white">Deselect Options</h3>
							<p class="leading-relaxed text-blue-100/90">
								<span
									class="inline-block rounded-full bg-gradient-to-r from-red-500 to-pink-500 px-3 py-1 text-sm font-medium text-white shadow-sm"
								>
									Tap or click again
								</span>
								<span class="ml-2">on selected options to remove them.</span>
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</Drawer>

<style>
	/* Ensure grab cursor works consistently across browsers */
	.cursor-grabbing {
		cursor: grabbing !important;
		cursor: -webkit-grabbing !important;
		cursor: -moz-grabbing !important;
	}
</style>
