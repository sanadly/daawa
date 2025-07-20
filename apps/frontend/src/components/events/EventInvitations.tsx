import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Send, Clock, RefreshCw, BarChart2, Mail, UserCheck, UserX } from 'lucide-react';

import api from '../../lib/api';
import { Event, Guest, InvitationStats, PaginatedGuestResponse, GuestQueryParams } from '../../types';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

const GuestRow: React.FC<{
  guest: Guest;
  isSelected: boolean;
  onSelectionChange: (guestId: string, isSelected: boolean) => void;
}> = ({ guest, isSelected, onSelectionChange }) => {
  const { t } = useTranslation();
  return (
    <TableRow>
      <TableCell className="w-[50px]">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked: boolean) => onSelectionChange(guest.id, checked)}
        />
      </TableCell>
      <TableCell>
        <div className="font-medium">{guest.name}</div>
        <div className="text-sm text-muted-foreground">{guest.email}</div>
      </TableCell>
      <TableCell>
        <span className={`px-2 py-1 text-xs rounded-full ${
          {
            pending: 'bg-gray-100 text-gray-800',
            sent: 'bg-blue-100 text-blue-800',
            delivered: 'bg-green-100 text-green-800',
            failed: 'bg-red-100 text-red-800',
          }[guest.invite_status]
        }`}>
          {t(`invite_status.${guest.invite_status}`)}
        </span>
      </TableCell>
      <TableCell>{t(`rsvp_status.${guest.rsvp_status}`)}</TableCell>
    </TableRow>
  );
};

const EventInvitations: React.FC<{ event: Event }> = ({ event }) => {
  const { t } = useTranslation();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [stats, setStats] = useState<InvitationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  const fetchGuests = async (page = 1) => {
    setLoading(true);
    try {
      const params: GuestQueryParams = { event_id: event.id, page, limit: pagination.limit };
      const response = await api.get<PaginatedGuestResponse>('/guests', { params });
      setGuests(response.data.guests);
      setPagination({ ...pagination, page, total: response.data.total });
    } catch (e) {
      toast.error(t('invitations.fetchGuestsFailed'));
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get<{ data: InvitationStats }>(`/email-invitations/stats/${event.id}`);
      setStats(response.data.data);
    } catch (e) {
      console.error('Failed to fetch invitation stats', e);
    }
  };

  useEffect(() => {
    fetchGuests();
    fetchStats();
  }, [event.id]);

  const handleSelectionChange = (guestId: string, isSelected: boolean) => {
    setSelectedGuestIds(prev =>
      isSelected ? [...prev, guestId] : prev.filter(id => id !== guestId)
    );
  };

  const handleSelectAll = (isSelected: boolean) => {
    setSelectedGuestIds(isSelected ? guests.map(g => g.id) : []);
  };

  const handleSendInvitations = async (isReminder = false) => {
    if (selectedGuestIds.length === 0) {
      toast.error(t('invitations.selectGuestsToSend'));
      return;
    }
    setSending(true);
    try {
      await api.post('/email-invitations/send', {
        eventId: event.id,
        guestIds: selectedGuestIds,
        templateType: isReminder ? 'reminder' : 'invitation',
      });
      toast.success(t(isReminder ? 'invitations.remindersSentSuccess' : 'invitations.invitationsSentSuccess'));
      fetchGuests(pagination.page); // Refresh statuses
      fetchStats();
      setSelectedGuestIds([]);
    } catch (e) {
      toast.error(t(isReminder ? 'invitations.remindersSentFailed' : 'invitations.invitationsSentFailed'));
    } finally {
      setSending(false);
    }
  };
  
  const handleRetryFailed = async () => {
    setSending(true);
    try {
      await api.post(`/email-invitations/retry-failed/${event.id}`);
      toast.success(t('invitations.retrySuccess'));
      fetchGuests(pagination.page);
      fetchStats();
    } catch(e) {
      toast.error(t('invitations.retryFailed'));
    } finally {
      setSending(false);
    }
  };

  const statCards = useMemo(() => [
    { icon: Mail, label: t('invitations.sent'), value: stats?.invitationsSent },
    { icon: UserCheck, label: t('invitations.confirmed'), value: stats?.confirmedAttendees },
    { icon: UserX, label: t('invitations.pending'), value: stats?.pendingResponses },
    { icon: BarChart2, label: t('guests.totalGuests'), value: stats?.totalGuests },
  ], [stats, t]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map(item => (
          <Card key={item.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value ?? '...'}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>{t('invitations.manageInvitations')}</CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => handleSendInvitations(false)} disabled={sending || selectedGuestIds.length === 0}>
                <Send className="mr-2 h-4 w-4" />{t('invitations.sendInvitations')}
              </Button>
              <Button onClick={() => handleSendInvitations(true)} variant="outline" disabled={sending || selectedGuestIds.length === 0}>
                <Clock className="mr-2 h-4 w-4" />{t('invitations.sendReminders')}
              </Button>
              <Button onClick={handleRetryFailed} variant="secondary" disabled={sending}>
                <RefreshCw className="mr-2 h-4 w-4" />{t('invitations.retryFailedBtn')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedGuestIds.length > 0 && selectedGuestIds.length === guests.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>{t('common.guest')}</TableHead>
                <TableHead>{t('invitations.inviteStatus')}</TableHead>
                <TableHead>{t('invitations.rsvpStatus')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center">{t('common.loading')}</TableCell></TableRow>
              ) : (
                guests.map(guest => (
                  <GuestRow 
                    key={guest.id} 
                    guest={guest} 
                    isSelected={selectedGuestIds.includes(guest.id)} 
                    onSelectionChange={handleSelectionChange}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventInvitations; 