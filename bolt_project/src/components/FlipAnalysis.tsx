import React from 'react';
import { DollarSign, Percent } from 'lucide-react';
import { FlipAnalysis } from '../types';

interface Props {
  analysis: FlipAnalysis;
  renovationCost: number;
  onUpdate: (analysis: FlipAnalysis) => void;
}

export function FlipAnalysisForm({ analysis, renovationCost, onUpdate }: Props) {
  const calculateProfit = () => {
    const askingPrice = analysis.asking_price || 0;
    const arv = analysis.arv || 0;

    const closingCostsValue = analysis.closing_costs.value || 0;
    const holdingCostsValue = analysis.holding_costs.value || 0;
    const sellingCostsValue = analysis.selling_costs.value || 0;

    const closingCosts = analysis.closing_costs.is_percentage
      ? (askingPrice * closingCostsValue) / 100
      : closingCostsValue;

    const holdingCosts = analysis.holding_costs.is_percentage
      ? (askingPrice * holdingCostsValue) / 100
      : holdingCostsValue;

    const sellingCosts = analysis.selling_costs.is_percentage
      ? (arv * sellingCostsValue) / 100
      : sellingCostsValue;

    return arv - askingPrice - closingCosts - holdingCosts - sellingCosts - renovationCost;
  };

  const calculateROI = () => {
    const profit = calculateProfit();
    const askingPrice = analysis.asking_price || 0;
    const totalInvestment = askingPrice + renovationCost;

    if (totalInvestment === 0) return { roi: 0, annualizedRoi: 0 };

    const roi = (profit / totalInvestment) * 100;
    const months = analysis.months_to_complete || 12;
    const annualizedRoi = (roi / months) * 12;

    return { roi, annualizedRoi };
  };

  const handleInputChange = (field: keyof FlipAnalysis, value: any) => {
    const newAnalysis = { ...analysis, [field]: value };
    
    // Calculate profit and ROI
    const profit = calculateProfit();
    const { roi, annualizedRoi } = calculateROI();
    
    newAnalysis.profit = profit;
    newAnalysis.roi = roi;
    newAnalysis.annualized_roi = annualizedRoi;

    onUpdate(newAnalysis);
  };

  return (
    <div className="space-y-6">
      {/* Asking Price */}
      <div className="economic-group">
        <label className="economic-label">Asking Price</label>
        <div className="input-group">
          <DollarSign className="input-icon" />
          <input
            type="number"
            value={analysis.asking_price || ''}
            onChange={(e) => handleInputChange('asking_price', parseFloat(e.target.value) || 0)}
            className="input-with-icon"
            placeholder="0.00"
            min="0"
            step="0.01"
          />
        </div>
      </div>

      {/* ARV */}
      <div className="economic-group">
        <label className="economic-label">After Repair Value (ARV)</label>
        <div className="input-group">
          <DollarSign className="input-icon" />
          <input
            type="number"
            value={analysis.arv || ''}
            onChange={(e) => handleInputChange('arv', parseFloat(e.target.value) || 0)}
            className="input-with-icon"
            placeholder="0.00"
            min="0"
            step="0.01"
          />
        </div>
      </div>

      {/* Costs */}
      {[
        { key: 'closing_costs', label: 'Closing Costs' },
        { key: 'holding_costs', label: 'Holding Costs' },
        { key: 'selling_costs', label: 'Selling Costs' }
      ].map(({ key, label }) => (
        <div key={key} className="economic-group">
          <label className="economic-label">{label}</label>
          <div className="economic-input-wrapper">
            <div className="economic-input-container">
              {analysis[key].is_percentage ? (
                <>
                  <input
                    type="number"
                    value={analysis[key].value || ''}
                    onChange={(e) => handleInputChange(key, {
                      ...analysis[key],
                      value: parseFloat(e.target.value) || 0
                    })}
                    className="input-with-icon pr-10"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </>
              ) : (
                <>
                  <DollarSign className="input-icon" />
                  <input
                    type="number"
                    value={analysis[key].value || ''}
                    onChange={(e) => handleInputChange(key, {
                      ...analysis[key],
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
                onClick={() => handleInputChange(key, {
                  ...analysis[key],
                  is_percentage: false
                })}
                className={`cost-type-button ${
                  !analysis[key].is_percentage
                    ? 'cost-type-button-active'
                    : 'cost-type-button-inactive'
                }`}
              >
                $
              </button>
              <button
                onClick={() => handleInputChange(key, {
                  ...analysis[key],
                  is_percentage: true
                })}
                className={`cost-type-button ${
                  analysis[key].is_percentage
                    ? 'cost-type-button-active'
                    : 'cost-type-button-inactive'
                }`}
              >
                %
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Months to Complete */}
      <div className="economic-group">
        <label className="economic-label">Months to Complete</label>
        <input
          type="number"
          value={analysis.months_to_complete || ''}
          onChange={(e) => handleInputChange('months_to_complete', parseFloat(e.target.value) || 0)}
          className="input-with-icon"
          placeholder="0"
          min="0"
          step="1"
        />
      </div>

      {/* Results */}
      <div className="mt-8 space-y-4">
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-gray-600">Total Profit</span>
          <span className={`font-medium ${analysis.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${analysis.profit.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-gray-600">ROI</span>
          <span className={`font-medium ${analysis.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {analysis.roi.toFixed(2)}%
          </span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="text-gray-600">Annualized ROI</span>
          <span className={`font-medium ${analysis.annualized_roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {analysis.annualized_roi.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
}