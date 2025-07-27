<script lang="ts">
	import { scaleLinear } from 'd3';
	import { line, curveLinear } from 'd3';
	import { extent, group } from 'd3';
	import { appData } from '../../../../state.svelte';
	import { translate } from '../../../../translate_util';

	let { optionsState } = $props();

	let selectedPoint = $state({});
	let svgElement = $state();
	let graphWidth = $state(0);

	// Safe data filtering
	const filteredData = $derived.by(() => {
		if (
			!optionsState?.selectedIslands ||
			!optionsState?.selectedSkills ||
			!optionsState?.selectedSexes ||
			!optionsState?.selectedEducation
		) {
			return [];
		}

		return appData.skills.filter(
			(d) =>
				optionsState.selectedIslands.includes(d.GEO_PICT) &&
				optionsState.selectedSkills.includes(d.COMPOSITE_BREAKDOWN) &&
				optionsState.selectedSexes.includes(d.SEX) &&
				optionsState.selectedEducation.includes(d.EDUCATION)
		);
	});

	// Group data by island
	const groupedData = $derived.by(() => {
		return Array.from(group(filteredData, (d) => d.GEO_PICT));
	});

	// Description data
	const descriptionData = $derived.by(() => {
		const totalDataPoints = filteredData.length;
		const uniqueYears = [...new Set(filteredData.map((d) => d.TIME_PERIOD))].sort();
		const yearRange =
			uniqueYears.length > 1
				? `${Math.min(...uniqueYears)} - ${Math.max(...uniqueYears)}`
				: uniqueYears[0]?.toString() || 'No data';

		const averageValue =
			totalDataPoints > 0
				? (filteredData.reduce((sum, d) => sum + +d.OBS_VALUE, 0) / totalDataPoints).toFixed(1)
				: '0';

		return {
			totalDataPoints,
			yearRange,
			averageValue,
			hasData: totalDataPoints > 0
		};
	});

	// Generate description text
	const descriptionText = $derived(() => {
		if (!optionsState) return 'Loading...';

		const { selectedSkills, selectedEducation, selectedSexes, selectedIslands } = optionsState;

		if (!descriptionData.hasData) {
			return 'No data available for the current selection. Please adjust your filters.';
		}

		const parts = [];

		// Subject description
		if (selectedSexes?.length === 1) {
			parts.push(`${selectedSexes[0].toLowerCase()} individuals`);
		} else if (selectedSexes?.length > 1) {
			parts.push(
				`individuals (${selectedSexes
					.map((sex) => translate(sex))
					.join(', ')
					.toLowerCase()})`
			);
		} else {
			parts.push('all individuals');
		}

		// Education level
		if (selectedEducation?.length === 1) {
			parts.push(`with ${translate(selectedEducation[0]).toLowerCase()} education`);
		} else if (selectedEducation?.length > 1) {
			parts.push(`across ${selectedEducation.length} education levels`);
		}

		// Skills
		if (selectedSkills?.length === 1) {
			parts.push(`in ${translate(selectedSkills[0]).toLowerCase()}`);
		} else if (selectedSkills?.length > 1) {
			parts.push(`across ${selectedSkills.length} skill categories`);
		}

		// Location
		if (selectedIslands?.length === 1) {
			parts.push(`in ${selectedIslands[0]}`);
		} else if (selectedIslands?.length > 1) {
			parts.push(`across ${selectedIslands.length} islands`);
		}

		const baseText = `Showing education data for ${parts.join(' ')}`;
		const statsText = ` over ${descriptionData.yearRange} (${descriptionData.totalDataPoints} data points, ${descriptionData.averageValue}% average)`;

		return baseText + statsText;
	});

	// Chart configuration
	const margin = { top: 40, right: 40, left: 60, bottom: 50 };
	const graphHeight = 400;

	// Scales
	const xScale = $derived(
		scaleLinear()
			.domain(extent(filteredData, (d) => d.TIME_PERIOD) || [2020, 2023])
			.range([margin.left, graphWidth - margin.right])
	);

	const yScale = $derived(
		scaleLinear()
			.domain([0, 100])
			.range([graphHeight - margin.bottom, margin.top])
	);

	// Line generator
	const lineGenerator = $derived(
		line()
			.x((d) => xScale(d.TIME_PERIOD))
			.y((d) => yScale(+d.OBS_VALUE))
			.curve(curveLinear)
	);

	// Animation action for lines
	function animateLine(node, { delay = 0 } = {}) {
		const pathLength = node.getTotalLength();
		node.style.strokeDasharray = pathLength.toString();
		node.style.strokeDashoffset = pathLength.toString();

		const timeout = setTimeout(() => {
			node.style.transition = 'stroke-dashoffset 1.5s ease-out';
			node.style.strokeDashoffset = '0';
		}, delay);

		return {
			destroy() {
				clearTimeout(timeout);
			}
		};
	}

	// Event handlers
	const handleMouseEnter = (e, dataPoint) => {
		if (svgElement) {
			const rect = svgElement.getBoundingClientRect();
			selectedPoint = {
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
				data: dataPoint
			};
		}
	};

	const handleMouseLeave = () => {
		selectedPoint = {};
	};

	const handleClick = (e, dataPoint) => {
		if (svgElement) {
			const rect = svgElement.getBoundingClientRect();
			selectedPoint = {
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
				data: dataPoint
			};
			// Keep tooltip visible for 3 seconds on mobile
			setTimeout(() => {
				selectedPoint = {};
			}, 3000);
		}
	};
