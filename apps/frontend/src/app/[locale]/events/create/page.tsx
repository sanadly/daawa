'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateEventData, CreateTierData, eventsAPI } from '../../../../lib/events/api';
import { ProtectedRoute } from '../../../../lib/auth/components/ProtectedRoute';

// Step 1: Event Details
const EventDetailsStep = ({ 
  data, 
  updateData, 
  errors 
}: { 
  data: Partial<CreateEventData>; 
  updateData: (updates: Partial<CreateEventData>) => void;
  errors: Record<string, string>;
}) => {
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Event Name *
        </label>
        <input
          type="text"
          id="name"
          value={data.name || ''}
          onChange={(e) => updateData({ name: e.target.value })}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
            errors.name ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Enter event name"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          id="description"
          rows={4}
          value={data.description || ''}
          onChange={(e) => updateData({ description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="Describe your event"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="start_datetime" className="block text-sm font-medium text-gray-700 mb-2">
            Start Date & Time *
          </label>
          <input
            type="datetime-local"
            id="start_datetime"
            value={data.start_datetime || ''}
            onChange={(e) => updateData({ start_datetime: e.target.value })}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
              errors.start_datetime ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.start_datetime && <p className="mt-1 text-sm text-red-600">{errors.start_datetime}</p>}
        </div>

        <div>
          <label htmlFor="end_datetime" className="block text-sm font-medium text-gray-700 mb-2">
            End Date & Time *
          </label>
          <input
            type="datetime-local"
            id="end_datetime"
            value={data.end_datetime || ''}
            onChange={(e) => updateData({ end_datetime: e.target.value })}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
              errors.end_datetime ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.end_datetime && <p className="mt-1 text-sm text-red-600">{errors.end_datetime}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="venue_name" className="block text-sm font-medium text-gray-700 mb-2">
            Venue Name
          </label>
          <input
            type="text"
            id="venue_name"
            value={data.venue_name || ''}
            onChange={(e) => updateData({ venue_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter venue name"
          />
        </div>

        <div>
          <label htmlFor="capacity_limit" className="block text-sm font-medium text-gray-700 mb-2">
            Capacity Limit
          </label>
          <input
            type="number"
            id="capacity_limit"
            min="1"
            value={data.capacity_limit || ''}
            onChange={(e) => updateData({ capacity_limit: e.target.value ? parseInt(e.target.value) : undefined })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Maximum attendees"
          />
        </div>
      </div>

      <div>
        <label htmlFor="venue_address" className="block text-sm font-medium text-gray-700 mb-2">
          Venue Address
        </label>
        <textarea
          id="venue_address"
          rows={3}
          value={data.venue_address || ''}
          onChange={(e) => updateData({ venue_address: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter full venue address"
        />
      </div>
    </div>
  );
};

// Step 2: Tier Configuration
const TierConfigurationStep = ({ 
  tiers, 
  setTiers 
}: { 
  tiers: CreateTierData[]; 
  setTiers: (tiers: CreateTierData[]) => void;
}) => {
  const addTier = () => {
    setTiers([
      ...tiers,
      {
        name: '',
        description: '',
        price: 0,
        currency: 'USD',
        guest_limit: undefined,
        max_plus_n: 0,
        is_active: true,
        sort_order: tiers.length,
      }
    ]);
  };

  const updateTier = (index: number, updates: Partial<CreateTierData>) => {
    const updatedTiers = [...tiers];
    updatedTiers[index] = { ...updatedTiers[index], ...updates };
    setTiers(updatedTiers);
  };

  const removeTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Event Tiers</h3>
          <p className="text-gray-600">Configure different ticket types or access levels for your event</p>
        </div>
        <button
          type="button"
          onClick={addTier}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          Add Tier
        </button>
      </div>

      {tiers.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 mb-4">No tiers configured yet</p>
          <button
            type="button"
            onClick={addTier}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            Add Your First Tier
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {tiers.map((tier, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium text-gray-900">Tier {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => removeTier(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tier Name *
                  </label>
                  <input
                    type="text"
                    value={tier.name}
                    onChange={(e) => updateTier(index, { name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., General Admission, VIP"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price
                  </label>
                  <div className="flex">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={tier.price}
                      onChange={(e) => updateTier(index, { price: parseFloat(e.target.value) || 0 })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <select
                      value={tier.currency}
                      onChange={(e) => updateTier(index, { currency: e.target.value })}
                      className="px-3 py-2 border-t border-r border-b border-gray-300 rounded-r-md bg-gray-50"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Guest Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={tier.guest_limit || ''}
                    onChange={(e) => updateTier(index, { 
                      guest_limit: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Leave empty for unlimited"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Plus N
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={tier.max_plus_n}
                    onChange={(e) => updateTier(index, { max_plus_n: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={tier.description || ''}
                  onChange={(e) => updateTier(index, { description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe what this tier includes"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Step 3: Form Configuration
const FormConfigurationStep = ({ 
  data, 
  updateData 
}: { 
  data: Partial<CreateEventData>; 
  updateData: (updates: Partial<CreateEventData>) => void;
}) => {
  const formConfig = data.form_config || { fields: [], settings: {} };
  
  const updateFormConfig = (updates: any) => {
    updateData({ 
      form_config: { ...formConfig, ...updates } 
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Form Settings</h3>
        <p className="text-gray-600">Configure how guests will register for your event</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="default_plus_n" className="block text-sm font-medium text-gray-700 mb-2">
            Default Plus N
          </label>
          <input
            type="number"
            id="default_plus_n"
            min="0"
            value={data.default_plus_n || 0}
            onChange={(e) => updateData({ default_plus_n: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">Number of additional guests allowed by default</p>
        </div>

        <div>
          <label htmlFor="primary_language" className="block text-sm font-medium text-gray-700 mb-2">
            Primary Language
          </label>
          <select
            id="primary_language"
            value={data.primary_language || 'en'}
            onChange={(e) => updateData({ primary_language: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="ar">Arabic</option>
          </select>
        </div>
      </div>

      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={data.check_in_enabled ?? true}
            onChange={(e) => updateData({ check_in_enabled: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Enable check-in functionality</span>
        </label>
      </div>

      {data.check_in_enabled !== false && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="check_in_starts_at" className="block text-sm font-medium text-gray-700 mb-2">
              Check-in Starts At
            </label>
            <input
              type="datetime-local"
              id="check_in_starts_at"
              value={data.check_in_starts_at || ''}
              onChange={(e) => updateData({ check_in_starts_at: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="check_in_ends_at" className="block text-sm font-medium text-gray-700 mb-2">
              Check-in Ends At
            </label>
            <input
              type="datetime-local"
              id="check_in_ends_at"
              value={data.check_in_ends_at || ''}
              onChange={(e) => updateData({ check_in_ends_at: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Step 4: Design Configuration
const DesignConfigurationStep = ({ 
  data, 
  updateData 
}: { 
  data: Partial<CreateEventData>; 
  updateData: (updates: Partial<CreateEventData>) => void;
}) => {
  const designConfig = data.design_config || { theme: 'default', colors: {}, logo: null };
  
  const updateDesignConfig = (updates: any) => {
    updateData({ 
      design_config: { ...designConfig, ...updates } 
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Design & Branding</h3>
        <p className="text-gray-600">Customize the look and feel of your event pages</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primary Color
          </label>
          <input
            type="color"
            value={designConfig.colors?.primary || '#3B82F6'}
            onChange={(e) => updateDesignConfig({ 
              colors: { ...designConfig.colors, primary: e.target.value } 
            })}
            className="w-full h-10 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Secondary Color
          </label>
          <input
            type="color"
            value={designConfig.colors?.secondary || '#10B981'}
            onChange={(e) => updateDesignConfig({ 
              colors: { ...designConfig.colors, secondary: e.target.value } 
            })}
            className="w-full h-10 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Theme
        </label>
        <select
          value={designConfig.theme || 'default'}
          onChange={(e) => updateDesignConfig({ theme: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="default">Default</option>
          <option value="modern">Modern</option>
          <option value="elegant">Elegant</option>
          <option value="minimal">Minimal</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Event Logo
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="mt-4">
            <label htmlFor="logo-upload" className="cursor-pointer">
              <span className="mt-2 block text-sm font-medium text-gray-900">
                Upload a logo
              </span>
              <input id="logo-upload" name="logo-upload" type="file" className="sr-only" accept="image/*" />
            </label>
            <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 2MB</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main component
export default function CreateEvent() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [eventData, setEventData] = useState<Partial<CreateEventData>>({
    timezone: 'UTC',
    primary_language: 'en',
    default_plus_n: 0,
    check_in_enabled: true,
  });
  const [tiers, setTiers] = useState<CreateTierData[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const updateEventData = (updates: Partial<CreateEventData>) => {
    setEventData(prev => ({ ...prev, ...updates }));
    // Clear related errors
    const newErrors = { ...errors };
    Object.keys(updates).forEach(key => {
      delete newErrors[key];
    });
    setErrors(newErrors);
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!eventData.name?.trim()) {
        newErrors.name = 'Event name is required';
      }
      if (!eventData.start_datetime) {
        newErrors.start_datetime = 'Start date and time is required';
      }
      if (!eventData.end_datetime) {
        newErrors.end_datetime = 'End date and time is required';
      }
      if (eventData.start_datetime && eventData.end_datetime) {
        if (new Date(eventData.start_datetime) >= new Date(eventData.end_datetime)) {
          newErrors.end_datetime = 'End date must be after start date';
        }
        if (new Date(eventData.start_datetime) <= new Date()) {
          newErrors.start_datetime = 'Start date must be in the future';
        }
      }
    }

    if (step === 2) {
      if (tiers.length === 0) {
        newErrors.tiers = 'At least one tier is required';
      } else {
        tiers.forEach((tier, index) => {
          if (!tier.name?.trim()) {
            newErrors[`tier_${index}_name`] = `Tier ${index + 1} name is required`;
          }
        });
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (asDraft = true) => {
    if (!validateStep(currentStep)) return;

    try {
      setLoading(true);
      
      // Create the event
      const createdEvent = await eventsAPI.createEvent(eventData as CreateEventData);
      
      // Add tiers to the event
      for (const tier of tiers) {
        await eventsAPI.addTier(createdEvent.id, tier);
      }

      // Redirect to event details or dashboard
      router.push(asDraft ? `/events/${createdEvent.id}` : '/dashboard');
    } catch (error) {
      console.error('Failed to create event:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to create event' });
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { title: 'Event Details', component: EventDetailsStep },
    { title: 'Tier Configuration', component: TierConfigurationStep },
    { title: 'Form Configuration', component: FormConfigurationStep },
    { title: 'Design & Preview', component: DesignConfigurationStep },
  ];

  const StepComponent = steps[currentStep - 1].component;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
            <p className="text-gray-600">Set up your event step by step</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      index + 1 === currentStep
                        ? 'bg-blue-600 text-white'
                        : index + 1 < currentStep
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {index + 1 < currentStep ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className={`mt-2 text-xs font-medium ${
                    index + 1 === currentStep ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {steps[currentStep - 1].title}
            </h2>

            {StepComponent === EventDetailsStep && (
              <EventDetailsStep 
                data={eventData} 
                updateData={updateEventData} 
                errors={errors} 
              />
            )}
            {StepComponent === TierConfigurationStep && (
              <TierConfigurationStep 
                tiers={tiers} 
                setTiers={setTiers} 
              />
            )}
            {StepComponent === FormConfigurationStep && (
              <FormConfigurationStep 
                data={eventData} 
                updateData={updateEventData} 
              />
            )}
            {StepComponent === DesignConfigurationStep && (
              <DesignConfigurationStep 
                data={eventData} 
                updateData={updateEventData} 
              />
            )}

            {errors.submit && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600">{errors.submit}</p>
              </div>
            )}

            {Object.keys(errors).filter(k => k.startsWith('tier_')).length > 0 && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600">Please fix the tier validation errors above.</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 1}
              className={`px-4 py-2 border border-gray-300 rounded-md font-medium ${
                currentStep === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Save Draft
              </button>

              {currentStep < steps.length ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Event'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 