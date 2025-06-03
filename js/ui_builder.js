// Store chart instances globally to manage their lifecycle (destroy before re-drawing)
let overallPerformanceChartInstance = null;
let detailedBenchmarkChartInstance = null;

/**
 * Displays or clears a message in a specified UI element.
 * @param {string} elementId - The ID of the HTML element.
 * @param {string} message - The message to display. HTML is allowed.
 * @param {string} type - The type of message ('info', 'loading', 'error').
 */
function showUIMessage(elementId, message, type = 'info') {
    const element = document.getElementById(elementId);
    if (!element) {
        console.warn(`[ui_builder] Element with ID '${elementId}' not found for showUIMessage.`);
        return;
    }
    element.innerHTML = `<div class="${type}-message">${message}</div>`;
    console.log(`[ui_builder] Displayed ${type} message in #${elementId}: ${message}`);
}

/**
 * Clears any message displayed by showUIMessage from a UI element.
 * @param {string} elementId - The ID of the HTML element.
 */
function clearUIMessage(elementId) {
    const element = document.getElementById(elementId);
    if (!element) {
        console.warn(`[ui_builder] Element with ID '${elementId}' not found for clearUIMessage.`);
        return;
    }
    // Clear only if it was a message div, to be safer
    const messageChild = element.querySelector('.loading-message, .error-message, .info-message');
    if (messageChild && element.firstChild === messageChild && element.children.length === 1) {
        element.innerHTML = '';
        console.log(`[ui_builder] Cleared message from #${elementId}`);
    } else if (!messageChild) { // If no specific message child, clear all (original use case)
        element.innerHTML = '';
    }
}


/**
 * Displays a chart on a canvas, managing existing instances.
 */
function displayPerformanceChart(canvasId, chartData) {
    console.log(`[ui_builder] displayPerformanceChart called for canvas: ${canvasId}`, chartData);
    const canvas = document.getElementById(canvasId);
    const messageElementId = canvasId + 'Message'; // e.g. overallPerformanceChartMessage

    // Attempt to clear any loading message from a dedicated sibling div
    const canvasContainer = canvas ? canvas.parentElement : null;
    if (canvasContainer) {
         const messageDiv = canvasContainer.querySelector(`#${messageElementId}`);
         if(messageDiv) clearUIMessage(messageElementId); else clearUIMessage(canvasId); // Try to clear canvas itself if no message div
    } else if (canvas) {
        clearUIMessage(canvasId); // Fallback if no dedicated message div, clear canvas placeholder
    }


    if (!canvas) {
        showUIMessage(messageElementId || 'errorMessage', `Canvas element with ID '${canvasId}' not found.`, 'error');
        return;
    }

    let chartInstanceToManage = (canvasId === 'overallPerformanceChart') ? overallPerformanceChartInstance : detailedBenchmarkChartInstance;

    if (chartInstanceToManage) {
        chartInstanceToManage.destroy();
        console.log(`[ui_builder] Destroyed existing chart for ${canvasId}`);
    }

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!chartData || !chartData.labels || chartData.labels.length === 0 || !chartData.datasets || chartData.datasets.length === 0 || chartData.datasets.every(ds => ds.data.every(d => d === null || isNaN(d)))) {
        // Use showUIMessage on the canvas itself or a dedicated message area if no data
        // For canvas, drawing text is better than replacing the element.
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText("No data available to display chart.", canvas.width / 2, canvas.height / 2);
        console.log(`[ui_builder] No data for chart ${canvasId}.`);
        if (canvasId === 'overallPerformanceChart') overallPerformanceChartInstance = null;
        else if (canvasId === 'detailedBenchmarkChart') detailedBenchmarkChartInstance = null;
        return;
    }

    const simulatedChart = { destroy: function() { console.log(`[ui_builder] Simulated destroy for ${canvasId}`); } };
    if (canvasId === 'overallPerformanceChart') overallPerformanceChartInstance = simulatedChart;
    else detailedBenchmarkChartInstance = simulatedChart;

    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    const yAxisLabelText = chartData.yAxisLabel ? ` (Y-axis: ${chartData.yAxisLabel})` : '';
    ctx.fillText(`Chart: ${chartData.datasets[0].label}${yAxisLabelText}`, canvas.width / 2, 20);
    const barWidth = canvas.width / (chartData.labels.length * 2);
    chartData.datasets.forEach((dataset, dsIndex) => {
        const maxVal = Math.max(...dataset.data.filter(d => !isNaN(d) && d !== null), 0); // Ensure nulls are handled
        dataset.data.forEach((val, i) => {
            if (val !== null && !isNaN(val)) { // Ensure nulls are skipped
                const barHeight = maxVal > 0 ? (val / maxVal) * (canvas.height - 60) : 0;
                ctx.fillStyle = dataset.borderColor || `hsl(${i * 60}, 70%, 50%)`;
                ctx.fillRect(i * (barWidth * 1.5) + dsIndex * barWidth + 30, canvas.height - barHeight - 30, barWidth, barHeight);
                ctx.fillStyle = 'black';
                ctx.fillText(chartData.labels[i], i * (barWidth * 1.5) + dsIndex * barWidth + 30 + barWidth/2, canvas.height - 15);
            }
        });
    });
    console.log(`[ui_builder] Displayed placeholder chart for ${canvasId}. Y-axis label: ${chartData.yAxisLabel || 'N/A'}`);
}

