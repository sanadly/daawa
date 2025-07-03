"use client";

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { QRValidationResponse } from '../../../../lib/checkin/checkin-api';

interface GuestCheckinDetailsProps {
  validationResult: QRValidationResponse;
  onConfirmCheckin: (primaryGuestId: string, additionalGuestIds: string[]) => void;
  onCancel: () => void;
  isProcessing: boolean;
}

export const GuestCheckinDetails = ({
  validationResult,
  onConfirmCheckin,
  onCancel,
  isProcessing,
}: GuestCheckinDetailsProps) => {
  const t = useTranslations('CheckinPage');
  const [selectedGuestIds, setSelectedGuestIds] = useState<Set<string>>(new Set());

  const guest = validationResult.guest;
  const additionalGuests = guest.additional_guests || [];
  const unCheckedInGuests = additionalGuests.filter((g: { id: string; name: string; checked_in_at?: Date }) => !g.checked_in_at);

  const handleToggleGuest = (guestId: string) => {
    setSelectedGuestIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(guestId)) {
        newSet.delete(guestId);
      } else {
        newSet.add(guestId);
      }
      return newSet;
    });
  };

  const handleConfirm = () => {
    onConfirmCheckin(guest.id, Array.from(selectedGuestIds));
  };

  const totalGuests = 1 + (guest.additional_guest_count || 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 animate-fade-in">
      <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
        Confirm Check-in
      </h2>

      {/* Primary Guest Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-bold text-blue-800 mb-2">Primary Guest</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div>
            <p className="font-medium text-gray-500">Name</p>
            <p className="text-gray-900">{guest.first_name} {guest.last_name}</p>
          </div>
          <div>
            <p className="font-medium text-gray-500">Tier</p>
            <p className="text-gray-900">{guest.tier_name}</p>
          </div>
        </div>
      </div>

      {/* Additional Guests Selection */}
      {unCheckedInGuests.length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold text-gray-800 mb-3">
            Select Additional Guests ({selectedGuestIds.size} / {unCheckedInGuests.length} selected)
          </h3>
          <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
            {unCheckedInGuests.map((ag: { id: string; name: string }) => (
              <label
                key={ag.id}
                className="flex items-center p-3 rounded-lg border has-[:checked]:bg-green-50 has-[:checked]:border-green-400 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedGuestIds.has(ag.id)}
                  onChange={() => handleToggleGuest(ag.id)}
                  className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 font-medium text-gray-800">{ag.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Already Checked-in Guests */}
      {additionalGuests.some((g: { checked_in_at?: Date }) => g.checked_in_at) && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-600 text-sm mb-2">Already Checked In</h3>
          <div className="space-y-2">
            {additionalGuests.filter((ag: { checked_in_at?: Date }) => ag.checked_in_at).map((ag: { id: string; name: string }) => (
              <div key={ag.id} className="text-sm text-gray-500 line-through">
                {ag.name}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row-reverse gap-3 mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={handleConfirm}
          disabled={isProcessing}
          className="w-full sm:w-auto bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isProcessing ? 'Processing...' : `Check In ${1 + selectedGuestIds.size} Guests`}
        </button>
        <button
          onClick={onCancel}
          disabled={isProcessing}
          className="w-full sm:w-auto bg-transparent border border-gray-300 text-gray-700 font-bold py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}; 