
import React from 'react';
import { X } from 'lucide-react';
import { CalculatedLoan, LoanScenario } from '../types';
import { formatCurrency } from '../utils/calculations';
import { Theme } from '../App';

interface AmortizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: LoanScenario;
  calculated: CalculatedLoan;
  theme: Theme;
}

export const AmortizationModal: React.FC<AmortizationModalProps> = ({ 
  isOpen, 
  onClose, 
  scenario, 
  calculated,
  theme
}) => {
  if (!isOpen) return null;

  const bgClass = theme === 'light' ? 'bg-white' : 'bg-gray-800';
  const textClass = theme === 'light' ? 'text-gray-900' : 'text-gray-100';
  const subTextClass = theme === 'light' ? 'text-gray-500' : 'text-gray-400';
  const borderClass = theme === 'light' ? 'border-gray-200' : 'border-gray-700';
  const headerBg = theme === 'light' ? 'bg-gray-50' : 'bg-gray-900/50';
  const hoverBg = theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-white/5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className={`${bgClass} rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border ${borderClass}`}>
        {/* Header */}
        <div className={`flex justify-between items-center p-6 border-b ${borderClass}`}>
          <div>
            <h2 className={`text-xl font-bold ${textClass}`}>{scenario.name} Schedule</h2>
            <p className={`text-sm ${subTextClass}`}>Payoff Date: {calculated.payoffDate}</p>
          </div>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${hoverBg} ${subTextClass}`}
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-auto flex-1 p-0">
          <table className="w-full text-sm text-left border-collapse">
            <thead className={`sticky top-0 font-semibold shadow-sm z-10 ${headerBg} ${textClass}`}>
              <tr>
                <th className={`px-4 py-3 border-b ${borderClass}`}>Date</th>
                <th className={`px-4 py-3 border-b ${borderClass}`}>Payment</th>
                <th className={`px-4 py-3 border-b text-green-700 dark:text-green-400 ${borderClass}`}>Principal</th>
                <th className={`px-4 py-3 border-b text-red-600 dark:text-red-400 ${borderClass}`}>Interest</th>
                <th className={`px-4 py-3 border-b text-blue-600 dark:text-blue-400 ${borderClass}`}>Extra</th>
                <th className={`px-4 py-3 border-b text-right ${borderClass}`}>Balance</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'light' ? 'divide-gray-100' : 'divide-gray-700'}`}>
              {calculated.amortizationSchedule.map((row) => (
                <tr key={row.monthIndex} className={hoverBg}>
                  <td className={`px-4 py-2 font-mono ${subTextClass}`}>{row.date}</td>
                  <td className={`px-4 py-2 font-medium ${textClass}`}>{formatCurrency(row.totalPayment)}</td>
                  <td className="px-4 py-2 text-green-700 dark:text-green-400">{formatCurrency(row.principal)}</td>
                  <td className="px-4 py-2 text-red-600 dark:text-red-400">{formatCurrency(row.interest)}</td>
                  <td className="px-4 py-2 text-blue-600 dark:text-blue-400">
                    {row.extraPayment > 0 ? formatCurrency(row.extraPayment) : '-'}
                  </td>
                  <td className={`px-4 py-2 text-right font-bold ${textClass}`}>
                    {formatCurrency(row.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className={`p-4 border-t flex justify-between text-sm ${headerBg} ${borderClass}`}>
          <div className="flex gap-6">
            <div>
              <span className={`${subTextClass} block text-xs`}>Total Interest</span>
              <span className={`font-bold ${textClass}`}>{formatCurrency(calculated.totalInterest)}</span>
            </div>
            <div>
              <span className={`${subTextClass} block text-xs`}>Total Paid</span>
              <span className={`font-bold ${textClass}`}>{formatCurrency(calculated.totalPaid)}</span>
            </div>
          </div>
          <button 
             onClick={onClose}
             className={`px-4 py-2 border rounded-lg font-medium text-xs transition-colors ${theme === 'light' ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700'}`}
          >
             Close
          </button>
        </div>
      </div>
    </div>
  );
};
