import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { Guest } from '../../database/entities/guest.entity';
import { Event } from '../../database/entities/event.entity';
import { Tier } from '../../database/entities/tier.entity';

export interface EmailTemplateData {
  guest: Guest;
  event: Event;
  tier?: Tier;
  locale?: string;
  registrationLink?: string;
  passLink?: string;
  qrCodeUrl?: string;
  unsubscribeLink?: string;
  isUrgent?: boolean;
  customData?: Record<string, any>;
}

export interface RenderedEmail {
  html: string;
  subject: string;
  locale: string;
  direction: 'ltr' | 'rtl';
}

@Injectable()
export class EmailTemplateService {
  private readonly logger = new Logger(EmailTemplateService.name);
  private readonly templatesPath = path.join(__dirname, '../templates');
  private readonly translationsPath = path.join(__dirname, '../translations');
  private translations: Record<string, any> = {};
  private compiledTemplates: Map<string, Handlebars.TemplateDelegate> = new Map();

  constructor() {
    this.loadTranslations();
    this.registerHandlebarsHelpers();
  }

  /**
   * Load translations from JSON file
   */
  private loadTranslations(): void {
    try {
      const translationsFile = path.join(this.translationsPath, 'email-translations.json');
      const translationsData = fs.readFileSync(translationsFile, 'utf-8');
      this.translations = JSON.parse(translationsData);
      this.logger.log('Email translations loaded successfully');
    } catch (error) {
      this.logger.error('Failed to load email translations:', error);
      this.translations = { en: {}, ar: {} }; // Fallback
    }
  }

  /**
   * Register custom Handlebars helpers
   */
  private registerHandlebarsHelpers(): void {
    // Helper for date formatting
    Handlebars.registerHelper('formatDate', (date: Date, locale: string = 'en') => {
      if (!date) return '';
      
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };
      
      return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', options).format(date);
    });

