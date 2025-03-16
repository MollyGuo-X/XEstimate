import React from 'react';
import { DollarSign, Percent } from 'lucide-react';
import { LongTermHoldAnalysis } from '../types';

interface Props {
  analysis: LongTermHoldAnalysis;
  renovationCost: number;
  onUpdate: (analysis: LongTermHoldAnalysis) => void;
}

export function LongTermHoldAnalysisForm({ analysis, renovationCost, onUpdate }: Props) {
  const calculateMonthlyMortgage = (loanAmount: number, interestRate: number) => {
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = 30 * 12; // 30-year fixed
    const mortgage = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    return Math.round(mortgage * 100) / 100;
  };

  const calculateInitialInvestment = () => {
    const salesPrice = analysis.sales_price || 0;
    const loanAmount = analysis.loan_amount.is_percentage
      ? (salesPrice * (analysis.loan_amount.value || 0)) / 100
      : (analysis.loan_amount.value || 0);
    const closingCosts = analysis.closing_costs.is_percentage
      ? (salesPrice * (analysis.closing_costs.value || 0)) / 100
      : (analysis.closing_costs.value || 0);
    
    return salesPrice - loanAmount + closingCosts + renovationCost;
  };

  const calculateCashFlow = () => {
    const monthlyRent = analysis.monthly_rent || 0;
    const vacancyLoss = (monthlyRent * (analysis.vacancy_months || 0)) / 12;
    const monthlyPropertyTax = (analysis.annual_property_tax || 0) / 12;
    const monthlyHOA = (analysis.annual_hoa || 0) / 12;
    const monthlyInsurance = (analysis.annual_insurance || 0) / 12;
    const monthlyMaintenance = (analysis.annual_maintenance || 0) / 12;
    const monthlyMortgage = analysis.monthly_mortgage || 0;

    return monthlyRent - vacancyLoss - monthlyPropertyTax - monthlyHOA - monthlyInsurance - monthlyMaintenance - monthlyMortgage;
  };

  const calculateROI = () => {
    const initialInvestment = calculateInitialInvestment();
    if (initialInvestment === 0) return { cashRoi: 0, totalRoi: 0 };

    const annualCashFlow = calculateCashFlow() * 12;
    const cashRoi = (annualCashFlow / initialInvestment) * 100;

    const appreciationAmount = (analysis.sales_price * (analysis.appreciation || 0)) / 100;
    const totalReturn = annualCashFlow + appreciationAmount;
    const totalRoi = (totalReturn / initialInvestment) * 100;

    return { cashRoi, totalRoi };
  };

  const handleInputChange = (field: keyof LongTermHoldAnalysis, value: string | number) => {
    const newAnalysis = { ...analysis, [field]: value };

    // Calculate monthly mortgage when loan amount or interest rate changes
    if (field === 'loan_amount' || field === 'interest_rate' || field === 'sales_price') {
      const loanAmount = newAnalysis.loan_amount.is_percentage
        ? (newAnalysis.sales_price * newAnalysis.loan_amount.value) / 100
        : newAnalysis.loan_amount.value;
      newAnalysis.monthly_mortgage = calculateMonthlyMortgage(loanAmount, newAnalysis.interest_rate);
    }

    // Calculate cash flow and ROI
    newAnalysis.cash_flow = calculateCashFlow();
    const { cashRoi, totalRoi } = calculateROI();
    newAnalysis.cash_roi = cashRoi;
    newAnalysis.total_roi = totalRoi;

    onUpdate(newAnalysis);
  };

  return (
    <div className="space-y-6">
      {/* Sales Price */}
      <div className="economic-group">
        <label className="economic-label">Sales Price</label>
        <div className="input-group">
          <DollarSign className="input-icon" />
          <input
            type="number"
            value={analysis.sales_price || ''}
            onChange={(e) => handleInputChange('sales_price', parseFloat(e.target.value) || 0)}
            className="input-with-icon"
            placeholder="0.00"
            min="0"
            step="0.01"
          />
        </div>
      </div>

      {/* Loan Amount */}
      <div className="economic-group">
        <label className="economic-label">Loan Amount</label>
        <div className="economic-input-wrapper">
          <div className="economic-input-container">
            {analysis.loan_amount.is_percentage ? (
              <>
                <input
                  type="number"
                  value={analysis.loan_amount.value || ''}
                  onChange={(e) => handleInputChange('loan_amount', {
                    ...analysis.loan_amount,
                    value: parseFloat(e.target.value) || 0
                  })}
                  className="input-with-icon pr-10"
                  placeholder="0.00"
                  min="0"
                  max="100"
                  step="0.01"
                />
                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </>
            ) : (
              <>
                <DollarSign className="input-icon" />
                <input
                  type="number"
                  value={analysis.loan_amount.value || ''}
                  onChange={(e) => handleInputChange('loan_amount', {
                    ...analysis.loan_amount,
                    value: parseFloat(e.target.value) || 0
                  })}
                  className="input-with-icon"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleInputChange('loan_amount', {
                ...analysis.loan_amount,
                is_percentage: false
              })}
              className={`cost-type-button ${
                !analysis.loan_amount.is_percentage
                  ? 'cost-type-button-active'
                  : 'cost-type-button-inactive'
              }`}
            >
              $
            </button>
            <button
              onClick={() => handleInputChange('loan_amount', {
                ...analysis.loan_amount,
                is_percentage: true
              })}
              className={`cost-type-button ${
                analysis.loan_amount.is_percentage
                  ? 'cost-type-button-active'
                  : 'cost-type-button-inactive'
              }`}
            >
              %
            </button>
          </div>
        </div>
      </div>

      {/* Interest Rate */}
      <div className="economic-group">
        <label className="economic-label">Interest Rate (%)</label>
        <div className="input-group">
          <input
            type="number"
            value={analysis.interest_rate || ''}
            onChange={(e) => handleInputChange('interest_rate', parseFloat(e.target.value) || 0)}
            className="input-with-icon pr-10"
            placeholder="0.00"
            min="0"
            step="0.01"
          />
          <Percent className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Monthly Mortgage (Read-only) */}
      <div className="economic-group">
        <label className="economic-label">Monthly Mortgage Payment</label>
        <div className="input-group">
          <DollarSign className="input-icon" />
          <input
            type="text"
            value={analysis.monthly_mortgage.toLocaleString()}
            readOnly
            className="input-with-icon bg-gray-50"
          />
        </div>
      </div>

      {/* Monthly Rent */}
      <div className="economic-group">
        <label className="economic-label">Monthly Rent</label>
        <div className="input-group">
          <DollarSign className="input-icon" />
          <input
            type="number"
            value={analysis.monthly_rent || ''}
            onChange={(e) => handleInputChange('monthly_rent', parseFloat(e.target.value) || 0)}
            className="input-with-icon"
            placeholder="0.00"
            min="0"
            step="0.01"
          />
        </div>
      </div>

      {/* Vacancy */}
      <div className="economic-group">
        <label className="economic-label">Vacancy (months per year)</label>
        <input
          type="number"
          value={analysis.vacancy_months || ''}
          onChange={(e) => handleInputChange('vacancy_months', parseFloat(e.target.value) || 0)}
          className="input-with-icon"
          placeholder="0"
          min="0"
          max="12"
          step="0.1"
        />
      </div>

      {/* Annual Costs */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Annual Costs</h3>
        
        {/* Property Tax */}
        <div className="economic-group">
          <label className="economic-label">Property Tax</label>
          <div className="input-group">
            <DollarSign className="input-icon" />
            <input
              type="number"
              value={analysis.annual_property_tax || ''}
              onChange={(e) => handleInputChange('annual_property_tax', parseFloat(e.target.value) || 0)}
              className="input-with-icon"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {/* HOA */}
        <div className="economic-group">
          <label className="economic-label">HOA Fees</label>
          <div className="input-group">
            <DollarSign className="input-icon" />
            <input
              type="number"
              value={analysis.annual_hoa || ''}
              onChange={(e) => handleInputChange('annual_hoa', parseFloat(e.target.value) || 0)}
              className="input-with-icon"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {/* Insurance */}
        <div className="economic-group">
          <label className="economic-label">Insurance</label>
          <div className="input-group">
            <DollarSign className="input-icon" />
            <input
              type="number"
              value={analysis.annual_insurance || ''}
              onChange={(e) => handleInputChange('annual_insurance', parseFloat(e.target.value) || 0)}
              className="input-with-icon"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {/* Maintenance */}
        <div className="economic-group">
          <label className="economic-label">Maintenance</label>
          <div className="input-group">
            <DollarSign className="input-icon" />
            <input
              type="number"
              value={analysis.annual_maintenance || ''}
              onChange={(e) => handleInputChange('annual_maintenance', parseFloat(e.target.value) || 0)}
              className="input-with-icon"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
        </div>
      </div>

      {/* Appreciation */}
      <div className="economic-group">
        <label className="economic-label">Annual Appreciation</label>
        <div className="input-group">
          <input
            type="number"
            value={analysis.appreciation || ''}
            onChange={(e) => handleInputChange('appreciation', parseFloat(e.target.value) || 0)}
            className="input-with-icon pr-10"
            placeholder="0.00"
            min="0"
            step="0.01"
          />
          <Percent className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Results */}
      <div className="mt-8 p-6 bg-gray-50 rounded-lg space-y-4">
        <h3 className="font-semibold text-gray-900">Investment Summary</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Initial Investment</p>
            <p className="text-lg font-semibold text-gray-900">
              ${calculateInitialInvestment().toLocaleString()}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">Monthly Cash Flow</p>
            <p className={`text-lg font-semibold ${analysis.cash_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${analysis.cash_flow.toLocaleString()}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">Cash ROI</p>
            <p className={`text-lg font-semibold ${analysis.cash_roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {analysis.cash_roi.toFixed(2)}%
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">Total ROI</p>
            <p className={`text-lg font-semibold ${analysis.total_roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {analysis.total_roi.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}