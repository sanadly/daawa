import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCompanyUserManagement1751721858252 implements MigrationInterface {
    name = 'AddCompanyUserManagement1751721858252'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_account_type_enum" AS ENUM('individual', 'company')`);
        await queryRunner.query(`ALTER TABLE "users" ADD "account_type" "public"."users_account_type_enum" NOT NULL DEFAULT 'individual'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "company_name" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "company_registration_number" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "company_website" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "company_address" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "job_title" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "managing_organization_id" uuid`);
        await queryRunner.query(`ALTER TYPE "public"."user_role" RENAME TO "user_role_old"`);
        await queryRunner.query(`CREATE TYPE "public"."user_role" AS ENUM('admin', 'company_organizer', 'individual_organizer', 'staff')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."user_role" USING "role"::"text"::"public"."user_role"`);
        await queryRunner.query(`DROP TYPE "public"."user_role_old"`);
        await queryRunner.query(`CREATE INDEX "IDX_bc71638459460ad7ca75bf8d38" ON "users" ("managing_organization_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_7168f7c9863744429de421cad1" ON "users" ("account_type") `);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_bc71638459460ad7ca75bf8d380" FOREIGN KEY ("managing_organization_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_bc71638459460ad7ca75bf8d380"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7168f7c9863744429de421cad1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bc71638459460ad7ca75bf8d38"`);
        await queryRunner.query(`CREATE TYPE "public"."user_role_old" AS ENUM('admin', 'organizer', 'staff')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."user_role_old" USING "role"::"text"::"public"."user_role_old"`);
        await queryRunner.query(`DROP TYPE "public"."user_role"`);
        await queryRunner.query(`ALTER TYPE "public"."user_role_old" RENAME TO "user_role"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "managing_organization_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "job_title"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "company_address"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "company_website"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "company_registration_number"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "company_name"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "account_type"`);
        await queryRunner.query(`DROP TYPE "public"."users_account_type_enum"`);
    }

}
