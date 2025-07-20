import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUserEntityForCompanySupport1751689411775 implements MigrationInterface {
    name = 'UpdateUserEntityForCompanySupport1751689411775'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_account_type_enum" AS ENUM('individual', 'company')`);
        await queryRunner.query(`ALTER TABLE "users" ADD "account_type" "public"."users_account_type_enum" NOT NULL DEFAULT 'individual'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "company_name" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "company_registration_number" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "company_website" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "company_address" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "job_title" character varying(100)`);
        await queryRunner.query(`ALTER TYPE "public"."users_role_enum" RENAME TO "users_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'company_organizer', 'individual_organizer', 'staff')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"text"::"public"."users_role_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum_old"`);
        await queryRunner.query(`CREATE INDEX "IDX_7168f7c9863744429de421cad1" ON "users" ("account_type") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_7168f7c9863744429de421cad1"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum_old" AS ENUM('admin', 'organizer', 'staff')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum_old" USING "role"::"text"::"public"."users_role_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."users_role_enum_old" RENAME TO "users_role_enum"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "job_title"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "company_address"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "company_website"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "company_registration_number"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "company_name"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "account_type"`);
        await queryRunner.query(`DROP TYPE "public"."users_account_type_enum"`);
    }

}
