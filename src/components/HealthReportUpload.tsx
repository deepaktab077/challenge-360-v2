import React, { useEffect, useRef, useState } from 'react';
import { Upload, ExternalLink, Trash2, Loader2, ImagePlus, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { HealthReport, HealthReportSource } from '../types';
import {
  uploadHealthReportToDrive,
  preloadGoogleIdentity,
  requestDriveAccess,
  hasDriveAccessToken,
} from '../lib/googleDrive';
import { isGoogleDriveConfigured } from '../lib/supabaseClient';

interface HealthReportUploadProps {
  date: string;
  reports: HealthReport[];
  onAdd: (report: Omit<HealthReport, 'id' | 'uploadedAt'>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  readOnly?: boolean;
}

const SOURCE_OPTIONS: { value: HealthReportSource; label: string }[] = [
  { value: 'apple_health', label: 'Apple Health' },
  { value: 'google_fit', label: 'Google Fit' },
  { value: 'fitbit', label: 'Fitbit' },
  { value: 'garmin', label: 'Garmin' },
  { value: 'other', label: 'Other App/Device' },
];

export const HealthReportUpload: React.FC<HealthReportUploadProps> = ({ date, reports, onAdd, onDelete, readOnly }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<HealthReportSource>('other');
  const [connected, setConnected] = useState(hasDriveAccessToken());
  const [connecting, setConnecting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todaysReports = reports.filter((r) => r.date === date);

  useEffect(() => {
    if (isGoogleDriveConfigured) {
      preloadGoogleIdentity().catch(() => {
        // surfaced only when the user actually tries to connect
      });
    }
  }, []);

  // MUST run synchronously inside the click handler (no await before the
  // Google call) or the browser blocks the consent popup.
  const handleConnect = () => {
    setError(null);
    setConnecting(true);
    requestDriveAccess()
      .then(() => {
        setConnected(true);
        setConnecting(false);
      })
      .catch((err) => {
        setError(err?.message || 'Could not connect to Google Drive.');
        setConnecting(false);
      });
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      const uploaded = await uploadHealthReportToDrive(file);
      await onAdd({
        date,
        source,
        driveFileId: uploaded.driveFileId,
        driveFileName: uploaded.driveFileName,
        driveViewLink: uploaded.driveViewLink,
        driveThumbnailLink: uploaded.driveThumbnailLink,
      });
    } catch (err: any) {
      setError(err?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
        <div className="flex items-center gap-2">
          <ImagePlus className="w-4 h-4 text-slate-400" />
          <h4 className="text-sm font-bold text-slate-200">Health Report Screenshots</h4>
        </div>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        Attach a screenshot from your wearable app (steps, sleep, heart rate). Files are saved directly to{' '}
        <strong>your own Google Drive</strong> — never our servers — inside a "Challenge 360 - Health Reports" folder.
      </p>

      {readOnly ? (
        <p className="text-xs text-slate-500 italic mb-2">Read-only view — uploads are only available on your own scorecard.</p>
      ) : !isGoogleDriveConfigured ? (
        <div className="flex items-start gap-2 text-xs bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>Google Drive upload isn't configured yet. Ask your admin to set VITE_GOOGLE_CLIENT_ID.</span>
        </div>
      ) : !connected ? (
        <button
          type="button"
          disabled={connecting}
          onClick={handleConnect}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-slate-200 text-xs font-bold transition-colors border border-slate-700"
        >
          {connecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LinkIcon className="w-3.5 h-3.5" />}
          {connecting ? 'Connecting…' : 'Connect Google Drive'}
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as HealthReportSource)}
            className="px-2.5 py-2 rounded-lg border border-slate-700 text-xs font-semibold text-slate-300 bg-slate-800 focus:outline-none focus:border-indigo-500"
          >
            {SOURCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold transition-colors"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {uploading ? 'Uploading to Drive…' : 'Upload Screenshot'}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelected} />
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg p-2.5 mt-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {todaysReports.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
          {todaysReports.map((r) => (
            <div key={r.id} className="relative group rounded-xl border border-slate-800 overflow-hidden bg-slate-800/40">
              <a href={r.driveViewLink} target="_blank" rel="noopener noreferrer" className="block">
                {r.driveThumbnailLink ? (
                  <img src={r.driveThumbnailLink} alt={r.driveFileName} className="w-full h-24 object-cover" />
                ) : (
                  <div className="w-full h-24 flex items-center justify-center text-slate-700">
                    <ImagePlus className="w-6 h-6" />
                  </div>
                )}
              </a>
              <div className="p-2">
                <p className="text-[11px] font-semibold text-slate-400 truncate">{r.driveFileName}</p>
                <div className="flex items-center justify-between mt-1">
                  <a
                    href={r.driveViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-indigo-400 hover:underline flex items-center gap-0.5"
                  >
                    <ExternalLink className="w-3 h-3" /> View
                  </a>
                  {!readOnly && (
                    <button
                      onClick={() => onDelete(r.id)}
                      className="text-[10px] text-rose-400 hover:underline flex items-center gap-0.5"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
