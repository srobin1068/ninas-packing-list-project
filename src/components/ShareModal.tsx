import React, { useState, useEffect } from 'react';
import { Radio, Share2, Copy, Check, Users, Link2, LogOut, Sparkles } from 'lucide-react';
import { syncService } from '../services/syncService';
import type { PackingItem, SavedTrip } from '../types/packing';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentItems: PackingItem[];
  currentTitle: string;
  savedTrips: SavedTrip[];
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  currentItems,
  currentTitle,
  savedTrips,
}) => {
  const [activeCode, setActiveCode] = useState<string | null>(syncService.getRoomCode());
  const [, setIsConnected] = useState<boolean>(syncService.getIsConnected());
  const [peerCount, setPeerCount] = useState<number>(syncService.getPeerCount());

  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const unsubscribe = syncService.onStateChange((connected, count, roomCode) => {
      setIsConnected(connected);
      setPeerCount(count);
      setActiveCode(roomCode);
    });
    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  const handleStartHosting = async () => {
    setIsConnecting(true);
    setErrorMsg('');
    try {
      const newCode = syncService.generateRoomCode();
      await syncService.connectToRoom(newCode, currentItems, currentTitle, savedTrips);
      setActiveCode(newCode);
    } catch (e: any) {
      setErrorMsg('Failed to start live sync room. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    setIsConnecting(true);
    setErrorMsg('');
    try {
      const codeToJoin = inputCode.trim().toUpperCase();
      await syncService.connectToRoom(codeToJoin, currentItems, currentTitle, savedTrips);
      setActiveCode(codeToJoin);
      setInputCode('');
    } catch (e: any) {
      setErrorMsg('Could not connect to shared trip code. Check the code and try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    syncService.disconnect();
    setActiveCode(null);
  };

  const shareUrl = activeCode
    ? `${window.location.origin}${window.location.pathname}?sync=${activeCode}`
    : '';

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Share & Live Sync</h3>
              <p className="text-xs text-slate-500">Co-edit trip list with family in real-time</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium">
            {errorMsg}
          </div>
        )}

        <div className="py-5 space-y-6">
          {/* Active Live Room Status */}
          {activeCode ? (
            <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
                  Live Sync Active
                </span>
                <span className="text-xs text-teal-100 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {peerCount > 0 ? `${peerCount} co-editor connected` : 'Waiting for peers'}
                </span>
              </div>

              <div>
                <p className="text-xs text-teal-100 font-medium">Share Code:</p>
                <p className="text-3xl font-black tracking-wider text-white font-mono mt-0.5">
                  {activeCode}
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 bg-white text-teal-800 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs hover:bg-teal-50 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      Link Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Share Link
                    </>
                  )}
                </button>

                <button
                  onClick={handleDisconnect}
                  title="Disconnect Live Room"
                  className="bg-white/20 hover:bg-white/30 text-white font-bold p-2.5 rounded-xl text-xs flex items-center justify-center transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 mx-auto flex items-center justify-center">
                <Share2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Start a Live Packing Session</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Create a share code to let anyone view and edit this packing list live from their screen.
                </p>
              </div>
              <button
                onClick={handleStartHosting}
                disabled={isConnecting}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all hover:shadow-md disabled:opacity-50"
              >
                {isConnecting ? (
                  'Starting Sync...'
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Create Share Code & Link
                  </>
                )}
              </button>
            </div>
          )}

          {/* Join an Existing Room Code */}
          <div className="border-t border-slate-100 pt-4">
            <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-teal-600" />
              Join Someone Else's Packing List
            </h4>
            <form onSubmit={handleJoinRoom} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter 6-digit code (e.g. PACK-7X9K)"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-mono tracking-wider text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500 uppercase"
              />
              <button
                type="submit"
                disabled={isConnecting || !inputCode.trim()}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2.5 rounded-2xl text-xs transition-colors disabled:opacity-40"
              >
                Join
              </button>
            </form>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            💡 Any changes made on either device update instantly on both screens.
          </p>
        </div>
      </div>
    </div>
  );
};
