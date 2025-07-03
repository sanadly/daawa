"use client";

import { useState, useEffect } from 'react';
import { checkinApi, GuestSearchResponse, CheckinResponse, EventResponse } from '../../../../lib/checkin/checkin-api';
import toast from 'react-hot-toast';

interface Guest {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  tier_name: string;
  check_in_status: 'pending' | 'checked-in' | 'no-show';
  additional_guest_count: number;
}

interface ManualLookupProps {
  onCheckinSuccess: (result: CheckinResponse) => void;
}

export const ManualLookup = ({ onCheckinSuccess }: ManualLookupProps) => {
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Guest[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const fetchedEvents = await checkinApi.getEvents();
        setEvents(fetchedEvents);
        if (fetchedEvents.length > 0) {
          setSelectedEventId(fetchedEvents[0].id);
        }
      } catch (error) {
        toast.error('Failed to load events');
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      await performSearch();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const performSearch = async () => {
    if (!selectedEventId) {
      toast.error('Please select an event first');
      return;
    }

    setIsSearching(true);
    try {
      const response: GuestSearchResponse = await checkinApi.searchGuests(selectedEventId, searchQuery);
      setSearchResults(response.results);
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error(error.message || 'Failed to search guests');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleGuestSelect = (guest: Guest) => {
    setSelectedGuest(guest);
    setSearchQuery(`${guest.first_name} ${guest.last_name}`);
    setSearchResults([]);
  };

  const handleCheckin = async () => {
    if (!selectedGuest) return;

    setIsProcessing(true);
    try {
      const checkinData = {
        guest_id: selectedGuest.id,
        checkin_method: 'manual' as const,
        device_info: navigator.userAgent,
        location: 'Manual Lookup Portal',
        notes: 'Manual check-in via search',
      };

      // Check if online - if not, we can't proceed with manual lookup check-in
      // since we need online access to validate the guest data
      if (typeof window !== 'undefined' && !navigator.onLine) {
        toast.error('Manual check-in requires internet connection to validate guest data');
        return;
      }

      const result = await checkinApi.recordCheckin(checkinData);
      
      if (result.success) {
        toast.success(`Successfully checked in ${result.guest.name}`);
        onCheckinSuccess(result);
        // Reset form
        setSearchQuery('');
        setSelectedGuest(null);
        setSearchResults([]);
      } else {
        toast.error('Check-in failed');
      }
    } catch (error: any) {
      console.error('Check-in error:', error);
      toast.error(error.message || 'Failed to process check-in');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      'checked-in': { bg: 'bg-green-100', text: 'text-green-800', label: 'Checked In' },
      'no-show': { bg: 'bg-red-100', text: 'text-red-800', label: 'No Show' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedGuest(null);
    setSearchResults([]);
  };

  return (
    <div className="space-y-6">
      {/* Event Selection */}
      <div>
        <label htmlFor="event-select" className="block text-sm font-medium text-gray-700 mb-1">
          Select Event
        </label>
        <select
          id="event-select"
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          disabled={events.length === 0}
        >
          {events.length === 0 ? (
            <option>Loading events...</option>
          ) : (
            events.map(event => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Offline Warning */}
      {typeof window !== 'undefined' && !navigator.onLine && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-yellow-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-yellow-800 text-sm">
              <strong>Offline Mode:</strong> Manual guest lookup requires internet connection. Please use QR scanning for offline check-ins.
            </p>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="mb-4">
          <label htmlFor="guest-search" className="block text-sm font-medium text-gray-700 mb-2">
            Search for Guest
          </label>
          <div className="relative">
            <input
              id="guest-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter guest name or email..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-12"
            />
            
            {/* Search Icon */}
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {isSearching ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              ) : (
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </div>
            
            {/* Clear Button */}
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-8 pr-3 flex items-center"
              >
                <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {searchQuery.length > 0 && searchQuery.length < 2 && (
            <p className="mt-1 text-sm text-gray-500">
              Type at least 2 characters to search
            </p>
          )}
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-700">
                Found {searchResults.length} guest{searchResults.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="max-h-60 overflow-y-auto">
              {searchResults.map((guest) => (
                <button
                  key={guest.id}
                  onClick={() => handleGuestSelect(guest)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-blue-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {guest.first_name} {guest.last_name}
                      </p>
                      <p className="text-sm text-gray-600">{guest.email}</p>
                      <div className="flex items-center mt-1 space-x-3">
                        <span className="text-xs text-gray-500">
                          Tier: {guest.tier_name}
                        </span>
                        {guest.additional_guest_count > 0 && (
                          <span className="text-xs text-gray-500">
                            +{guest.additional_guest_count} guests
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      {getStatusBadge(guest.check_in_status)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0118 12a8 8 0 10-8 8 7.962 7.962 0 014.291-1.709L21 21l-3-3z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No guests found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search terms or check the spelling.
            </p>
          </div>
        )}
      </div>

      {/* Selected Guest Details */}
      {selectedGuest && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Selected Guest
          </h3>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Full Name</p>
                <p className="font-medium text-gray-900">
                  {selectedGuest.first_name} {selectedGuest.last_name}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-1">Email</p>
                <p className="font-medium text-gray-900">{selectedGuest.email}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-1">Tier</p>
                <p className="font-medium text-gray-900">{selectedGuest.tier_name}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-1">Status</p>
                {getStatusBadge(selectedGuest.check_in_status)}
              </div>
              
              {selectedGuest.additional_guest_count > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Additional Guests</p>
                  <p className="font-medium text-gray-900">
                    +{selectedGuest.additional_guest_count}
                  </p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Party Size</p>
                <p className="font-medium text-gray-900">
                  {1 + selectedGuest.additional_guest_count}
                </p>
              </div>
            </div>
          </div>

          {/* Check-in Actions */}
          <div className="flex space-x-4">
            {selectedGuest.check_in_status === 'pending' ? (
              <button
                onClick={handleCheckin}
                disabled={isProcessing}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  `Check In Guest${selectedGuest.additional_guest_count > 0 ? 's' : ''}`
                )}
              </button>
            ) : (
              <div className="flex-1 bg-gray-100 text-gray-500 px-6 py-3 rounded-lg text-center font-medium">
                Already {selectedGuest.check_in_status === 'checked-in' ? 'Checked In' : 'Marked as No Show'}
              </div>
            )}
            
            <button
              onClick={clearSearch}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 