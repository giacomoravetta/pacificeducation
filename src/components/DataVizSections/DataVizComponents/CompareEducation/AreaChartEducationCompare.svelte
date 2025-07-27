<script lang="ts">
	import { scaleLinear } from 'd3';
	import { area, curveLinear, line } from 'd3';
	import { extent, group } from 'd3';
	import { translate } from '../../../../translate_util';
	import { appData } from '../../../../state.svelte';

	let { firstOptionsState, secondOptionsState } = $props();

	let selectedPoint = $state({});
	let svgElement = $state();
	let graphWidth = $state(0);

	// Safe data filtering with null checks
	const getFilteredData = (optionsState) => {
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
	};

	// Derived data
	const firstFilteredData = $derived.by(() => getFilteredData(firstOptionsState));
	const secondFilteredData = $derived.by(() => getFilteredData(secondOptionsState));
	const allData = $derived([...firstFilteredData, ...secondFilteredData]);

	// Group and sort data by maximum values (largest first for bottom rendering)
	const firstGroupedData = $derived.by(() => {
		const grouped = Array.from(group(firstFilteredData, (d) => d.GEO_PICT));
		return grouped.sort((a, b) => {
			const maxA = Math.max(...a[1].map((d) => +d.OBS_VALUE));
			const maxB = Math.max(...b[1].map((d) => +d.OBS_VALUE));
			return maxB - maxA; // Descending order (largest first)
		});
	});

	const secondGroupedData = $derived.by(() => {
		const grouped = Array.from(group(secondFilteredData, (d) => d.GEO_PICT));
		return grouped.sort((a, b) => {
			const maxA = Math.max(...a[1].map((d) => +d.OBS_VALUE));
			const maxB = Math.max(...b[1].map((d) => +d.OBS_VALUE));
			return maxB - maxA; // Descending order (largest first)
		});
	});

	// Combine and sort all areas by maximum value for proper layering
	const allAreasData = $derived.by(() => {
		const combined = [
			...firstGroupedData.map(([name, data]) => ({
				name,
				data,
				dataset: 'first',
				maxValue: Math.max(...data.map((d) => +d.OBS_VALUE))
			})),
			...secondGroupedData.map(([name, data]) => ({
				name,
				data,
				dataset: 'second',
				maxValue: Math.max(...data.map((d) => +d.OBS_VALUE))
			}))
		];

		// Sort by max value descending (largest areas first/bottom)
		return combined.sort((a, b) => b.maxValue - a.maxValue);
	});

	// Chart configuration
	const margin = { top: 40, right: 40, left: 60, bottom: 50 };
	const graphHeight = 400;
	const computedGraphWidth = $derived(graphWidth - margin.left - margin.right);

	// Scales
	const xScale = $derived(
		scaleLinear()
			.domain(extent(allData, (d) => d.TIME_PERIOD) || [2020, 2023])
			.range([margin.left, graphWidth - margin.right])
	);

	const yScale = $derived(
		scaleLinear()
			.domain([0, 100])
			.range([graphHeight - margin.bottom, margin.top])
	);

	// Path generators
	const areaGenerator = $derived(
		area()
			.x((d) => xScale(d.TIME_PERIOD))
			.y0(yScale(0))
			.y1((d) => yScale(+d.OBS_VALUE))
			.curve(curveLinear)
	);

	const lineGenerator = $derived(
		line()
			.x((d) => xScale(d.TIME_PERIOD))
			.y((d) => yScale(+d.OBS_VALUE))
			.curve(curveLinear)
	);

	// Animation actions
	function animateArea(node, { delay = 0, opacity = 0.5 } = {}) {
		node.style.fillOpacity = '0';

		const timeout = setTimeout(() => {
			node.style.transition = 'fill-opacity 1.5s ease-out';
			node.style.fillOpacity = opacity.toString();
		}, delay);

		return {
			destroy() {
				clearTimeout(timeout);
			}
		};
	}

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
	const handleMouseEnter = (e, dataPoint, dataset) => {
		if (svgElement) {
			const rect = svgElement.getBoundingClientRect();
			selectedPoint = {
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
				data: dataPoint,
				dataset
			};
		}
	};

	const handleMouseLeave = () => {
		selectedPoint = {};
	};

	// Colors for datasets
	const colors = {
		first: { fill: '#3b82f6', stroke: '#2563eb' },
		second: { fill: '#ef4444', stroke: '#dc2626' }
	};
</script>

<div
	class="flex w-full flex-col items-center justify-center space-y-6"
	bind:clientWidth={graphWidth}
