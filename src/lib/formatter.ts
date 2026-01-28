// Unless explicitly stated otherwise all files in this repository are licensed
// under the Apache License Version 2.0.
// This product includes software developed at Datadog (https://www.datadoghq.com/).
// Copyright 2024-2026 Datadog, Inc.

/**
 * Response formatting utilities for Datadog API data
 */

import * as asciichart from 'asciichart';

export enum OutputFormat {
  JSON = 'json',
  COMPACT = 'compact',
  TABLE = 'table',
  LIST = 'list',
  CHART = 'chart',
}

/**
 * Box-drawing characters for enhanced table formatting
 */
const BOX_CHARS = {
  topLeft: '┌',
  topRight: '┐',
  bottomLeft: '└',
  bottomRight: '┘',
  horizontal: '─',
  vertical: '│',
  leftT: '├',
  rightT: '┤',
  topT: '┬',
  bottomT: '┴',
  cross: '┼',
};

/**
 * Pagination options for formatting large result sets
 */
export interface PaginationOptions {
  page: number;
  pageSize: number;
  total: number;
}

/**
 * Table formatting options
 */
export interface TableOptions {
  columns?: string[];
  maxColumnWidth?: number;
  useBoxDrawing?: boolean;
}

/**
 * Chart types for ASCII visualization
 */
export enum ChartType {
  LINE = 'line',
  BAR = 'bar',
  SPARKLINE = 'sparkline',
}

/**
 * Chart formatting options
 */
export interface ChartOptions {
  type?: ChartType;
  width?: number;
  height?: number;
  title?: string;
  showLegend?: boolean;
  colors?: boolean;
  labels?: string[];
  format?: 'percent' | 'number' | 'bytes';
}

/**
 * Response formatter for Datadog API data
 */
export class ResponseFormatter {
  /**
   * Formats data according to the specified format
   * @param data The data to format
   * @param format The output format to use
   * @returns Formatted string
   */
  static format(data: any, format: OutputFormat = OutputFormat.JSON): string {
    switch (format) {
      case OutputFormat.JSON:
        return this.formatJSON(data);
      case OutputFormat.COMPACT:
        return this.formatCompact(data);
      case OutputFormat.TABLE:
        return this.formatTable(data);
      case OutputFormat.LIST:
        return this.formatList(data);
      case OutputFormat.CHART:
        return this.formatChart(data);
      default:
        return this.formatJSON(data);
    }
  }

