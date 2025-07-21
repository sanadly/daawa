import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Calendar, Users, DollarSign, ChevronLeft, ChevronRight, Plus, Trash2, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

import { useLanguage } from '../hooks/useLanguage'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
//import { Switch } from '../components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { formatPrice } from '../lib/utils'
import api from '../lib/api'
import { CreateEventDto, TierType } from '../types'

const tierSchema = z.object({
  name: z.string().min(1, 'Tier name is required'),
  price: z.coerce.number().min(0, 'Price must be non-negative'),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
  tier_type: z.nativeEnum(TierType),
  description: z.string().optional(),
  currency: z.string().default('LYD'),
})

const eventSchema = z.object({
    name: z.string().min(3, 'Event name is required'),
    description: z.string().min(10, 'Description is required'),
    start_date: z.string().min(1, 'Start date is required'),
    start_time: z.string().min(1, 'Start time is required'),
    end_date: z.string().min(1, 'End date is required'),
    end_time: z.string().min(1, 'End time is required'),
    event_settings: z.object({
      allow_self_registration: z.boolean(),
      max_capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
    }).default({ allow_self_registration: false, max_capacity: 100 }),
    tiers: z.array(tierSchema).min(1, 'At least one tier is required'),
})
  
type EventFormData = z.infer<typeof eventSchema>

