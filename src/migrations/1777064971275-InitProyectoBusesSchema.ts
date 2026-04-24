import { MigrationInterface, QueryRunner } from "typeorm";

export class InitProyectoBusesSchema1777064971275 implements MigrationInterface {
    name = 'InitProyectoBusesSchema1777064971275'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`conductores\` (\`id\` int NOT NULL AUTO_INCREMENT, \`nombre\` varchar(255) NOT NULL, \`licencia\` varchar(255) NOT NULL, \`telefono\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_a01e7172ea361195be58ab5962\` (\`licencia\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`empresas\` (\`id\` int NOT NULL AUTO_INCREMENT, \`nombre\` varchar(255) NOT NULL, \`nit\` varchar(255) NULL, UNIQUE INDEX \`IDX_7a75c61d17a9cba267133a6fc6\` (\`nombre\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`gps_devices\` (\`id\` int NOT NULL AUTO_INCREMENT, \`device_code\` varchar(255) NOT NULL, \`latitude\` decimal(10,8) NOT NULL, \`longitude\` decimal(11,8) NOT NULL, \`last_update\` timestamp NOT NULL, \`bus_id\` int NULL, UNIQUE INDEX \`IDX_ca27257747946fe9bf90ae311b\` (\`device_code\`), UNIQUE INDEX \`REL_f5406e954fd89b7819a1048ee9\` (\`bus_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`metodos_pago\` (\`id\` int NOT NULL AUTO_INCREMENT, \`nombre\` varchar(255) NOT NULL, \`descripcion\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`metodos_pago_ciudadano\` (\`id\` int NOT NULL AUTO_INCREMENT, \`instrumento_id\` varchar(255) NOT NULL, \`metodo_pago_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`boletos\` (\`id\` int NOT NULL AUTO_INCREMENT, \`costo\` decimal NOT NULL, \`inicio_viaje\` timestamp NOT NULL, \`fin_viaje\` timestamp NULL, \`programacion_id\` int NULL, \`metodo_pago_ciudadano_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`programaciones\` (\`id\` int NOT NULL AUTO_INCREMENT, \`fecha\` date NOT NULL, \`hora_salida\` time NOT NULL, \`bus_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`incidentes\` (\`id\` int NOT NULL AUTO_INCREMENT, \`tipo\` varchar(255) NOT NULL, \`descripcion\` text NOT NULL, \`fecha\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`fotos\` (\`id\` int NOT NULL AUTO_INCREMENT, \`url\` varchar(255) NOT NULL, \`fecha\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`incidente_bus_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`incidentes_buses\` (\`id\` int NOT NULL AUTO_INCREMENT, \`incidente_id\` int NULL, \`bus_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`buses\` (\`id\` int NOT NULL AUTO_INCREMENT, \`placa\` varchar(255) NOT NULL, \`modelo\` varchar(255) NOT NULL, \`capacidad_maxima\` int NOT NULL, \`empresa_id\` int NULL, UNIQUE INDEX \`IDX_e78e1b9df21315024e40a67d02\` (\`placa\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`turnos\` (\`id\` int NOT NULL AUTO_INCREMENT, \`fecha\` date NOT NULL, \`hora_inicio\` timestamp NOT NULL, \`hora_fin\` timestamp NOT NULL, \`estado\` varchar(255) NOT NULL, \`conductor_id\` int NULL, \`bus_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`gps_devices\` ADD CONSTRAINT \`FK_f5406e954fd89b7819a1048ee90\` FOREIGN KEY (\`bus_id\`) REFERENCES \`buses\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`metodos_pago_ciudadano\` ADD CONSTRAINT \`FK_bbe14de130dc5b277a69019f33f\` FOREIGN KEY (\`metodo_pago_id\`) REFERENCES \`metodos_pago\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`boletos\` ADD CONSTRAINT \`FK_365ae3b69628ff0f5c5e24618e0\` FOREIGN KEY (\`programacion_id\`) REFERENCES \`programaciones\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`boletos\` ADD CONSTRAINT \`FK_6f5aa1215938293919cea39e9d4\` FOREIGN KEY (\`metodo_pago_ciudadano_id\`) REFERENCES \`metodos_pago_ciudadano\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`programaciones\` ADD CONSTRAINT \`FK_268023a8b8d040f970ef1183716\` FOREIGN KEY (\`bus_id\`) REFERENCES \`buses\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`fotos\` ADD CONSTRAINT \`FK_ff62ea628675c35a75cf5c65ea4\` FOREIGN KEY (\`incidente_bus_id\`) REFERENCES \`incidentes_buses\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`incidentes_buses\` ADD CONSTRAINT \`FK_8179f1ccfa39b0c57e3ce773572\` FOREIGN KEY (\`incidente_id\`) REFERENCES \`incidentes\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`incidentes_buses\` ADD CONSTRAINT \`FK_224daaf04bf078241e136ccc05f\` FOREIGN KEY (\`bus_id\`) REFERENCES \`buses\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`buses\` ADD CONSTRAINT \`FK_45fbb665b161ccb9b63acb9904c\` FOREIGN KEY (\`empresa_id\`) REFERENCES \`empresas\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`turnos\` ADD CONSTRAINT \`FK_3db03ec6ba62996743b23a24b7e\` FOREIGN KEY (\`conductor_id\`) REFERENCES \`conductores\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`turnos\` ADD CONSTRAINT \`FK_321cdd32b08af8ecab080d49f04\` FOREIGN KEY (\`bus_id\`) REFERENCES \`buses\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`turnos\` DROP FOREIGN KEY \`FK_321cdd32b08af8ecab080d49f04\``);
        await queryRunner.query(`ALTER TABLE \`turnos\` DROP FOREIGN KEY \`FK_3db03ec6ba62996743b23a24b7e\``);
        await queryRunner.query(`ALTER TABLE \`buses\` DROP FOREIGN KEY \`FK_45fbb665b161ccb9b63acb9904c\``);
        await queryRunner.query(`ALTER TABLE \`incidentes_buses\` DROP FOREIGN KEY \`FK_224daaf04bf078241e136ccc05f\``);
        await queryRunner.query(`ALTER TABLE \`incidentes_buses\` DROP FOREIGN KEY \`FK_8179f1ccfa39b0c57e3ce773572\``);
        await queryRunner.query(`ALTER TABLE \`fotos\` DROP FOREIGN KEY \`FK_ff62ea628675c35a75cf5c65ea4\``);
        await queryRunner.query(`ALTER TABLE \`programaciones\` DROP FOREIGN KEY \`FK_268023a8b8d040f970ef1183716\``);
        await queryRunner.query(`ALTER TABLE \`boletos\` DROP FOREIGN KEY \`FK_6f5aa1215938293919cea39e9d4\``);
        await queryRunner.query(`ALTER TABLE \`boletos\` DROP FOREIGN KEY \`FK_365ae3b69628ff0f5c5e24618e0\``);
        await queryRunner.query(`ALTER TABLE \`metodos_pago_ciudadano\` DROP FOREIGN KEY \`FK_bbe14de130dc5b277a69019f33f\``);
        await queryRunner.query(`ALTER TABLE \`gps_devices\` DROP FOREIGN KEY \`FK_f5406e954fd89b7819a1048ee90\``);
        await queryRunner.query(`DROP TABLE \`turnos\``);
        await queryRunner.query(`DROP INDEX \`IDX_e78e1b9df21315024e40a67d02\` ON \`buses\``);
        await queryRunner.query(`DROP TABLE \`buses\``);
        await queryRunner.query(`DROP TABLE \`incidentes_buses\``);
        await queryRunner.query(`DROP TABLE \`fotos\``);
        await queryRunner.query(`DROP TABLE \`incidentes\``);
        await queryRunner.query(`DROP TABLE \`programaciones\``);
        await queryRunner.query(`DROP TABLE \`boletos\``);
        await queryRunner.query(`DROP TABLE \`metodos_pago_ciudadano\``);
        await queryRunner.query(`DROP TABLE \`metodos_pago\``);
        await queryRunner.query(`DROP INDEX \`REL_f5406e954fd89b7819a1048ee9\` ON \`gps_devices\``);
        await queryRunner.query(`DROP INDEX \`IDX_ca27257747946fe9bf90ae311b\` ON \`gps_devices\``);
        await queryRunner.query(`DROP TABLE \`gps_devices\``);
        await queryRunner.query(`DROP INDEX \`IDX_7a75c61d17a9cba267133a6fc6\` ON \`empresas\``);
        await queryRunner.query(`DROP TABLE \`empresas\``);
        await queryRunner.query(`DROP INDEX \`IDX_a01e7172ea361195be58ab5962\` ON \`conductores\``);
        await queryRunner.query(`DROP TABLE \`conductores\``);
    }

}
