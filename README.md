# Performance Benchmark Dashboard

## Description

This project is a web-based dashboard designed to visualize and analyze performance benchmark data over different versions or commits. It helps developers and QA engineers track performance trends, identify significant regressions or improvements, and explore detailed metrics for individual test cases. The dashboard processes JSON files containing benchmark results and presents the information through interactive charts and tables.

## Features

*   **Overall Performance Trend View:** Displays a chart showing the performance trend of key benchmarks across multiple data versions (e.g., software releases, commit history).
*   **Quick Identification of Major Changes:** Highlights benchmarks that have shown significant performance changes (regressions or improvements) between the two most recent data versions.
*   **Change Analysis (Global Statistics):** Provides a summary of performance changes between the latest two versions, including:
    *   Number of common benchmarks.
    *   Average and median percentage change in performance.
    *   Counts of improved, regressed, and unchanged benchmarks.
    *   Average speedup factor.
*   **Detailed Exploration per Test Case:**
    *   Allows users to select a specific benchmark from a dropdown list.
    *   Displays a historical performance chart (e.g., `real_time` over versions) for the selected benchmark.
    *   Shows a table with detailed metrics for the selected benchmark across all versions, including raw times, iteration counts, and percentage change from the previous version.
*   **User Interface Refinements:**
    *   Loading indicators display during data processing.
    *   Clickable items in the "Major Changes" list directly navigate to the detailed view of the respective benchmark.
    *   Clear error and information messages for various states (data loading, no data, errors).

## Project Structure

```
.
├── index.html              # Main HTML file for the dashboard layout
├── style.css               # CSS for styling the dashboard
├── js/                     # JavaScript files
│   ├── main.js             # Main application logic, event handling, orchestrates UI updates
│   ├── data_processor.js   # Functions for loading, parsing, and processing benchmark data
│   └── ui_builder.js       # Functions for creating and updating UI components (charts, tables, lists)
└── data/                   # (Assumed) Directory for storing benchmark JSON data files
    ├── benchmark_v1.json
    ├── benchmark_v2.json
    └── ...
```

## Data Format (Assumed)

The dashboard expects benchmark data to be provided in JSON files, typically one file per version/commit. Each JSON file should contain an object with metadata (version, date) and the actual benchmark results.

**Example `benchmark_vX.json` structure:**

```json
{
  "version": "v1.0.1",
  "date": "2023-10-26T10:00:00Z",
  "project_name": "MyApplication",
  "commit_hash": "abcdef1234567890",
  "rawData": {
    "benchmarks": [
      {
        "name": "Test.BenchmarkCase1",
        "cpu_time": "150.75 ns", // Can be ns, us, ms, s
        "real_time": "160.20 ns", // Can be ns, us, ms, s
        "iterations": 10000000,
        "time_unit": "ns" // Optional, if times are already numbers in this unit
      },
      {
        "name": "Test.BenchmarkCase2/WithParams/1",
        "cpu_time": "35.2 ms",
        "real_time": "40.5 ms",
        "iterations": 10000,
        "time_unit": "ms"
      }
      // ... more benchmarks
    ]
  }
}
```
*   `cpu_time` and `real_time` are expected as strings with units (ns, us, ms, s) or as numbers if `time_unit` is specified at the benchmark level. The `data_processor.js` handles conversion to nanoseconds.

## How to Run

1.  **Prepare Data:** Place your benchmark JSON data files (e.g., `v1.json`, `v2.json`) into a `data/` directory (or configure the path in `data_processor.js` - currently mocked). The filenames should be sortable in version order (e.g., `v1.0.json`, `v1.1.json` or date-prefixed names).
2.  **Setup:**
    *   Ensure `index.html`, `style.css`, and the `js/` directory are served by a web server (due to browser security restrictions on local file access for `fetch` API, though current version uses mock data).
    *   If using real Chart.js, ensure it's included in `index.html`.
3.  **Open:** Open `index.html` in a modern web browser.

*(Note: The current implementation uses mock data directly within `js/data_processor.js` for `loadAllBenchmarkData()`. To use external JSON files, this function would need to be updated to fetch and process them.)*

## Key Technologies

*   **HTML:** Structure of the dashboard.
*   **CSS:** Styling for presentation.
*   **JavaScript (ES6+):** Application logic, data processing, and UI manipulation.
*   **Chart.js (Conceptual):** While the current implementation uses canvas placeholders for charts, a full version would integrate a library like Chart.js for rich, interactive visualizations.

## Potential Future Enhancements

*   **Dynamic Data Loading:** Implement fetching of JSON files listed in a configuration or from a server endpoint.
*   **Full Chart.js Integration:** Replace canvas placeholders with actual Chart.js charts for better interactivity (tooltips, zooming, filtering).
*   **Date Range Selection:** Allow users to select specific versions or a date range for comparison.
*   **Configuration UI:** Allow users to set thresholds for "major changes" or select different metrics for charts.
*   **Data Aggregation Options:** Provide options to view average, median, p90, etc., for benchmark groups.
*   **Persistent Storage:** Use browser local storage or a backend to save user preferences or annotations.
*   **More Sophisticated Error Handling:** More granular error reporting and recovery.
*   **Unit and Integration Tests:** Add a testing framework for robustness.
*   **Build System/Bundling:** For production, implement a build process (e.g., using Webpack, Rollup) for minification and module bundling.
```