const EventCreatePage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { getLocalizedPath, language } = useLanguage()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Check if current language is RTL
  const isRTL = language === 'ar'
  
  const form = useForm({
    resolver: zodResolver(eventSchema), 
    mode: 'onBlur',
    defaultValues: {
        name: '',
        description: '',
        start_date: '',
        start_time: '',
        end_date: '',
        end_time: '',
        event_settings: {
          allow_self_registration: false,
          max_capacity: 100,
        },
        tiers: [
          {
            name: 'General Admission',
            price: 0,
            capacity: 10,
            tier_type: TierType.FREE,
            description: '',
            currency: 'LYD',
          },
        ],
      }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'tiers',
  })

  const watchedValues = form.watch()

  const PLATFORM_FEE_PER_GUEST = 1 // 1 LYD per guest
  const platformFee = ((watchedValues.event_settings?.max_capacity || 0) * PLATFORM_FEE_PER_GUEST)

  const handleNext = async () => {
    const isValid = await form.trigger()
    if (isValid) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const prevStep = () => setCurrentStep((prev) => prev - 1)

  const onSubmit = async (data: EventFormData) => {
    setIsSubmitting(true)
    try {
      const eventPayload = {
        name: data.name,
        description: data.description,
        start_datetime: `${data.start_date}T${data.start_time}:00`,
        end_datetime: `${data.end_date}T${data.end_time}:00`,
        event_settings: {
          allow_self_registration: data.event_settings.allow_self_registration,
          max_capacity: data.event_settings.max_capacity,
        },
        metadata: {
          skip_default_tier: true,
        },
      }
      
      const eventResponse = await api.post('/events', eventPayload)
      const eventId = eventResponse.data.id

      if (!eventId) {
        throw new Error('Failed to create event')
      }

      // Create tiers
      for (const tier of data.tiers) {
        const tierPayload = {
          name: tier.name,
          description: tier.description,
          price: tier.price,
          guest_limit: tier.capacity,
          currency: 'LYD',
          tier_type: tier.price > 0 ? 'paid' : 'free',
          is_active: true,
          sort_order: 0,
        }
        
        await api.post(`/events/${eventId}/tiers`, tierPayload)
      }

      toast.success(t('events.created'))
      navigate(getLocalizedPath(`/events/${eventId}/design`))
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('events.createFailed'))
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('events.form.basicInfo')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">{t('events.form.name')}</Label>
                  <Input id="name" {...form.register('name')} />
                  {form.formState.errors.name && <p className="text-sm text-red-500">{t('events.validation.nameRequired')}</p>}
                </div>
                <div>
                  <Label htmlFor="description">{t('events.form.description')}</Label>
                  <Textarea id="description" {...form.register('description')} />
                  {form.formState.errors.description && <p className="text-sm text-red-500">{t('events.validation.descriptionRequired')}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <Label htmlFor="start_date" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {t('events.form.startDate')}
                    </Label>
                    <Input 
                      id="start_date" 
                      type="date" 
                      {...form.register('start_date')}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                    {form.formState.errors.start_date && (
                      <p className="text-sm text-red-500 mt-1">{t('events.validation.startDateRequired')}</p>
                    )}
                  </div>
                  <div className="relative">
                    <Label htmlFor="start_time" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {t('events.form.startTime')}
                    </Label>
                    <Input 
                      id="start_time" 
                      type="time" 
                      {...form.register('start_time')}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                    {form.formState.errors.start_time && (
                      <p className="text-sm text-red-500 mt-1">{t('events.validation.startTimeRequired')}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <Label htmlFor="end_date" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {t('events.form.endDate')}
                    </Label>
                    <Input 
                      id="end_date" 
                      type="date" 
                      {...form.register('end_date')}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                    {form.formState.errors.end_date && (
                      <p className="text-sm text-red-500 mt-1">{t('events.validation.endDateRequired')}</p>
                    )}
                  </div>
                  <div className="relative">
                    <Label htmlFor="end_time" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {t('events.form.endTime')}
                    </Label>
                    <Input 
                      id="end_time" 
                      type="time" 
                      {...form.register('end_time')}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                    {form.formState.errors.end_time && (
                      <p className="text-sm text-red-500 mt-1">{t('events.validation.endTimeRequired')}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('events.form.tiersAndCapacity')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="total_capacity">{t('events.form.totalCapacity')}</Label>
                  <Input 
                    id="total_capacity" 
                    type="number" 
                    {...form.register('event_settings.max_capacity')}
                  />
                  {form.formState.errors.event_settings?.max_capacity && <p className="text-sm text-red-500">{t('events.validation.maxGuestsMinimum')}</p>}
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <h3 className="text-lg font-medium">{t('events.form.tiers')}</h3>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', price: 0, capacity: 10, tier_type: TierType.PAID, description: '', currency: 'LYD' })}>
                    <Plus className="mr-2 h-4 w-4" /> {t('events.form.addTier')}
                  </Button>
                </div>
                {form.formState.errors.tiers?.root && <p className="text-sm text-red-500">{t('events.validation.nameRequired')}</p>}

                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <Card key={field.id} className="p-4 relative">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>{t('events.form.tierName')}</Label>
                          <Input 
                            {...form.register(`tiers.${index}.name`)}
                          />
                          {form.formState.errors.tiers?.[index]?.name && <p className="text-sm text-red-500">{t('events.validation.nameRequired')}</p>}
                        </div>
                        <div>
                          <Label>{t('events.form.tierType')}</Label>
                          <Controller
                            name={`tiers.${index}.tier_type`}
                            control={form.control}
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('events.form.tierType')} />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.values(TierType).map(type => (
                                    <SelectItem key={type} value={type}>{t(`events.tierTypes.${type}`)}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        </div>
                        <div>
                          <Label>{t('events.form.tierPrice')}</Label>
                          <Input 
                            type="number" 
                            {...form.register(`tiers.${index}.price`)}
                          />
                          {form.formState.errors.tiers?.[index]?.price && <p className="text-sm text-red-500">{t('events.validation.priceRequired')}</p>}
                        </div>
                        <div>
                          <Label>{t('events.form.tierCapacity')}</Label>
                          <Input 
                            type="number" 
                            {...form.register(`tiers.${index}.capacity`)}
                          />
                          {form.formState.errors.tiers?.[index]?.capacity && <p className="text-sm text-red-500">{t('events.validation.maxGuestsMinimum')}</p>}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle>{t('events.form.confirmation')}</CardTitle>
              <CardDescription>{t('events.form.reviewAndPay')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 p-4 border rounded-md">
                <h3 className="font-semibold">{watchedValues.name}</h3>
                <p><strong>{t('events.form.totalCapacity')}:</strong> {watchedValues.event_settings?.max_capacity || 0}</p>
                <p><strong>{t('events.form.tiers')}:</strong> {watchedValues.tiers.length}</p>
                <ul>
                  {watchedValues.tiers.map((tier, i) => <li key={i}>{tier.name} ({formatPrice(tier.price, tier.currency)})</li>)}
                </ul>
              </div>
              <div className="p-4 border rounded-md bg-gray-50">
                <h3 className="font-semibold">{t('events.form.platformFee')}</h3>
                <p className="text-2xl font-bold">{formatPrice(platformFee, 'LYD')}</p>
                <p className="text-sm text-gray-500">{t('events.form.feeCalculation', { count: watchedValues.event_settings?.max_capacity || 0, price: PLATFORM_FEE_PER_GUEST })}</p>
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  const steps = [
    {
      number: 1,
      title: t('events.form.basicInfo'),
      icon: <Calendar />
    },
    {
      number: 2,
      title: t('events.form.tiersAndCapacity'),
      icon: <Users />
    },
    {
      number: 3,
      title: t('events.form.confirmation'),
      icon: <DollarSign />
    },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('events.create')}
        </h1>
        <p className="text-gray-600">
          {t('events.subtitle')}
        </p>
      </div>

      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                currentStep >= step.number
                  ? 'bg-primary-600 border-primary-600 text-white'
                  : 'border-gray-300 text-gray-500'
              }`}>
                {currentStep > step.number ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  step.icon
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  currentStep >= step.number ? 'text-primary-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 h-px bg-gray-300 mx-4" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={form.handleSubmit(onSubmit)}>

        <Card>
          <CardContent className="p-6">
            {renderStep()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {t('common.previous')}
          </Button>

          {currentStep < steps.length ? (
            <Button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2"
            >
              {t('common.next')}
              {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? t('common.loading') : t('events.form.createAndPay')}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}

export default EventCreatePage 