  /**
   * Formats data as pretty-printed JSON
   */
  static formatJSON(data: any): string {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Formats data as compact JSON (single line)
   */
  static formatCompact(data: any): string {
    return JSON.stringify(data);
  }

  /**
   * Formats an array of objects as a simple list
   * @param items Array of items to format
   * @param nameField Field to use for the item name (default: 'name')
   * @param idField Field to use for the item ID (default: 'id')
   */
  static formatList(
    items: any[],
    nameField: string = 'name',
    idField: string = 'id'
  ): string {
    if (!Array.isArray(items)) {
      return this.formatJSON(items);
    }

    if (items.length === 0) {
      return 'No items found.';
    }

    return items
      .map((item, index) => {
        const name = item[nameField] || item[idField] || `Item ${index + 1}`;
        const id = item[idField];
        return id ? `${index + 1}. ${name} (${id})` : `${index + 1}. ${name}`;
      })
      .join('\n');
  }

  /**
   * Formats an array of objects as a table
   * @param items Array of items to format
   * @param options Table formatting options (columns, maxColumnWidth, useBoxDrawing)
   */
  static formatTable(items: any[], options?: string[] | TableOptions): string {
    if (!Array.isArray(items)) {
      return this.formatJSON(items);
    }

    if (items.length === 0) {
      return 'No items found.';
    }

    // Handle legacy API (columns as array) or new options object
    const opts: TableOptions = Array.isArray(options)
      ? { columns: options }
      : options || {};

    const { columns, maxColumnWidth = 50, useBoxDrawing = true } = opts;

    // Determine columns
    const cols = columns || Object.keys(items[0] || {});
    if (cols.length === 0) {
      return 'No data to display.';
    }

    // Calculate column widths with max width constraint
    const widths = cols.map((col) => {
      const values = items.map((item) => this.truncateCell(String(item[col] || ''), maxColumnWidth));
      const maxValueWidth = Math.max(...values.map((v) => v.length));
      return Math.max(col.length, maxValueWidth);
    });

    if (useBoxDrawing) {
      return this.formatTableBoxed(items, cols, widths, maxColumnWidth);
    } else {
      return this.formatTableSimple(items, cols, widths, maxColumnWidth);
    }
  }

  /**
   * Formats a table with box-drawing characters
   */
  private static formatTableBoxed(
    items: any[],
    cols: string[],
    widths: number[],
    maxColumnWidth: number
  ): string {
    const lines: string[] = [];

    // Top border
    const topBorder =
      BOX_CHARS.topLeft +
      widths.map((w) => BOX_CHARS.horizontal.repeat(w + 2)).join(BOX_CHARS.topT) +
      BOX_CHARS.topRight;
    lines.push(topBorder);

    // Header row
    const header =
      BOX_CHARS.vertical +
      cols.map((col, i) => ` ${col.padEnd(widths[i])} `).join(BOX_CHARS.vertical) +
      BOX_CHARS.vertical;
    lines.push(header);

    // Header separator
    const separator =
      BOX_CHARS.leftT +
      widths.map((w) => BOX_CHARS.horizontal.repeat(w + 2)).join(BOX_CHARS.cross) +
      BOX_CHARS.rightT;
    lines.push(separator);

    // Data rows
    items.forEach((item) => {
      const row =
        BOX_CHARS.vertical +
        cols
          .map((col, i) =>
            ` ${this.truncateCell(String(item[col] || ''), maxColumnWidth).padEnd(widths[i])} `
          )
          .join(BOX_CHARS.vertical) +
        BOX_CHARS.vertical;
      lines.push(row);
    });

    // Bottom border
    const bottomBorder =
      BOX_CHARS.bottomLeft +
      widths.map((w) => BOX_CHARS.horizontal.repeat(w + 2)).join(BOX_CHARS.bottomT) +
      BOX_CHARS.bottomRight;
    lines.push(bottomBorder);

    return lines.join('\n');
  }

  /**
   * Formats a table with simple ASCII characters (legacy format)
   */
  private static formatTableSimple(
    items: any[],
    cols: string[],
    widths: number[],
    maxColumnWidth: number
  ): string {
    const lines: string[] = [];

    // Header row
    const header = cols.map((col, i) => col.padEnd(widths[i])).join(' | ');
    lines.push(header);

    // Separator
    const separator = widths.map((w) => '-'.repeat(w)).join('-+-');
    lines.push(separator);

    // Data rows
    items.forEach((item) => {
      const row = cols
        .map((col, i) =>
          this.truncateCell(String(item[col] || ''), maxColumnWidth).padEnd(widths[i])
        )
        .join(' | ');
      lines.push(row);
    });

    return lines.join('\n');
  }

  /**
   * Truncates a cell value if it exceeds max width
   */
  private static truncateCell(value: string, maxWidth: number): string {
    if (value.length <= maxWidth) {
      return value;
    }
    return value.substring(0, maxWidth - 3) + '...';
  }

  /**
   * Formats data as a chart
   * @param data Array of numbers (single series) or array of arrays (multiple series) or object with series data
   * @param options Chart formatting options
   * @returns ASCII chart string
   */
  static formatChart(data: any, options?: ChartOptions): string {
    const opts: ChartOptions = {
      type: ChartType.LINE,
      height: 10,
      title: '',
      showLegend: true,
      colors: true,
      ...options,
    };

    // Normalize data to array format
    let seriesData: number[][] = [];
    let seriesLabels: string[] = [];

    if (Array.isArray(data)) {
      if (data.length === 0) {
        return 'No data to display.';
      }

      // Check if it's a single series or multiple series
      if (Array.isArray(data[0])) {
        seriesData = data as number[][];
        seriesLabels = opts.labels || data.map((_, i) => `Series ${i + 1}`);
      } else {
        seriesData = [data as number[]];
        seriesLabels = opts.labels || ['Data'];
      }
    } else if (data && typeof data === 'object') {
      // Handle object format like { series1: [1,2,3], series2: [4,5,6] }
      seriesLabels = Object.keys(data);
      seriesData = seriesLabels.map((key) => data[key]);
    } else {
      return this.formatJSON(data);
    }

    // Validate series data
    if (seriesData.length === 0 || seriesData.every((s) => s.length === 0)) {
      return 'No data to display.';
    }

    switch (opts.type) {
      case ChartType.LINE:
        return this.formatLineChart(seriesData, seriesLabels, opts);
      case ChartType.BAR:
        return this.formatBarChart(seriesData, seriesLabels, opts);
      case ChartType.SPARKLINE:
        return this.formatSparkline(seriesData, seriesLabels, opts);
      default:
        return this.formatLineChart(seriesData, seriesLabels, opts);
    }
  }

  /**
   * Formats data as a line chart using asciichart
   */
  private static formatLineChart(
    seriesData: number[][],
    seriesLabels: string[],
    options: ChartOptions
  ): string {
    const output: string[] = [];

    // Add title
    if (options.title) {
      output.push(options.title);
      output.push('');
    }

    // Configure asciichart options
    const chartConfig: any = {
      height: options.height || 10,
    };

    if (options.colors) {
      const colors = [
        asciichart.blue,
        asciichart.green,
        asciichart.red,
        asciichart.yellow,
        asciichart.magenta,
        asciichart.cyan,
      ];
      chartConfig.colors = seriesData.map((_, i) => colors[i % colors.length]);
    }

    // Plot the chart
    const chart = asciichart.plot(seriesData.length === 1 ? seriesData[0] : seriesData, chartConfig);
    output.push(chart);

    // Add legend if multiple series
    if (options.showLegend && seriesData.length > 1) {
      output.push('');
      output.push('Legend:');
      seriesLabels.forEach((label, i) => {
        const color = options.colors ? ['blue', 'green', 'red', 'yellow', 'magenta', 'cyan'][i % 6] : '';
        output.push(`  ${color ? `[${color}]` : ''} ${label}`);
      });
    }

    return output.join('\n');
  }

  /**
   * Formats data as a horizontal bar chart
   */
  private static formatBarChart(
    seriesData: number[][],
    seriesLabels: string[],
    options: ChartOptions
  ): string {
    const output: string[] = [];

    // Add title
    if (options.title) {
      output.push(options.title);
      output.push('');
    }

    // For bar charts, we typically show one value per label
    // If multiple series, we'll take the first value or average
    const values = seriesData.map((series) => {
      if (series.length === 0) return 0;
      if (series.length === 1) return series[0];
      // Average the series for bar chart
      return series.reduce((a, b) => a + b, 0) / series.length;
    });

    const maxValue = Math.max(...values.filter((v) => !isNaN(v) && isFinite(v)));
    const maxLabelWidth = Math.max(...seriesLabels.map((l) => l.length));
    const barWidth = options.width || 40;

    values.forEach((value, i) => {
      const label = seriesLabels[i].padEnd(maxLabelWidth);
      const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
      const filledWidth = Math.round((percentage / 100) * barWidth);
      const emptyWidth = barWidth - filledWidth;

      const bar = '█'.repeat(filledWidth) + '░'.repeat(emptyWidth);
      const formattedValue = this.formatValue(value, options.format);
      const percentStr = `(${percentage.toFixed(0)}%)`;

      output.push(`${label} │${bar} ${formattedValue} ${percentStr}`);
    });

    return output.join('\n');
  }

  /**
   * Formats data as sparklines (compact inline charts)
   */
  private static formatSparkline(
    seriesData: number[][],
    seriesLabels: string[],
    options: ChartOptions
  ): string {
    const output: string[] = [];

    // Add title
    if (options.title) {
      output.push(options.title);
      output.push('');
    }

    const sparkChars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

    seriesData.forEach((series, idx) => {
      if (series.length === 0) {
        output.push(`${seriesLabels[idx]}: (no data)`);
        return;
      }

      const min = Math.min(...series);
      const max = Math.max(...series);
      const range = max - min;

      const sparkline = series
        .map((value) => {
          if (range === 0) return sparkChars[4]; // Middle char for flat line
          const normalized = (value - min) / range;
          const index = Math.min(Math.floor(normalized * sparkChars.length), sparkChars.length - 1);
          return sparkChars[index];
        })
        .join('');

      const minStr = this.formatValue(min, options.format);
      const maxStr = this.formatValue(max, options.format);

      output.push(`${seriesLabels[idx]}: ${sparkline} [${minStr} - ${maxStr}]`);
    });

    return output.join('\n');
  }

  /**
   * Formats a numeric value based on format type
   */
  private static formatValue(value: number, format?: string): string {
    if (format === 'percent') {
      return `${value.toFixed(1)}%`;
    } else if (format === 'bytes') {
      const units = ['B', 'KB', 'MB', 'GB', 'TB'];
      let size = value;
      let unitIndex = 0;
      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
      }
      return `${size.toFixed(1)}${units[unitIndex]}`;
    } else {
      // Format large numbers with commas
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
      } else if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
      }
      return value.toFixed(0);
    }
  }

  /**
   * Paginates an array of items
   * @param items Array to paginate
   * @param page Page number (1-indexed)
   * @param pageSize Number of items per page
   * @returns Paginated items and pagination info
   */
  static paginate<T>(items: T[], page: number = 1, pageSize: number = 20): {
    items: T[];
    pagination: PaginationOptions;
  } {
    const total = items.length;
    const totalPages = Math.ceil(total / pageSize);
    const currentPage = Math.max(1, Math.min(page, totalPages || 1));
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, total);

    return {
      items: items.slice(startIndex, endIndex),
      pagination: {
        page: currentPage,
        pageSize,
        total,
      },
    };
  }

  /**
   * Formats pagination information
   */
  static formatPaginationInfo(pagination: PaginationOptions): string {
    const { page, pageSize, total } = pagination;
    const totalPages = Math.ceil(total / pageSize);
    const startItem = (page - 1) * pageSize + 1;
    const endItem = Math.min(page * pageSize, total);

    if (total === 0) {
      return 'No items to display.';
    }

    return `Showing ${startItem}-${endItem} of ${total} items (Page ${page} of ${totalPages})`;
  }

  /**
   * Formats data with pagination
   * @param items Array of items to format
   * @param format Output format to use
   * @param pagination Pagination options
   * @param tableOptions Optional table formatting options (for TABLE format)
   * @returns Formatted string with pagination info
   */
  static formatWithPagination(
    items: any[],
    format: OutputFormat = OutputFormat.TABLE,
    pagination?: PaginationOptions,
    tableOptions?: TableOptions
  ): string {
    if (!Array.isArray(items)) {
      return this.format(items, format);
    }

    // Apply pagination if provided
    let displayItems = items;
    let paginationInfo: PaginationOptions | undefined = pagination;

    if (pagination) {
      const paginated = this.paginate(items, pagination.page, pagination.pageSize);
      displayItems = paginated.items;
      paginationInfo = paginated.pagination;
    }

    // Format the items
    let output: string;
    switch (format) {
      case OutputFormat.TABLE:
        output = this.formatTable(displayItems, tableOptions);
        break;
      case OutputFormat.LIST:
        output = this.formatList(displayItems);
        break;
      case OutputFormat.JSON:
        output = this.formatJSON(displayItems);
        break;
      case OutputFormat.COMPACT:
        output = this.formatCompact(displayItems);
        break;
      default:
        output = this.format(displayItems, format);
    }

    // Add pagination info if applicable
    if (paginationInfo && items.length > 0) {
      return `${output}\n\n${this.formatPaginationInfo(paginationInfo)}`;
    }

    return output;
  }

  /**
   * Formats metric query results
   */
  static formatMetrics(data: any): string {
    if (!data || !data.series) {
      return this.formatJSON(data);
    }

    const output: string[] = [];
    output.push(`Query: ${data.query || 'N/A'}`);
    output.push(`Series: ${data.series.length}`);
    output.push('');

    data.series.forEach((series: any, index: number) => {
      output.push(`Series ${index + 1}:`);
      output.push(`  Metric: ${series.metric || 'N/A'}`);
      output.push(`  Tags: ${(series.tags || []).join(', ') || 'None'}`);
      output.push(`  Points: ${(series.pointlist || []).length}`);
      if (series.pointlist && series.pointlist.length > 0) {
        const firstPoint = series.pointlist[0];
        const lastPoint = series.pointlist[series.pointlist.length - 1];
        output.push(`  First: ${new Date(firstPoint[0]).toISOString()} = ${firstPoint[1]}`);
        output.push(`  Last: ${new Date(lastPoint[0]).toISOString()} = ${lastPoint[1]}`);
      }
      output.push('');
    });

    return output.join('\n');
  }

  /**
   * Formats monitor information
   */
  static formatMonitor(monitor: any): string {
    const output: string[] = [];
    output.push(`Monitor: ${monitor.name || 'Unnamed'}`);
    output.push(`ID: ${monitor.id || 'N/A'}`);
    output.push(`Type: ${monitor.type || 'N/A'}`);
    output.push(`Status: ${monitor.overall_state || 'N/A'}`);
    output.push(`Query: ${monitor.query || 'N/A'}`);
    if (monitor.message) {
      output.push(`Message: ${monitor.message}`);
    }
    if (monitor.tags && monitor.tags.length > 0) {
      output.push(`Tags: ${monitor.tags.join(', ')}`);
    }
    return output.join('\n');
  }

  /**
   * Formats dashboard information
   */
  static formatDashboard(dashboard: any): string {
    const output: string[] = [];
    output.push(`Dashboard: ${dashboard.title || 'Untitled'}`);
    output.push(`ID: ${dashboard.id || 'N/A'}`);
    output.push(`Description: ${dashboard.description || 'None'}`);
    if (dashboard.widgets) {
      output.push(`Widgets: ${dashboard.widgets.length}`);
    }
    if (dashboard.layout_type) {
      output.push(`Layout: ${dashboard.layout_type}`);
    }
    return output.join('\n');
  }

  /**
   * Formats a success message
   */
  static formatSuccess(message: string, data?: any): string {
    const output = {
      success: true,
      message,
      ...(data && { data }),
    };
    return this.formatJSON(output);
  }

  /**
   * Formats an error message (for consistency)
   */
  static formatError(message: string, details?: any): string {
    const output = {
      error: true,
      message,
      ...(details && { details }),
    };
    return this.formatJSON(output);
  }
}
