import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuditFieldsManual1765506353467 implements MigrationInterface {
    name = "AddAuditFieldsManual1765506353467";

    public async up(queryRunner: QueryRunner): Promise<void> {
        // SystemConfig
        await queryRunner.query(`
      ALTER TABLE "SystemConfig"
      ADD createdAt datetime NOT NULL DEFAULT GETDATE(),
          updatedAt datetime NOT NULL DEFAULT GETDATE(),
          deletedAt datetime NULL,
          createdBy int NULL,
          updatedBy int NULL;
    `);

        // Apartments
        await queryRunner.query(`
      ALTER TABLE "Apartments"
      ADD createdAt datetime NOT NULL DEFAULT GETDATE(),
          updatedAt datetime NOT NULL DEFAULT GETDATE(),
          deletedAt datetime NULL,
          createdBy int NULL,
          updatedBy int NULL;
    `);

        // Services
        await queryRunner.query(`
      ALTER TABLE "Services"
      ADD createdAt datetime NOT NULL DEFAULT GETDATE(),
          updatedAt datetime NOT NULL DEFAULT GETDATE(),
          deletedAt datetime NULL,
          createdBy int NULL,
          updatedBy int NULL;
    `);

        // ServiceUsageHistory
        await queryRunner.query(`
      ALTER TABLE "ServiceUsageHistory"
      ADD createdAt datetime NOT NULL DEFAULT GETDATE(),
          updatedAt datetime NOT NULL DEFAULT GETDATE(),
          deletedAt datetime NULL,
          createdBy int NULL,
          updatedBy int NULL;
    `);

        // Residents
        await queryRunner.query(`
      ALTER TABLE "Residents"
      ADD createdAt datetime NOT NULL DEFAULT GETDATE(),
          updatedAt datetime NOT NULL DEFAULT GETDATE(),
          deletedAt datetime NULL,
          createdBy int NULL,
          updatedBy int NULL;
    `);

        // CheckInOut
        await queryRunner.query(`
      ALTER TABLE "CheckInOut"
      ADD createdAt datetime NOT NULL DEFAULT GETDATE(),
          updatedAt datetime NOT NULL DEFAULT GETDATE(),
          deletedAt datetime NULL,
          createdBy int NULL,
          updatedBy int NULL;
    `);

        // Permissions
        await queryRunner.query(`
      ALTER TABLE "Permissions"
      ADD createdAt datetime NOT NULL DEFAULT GETDATE(),
          updatedAt datetime NOT NULL DEFAULT GETDATE(),
          deletedAt datetime NULL,
          createdBy int NULL,
          updatedBy int NULL;
    `);

        // Roles
        await queryRunner.query(`
      ALTER TABLE "Roles"
      ADD createdAt datetime NOT NULL DEFAULT GETDATE(),
          updatedAt datetime NOT NULL DEFAULT GETDATE(),
          deletedAt datetime NULL,
          createdBy int NULL,
          updatedBy int NULL;
    `);

        // Staff
        await queryRunner.query(`
      ALTER TABLE "Staff"
      ADD createdAt datetime NOT NULL DEFAULT GETDATE(),
          updatedAt datetime NOT NULL DEFAULT GETDATE(),
          deletedAt datetime NULL,
          createdBy int NULL,
          updatedBy int NULL;
    `);


    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop ngược lại – chỉ cần drop các cột mình đã add
        await queryRunner.query(`
      ALTER TABLE "Staff"
      DROP COLUMN updatedBy, createdBy, deletedAt, updatedAt, createdAt;
    `);
        await queryRunner.query(`
      ALTER TABLE "Roles"
      DROP COLUMN updatedBy, createdBy, deletedAt, updatedAt, createdAt;
    `);
        await queryRunner.query(`
      ALTER TABLE "Permissions"
      DROP COLUMN updatedBy, createdBy, deletedAt, updatedAt, createdAt;
    `);
        await queryRunner.query(`
      ALTER TABLE "CheckInOut"
      DROP COLUMN updatedBy, createdBy, deletedAt, updatedAt, createdAt;
    `);
        await queryRunner.query(`
      ALTER TABLE "Residents"
      DROP COLUMN updatedBy, createdBy, deletedAt, updatedAt, createdAt;
    `);
        await queryRunner.query(`
      ALTER TABLE "ServiceUsageHistory"
      DROP COLUMN updatedBy, createdBy, deletedAt, updatedAt, createdAt;
    `);
        await queryRunner.query(`
      ALTER TABLE "Services"
      DROP COLUMN updatedBy, createdBy, deletedAt, updatedAt, createdAt;
    `);
        await queryRunner.query(`
      ALTER TABLE "Apartments"
      DROP COLUMN updatedBy, createdBy, deletedAt, updatedAt, createdAt;
    `);
        await queryRunner.query(`
      ALTER TABLE "SystemConfig"
      DROP COLUMN updatedBy, createdBy, deletedAt, updatedAt, createdAt;
    `);
    }


}
