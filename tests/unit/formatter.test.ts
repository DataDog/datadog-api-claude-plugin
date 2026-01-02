/**
 * Unit tests for formatter module
 */

import {
  ResponseFormatter,
  OutputFormat,
  PaginationOptions,
  TableOptions,
} from '../../src/lib/formatter';

describe('ResponseFormatter', () => {
  describe('formatJSON()', () => {
    it('should format data as pretty JSON', () => {
      const data = { key: 'value', number: 42 };
      const result = ResponseFormatter.formatJSON(data);

      expect(result).toBe(JSON.stringify(data, null, 2));
      expect(result).toContain('\n');
    });
  });

  describe('formatCompact()', () => {
    it('should format data as compact JSON', () => {
      const data = { key: 'value', number: 42 };
      const result = ResponseFormatter.formatCompact(data);

      expect(result).toBe(JSON.stringify(data));
      expect(result).not.toContain('\n');
    });
  });

  describe('formatList()', () => {
    it('should format array of objects as a list', () => {
      const items = [
        { id: '1', name: 'Item One' },
        { id: '2', name: 'Item Two' },
        { id: '3', name: 'Item Three' },
      ];

      const result = ResponseFormatter.formatList(items);

      expect(result).toContain('1. Item One (1)');
      expect(result).toContain('2. Item Two (2)');
      expect(result).toContain('3. Item Three (3)');
    });

    it('should handle empty arrays', () => {
      const result = ResponseFormatter.formatList([]);
      expect(result).toBe('No items found.');
    });

    it('should handle objects without name field', () => {
      const items = [{ id: 'abc' }, { id: 'def' }];
      const result = ResponseFormatter.formatList(items);

      expect(result).toContain('1. abc');
      expect(result).toContain('2. def');
    });

    it('should return JSON for non-array input', () => {
      const data = { key: 'value' };
      const result = ResponseFormatter.formatList(data as any);

      expect(result).toBe(JSON.stringify(data, null, 2));
    });
  });

  describe('formatTable()', () => {
    it('should format array of objects as a table', () => {
      const items = [
        { id: '1', name: 'Item One', status: 'active' },
        { id: '2', name: 'Item Two', status: 'inactive' },
      ];

      const result = ResponseFormatter.formatTable(items);

      expect(result).toContain('id');
      expect(result).toContain('name');
      expect(result).toContain('status');
      expect(result).toContain('Item One');
      expect(result).toContain('Item Two');
      expect(result).toContain('│'); // Box-drawing separator (now default)
    });

    it('should handle empty arrays', () => {
      const result = ResponseFormatter.formatTable([]);
      expect(result).toBe('No items found.');
    });

    it('should format with specified columns', () => {
      const items = [
        { id: '1', name: 'Item One', status: 'active', extra: 'ignored' },
        { id: '2', name: 'Item Two', status: 'inactive', extra: 'ignored' },
      ];

      const result = ResponseFormatter.formatTable(items, ['id', 'name']);

      expect(result).toContain('id');
      expect(result).toContain('name');
      expect(result).not.toContain('status');
      expect(result).not.toContain('extra');
    });

    it('should return JSON for non-array input', () => {
      const data = { key: 'value' };
      const result = ResponseFormatter.formatTable(data as any);

      expect(result).toBe(JSON.stringify(data, null, 2));
    });
  });

  describe('formatSuccess()', () => {
    it('should format success message', () => {
      const result = ResponseFormatter.formatSuccess('Operation completed');
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.message).toBe('Operation completed');
    });

    it('should include data if provided', () => {
      const result = ResponseFormatter.formatSuccess('Done', { id: '123' });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.message).toBe('Done');
      expect(parsed.data).toEqual({ id: '123' });
    });
  });

  describe('formatError()', () => {
    it('should format error message', () => {
      const result = ResponseFormatter.formatError('Something went wrong');
      const parsed = JSON.parse(result);

      expect(parsed.error).toBe(true);
      expect(parsed.message).toBe('Something went wrong');
    });

    it('should include details if provided', () => {
      const result = ResponseFormatter.formatError('Failed', { code: 500 });
      const parsed = JSON.parse(result);

      expect(parsed.error).toBe(true);
      expect(parsed.message).toBe('Failed');
      expect(parsed.details).toEqual({ code: 500 });
    });
  });

  describe('formatMonitor()', () => {
    it('should format monitor information', () => {
      const monitor = {
        id: 123,
        name: 'CPU Monitor',
        type: 'metric alert',
        overall_state: 'OK',
        query: 'avg(last_5m):avg:system.cpu.user{*} > 0.9',
        message: 'CPU usage is high',
        tags: ['env:prod', 'service:web'],
      };

      const result = ResponseFormatter.formatMonitor(monitor);

      expect(result).toContain('CPU Monitor');
      expect(result).toContain('123');
      expect(result).toContain('metric alert');
      expect(result).toContain('OK');
      expect(result).toContain('avg(last_5m)');
      expect(result).toContain('CPU usage is high');
      expect(result).toContain('env:prod');
    });
  });

  describe('formatDashboard()', () => {
    it('should format dashboard information', () => {
      const dashboard = {
        id: 'abc-123',
        title: 'System Dashboard',
        description: 'Overview of system metrics',
        layout_type: 'ordered',
        widgets: [{}, {}, {}],
      };

      const result = ResponseFormatter.formatDashboard(dashboard);

      expect(result).toContain('System Dashboard');
      expect(result).toContain('abc-123');
      expect(result).toContain('Overview of system metrics');
      expect(result).toContain('Widgets: 3');
      expect(result).toContain('ordered');
    });
  });

  describe('format()', () => {
    it('should format according to OutputFormat', () => {
      const data = { key: 'value' };

      const jsonResult = ResponseFormatter.format(data, OutputFormat.JSON);
      expect(jsonResult).toContain('\n');

      const compactResult = ResponseFormatter.format(data, OutputFormat.COMPACT);
      expect(compactResult).not.toContain('\n');
    });

    it('should default to JSON format', () => {
      const data = { key: 'value' };
      const result = ResponseFormatter.format(data);

      expect(result).toBe(ResponseFormatter.formatJSON(data));
    });
  });

  describe('Enhanced Table Formatting', () => {
    const testItems = [
      { id: '1', name: 'Item One', status: 'active' },
      { id: '2', name: 'Item Two', status: 'inactive' },
    ];

    describe('formatTable() with box-drawing', () => {
      it('should format table with box-drawing characters by default', () => {
        const result = ResponseFormatter.formatTable(testItems);

        expect(result).toContain('┌'); // Top-left corner
        expect(result).toContain('┐'); // Top-right corner
        expect(result).toContain('└'); // Bottom-left corner
        expect(result).toContain('┘'); // Bottom-right corner
        expect(result).toContain('│'); // Vertical borders
        expect(result).toContain('─'); // Horizontal borders
        expect(result).toContain('Item One');
        expect(result).toContain('Item Two');
      });

      it('should format table without box-drawing when disabled', () => {
        const options: TableOptions = { useBoxDrawing: false };
        const result = ResponseFormatter.formatTable(testItems, options);

        expect(result).not.toContain('┌');
        expect(result).not.toContain('│');
        expect(result).toContain('---'); // Simple separator
        expect(result).toContain('Item One');
      });

      it('should handle maxColumnWidth option', () => {
        const longItems = [
          { id: '1', description: 'This is a very long description that should be truncated' },
        ];
        const options: TableOptions = { maxColumnWidth: 20 };
        const result = ResponseFormatter.formatTable(longItems, options);

        expect(result).toContain('...');
        expect(result.split('\n').some(line => line.length < 100)).toBe(true);
      });

      it('should support legacy columns array parameter', () => {
        const result = ResponseFormatter.formatTable(testItems, ['id', 'name']);

        expect(result).toContain('id');
        expect(result).toContain('name');
        expect(result).not.toContain('status');
      });

      it('should support columns in TableOptions', () => {
        const options: TableOptions = {
          columns: ['name', 'status'],
          useBoxDrawing: true,
        };
        const result = ResponseFormatter.formatTable(testItems, options);

        expect(result).toContain('name');
        expect(result).toContain('status');
        expect(result).not.toContain('id');
      });
    });
  });

  describe('Pagination', () => {
    const items = Array.from({ length: 50 }, (_, i) => ({
      id: `${i + 1}`,
      name: `Item ${i + 1}`,
    }));

    describe('paginate()', () => {
      it('should paginate items correctly', () => {
        const result = ResponseFormatter.paginate(items, 1, 10);

        expect(result.items.length).toBe(10);
        expect(result.items[0].id).toBe('1');
        expect(result.items[9].id).toBe('10');
        expect(result.pagination.page).toBe(1);
        expect(result.pagination.pageSize).toBe(10);
        expect(result.pagination.total).toBe(50);
      });

      it('should handle different page numbers', () => {
        const result = ResponseFormatter.paginate(items, 3, 10);

        expect(result.items.length).toBe(10);
        expect(result.items[0].id).toBe('21');
        expect(result.items[9].id).toBe('30');
        expect(result.pagination.page).toBe(3);
      });

      it('should handle last page with fewer items', () => {
        const result = ResponseFormatter.paginate(items, 5, 12);

        expect(result.items.length).toBe(2); // 50 items, page 5 with size 12 = items 49-50
        expect(result.items[0].id).toBe('49');
        expect(result.items[1].id).toBe('50');
      });

      it('should handle page number out of bounds', () => {
        const result = ResponseFormatter.paginate(items, 100, 10);

        expect(result.pagination.page).toBe(5); // Should clamp to last valid page
        expect(result.items.length).toBe(10);
      });

      it('should handle empty array', () => {
        const result = ResponseFormatter.paginate([], 1, 10);

        expect(result.items.length).toBe(0);
        expect(result.pagination.total).toBe(0);
        expect(result.pagination.page).toBe(1);
      });
    });

    describe('formatPaginationInfo()', () => {
      it('should format pagination info for first page', () => {
        const pagination: PaginationOptions = {
          page: 1,
          pageSize: 10,
          total: 50,
        };

        const result = ResponseFormatter.formatPaginationInfo(pagination);

        expect(result).toBe('Showing 1-10 of 50 items (Page 1 of 5)');
      });

      it('should format pagination info for middle page', () => {
        const pagination: PaginationOptions = {
          page: 3,
          pageSize: 10,
          total: 50,
        };

        const result = ResponseFormatter.formatPaginationInfo(pagination);

        expect(result).toBe('Showing 21-30 of 50 items (Page 3 of 5)');
      });

      it('should format pagination info for last page', () => {
        const pagination: PaginationOptions = {
          page: 5,
          pageSize: 12,
          total: 50,
        };

        const result = ResponseFormatter.formatPaginationInfo(pagination);

        expect(result).toBe('Showing 49-50 of 50 items (Page 5 of 5)');
      });

      it('should handle empty results', () => {
        const pagination: PaginationOptions = {
          page: 1,
          pageSize: 10,
          total: 0,
        };

        const result = ResponseFormatter.formatPaginationInfo(pagination);

        expect(result).toBe('No items to display.');
      });
    });

    describe('formatWithPagination()', () => {
      it('should format table with pagination info', () => {
        const pagination: PaginationOptions = {
          page: 1,
          pageSize: 5,
          total: 50,
        };

        const result = ResponseFormatter.formatWithPagination(
          items,
          OutputFormat.TABLE,
          pagination
        );

        expect(result).toContain('Item 1');
        expect(result).toContain('Item 5');
        expect(result).not.toContain('Item 6');
        expect(result).toContain('Showing 1-5 of 50 items (Page 1 of 10)');
      });

      it('should format list with pagination info', () => {
        const pagination: PaginationOptions = {
          page: 2,
          pageSize: 5,
          total: 50,
        };

        const result = ResponseFormatter.formatWithPagination(
          items,
          OutputFormat.LIST,
          pagination
        );

        expect(result).toContain('Item 6');
        expect(result).toContain('Item 10');
        expect(result).toContain('Showing 6-10 of 50 items (Page 2 of 10)');
      });

      it('should work without pagination', () => {
        const smallList = items.slice(0, 5);
        const result = ResponseFormatter.formatWithPagination(
          smallList,
          OutputFormat.TABLE
        );

        expect(result).toContain('Item 1');
        expect(result).toContain('Item 5');
        expect(result).not.toContain('Showing'); // No pagination info
      });

      it('should handle non-array input', () => {
        const data = { key: 'value' };
        const result = ResponseFormatter.formatWithPagination(
          data as any,
          OutputFormat.JSON
        );

        expect(result).toBe(JSON.stringify(data, null, 2));
      });

      it('should support table options with pagination', () => {
        const pagination: PaginationOptions = {
          page: 1,
          pageSize: 3,
          total: 50,
        };
        const tableOptions: TableOptions = {
          columns: ['id', 'name'],
          useBoxDrawing: true,
        };

        const result = ResponseFormatter.formatWithPagination(
          items,
          OutputFormat.TABLE,
          pagination,
          tableOptions
        );

        expect(result).toContain('┌');
        expect(result).toContain('id');
        expect(result).toContain('name');
        expect(result).toContain('Showing 1-3 of 50 items');
      });
    });
  });
});
