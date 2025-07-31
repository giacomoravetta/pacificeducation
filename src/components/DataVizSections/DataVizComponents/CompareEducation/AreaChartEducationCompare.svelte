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

	const firstFilteredData = $derived.by(() => getFilteredData(firstOptionsState));
	const secondFilteredData = $derived.by(() => getFilteredData(secondOptionsState));
	const allData = $derived([...firstFilteredData, ...secondFilteredData]);

	const firstGroupedData = $derived.by(() => {
		const grouped = Array.from(group(firstFilteredData, (d) => d.GEO_PICT));
		return grouped.sort((a, b) => {
			const maxA = Math.max(...a[1].map((d) => +d.OBS_VALUE));
			const maxB = Math.max(...b[1].map((d) => +d.OBS_VALUE));
		});
	});

	const secondGroupedData = $derived.by(() => {
		const grouped = Array.from(group(secondFilteredData, (d) => d.GEO_PICT));
		return grouped.sort((a, b) => {
			const maxA = Math.max(...a[1].map((d) => +d.OBS_VALUE));
			const maxB = Math.max(...b[1].map((d) => +d.OBS_VALUE));
		});
	});

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

		return combined.sort((a, b) => b.maxValue - a.maxValue);
	});

	const descriptionData = $derived.by(() => {
		const totalFirst = firstFilteredData.length;
		const totalSecond = secondFilteredData.length;

		const avgFirst =
			totalFirst > 0 ? firstFilteredData.reduce((sum, d) => sum + +d.OBS_VALUE, 0) / totalFirst : 0;

		const avgSecond =
			totalSecond > 0
				? secondFilteredData.reduce((sum, d) => sum + +d.OBS_VALUE, 0) / totalSecond
				: 0;

		const uniqueYearsFirst = [...new Set(firstFilteredData.map((d) => d.TIME_PERIOD))].sort();
		const uniqueYearsSecond = [...new Set(secondFilteredData.map((d) => d.TIME_PERIOD))].sort();

		const yearRangeFirst =
			uniqueYearsFirst.length > 1
				? `${Math.min(...uniqueYearsFirst)} - ${Math.max(...uniqueYearsFirst)}`
				: uniqueYearsFirst[0]?.toString() || 'No data';

		const yearRangeSecond =
			uniqueYearsSecond.length > 1
				? `${Math.min(...uniqueYearsSecond)} - ${Math.max(...uniqueYearsSecond)}`
				: uniqueYearsSecond[0]?.toString() || 'No data';

		return {
			totalFirst,
			totalSecond,
			avgFirst: avgFirst.toFixed(1),
			avgSecond: avgSecond.toFixed(1),
			yearRangeFirst,
			yearRangeSecond,
			hasFirstData: totalFirst > 0,
			hasSecondData: totalSecond > 0,
			difference: Math.abs(avgFirst - avgSecond).toFixed(1),
			higherDataset: avgFirst > avgSecond ? 'Dataset A' : 'Dataset B'
		};
	});

	const margin = { top: 40, right: 40, left: 60, bottom: 50 };
	const graphHeight = 400;

	const xScale = $derived(
		scaleLinear()
			.domain(extent(allData, (d) => d.TIME_PERIOD) || [2020, 2023])
			.range([margin.left, graphWidth - margin.right - margin.left])
	);

	const yScale = $derived(
		scaleLinear()
			.domain([0, 100])
			.range([graphHeight - margin.bottom, margin.top])
	);

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

	const handleClick = (e, dataPoint, dataset) => {
		if (svgElement) {
			const rect = svgElement.getBoundingClientRect();
			selectedPoint = {
				x: e.clientX - rect.left,
				y: e.clientY - rect.top,
				data: dataPoint,
				dataset
			};

			setTimeout(() => {
				selectedPoint = {};
			}, 3000);
		}
	};

	const colors = {
		first: {
			fill: '#3b82f6',
			stroke: '#2563eb',
			gradient: 'from-blue-500 to-blue-600',
			bg: 'from-blue-50 to-cyan-50/30',
			border: 'border-blue-200/50'
		},
		second: {
			fill: '#10b981',
			stroke: '#059669',
			gradient: 'from-emerald-500 to-emerald-600',
			bg: 'from-emerald-50 to-teal-50/30',
			border: 'border-emerald-200/50'
		}
	};
</script>

