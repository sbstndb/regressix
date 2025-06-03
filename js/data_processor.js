/**
 * Converts a time string (e.g., "100ns", "50us", "30ms", "1.5s") to nanoseconds.
 * @param {string} timeStr The time string.
 * @returns {number} Time in nanoseconds, or NaN if parsing fails.
 */
function convertToNanos(timeStr) {
    if (typeof timeStr !== 'string') return NaN;
    const lowerTimeStr = timeStr.toLowerCase();

    let value = parseFloat(lowerTimeStr);
    if (isNaN(value)) return NaN;

    if (lowerTimeStr.endsWith('ns')) {
        return value;
    } else if (lowerTimeStr.endsWith('us') || lowerTimeStr.endsWith('µs')) {
        return value * 1000;
    } else if (lowerTimeStr.endsWith('ms')) {
        return value * 1000 * 1000;
    } else if (lowerTimeStr.endsWith('s')) {
        return value * 1000 * 1000 * 1000;
    }
    return NaN; // Default if no recognized unit or unit missing
}

/**
 * Placeholder for loading all benchmark data.
 */
async function loadAllBenchmarkData() {
    console.log('[data_processor] loadAllBenchmarkData called');
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate async loading
    return {
        "v1.0": {
            version: "v1.0", date: "2023-01-01", rawData: {
                benchmarks: [
                    { name: "BenchmarkA", cpu_time: "100ns", real_time: "110ns", iterations: 1000, time_unit: "ns" },
                    { name: "BenchmarkB", cpu_time: "200ms", real_time: "220ms", iterations: 100, time_unit: "ms" },
                    { name: "BenchmarkC", cpu_time: "0.5s", real_time: "0.55s", iterations: 10, time_unit: "s" },
                    { name: "BenchmarkD", cpu_time: "50ns", real_time: "0ns", iterations: 1000, time_unit: "ns" },
                ]
            }
        },
        "v1.1": {
            version: "v1.1", date: "2023-02-01", rawData: {
                benchmarks: [
                    { name: "BenchmarkA", cpu_time: "90ns", real_time: "100ns", iterations: 1000, time_unit: "ns" },
                    { name: "BenchmarkB", cpu_time: "250ms", real_time: "280ms", iterations: 100, time_unit: "ms" },
                    { name: "BenchmarkC", cpu_time: "0.5s", real_time: "0.55s", iterations: 10, time_unit: "s" },
                    { name: "BenchmarkD", cpu_time: "50ns", real_time: "60ns", iterations: 1000, time_unit: "ns" },
                    { name: "BenchmarkE", cpu_time: "70ns", real_time: "0ns", iterations: 1000, time_unit: "ns" },
                ]
            }
        },
        "v1.2": {
            version: "v1.2", date: "2023-03-01", rawData: {
                benchmarks: [
                    { name: "BenchmarkA", cpu_time: "80ns", real_time: "90ns", iterations: 1000, time_unit: "ns" },
                    { name: "BenchmarkB", cpu_time: "240ms", real_time: "270ms", iterations: 100, time_unit: "ms" },
                    { name: "BenchmarkC", cpu_time: "0.45s", real_time: "0.50s", iterations: 10, time_unit: "s" },
                    { name: "BenchmarkD", cpu_time: "0ns", real_time: "0ns", iterations: 1000, time_unit: "ns" },
                    { name: "BenchmarkF", cpu_time: "120ns", real_time: "130ns", iterations: 500, time_unit: "ns" },
                ]
            }
        }
    };
}

/**
 * Placeholder for preparing data for the overall trend chart.
 */
function prepareOverallTrendChartData(allData) {
    console.log('[data_processor] prepareOverallTrendChartData called');
    if (!allData || Object.keys(allData).length === 0) return { labels: [], datasets: [] };
    const versions = Object.keys(allData).sort();
    const labels = versions;
    const datasets = [];
    const benchmarkAName = "BenchmarkA"; // Example
    const benchmarkAData = versions.map(v => {
        const bench = allData[v].rawData.benchmarks.find(b => b.name === benchmarkAName);
        return bench ? convertToNanos(bench.real_time) : NaN;
    });
    if (benchmarkAData.some(d => !isNaN(d))) {
        datasets.push({
            label: `${benchmarkAName} - Real Time (ns)`, data: benchmarkAData,
            borderColor: 'rgba(75, 192, 192, 1)', fill: false
        });
    }
    return { labels, datasets };
}

/**
 * Placeholder for finding impacted benchmarks.
 */