    // Helper for time formatting
    Handlebars.registerHelper('formatTime', (date: Date, locale: string = 'en') => {
      if (!date) return '';
      
      const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      };
      
      return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', options).format(date);
    });

    // Helper for conditional rendering
    Handlebars.registerHelper('ifEquals', function(this: any, arg1: any, arg2: any, options: any) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });
  }

  /**
   * Get or compile a template
   */
  private getCompiledTemplate(templateName: string): Handlebars.TemplateDelegate {
    if (this.compiledTemplates.has(templateName)) {
      return this.compiledTemplates.get(templateName)!;
    }

    try {
      const templatePath = path.join(this.templatesPath, `${templateName}.hbs`);
      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      const compiled = Handlebars.compile(templateContent);
      
      this.compiledTemplates.set(templateName, compiled);
      this.logger.log(`Template ${templateName} compiled and cached`);
      
      return compiled;
    } catch (error) {
      this.logger.error(`Failed to compile template ${templateName}:`, error);
      throw new Error(`Template ${templateName} not found or compilation failed`);
    }
  }

  /**
   * Render invitation email
   */
  async renderInvitationEmail(data: EmailTemplateData): Promise<RenderedEmail> {
    const locale = data.locale || 'en';
    const direction = locale === 'ar' ? 'rtl' : 'ltr';
    
    const templateData = this.prepareTemplateData(data, 'invitation');
    const template = this.getCompiledTemplate('invitation-template');
    
    const html = template(templateData);
    const subject = this.getSubject('invitation', locale, data.event.name);

    return {
      html,
      subject,
      locale,
      direction
    };
  }

  /**
   * Render reminder email
   */
  async renderReminderEmail(data: EmailTemplateData): Promise<RenderedEmail> {
    const locale = data.locale || 'en';
    const direction = locale === 'ar' ? 'rtl' : 'ltr';
    
    const templateData = this.prepareTemplateData(data, 'reminder');
    const template = this.getCompiledTemplate('reminder-template');
    
    const html = template(templateData);
    const subject = this.getSubject('reminder', locale, data.event.name);

    return {
      html,
      subject,
      locale,
      direction
    };
  }

  /**
   * Prepare template data with translations and formatting
   */
  private prepareTemplateData(data: EmailTemplateData, templateType: string): any {
    const locale = data.locale || 'en';
    const direction = locale === 'ar' ? 'rtl' : 'ltr';
    const translations = this.translations[locale] || this.translations['en'];

    // Format dates and times
    const eventDate = data.event.start_datetime ? 
      Handlebars.helpers.formatDate(data.event.start_datetime, locale) : '';
    const eventTime = data.event.start_datetime ? 
      Handlebars.helpers.formatTime(data.event.start_datetime, locale) : '';

    // Generate registration link if not provided
    const registrationLink = data.registrationLink || 
      `${process.env.FRONTEND_URL || 'http://localhost:3001'}/register/${data.event.id}`;

    // Generate unsubscribe link if not provided
    const unsubscribeLink = data.unsubscribeLink || 
      `${process.env.FRONTEND_URL || 'http://localhost:3001'}/unsubscribe?email=${encodeURIComponent(data.guest.email)}`;

    return {
      // Basic template data
      locale,
      direction,
      translations,
      
      // Guest data
      guestName: data.guest.name,
      guestEmail: data.guest.email,
      
      // Event data
      eventName: data.event.name,
      eventDescription: data.event.description,
      eventDate,
      eventTime,
      venueName: data.event.venue_name,
      venueAddress: data.event.venue_address,
      
      // Tier data
      tierName: data.tier?.name,
      
      // Links
      registrationLink,
      passLink: data.passLink,
      qrCodeUrl: data.qrCodeUrl,
      unsubscribeLink,
      
      // Organizer data
      organizerName: data.event.organizer?.name || 'Event Organizer',
      
      // Template-specific data
      isUrgent: data.isUrgent || false,
      
      // Custom data
      ...data.customData
    };
  }

  /**
   * Get email subject based on template type and locale
   */
  private getSubject(templateType: string, locale: string, eventName: string): string {
    const translations = this.translations[locale] || this.translations['en'];
    
    switch (templateType) {
      case 'invitation':
        return `${translations.youAreInvited} ${eventName}`;
      case 'reminder':
        return `${translations.reminder}: ${eventName}`;
      default:
        return `${eventName} - ${translations.eventInvitation}`;
    }
  }

  /**
   * Generate QR code URL for a guest
   */
  generateQRCodeUrl(guest: Guest, event: Event): string {
    const qrData = {
      guestId: guest.id,
      eventId: event.id,
      email: guest.email,
      timestamp: Date.now()
    };
    
    const encodedData = encodeURIComponent(JSON.stringify(qrData));
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedData}`;
  }

  /**
   * Test template rendering with sample data
   */
  async testTemplate(templateName: string, locale: string = 'en'): Promise<string> {
    const sampleData: EmailTemplateData = {
      guest: {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        registration_date: new Date(),
        check_in_date: null,
        is_checked_in: false,
        additional_info: null,
        event_id: '1',
        tier_id: '1',
        created_at: new Date(),
        updated_at: new Date()
      } as any,
      event: {
        id: '1',
        name: 'Sample Event',
        description: 'This is a sample event for testing email templates.',
        start_datetime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        end_datetime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 4 hours later
        venue_name: 'Sample Venue',
        venue_address: '123 Event Street, City, Country',
        organizer_id: '1',
        created_at: new Date(),
        updated_at: new Date()
      } as any,
      tier: {
        id: '1',
        name: 'VIP',
        description: 'VIP access with premium benefits',
        price: 100,
        capacity: 50,
        available_spots: 25,
        is_default: true,
        event_id: '1',
        created_at: new Date(),
        updated_at: new Date()
      } as any,
      locale,
      isUrgent: false
    };

    if (templateName === 'invitation') {
      const result = await this.renderInvitationEmail(sampleData);
      return result.html;
    } else if (templateName === 'reminder') {
      const result = await this.renderReminderEmail(sampleData);
      return result.html;
    }

    throw new Error(`Unknown template: ${templateName}`);
  }
} 