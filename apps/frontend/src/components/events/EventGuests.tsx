import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Plus, Search, User, Users, CheckSquare, BarChart2, MoreVertical, Trash2, Edit, QrCode } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { QRCodeCanvas } from 'qrcode.react';

import api, { clearApiCacheForEndpoint } from '../../lib/api';
import { Event, Guest, PaginatedGuestResponse, GuestQueryParams, GuestStats, CreateGuestDto, UpdateGuestDto, Tier } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useDebounce } from '../../hooks/useDebounce';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';

const GuestCard: React.FC<{ guest: Guest, onEdit: (guest: Guest) => void, onDelete: (id: string) => void }> = ({ guest, onEdit, onDelete }) => {
  const { t } = useTranslation();
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex-1">
        <h3 className="font-bold text-lg">{guest.name}</h3>
        <p className="text-sm text-gray-500">{guest.email}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="text-xs px-2 py-1 bg-primary-100 text-primary-800 rounded-full">{guest.tier?.name || 'N/A'}</span>
          <span className="text-xs px-2 py-1 bg-primary-100 text-primary-800 rounded-full">{t(`rsvp_status.${guest.rsvp_status}`)}</span>
          <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">{t(`checkin_status.${guest.checkin_status}`)}</span>
        </div>
      </div>
      <div className="flex gap-2 mt-4 sm:mt-0">
        <Button variant="outline" size="sm" onClick={() => onEdit(guest)}>{t('common.edit')}</Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(guest.id)}>{t('common.delete')}</Button>
      </div>
    </div>
  );
};

