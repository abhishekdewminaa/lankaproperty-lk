import React, { useState, useEffect, useRef } from 'react';
import { superAdminSecurityService } from '../services/superAdminSecurityService';

interface SuperAdminSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isDirectRoute?: boolean; // When true, renders as full page gate rather than overlay
}

export function SuperAdminSecurityModal({
  isOpen,
  onClose,
  onSuccess,
  isDirectRoute = false,
}: SuperAdminSecurityModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync lockout state & run countdown timer if active
  useEffect(() => {
    const checkLock = () => {
      const rem = superAdminSecurityService.getLockoutRemainingSeconds();
      setLockoutRemaining(rem);
    };

    checkLock();
    const interval = setInterval(checkLock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto focus input on open
  useEffect(() => {
    if (isOpen && lockoutRemaining === 0) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, lockoutRemaining]);

  // Handle Escape key to stealthily exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleDismiss = () => {
    setPassword('');
    setErrorMessage('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMessage('Please enter the master administrative key.');
      return;
    }

    setErrorMessage('');
    setIsVerifying(true);

    // Timing-safe delay (350ms) + constant-time SHA-256 digest verification
    setTimeout(() => {
      const result = superAdminSecurityService.verifyPassword(password.trim());
      setIsVerifying(false);

      if (result.success) {
        setPassword('');
        setErrorMessage('');
        onSuccess();
      } else {
        if (result.locked) {
          setLockoutRemaining(result.remainingSeconds || 300);
        }
        setErrorMessage(result.error || 'Authentication failed.');
      }
    }, 350);
  };

  if (!isOpen) return null;

  const failedAttempts = superAdminSecurityService.getFailedAttempts();
  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 ${
        isDirectRoute
          ? 'bg-[#103D2C]'
          : 'bg-[#18251E]/85 backdrop-blur-sm'
      }`}
    >
      <div className="bg-white border-2 border-[#103D2C] rounded-[4px] shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in duration-200">
        {/* Terminal Header */}
        <div className="bg-[#103D2C] text-white p-5 border-b border-[#176B45]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#FAFBF9]/70">
              LankaProperty Cryptographic Vault
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[2px] bg-[#176B45] text-white">
              SHA-256 Protected
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1.5 tracking-tight">
            Super Admin Gatekeeper
          </h2>
          <p className="text-xs text-[#FAFBF9]/80 mt-1 leading-relaxed">
            Zero-plaintext cryptographic verification required. All access attempts are logged with HMAC session integrity signatures.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-[#FAFBF9]">
          {/* Lockout Warning Box */}
          {lockoutRemaining > 0 ? (
            <div className="bg-red-50 border border-[#C93636] p-4 rounded-[3px] space-y-1.5 text-xs text-[#C93636]">
              <div className="font-bold uppercase tracking-wider flex items-center justify-between">
                <span>Security Lockout Active</span>
                <span className="font-extrabold tabular-nums text-sm">
                  {formatTimer(lockoutRemaining)}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#18251E]">
                Multiple unsuccessful authentication attempts detected. This terminal has been temporarily locked to defend against automated intrusion. Please wait until the cooldown timer expires.
              </p>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="bg-red-50 border border-[#C93636]/60 p-3 rounded-[3px] text-xs text-[#C93636] font-semibold">
                  {errorMessage}
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="master-key-input" className="font-bold text-[#18251E] uppercase tracking-wider text-[11px]">
                    Master Authorization Key
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-[#176B45] font-semibold hover:underline cursor-pointer"
                  >
                    {showPassword ? 'Hide Key' : 'Show Key'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    ref={inputRef}
                    id="master-key-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter statutory master key..."
                    disabled={isVerifying || lockoutRemaining > 0}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#DDE5DF] focus:border-[#176B45] focus:outline-none rounded-[3px] text-sm text-[#18251E] font-medium tracking-wide transition-colors"
                    autoComplete="off"
                    spellCheck="false"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#5F6B63] pt-1">
                  <span>Brute-Force Guard & Cryptographic Vault: Active</span>
                  <span className="tabular-nums font-semibold">
                    {failedAttempts > 0
                      ? `Attempt: ${failedAttempts} of 5`
                      : '5 Attempts Allowed'}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              type="submit"
              disabled={isVerifying || lockoutRemaining > 0}
              className={`w-full py-2.5 text-xs font-bold uppercase tracking-wider text-white rounded-[3px] transition-colors shadow-xs ${
                isVerifying || lockoutRemaining > 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#103D2C] hover:bg-[#176B45] active:bg-[#0B2B1F] cursor-pointer'
              }`}
            >
              {isVerifying
                ? 'Computing Salted SHA-256 Digest...'
                : 'Authenticate & Enter Super Admin →'}
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="w-full py-2 text-xs font-semibold text-[#5F6B63] hover:text-[#18251E] hover:bg-[#F5F8F5] border border-[#DDE5DF] rounded-[3px] transition-colors cursor-pointer"
            >
              Exit to Public Site (Esc)
            </button>
          </div>
        </form>

        {/* Security Footnote */}
        <div className="bg-white border-t border-[#DDE5DF] px-5 py-3 text-[10px] text-[#5F6B63] flex items-center justify-between">
          <span>HMAC-Signed Session · 30-Min Idle Lock</span>
          <span className="font-semibold text-[#176B45]">Zero-Plaintext Mode</span>
        </div>
      </div>
    </div>
  );
}
