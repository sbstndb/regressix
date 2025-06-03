// Main entry point for the application
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM fully loaded and parsed');
    await initializeApp();
});

async function initializeApp() {
    console.log('Initializing application...');
    // Assume top-level sections have dedicated message divs or error messages go to 'errorMessage'
    // For example, if 'overallPerformanceTrendSection' is the container for the chart and its messages:
    // showUIMessage('overallPerformanceTrendSection', 'Initializing application components...', 'loading');

    try {
        const allData = await loadOverallPerformanceTrend(); // This function will handle its own section's messages

        if (allData) {
            await loadMajorChanges(allData); // Handles its own section's messages
            await loadGlobalStatistics(allData); // Handles its own section's messages
            await setupDetailedExploration(allData); // Handles its own section's messages
            // clearUIMessage('overallPerformanceTrendSection'); // Or a general app status message clear
        } else {
            // If allData is null, loadOverallPerformanceTrend should have already set an error message.
            // But we might want to indicate that subsequent sections are not loaded.
            showUIMessage('majorChanges', 'Major changes analysis skipped (data unavailable).', 'info');
            showUIMessage('globalStatsDisplay', 'Global statistics calculation skipped (data unavailable).', 'info');
            showUIMessage('detailedTestView', 'Detailed test exploration skipped (data unavailable).', 'info');
        }
    } catch (error) {
        console.error('Error during application initialization:', error);
        // Use the global error display for overarching initialization errors
        displayErrorMessage(`Application initialization failed: ${error.message}`);
    }
}

async function loadOverallPerformanceTrend() {
    const chartCanvasId = 'overallPerformanceChart';
    // Assuming the canvas is within a section that can also display messages, e.g., 'overallPerformanceSection'
    // Or, we might have a dedicated message div like 'overallPerformanceChartMessage'
    const messageHolderId = 'overallPerformanceChartMessage'; // Assumed dedicated message area for the chart
    console.log('Starting to load overall performance trend data...');
    showUIMessage(messageHolderId, 'Loading overall performance trend data...', 'loading');

    try {
        if (typeof loadAllBenchmarkData !== 'function') throw new Error('loadAllBenchmarkData function is not defined.');
        const allData = await loadAllBenchmarkData();

        if (!allData || Object.keys(allData).length === 0) {
            showUIMessage(messageHolderId, 'No benchmark data available for overall trend.', 'info');
            // Also clear the canvas if it was showing something or a previous error
            displayPerformanceChart(chartCanvasId, { labels: [], datasets: [] });
            return null;
        }

        console.log('All benchmark data loaded, preparing chart data...');
        showUIMessage(messageHolderId, 'Preparing chart data for overall trend...', 'loading');


        if (typeof prepareOverallTrendChartData !== 'function') throw new Error('prepareOverallTrendChartData function is not defined.');
        const chartData = prepareOverallTrendChartData(allData);

        if (!chartData || !chartData.labels || chartData.labels.length === 0 || chartData.datasets.every(ds => ds.data.every(d => d === null || isNaN(d)))) {
            showUIMessage(messageHolderId, 'Not enough data to display the performance trend chart.', 'info');
            displayPerformanceChart(chartCanvasId, { labels: [], datasets: [] });
            return null;
        }

        if (typeof displayPerformanceChart !== 'function') throw new Error('displayPerformanceChart function is not defined.');
        // displayPerformanceChart itself will clear the messageHolderId if it's the canvas or its direct message area
        displayPerformanceChart(chartCanvasId, chartData);
        // If displayPerformanceChart doesn't clear messageHolderId (e.g. if it's a separate div), clear it here:
        // clearUIMessage(messageHolderId); // Or hide it, depends on layout
        console.log('Overall performance trend chart displayed.');
        return allData;

    } catch (error) {
        console.error('Error loading or displaying overall performance trend:', error);
        showUIMessage(messageHolderId, `Error loading overall trend: ${error.message}`, 'error');
        displayPerformanceChart(chartCanvasId, { labels: [], datasets: [] }); // Clear chart on error
        return null;
    }
}

