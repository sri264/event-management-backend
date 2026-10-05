import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1791202609921 implements MigrationInterface {
  name = 'InitialSchema1791202609921';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`venues\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`name\` varchar(150) NOT NULL, \`slug\` varchar(170) NOT NULL, \`type\` enum ('hall', 'pool', 'room') NOT NULL, \`description\` text NOT NULL, \`location\` varchar(100) NOT NULL, \`address\` varchar(255) NOT NULL, \`capacity\` int UNSIGNED NOT NULL, \`price\` decimal(12,2) NOT NULL, \`price_unit\` enum ('day', 'night') NOT NULL, \`amenities\` json NOT NULL, \`images\` json NOT NULL, \`rating\` decimal(2,1) NOT NULL DEFAULT '0.0', \`review_count\` int UNSIGNED NOT NULL DEFAULT '0', \`is_featured\` tinyint NOT NULL DEFAULT 0, \`is_active\` tinyint NOT NULL DEFAULT 1, UNIQUE INDEX \`IDX_9fd71efb7abb246a69847399d1\` (\`slug\`), INDEX \`IDX_d6612f852837a3aabee2a4f03a\` (\`type\`), INDEX \`IDX_be677afd59218cba25e6e38789\` (\`location\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`users\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`name\` varchar(100) NOT NULL, \`email\` varchar(150) NOT NULL, \`phone\` varchar(20) NULL, \`city\` varchar(100) NULL, \`password_hash\` varchar(100) NOT NULL, \`role\` enum ('CUSTOMER', 'ADMIN') NOT NULL DEFAULT 'CUSTOMER', \`is_active\` tinyint NOT NULL DEFAULT 1, \`refresh_token_hash\` varchar(100) NULL, \`last_login_at\` datetime NULL, UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`payments\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`booking_id\` int UNSIGNED NOT NULL, \`amount\` decimal(12,2) NOT NULL, \`method\` enum ('UPI', 'CARD', 'NET_BANKING', 'CASH', 'BANK_TRANSFER') NOT NULL, \`status\` enum ('SUCCESS', 'REFUNDED') NOT NULL DEFAULT 'SUCCESS', \`transaction_ref\` varchar(40) NOT NULL, \`paid_at\` datetime NOT NULL, \`refunded_at\` datetime NULL, \`note\` varchar(255) NULL, INDEX \`IDX_32b41cdb985a296213e9a928b5\` (\`status\`), UNIQUE INDEX \`IDX_c9f713bf30bb8bcea32a5df516\` (\`transaction_ref\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`bookings\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`booking_code\` varchar(20) NOT NULL, \`customer_id\` int UNSIGNED NOT NULL, \`venue_id\` int UNSIGNED NOT NULL, \`start_date\` date NOT NULL, \`end_date\` date NOT NULL, \`units\` int UNSIGNED NOT NULL, \`guests\` int UNSIGNED NOT NULL, \`event_type\` varchar(60) NOT NULL, \`contact_name\` varchar(100) NOT NULL, \`contact_phone\` varchar(20) NOT NULL, \`notes\` text NULL, \`unit_price\` decimal(12,2) NOT NULL, \`base_amount\` decimal(12,2) NOT NULL, \`gst_percent\` tinyint UNSIGNED NOT NULL, \`gst_amount\` decimal(12,2) NOT NULL, \`total_amount\` decimal(12,2) NOT NULL, \`status\` enum ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING', \`payment_status\` enum ('UNPAID', 'PAID', 'REFUNDED') NOT NULL DEFAULT 'UNPAID', \`cancelled_at\` datetime NULL, \`cancellation_reason\` varchar(255) NULL, UNIQUE INDEX \`IDX_796e0227e4beff186bdd72ac53\` (\`booking_code\`), INDEX \`IDX_48b267d894e32a25ebde4b207a\` (\`status\`), INDEX \`IDX_fb53b028948b1b684c8aab0a46\` (\`venue_id\`, \`start_date\`, \`end_date\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`support_tickets\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`user_id\` int UNSIGNED NULL, \`booking_id\` int UNSIGNED NULL, \`name\` varchar(100) NOT NULL, \`email\` varchar(150) NOT NULL, \`phone\` varchar(20) NULL, \`subject\` varchar(150) NOT NULL, \`message\` text NOT NULL, \`status\` enum ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'OPEN', \`admin_reply\` text NULL, \`replied_at\` datetime NULL, INDEX \`IDX_ba7b1a2ed4051fb3b39ff95444\` (\`status\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`settings\` (\`setting_key\` varchar(60) NOT NULL, \`setting_value\` text NOT NULL, \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`setting_key\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`reviews\` (\`id\` int UNSIGNED NOT NULL AUTO_INCREMENT, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`booking_id\` int UNSIGNED NOT NULL, \`venue_id\` int UNSIGNED NOT NULL, \`customer_id\` int UNSIGNED NOT NULL, \`rating\` tinyint UNSIGNED NOT NULL, \`comment\` text NOT NULL, \`is_visible\` tinyint NOT NULL DEFAULT 1, UNIQUE INDEX \`IDX_bbd6ac6e3e6a8f8c6e0e8692d6\` (\`booking_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`payments\` ADD CONSTRAINT \`FK_e86edf76dc2424f123b9023a2b2\` FOREIGN KEY (\`booking_id\`) REFERENCES \`bookings\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`bookings\` ADD CONSTRAINT \`FK_8e21b7ae33e7b0673270de4146f\` FOREIGN KEY (\`customer_id\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`bookings\` ADD CONSTRAINT \`FK_9285e4f67f013d21d8d9905b1e8\` FOREIGN KEY (\`venue_id\`) REFERENCES \`venues\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`support_tickets\` ADD CONSTRAINT \`FK_0b1eb4f1f984aab3c481c48468a\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`support_tickets\` ADD CONSTRAINT \`FK_a8c6ccffa5d66547c61ef7e2924\` FOREIGN KEY (\`booking_id\`) REFERENCES \`bookings\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`reviews\` ADD CONSTRAINT \`FK_bbd6ac6e3e6a8f8c6e0e8692d63\` FOREIGN KEY (\`booking_id\`) REFERENCES \`bookings\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`reviews\` ADD CONSTRAINT \`FK_892f659696877d5b0a4a37de098\` FOREIGN KEY (\`venue_id\`) REFERENCES \`venues\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`reviews\` ADD CONSTRAINT \`FK_4dd42f48aa60ad8c0d5d5c4ea5b\` FOREIGN KEY (\`customer_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`reviews\` DROP FOREIGN KEY \`FK_4dd42f48aa60ad8c0d5d5c4ea5b\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`reviews\` DROP FOREIGN KEY \`FK_892f659696877d5b0a4a37de098\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`reviews\` DROP FOREIGN KEY \`FK_bbd6ac6e3e6a8f8c6e0e8692d63\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`support_tickets\` DROP FOREIGN KEY \`FK_a8c6ccffa5d66547c61ef7e2924\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`support_tickets\` DROP FOREIGN KEY \`FK_0b1eb4f1f984aab3c481c48468a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`bookings\` DROP FOREIGN KEY \`FK_9285e4f67f013d21d8d9905b1e8\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`bookings\` DROP FOREIGN KEY \`FK_8e21b7ae33e7b0673270de4146f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`payments\` DROP FOREIGN KEY \`FK_e86edf76dc2424f123b9023a2b2\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_bbd6ac6e3e6a8f8c6e0e8692d6\` ON \`reviews\``,
    );
    await queryRunner.query(`DROP TABLE \`reviews\``);
    await queryRunner.query(`DROP TABLE \`settings\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_ba7b1a2ed4051fb3b39ff95444\` ON \`support_tickets\``,
    );
    await queryRunner.query(`DROP TABLE \`support_tickets\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_fb53b028948b1b684c8aab0a46\` ON \`bookings\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_48b267d894e32a25ebde4b207a\` ON \`bookings\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_796e0227e4beff186bdd72ac53\` ON \`bookings\``,
    );
    await queryRunner.query(`DROP TABLE \`bookings\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_c9f713bf30bb8bcea32a5df516\` ON \`payments\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_32b41cdb985a296213e9a928b5\` ON \`payments\``,
    );
    await queryRunner.query(`DROP TABLE \`payments\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``,
    );
    await queryRunner.query(`DROP TABLE \`users\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_be677afd59218cba25e6e38789\` ON \`venues\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_d6612f852837a3aabee2a4f03a\` ON \`venues\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_9fd71efb7abb246a69847399d1\` ON \`venues\``,
    );
    await queryRunner.query(`DROP TABLE \`venues\``);
  }
}
