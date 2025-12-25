import { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

/**
 * Hook to fetch enabled taxes and calculate tax amounts
 */
export const useTaxCalculation = () => {
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEnabledTaxes();
  }, []);

  const fetchEnabledTaxes = async () => {
    try {
      console.log('🔄 Fetching taxes from:', `${API_URL}/api/public/taxes`);
      const response = await fetch(`${API_URL}/api/public/taxes`);
      if (!response.ok) throw new Error('Failed to fetch taxes');
      const data = await response.json();
      console.log('✅ Taxes loaded:', data);
      setTaxes(data);
      setLoading(false);
    } catch (err) {
      console.error('❌ Error fetching taxes:', err);
      setError(err.message);
      setLoading(false);
      setTaxes([]); // Fallback to no taxes
    }
  };

  /**
   * Calculate taxes for a booking
   * @param {number} roomRate - Base room rate per night
   * @param {number} nights - Number of nights
   * @param {number} extraCharges - Additional charges (optional)
   * @returns {Object} Tax breakdown with totals
   */
  const calculateTaxes = (roomRate, nights, extraCharges = 0) => {
    console.log('💰 calculateTaxes called:', { roomRate, nights, extraCharges, taxesCount: taxes.length });
    
    if (!roomRate || !nights || taxes.length === 0) {
      const totalRoomRate = roomRate * nights;
      console.log('⚠️ No taxes applied:', { reason: !roomRate ? 'no roomRate' : !nights ? 'no nights' : 'no taxes loaded' });
      return {
        roomRate: totalRoomRate,
        extraCharges,
        subtotal: totalRoomRate + extraCharges,
        taxes: [],
        totalTaxes: 0,
        grandTotal: totalRoomRate + extraCharges
      };
    }

    const totalRoomRate = roomRate * nights;
    let subtotal = totalRoomRate;
    let totalTaxAmount = 0;
    const taxBreakdown = [];

    // Apply taxes in order
    for (const tax of taxes) {
      if (!tax.isEnabled) continue;

      let taxAmount = 0;
      let baseAmount = 0;

      // Determine base amount for this tax
      switch (tax.appliesTo) {
        case 'ROOM_RATE':
          baseAmount = totalRoomRate;
          break;
        case 'SUBTOTAL':
          baseAmount = subtotal + extraCharges;
          break;
        case 'TOTAL':
          baseAmount = subtotal + extraCharges + totalTaxAmount;
          break;
        default:
          baseAmount = totalRoomRate;
      }

      // Calculate tax amount
      if (tax.taxType === 'PERCENTAGE') {
        taxAmount = (baseAmount * tax.rate) / 100;
      } else if (tax.taxType === 'FIXED') {
        taxAmount = tax.rate * nights;
      }

      // Round to 2 decimal places
      taxAmount = Math.round(taxAmount * 100) / 100;

      totalTaxAmount += taxAmount;
      taxBreakdown.push({
        name: tax.name,
        type: tax.taxType,
        rate: tax.rate,
        amount: taxAmount,
        appliesTo: tax.appliesTo
      });
    }

    return {
      roomRate: totalRoomRate,
      extraCharges,
      subtotal: totalRoomRate + extraCharges,
      taxes: taxBreakdown,
      totalTaxes: totalTaxAmount,
      grandTotal: totalRoomRate + extraCharges + totalTaxAmount
    };
  };

  return {
    taxes,
    loading,
    error,
    calculateTaxes
  };
};
