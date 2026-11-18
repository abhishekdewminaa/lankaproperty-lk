import React, { useState, useMemo } from 'react';
import { useCurrency } from '../context/CurrencyContext';

interface AcquisitionCalculatorProps {
  priceLkr: number;
  propertyType: string;
}

export const AcquisitionCalculator: React.FC<AcquisitionCalculatorProps> = ({ priceLkr }) => {
  const { formatPrice, currency } = useCurrency();

  const [enableMortgage, setEnableMortgage] = useState(false);
  const [downPaymentPercent, setDownPaymentPercent] = useState(30);
  const [loanTenorYears, setLoanTenorYears] = useState(15);
  const [interestRate, setInterestRate] = useState(12.0);

  const calculations = useMemo(() => {
    if (priceLkr <= 0) {
      return {
        stampDuty: 0,
        notarialFee: 0,
        titleSearchFee: 0,
        totalAcquisitionCost: 0,
        loanAmount: 0,
        monthlyMortgage: 0,
        downPaymentAmount: 0,
      };
    }

    const firstTier = Math.min(priceLkr, 100000);
    const balanceTier = Math.max(0, priceLkr - 100000);
    const stampDuty = firstTier * 0.03 + balanceTier * 0.04;
    const notarialFee = priceLkr * 0.01;
    const titleSearchFee = Math.max(75000, priceLkr * 0.005);
    const totalAcquisitionCost = priceLkr + stampDuty + notarialFee + titleSearchFee;

    const downPaymentAmount = (priceLkr * downPaymentPercent) / 100;
    const loanAmount = priceLkr - downPaymentAmount;

    const monthlyRate = interestRate / 100 / 12;
    const totalMonths = loanTenorYears * 12;
    let monthlyMortgage = 0;
    if (monthlyRate > 0 && totalMonths > 0) {
      monthlyMortgage =
        (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1);
    }

    return {
      stampDuty,
      notarialFee,
      titleSearchFee,
      totalAcquisitionCost,
      downPaymentAmount,
      loanAmount,
      monthlyMortgage,
    };
  }, [priceLkr, downPaymentPercent, loanTenorYears, interestRate]);

  if (priceLkr <= 0) return null;

  return (
    <div className="bg-[#FAFBF9] border border-[#DDE5DF] rounded-[4px] p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DDE5DF] pb-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#176B45] block">
            Stamp Duty & Transfer Costs
          </span>
          <h3 className="text-lg font-bold text-[#103D2C] mt-0.5">
            Purchase & Legal Cost Breakdown
          </h3>
        </div>
        <div className="text-xs text-[#5F6B63]">
          Values displayed in <span className="font-bold text-[#103D2C]">{currency}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h4 className="text-xs uppercase font-bold tracking-wider text-[#18251E] pb-1 border-b border-[#DDE5DF]">
            Legal & Government Transfer Fees
          </h4>

          <div className="flex justify-between items-center text-xs py-1 border-b border-[#DDE5DF]/60">
            <span className="text-[#5F6B63]">Agreed Purchase Price</span>
            <span className="font-bold text-[#18251E] tabular-nums">{formatPrice(priceLkr)}</span>
          </div>

          <div className="flex justify-between items-center text-xs py-1 border-b border-[#DDE5DF]/60">
            <span className="text-[#5F6B63]">Stamp Duty (3% on 1st 100k, 4% balance)</span>
            <span className="font-bold text-[#176B45] tabular-nums">
              {formatPrice(calculations.stampDuty)}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs py-1 border-b border-[#DDE5DF]/60">
            <span className="text-[#5F6B63]">Legal & Notarial Fee (~1%)</span>
            <span className="font-bold text-[#18251E] tabular-nums">
              {formatPrice(calculations.notarialFee)}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs py-1 border-b border-[#DDE5DF]/60">
            <span className="text-[#5F6B63]">Title Search & Deed Registration</span>
            <span className="font-bold text-[#18251E] tabular-nums">
              {formatPrice(calculations.titleSearchFee)}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm py-2.5 bg-white px-3 rounded-[3px] border border-[#176B45]/30">
            <span className="font-bold text-[#103D2C]">Total Estimated Purchase Cost</span>
            <span className="font-bold text-base text-[#176B45] tabular-nums">
              {formatPrice(calculations.totalAcquisitionCost)}
            </span>
          </div>
          {currency !== 'LKR' && (
            <p className="text-[11px] text-[#5F6B63] text-right tabular-nums">
              Approx. Rs. {Math.round(calculations.totalAcquisitionCost).toLocaleString('en-US')} LKR
            </p>
          )}
        </div>

        <div className="space-y-3 bg-white p-4 rounded-[4px] border border-[#DDE5DF]">
          <div className="flex items-center justify-between pb-1 border-b border-[#DDE5DF]">
            <h4 className="text-xs uppercase font-bold tracking-wider text-[#18251E]">
              Quick Loan Estimate
            </h4>
            <label className="flex items-center gap-1.5 text-xs text-[#176B45] font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={enableMortgage}
                onChange={(e) => setEnableMortgage(e.target.checked)}
                className="rounded-[2px] text-[#176B45] focus:ring-[#176B45]"
              />
              <span>Enable Loan</span>
            </label>
          </div>

          {enableMortgage ? (
            <div className="space-y-3 text-xs pt-1">
              <div>
                <div className="flex justify-between text-[#5F6B63] mb-1">
                  <span>Down Payment ({downPaymentPercent}%)</span>
                  <span className="font-bold text-[#18251E] tabular-nums">
                    {formatPrice(calculations.downPaymentAmount)}
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="60"
                  step="5"
                  value={downPaymentPercent}
                  onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                  className="w-full accent-[#176B45] cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#5F6B63] mb-1">Loan Term</label>
                  <select
                    value={loanTenorYears}
                    onChange={(e) => setLoanTenorYears(Number(e.target.value))}
                    className="w-full h-8 px-2 text-xs bg-white border border-[#DDE5DF] rounded-[3px]"
                  >
                    <option value="5">5 Years</option>
                    <option value="10">10 Years</option>
                    <option value="15">15 Years</option>
                    <option value="20">20 Years</option>
                    <option value="25">25 Years</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#5F6B63] mb-1">Interest Rate</label>
                  <select
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className="w-full h-8 px-2 text-xs bg-white border border-[#DDE5DF] rounded-[3px]"
                  >
                    <option value="10.5">10.5% p.a.</option>
                    <option value="12.0">12.0% p.a.</option>
                    <option value="13.5">13.5% p.a.</option>
                  </select>
                </div>
              </div>

              <div className="mt-3 p-3 bg-[#E8F3EC] rounded-[3px] border border-[#176B45]/30">
                <div className="text-[11px] text-[#5F6B63]">Estimated Monthly Installment</div>
                <div className="text-xl font-bold text-[#103D2C] tabular-nums mt-0.5">
                  {formatPrice(calculations.monthlyMortgage)}
                  <span className="text-xs font-normal text-[#5F6B63] ml-1">/ month</span>
                </div>
                <div className="text-[10px] text-[#5F6B63] mt-1">
                  Loan Principal: {formatPrice(calculations.loanAmount)}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-[#5F6B63] space-y-2">
              <p>Calculate monthly repayments based on standard Sri Lankan bank housing loan rates.</p>
              <button
                type="button"
                onClick={() => setEnableMortgage(true)}
                className="px-3.5 py-1.5 text-xs font-bold text-[#103D2C] bg-[#E8F3EC] hover:bg-[#d5e8dc] rounded-[3px] cursor-pointer"
              >
                Enable Loan Calculator
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