/**
 * Displays a list of impacted benchmarks, making them clickable.
 */
function displayImpactedBenchmarksList(elementId, impactedBenchmarks) {
    console.log('[ui_builder] displayImpactedBenchmarksList called for element:', elementId, 'with data:', impactedBenchmarks);
    const listElement = document.getElementById(elementId);
    if (!listElement) {
        // If the main list element isn't found, we might want to show an error elsewhere or log it.
        // Using showUIMessage on a more global error div or the parent might be an option.
        console.error(`[ui_builder] Element with ID '${elementId}' not found for impacted list.`);
        // Example: showUIMessage('majorChanges', `Error: Element #${elementId} for impacted list not found.`, 'error');
        return;
    }

    clearUIMessage(elementId); // Clear previous messages or "Loading..."

    if (!impactedBenchmarks || impactedBenchmarks.length === 0) {
        showUIMessage(elementId, 'No significantly impacted benchmarks found.', 'info');
        return;
    }
    const ul = document.createElement('ul');
    impactedBenchmarks.forEach(bench => {
        const li = document.createElement('li');
        li.textContent = `${bench.name}: ${bench.changePercent.toFixed(2)}% change (Prev: ${bench.previousTime}ns, Curr: ${bench.currentTime}ns)`;
        li.dataset.benchmarkName = bench.name; // Store name for click handling
        li.className = 'clickable-benchmark-item'; // Add class for styling and selection

        li.addEventListener('click', () => {
            const benchmarkName = li.dataset.benchmarkName;
            console.log(`[ui_builder] Clicked impacted benchmark: ${benchmarkName}`);
            const selectElement = document.getElementById('benchmarkSelect');
            if (selectElement) {
                selectElement.value = benchmarkName;
                // Dispatch 'change' event to trigger detailed view update
                selectElement.dispatchEvent(new Event('change', { bubbles: true }));

                // Optional: Scroll to the detailed view section
                const detailedView = document.getElementById('detailedTestView');
                if (detailedView) {
                    detailedView.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            } else {
                console.error('[ui_builder] Benchmark select element #benchmarkSelect not found.');
            }
        });
        ul.appendChild(li);
    });
    listElement.appendChild(ul);
}

/**
 * Displays global performance statistics.
 */
function displayGlobalStats(stats, elementId = 'globalStatsDisplay') {
    console.log('[ui_builder] displayGlobalStats called for element:', elementId, 'with data:', stats);
    const displayDiv = document.getElementById(elementId);
     if (!displayDiv) {
        console.error(`[ui_builder] Element with ID '${elementId}' not found for global stats.`);
        // showUIMessage('globalStatsContainer', `Error: Element #${elementId} for global stats not found.`, 'error');
        return;
    }
    clearUIMessage(elementId); // Clear previous messages or "Loading..."

    if (!stats || (stats.commonBenchmarksCount === 0 && stats.fromVersion === 'N/A')) {
        showUIMessage(elementId, 'Global performance statistics could not be calculated or are not available.', 'info');
        return;
    }
    if (stats.commonBenchmarksCount === 0) {
        showUIMessage(elementId, `No common benchmarks found between versions ${stats.fromVersion} and ${stats.toVersion} to calculate global stats.`, 'info');
        return;
    }

    const heading = document.createElement('h3');
    heading.textContent = `Global Performance Comparison: ${stats.fromVersion} vs ${stats.toVersion}`;
    displayDiv.appendChild(heading);
    const dl = document.createElement('dl');
    const items = {
        "Common Benchmarks": stats.commonBenchmarksCount, "Average Change (%)": stats.averageChangePercent.toFixed(2) + '%',
        "Median Change (%)": stats.medianChangePercent.toFixed(2) + '%', "Improvements": stats.improvementsCount,
        "Regressions": stats.regressionsCount, "Unchanged": stats.unchangedCount,
        "Average Speedup Factor": stats.averageSpeedup.toFixed(2) + 'x'
    };
    for (const key in items) {
        const dt = document.createElement('dt'); dt.textContent = key;
        const dd = document.createElement('dd'); dd.textContent = items[key];
        dl.appendChild(dt); dl.appendChild(dd);
    }
    displayDiv.appendChild(dl);
}

/**
 * Populates a select dropdown with benchmark names.
 */
function populateBenchmarkSelect(benchmarkNames, selectElementId) {
    console.log('[ui_builder] populateBenchmarkSelect called for element:', selectElementId);
    const selectElement = document.getElementById(selectElementId);
    if (!selectElement) {
        // This is a critical element for detailed view. Error should be visible.
        // Consider using showUIMessage on a parent or a dedicated error area for detailedTestView.
        console.error(`[ui_builder] Select element with ID '${selectElementId}' not found.`);
        // showUIMessage('detailedTestView', `Error: Select element #${selectElementId} not found.`, 'error');
        return;
    }

    const currentlySelected = selectElement.value; // Preserve selection if possible
    selectElement.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.textContent = "-- Select Benchmark --";
    selectElement.appendChild(defaultOption);

    if (!benchmarkNames || benchmarkNames.length === 0) {
        defaultOption.textContent = "-- No Benchmarks Available --";
        selectElement.disabled = true;
        return;
    }

    selectElement.disabled = false;
    benchmarkNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        selectElement.appendChild(option);
    });

    // Try to restore previous selection
    if (benchmarkNames.includes(currentlySelected)) {
        selectElement.value = currentlySelected;
    }
    console.log(`[ui_builder] Populated ${benchmarkNames.length} benchmarks into #${selectElementId}.`);
}

