import fs from 'fs';
import path from 'path';
import { ensureDir } from 'fs-extra';
import Handlebars from 'handlebars';
import { SiteServer } from '../../site-server';
import { MySQLProcessManager } from './process-manager';
import { execAsync } from './utils';
import versions from './versions';
import { decodePassword } from '../passwords';

/**
 * Provision a new MySQL database for the new site.
 *
 * The role of the provisioner is to create the necessary directories and configuration files
 * for the MySQL instance, and to initialize the database with the necessary tables and data.
 *
 */
class MySQLProvisioner {
	constructor(
		private config: MySQLConfig,
		private server: SiteServer
	) {}

	/**
	 * Provision a new MySQL database for the new site.
	 *
	 * @todo We need some sort of logging mechanism?
	 */
	async provisionDatabase() {
		console.log( 'Provisioning database' );
		await this.createDataDirAndConfig();
		await this.initializeDatabase().catch( ( err ) => {
			console.error( 'Error initializing database', err );
		} );

		// Start the MySQL server.
		const pm = MySQLProcessManager.getInstance();
		await pm.startProcess( this.config );

		// Wait for the database to start.
		const started = await pm.waitForDatabase( this.config );

		if ( ! started ) {
			throw new Error( 'Could not start the database' );
		}

		// Prepare the users and database.
		await this.alterRootUser();
		await this.createWPDatabase();
		await this.createWPDatabaseUser();
		await this.grantWPDatabaseUser();

		// @todo populate the wp database wp core install?
		// wp config create?

		const dbHost = `${ this.config.host }:${ this.config.port }`;
		const adminPass = decodePassword( this.server.details.adminPassword || 'password' );
		console.log("Created site with pass: ", adminPass);
		await this.server.executeWpCliCommand( `config set DB_NAME ${ this.config.wpDatabase }` );
		await this.server.executeWpCliCommand( `config set DB_USER ${ this.config.wpUsername }` );
		await this.server.executeWpCliCommand( `config set DB_PASSWORD ${ this.config.wpPassword }` );
		await this.server.executeWpCliCommand( `config set DB_HOST ${ dbHost }` );

		const { stdout, stderr } = await this.server.executeWpCliCommand(
			`core install --url="http://localhost:${ this.server.details.port }" --title="${ this.server.details.name }" --admin_user=admin --admin_password="${ adminPass }" --admin_email=studio@example.com`
		);

		console.log( 'WP Core Install', stdout, stderr );
	}

	private async createDataDirAndConfig() {
		console.log( 'Creating data dir and config' );
		console.log( 'Creating ' + this.config.dataDir );
		await ensureDir( this.config.dataDir );
		await fs.promises.chmod( this.config.dataDir, 0o755 );
		await this.createCnf( this.config );
	}

	/**
	 * Initialize the database with the necessary tables and data.
	 * @private
	 */
	private async initializeDatabase() {
		const cnfPath = path.join( this.config.instanceDir, 'my.cnf' );
		const version = versions[ this.config.version ];
		const mysqldPath = version.mysqldBinPath;

		const result = await execAsync( mysqldPath, [
			'--defaults-file=' + cnfPath,
			'--initialize-insecure',
		] );

		if ( result.code !== 0 ) {
			throw new Error( `Failed to initialize database: ${ result.stderr }` );
		}
	}

	/**
	 * Create the WordPress database
	 * @private
	 */
	private async createWPDatabase() {
		const version = versions[ this.config.version ];
		const result = await execAsync( version.mysqlBinPath, [
			`--defaults-file=${ path.join( this.config.instanceDir, 'my.cnf' ) }`,
			'-e',
			`CREATE DATABASE ${ this.config.wpDatabase }`,
		] );

		if ( result.code !== 0 ) {
			throw new Error( `Failed to create database: ${ result.stderr }` );
		}
	}

	/**
	 * Set the password for the root user
	 *
	 * @private
	 */
	private async alterRootUser() {
		// ALTER
		const version = versions[ this.config.version ];
		const result = await execAsync( version.mysqlBinPath, [
			`--defaults-file=${ path.join( this.config.instanceDir, 'my.cnf' ) }`,
			'--password=',
			'-e',
			`ALTER USER 'root'@'localhost' IDENTIFIED BY '${ this.config.rootPassword }'`,
		] );

		if ( result.code !== 0 ) {
			throw new Error( `Failed to change the root user: ${ result.stderr }` );
		}
	}

	/**
	 * Create a user for the database
	 * @private
	 */
	private async createWPDatabaseUser() {
		console.log( 'Creating database user' );
		const version = versions[ this.config.version ];
		const result = await execAsync( version.mysqlBinPath, [
			`--defaults-file=${ path.join( this.config.instanceDir, 'my.cnf' ) }`,
			'-e',
			`CREATE USER '${ this.config.wpUsername }'@'127.0.0.1' IDENTIFIED BY '${ this.config.wpPassword }'`,
		] );

		if ( result.code !== 0 ) {
			throw new Error( `Failed to create database user: ${ result.stderr }` );
		}
	}

	/**
	 * Grant the user access to the database
	 * @todo Line is too long, fix it.
	 * @private
	 */
	private async grantWPDatabaseUser() {
		console.log( 'Granting database user' );
		const version = versions[ this.config.version ];
		const result = await execAsync( version.mysqlBinPath, [
			`--defaults-file=${ path.join( this.config.instanceDir, 'my.cnf' ) }`,
			'-e',
			`GRANT ALL PRIVILEGES ON ${ this.config.wpDatabase }.* TO '${ this.config.wpUsername }'@'127.0.0.1' WITH GRANT OPTION; FLUSH PRIVILEGES;`,
		] );

		if ( result.code !== 0 ) {
			throw new Error( `Failed to grant database user: ${ result.stderr }` );
		}
	}

	private async createCnf( config: MySQLConfig ) {
		console.log( 'Creating my.cnf' );

		const version = versions[ config.version ];
		const outputPath = path.join( config.instanceDir, 'my.cnf' );
		const templateContent = fs.readFileSync( version.mysqlCnfTemplatePath, 'utf-8' );

		// Process the template with handlebars
		const template = Handlebars.compile( templateContent );

		const output = template( {
			os: {
				windows: false,
			},
			disableMysqlx: true,
			port: config.port,
			bindAddress: config.host,
			dataDir: config.dataDir,
			socket: path.join( config.instanceDir, 'mysql.sock' ),
			clientAddress: config.host,
		} );

		await fs.promises.writeFile( outputPath, output, 'utf-8' );

		console.log( 'Configuration stored at ' + outputPath );
	}
}

export { MySQLProvisioner };