async function loadMajorChanges(allData) {
    const messageHolderId = 'majorChangesMessage'; // Dedicated message div
    const listHolderId = 'impactedList'; // Div for the actual list
    console.log('Starting to identify major performance changes...');
    showUIMessage(messageHolderId, 'Loading major performance changes...', 'loading');

    try {
        if (typeof findImpactedBenchmarks !== 'function') throw new Error('findImpactedBenchmarks function is not defined.');
        if (typeof displayImpactedBenchmarksList !== 'function') throw new Error('displayImpactedBenchmarksList function is not defined.');

        const versions = Object.keys(allData).sort();
        if (versions.length < 2) {
            showUIMessage(messageHolderId, 'At least two data versions are required for major changes analysis.', 'info');
            clearUIMessage(listHolderId); // Clear any previous list
            return;
        }
        const latestData = allData[versions[versions.length - 1]];
        const secondLatestData = allData[versions[versions.length - 2]];
        const threshold = 0.10;
        const impacted = findImpactedBenchmarks(latestData, secondLatestData, threshold);

        // displayImpactedBenchmarksList is expected to draw into listHolderId.
        // If it finds no impacted benchmarks, it should show a message in listHolderId.
        displayImpactedBenchmarksList(listHolderId, impacted);
        clearUIMessage(messageHolderId); // Clear loading message if displayImpactedBenchmarksList was successful
        console.log('Impacted benchmarks list displayed or "no impacted" message shown in respective div.');
    } catch (error) {
        console.error('Error in major changes analysis:', error);
        showUIMessage(messageHolderId, `Failed to identify major changes: ${error.message}`, 'error');
        clearUIMessage(listHolderId); // Clear any previous list on error
    }
}

async function loadGlobalStatistics(allData) {
    const messageHolderId = 'globalStatsDisplayMessage'; // Dedicated message div
    const statsHolderId = 'globalStatsDisplay'; // Div for the actual stats
    console.log('Starting to load global performance statistics...');
    showUIMessage(messageHolderId, 'Loading global performance statistics...', 'loading');

    try {
        if (typeof calculateGlobalPerformanceStats !== 'function') throw new Error('calculateGlobalPerformanceStats function is not defined.');
        if (typeof displayGlobalStats !== 'function') throw new Error('displayGlobalStats function is not defined.');

        const versions = Object.keys(allData).sort();
        if (versions.length < 2) {
            showUIMessage(messageHolderId, 'At least two data versions are required for global statistics.', 'info');
            clearUIMessage(statsHolderId); // Clear any previous stats
            return;
        }
        const currentV = allData[versions[versions.length - 1]];
        const previousV = allData[versions[versions.length - 2]];
        const stats = calculateGlobalPerformanceStats(currentV, previousV);

        // displayGlobalStats is expected to draw into statsHolderId.
        // If it finds no common benchmarks, it should show a message in statsHolderId.
        displayGlobalStats(stats, statsHolderId);
        clearUIMessage(messageHolderId); // Clear loading message if displayGlobalStats was successful
        console.log('Global statistics displayed or "no stats" message shown in respective div.');
    } catch (error)
        console.error('Error in global statistics:', error);
        showUIMessage(messageHolderId, `Failed to load global statistics: ${error.message}`, 'error');
        clearUIMessage(statsHolderId); // Clear any previous stats on error
    }
    }
}

