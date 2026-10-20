import React, { useState } from 'react';
import { UserProfile, Domain } from '../types';
import { getZonedDateString } from '../utils/date';
import {
  X,
  User,
  Clock,
  Coins,
  Volume2,
  Vibrate,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Smartphone,
  Check
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onLoadSampleData: () => void;
  onClearAllData: () => void;
  onExportJson: () => void;
  onImportJson: (jsonString: string) => void;
}

const COMMON_TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST +5:30) - Default' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST +4:00)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT +8:00)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
  { value: 'America/New_York', label: 'America/New_York (EST/EDT)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT)' },
  { value: 'UTC', label: 'UTC (Universal Coordinated Time)' },
];

const CURRENCIES = [
  { code: 'INR', symbol: '₹', label: '₹ INR (Indian Rupee)' },
  { code: 'USD', symbol: '$', label: '$ USD (US Dollar)' },
  { code: 'EUR', symbol: '€', label: '€ EUR (Euro)' },
  { code: 'GBP', symbol: '£', label: '£ GBP (British Pound)' },
  { code: 'AED', symbol: 'AED', label: 'AED (UAE Dirham)' },
  { code: 'CAD', symbol: 'C$', label: 'C$ CAD (Canadian Dollar)' },
  { code: 'AUD', symbol: 'A$', label: 'A$ AUD (Australian Dollar)' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  onLoadSampleData,
  onClearAllData,
  onExportJson,
  onImportJson,
}) => {
  const [displayName, setDisplayName] = useState<string>(profile.display_name);
  const [timezone, setTimezone] = useState<string>(profile.timezone || 'Asia/Kolkata');
  const [currency, setCurrency] = useState<string>(profile.currency || 'INR');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(profile.sound_enabled ?? true);
  const [hapticEnabled, setHapticEnabled] = useState<boolean>(profile.haptic_enabled ?? true);
  const [importStatus, setImportStatus] = useState<string>('');

  if (!isOpen) return null;

  const handleSave = () => {
    const currObj = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];
    onUpdateProfile({
      ...profile,
      display_name: displayName.trim() || 'User',
      timezone,
      currency: currObj.code,
      currency_symbol: currObj.symbol,
      sound_enabled: soundEnabled,
      haptic_enabled: hapticEnabled,
    });
    onClose();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const text = ev.target?.result as string;
        onImportJson(text);
        setImportStatus('Backup restored successfully!');
        setTimeout(() => {
          setImportStatus('');
          onClose();
        }, 1200);
      } catch (err) {
        alert('Failed to import backup: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
  };

  // Preview current time in selected timezone
  let timezoneTimePreview = '';
  try {
    timezoneTimePreview = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZoneName: 'short',
    }).format(new Date());
  } catch {
    timezoneTimePreview = 'Invalid timezone';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-[fadeIn_0.15s_ease-out]">
      <div className="bg-[#FBFAF7] border-2 border-[#10202B] rounded-[18px] max-w-[460px] w-full p-4 sm:p-5 shadow-2xl max-h-[92vh] overflow-y-auto animate-[fadeUp_0.2s_ease-out]">
        <div className="flex items-center justify-between pb-2 border-b border-[#DCD6C7] mb-3">
          <h3 className="font-disp font-bold text-[17px] text-[#10202B] flex items-center gap-2">
            <User className="w-4 h-4 text-[#2A7F73]" />
            <span>Settings &amp; Preferences</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#5B6670] hover:text-[#10202B]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Display Name */}
          <div>
            <label className="text-[10.5px] font-mono-code text-[#5B6670] uppercase font-bold block mb-1">
              Account / Business Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your Name or Business"
              className="w-full text-[13px] px-3 py-1.5 bg-white border border-[#10202B] rounded-lg focus:outline-none"
            />
          </div>

          {/* Authoritative Timezone */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10.5px] font-mono-code text-[#5B6670] uppercase font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#2A7F73]" />
                <span>Timezone (Calculates Server Midnight)</span>
              </label>
              <span className="font-mono-code text-[10px] text-[#2A7F73] font-semibold">
                {timezoneTimePreview}
              </span>
            </div>
            <select
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              className="w-full text-[12px] px-2.5 py-1.5 bg-white border border-[#10202B] rounded-lg font-mono-code"
            >
              {COMMON_TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          {/* Currency */}
          <div>
            <label className="text-[10.5px] font-mono-code text-[#5B6670] uppercase font-bold block mb-1">
              Currency
            </label>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="w-full text-[12px] px-2.5 py-1.5 bg-white border border-[#10202B] rounded-lg font-mono-code"
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sound & Haptic Feedback Toggles */}
          <div className="bg-[#F1EEE6] p-3 rounded-[12px] border border-[#DCD6C7] space-y-2.5">
            <span className="font-mono-code text-[10px] uppercase font-bold text-[#5B6670] block">
              Phone Sensory Feedback
            </span>
            <div className="flex items-center justify-between text-[12.5px]">
              <span className="flex items-center gap-2 text-[#10202B]">
                <Volume2 className="w-4 h-4 text-[#2A7F73]" />
                <span>Celebration Audio Chimes</span>
              </span>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={e => setSoundEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-[#10202B]"
              />
            </div>
            <div className="flex items-center justify-between text-[12.5px]">
              <span className="flex items-center gap-2 text-[#10202B]">
                <Vibrate className="w-4 h-4 text-[#2A7F73]" />
                <span>Haptic Touch Vibration</span>
              </span>
              <input
                type="checkbox"
                checked={hapticEnabled}
                onChange={e => setHapticEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-[#10202B]"
              />
            </div>
          </div>

          {/* Mobile Home Screen Install Guide */}
          <div className="bg-[#FBFAF7] p-3 rounded-[12px] border border-[#2A7F73]/40 text-[12px] text-[#10202B] space-y-1.5">
            <div className="font-mono-code text-[10px] uppercase font-bold text-[#2A7F73] flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Use as an App on your Phone</span>
            </div>
            <p className="text-[11.5px] text-[#5B6670] leading-relaxed">
              Open this app link in <b>Safari (iOS)</b> or <b>Chrome (Android)</b> on your phone, then tap <b>Share &rarr; Add to Home Screen</b>. It opens full screen with zero browser bars and works completely offline!
            </p>
          </div>

          {/* Backup & Sample Data Controls */}
          <div className="pt-2 border-t border-[#DCD6C7] space-y-2">
            <span className="font-mono-code text-[10px] uppercase font-bold text-[#5B6670] block">
              Data &amp; Backup
            </span>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-code">
              <button
                type="button"
                onClick={onExportJson}
                className="p-2 rounded border border-[#10202B] bg-white hover:bg-[#F1EEE6] text-[#10202B] flex items-center justify-center gap-1"
              >
                <Download className="w-3.5 h-3.5 text-[#2A7F73]" />
                <span>Backup JSON</span>
              </button>

              <label className="p-2 rounded border border-[#10202B] bg-white hover:bg-[#F1EEE6] text-[#10202B] flex items-center justify-center gap-1 cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-[#1F3A52]" />
                <span>Restore JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>
            </div>

            {importStatus && (
              <div className="text-[11px] text-[#2A7F73] font-bold text-center">
                {importStatus}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Load sample demonstration data? Your existing state will be replaced with rich sample data.')) {
                    onLoadSampleData();
                    onClose();
                  }
                }}
                className="flex-1 text-[11px] font-mono-code p-1.5 rounded border border-[#DCD6C7] hover:bg-[#F1EEE6] text-[#5B6670]"
              >
                Load Sample Data
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to clear all data and start with a blank slate?')) {
                    onClearAllData();
                    onClose();
                  }
                }}
                className="text-[11px] font-mono-code p-1.5 rounded border border-[#C4331E]/40 text-[#C4331E] hover:bg-[#FDECEA]"
              >
                Clear Data
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-[#DCD6C7]">
          <button
            type="button"
            onClick={onClose}
            className="font-mono-code text-[11px] px-3.5 py-1.5 rounded border border-[#DCD6C7] bg-[#F1EEE6] text-[#5B6670] hover:bg-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="font-mono-code text-[11px] font-bold px-4 py-1.5 rounded bg-[#10202B] text-white hover:bg-[#1F3A52] active:scale-95 transition-all"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
