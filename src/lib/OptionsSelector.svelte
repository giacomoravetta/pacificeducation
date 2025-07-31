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

	const skills = $derived([
		...new Set(appData.skills.map((skill) => skill['COMPOSITE_BREAKDOWN']))
	]);
	const educationTypes = $derived([...new Set(appData.skills.map((skill) => skill['EDUCATION']))]);
	const sexes = $derived([...new Set(appData.skills.map((skill) => skill['SEX']))]);

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

	const islands = $derived([...new Set(filteredData.map((d) => d['GEO_PICT']))]);

	let draggableInstances: any[] = [];

	const determineOptionType = (selectedOption: string): string | undefined => {
		if (islands.includes(selectedOption)) return 'island';
		if (skills.includes(selectedOption)) return 'skill';
		if (educationTypes.includes(selectedOption)) return 'education';
		if (sexes.includes(selectedOption)) return 'sex';
		return undefined;
	};

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

	function gsapDragScroll(node: HTMLElement) {
		let isDragging = false;

		const contentWrapper = node.querySelector('.scroll-content') as HTMLElement;
		if (!contentWrapper) return { destroy: () => {} };

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
			},
			onDragStart() {
				isDragging = true;
				node.classList.add('cursor-grabbing');
				contentWrapper.style.cursor = 'grabbing';
			},
			onDragEnd() {
				node.classList.remove('cursor-grabbing');
				contentWrapper.style.cursor = 'grab';

				setTimeout(() => {
					isDragging = false;
				}, 100);
			},
			onDrag() {
				this.applyBounds(getBounds());
			}
		})[0];

		const handleClick = (e: MouseEvent) => {
			if (isDragging) {
				e.preventDefault();
				e.stopPropagation();
				e.stopImmediatePropagation();
				return false;
			}
		};

		node.addEventListener('click', handleClick, true);

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
				node.removeEventListener('click', handleClick, true);
			}
		};
	}

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
			class="w-0 border border-white bg-transparent text-xl text-white hover:bg-blue-600 focus:ring-0 focus:outline-none"
			onclick={() => (hiddenDrawer = false)}><InfoCircleSolid /></Button
		>

		<CloseButton
			onclick={() => {
				hidden = true;
			}}
			class="text-white hover:bg-blue-600 focus:ring-0 focus:outline-none"
		/>
	</div>

	<div
		class="relative border-b border-white/15 px-6 py-6 transition-all duration-300 ease-out hover:bg-white/5"
	>
		<div class="mb-4 flex items-center gap-3">
			<div
				class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-[min(3dvw,17px)] text-white backdrop-blur-sm"
			>
				🧮
			</div>
			<h3 class="text-[min(3dvw,17px)] font-semibold tracking-wide text-white">Skills</h3>
		</div>
		<div
			class="scrollbar-thin scrollbar-track-white/10 scrollbar-thumb-blue-400/60 hover:scrollbar-thumb-blue-300/80 cursor-grab overflow-hidden active:cursor-grabbing"
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
							flex flex-shrink-0 transform-gpu items-center gap-2 rounded-2xl
							px-5 py-3 text-[min(3dvw,17px)] font-medium whitespace-nowrap !ring-0
							backdrop-blur-sm transition-all duration-300 !outline-none focus:!ring-0 focus:!outline-none focus-visible:!outline-none

							{isSelected
							? 'border border-white/90 bg-white/90 text-blue-900 shadow-lg'
							: 'border border-white/20 bg-white/15'}
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

	<div
		class="relative border-b border-white/15 px-6 py-6 transition-all duration-300 ease-out hover:bg-white/5"
	>
		<div class="mb-4 flex items-center gap-3">
			<div
				class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-[min(3dvw,17px)] text-white backdrop-blur-sm"
			>
				📚
			</div>
			<h3 class="text-[min(3dvw,17px)] font-semibold tracking-wide text-white">Education</h3>
		</div>
		<div
			class="scrollbar-thin scrollbar-track-white/10 scrollbar-thumb-emerald-400/60 hover:scrollbar-thumb-emerald-300/80 cursor-grab overflow-hidden active:cursor-grabbing"
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
							flex flex-shrink-0 transform-gpu items-center gap-2 rounded-2xl
							px-5 py-3 text-[min(3dvw,17px)] font-medium whitespace-nowrap !ring-0
							backdrop-blur-sm transition-all duration-300 !outline-none focus:!ring-0 focus:!outline-none focus-visible:!outline-none

							{isSelected
							? 'border border-white/90 bg-white/90 text-blue-900 shadow-lg'
							: 'border border-white/20 bg-white/15'}
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

	<div
		class="relative border-b border-white/15 px-6 py-6 transition-all duration-300 ease-out hover:bg-white/5"
	>
		<div class="mb-4 flex items-center gap-3">
			<div
				class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-[min(3dvw,17px)] text-white backdrop-blur-sm"
			>
				🧑
			</div>
			<h3 class="text-[min(3dvw,17px)] font-semibold tracking-wide text-white">Gender</h3>
		</div>
		<div
			class="scrollbar-thin scrollbar-track-white/10 scrollbar-thumb-purple-400/60 hover:scrollbar-thumb-purple-300/80 cursor-grab overflow-hidden active:cursor-grabbing"
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
							flex flex-shrink-0 transform-gpu items-center gap-2 rounded-2xl
							px-5 py-3 text-[min(3dvw,17px)] font-medium whitespace-nowrap !ring-0
							backdrop-blur-sm transition-all duration-300 !outline-none focus:!ring-0 focus:!outline-none focus-visible:!outline-none

							{isSelected
							? 'border border-white/90 bg-white/90 text-blue-900 shadow-lg'
							: 'border border-white/20 bg-white/15'}
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

	{#if enableIslands}
		<div class="relative px-6 py-6 transition-all duration-300 ease-out hover:bg-white/5">
			<div class="mb-4 flex items-center gap-3">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-[min(3dvw,17px)] text-white backdrop-blur-sm"
				>
					🏝️
				</div>
				<h3 class="text-[min(3dvw,17px)] font-semibold tracking-wide text-white">Islands</h3>
			</div>
			<div
				class="scrollbar-thin scrollbar-track-white/10 scrollbar-thumb-orange-400/60 hover:scrollbar-thumb-orange-300/80 cursor-grab overflow-hidden active:cursor-grabbing"
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
								flex flex-shrink-0 transform-gpu items-center gap-2 rounded-2xl px-5 py-3
								text-[min(3dvw,17px)] font-medium whitespace-nowrap text-white !ring-0
								backdrop-blur-sm transition-all duration-300 !outline-none focus:!ring-0 focus:!outline-none focus-visible:!outline-none

								{isSelected ? 'border shadow-lg' : 'border border-white/20 bg-white/15'}
								{!isEnabled || (!isSelected && optionsState.selectedIslands.length != 0 && compare)
								? 'pointer-events-none cursor-not-allowed opacity-30'
								: 'hover:bg-white/25 hover:shadow-lg active:scale-95'}
							"
							style={isSelected ? `background: ${islandColor}; border-color: ${islandColor};` : ''}
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
			<CloseButton
				onclick={() => (hiddenDrawer = true)}
				class="mb-4 text-white focus:ring-0 focus:outline-none"
			/>
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
	.cursor-grabbing {
		cursor: grabbing !important;
		cursor: -webkit-grabbing !important;
		cursor: -moz-grabbing !important;
	}

	button:focus,
	button:focus-visible,
	button:active {
		outline: none !important;
		box-shadow: none !important;
		border-color: inherit !important;
	}

	button {
		-webkit-tap-highlight-color: transparent;
	}

	button:focus,
	button:active,
	button:focus-visible {
		border-color: inherit !important;
	}

	button:focus:not(:focus-visible) {
		outline: none !important;
	}
</style>
