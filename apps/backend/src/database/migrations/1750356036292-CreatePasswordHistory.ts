import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePasswordHistory1750356036292 implements MigrationInterface {
    name = 'CreatePasswordHistory1750356036292'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_activities_activity_type_enum" AS ENUM('login', 'logout', 'profile_update', 'password_change', 'email_verification', 'password_reset', 'role_assignment', 'account_deactivation', 'account_reactivation', 'two_factor_enabled', 'two_factor_disabled', 'failed_login', 'account_locked', 'account_unlocked')`);
        await queryRunner.query(`CREATE TABLE "user_activities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "activity_type" "public"."user_activities_activity_type_enum" NOT NULL, "description" character varying(500) NOT NULL, "ip_address" character varying(45), "user_agent" character varying(500), "metadata" json, "is_successful" boolean NOT NULL DEFAULT true, "failure_reason" character varying(500), "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1245d4d2cf04ba7743f2924d951" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b829cca72b9e2d719cfee17e1c" ON "user_activities" ("ip_address") `);
        await queryRunner.query(`CREATE INDEX "IDX_10267cff3d4cb476c8228027f4" ON "user_activities" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_18d9bb422cefa6b765fedb3e5a" ON "user_activities" ("activity_type") `);
        await queryRunner.query(`CREATE INDEX "IDX_a283f37e08edf5e37d38b375ee" ON "user_activities" ("user_id") `);
        await queryRunner.query(`CREATE TABLE "password_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "password_hash" text NOT NULL, "algorithm" character varying(50) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_da65ed4600e5e6bc9315754a8b2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5bb51e0d489746c2adf0e46a38" ON "password_history" ("user_id", "created_at") `);
        await queryRunner.query(`ALTER TABLE "user_activities" ADD CONSTRAINT "FK_a283f37e08edf5e37d38b375eec" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "password_history" ADD CONSTRAINT "FK_4933dc7a01356ac0733a5ad52d9" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "password_history" DROP CONSTRAINT "FK_4933dc7a01356ac0733a5ad52d9"`);
        await queryRunner.query(`ALTER TABLE "user_activities" DROP CONSTRAINT "FK_a283f37e08edf5e37d38b375eec"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5bb51e0d489746c2adf0e46a38"`);
        await queryRunner.query(`DROP TABLE "password_history"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a283f37e08edf5e37d38b375ee"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_18d9bb422cefa6b765fedb3e5a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_10267cff3d4cb476c8228027f4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b829cca72b9e2d719cfee17e1c"`);
        await queryRunner.query(`DROP TABLE "user_activities"`);
        await queryRunner.query(`DROP TYPE "public"."user_activities_activity_type_enum"`);
    }

}
