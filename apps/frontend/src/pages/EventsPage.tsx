import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Calendar, Users, DollarSign, Eye, Edit, Trash2, CreditCard, Palette } from 'lucide-react'

import { useLanguage } from '../hooks/useLanguage'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { formatPrice, formatDate } from '../lib/utils'
import api from '../lib/api'
import { Event, EventStatus, PlatformPaymentStatus } from '../types'

const EventsPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const language = useLanguage((state) => state.language)
  const getLocalizedPath = useLanguage((state) => state.getLocalizedPath)
  const isRTL = language === 'ar'
  
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await api.get('/events')
      setEvents(response.data || [])
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEvent = () => {
    navigate(getLocalizedPath('/events/new'))
  }

  const handleEventAction = (eventId: string, action: 'manage' | 'delete') => {
    if (action === 'manage') {
      navigate(getLocalizedPath(`/events/${eventId}`))
    } else if (action === 'delete') {
      if (confirm('Are you sure you want to delete this event?')) {
        deleteEvent(eventId)
      }
    }
  }

  const deleteEvent = async (eventId: string) => {
    try {
      await api.delete(`/events/${eventId}`)
      fetchEvents()
    } catch (error) {
      console.error('Error deleting event:', error)
    }
  }

  const filteredEvents = events.filter(event =>
    event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: EventStatus) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium"
    
    switch (status) {
      case EventStatus.PUBLISHED:
        return `${baseClasses} bg-green-100 text-green-800`
      case EventStatus.DRAFT:
        return `${baseClasses} bg-yellow-100 text-yellow-800`
      case EventStatus.PENDING_PAYMENT:
        return `${baseClasses} bg-orange-100 text-orange-800`
      case EventStatus.ENDED:
        return `${baseClasses} bg-blue-100 text-blue-800`
      case EventStatus.CANCELLED:
        return `${baseClasses} bg-red-100 text-red-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  const getPaymentBadge = (status: PlatformPaymentStatus) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium"
    
    switch (status) {
      case PlatformPaymentStatus.PAID:
        return `${baseClasses} bg-green-100 text-green-800`
      case PlatformPaymentStatus.PENDING:
        return `${baseClasses} bg-yellow-100 text-yellow-800`
      case PlatformPaymentStatus.FAILED:
        return `${baseClasses} bg-red-100 text-red-800`
      case PlatformPaymentStatus.REFUNDED:
        return `${baseClasses} bg-gray-100 text-gray-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('events.title')}
          </h1>
          <p className="text-gray-600 mt-1">
            Manage and organize your events
          </p>
        </div>
        <Button 
          onClick={handleCreateEvent}
          className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          <Plus className="h-4 w-4" />
          {t('events.create')}
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <div className="relative">
          <Search className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 ${
            isRTL ? 'right-3' : 'left-3'
          }`} />
          <Input
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${isRTL ? 'pr-10' : 'pl-10'}`}
          />
        </div>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('events.noEvents')}
            </h3>
            <p className="text-gray-600 mb-4">
              {t('events.createFirst')}
            </p>
            <Button onClick={handleCreateEvent}>
              {t('events.create')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">
                      {event.name}
                    </CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">
                      {event.description}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className={getStatusBadge(event.status)}>
                      {t(`events.status.${event.status}`)}
                    </span>
                    <span className={getPaymentBadge(event.platform_payment_status)}>
                      {t(`events.paymentStatus.${event.platform_payment_status}`)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Event Details */}
                <div className="space-y-2 text-sm text-gray-600">
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(event.start_datetime)}</span>
                  </div>
                  
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Users className="h-4 w-4" />
                    <span>{event.registered_count}/{event.total_capacity} guests</span>
                  </div>
                  
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <CreditCard className="h-4 w-4" />
                    <span>Platform fee: {formatPrice(event.platform_fee, event.platform_currency)}</span>
                  </div>

                  {event.tiers && event.tiers.length > 0 && (
                    <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <DollarSign className="h-4 w-4" />
                      <span>{event.tiers.length} tier{event.tiers.length > 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min((event.registered_count / event.total_capacity) * 100, 100)}%` 
                    }}
                  />
                </div>

                {/* Actions */}
                <div className={`flex gap-2 pt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleEventAction(event.id, 'manage')}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {t('common.manage')}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:bg-red-50 hover:text-red-600"
                    onClick={() => handleEventAction(event.id, 'delete')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default EventsPage 