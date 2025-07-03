import { Injectable, Logger } from '@nestjs/common';
import { Event } from '../database/entities/event.entity';

export interface EmailNotification {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

export interface WebhookNotification {
  url: string;
  method: 'POST' | 'PUT';
  headers: Record<string, string>;
  payload: any;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  /**
   * Send notifications when an event is activated
   */
  async sendEventActivationNotifications(event: Event, registrationLink: string): Promise<void> {
    this.logger.log(`Sending activation notifications for event ${event.id}`);
    
    try {
      // Send email to organizer
      await this.sendOrganizerActivationEmail(event, registrationLink);
    
      // Send webhook notifications to integrated systems
      await this.sendActivationWebhooks(event, registrationLink);
      
      // Send in-app notifications
      await this.createInAppNotifications(event, 'activated', registrationLink);
      
      this.logger.log(`Successfully sent activation notifications for event ${event.id}`);
    } catch (error) {
      this.logger.error(`Failed to send activation notifications for event ${event.id}:`, error);
      throw error;
    }
  }

  /**
   * Send notifications when an event is deactivated
   */
  async sendEventDeactivationNotifications(event: Event, reason?: string): Promise<void> {
    this.logger.log(`Sending deactivation notifications for event ${event.id}`);
    
    try {
      // Send email to organizer
      await this.sendOrganizerDeactivationEmail(event, reason);
      
      // Send webhook notifications to integrated systems
      await this.sendDeactivationWebhooks(event, reason);
      
      // Send in-app notifications
      await this.createInAppNotifications(event, 'deactivated', undefined, reason);
      
      this.logger.log(`Successfully sent deactivation notifications for event ${event.id}`);
    } catch (error) {
      this.logger.error(`Failed to send deactivation notifications for event ${event.id}:`, error);
      throw error;
    }
  }

  /**
   * Send activation email to event organizer
   */
  private async sendOrganizerActivationEmail(event: Event, registrationLink: string): Promise<void> {
    const emailData: EmailNotification = {
      to: event.organizer?.email || 'organizer@example.com', // TODO: Get actual organizer email
      subject: `🎉 Your event "${event.name}" is now live!`,
      body: this.generateActivationEmailText(event, registrationLink),
      html: this.generateActivationEmailHtml(event, registrationLink),
    };

    await this.sendEmail(emailData);
    this.logger.log(`Activation email sent to organizer for event ${event.id}`);
  }

  /**
   * Send deactivation email to event organizer
   */
  private async sendOrganizerDeactivationEmail(event: Event, reason?: string): Promise<void> {
    const emailData: EmailNotification = {
      to: event.organizer?.email || 'organizer@example.com', // TODO: Get actual organizer email
      subject: `📋 Event "${event.name}" has been deactivated`,
      body: this.generateDeactivationEmailText(event, reason),
      html: this.generateDeactivationEmailHtml(event, reason),
    };

    await this.sendEmail(emailData);
    this.logger.log(`Deactivation email sent to organizer for event ${event.id}`);
    }
    
  /**
   * Send webhook notifications for activation
   */
  private async sendActivationWebhooks(event: Event, registrationLink: string): Promise<void> {
    // TODO: Get webhook URLs from event configuration or environment variables
    const webhookUrls = process.env.ACTIVATION_WEBHOOK_URLS?.split(',') || [];
    
    const payload = {
      type: 'event.activated',
      event: {
        id: event.id,
        name: event.name,
        organizer_id: event.organizer_id,
        venue: event.venue_name,
        start_date: event.start_datetime,
        end_date: event.end_datetime,
        capacity: event.capacity_limit,
        status: event.status,
      },
      registration_link: registrationLink,
      timestamp: new Date().toISOString(),
    };

    for (const url of webhookUrls) {
      if (url.trim()) {
        await this.sendWebhook({
          url: url.trim(),
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Daawa-Events/1.0',
          },
          payload,
        });
      }
    }
  }

