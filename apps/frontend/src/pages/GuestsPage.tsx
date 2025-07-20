import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../hooks/useLanguage';
import { useDebounce } from '../hooks/useDebounce';
import api, { clearApiCacheForEndpoint } from '../lib/api';
import { Guest, PaginatedGuestResponse, GuestQueryParams, GuestStats, RsvpStatus } from '../types';
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  Download, 
  Edit, 
  Trash2, 
  QrCode,
  Eye,
  Mail,
  Phone,
  Calendar,
  Building2,
  User,
  CheckSquare,
  Clock,
  AlertCircle,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Loading from '../components/ui/loading';

// Modal components
const AddEditGuestModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  guest: Guest | null;
  onSuccess: () => void;
}> = ({ isOpen, onClose, guest, onSuccess }) => {
  const { t } = useTranslation();
  const language = useLanguage((state) => state.language);
  const isRTL = language === 'ar';
  const isEditing = !!guest;

  const [formData, setFormData] = useState({
    name: guest?.name || '',
    email: guest?.email || '',
    phone: guest?.phone || '',
    event_id: guest?.event_id || '',
    tier_id: guest?.tier_id || '',
    rsvp_status: guest?.rsvp_status || 'pending',
  });

  const [events, setEvents] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(false);
  const eventsFetched = useRef(false);
  const tiersFetched = useRef(false);

  const fetchEvents = useCallback(async () => {
    if (eventsFetched.current) return;
    
    try {
      eventsFetched.current = true;
      const response = await api.get('/events');
      setEvents(response.data.events || []);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      eventsFetched.current = false; // Reset flag on error
    }
  }, []);

  const fetchTiers = useCallback(async () => {
    if (tiersFetched.current) return;
    
    try {
      tiersFetched.current = true;
      const response = await api.get('/tiers');
      setTiers(response.data.tiers || []);
    } catch (error) {
      console.error('Failed to fetch tiers:', error);
      tiersFetched.current = false; // Reset flag on error
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Fetch events only if not already fetched
      if (!eventsFetched.current) {
        fetchEvents();
      }
      // Fetch tiers only if not already fetched
      if (!tiersFetched.current) {
        fetchTiers();
      }
    }
  }, [isOpen]); // Remove fetchEvents and fetchTiers from dependencies to prevent re-fetching

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing && guest) {
        await api.put(`/guests/${guest.id}`, formData);
        toast.success(t('guests.updateSuccess'));
      } else {
        await api.post('/guests', formData);
        toast.success(t('guests.createSuccess'));
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to save guest:', error);
      toast.error(error.response?.data?.message || t('guests.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            {isEditing ? t('guests.editGuest') : t('guests.addGuest')}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('guests.name')}
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('guests.email')}
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('guests.phone')}
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('guests.event')}
            </label>
            <select
              required
              value={formData.event_id}
              onChange={(e) => setFormData({ ...formData, event_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">{t('guests.selectEvent')}</option>
              {events.map((event: any) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('guests.tier')}
            </label>
            <select
              value={formData.tier_id}
              onChange={(e) => setFormData({ ...formData, tier_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">{t('guests.selectTier')}</option>
              {tiers.map((tier: any) => (
                <option key={tier.id} value={tier.id}>
                  {tier.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('guests.status')}
            </label>
            <select
              value={formData.rsvp_status}
              onChange={(e) => setFormData({ ...formData, rsvp_status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="pending">{t('guests.rsvpStatus.pending')}</option>
              <option value="accepted">{t('guests.rsvpStatus.accepted')}</option>
              <option value="declined">{t('guests.rsvpStatus.declined')}</option>
              <option value="tentative">{t('guests.rsvpStatus.tentative')}</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-primary-dark disabled:opacity-50"
            >
              {loading ? t('common.saving') : (isEditing ? t('common.update') : t('common.create'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const GuestDetailsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  guest: Guest | null;
}> = ({ isOpen, onClose, guest }) => {
  const { t } = useTranslation();
  const language = useLanguage((state) => state.language);
  const isRTL = language === 'ar';

  if (!isOpen || !guest) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{t('guests.guestDetails')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('guests.name')}</label>
            <p className="mt-1 text-sm text-gray-900">{guest.name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">{t('guests.email')}</label>
            <p className="mt-1 text-sm text-gray-900">{guest.email}</p>
          </div>

          {guest.phone && (
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('guests.phone')}</label>
              <p className="mt-1 text-sm text-gray-900">{guest.phone}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">{t('guests.event')}</label>
            <p className="mt-1 text-sm text-gray-900">{guest.event?.name || 'N/A'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">{t('guests.tier')}</label>
            <p className="mt-1 text-sm text-gray-900">{guest.tier?.name || 'N/A'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">{t('guests.status')}</label>
            <p className="mt-1 text-sm text-gray-900">{t(`guests.rsvpStatus.${guest.rsvp_status}`)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">{t('guests.checkinStatus')}</label>
            <p className="mt-1 text-sm text-gray-900">{t(`guests.checkinStatus.${guest.checkin_status}`)}</p>
          </div>

          {guest.is_primary !== undefined && (
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('guests.guestType')}</label>
              <p className="mt-1 text-sm text-gray-900">
                {guest.is_primary ? t('guests.primaryGuest') : t('guests.additionalGuest')}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

const QrCodeModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  qrCodeData: string | null;
  guestName: string;
}> = ({ isOpen, onClose, qrCodeData, guestName }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{t('guests.qrCode')} - {guestName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="text-center">
          {qrCodeData ? (
            <div>
              <img src={qrCodeData} alt="QR Code" className="mx-auto mb-4" />
              <p className="text-sm text-gray-600">{t('guests.qrCodeDescription')}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-600">{t('guests.qrCodeLoading')}</p>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

const GuestsPage: React.FC = () => {
  const { t } = useTranslation();
  const language = useLanguage((state) => state.language);
  const getLocalizedPath = useLanguage((state) => state.getLocalizedPath);
  const isRTL = language === 'ar';

  const [guests, setGuests] = useState<Guest[]>([]);
  const [stats, setStats] = useState<GuestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Modal states
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showQrCodeModal, setShowQrCodeModal] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [events, setEvents] = useState([]);

  // Debounce search term to prevent excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Refs to prevent infinite loops
  const isFetching = useRef(false);
  const eventsFetched = useRef(false);
  const lastFetchParams = useRef<string>('');
  const mountedRef = useRef(false);

  // Calculate stats using useMemo for better performance
  const calculatedStats = useMemo(() => {
    if (guests.length === 0) return null;
    
    return {
      totalGuests: guests.length,
      primaryGuests: guests.filter(g => g.is_primary).length,
      additionalGuests: guests.filter(g => !g.is_primary).length,
      acceptedRsvps: guests.filter(g => g.rsvp_status === 'accepted').length,
      checkedIn: guests.filter(g => g.checkin_status === 'checked_in').length,
    };
  }, [guests]);

  // Update stats state when calculated stats change
  useEffect(() => {
    setStats(calculatedStats);
  }, [calculatedStats]);

  // Create a stable fetch function
  const fetchGuests = useCallback(async () => {
    if (isFetching.current) return;

    const params = {
      page: pagination.page,
      limit: pagination.limit,
      search: debouncedSearchTerm || undefined,
      event_id: selectedEvent || undefined,
      rsvp_status: selectedStatus && selectedStatus !== '' ? selectedStatus as RsvpStatus : undefined,
    };

    // Create a string representation of params to check if they've changed
    const paramsString = JSON.stringify(params);
    if (lastFetchParams.current === paramsString) return;

    try {
      isFetching.current = true;
      lastFetchParams.current = paramsString;
      setLoading(true);
      setError(null);

      const response = await api.get<PaginatedGuestResponse>('/guests', { params });
      setGuests(response.data.guests);
      setPagination(prev => ({
        ...prev,
        total: response.data.total,
        totalPages: Math.ceil(response.data.total / pagination.limit),
      }));
    } catch (err: any) {
      console.error('Failed to fetch guests:', err);
      setError('Failed to fetch guests');
      toast.error('Failed to fetch guests');
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [pagination.page, pagination.limit, debouncedSearchTerm, selectedEvent, selectedStatus]);

  const fetchEvents = useCallback(async () => {
    if (eventsFetched.current) return;
    
    try {
      eventsFetched.current = true;
      const response = await api.get('/events');
      setEvents(response.data.events || []);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      eventsFetched.current = false; // Reset flag on error
    }
  }, []);

  // Single useEffect to handle all data fetching - consolidates multiple effects to prevent excessive API calls
  useEffect(() => {
    // Mark component as mounted
    mountedRef.current = true;

    // Fetch events only once on mount
    if (!eventsFetched.current) {
      fetchEvents();
    }

    // Fetch guests data
    fetchGuests();

    // Cleanup function
    return () => {
      mountedRef.current = false;
    };
  }, [pagination.page, pagination.limit, debouncedSearchTerm, selectedEvent, selectedStatus]); // Use actual data dependencies instead of function dependencies

  // Reset to page 1 when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [debouncedSearchTerm, selectedEvent, selectedStatus]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    // Page reset is now handled automatically in useEffect
  };

  const handleEventFilter = (eventId: string) => {
    setSelectedEvent(eventId);
    // Page reset is now handled automatically in useEffect
  };

  const handleStatusFilter = (status: string) => {
    setSelectedStatus(status);
    // Page reset is now handled automatically in useEffect
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleDeleteGuest = async (guestId: string) => {
    if (window.confirm(t('guests.confirmDelete'))) {
      try {
        await api.delete(`/guests/${guestId}`);
        toast.success(t('guests.deleteSuccess'));
        // Clear cache for guests endpoint to ensure fresh data
        clearApiCacheForEndpoint('/guests');
        // Force re-fetch by clearing the lastFetchParams to ensure fresh data
        lastFetchParams.current = '';
        await fetchGuests();
      } catch (err: any) {
        console.error('Failed to delete guest:', err);
        toast.error(t('guests.deleteFailed'));
      }
    }
  };

  const handleShowQrCode = async (guest: Guest) => {
    try {
      setSelectedGuest(guest);
      setShowQrCodeModal(true);
      setQrCodeData(null);
      
      const response = await api.get(`/guests/${guest.id}/qr-code`);
      setQrCodeData(response.data.qr_code_url || response.data.qr_code_data);
    } catch (err: any) {
      console.error('Failed to generate QR code:', err);
      toast.error(t('guests.qrCodeFetchFailed'));
      setShowQrCodeModal(false);
    }
  };

  const handleViewGuest = (guest: Guest) => {
    setSelectedGuest(guest);
    setShowDetailsModal(true);
  };

  const handleEditGuest = (guest: Guest) => {
    setSelectedGuest(guest);
    setShowAddEditModal(true);
  };

  const handleAddGuest = () => {
    setSelectedGuest(null);
    setShowAddEditModal(true);
  };

  const convertToCSV = (guests: Guest[]): string => {
    const headers = ['Name', 'Email', 'Phone', 'Event', 'Tier', 'RSVP Status', 'Check-in Status', 'Guest Type'];
    const csvRows = [headers.join(',')];

    guests.forEach(guest => {
      const row = [
        guest.name,
        guest.email,
        guest.phone || '',
        guest.event?.name || '',
        guest.tier?.name || '',
        guest.rsvp_status,
        guest.checkin_status,
        guest.is_primary ? 'Primary' : 'Additional'
      ].map(field => `"${field}"`).join(',');
      csvRows.push(row);
    });

    return csvRows.join('\n');
  };

  const handleExportGuests = async () => {
    try {
      let guestsToExport: Guest[] = [];

      // If a specific event is selected, use the event-specific export
      if (selectedEvent) {
        const response = await api.get(`/guests/events/${selectedEvent}/export`);
        guestsToExport = response.data;
      } else {
        // If no specific event, get all guests with current filters
        const params: GuestQueryParams = {
          limit: 10000, // Large limit to get all guests
          page: 1,
          search: searchTerm || undefined,
          rsvp_status: selectedStatus && selectedStatus !== '' ? selectedStatus as RsvpStatus : undefined,
        };

        const response = await api.get('/guests', { params });
        guestsToExport = response.data.guests;
      }

      // Convert to CSV
      const csvContent = convertToCSV(guestsToExport);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const fileName = selectedEvent 
        ? `guests-export-event-${selectedEvent}-${new Date().toISOString().split('T')[0]}.csv`
        : `guests-export-all-${new Date().toISOString().split('T')[0]}.csv`;
      
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(t('guests.exportSuccess'));
    } catch (error: any) {
      console.error('Failed to export guests:', error);
      toast.error(t('guests.exportFailed'));
    }
  };

  const handleModalSuccess = () => {
    // Force re-fetch by clearing the lastFetchParams to ensure fresh data
    lastFetchParams.current = '';
    fetchGuests();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
      case 'checked_in':
        return 'bg-primary-100 text-primary-800';
      case 'pending':
      case 'not_checked_in':
        return 'bg-yellow-100 text-yellow-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      case 'sent':
      case 'delivered':
        return 'bg-primary-200 text-primary-900';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckSquare className="h-4 w-4" />;
      case 'declined':
        return <AlertCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'tentative':
        return <User className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  if (loading && guests.length === 0) {
    return <Loading />;
  }

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('navigation.guests')}</h1>
          <p className="mt-1 text-sm text-gray-600">{t('guests.description')}</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button 
            onClick={handleExportGuests}
            className="btn btn-secondary"
          >
            <Download className="mr-2 h-4 w-4" />
            {t('guests.export')}
          </button>
          <button 
            onClick={handleAddGuest}
            className="btn btn-primary"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('guests.addGuest')}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <p className="text-sm font-medium text-primary-800">{t('guests.totalGuests')}</p>
                <p className="text-2xl font-bold text-primary-900">{stats.totalGuests}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <p className="text-sm font-medium text-primary-800">{t('guests.primaryGuests')}</p>
                <p className="text-2xl font-bold text-primary-900">{stats.primaryGuests}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <p className="text-sm font-medium text-primary-800">{t('guests.checkedIn')}</p>
                <p className="text-2xl font-bold text-primary-900">{stats.checkedIn}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <p className="text-sm font-medium text-primary-800">{t('guests.rsvpAccepted')}</p>
                <p className="text-2xl font-bold text-primary-900">{stats.acceptedRsvps}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400`} />
            <input
              type="text"
              placeholder={t('guests.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent`}
            />
          </div>

          {/* Event Filter */}
          <div>
            <select
              value={selectedEvent}
              onChange={(e) => handleEventFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">{t('guests.allEvents')}</option>
              {events.map((event: any) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">{t('guests.allStatuses')}</option>
              <option value="pending">{t('guests.rsvpStatus.pending')}</option>
              <option value="accepted">{t('guests.rsvpStatus.accepted')}</option>
              <option value="declined">{t('guests.rsvpStatus.declined')}</option>
              <option value="tentative">{t('guests.rsvpStatus.tentative')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Guests Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">{t('guests.guestList')}</h3>
        </div>
        
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('guests.name')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('guests.email')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('guests.event')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('guests.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('guests.tier')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('guests.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {guests.map((guest) => (
                <tr key={guest.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{guest.name}</div>
                        {guest.phone && (
                          <div className="text-sm text-gray-500 flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            {guest.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{guest.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{guest.event?.name || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(guest.rsvp_status)}`}>
                      {getStatusIcon(guest.rsvp_status)}
                      <span className="ml-1">{t(`guests.rsvpStatus.${guest.rsvp_status}`)}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {guest.tier?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleShowQrCode(guest)}
                        className="text-primary-600 hover:text-primary-900"
                        title={t('guests.showQrCode')}
                      >
                        <QrCode className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleViewGuest(guest)}
                        className="text-primary-600 hover:text-primary-900"
                        title={t('guests.view')}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditGuest(guest)}
                        className="text-yellow-600 hover:text-yellow-900"
                        title={t('guests.edit')}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteGuest(guest.id)}
                        className="text-red-600 hover:text-red-900"
                        title={t('guests.delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                {t('common.showing')} {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} {t('common.of')} {pagination.total}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  {t('common.previous')}
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  {t('common.next')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddEditGuestModal
        isOpen={showAddEditModal}
        onClose={() => setShowAddEditModal(false)}
        guest={selectedGuest}
        onSuccess={handleModalSuccess}
      />

      <GuestDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        guest={selectedGuest}
      />

      <QrCodeModal
        isOpen={showQrCodeModal}
        onClose={() => setShowQrCodeModal(false)}
        qrCodeData={qrCodeData}
        guestName={selectedGuest?.name || ''}
      />
    </div>
  );
};

export default GuestsPage; 