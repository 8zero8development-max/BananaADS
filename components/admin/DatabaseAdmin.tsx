import { useState, useEffect, useCallback } from 'react';

interface TableInfo {
  table_name: string;
  table_type: string;
}

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

interface QueryResult {
  success: boolean;
  rows: Record<string, unknown>[];
  rowCount: number;
  fields: { name: string; dataTypeID: number }[];
  error?: string;
  details?: string;
}

interface TableDataResult {
  tableName: string;
  rows: Record<string, unknown>[];
  total: number;
  limit: number;
  offset: number;
}

export function DatabaseAdmin() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableSchema, setTableSchema] = useState<ColumnInfo[]>([]);
  const [tableData, setTableData] = useState<TableDataResult | null>(null);
  const [query, setQuery] = useState('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'query' | 'tables'>('tables');

  const fetchTables = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/db/tables');
      if (!response.ok) throw new Error('Failed to fetch tables');
      const data = await response.json();
      setTables(data.tables || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tables');
    }
  }, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const fetchTableSchema = async (tableName: string) => {
    try {
      const response = await fetch(`/api/admin/db/schema/${tableName}`);
      if (!response.ok) throw new Error('Failed to fetch schema');
      const data = await response.json();
      setTableSchema(data.columns || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch schema');
    }
  };

  const fetchTableData = async (tableName: string, offset = 0) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/db/data/${tableName}?limit=50&offset=${offset}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      setTableData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTable = async (tableName: string) => {
    setSelectedTable(tableName);
    setError(null);
    await Promise.all([
      fetchTableSchema(tableName),
      fetchTableData(tableName)
    ]);
  };

  const executeQuery = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setQueryResult(null);

    try {
      const response = await fetch('/api/admin/db/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Query failed');
        if (data.details) {
          setError(`${data.error}: ${data.details}`);
        }
      } else {
        setQueryResult(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query execution failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      executeQuery();
    }
  };

  const formatValue = (value: unknown): string => {
    if (value === null) return 'NULL';
    if (value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Database Admin Panel</h1>
      
      <div className="mb-4 border-b border-gray-700">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('tables')}
            className={`py-2 px-4 ${activeTab === 'tables' ? 'border-b-2 border-yellow-500 text-yellow-500' : 'text-gray-400 hover:text-white'}`}
          >
            Tables
          </button>
          <button
            onClick={() => setActiveTab('query')}
            className={`py-2 px-4 ${activeTab === 'query' ? 'border-b-2 border-yellow-500 text-yellow-500' : 'text-gray-400 hover:text-white'}`}
          >
            SQL Query
          </button>
        </nav>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
          {error}
        </div>
      )}

      {activeTab === 'query' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">SQL Query</label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your SQL query here... (Ctrl+Enter to execute)"
              className="w-full h-40 p-3 bg-gray-800 border border-gray-700 rounded-lg font-mono text-sm focus:outline-none focus:border-yellow-500"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={executeQuery}
              disabled={isLoading || !query.trim()}
              className="px-4 py-2 bg-yellow-500 text-black font-medium rounded-lg hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Executing...' : 'Execute Query'}
            </button>
            <span className="text-sm text-gray-400">Press Ctrl+Enter to execute</span>
          </div>

          {queryResult && (
            <div className="mt-4">
              <div className="mb-2 text-sm text-gray-400">
                {queryResult.rowCount} row(s) returned
              </div>
              
              {queryResult.rows.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-800">
                        {queryResult.fields.map((field, i) => (
                          <th key={i} className="px-4 py-2 text-left border border-gray-700 font-medium">
                            {field.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryResult.rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-gray-800/50">
                          {queryResult.fields.map((field, colIndex) => (
                            <td key={colIndex} className="px-4 py-2 border border-gray-700 font-mono text-sm">
                              {formatValue(row[field.name])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'tables' && (
        <div className="grid grid-cols-4 gap-6">
          <div className="col-span-1">
            <h2 className="text-lg font-semibold mb-3">Tables</h2>
            <div className="space-y-1">
              {tables.map((table) => (
                <button
                  key={table.table_name}
                  onClick={() => handleSelectTable(table.table_name)}
                  className={`w-full text-left px-3 py-2 rounded ${
                    selectedTable === table.table_name
                      ? 'bg-yellow-500 text-black'
                      : 'hover:bg-gray-800'
                  }`}
                >
                  {table.table_name}
                  <span className="text-xs ml-2 opacity-60">
                    ({table.table_type === 'BASE TABLE' ? 'table' : 'view'})
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="col-span-3">
            {selectedTable && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-3">
                    Schema: {selectedTable}
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-800">
                          <th className="px-4 py-2 text-left border border-gray-700">Column</th>
                          <th className="px-4 py-2 text-left border border-gray-700">Type</th>
                          <th className="px-4 py-2 text-left border border-gray-700">Nullable</th>
                          <th className="px-4 py-2 text-left border border-gray-700">Default</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableSchema.map((col, i) => (
                          <tr key={i} className="hover:bg-gray-800/50">
                            <td className="px-4 py-2 border border-gray-700 font-mono">{col.column_name}</td>
                            <td className="px-4 py-2 border border-gray-700 font-mono text-yellow-400">{col.data_type}</td>
                            <td className="px-4 py-2 border border-gray-700">{col.is_nullable}</td>
                            <td className="px-4 py-2 border border-gray-700 font-mono text-sm">{col.column_default || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold">
                      Data: {selectedTable}
                      {tableData && (
                        <span className="text-sm font-normal text-gray-400 ml-2">
                          ({tableData.total} total rows)
                        </span>
                      )}
                    </h2>
                    {tableData && tableData.total > tableData.limit && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => fetchTableData(selectedTable, Math.max(0, tableData.offset - tableData.limit))}
                          disabled={tableData.offset === 0 || isLoading}
                          className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <span className="text-sm text-gray-400">
                          {tableData.offset + 1}-{Math.min(tableData.offset + tableData.limit, tableData.total)} of {tableData.total}
                        </span>
                        <button
                          onClick={() => fetchTableData(selectedTable, tableData.offset + tableData.limit)}
                          disabled={tableData.offset + tableData.limit >= tableData.total || isLoading}
                          className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {isLoading ? (
                    <div className="text-center py-8 text-gray-400">Loading...</div>
                  ) : tableData && tableData.rows.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="bg-gray-800">
                            {Object.keys(tableData.rows[0]).map((key) => (
                              <th key={key} className="px-3 py-2 text-left border border-gray-700 font-medium">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {tableData.rows.map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-gray-800/50">
                              {Object.values(row).map((value, colIndex) => (
                                <td key={colIndex} className="px-3 py-2 border border-gray-700 font-mono text-xs max-w-xs truncate">
                                  {formatValue(value)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">No data in this table</div>
                  )}
                </div>
              </div>
            )}

            {!selectedTable && (
              <div className="text-center py-12 text-gray-400">
                Select a table from the list to view its schema and data
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