>
	<!-- Header -->
	<div class="w-full">
		<h2 class="text-xl font-bold text-gray-800">Education Data Comparison</h2>
		<p class="mt-1 text-sm text-gray-600">
			Comparing education data across two different selections
		</p>
	</div>

	<!-- Chart Container -->
	<div class="relative w-full">
		<!-- Tooltip -->
		{#if selectedPoint.data}
			<div
				class="pointer-events-none absolute z-20 min-w-[200px] rounded-lg border border-gray-200 bg-white p-3 shadow-xl"
				style="top: {selectedPoint.y - 10}px; left: {selectedPoint.x > graphWidth / 2
					? selectedPoint.x - 220
					: selectedPoint.x + 15}px;"
			>
				<div class="mb-2 flex items-center gap-2">
					<div
						class="h-3 w-3 rounded-full"
						style="background-color: {selectedPoint.dataset === 'Dataset 1'
							? colors.first.fill
							: colors.second.fill}"
					></div>
					<span class="text-sm font-semibold text-gray-800">{selectedPoint.data.GEO_PICT}</span>
				</div>
				<div class="space-y-1 text-xs text-gray-600">
					<div class="flex justify-between gap-4">
						<span>Dataset:</span>
						<span class="font-medium">{selectedPoint.dataset}</span>
					</div>
					<div class="flex justify-between gap-4">
						<span>Year:</span>
						<span class="font-medium">{selectedPoint.data.TIME_PERIOD}</span>
					</div>
					<div class="flex justify-between gap-4">
						<span>Value:</span>
						<span class="font-medium text-gray-800">{selectedPoint.data.OBS_VALUE}%</span>
					</div>
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

			<!-- Render all areas sorted by size (largest first/bottom) -->
			{#each allAreasData as areaItem, i}
				{@const isFirstDataset = areaItem.dataset === 'first'}
				{@const color = isFirstDataset ? colors.first : colors.second}
				{@const datasetName = isFirstDataset ? 'Dataset 1' : 'Dataset 2'}
				{@const baseDelay = isFirstDataset ? 0 : 800}

				<g class="dataset-group {areaItem.dataset}-dataset" data-island={areaItem.name}>
					<!-- Area fill -->
					<path
						class="area-path"
						d={areaGenerator(areaItem.data)}
						fill={color.fill}
						fill-opacity="0"
						stroke="none"
						style="pointer-events: none;"
						use:animateArea={{ delay: baseDelay + i * 100, opacity: isFirstDataset ? 0.4 : 0.3 }}
					/>

					<!-- Border line -->
					<path
						class="line-path"
						d={lineGenerator(areaItem.data)}
						fill="none"
						stroke={color.stroke}
						stroke-width="2.5"
						style="pointer-events: none;"
						use:animateLine={{ delay: baseDelay + i * 100 }}
					/>
				</g>
			{/each}

			<!-- Render data points separately on top -->
			{#each allAreasData as areaItem, i}
				{@const isFirstDataset = areaItem.dataset === 'first'}
				{@const color = isFirstDataset ? colors.first : colors.second}
				{@const datasetName = isFirstDataset ? 'Dataset 1' : 'Dataset 2'}

				<g class="points-group {areaItem.dataset}-points" data-island={areaItem.name}>
					{#each areaItem.data as dataPoint, pointIndex}
						<circle
							class="data-point"
							cx={xScale(dataPoint.TIME_PERIOD)}
							cy={yScale(dataPoint.OBS_VALUE)}
							r="4"
							fill={color.fill}
							stroke="white"
							stroke-width="2"
							style="animation-delay: {2 + i * 0.2 + pointIndex * 0.1}s"
							onmouseenter={(e) => handleMouseEnter(e, dataPoint, datasetName)}
							onmouseleave={handleMouseLeave}
						/>
					{/each}
				</g>
			{/each}

			<!-- X Axis -->
			<g class="x-axis" transform="translate(0, {graphHeight - margin.bottom})">
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
	<div class="flex w-full justify-between gap-8">
		<!-- Dataset 1 Legend -->
		<div class="flex-1 rounded-lg bg-blue-50 p-4">
			<div class="mb-3 flex items-center gap-2">
				<div class="h-3 w-4 rounded bg-blue-500 opacity-60"></div>
				<span class="font-bold text-gray-800">Dataset 1</span>
			</div>
			{#if firstOptionsState?.selectedSkills?.length}
				<div class="space-y-1 text-sm text-gray-700">
					<div>
						<span class="font-semibold">Skill:</span>
						{translate(firstOptionsState.selectedSkills[0])}
					</div>
					<div>
						<span class="font-semibold">Education:</span>
						{translate(firstOptionsState.selectedEducation[0])}
					</div>
					<div>
						<span class="font-semibold">Gender:</span>
						{translate(firstOptionsState.selectedSexes[0])}
					</div>
					<div>
						<span class="font-semibold">Island:</span>
						{firstOptionsState.selectedIslands[0]}
					</div>
				</div>
			{:else}
				<div class="text-sm text-gray-500">No data selected</div>
			{/if}
		</div>

		<!-- Dataset 2 Legend -->
		<div class="flex-1 rounded-lg bg-red-50 p-4">
			<div class="mb-3 flex items-center gap-2">
				<div class="h-3 w-4 rounded bg-red-500 opacity-50"></div>
				<span class="font-bold text-gray-800">Dataset 2</span>
			</div>
			{#if secondOptionsState?.selectedSkills?.length}
				<div class="space-y-1 text-sm text-gray-700">
					<div>
						<span class="font-semibold">Skill:</span>
						{translate(secondOptionsState.selectedSkills[0])}
					</div>
					<div>
						<span class="font-semibold">Education:</span>
						{translate(secondOptionsState.selectedEducation[0])}
					</div>
					<div>
						<span class="font-semibold">Gender:</span>
						{translate(secondOptionsState.selectedSexes[0])}
					</div>
					<div>
						<span class="font-semibold">Island:</span>
						{secondOptionsState.selectedIslands[0]}
					</div>
				</div>
			{:else}
				<div class="text-sm text-gray-500">No data selected</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.dataset-group {
		transition: all 0.2s ease;
	}

	.points-group {
		cursor: pointer;
	}

	.points-group:hover + .dataset-group .area-path,
	.dataset-group:hover .area-path {
		fill-opacity: 0.7 !important;
	}

	.points-group:hover + .dataset-group .line-path,
	.dataset-group:hover .line-path {
		stroke-width: 3.5px;
	}

	.points-group:hover .data-point {
		r: 6;
	}

	.points-group:not(:hover) {
		opacity: 0.9;
	}

	svg:not(:hover) .points-group {
		opacity: 1;
	}

	.area-path {
		transition: fill-opacity 0.2s ease;
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
