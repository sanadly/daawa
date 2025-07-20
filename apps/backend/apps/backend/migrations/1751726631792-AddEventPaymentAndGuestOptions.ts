import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEventPaymentAndGuestOptions1751726631792 implements MigrationInterface {
    name = 'AddEventPaymentAndGuestOptions1751726631792'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" ADD "is_paid" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`CREATE TYPE "public"."events_payment_status_enum" AS ENUM('pending', 'paid', 'failed')`);
        await queryRunner.query(`ALTER TABLE "events" ADD "payment_status" "public"."events_payment_status_enum"`);
        await queryRunner.query(`ALTER TABLE "events" ADD "invitation_price" numeric(10,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "events" ADD "allow_self_registration" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "allow_self_registration"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "invitation_price"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "payment_status"`);
        await queryRunner.query(`DROP TYPE "public"."events_payment_status_enum"`);
        await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "is_paid"`);
    }

}
