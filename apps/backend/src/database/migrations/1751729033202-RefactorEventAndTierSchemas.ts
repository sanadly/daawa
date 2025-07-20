import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorEventAndTierSchemas1751729033202 implements MigrationInterface {
    name = 'RefactorEventAndTierSchemas1751729033202'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_0cf2f288dd4011eb8d54cca9699"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0cf2f288dd4011eb8d54cca969"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "chk_events_capacity"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "tier_id"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "capacity_limit"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "event_details"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "is_paid"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "payment_status"`);
        await queryRunner.query(`DROP TYPE "public"."events_payment_status_enum"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "invitation_price"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "allow_self_registration"`);
        await queryRunner.query(`CREATE TYPE "public"."events_platform_payment_status_enum" AS ENUM('pending', 'paid', 'failed', 'refunded')`);
        await queryRunner.query(`ALTER TABLE "events" ADD "platform_payment_status" "public"."events_platform_payment_status_enum" NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`ALTER TABLE "events" ADD "platform_fee" numeric(10,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "events" ADD "platform_currency" character varying(3) NOT NULL DEFAULT 'LYD'`);
        await queryRunner.query(`ALTER TABLE "events" ADD "platform_payment_reference" text`);
        await queryRunner.query(`ALTER TABLE "events" ADD "platform_payment_date" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "events" ADD "event_settings" jsonb`);
        await queryRunner.query(`ALTER TABLE "events" ADD "metadata" jsonb`);
        await queryRunner.query(`CREATE TYPE "public"."tiers_tier_type_enum" AS ENUM('free', 'paid', 'vip', 'sponsor', 'student', 'early_bird')`);
        await queryRunner.query(`ALTER TABLE "tiers" ADD "tier_type" "public"."tiers_tier_type_enum" NOT NULL DEFAULT 'free'`);
        await queryRunner.query(`ALTER TABLE "tiers" ADD "registered_count" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "tiers" ADD "sale_starts_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "tiers" ADD "sale_ends_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "tiers" ADD "tier_settings" jsonb`);
        await queryRunner.query(`ALTER TABLE "tiers" ADD "access_config" jsonb`);
        await queryRunner.query(`ALTER TYPE "public"."events_status_enum" RENAME TO "events_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."events_status_enum" AS ENUM('draft', 'pending_payment', 'published', 'active', 'completed', 'cancelled')`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "status" TYPE "public"."events_status_enum" USING "status"::"text"::"public"."events_status_enum"`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "status" SET DEFAULT 'draft'`);
        await queryRunner.query(`DROP TYPE "public"."events_status_enum_old"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_66a622425d6a5028cccf811c38"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "start_datetime"`);
        await queryRunner.query(`ALTER TABLE "events" ADD "start_datetime" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "end_datetime"`);
        await queryRunner.query(`ALTER TABLE "events" ADD "end_datetime" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "check_in_starts_at"`);
        await queryRunner.query(`ALTER TABLE "events" ADD "check_in_starts_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "check_in_ends_at"`);
        await queryRunner.query(`ALTER TABLE "events" ADD "check_in_ends_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "tiers" ALTER COLUMN "currency" SET DEFAULT 'LYD'`);
        
        // Update tiers guest_limit constraint to handle NULL values
        await queryRunner.query(`ALTER TABLE "tiers" DROP CONSTRAINT IF EXISTS "chk_tiers_guest_limit"`);
        await queryRunner.query(`ALTER TABLE "tiers" ADD CONSTRAINT "chk_tiers_guest_limit" CHECK (guest_limit IS NULL OR guest_limit > 0)`);
        
        await queryRunner.query(`ALTER TYPE "public"."user_activities_activity_type_enum" RENAME TO "user_activities_activity_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."user_activities_activity_type_enum" AS ENUM('login', 'logout', 'profile_update', 'password_change', 'email_verification', 'password_reset', 'role_assignment', 'account_deactivation', 'account_reactivation', 'two_factor_enabled', 'two_factor_disabled', 'failed_login', 'account_locked', 'account_unlocked', 'event_activated', 'event_deactivated', 'event_created', 'event_updated', 'event_cancelled', 'event_payment_status_update', 'USER_LOGIN', 'USER_LOGOUT', 'USER_REGISTER', 'USER_UPDATED', 'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_SUCCESS', 'EVENT_DELETED', 'GUEST_ADDED', 'GUEST_UPDATED', 'GUEST_DELETED')`);
        await queryRunner.query(`ALTER TABLE "user_activities" ALTER COLUMN "activity_type" TYPE "public"."user_activities_activity_type_enum" USING "activity_type"::"text"::"public"."user_activities_activity_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_activities_activity_type_enum_old"`);
        await queryRunner.query(`CREATE INDEX "IDX_7ebab07668bb225b6a04782a7d" ON "events" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_f61377ad218e541961d5f4e517" ON "events" ("platform_payment_status") `);
        await queryRunner.query(`CREATE INDEX "IDX_66a622425d6a5028cccf811c38" ON "events" ("start_datetime") `);
        await queryRunner.query(`CREATE INDEX "IDX_39d282a1af6fbe15b055d30409" ON "tiers" ("event_id", "sort_order") `);
        await queryRunner.query(`CREATE INDEX "IDX_898d6f7123803e3ebeaca672f8" ON "tiers" ("tier_type") `);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "chk_events_platform_fee" CHECK (platform_fee >= 0)`);
        await queryRunner.query(`ALTER TABLE "tiers" ADD CONSTRAINT "chk_tiers_max_plus_n" CHECK (max_plus_n >= 0)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tiers" DROP CONSTRAINT "chk_tiers_max_plus_n"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "chk_events_platform_fee"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_898d6f7123803e3ebeaca672f8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_39d282a1af6fbe15b055d30409"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_66a622425d6a5028cccf811c38"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f61377ad218e541961d5f4e517"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7ebab07668bb225b6a04782a7d"`);
        await queryRunner.query(`CREATE TYPE "public"."user_activities_activity_type_enum_old" AS ENUM('login', 'logout', 'profile_update', 'password_change', 'email_verification', 'password_reset', 'role_assignment', 'account_deactivation', 'account_reactivation', 'two_factor_enabled', 'two_factor_disabled', 'failed_login', 'account_locked', 'account_unlocked', 'event_activated', 'event_deactivated', 'event_created', 'event_updated', 'event_cancelled')`);
        await queryRunner.query(`ALTER TABLE "user_activities" ALTER COLUMN "activity_type" TYPE "public"."user_activities_activity_type_enum_old" USING "activity_type"::"text"::"public"."user_activities_activity_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."user_activities_activity_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."user_activities_activity_type_enum_old" RENAME TO "user_activities_activity_type_enum"`);
        
        // Restore original tiers constraint
        await queryRunner.query(`ALTER TABLE "tiers" DROP CONSTRAINT "chk_tiers_guest_limit"`);
        await queryRunner.query(`ALTER TABLE "tiers" ADD CONSTRAINT "chk_tiers_guest_limit" CHECK (guest_limit > 0)`);
        
        await queryRunner.query(`ALTER TABLE "tiers" ALTER COLUMN "currency" SET DEFAULT 'USD'`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "check_in_ends_at"`);
        await queryRunner.query(`ALTER TABLE "events" ADD "check_in_ends_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "check_in_starts_at"`);
        await queryRunner.query(`ALTER TABLE "events" ADD "check_in_starts_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "end_datetime"`);
        await queryRunner.query(`ALTER TABLE "events" ADD "end_datetime" TIMESTAMP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "start_datetime"`);
        await queryRunner.query(`ALTER TABLE "events" ADD "start_datetime" TIMESTAMP NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_66a622425d6a5028cccf811c38" ON "events" ("start_datetime") `);
        await queryRunner.query(`CREATE TYPE "public"."events_status_enum_old" AS ENUM('draft', 'published', 'active', 'completed', 'cancelled')`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "status" TYPE "public"."events_status_enum_old" USING "status"::"text"::"public"."events_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "events" ALTER COLUMN "status" SET DEFAULT 'draft'`);
        await queryRunner.query(`DROP TYPE "public"."events_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."events_status_enum_old" RENAME TO "events_status_enum"`);
        await queryRunner.query(`ALTER TABLE "tiers" DROP COLUMN "access_config"`);
        await queryRunner.query(`ALTER TABLE "tiers" DROP COLUMN "tier_settings"`);
        await queryRunner.query(`ALTER TABLE "tiers" DROP COLUMN "sale_ends_at"`);
        await queryRunner.query(`ALTER TABLE "tiers" DROP COLUMN "sale_starts_at"`);
        await queryRunner.query(`ALTER TABLE "tiers" DROP COLUMN "registered_count"`);
        await queryRunner.query(`ALTER TABLE "tiers" DROP COLUMN "tier_type"`);
        await queryRunner.query(`DROP TYPE "public"."tiers_tier_type_enum"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "metadata"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "event_settings"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "platform_payment_date"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "platform_payment_reference"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "platform_currency"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "platform_fee"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "platform_payment_status"`);
        await queryRunner.query(`DROP TYPE "public"."events_platform_payment_status_enum"`);
        await queryRunner.query(`ALTER TABLE "events" ADD "allow_self_registration" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "events" ADD "invitation_price" numeric(10,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`CREATE TYPE "public"."events_payment_status_enum" AS ENUM('pending', 'paid', 'failed')`);
        await queryRunner.query(`ALTER TABLE "events" ADD "payment_status" "public"."events_payment_status_enum"`);
        await queryRunner.query(`ALTER TABLE "events" ADD "is_paid" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "events" ADD "event_details" jsonb`);
        await queryRunner.query(`ALTER TABLE "events" ADD "capacity_limit" integer`);
        await queryRunner.query(`ALTER TABLE "events" ADD "tier_id" uuid`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "chk_events_capacity" CHECK ((capacity_limit > 0))`);
        await queryRunner.query(`CREATE INDEX "IDX_0cf2f288dd4011eb8d54cca969" ON "events" ("tier_id") `);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_0cf2f288dd4011eb8d54cca9699" FOREIGN KEY ("tier_id") REFERENCES "tiers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
