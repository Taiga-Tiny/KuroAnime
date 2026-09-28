import React, { useState, useRef } from 'react';
import { Download, Upload, FileText, CheckCircle2, AlertCircle, X, Database } from 'lucide-react';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  watchlistCount: number;
  onExport: () => void;
  onImport: (data: unknown) => { success: boolean; added: number; updated: number; message: string };
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  watchlistCount,
  onExport,
  onImport,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [jsonText, setJsonText] = useState('');
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        const result = onImport(parsed);

        if (result.success) {
          setImportStatus({
            type: 'success',
            message: result.message,
          });
          onShowToast(result.message, 'success');
        } else {
          setImportStatus({
            type: 'error',
            message: result.message,
          });
          onShowToast(result.message, 'error');
        }
      } catch (err) {
        setImportStatus({
          type: 'error',
          message: 'Failed to parse JSON file. Please ensure it is valid JSON.',
        });
        onShowToast('Invalid JSON file format.', 'error');
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleTextImport = () => {
    if (!jsonText.trim()) {
      setImportStatus({
        type: 'error',
        message: 'Please paste JSON data to import.',
      });
      return;
    }

    try {
      const parsed = JSON.parse(jsonText);
      const result = onImport(parsed);
      if (result.success) {
        setImportStatus({
          type: 'success',
          message: result.message,
        });
        setJsonText('');
        onShowToast(result.message, 'success');
      } else {
        setImportStatus({
          type: 'error',
          message: result.message,
        });
        onShowToast(result.message, 'error');
      }
    } catch {
      setImportStatus({
        type: 'error',
        message: 'Invalid JSON text format. Please check the syntax.',
      });
      onShowToast('Invalid JSON syntax.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
              Watchlist Backup & Sync
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 p-2 gap-2 bg-zinc-100/50 dark:bg-zinc-900/50">
          <button
            onClick={() => {
              setActiveTab('export');
              setImportStatus(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'export'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Download className="w-4 h-4 text-indigo-500" />
            <span>Export Backup</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('import');
              setImportStatus(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'import'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Upload className="w-4 h-4 text-indigo-500" />
            <span>Import Watchlist</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5">
          {activeTab === 'export' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Export your current watchlist of{' '}
                <strong className="text-zinc-900 dark:text-zinc-100 font-mono">
                  {watchlistCount}
                </strong>{' '}
                anime items into a standalone JSON file. You can keep this as a safe backup or import it onto another browser/device.
              </div>

              <button
                type="button"
                onClick={() => {
                  onExport();
                  onShowToast('Watchlist exported to JSON file.', 'success');
                }}
                disabled={watchlistCount === 0}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-xs disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Watchlist JSON</span>
              </button>

              {watchlistCount === 0 && (
                <p className="text-xs text-center text-zinc-400 italic">
                  Your watchlist is currently empty. Add some anime to export.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Upload Trigger */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-xl p-5 text-center flex flex-col items-center justify-center gap-2 group transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    Click to browse and upload JSON file
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Accepts exported KuroAnime JSON files (merges duplicates seamlessly)
                  </span>
                </button>
              </div>

              {/* Or paste JSON text */}
              <div>
                <div className="flex items-center gap-2 my-2">
                  <div className="flex-1 h-px bg-zinc-200 dark:border-zinc-800" />
                  <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">
                    Or paste JSON text
                  </span>
                  <div className="flex-1 h-px bg-zinc-200 dark:border-zinc-800" />
                </div>

                <textarea
                  rows={4}
                  value={jsonText}
                  onChange={e => setJsonText(e.target.value)}
                  placeholder="[{ id: '...', title: '...', status: 'Watching', ... }]"
                  className="w-full p-2.5 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />

                <button
                  type="button"
                  onClick={handleTextImport}
                  className="mt-2 w-full py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium text-xs transition-colors"
                >
                  Import From Text
                </button>
              </div>

              {/* Status Message */}
              {importStatus && (
                <div
                  className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                    importStatus.type === 'success'
                      ? 'border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300'
                      : 'border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  {importStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  )}
                  <span>{importStatus.message}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