function findImpactedBenchmarks(latestData, secondLatestData, threshold) {
    console.log('[data_processor] findImpactedBenchmarks called');
    if (!latestData || !secondLatestData || !latestData.rawData || !secondLatestData.rawData) return [];
    const impacted = [];
    const prevBenchmarks = secondLatestData.rawData.benchmarks.reduce((map, b) => { map[b.name] = b; return map; }, {});
    latestData.rawData.benchmarks.forEach(latestB => {
        const prevB = prevBenchmarks[latestB.name];
        if (prevB) {
            const prevTime = convertToNanos(prevB.real_time);
            const latestTime = convertToNanos(latestB.real_time);
            if (!isNaN(prevTime) && !isNaN(latestTime) && prevTime > 0) {
                const change = (latestTime - prevTime) / prevTime;
                if (Math.abs(change) >= threshold) {
                    impacted.push({ name: latestB.name, changePercent: change * 100, previousTime: prevTime, currentTime: latestTime });
                }
            }
        }
    });
    return impacted;
}

/**
 * Calculates global performance statistics.
 */
function calculateGlobalPerformanceStats(currentVersionData, previousVersionData) {
    console.log('[data_processor] calculateGlobalPerformanceStats called');
    const defaultStats = {
        commonBenchmarksCount: 0, averageChangePercent: 0, medianChangePercent: 0,
        improvementsCount: 0, regressionsCount: 0, unchangedCount: 0, averageSpeedup: 0,
        fromVersion: previousVersionData ? previousVersionData.version : 'N/A',
        toVersion: currentVersionData ? currentVersionData.version : 'N/A'
    };
    if (!currentVersionData || !previousVersionData || !currentVersionData.rawData || !previousVersionData.rawData ||
        !currentVersionData.rawData.benchmarks || !previousVersionData.rawData.benchmarks) {
        return defaultStats;
    }
    const prevBenchmarks = previousVersionData.rawData.benchmarks.reduce((map, b) => {
        map[b.name] = { name: b.name, realTimeNs: convertToNanos(b.real_time), cpuTimeNs: convertToNanos(b.cpu_time) };
        return map;
    }, {});
    const changes = []; const speedupFactors = [];
    let commonBenchmarksCount = 0, improvementsCount = 0, regressionsCount = 0, unchangedCount = 0;
    currentVersionData.rawData.benchmarks.forEach(currentB => {
        const prevB = prevBenchmarks[currentB.name];
        if (prevB) {
            commonBenchmarksCount++;
            const currentTimeNs = convertToNanos(currentB.real_time);
            const prevTimeNs = prevB.realTimeNs;
            if (isNaN(currentTimeNs) || isNaN(prevTimeNs)) return;
            if (prevTimeNs === 0 && currentTimeNs === 0) { changes.push(0); unchangedCount++; }
            else if (prevTimeNs === 0 && currentTimeNs > 0) { changes.push(Infinity); regressionsCount++; }
            else if (prevTimeNs > 0 && currentTimeNs === 0) { changes.push(-100.0); improvementsCount++; }
            else {
                const percentChange = ((currentTimeNs - prevTimeNs) / prevTimeNs) * 100;
                changes.push(percentChange);
                if (percentChange < -0.01) improvementsCount++;
                else if (percentChange > 0.01) regressionsCount++;
                else unchangedCount++;
            }
            if (prevTimeNs > 0 && currentTimeNs > 0) speedupFactors.push(prevTimeNs / currentTimeNs);
            else if (prevTimeNs > 0 && currentTimeNs === 0) speedupFactors.push(Infinity);
            else if (prevTimeNs === 0 && currentTimeNs > 0) speedupFactors.push(0);
        }
    });
    if (commonBenchmarksCount === 0) return { ...defaultStats, fromVersion: previousVersionData.version, toVersion: currentVersionData.version };
    const finiteChanges = changes.filter(c => isFinite(c));
    const averageChangePercent = finiteChanges.length > 0 ? finiteChanges.reduce((a, b) => a + b, 0) / finiteChanges.length : 0;
    changes.sort((a, b) => a - b);
    let medianChangePercent = changes.length === 0 ? 0 : (changes.length % 2 !== 0 ? changes[Math.floor(changes.length / 2)] : (changes[changes.length/2 - 1] + changes[changes.length/2]) / 2);
    const finiteSpeedupFactors = speedupFactors.filter(sf => isFinite(sf));
    const averageSpeedup = finiteSpeedupFactors.length > 0 ? finiteSpeedupFactors.reduce((a, b) => a + b, 0) / finiteSpeedupFactors.length : 0;
    return {
        commonBenchmarksCount, averageChangePercent: parseFloat(averageChangePercent.toFixed(2)),
        medianChangePercent: parseFloat(medianChangePercent.toFixed(2)), improvementsCount, regressionsCount, unchangedCount,
        averageSpeedup: parseFloat(averageSpeedup.toFixed(2)), fromVersion: previousVersionData.version, toVersion: currentVersionData.version
    };
}