const AddEditGuestForm: React.FC<{
  event: Event;
  guest?: Guest;
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ event, guest, onSuccess, onCancel }) => {
  const { t } = useTranslation();
  const formSchema = z.object({
    name: z.string().min(2, { message: t('validation.nameRequired') }),
    email: z.string().email({ message: t('validation.invalidEmail') }).optional().or(z.literal('')),
    phone: z.string().optional(),
    tier_id: z.string({ required_error: t('validation.tierRequired') }),
  });

  const { register, handleSubmit, control, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: guest?.name || '',
      email: guest?.email || '',
      phone: guest?.phone || '',
      tier_id: guest?.tier_id || event.tiers?.[0]?.id || '',
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      const payload: CreateGuestDto | UpdateGuestDto = {
        ...data,
        event_id: event.id,
      };
      if (guest) {
        await api.put(`/guests/${guest.id}`, payload);
        toast.success(t('guests.updateSuccess'));
      } else {
        await api.post('/guests', payload);
        toast.success(t('guests.addSuccess'));
      }
      onSuccess();
    } catch (error) {
      toast.error(guest ? t('guests.updateFailed') : t('guests.addFailed'));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{guest ? t('guests.editGuest') : t('guests.addGuest')}</DialogTitle>
        <DialogDescription>{t('guests.addGuestDescription')}</DialogDescription>
      </DialogHeader>
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">{t('common.name')}</label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t('common.email')}</label>
        <Input id="email" type="email" {...register('email')} />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">{t('common.phone')}</label>
        <Input id="phone" {...register('phone')} />
      </div>
      <div>
        <label htmlFor="tier_id" className="block text-sm font-medium text-gray-700">{t('events.tier')}</label>
        <Controller
          name="tier_id"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger>
                <SelectValue placeholder={t('guests.selectTier')} />
              </SelectTrigger>
              <SelectContent>
                {event.tiers?.map((tier) => (
                  <SelectItem key={tier.id} value={tier.id}>
                    {tier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.tier_id && <p className="text-red-500 text-xs mt-1">{errors.tier_id.message}</p>}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit">{t('common.save')}</Button>
      </DialogFooter>
    </form>
  );
};

const EventGuests: React.FC<{ event: Event }> = ({ event }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const language = useLanguage((state) => state.language);
  const isRTL = language === 'ar';
  const [guests, setGuests] = useState<Guest[]>([]);
  const [stats, setStats] = useState<GuestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [qrCode, setQrCode] = useState<{ guestName: string; code: string } | null>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Refs to prevent infinite loops
  const isFetching = useRef(false);
  const statsFetched = useRef(false);
  const lastFetchParams = useRef<string>('');
  const fetchGuestsRef = useRef<(() => Promise<void>) | null>(null);

  const fetchGuests = useCallback(async () => {
    if (isFetching.current) return;

    const params = {
      event_id: event.id,
      page: pagination.page,
      limit: pagination.limit,
      search: debouncedSearchTerm,
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
      setPagination(prev => ({ ...prev, total: response.data.total }));
    } catch (e) {
      setError(t('guests.fetchFailed'));
      toast.error(t('guests.fetchFailed'));
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [event.id, pagination.page, pagination.limit, debouncedSearchTerm]);

  // Store the fetch function in a ref to avoid dependency issues
  useEffect(() => {
    fetchGuestsRef.current = fetchGuests;
  }, [fetchGuests]);

  const fetchStats = useCallback(async () => {
    if (statsFetched.current) return;
    
    try {
      statsFetched.current = true;
      const response = await api.get<GuestStats>(`/guests/events/${event.id}/stats`);
      setStats(response.data);
    } catch (e) {
      // It's ok if stats fail, not critical
      console.error('Failed to fetch guest stats', e);
      statsFetched.current = false; // Reset flag on error
    }
  }, [event.id]);

  // Fetch guests when dependencies change - use separate effects for each dependency
  useEffect(() => {
    if (fetchGuestsRef.current) {
      fetchGuestsRef.current();
    }
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    if (fetchGuestsRef.current) {
      fetchGuestsRef.current();
    }
  }, [debouncedSearchTerm]);

  // Fetch stats only once on mount
  useEffect(() => {
    if (!statsFetched.current) {
      fetchStats();
    }
  }, [fetchStats]);
  
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleAddClick = () => {
    setEditingGuest(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (guest: Guest) => {
    setEditingGuest(guest);
    setIsFormOpen(true);
  };

  const handleDelete = async (guestId: string) => {
    if (window.confirm(t('guests.confirmDelete'))) {
      try {
        await api.delete(`/guests/${guestId}`);
        toast.success(t('guests.deleteSuccess'));
        // Trigger re-fetch by updating a dependency
        setPagination(prev => ({ ...prev }));
        // Reset stats flag to re-fetch stats
        statsFetched.current = false;
        fetchStats();
        clearApiCacheForEndpoint('/guests');
      } catch (error) {
        toast.error(t('guests.deleteFailed'));
      }
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    // Trigger re-fetch by updating a dependency
    setPagination(prev => ({ ...prev }));
    // Reset stats flag to re-fetch stats
    statsFetched.current = false;
    fetchStats();
    clearApiCacheForEndpoint('/guests');
  };

  const handleShowQrCode = async (guest: Guest) => {
    setQrCode({ guestName: guest.name, code: await generateQrCode(guest) });
  };

  const generateQrCode = async (guest: Guest): Promise<string> => {
    try {
      const response = await api.get<{ qrCodeData: string }>(`/checkin/event/${event.id}/guest/${guest.id}/qr-code`);
      return response.data.qrCodeData;
    } catch (error) {
      toast.error(t('guests.qrCodeFetchFailed'));
      console.error(error);
      return '';
    }
  };

  const statCards = [
    { icon: Users, label: t('guests.totalGuests'), value: stats?.totalGuests },
    { icon: User, label: t('guests.primaryGuests'), value: stats?.primaryGuests },
    { icon: CheckSquare, label: t('guests.checkedIn'), value: stats?.checkedIn },
    { icon: BarChart2, label: t('guests.rsvpAccepted'), value: stats?.acceptedRsvps },
  ];

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

      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-auto md:flex-1">
          <Search className={`absolute ${isRTL ? 'right-2.5' : 'left-2.5'} top-2.5 h-4 w-4 text-muted-foreground`} />
          <Input 
            placeholder={t('guests.searchPlaceholder')} 
            className={`${isRTL ? 'pr-8' : 'pl-8'} sm:w-[300px] md:w-[200px] lg:w-[300px]`} 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddClick} className="w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" /> {t('guests.addGuest')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <AddEditGuestForm
              event={event}
              guest={editingGuest || undefined}
              onSuccess={handleFormSuccess}
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
      
      {loading && <p>{t('common.loading')}</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && (
        <div className="space-y-4">
          {guests.map(guest => (
            <div key={guest.id} className="flex items-center justify-between">
              <GuestCard guest={guest} onEdit={handleEditClick} onDelete={handleDelete} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEditClick(guest)}><Edit className="mr-2 h-4 w-4" /> {t('common.edit')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShowQrCode(guest)}><QrCode className="mr-2 h-4 w-4" /> {t('guests.showQrCode')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDelete(guest.id)}><Trash2 className="mr-2 h-4 w-4" /> {t('common.delete')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}
      
      {!loading && pagination.total > pagination.limit && (
        <div className="flex justify-center items-center space-x-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            {t('common.previous')}
          </Button>
          <span>{t('common.page')} {pagination.page} / {Math.ceil(pagination.total / pagination.limit)}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
          >
            {t('common.next')}
          </Button>
        </div>
      )}

      {qrCode && (
        <Dialog open={true} onOpenChange={() => setQrCode(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{qrCode.guestName}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center p-4">
              <QRCodeCanvas value={qrCode.code} size={256} />
              <p className="mt-4 text-sm text-muted-foreground">{t('guests.scanInstruction')}</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default EventGuests; 