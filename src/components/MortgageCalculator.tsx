import React, { useState, useMemo } from 'react';
import { useCurrency } from '../context/CurrencyContext';

interface MortgageCalculatorProps {
  priceLkr: number;
  propertyTitle?: string;
  propertyLocation?: string;
}

interface BankRate {
  id: string;
  bankName: string;
  rate: number;
  type: string;
  maxTenureYears: number;
  features: string;
}

const SRI_LANKA_BANKS: BankRate[] = [
  {
    id: 'boc',
    bankName: 'Bank of Ceylon (BOC)',
    rate: 11.75,
    type: 'Floating Rate',
    maxTenureYears: 25,
    features: 'Standard state housing loan rate, flexible early repayment',
  },
  {
    id: 'combank',
    bankName: 'Commercial Bank of Ceylon',
    rate: 12.0,
    type: 'Fixed 3-Year',
    maxTenureYears: 25,
    features: 'Fast pre-approval turnaround and overseas buyer support',
  },
  {
    id: 'sampath',
    bankName: 'Sampath Bank',
    rate: 12.25,
    type: 'Floating Rate',
    maxTenureYears: 20,
    features: 'Up to 75% loan-to-value financing',
  },
  {
    id: 'hnb',
    bankName: 'Hatton National Bank (HNB)',
    rate: 12.5,
    type: 'Fixed 5-Year',
    maxTenureYears: 25,
    features: 'LKR and foreign currency housing loan options',
  },
  {
    id: 'ntb',
    bankName: 'Nations Trust Bank (NTB)',
    rate: 13.0,
    type: 'Housing Loan',
    maxTenureYears: 20,
    features: 'Flexible repayment schedules',
  },
];