/**
 * Extracts all unique benchmark names from all versions in the data.
 * @param {object} allData - The entire dataset.
 * @returns {Array<string>} A sorted array of unique benchmark names.
 */
function getAllUniqueBenchmarkNames(allData) {
    console.log('[data_processor] getAllUniqueBenchmarkNames called');
    if (!allData) return [];
    const benchmarkNames = new Set();
    for (const versionKey in allData) {
        const versionData = allData[versionKey];
        if (versionData && versionData.rawData && versionData.rawData.benchmarks) {
            versionData.rawData.benchmarks.forEach(bench => benchmarkNames.add(bench.name));
        }
    }
    return Array.from(benchmarkNames).sort();
}

/**
 * Prepares data for Chart.js to display the history of a specific benchmark's real_time.
 * @param {object} allData - The entire dataset.
 * @param {string} benchmarkName - The name of the benchmark to track.
 * @returns {object} Chart.js compatible data object.
 */
function prepareDetailedBenchmarkChartData(allData, benchmarkName) {
    console.log(`[data_processor] prepareDetailedBenchmarkChartData called for: ${benchmarkName}`);
    if (!allData || !benchmarkName) return { labels: [], datasets: [], yAxisLabel: 'Time (ns)' };

    const versions = Object.keys(allData).sort();
    const labels = versions;
    const data = versions.map(versionKey => {
        const versionData = allData[versionKey];
        if (versionData && versionData.rawData && versionData.rawData.benchmarks) {
            const bench = versionData.rawData.benchmarks.find(b => b.name === benchmarkName);
            return bench ? convertToNanos(bench.real_time) : NaN;
        }
        return NaN;
    });

    return {
        labels,
        datasets: [{
            label: `${benchmarkName} - Real Time`,
            data: data,
            borderColor: 'rgba(255, 99, 132, 1)', // Example color
            backgroundColor: 'rgba(255, 99, 132, 0.2)', // Example color
            fill: true,
            tension: 0.1
        }],
        yAxisLabel: 'Time (ns)'
    };
}

/**
 * Gets detailed history for a specific benchmark, including change percentages.
 * @param {object} allData - The entire dataset.
 * @param {string} benchmarkName - The name of the benchmark.
 * @returns {Array<object>} An array of objects with details for each version.
 */
function getBenchmarkSpecificDetails(allData, benchmarkName) {
    console.log(`[data_processor] getBenchmarkSpecificDetails called for: ${benchmarkName}`);
    if (!allData || !benchmarkName) return [];

    const details = [];
    const versions = Object.keys(allData).sort();
    let previousTimeNs = NaN;

    versions.forEach(versionKey => {
        const versionData = allData[versionKey];
        if (versionData && versionData.rawData && versionData.rawData.benchmarks) {
            const bench = versionData.rawData.benchmarks.find(b => b.name === benchmarkName);
            if (bench) {
                const currentTimeNs = convertToNanos(bench.real_time);
                let changePercent = null;

                if (!isNaN(previousTimeNs) && !isNaN(currentTimeNs)) {
                    if (previousTimeNs === 0 && currentTimeNs === 0) {
                        changePercent = 0;
                    } else if (previousTimeNs === 0 && currentTimeNs > 0) {
                        changePercent = Infinity; // Or a very large number to indicate significant regression
                    } else if (previousTimeNs > 0 && currentTimeNs === 0) {
                        changePercent = -100.0;
                    } else {
                        changePercent = ((currentTimeNs - previousTimeNs) / previousTimeNs) * 100;
                    }
                }

                details.push({
                    version: versionData.version,
                    date: versionData.date,
                    timeNs: currentTimeNs,
                    timeStr: bench.real_time,
                    cpuTimeStr: bench.cpu_time,
                    iterations: bench.iterations,
                    changePercent: changePercent !== null && isFinite(changePercent) ? parseFloat(changePercent.toFixed(2)) : changePercent,
                });
                previousTimeNs = currentTimeNs;
            } else {
                 // Benchmark not found in this version, could add a placeholder if needed
                details.push({
                    version: versionData.version,
                    date: versionData.date,
                    timeNs: null, timeStr: "N/A", cpuTimeStr: "N/A", iterations: "N/A", changePercent: null
                });
                previousTimeNs = NaN; // Reset for next available data point
            }
        }
    });
    return details;
}
