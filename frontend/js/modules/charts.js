// Charts Module - Chart.js integration
import { getChartColors } from '../utils.js';
import { setChart, getChart, destroyChart } from '../state.js';

/**
 * Render a line chart
 */
export function renderLineChart(canvasId, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    
    const colors = getChartColors();
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if it exists
    destroyChart(canvasId);
    
    const chartConfig = {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: colors.text
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: colors.text },
                    grid: { color: colors.grid }
                },
                y: {
                    ticks: { color: colors.text },
                    grid: { color: colors.grid }
                }
            },
            ...options
        }
    };
    
    const chart = new Chart(ctx, chartConfig);
    setChart(canvasId, chart);
    
    return chart;
}

/**
 * Render a bar chart
 */
export function renderBarChart(canvasId, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    
    const colors = getChartColors();
    const ctx = canvas.getContext('2d');
    
    destroyChart(canvasId);
    
    const chartConfig = {
        type: 'bar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: colors.text
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: colors.text },
                    grid: { color: colors.grid }
                },
                y: {
                    ticks: { color: colors.text },
                    grid: { color: colors.grid }
                }
            },
            ...options
        }
    };
    
    const chart = new Chart(ctx, chartConfig);
    setChart(canvasId, chart);
    
    return chart;
}

/**
 * Render a pie chart
 */
export function renderPieChart(canvasId, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    
    const colors = getChartColors();
    const ctx = canvas.getContext('2d');
    
    destroyChart(canvasId);
    
    const chartConfig = {
        type: 'pie',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: colors.text
                    }
                }
            },
            ...options
        }
    };
    
    const chart = new Chart(ctx, chartConfig);
    setChart(canvasId, chart);
    
    return chart;
}

/**
 * Update chart theme when theme changes
 */
export function updateChartTheme(chartId) {
    const chart = getChart(chartId);
    if (!chart) return;
    
    const colors = getChartColors();
    
    // Update colors
    chart.options.plugins.legend.labels.color = colors.text;
    if (chart.options.scales) {
        if (chart.options.scales.x) {
            chart.options.scales.x.ticks.color = colors.text;
            chart.options.scales.x.grid.color = colors.grid;
        }
        if (chart.options.scales.y) {
            chart.options.scales.y.ticks.color = colors.text;
            chart.options.scales.y.grid.color = colors.grid;
        }
    }
    
    chart.update();
}

/**
 * Refresh all charts on theme change
 */
export function refreshAllChartsOnThemeChange() {
    window.addEventListener('themeChange', () => {
        // Update all active charts
        const chartNames = ['totalIncome', 'incomeBySource', 'incomeByEarner', 'yoyAnnual', 'yoyMonthly'];
        chartNames.forEach(name => updateChartTheme(name));
    });
}
