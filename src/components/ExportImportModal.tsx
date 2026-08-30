import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  FileJson, 
  Check, 
  AlertCircle,
  Copy,
  ExternalLink,
  Code
} from 'lucide-react';
import { exportDailyLogsCsv, exportAppDataJson, importAppDataJson } from '../services/dataService';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataImported: () => void;
  userId: string;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  onDataImported,
  userId,
}) => {
  const [importJsonText, setImportJsonText] = useState('');
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });
  const [copiedCsv, setCopiedCsv] = useState(false);

  if (!isOpen) return null;

  const handleDownloadCsv = async () => {
    const csvContent = await exportDailyLogsCsv(userId);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `pillars_wellness_scorecard_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadJson = async () => {
    const jsonContent = await exportAppDataJson(userId);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `pillars_scorecard_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyCsv = async () => {
    const csv = await exportDailyLogsCsv(userId);
    navigator.clipboard.writeText(csv);
    setCopiedCsv(true);
    setTimeout(() => setCopiedCsv(false), 2500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (text) {
        const result = await importAppDataJson(userId, text);
        if (result.success) {
          setImportStatus({ type: 'success', message: result.message });
          onDataImported();
        } else {
          setImportStatus({ type: 'error', message: result.message });
        }
      }
    };
    reader.readAsText(file);
  };

  const handleManualImport = async () => {
    if (!importJsonText.trim()) return;
    const result = await importAppDataJson(userId, importJsonText.trim());
    if (result.success) {
      setImportStatus({ type: 'success', message: result.message });
      setImportJsonText('');
      onDataImported();
    } else {
      setImportStatus({ type: 'error', message: result.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Data Export, Backup & Google Sheets Sync</h3>
              <p className="text-xs text-slate-400">Download spreadsheets, export backups, or import data</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-200">
          
          {/* Export Options */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Export Scorecard Data
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* CSV Export */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-sm">Google Sheets / CSV</h5>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Formatted spreadsheet with Body, Mind, Heart, Soul points, sub-scores, and notes.
                    </p>
                  </div>
                </div>

                <div className="flex space-x-2 pt-1">
                  <button
                    onClick={handleDownloadCsv}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV</span>
                  </button>
                  <button
                    onClick={handleCopyCsv}
                    className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                    title="Copy CSV string to clipboard"
                  >
                    {copiedCsv ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* JSON Backup */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                    <FileJson className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-sm">Complete JSON Backup</h5>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Includes all logs, group workouts, charity history, and settings.
                    </p>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    onClick={handleDownloadJson}
                    className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download JSON Backup</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Import / Restore */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2">
              <Upload className="w-4 h-4 text-slate-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Restore or Import Backup JSON
              </h4>
            </div>

            {importStatus.type && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                importStatus.type === 'success'
                  ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-700/50'
                  : 'bg-rose-950/80 text-rose-200 border border-rose-700/50'
              }`}>
                {importStatus.type === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{importStatus.message}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <label className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 text-center cursor-pointer flex items-center justify-center gap-1.5 transition-colors">
                <Upload className="w-3.5 h-3.5 text-slate-400" />
                <span>Upload .json file</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <textarea
                rows={2}
                placeholder="Or paste backup JSON payload here..."
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-slate-600"
              />
              {importJsonText && (
                <button
                  onClick={handleManualImport}
                  className="mt-2 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-lg transition-colors"
                >
                  Apply Merged Import
                </button>
              )}
            </div>
          </div>

          {/* Google Apps Script Schema Reference */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5" />
              Apps Script Web App Integration
            </span>
            <p className="text-xs text-slate-400 leading-relaxed">
              This app matches the 360° September Challenge scoring schema (Body 40, Mind 20, Heart 10, Soul 10, +5 Complete Day Bonus, +50 weekly Morning Workout Bonus). The exported CSV can be imported into Google Sheets directly.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