</script>

<div
	class="flex w-full flex-col items-center justify-center space-y-6"
	bind:clientWidth={graphWidth}
>
	<!-- Header -->
	<div class="w-full">
		<h2 class="mb-2 text-xl font-bold text-gray-800">Education Data Visualization</h2>
		<p class="max-w-3xl text-sm leading-relaxed text-gray-600">
			{descriptionText()}
		</p>
	</div>

	<!-- Filter summary chips -->
	{#if optionsState}
		<div class="flex w-full flex-wrap gap-2">
			{#if optionsState.selectedSkills?.length > 0}
				<div
					class="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800"
				>
					<span class="h-2 w-2 rounded-full bg-blue-500"></span>
					Skill: {translate(optionsState.selectedSkills[0])}
				</div>
			{/if}

			{#if optionsState.selectedEducation?.length > 0}
				<div
					class="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800"
				>
					<span class="h-2 w-2 rounded-full bg-green-500"></span>
					Education: {translate(optionsState.selectedEducation[0])}
				</div>
			{/if}

			{#if optionsState.selectedSexes?.length > 0}
				<div
					class="flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800"
				>
					<span class="h-2 w-2 rounded-full bg-purple-500"></span>
					Gender: {translate(optionsState.selectedSexes[0])}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Chart Container -->
	<div class="relative w-full">
		<!-- Tooltip -->
		{#if selectedPoint.data && optionsState?.colorsIslands}
			<div
				class="pointer-events-none absolute z-20 min-w-[200px] rounded-lg border border-gray-200 bg-white p-3 shadow-xl"
				style="top: {selectedPoint.y - 10}px; left: {selectedPoint.x > graphWidth / 2
					? selectedPoint.x - 220
					: selectedPoint.x + 15}px;"
			>
				<div class="mb-2 flex items-center gap-2">
					<div
						class="h-3 w-3 rounded-full"
						style="background-color: {optionsState.colorsIslands[selectedPoint.data.GEO_PICT]}"
					></div>
					<span class="text-sm font-semibold text-gray-800">{selectedPoint.data.GEO_PICT}</span>
				</div>
				<div class="space-y-1 text-xs text-gray-600">
					<div class="flex justify-between gap-4">
						<span>Year:</span>
						<span class="font-medium">{selectedPoint.data.TIME_PERIOD}</span>
					</div>
					<div class="flex justify-between gap-4">
						<span>Value:</span>
						<span class="font-medium text-gray-800">{selectedPoint.data.OBS_VALUE}%</span>
					</div>
					{#if selectedPoint.data.COMPOSITE_BREAKDOWN}
						<div class="flex justify-between gap-4">
							<span>Skill:</span>
							<span class="text-right font-medium"
								>{translate(selectedPoint.data.COMPOSITE_BREAKDOWN)}</span
							>
						</div>
					{/if}
					{#if selectedPoint.data.EDUCATION}
						<div class="flex justify-between gap-4">
							<span>Education:</span>
							<span class="text-right font-medium">{translate(selectedPoint.data.EDUCATION)}</span>
						</div>
					{/if}
					{#if selectedPoint.data.SEX}
						<div class="flex justify-between gap-4">
							<span>Gender:</span>
							<span class="text-right font-medium">{translate(selectedPoint.data.SEX)}</span>
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<svg
			bind:this={svgElement}
			width={graphWidth}
			height={graphHeight}
			class="overflow-visible rounded border border-gray-200"
		>
			<!-- Grid lines -->
			<g class="grid">
				<!-- Vertical grid lines -->
				{#each xScale.ticks(8).filter((tick) => Number.isInteger(tick)) as tick}
					<line
						x1={xScale(tick)}
						x2={xScale(tick)}
						y1={margin.top}
						y2={graphHeight - margin.bottom}
						stroke="black"
						stroke-width="0.5"
						stroke-dasharray="3,2"
						stroke-opacity="0.3"
					/>
				{/each}

				<!-- Horizontal grid lines -->
				{#each yScale.ticks(5) as tick}
					<line
						x1={margin.left}
						x2={graphWidth - margin.right}
						y1={yScale(tick)}
						y2={yScale(tick)}
						stroke="black"
						stroke-width="0.5"
						stroke-dasharray="3,2"
						stroke-opacity="0.3"
					/>
				{/each}
			</g>

			<!-- Render lines and points -->
			{#each groupedData as [islandName, islandData], i}
				{@const islandColor = optionsState?.colorsIslands?.[islandName] || '#3b82f6'}

				<g class="island-group" data-island={islandName}>
					<!-- Line path -->
					<path
						class="line-path"
						d={lineGenerator(islandData)}
						fill="none"
						stroke={islandColor}
						stroke-width="3"
						style="pointer-events: none;"
						use:animateLine={{ delay: i * 200 }}
					/>

					<!-- Data points -->
					{#each islandData as dataPoint, pointIndex}
						<circle
							class="data-point"
							cx={xScale(dataPoint.TIME_PERIOD)}
							cy={yScale(dataPoint.OBS_VALUE)}
							r="4"
							fill={islandColor}
							stroke="white"
							stroke-width="2"
							style="animation-delay: {1.5 + i * 0.2 + pointIndex * 0.1}s"
							onmouseenter={(e) => handleMouseEnter(e, dataPoint)}
							onmouseleave={handleMouseLeave}
							onclick={(e) => handleClick(e, dataPoint)}
						/>
					{/each}
				</g>
			{/each}

			<!-- X Axis -->
			<g class="x-axis" transform="translate(0, {graphHeight - margin.bottom})">
				<!-- <line
					x1={margin.left}
					x2={graphWidth - margin.right}
					y1="0"
					y2="0"
					stroke="#374151"
					stroke-width="1"
				/> -->
				{#each xScale.ticks(8).filter((tick) => Number.isInteger(tick)) as tick}
					<text
						x={xScale(tick)}
						y="20"
						text-anchor="middle"
						font-size="12"
						fill="#6b7280"
						font-weight="500"
					>
						{tick}
					</text>
				{/each}
			</g>

			<!-- Y Axis -->
			<g class="y-axis" transform="translate({margin.left}, 0)">
				<!-- <line
					x1="0"
					x2="0"
					y1={margin.top}
					y2={graphHeight - margin.bottom}
					stroke="#374151"
					stroke-width="1"
				/> -->
				{#each yScale.ticks(5) as tick}
					<text
						x="-10"
						y={yScale(tick)}
						text-anchor="end"
						dominant-baseline="middle"
						font-size="12"
						fill="#6b7280"
						font-weight="500"
					>
						{tick}%
					</text>
				{/each}
			</g>
		</svg>
	</div>

	<!-- Legend -->
	{#if groupedData.length > 0 && optionsState?.colorsIslands}
		<div class="w-full">
			<div class="flex flex-col items-center">
				<h3 class="mb-3 text-sm font-semibold text-gray-700">Islands</h3>
				<div class="flex flex-wrap justify-center gap-4">
					{#each groupedData as [islandName, islandData]}
						<div class="flex items-center gap-2">
							<!-- Legend line indicator -->
							<div class="flex items-center">
								<svg width="24" height="12" class="mr-1">
									<line
										x1="2"
										y1="6"
										x2="22"
										y2="6"
										stroke={optionsState.colorsIslands[islandName]}
										stroke-width="3"
									/>
									<circle
										cx="12"
										cy="6"
										r="3"
										fill={optionsState.colorsIslands[islandName]}
										stroke="white"
										stroke-width="1"
									/>
								</svg>
							</div>
							<!-- Island name -->
							<span class="text-sm font-medium text-gray-700">{islandName}</span>
							<!-- Data point count -->
							<span class="text-xs text-gray-500">({islandData.length} points)</span>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.island-group {
		transition: all 0.2s ease;
	}

	.island-group:hover .line-path {
		stroke-width: 4px;
	}

	.island-group:hover .data-point {
		r: 6;
	}

	.island-group:not(:hover) {
		opacity: 0.7;
	}

	svg:not(:hover) .island-group {
		opacity: 1;
	}

	.line-path {
		transition: stroke-width 0.2s ease;
	}

	.data-point {
		opacity: 0;
		animation: fadeInPoint 0.4s ease-out forwards;
		transition: r 0.2s ease;
		cursor: pointer;
	}

	@keyframes fadeInPoint {
		from {
			opacity: 0;
			transform: scale(0.3);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.grid {
		opacity: 0.5;
	}

	.x-axis,
	.y-axis {
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
	}
</style>