  /**
   * Send webhook notifications for deactivation
   */
  private async sendDeactivationWebhooks(event: Event, reason?: string): Promise<void> {
    // TODO: Get webhook URLs from event configuration or environment variables
    const webhookUrls = process.env.DEACTIVATION_WEBHOOK_URLS?.split(',') || [];
    
    const payload = {
      type: 'event.deactivated',
      event: {
        id: event.id,
        name: event.name,
        organizer_id: event.organizer_id,
        venue: event.venue_name,
        start_date: event.start_datetime,
        end_date: event.end_datetime,
        status: event.status,
      },
      reason,
      timestamp: new Date().toISOString(),
    };

    for (const url of webhookUrls) {
      if (url.trim()) {
        await this.sendWebhook({
          url: url.trim(),
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Daawa-Events/1.0',
          },
          payload,
        });
      }
    }
  }

  /**
   * Create in-app notifications (placeholder for future implementation)
   */
  private async createInAppNotifications(
    event: Event, 
    action: 'activated' | 'deactivated', 
    registrationLink?: string, 
    reason?: string
  ): Promise<void> {
    this.logger.log(`Creating in-app notification: Event ${event.id} ${action}`);
    
    // TODO: Implement in-app notification storage and delivery
    // This would typically store notifications in a database table
    // and send real-time updates via WebSocket or SSE
    
    const notification = {
      user_id: event.organizer_id,
      type: `event_${action}`,
      title: action === 'activated' 
        ? `Event "${event.name}" is now live!`
        : `Event "${event.name}" has been deactivated`,
      message: action === 'activated'
        ? `Your event is now active and accepting registrations.`
        : `Your event has been deactivated${reason ? `: ${reason}` : '.'}`,
      data: {
        event_id: event.id,
        event_name: event.name,
        action,
        registration_link: registrationLink,
        reason,
        timestamp: new Date().toISOString(),
      },
      read: false,
      created_at: new Date(),
    };

    this.logger.debug('In-app notification data:', notification);
  }

  /**
   * Send email (placeholder for actual email service integration)
   */
  private async sendEmail(emailData: EmailNotification): Promise<void> {
    // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
    this.logger.log(`Sending email to: ${emailData.to}`);
    this.logger.log(`Subject: ${emailData.subject}`);
    this.logger.debug('Email content:', emailData.body);
    
    // In a real implementation, this would use an email service provider
    // Example with SendGrid:
    // await this.sendGridService.send(emailData);
    
    // For now, just log the email content
    console.log('📧 EMAIL NOTIFICATION:');
    console.log(`To: ${emailData.to}`);
    console.log(`Subject: ${emailData.subject}`);
    console.log(`Body: ${emailData.body}`);
    console.log('---');
  }

  /**
   * Send webhook notification
   */
  private async sendWebhook(webhook: WebhookNotification): Promise<void> {
    try {
      // TODO: Implement actual HTTP request to webhook URL
      this.logger.log(`Sending webhook to: ${webhook.url}`);
      this.logger.debug('Webhook payload:', webhook.payload);
      
      // In a real implementation, this would use fetch or axios
      // Example:
      // const response = await fetch(webhook.url, {
      //   method: webhook.method,
      //   headers: webhook.headers,
      //   body: JSON.stringify(webhook.payload),
      // });
      
      // For now, just log the webhook
      console.log('🔗 WEBHOOK NOTIFICATION:');
      console.log(`URL: ${webhook.url}`);
      console.log(`Method: ${webhook.method}`);
      console.log(`Payload:`, JSON.stringify(webhook.payload, null, 2));
      console.log('---');
      
    } catch (error) {
      this.logger.error(`Failed to send webhook to ${webhook.url}:`, error);
      throw error;
    }
  }

  /**
   * Generate activation email text content
   */
  private generateActivationEmailText(event: Event, registrationLink: string): string {
    return `
Congratulations! Your event "${event.name}" is now live and accepting registrations.

Event Details:
- Name: ${event.name}
- Venue: ${event.venue_name}
- Start: ${event.start_datetime}
- End: ${event.end_datetime}

Registration Link: ${registrationLink}

You can now share this registration link with your attendees. The event registration is active and guests can start signing up.

Best regards,
The Daawa Events Team
    `.trim();
  }

  /**
   * Generate activation email HTML content
   */
  private generateActivationEmailHtml(event: Event, registrationLink: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Event Activated</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4f46e5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .event-details { background: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .cta-button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Your Event is Live!</h1>
        </div>
        <div class="content">
            <p>Congratulations! Your event "<strong>${event.name}</strong>" is now active and accepting registrations.</p>
            
            <div class="event-details">
                <h3>Event Details:</h3>
                <p><strong>Name:</strong> ${event.name}</p>
                <p><strong>Venue:</strong> ${event.venue_name}</p>
                <p><strong>Start:</strong> ${event.start_datetime}</p>
                <p><strong>End:</strong> ${event.end_datetime}</p>
            </div>
            
            <p>You can now share the registration link with your attendees:</p>
            <a href="${registrationLink}" class="cta-button">View Registration Page</a>
            
            <p>Copy this link to share: <br><code>${registrationLink}</code></p>
        </div>
        <div class="footer">
            <p>Best regards,<br>The Daawa Events Team</p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }

  /**
   * Generate deactivation email text content
   */
  private generateDeactivationEmailText(event: Event, reason?: string): string {
    return `
Your event "${event.name}" has been deactivated.

Event Details:
- Name: ${event.name}
- Venue: ${event.venue_name}
- Start: ${event.start_datetime}
- End: ${event.end_datetime}

${reason ? `Reason: ${reason}` : ''}

The event is no longer accepting new registrations. If you believe this was done in error, please contact support.

Best regards,
The Daawa Events Team
    `.trim();
  }

  /**
   * Generate deactivation email HTML content
   */
  private generateDeactivationEmailHtml(event: Event, reason?: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Event Deactivated</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .event-details { background: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .reason { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📋 Event Deactivated</h1>
        </div>
        <div class="content">
            <p>Your event "<strong>${event.name}</strong>" has been deactivated.</p>
            
            <div class="event-details">
                <h3>Event Details:</h3>
                <p><strong>Name:</strong> ${event.name}</p>
                <p><strong>Venue:</strong> ${event.venue_name}</p>
                <p><strong>Start:</strong> ${event.start_datetime}</p>
                <p><strong>End:</strong> ${event.end_datetime}</p>
            </div>
            
            ${reason ? `<div class="reason"><h3>Reason:</h3><p>${reason}</p></div>` : ''}
            
            <p>The event is no longer accepting new registrations. If you believe this was done in error, please contact support.</p>
        </div>
        <div class="footer">
            <p>Best regards,<br>The Daawa Events Team</p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }
} 