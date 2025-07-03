'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RoleGuard } from '../../../../../lib/auth/components/RoleGuard';
import { LoadingSpinner } from '../../../../../lib/auth/components/LoadingSpinner';
import { UserRole } from '../../../../../lib/auth/types';
import toast from 'react-hot-toast';
import { adminApi, EventDetail, ActivationResult } from '../../../../../lib/admin/admin-api';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  published: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState('');
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [activatingEvent, setActivatingEvent] = useState(false);
  const [deactivatingEvent, setDeactivatingEvent] = useState(false);
  const [activationNotes, setActivationNotes] = useState('');

  useEffect(() => {
    if (eventId) {
      fetchEventDetail();
    }
  }, [eventId]);

  const fetchEventDetail = async () => {
    try {
      setLoading(true);
      const eventData = await adminApi.getEventDetail(eventId);
      setEvent(eventData);
      setAdminNotes(eventData.adminNotes || '');
    } catch (error) {
      console.error('Failed to fetch event detail:', error);
      toast.error('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handleActivateEvent = async () => {
    if (!event) return;

    try {
      setActivatingEvent(true);
      const result: ActivationResult = await adminApi.activateEvent(event.id, activationNotes);
      
      setEvent({
        ...result.event,
        registrationLink: result.registrationLink,
        activatedAt: new Date().toISOString()
      });
      
      toast.success(result.message || 'Event activated successfully!');
      setShowActivationModal(false);
      setActivationNotes('');
    } catch (error) {
      console.error('Failed to activate event:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to activate event');
    } finally {
      setActivatingEvent(false);
    }
  };

  const handleDeactivateEvent = async () => {
    if (!event) return;

    try {
      setDeactivatingEvent(true);
      const result: ActivationResult = await adminApi.deactivateEvent(event.id, 'Admin deactivation');
      
      setEvent({
        ...result.event,
        registrationLink: undefined
      });
      
      toast.success(result.message || 'Event deactivated successfully');
    } catch (error) {
      console.error('Failed to deactivate event:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to deactivate event');
    } finally {
      setDeactivatingEvent(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!event) return;

    try {
      await adminApi.updateEventStatus(event.id, newStatus, adminNotes);
      
      setEvent({
        ...event,
        status: newStatus,
        adminNotes,
      });
      
      toast.success(`Event ${newStatus.toLowerCase().replace('_', ' ')}`);
    } catch (error) {
      console.error('Failed to update event status:', error);
      toast.error('Failed to update event status');
    }
  };

  const copyRegistrationLink = () => {
    if (event?.registrationLink) {
      navigator.clipboard.writeText(event.registrationLink);
      toast.success('Registration link copied to clipboard!');
    }
  };

  const saveAdminNotes = async () => {
    if (!event) return;

    try {
      await adminApi.updateEventNotes(event.id, adminNotes);
      
      setEvent({ ...event, adminNotes });
      toast.success('Notes saved successfully');
    } catch (error) {
      console.error('Failed to save notes:', error);
      toast.error('Failed to save notes');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
          <p className="text-gray-600 mb-4">The requested event could not be found.</p>
          <button
            onClick={() => router.push('/admin/events')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard roles={[UserRole.ADMIN]} fallback={<div>Access denied</div>}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <button
                  onClick={() => router.push('/admin/events')}
                  className="text-blue-600 hover:text-blue-800 mb-2"
                >
                  ← Back to Events
                </button>
                <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
                <div className="flex items-center space-x-4 mt-2">
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${statusColors[event.status]}`}>
                    {event.status.replace('_', ' ')}
                  </span>
                  <span className="text-gray-600">
                    Submitted {new Date(event.submittedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="space-x-2">
                {event.status === 'published' && (
                  <>
                    <button
                      onClick={() => setShowActivationModal(true)}
                      disabled={activatingEvent}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {activatingEvent ? 'Activating...' : 'Activate Event'}
                    </button>
                    <button
                      onClick={() => handleStatusChange('cancelled')}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Reject Event
                    </button>
                  </>
                )}
                {event.status === 'active' && (
                  <button
                    onClick={handleDeactivateEvent}
                    disabled={deactivatingEvent}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deactivatingEvent ? 'Deactivating...' : 'Deactivate Event'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Event Information */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Event Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Event Name</label>
                    <p className="mt-1 text-sm text-gray-900">{event.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Venue</label>
                    <p className="mt-1 text-sm text-gray-900">{event.venue}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(event.startDate).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(event.endDate).toLocaleString()}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <p className="mt-1 text-sm text-gray-900">{event.address}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="mt-1 text-sm text-gray-900">{event.description}</p>
                  </div>
                </div>
              </div>

              {/* Organizer Information */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Organizer Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="mt-1 text-sm text-gray-900">{event.organizerName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{event.organizerEmail}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-sm text-gray-900">{event.organizerPhone}</p>
                  </div>
                </div>
              </div>

              {/* Capacity & Registration */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Capacity & Registration</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Capacity</label>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{event.totalCapacity}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Registered</label>
                    <p className="mt-1 text-2xl font-bold text-blue-600">{event.registeredCount}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Checked In</label>
                    <p className="mt-1 text-2xl font-bold text-green-600">{event.checkedInCount}</p>
                  </div>
                </div>
              </div>

              {/* Registration Link */}
              {event.status === 'active' && event.registrationLink && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4">Registration Link</h2>
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 mr-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Public Registration URL
                        </label>
                        <p className="text-sm text-gray-900 font-mono break-all">
                          {event.registrationLink}
                        </p>
                      </div>
                      <button
                        onClick={copyRegistrationLink}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 whitespace-nowrap"
                      >
                        Copy Link
                      </button>
                    </div>
                    <div className="mt-3 flex items-center text-sm text-green-600">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Event is live - Guests can register using this link
                    </div>
                  </div>
                </div>
              )}

              {/* Tiers */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Ticket Tiers</h2>
                <div className="space-y-4">
                  {event.tiers.map((tier) => (
                    <div key={tier.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{tier.name}</h3>
                          <p className="text-sm text-gray-600">{tier.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            {tier.currency} {tier.price}
                          </p>
                          <p className="text-sm text-gray-600">
                            {tier.availableCount} / {tier.capacity} available
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Admin Notes */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Admin Notes</h2>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes about this event..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={saveAdminNotes}
                  className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Notes
                </button>
              </div>

              {/* Audit Log */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Audit Log</h2>
                <div className="space-y-3">
                  {event.auditLog.map((entry) => (
                    <div key={entry.id} className="border-l-4 border-blue-200 pl-3">
                      <p className="text-sm font-medium text-gray-900">{entry.action}</p>
                      <p className="text-sm text-gray-600">{entry.details}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(entry.timestamp).toLocaleString()} by {entry.adminUser}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activation Modal */}
      {showActivationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Activate Event</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to activate this event? This will make it live, generate a registration link, 
              and allow guests to register.
            </p>
            
            {/* Activation Notes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Activation Notes (Optional)
              </label>
              <textarea
                value={activationNotes}
                onChange={(e) => setActivationNotes(e.target.value)}
                placeholder="Add notes about this activation..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleActivateEvent}
                disabled={activatingEvent}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {activatingEvent ? 'Activating...' : 'Confirm Activation'}
              </button>
              <button
                onClick={() => {
                  setShowActivationModal(false);
                  setActivationNotes('');
                }}
                disabled={activatingEvent}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </RoleGuard>
  );
} 