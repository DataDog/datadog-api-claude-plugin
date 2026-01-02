/**
 * Response formatting utilities for Datadog API data
 */

export enum OutputFormat {
  JSON = 'json',
  COMPACT = 'compact',
  TABLE = 'table',
  LIST = 'list',
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