/**
 * Displays detailed history for a specific benchmark.
 */
function displayBenchmarkDetails(details, elementId) {
    console.log('[ui_builder] displayBenchmarkDetails called for element:', elementId);
    const detailsElement = document.getElementById(elementId);
    if (!detailsElement) {
        console.error(`[ui_builder] Element with ID '${elementId}' not found for benchmark details.`);
        // showUIMessage('detailedTestView', `Error: Element #${elementId} for benchmark details not found.`, 'error');
        return;
    }
    clearUIMessage(elementId); // Clear previous messages or "Loading..."

    if (!details || details.length === 0) {
        showUIMessage(elementId, 'No details available for the selected benchmark.', 'info');
        return;
    }

    const table = document.createElement('table');
    table.className = 'benchmark-details-table';
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = ['Version', 'Date', 'Real Time', 'CPU Time', 'Iterations', '% Change (vs Prev)'];
    headers.forEach(headerText => {
        const th = document.createElement('th'); th.textContent = headerText; headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    details.forEach(item => {
        const row = document.createElement('tr');
        let changeText = item.changePercent === null ? 'N/A' : (isFinite(item.changePercent) ? item.changePercent.toFixed(2) + '%' : String(item.changePercent));
        if (item.changePercent > 0) row.classList.add('regression');
        if (item.changePercent < 0) row.classList.add('improvement');

        const cells = [item.version, item.date, item.timeStr, item.cpuTimeStr, item.iterations, changeText];
        cells.forEach(cellText => {
            const td = document.createElement('td'); td.textContent = cellText; row.appendChild(td);
        });
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    detailsElement.appendChild(table);
    console.log(`[ui_builder] Displayed details for ${details.length} versions.`);
}