export const MortgageCalculator: React.FC<MortgageCalculatorProps> = ({
  priceLkr,
  propertyTitle = 'Selected Property',
  propertyLocation = 'Sri Lanka',
}) => {
  const { formatPrice } = useCurrency();

  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(30);
  const [tenureYears, setTenureYears] = useState<number>(15);
  const [selectedBankId, setSelectedBankId] = useState<string>('combank');
  const [customRate, setCustomRate] = useState<number>(12.0);
  const [isCustomRate, setIsCustomRate] = useState<boolean>(false);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [leadName, setLeadName] = useState<string>('');
  const [leadPhone, setLeadPhone] = useState<string>('');
  const [leadEmail, setLeadEmail] = useState<string>('');
  const [monthlyIncome, setMonthlyIncome] = useState<string>('');
  const [leadSubmitted, setLeadSubmitted] = useState<boolean>(false);

  const handleSelectBank = (bank: BankRate) => {
    setSelectedBankId(bank.id);
    setCustomRate(bank.rate);
    setIsCustomRate(false);
  };

  const handleCustomRateChange = (rate: number) => {
    setCustomRate(rate);
    setIsCustomRate(true);
    setSelectedBankId('custom');
  };

  const mortgageStats = useMemo(() => {
    if (priceLkr <= 0) {
      return {
        downPaymentLkr: 0,
        loanAmountLkr: 0,
        monthlyInstallmentLkr: 0,
        totalInterestLkr: 0,
        totalRepaymentLkr: 0,
        annualRate: customRate,
      };
    }

    const downPaymentLkr = (priceLkr * downPaymentPercent) / 100;
    const loanAmountLkr = Math.max(0, priceLkr - downPaymentLkr);

    const monthlyRate = customRate / 100 / 12;
    const totalMonths = tenureYears * 12;

    let monthlyInstallmentLkr = 0;
    if (monthlyRate > 0 && totalMonths > 0 && loanAmountLkr > 0) {
      monthlyInstallmentLkr =
        (loanAmountLkr * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1);
    }

    const totalRepaymentLkr = monthlyInstallmentLkr * totalMonths;
    const totalInterestLkr = Math.max(0, totalRepaymentLkr - loanAmountLkr);

    return {
      downPaymentLkr,
      loanAmountLkr,
      monthlyInstallmentLkr,
      totalInterestLkr,
      totalRepaymentLkr,
      annualRate: customRate,
    };
  }, [priceLkr, downPaymentPercent, tenureYears, customRate]);

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !leadPhone) return;

    setLeadSubmitted(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setLeadSubmitted(false);
      setLeadName('');
      setLeadPhone('');
      setLeadEmail('');
      setMonthlyIncome('');
    }, 2800);
  };

  if (priceLkr <= 0) return null;

  return (
    <div className="bg-[#FAFBF9] border border-[#DDE5DF] rounded-[4px] p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DDE5DF] pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#176B45]">
            Home Loan Estimator
          </span>
          <h3 className="text-lg font-bold text-[#103D2C] mt-0.5">
            Monthly Mortgage Calculator
          </h3>
        </div>
        <div className="text-xs text-[#5F6B63]">
          Compare Sri Lankan bank interest rates & tenures
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          {/* Down Payment */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#18251E]">Down Payment</span>
              <div className="flex items-center gap-2">
                <span className="text-[#176B45] font-bold">{downPaymentPercent}%</span>
                <span className="text-[#5F6B63]">
                  ({formatPrice(mortgageStats.downPaymentLkr)})
                </span>
              </div>
            </div>
            <input
              type="range"
              min="15"
              max="50"
              step="5"
              value={downPaymentPercent}
              onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
              className="w-full accent-[#103D2C] cursor-pointer h-1.5 bg-[#DDE5DF]"
            />
            <div className="flex gap-2 pt-1">
              {[20, 25, 30, 40, 50].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setDownPaymentPercent(pct)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-[3px] border transition-colors cursor-pointer ${
                    downPaymentPercent === pct
                      ? 'bg-[#103D2C] text-white border-[#103D2C]'
                      : 'bg-white text-[#18251E] border-[#DDE5DF] hover:border-[#103D2C]'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Loan Tenure */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#18251E]">Loan Tenure</span>
              <span className="text-[#176B45] font-bold">
                {tenureYears} Years ({tenureYears * 12} Months)
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="25"
              step="1"
              value={tenureYears}
              onChange={(e) => setTenureYears(Number(e.target.value))}
              className="w-full accent-[#103D2C] cursor-pointer h-1.5 bg-[#DDE5DF]"
            />
            <div className="flex gap-2 pt-1">
              {[5, 10, 15, 20, 25].map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => setTenureYears(yr)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-[3px] border transition-colors cursor-pointer ${
                    tenureYears === yr
                      ? 'bg-[#103D2C] text-white border-[#103D2C]'
                      : 'bg-white text-[#18251E] border-[#DDE5DF] hover:border-[#103D2C]'
                  }`}
                >
                  {yr} Years
                </button>
              ))}
            </div>
          </div>

          {/* Annual Interest Rate */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-[#18251E]">Annual Interest Rate</span>
              <span className="text-[#176B45] font-bold">{customRate.toFixed(2)}% p.a.</span>
            </div>
            <input
              type="range"
              min="9.5"
              max="16.5"
              step="0.25"
              value={customRate}
              onChange={(e) => handleCustomRateChange(Number(e.target.value))}
              className="w-full accent-[#103D2C] cursor-pointer h-1.5 bg-[#DDE5DF]"
            />
          </div>

          {/* Bank Selector */}
          <div className="space-y-2 pt-2 border-t border-[#DDE5DF]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6B63] block">
              Compare Sri Lankan Bank Housing Loans
            </span>
            <div className="space-y-2">
              {SRI_LANKA_BANKS.map((b) => {
                const isSelected = selectedBankId === b.id && !isCustomRate;
                return (
                  <div
                    key={b.id}
                    onClick={() => handleSelectBank(b)}
                    className={`cursor-pointer p-3 border rounded-[3px] transition-all flex items-center justify-between text-xs ${
                      isSelected
                        ? 'border-[#103D2C] bg-[#103D2C]/5 ring-1 ring-[#103D2C]'
                        : 'border-[#DDE5DF] bg-white hover:border-[#103D2C]/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#18251E]">{b.bankName}</span>
                        <span className="text-[10px] uppercase px-1.5 py-0.5 rounded-[2px] bg-[#E9EFEA] text-[#176B45] font-semibold">
                          {b.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5F6B63] mt-0.5">{b.features}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm text-[#103D2C]">{b.rate.toFixed(2)}%</div>
                      <span className="text-[10px] text-[#5F6B63]">Max {b.maxTenureYears}y</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Repayment Breakdown Panel */}
        <div className="lg:col-span-5 bg-white border border-[#DDE5DF] rounded-[4px] p-5 flex flex-col justify-between shadow-2xs">
          <div className="space-y-4">
            <div className="border-b border-[#DDE5DF] pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5F6B63]">
                Estimated Monthly Installment
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#103D2C] mt-1 tabular-nums">
                {formatPrice(mortgageStats.monthlyInstallmentLkr)}
              </div>
              <div className="text-xs text-[#5F6B63] mt-0.5">
                Per month for {tenureYears} years ({tenureYears * 12} months)
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-[#DDE5DF]/60">
                <span className="text-[#5F6B63]">Property Price</span>
                <span className="font-bold text-[#18251E]">{formatPrice(priceLkr)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#DDE5DF]/60">
                <span className="text-[#5F6B63]">Down Payment ({downPaymentPercent}%)</span>
                <span className="font-bold text-[#18251E]">
                  {formatPrice(mortgageStats.downPaymentLkr)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#DDE5DF]/60">
                <span className="text-[#5F6B63]">Loan Principal</span>
                <span className="font-bold text-[#18251E]">
                  {formatPrice(mortgageStats.loanAmountLkr)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#DDE5DF]/60">
                <span className="text-[#5F6B63]">Estimated Total Interest</span>
                <span className="font-bold text-[#C93636]">
                  {formatPrice(mortgageStats.totalInterestLkr)}
                </span>
              </div>
              <div className="flex justify-between py-1 font-bold">
                <span className="text-[#18251E]">Total Loan Repayment</span>
                <span className="text-[#103D2C]">{formatPrice(mortgageStats.totalRepaymentLkr)}</span>
              </div>
            </div>

            <div className="p-3 bg-[#F0F5F2] border border-[#DDE5DF] rounded-[3px] text-[11px] text-[#405047] space-y-1">
              <div className="font-bold text-[#103D2C]">Eligibility Note</div>
              <p>
                Sri Lankan banks generally require that the monthly installment does not exceed 40% to 50% of verified monthly income.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#DDE5DF]">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="w-full py-3 bg-[#103D2C] hover:bg-[#176B45] text-white text-xs font-bold uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer"
            >
              Request Loan Pre-Approval
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-[#DDE5DF] rounded-[4px] max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-start justify-between pb-3 border-b border-[#DDE5DF] mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#176B45]">
                  Housing Loan Pre-Approval
                </span>
                <h4 className="text-lg font-bold text-[#103D2C] mt-0.5">
                  Request Bank Financing Assistance
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-2.5 py-1 text-xs font-bold text-[#5F6B63] hover:text-[#18251E] border border-[#DDE5DF] rounded-[3px] cursor-pointer"
              >
                Close
              </button>
            </div>

            {leadSubmitted ? (
              <div className="py-8 text-center space-y-3">
                <h4 className="text-lg font-bold text-[#103D2C]">
                  Pre-Approval Request Received
                </h4>
                <p className="text-xs text-[#5F6B63] max-w-sm mx-auto">
                  Your inquiry for {propertyTitle} ({propertyLocation}) has been recorded. A representative will contact you shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleLeadSubmit} className="space-y-4">
                <div className="p-3 bg-[#FAFBF9] border border-[#DDE5DF] rounded-[3px] text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#5F6B63]">Loan Amount:</span>
                    <span className="font-bold text-[#18251E]">
                      {formatPrice(mortgageStats.loanAmountLkr)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5F6B63]">Estimated Monthly:</span>
                    <span className="font-bold text-[#103D2C]">
                      {formatPrice(mortgageStats.monthlyInstallmentLkr)} / month
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5F6B63]">Selected Rate:</span>
                    <span className="font-bold text-[#18251E]">
                      {customRate.toFixed(2)}% ({tenureYears} years)
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#18251E] mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Asela Perera"
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      className="w-full px-3 py-2 border border-[#DDE5DF] rounded-[3px] text-xs focus:outline-none focus:border-[#103D2C]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#18251E] mb-1">
                        Phone / WhatsApp *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+94 77 123 4567"
                        value={leadPhone}
                        onChange={(e) => setLeadPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-[#DDE5DF] rounded-[3px] text-xs focus:outline-none focus:border-[#103D2C]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#18251E] mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="asela@example.com"
                        value={leadEmail}
                        onChange={(e) => setLeadEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-[#DDE5DF] rounded-[3px] text-xs focus:outline-none focus:border-[#103D2C]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#18251E] mb-1">
                      Approximate Monthly Income (LKR)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 500,000"
                      value={monthlyIncome}
                      onChange={(e) => setMonthlyIncome(e.target.value)}
                      className="w-full px-3 py-2 border border-[#DDE5DF] rounded-[3px] text-xs focus:outline-none focus:border-[#103D2C]"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-[#DDE5DF]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-[#DDE5DF] text-xs font-bold text-[#5F6B63] hover:text-[#18251E] rounded-[3px] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#103D2C] hover:bg-[#176B45] text-white text-xs font-bold rounded-[3px] transition-colors cursor-pointer"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
