import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { 
  Calendar, 
  Users, 
  Palette, 
  ArrowLeft, 
  Trash2, 
  CheckCircle, 
  Clock,
  LayoutGrid,
  Mail,
  QrCode
} from 'lucide-react';

import { useLanguage } from '../hooks/useLanguage';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { formatPrice, formatDate } from '../lib/utils';
import api from '../lib/api';
import { Event, Tier } from '../types';
import EventDesign from '../components/events/EventDesign';
import EventGuests from '../components/events/EventGuests';
import EventInvitations from '../components/events/EventInvitations';
import EventCheckin from '../components/events/EventCheckin';


const EventDetailsTab: React.FC<{ event: Event }> = ({ event }) => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const totalRegistered = event.tiers?.reduce((sum, tier) => sum + (tier.registered_count || 0), 0) || 0;

  return (
    <div className="space-y-6">
       <p className="text-lg text-gray-600">{event.description}</p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-700">
        <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-md">
          <Calendar className="w-5 h-5 text-primary-600" />
          <span>{formatDate(event.start_datetime, language)} - {formatDate(event.end_datetime, language)}</span>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-md">
          <Users className="w-5 h-5 text-primary-600" />
          <span>{totalRegistered} / {event.total_capacity} {t('events.guests')}</span>
        </div>
      </div>

      {/* Platform Payment Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('events.platformPayment')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {event.platform_payment_status === 'paid' ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Clock className="w-5 h-5 text-orange-500" />}
            <p>
              Status: <span className="font-semibold">{t(`paymentStatus.${event.platform_payment_status}`)}</span>
            </p>
          </div>
          <p className="text-gray-600 mt-2">
            Fee: {formatPrice(event.platform_fee, event.platform_currency)}
          </p>
        </CardContent>
      </Card>
      
      {/* Tiers Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('events.tiers')}</CardTitle>
          <CardDescription>{t('events.tiersDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {event.tiers && event.tiers.length > 0 ? (
            event.tiers.map((tier: Tier) => (
              <Card key={tier.id} className="p-4 flex justify-between items-center">
                <div>
                  <h4 className="font-bold">{tier.name}</h4>
                  <p className="text-sm text-gray-500">{tier.description}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatPrice(tier.price, tier.currency)}</p>
                  <p className="text-sm">{tier.registered_count || 0} / {tier.capacity} {t('events.registered')}</p>
                </div>
              </Card>
            ))
          ) : (
            <p>{t('events.noTiers')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};


const EventDetailsPage: React.FC = () => {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { getLocalizedPath, language } = useLanguage();
  const isRTL = language === 'ar';
  
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'details';

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEvent = async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      const response = await api.get(`/events/${eventId}`);
      setEvent(response.data);
    } catch (error) {
      toast.error(t('errors.fetchEventFailed'));
      console.error('Error fetching event details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [eventId, t]);

  const handleDelete = async () => {
    if (window.confirm(t('events.confirmDelete'))) {
      try {
        await api.delete(`/events/${eventId}`);
        toast.success(t('events.deleteSuccess'));
        navigate(getLocalizedPath('/events'));
      } catch (error) {
        toast.error(t('events.deleteFailed'));
      }
    }
  };
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'published': return 'success';
      case 'draft': return 'secondary';
      case 'pending_payment': return 'warning';
      case 'archived': return 'outline';
      default: return 'default';
    }
  };

  if (loading) {
    return <div>{t('common.loading')}</div>;
  }

  if (!event) {
    return <div>{t('errors.eventNotFound')}</div>;
  }

  const tabs = [
    { name: 'details', label: t('common.details'), icon: LayoutGrid },
    { name: 'design', label: t('designer.title'), icon: Palette },
    { name: 'guests', label: t('navigation.guests'), icon: Users },
    { name: 'invitations', label: t('navigation.invitations'), icon: Mail },
    { name: 'checkin', label: t('navigation.checkin'), icon: QrCode },
  ];
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'details':
        return <EventDetailsTab event={event} />;
      case 'design':
        return <EventDesign event={event} onUpdate={fetchEvent} onSave={fetchEvent} />;
      case 'guests':
        return <EventGuests event={event} />;
      case 'invitations':
        return <EventInvitations event={event} />;
      case 'checkin':
        return <EventCheckin event={event} />;
      default:
        return <EventDetailsTab event={event} />;
    }
  };


  return (
    <div className={`max-w-6xl mx-auto p-4 space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="flex justify-between items-start">
        <div>
          <Button onClick={() => navigate(getLocalizedPath('/events'))} variant="ghost" className="mb-4">
            <ArrowLeft className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('common.backToList')}
          </Button>
          <h1 className="text-3xl font-bold">{event.name}</h1>
          <Badge variant={getStatusBadgeVariant(event.status)} className="mt-2">{t(`events.status.${event.status}`)}</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('common.delete')}
          </Button>
        </div>
      </div>
      
       {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setSearchParams({ tab: tab.name })}
              className={`whitespace-nowrap flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.name
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default EventDetailsPage; 