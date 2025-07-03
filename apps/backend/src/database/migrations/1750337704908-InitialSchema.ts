import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1750337704908 implements MigrationInterface {
    name = 'InitialSchema1750337704908'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create custom enum types
        await queryRunner.query(`
            CREATE TYPE "user_role" AS ENUM('admin', 'organizer', 'staff')
        `);
        
        await queryRunner.query(`
            CREATE TYPE "event_status" AS ENUM('draft', 'published', 'active', 'completed', 'cancelled')
        `);
        
        await queryRunner.query(`
            CREATE TYPE "invite_status" AS ENUM('pending', 'sent', 'delivered', 'failed')
        `);
        
        await queryRunner.query(`
            CREATE TYPE "rsvp_status" AS ENUM('pending', 'accepted', 'declined', 'tentative')
        `);
        
        await queryRunner.query(`
            CREATE TYPE "checkin_status" AS ENUM('not_checked_in', 'checked_in', 'checked_out')
        `);
        
        await queryRunner.query(`
            CREATE TYPE "checkin_method" AS ENUM('manual', 'qr_code', 'nfc', 'mobile')
        `);
        
        await queryRunner.query(`
            CREATE TYPE "staff_role" AS ENUM('organizer', 'check_in_staff', 'viewer')
        `);

        // Create Users table
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying(255) NOT NULL,
                "password_hash" character varying(255) NOT NULL,
                "name" character varying(255) NOT NULL,
                "role" "user_role" NOT NULL,
                "preferred_language" character varying(5) NOT NULL DEFAULT 'en',
                "phone" character varying(20),
                "avatar_url" character varying(500),
                "email_verified" boolean NOT NULL DEFAULT false,
                "is_active" boolean NOT NULL DEFAULT true,
                "last_login_at" TIMESTAMP,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_users_email" UNIQUE ("email")
            )
        `);

        // Create Events table
        await queryRunner.query(`
            CREATE TABLE "events" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "organizer_id" uuid NOT NULL,
                "name" character varying(255) NOT NULL,
                "description" text,
                "status" "event_status" NOT NULL DEFAULT 'draft',
                "tier_id" uuid,
                "capacity_limit" integer,
                "primary_language" character varying(5) NOT NULL DEFAULT 'en',
                "default_plus_n" integer NOT NULL DEFAULT 0,
                "venue_name" character varying(255),
                "venue_address" text,
                "start_datetime" TIMESTAMP NOT NULL,
                "end_datetime" TIMESTAMP NOT NULL,
                "timezone" character varying(50) NOT NULL DEFAULT 'UTC',
                "design_config" jsonb,
                "form_config" jsonb,
                "event_details" jsonb,
                "check_in_enabled" boolean NOT NULL DEFAULT true,
                "check_in_starts_at" TIMESTAMP,
                "check_in_ends_at" TIMESTAMP,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_events_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_events_organizer" FOREIGN KEY ("organizer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
                CONSTRAINT "chk_events_dates" CHECK ("end_datetime" > "start_datetime"),
                CONSTRAINT "chk_events_capacity" CHECK ("capacity_limit" > 0),
                CONSTRAINT "chk_events_plus_n" CHECK ("default_plus_n" >= 0)
            )
        `);

        // Create Tiers table
        await queryRunner.query(`
            CREATE TABLE "tiers" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "event_id" uuid NOT NULL,
                "name" character varying(100) NOT NULL,
                "description" text,
                "guest_limit" integer,
                "price" decimal(10,2) NOT NULL DEFAULT 0.00,
                "currency" character varying(3) NOT NULL DEFAULT 'USD',
                "max_plus_n" integer NOT NULL DEFAULT 0,
                "is_active" boolean NOT NULL DEFAULT true,
                "sort_order" integer NOT NULL DEFAULT 0,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_tiers_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_tiers_event" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "UQ_tiers_event_name" UNIQUE ("event_id", "name"),
                CONSTRAINT "chk_tiers_price" CHECK ("price" >= 0),
                CONSTRAINT "chk_tiers_guest_limit" CHECK ("guest_limit" > 0)
            )
        `);

        // Create Guests table
        await queryRunner.query(`
            CREATE TABLE "guests" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "event_id" uuid NOT NULL,
                "primary_guest_id" uuid,
                "tier_id" uuid NOT NULL,
                "name" character varying(255) NOT NULL,
                "email" character varying(255),
                "phone" character varying(20),
                "invite_status" "invite_status" NOT NULL DEFAULT 'pending',
                "rsvp_status" "rsvp_status" NOT NULL DEFAULT 'pending',
                "checkin_status" "checkin_status" NOT NULL DEFAULT 'not_checked_in',
                "checkin_timestamp" TIMESTAMP,
                "checked_in_by_user_id" uuid,
                "allowed_plus_n_override" integer,
                "custom_field_answers" jsonb,
                "is_primary" boolean NOT NULL DEFAULT true,
                "notes" text,
                "dietary_restrictions" text,
                "accessibility_needs" text,
                "invite_sent_at" TIMESTAMP,
                "rsvp_responded_at" TIMESTAMP,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_guests_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_guests_event" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_guests_primary" FOREIGN KEY ("primary_guest_id") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_guests_tier" FOREIGN KEY ("tier_id") REFERENCES "tiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
                CONSTRAINT "FK_guests_checked_in_by" FOREIGN KEY ("checked_in_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
                CONSTRAINT "chk_guests_plus_n_override" CHECK ("allowed_plus_n_override" >= 0)
            )
        `);

        // Create CheckinRecords table
        await queryRunner.query(`
            CREATE TABLE "checkin_records" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "guest_id" uuid NOT NULL,
                "event_id" uuid NOT NULL,
                "checked_in_by_user_id" uuid NOT NULL,
                "checkin_timestamp" TIMESTAMP NOT NULL DEFAULT now(),
                "checkout_timestamp" TIMESTAMP,
                "present_additional_guest_ids" uuid[],
                "checkin_method" "checkin_method" NOT NULL DEFAULT 'manual',
                "location" character varying(100),
                "device_info" jsonb,
                "notes" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_checkin_records_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_checkin_records_guest" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_checkin_records_event" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_checkin_records_user" FOREIGN KEY ("checked_in_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
                CONSTRAINT "chk_checkin_checkout_order" CHECK ("checkout_timestamp" IS NULL OR "checkout_timestamp" > "checkin_timestamp")
            )
        `);

        // Create EventStaff table
        await queryRunner.query(`
            CREATE TABLE "event_staff" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "event_id" uuid NOT NULL,
                "user_id" uuid NOT NULL,
                "role" "staff_role" NOT NULL,
                "permissions" jsonb,
                "is_active" boolean NOT NULL DEFAULT true,
                "assigned_at" TIMESTAMP NOT NULL DEFAULT now(),
                "assigned_by_user_id" uuid NOT NULL,
                CONSTRAINT "PK_event_staff_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_event_staff_event" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_event_staff_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "FK_event_staff_assigned_by" FOREIGN KEY ("assigned_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
                CONSTRAINT "UQ_event_staff_user_event" UNIQUE ("user_id", "event_id")
            )
        `);

        // Create EventTemplates table
        await queryRunner.query(`
            CREATE TABLE "event_templates" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_by_user_id" uuid NOT NULL,
                "name" character varying(255) NOT NULL,
                "description" text,
                "template_config" jsonb NOT NULL,
                "is_public" boolean NOT NULL DEFAULT false,
                "usage_count" integer NOT NULL DEFAULT 0,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_event_templates_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_event_templates_created_by" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
            )
        `);

        // Add tier_id foreign key to events (circular dependency handled after creation)
        await queryRunner.query(`
            ALTER TABLE "events" ADD CONSTRAINT "FK_events_tier" FOREIGN KEY ("tier_id") REFERENCES "tiers"("id") ON DELETE SET NULL ON UPDATE CASCADE
        `);

        // Create performance indexes
        await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);
        await queryRunner.query(`CREATE INDEX "IDX_users_role" ON "users" ("role")`);
        await queryRunner.query(`CREATE INDEX "IDX_users_is_active" ON "users" ("is_active")`);

        await queryRunner.query(`CREATE INDEX "IDX_events_organizer_id" ON "events" ("organizer_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_events_status" ON "events" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_events_start_datetime" ON "events" ("start_datetime")`);
        await queryRunner.query(`CREATE INDEX "IDX_events_tier_id" ON "events" ("tier_id")`);

        await queryRunner.query(`CREATE INDEX "IDX_tiers_event_id" ON "tiers" ("event_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_tiers_is_active" ON "tiers" ("is_active")`);

        await queryRunner.query(`CREATE INDEX "IDX_guests_event_id" ON "guests" ("event_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_guests_primary_guest_id" ON "guests" ("primary_guest_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_guests_email" ON "guests" ("email")`);
        await queryRunner.query(`CREATE INDEX "IDX_guests_rsvp_status" ON "guests" ("rsvp_status")`);
        await queryRunner.query(`CREATE INDEX "IDX_guests_checkin_status" ON "guests" ("checkin_status")`);
        await queryRunner.query(`CREATE INDEX "IDX_guests_tier_id" ON "guests" ("tier_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_guests_event_checkin" ON "guests" ("event_id", "checkin_status")`);
        await queryRunner.query(`CREATE INDEX "IDX_guests_event_rsvp" ON "guests" ("event_id", "rsvp_status")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_guests_event_email" ON "guests" ("event_id", "email") WHERE "email" IS NOT NULL`);

        await queryRunner.query(`CREATE INDEX "IDX_checkin_records_guest_id" ON "checkin_records" ("guest_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_checkin_records_event_id" ON "checkin_records" ("event_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_checkin_records_timestamp" ON "checkin_records" ("checkin_timestamp")`);
        await queryRunner.query(`CREATE INDEX "IDX_checkin_records_user_id" ON "checkin_records" ("checked_in_by_user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_checkin_records_event_timestamp" ON "checkin_records" ("event_id", "checkin_timestamp")`);

        await queryRunner.query(`CREATE INDEX "IDX_event_staff_event_id" ON "event_staff" ("event_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_event_staff_user_id" ON "event_staff" ("user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_event_staff_role" ON "event_staff" ("role")`);

        await queryRunner.query(`CREATE INDEX "IDX_event_templates_created_by" ON "event_templates" ("created_by_user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_event_templates_is_public" ON "event_templates" ("is_public")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_event_templates_is_public"`);
        await queryRunner.query(`DROP INDEX "IDX_event_templates_created_by"`);
        await queryRunner.query(`DROP INDEX "IDX_event_staff_role"`);
        await queryRunner.query(`DROP INDEX "IDX_event_staff_user_id"`);
        await queryRunner.query(`DROP INDEX "IDX_event_staff_event_id"`);
        await queryRunner.query(`DROP INDEX "IDX_checkin_records_event_timestamp"`);
        await queryRunner.query(`DROP INDEX "IDX_checkin_records_user_id"`);
        await queryRunner.query(`DROP INDEX "IDX_checkin_records_timestamp"`);
        await queryRunner.query(`DROP INDEX "IDX_checkin_records_event_id"`);
        await queryRunner.query(`DROP INDEX "IDX_checkin_records_guest_id"`);
        await queryRunner.query(`DROP INDEX "IDX_guests_event_email"`);
        await queryRunner.query(`DROP INDEX "IDX_guests_event_rsvp"`);
        await queryRunner.query(`DROP INDEX "IDX_guests_event_checkin"`);
        await queryRunner.query(`DROP INDEX "IDX_guests_tier_id"`);
        await queryRunner.query(`DROP INDEX "IDX_guests_checkin_status"`);
        await queryRunner.query(`DROP INDEX "IDX_guests_rsvp_status"`);
        await queryRunner.query(`DROP INDEX "IDX_guests_email"`);
        await queryRunner.query(`DROP INDEX "IDX_guests_primary_guest_id"`);
        await queryRunner.query(`DROP INDEX "IDX_guests_event_id"`);
        await queryRunner.query(`DROP INDEX "IDX_tiers_is_active"`);
        await queryRunner.query(`DROP INDEX "IDX_tiers_event_id"`);
        await queryRunner.query(`DROP INDEX "IDX_events_tier_id"`);
        await queryRunner.query(`DROP INDEX "IDX_events_start_datetime"`);
        await queryRunner.query(`DROP INDEX "IDX_events_status"`);
        await queryRunner.query(`DROP INDEX "IDX_events_organizer_id"`);
        await queryRunner.query(`DROP INDEX "IDX_users_is_active"`);
        await queryRunner.query(`DROP INDEX "IDX_users_role"`);
        await queryRunner.query(`DROP INDEX "IDX_users_email"`);

        // Drop tables (in reverse order of dependencies)
        await queryRunner.query(`DROP TABLE "event_templates"`);
        await queryRunner.query(`DROP TABLE "event_staff"`);
        await queryRunner.query(`DROP TABLE "checkin_records"`);
        await queryRunner.query(`DROP TABLE "guests"`);
        await queryRunner.query(`DROP TABLE "tiers"`);
        await queryRunner.query(`DROP TABLE "events"`);
        await queryRunner.query(`DROP TABLE "users"`);

        // Drop custom types
        await queryRunner.query(`DROP TYPE "staff_role"`);
        await queryRunner.query(`DROP TYPE "checkin_method"`);
        await queryRunner.query(`DROP TYPE "checkin_status"`);
        await queryRunner.query(`DROP TYPE "rsvp_status"`);
        await queryRunner.query(`DROP TYPE "invite_status"`);
        await queryRunner.query(`DROP TYPE "event_status"`);
        await queryRunner.query(`DROP TYPE "user_role"`);
    }
}
