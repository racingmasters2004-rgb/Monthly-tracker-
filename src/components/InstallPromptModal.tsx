import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  Share2,
  PlusSquare,
  Copy,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  WifiOff
} from 'lucide-react';

interface InstallPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallPromptModal: React.FC<InstallPromptModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  // App URL for sharing / phone access
  const appUrl = typeof window !== 'undefined'
    ? window.location.origin
    : 'https://ais-pre-omaomlwwaermapbt6zfiwk-732210918014.asia-east1.run.app';

  useEffect(() => {
    // Listen for Chrome / Android beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Check if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        onClose();
      }
      setDeferredPrompt(null);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-xs animate-[fadeIn_0.15s_ease-out]">
      <div className="bg-[#FBFAF7] border-2 border-[#10202B] rounded-[20px] max-w-[480px] w-full p-4 sm:p-5 shadow-2xl max-h-[92vh] overflow-y-auto animate-[fadeUp_0.2s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#DCD6C7] mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1F3A52] flex items-center justify-center text-[#FBFAF7]">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-disp font-bold text-[16px] text-[#10202B]">
                Download App to Your Phone
              </h3>
              <span className="text-[10px] font-mono-code text-[#2A7F73] font-semibold block">
                No App Store / Play Store Needed
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#5B6670] hover:text-[#10202B]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Quick Explanation */}
          <p className="text-[12.5px] text-[#5B6670] leading-relaxed">
            This app is built with <b>Progressive Web App (PWA)</b> technology. You can install it directly onto your phone&apos;s home screen. It runs <b>full-screen</b> like a native app, works <b>100% offline</b>, and saves all your data on your device.
          </p>

          {/* Android 1-Click Install Button if supported */}
          {deferredPrompt && (
            <div className="bg-[#EBF7EE] border border-[#4C8557] rounded-[12px] p-3 text-center">
              <span className="text-[12px] text-[#4C8557] font-semibold block mb-2">
                1-Tap Quick Install Available for your browser!
              </span>
              <button
                type="button"
                onClick={handleNativeInstall}
                className="w-full py-2.5 rounded-lg bg-[#10202B] text-white font-mono-code text-[12px] font-bold shadow-md hover:bg-[#1F3A52] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-[#D9A017]" />
                <span>Install App on Phone</span>
              </button>
            </div>
          )}

          {/* Step 1: Open link on your phone */}
          <div className="bg-[#F1EEE6] p-3 rounded-[12px] border border-[#DCD6C7] space-y-2">
            <span className="font-mono-code text-[10.5px] uppercase font-bold text-[#10202B] flex items-center gap-1.5">
              <span>Step 1: Open on Your Phone</span>
            </span>
            <p className="text-[11.5px] text-[#5B6670]">
              Open this link on your phone in <b>Safari (iPhone)</b> or <b>Chrome (Android)</b>:
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={appUrl}
                className="flex-1 text-[11px] font-mono-code px-2.5 py-1.5 bg-white border border-[#10202B] rounded-md text-[#10202B] truncate"
              />
              <button
                type="button"
                onClick={copyUrl}
                className="px-3 py-1.5 rounded-md bg-[#10202B] text-white font-mono-code text-[11px] font-bold flex items-center gap-1 shrink-0 active:scale-95 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#D9A017]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Step 2: Add to Home Screen Instructions */}
          <div className="space-y-2.5">
            <span className="font-mono-code text-[10.5px] uppercase font-bold text-[#10202B] block">
              Step 2: Add to Home Screen
            </span>

            {/* iPhone / iOS Card */}
            <div className="p-3 rounded-[12px] border border-[#DCD6C7] bg-white space-y-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#1F3A52] text-white flex items-center justify-center font-bold text-[10px]">
                  iOS
                </span>
                <span className="font-semibold text-[13px] text-[#10202B]">
                  On iPhone (Safari)
                </span>
              </div>
              <ol className="text-[12px] text-[#5B6670] space-y-1.5 pl-4 list-decimal leading-relaxed">
                <li>
                  Open the app link in <b>Safari</b>.
                </li>
                <li>
                  Tap the <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#F1EEE6] text-[#10202B] font-semibold"><Share2 className="w-3 h-3 mr-1 text-[#2A7F73]" /> Share button</span> (bottom center bar).
                </li>
                <li>
                  Scroll down the menu and tap <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#F1EEE6] text-[#10202B] font-semibold"><PlusSquare className="w-3 h-3 mr-1 text-[#10202B]" /> Add to Home Screen</span>.
                </li>
                <li>
                  Tap <b>&ldquo;Add&rdquo;</b> at the top right corner. Done!
                </li>
              </ol>
            </div>

            {/* Android / Chrome Card */}
            <div className="p-3 rounded-[12px] border border-[#DCD6C7] bg-white space-y-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#2A7F73] text-white flex items-center justify-center font-bold text-[10px]">
                  And
                </span>
                <span className="font-semibold text-[13px] text-[#10202B]">
                  On Android (Chrome / Brave / Edge)
                </span>
              </div>
              <ol className="text-[12px] text-[#5B6670] space-y-1.5 pl-4 list-decimal leading-relaxed">
                <li>
                  Open the app link in <b>Chrome</b>.
                </li>
                <li>
                  Tap the <b>three vertical dots menu (⋮)</b> in the top right corner.
                </li>
                <li>
                  Tap <b>&ldquo;Install App&rdquo;</b> or <b>&ldquo;Add to Home screen&rdquo;</b>.
                </li>
                <li>
                  Confirm by tapping <b>&ldquo;Install&rdquo;</b>.
                </li>
              </ol>
            </div>
          </div>

          {/* Benefits Checkpoints */}
          <div className="grid grid-cols-2 gap-2 text-[10.5px] font-mono-code pt-1">
            <div className="flex items-center gap-1.5 text-[#2A7F73] bg-[#F1EEE6] p-2 rounded-lg">
              <WifiOff className="w-3.5 h-3.5 shrink-0" />
              <span>Works 100% Offline</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#1F3A52] bg-[#F1EEE6] p-2 rounded-lg">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Private &amp; On-Device</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 mt-3 border-t border-[#DCD6C7]">
          <button
            type="button"
            onClick={onClose}
            className="font-mono-code text-[11px] font-bold px-4 py-2 rounded bg-[#10202B] text-white hover:bg-[#1F3A52] active:scale-95 transition-all"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