<div class="flex w-full max-w-5xl flex-col gap-2">
	<div class="flex w-full flex-col justify-between gap-2 md:flex-row">
		<div
			class="w-full rounded-2xl border {colors.first
				.border} bg-gradient-to-br from-blue-50 to-blue-100/80 p-6 shadow-lg"
		>
			<div class="mb-4 flex items-center gap-3">
				<div class="flex items-center gap-2">
					<svg width="32" height="16">
						<defs>
							<linearGradient id="area-gradient-first" x1="0%" y1="0%" x2="0%" y2="100%">
								<stop offset="0%" style="stop-color:{colors.first.fill};stop-opacity:0.4" />
								<stop offset="100%" style="stop-color:{colors.first.fill};stop-opacity:0.1" />
							</linearGradient>
						</defs>
						<path d="M2,14 L8,8 L16,10 L24,6 L30,8 L30,14 Z" fill="url(#area-gradient-first)" />
						<path
							d="M2,14 L8,8 L16,10 L24,6 L30,8"
							fill="none"
							stroke={colors.first.stroke}
							stroke-width="2.5"
						/>
						<circle
							cx="16"
							cy="10"
							r="3"
							fill={colors.first.fill}
							stroke="white"
							stroke-width="1.5"
						/>
					</svg>
				</div>
				<h3 class="text-lg font-bold text-blue-900">Dataset A</h3>
				{#if descriptionData.hasFirstData}
					<div class="rounded-full bg-blue-200 px-3 py-1 text-xs font-medium text-blue-800">
						{descriptionData.totalFirst} points
					</div>
				{/if}
			</div>

			{#if firstOptionsState?.selectedSkills?.length}
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<div class="space-y-2">
						<div class="text-sm">
							<span class="font-semibold text-blue-900">Skill:</span>
							<div class="text-blue-800">{translate(firstOptionsState.selectedSkills[0])}</div>
						</div>
						<div class="text-sm">
							<span class="font-semibold text-blue-900">Education:</span>
							<div class="text-blue-800">{translate(firstOptionsState.selectedEducation[0])}</div>
						</div>
					</div>
					<div class="space-y-2">
						<div class="text-sm">
							<span class="font-semibold text-blue-900">Gender:</span>
							<div class="text-blue-800">{translate(firstOptionsState.selectedSexes[0])}</div>
						</div>
						<div class="text-sm">
							<span class="font-semibold text-blue-900">Average:</span>
							<div class="text-lg font-bold text-blue-700">{descriptionData.avgFirst}%</div>
						</div>
					</div>
				</div>

				{#if firstOptionsState.selectedIslands?.length > 0}
					<div class="mt-4 border-t border-blue-300/50 pt-3">
						<div class="mb-2 text-sm font-semibold text-blue-900">Islands:</div>
						<div class="flex flex-wrap gap-1">
							{#each firstOptionsState.selectedIslands.slice(0, 3) as island (`first-${island}`)}
								<span class="rounded-full bg-blue-200 px-2 py-1 text-xs font-medium text-blue-800">
									{island}
								</span>
							{/each}
							{#if firstOptionsState.selectedIslands.length > 3}
								<span class="rounded-full bg-blue-200 px-2 py-1 text-xs font-medium text-blue-800">
									+{firstOptionsState.selectedIslands.length - 3} more
								</span>
							{/if}
						</div>
					</div>
				{/if}
			{:else}
				<div class="flex items-center gap-2 text-sm text-blue-700">
					<svg class="size-4" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
							clip-rule="evenodd"
						/>
					</svg>
					<span>No data selected for Dataset A</span>
				</div>
			{/if}
		</div>

		<div
			class="w-full rounded-2xl border {colors.second
				.border} bg-gradient-to-br from-emerald-50 to-emerald-100/80 p-6 shadow-lg"
		>
			<div class="mb-4 flex items-center gap-3">
				<div class="flex items-center gap-2">
					<svg width="32" height="16">
						<defs>
							<linearGradient id="area-gradient-second" x1="0%" y1="0%" x2="0%" y2="100%">
								<stop offset="0%" style="stop-color:{colors.second.fill};stop-opacity:0.3" />
								<stop offset="100%" style="stop-color:{colors.second.fill};stop-opacity:0.1" />
							</linearGradient>
						</defs>
						<path d="M2,14 L8,10 L16,6 L24,8 L30,5 L30,14 Z" fill="url(#area-gradient-second)" />
						<path
							d="M2,14 L8,10 L16,6 L24,8 L30,5"
							fill="none"
							stroke={colors.second.stroke}
							stroke-width="2.5"
						/>
						<circle
							cx="16"
							cy="6"
							r="3"
							fill={colors.second.fill}
							stroke="white"
							stroke-width="1.5"
						/>
					</svg>
				</div>
				<h3 class="text-lg font-bold text-emerald-900">Dataset B</h3>
				{#if descriptionData.hasSecondData}
					<div class="rounded-full bg-emerald-200 px-3 py-1 text-xs font-medium text-emerald-800">
						{descriptionData.totalSecond} points
					</div>
				{/if}
			</div>

			{#if secondOptionsState?.selectedSkills?.length}
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<div class="space-y-2">
						<div class="text-sm">
							<span class="font-semibold text-emerald-900">Skill:</span>
							<div class="text-emerald-800">
								{translate(secondOptionsState.selectedSkills[0])}
							</div>
						</div>
						<div class="text-sm">
							<span class="font-semibold text-emerald-900">Education:</span>
							<div class="text-emerald-800">
								{translate(secondOptionsState.selectedEducation[0])}
							</div>
						</div>
					</div>
					<div class="space-y-2">
						<div class="text-sm">
							<span class="font-semibold text-emerald-900">Gender:</span>
							<div class="text-emerald-800">{translate(secondOptionsState.selectedSexes[0])}</div>
						</div>
						<div class="text-sm">
							<span class="font-semibold text-emerald-900">Average:</span>
							<div class="text-lg font-bold text-emerald-700">{descriptionData.avgSecond}%</div>
						</div>
					</div>
				</div>

				{#if secondOptionsState.selectedIslands?.length > 0}
					<div class="mt-4 border-t border-emerald-300/50 pt-3">
						<div class="mb-2 text-sm font-semibold text-emerald-900">Islands:</div>
						<div class="flex flex-wrap gap-1">
							{#each secondOptionsState.selectedIslands.slice(0, 3) as island (`second-${island}`)}
								<span
									class="rounded-full bg-emerald-200 px-2 py-1 text-xs font-medium text-emerald-800"
								>
									{island}
								</span>
							{/each}
							{#if secondOptionsState.selectedIslands.length > 3}
								<span
									class="rounded-full bg-emerald-200 px-2 py-1 text-xs font-medium text-emerald-800"
								>
									+{secondOptionsState.selectedIslands.length - 3} more
								</span>
							{/if}
						</div>
					</div>
				{/if}
			{:else}
				<div class="flex items-center gap-2 text-sm text-emerald-700">
					<svg class="size-4" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
							clip-rule="evenodd"
						/>
					</svg>
					<span>No data selected for Dataset B</span>
				</div>
			{/if}
		</div>
	</div>

	<div
		class="flex w-full flex-col items-center justify-center space-y-8"
		bind:clientWidth={graphWidth}
	>
		<div class="relative w-full max-w-6xl">
			{#if selectedPoint.data}
				<div
					class="animate-in fade-in slide-in-from-bottom-2 pointer-events-none absolute z-20 min-w-[280px] rounded-2xl border border-gray-200/80 bg-white/95 p-4 shadow-2xl backdrop-blur-sm duration-200"
					style="top: {selectedPoint.y - 10}px; left: {selectedPoint.x > graphWidth / 2
						? selectedPoint.x - 300
						: selectedPoint.x + 15}px;"
				>
					<div class="mb-3 flex items-center gap-3">
						<div
							class="size-4 rounded-full shadow-sm ring-2 ring-white"
							style="background-color: {selectedPoint.dataset === 'Dataset A'
								? colors.first.fill
								: colors.second.fill}"
						></div>
						<span class="text-base font-semibold text-gray-900">{selectedPoint.data.GEO_PICT}</span>
						<span
							class="rounded-full px-2 py-1 text-xs font-medium"
							class:bg-blue-100={selectedPoint.dataset === 'Dataset A'}
							class:text-blue-700={selectedPoint.dataset === 'Dataset A'}
							class:bg-emerald-100={selectedPoint.dataset === 'Dataset B'}
							class:text-emerald-700={selectedPoint.dataset === 'Dataset B'}
						>
							{selectedPoint.dataset}
						</span>
					</div>

					<div class="space-y-2">
						<div class="flex items-center justify-between gap-6">
							<span class="text-sm text-gray-600">Year</span>
							<span class="text-sm font-semibold text-gray-900"
								>{selectedPoint.data.TIME_PERIOD}</span
							>
						</div>
						<div class="flex items-center justify-between gap-6">
							<span class="text-sm text-gray-600">Value</span>
							<span
								class="text-lg font-bold"
								class:text-blue-600={selectedPoint.dataset === 'Dataset A'}
								class:text-emerald-600={selectedPoint.dataset === 'Dataset B'}
							>
								{selectedPoint.data.OBS_VALUE}%
							</span>
						</div>
						{#if selectedPoint.data.COMPOSITE_BREAKDOWN}
							<div class="flex items-center justify-between gap-6">
								<span class="text-sm text-gray-600">Skill</span>
								<span class="text-right text-sm font-medium text-gray-900"
									>{translate(selectedPoint.data.COMPOSITE_BREAKDOWN)}</span
								>
							</div>
						{/if}
						{#if selectedPoint.data.EDUCATION}
							<div class="flex items-center justify-between gap-6">
								<span class="text-sm text-gray-600">Education</span>
								<span class="text-right text-sm font-medium text-gray-900"
									>{translate(selectedPoint.data.EDUCATION)}</span
								>
							</div>
						{/if}
						{#if selectedPoint.data.SEX}
							<div class="flex items-center justify-between gap-6">
								<span class="text-sm text-gray-600">Gender</span>
								<span class="text-right text-sm font-medium text-gray-900"
									>{translate(selectedPoint.data.SEX)}</span
								>
							</div>
						{/if}
					</div>
				</div>
			{/if}

			<div
				class="rounded-2xl border border-gray-200/50 bg-gradient-to-br from-white to-gray-50/30 p-6 shadow-lg"
			>
				<svg
					bind:this={svgElement}
					width={graphWidth}
					height={graphHeight}
					class="overflow-visible rounded-xl"
				>
					<g class="grid">
						{#each xScale.ticks(8).filter((tick) => Number.isInteger(tick)) as tick (tick)}
							<line
								x1={xScale(tick)}
								x2={xScale(tick)}
								y1={margin.top}
								y2={graphHeight - margin.bottom}
								stroke="black"
								stroke-width="0.5"
								stroke-dasharray="3,2"
								stroke-opacity="1"
							/>
						{/each}

						{#each yScale.ticks(5) as tick (tick)}
							<line
								x1={margin.left}
								x2={graphWidth - margin.right - margin.left}
								y1={yScale(tick)}
								y2={yScale(tick)}
								stroke="black"
								stroke-width="0.5"
								stroke-dasharray="3,2"
								stroke-opacity="1"
							/>
						{/each}
					</g>

					{#each allAreasData as areaItem, i (`${areaItem.dataset}-${areaItem.name}`)}
						{@const isFirstDataset = areaItem.dataset === 'first'}
						{@const color = isFirstDataset ? colors.first : colors.second}
						{@const datasetName = isFirstDataset ? 'Dataset A' : 'Dataset B'}
						{@const baseDelay = isFirstDataset ? 0 : 800}

						<g class="dataset-group {areaItem.dataset}-dataset" data-island={areaItem.name}>
							<path
								class="area-path"
								d={areaGenerator(areaItem.data)}
								fill={color.fill}
								fill-opacity="0"
								stroke="none"
								style="pointer-events: none;"
								use:animateArea={{
									delay: baseDelay + i * 100,
									opacity: isFirstDataset ? 0.4 : 0.3
								}}
							/>

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

					{#each allAreasData as areaItem, i (`points-${areaItem.dataset}-${areaItem.name}`)}
						{@const isFirstDataset = areaItem.dataset === 'first'}
						{@const color = isFirstDataset ? colors.first : colors.second}
						{@const datasetName = isFirstDataset ? 'Dataset A' : 'Dataset B'}

						<g class="points-group {areaItem.dataset}-points" data-island={areaItem.name}>
							{#each areaItem.data as dataPoint, pointIndex (`${areaItem.name}-${dataPoint.TIME_PERIOD}-${pointIndex}`)}
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
									onclick={(e) => handleClick(e, dataPoint, datasetName)}
								/>
							{/each}
						</g>
					{/each}

					<g class="x-axis" transform="translate(0, {graphHeight - margin.bottom})">
						{#each xScale.ticks(8).filter((tick) => Number.isInteger(tick)) as tick (tick)}
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

					<g class="y-axis" transform="translate({margin.left}, 0)">
						{#each yScale.ticks(5) as tick (tick)}
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