async function setupDetailedExploration(allData) {
    const sectionId = 'detailedTestView'; // For general messages/errors in this section
    const selectElementId = 'benchmarkSelect';
    const chartMessageId = 'detailedBenchmarkChartMessage'; // Dedicated message area for the chart
    const chartCanvasId = 'detailedBenchmarkChart';
    const detailsMessageId = 'benchmarkDetailsMessage'; // Dedicated message area for the details table
    const detailsElementId = 'benchmarkDetails'; // The actual table container

    console.log('Setting up detailed exploration...');
    showUIMessage(sectionId, 'Initializing detailed exploration components...', 'loading');

    try {
        if (typeof getAllUniqueBenchmarkNames !== 'function') throw new Error('getAllUniqueBenchmarkNames is not defined.');
        if (typeof populateBenchmarkSelect !== 'function') throw new Error('populateBenchmarkSelect is not defined.');
        // ... (checks for other functions)

        const benchmarkNames = getAllUniqueBenchmarkNames(allData);
        populateBenchmarkSelect(benchmarkNames, selectElementId); // This function should handle its own errors if selectElementId is not found

        const selectElement = document.getElementById(selectElementId);
        if (!selectElement) throw new Error(`Select element #${selectElementId} not found.`);

        selectElement.addEventListener('change', async (event) => {
            const selectedBenchmarkName = event.target.value;
            if (selectedBenchmarkName) {
                console.log(`Benchmark selected: ${selectedBenchmarkName}`);
                showUIMessage(chartMessageId, `Loading chart for ${selectedBenchmarkName}...`, 'loading');
                showUIMessage(detailsMessageId, `Loading details for ${selectedBenchmarkName}...`, 'loading');

                // Yield to allow UI to update with loading messages
                await new Promise(resolve => setTimeout(resolve, 0));

                try {
                    if (typeof prepareDetailedBenchmarkChartData !== 'function') throw new Error('prepareDetailedBenchmarkChartData is not defined.');
                    const chartData = prepareDetailedBenchmarkChartData(allData, selectedBenchmarkName);
                    displayPerformanceChart(chartCanvasId, chartData); // Handles its own message clearing for chartMessageId (if integrated)
                    clearUIMessage(chartMessageId); // Explicitly clear if displayPerformanceChart doesn't

                    if (typeof getBenchmarkSpecificDetails !== 'function') throw new Error('getBenchmarkSpecificDetails is not defined.');
                    const specificDetails = getBenchmarkSpecificDetails(allData, selectedBenchmarkName);
                    displayBenchmarkDetails(specificDetails, detailsElementId); // Handles its own message clearing for detailsElementId
                    clearUIMessage(detailsMessageId); // Explicitly clear

                } catch (err) {
                    console.error(`Error processing benchmark ${selectedBenchmarkName}:`, err);
                    showUIMessage(chartMessageId, `Error displaying chart: ${err.message}`, 'error');
                    showUIMessage(detailsMessageId, `Error displaying details: ${err.message}`, 'error');
                }
            } else {
                console.log('No benchmark selected. Clearing detailed view.');
                displayPerformanceChart(chartCanvasId, { labels: [], datasets: [] }); // Clear chart
                showUIMessage(detailsElementId, 'Select a benchmark to see its detailed history.', 'info');
                clearUIMessage(chartMessageId);
                clearUIMessage(detailsMessageId);
            }
        });
        showUIMessage(sectionId, 'Detailed exploration ready. Select a benchmark.', 'info');
        // Initial state message for details section
        showUIMessage(detailsElementId, 'Select a benchmark to see its detailed history.', 'info');

    } catch (error) {
        console.error('Error setting up detailed exploration:', error);
        showUIMessage(sectionId, `Failed to set up detailed exploration: ${error.message}`, 'error');
    }
}

/**
 * Fallback global error display. Prefers specific section messages if possible.
 * This function is kept for more general errors or if a section doesn't have its own message div.
 */
function displayErrorMessage(message, targetElementId = 'errorMessage') {
    // This is now primarily for the main 'errorMessage' div or unhandled cases.
    // Most section-specific errors should use showUIMessage(sectionId, message, 'error').
    const errorDiv = document.getElementById(targetElementId);
    if (errorDiv) {
        errorDiv.innerHTML = `<div class="error-message">${message}</div>`; // Ensure it uses the class
        errorDiv.style.display = 'block';
    } else {
        console.warn(`Fallback error display: Element #${targetElementId} not found. Message: ${message}`);
        // Optionally, create a temporary banner at the top of the page for very critical errors
        const body = document.querySelector('body');
        const p = document.createElement('p');
        p.className = 'error-message'; // Apply class
        p.textContent = `Critical Error: ${message}`;
        p.style.position = 'fixed'; p.style.top = '0'; p.style.left = '0'; p.style.width = '100%';
        p.style.backgroundColor = '#FFD2D2'; p.style.padding = '10px'; p.style.textAlign = 'center';
        p.style.zIndex = '1000';
        body.prepend(p);
        setTimeout(() => p.remove(), 5000); // Auto-remove after 5s
    }
}
