/**
 * Celebrations:
 * - Small confetti on subtask completion
 * - Big confetti burst + "TASK COMPLETE" seal on task completion
 */

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface CelebrationLayerProps {
  sealVisible: boolean;
}

export const CelebrationLayer: React.FC<CelebrationLayerProps> = ({ sealVisible }) => {
  return (
    <div id="celebrationLayer" className="fixed inset-0 pointer-events-none z-[1000] overflow-hidden">
      {sealVisible && (
        <div className="seal-stamp">
          <div className="flex flex-col items-center justify-center">
            <span className="text-[11px] tracking-widest text-[#D9A017] uppercase font-mono-code mb-1">
              Accomplished
            </span>
            <span className="text-[17px] font-bold tracking-wide">
              TASK COMPLETE
            </span>
            <span className="text-[10px] text-[#A0AEC0] mt-1">
              ✦ KEEP MOMENTUM ✦
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Trigger small confetti for subtask
 */
export function fireSmallConfetti(): void {
  try {
    confetti({
      particleCount: 14,
      spread: 45,
      startVelocity: 25,
      origin: { y: 0.65 },
      colors: ['#D9531E', '#D9A017', '#4C8557', '#2A6FA3', '#7A4F82'],
      disableForReducedMotion: true,
    });
  } catch {
    // Ignore
  }
}

/**
 * Trigger large celebratory confetti for full task completion
 */
export function fireBigConfetti(): void {
  try {
    // Two quick bursts from left & right
    confetti({
      particleCount: 45,
      angle: 60,
      spread: 60,
      origin: { x: 0.2, y: 0.6 },
      colors: ['#D9531E', '#D9A017', '#4C8557', '#2A6FA3', '#7A4F82', '#B8860B'],
      disableForReducedMotion: true,
    });

    confetti({
      particleCount: 45,
      angle: 120,
      spread: 60,
      origin: { x: 0.8, y: 0.6 },
      colors: ['#D9531E', '#D9A017', '#4C8557', '#2A6FA3', '#7A4F82', '#B8860B'],
      disableForReducedMotion: true,
    });
  } catch {
    // Ignore
  }
}
