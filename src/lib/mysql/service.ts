import crypto from 'crypto';
import fs from 'fs';
import http from 'http';
import * as net from 'net';
import path from 'path';
import { SiteServer } from '../../site-server';
import { loadUserData } from '../../storage/user-data';
import { portFinder } from '../port-finder';
import { MySQLProcessManager } from './process-manager';
import { MySQLProvisioner } from './provisioner';

/**
 * Service class for MySQL
 * Manages the MySQL process and provisions new databases.
 * @todo maybe pass a configuration object instead of individual params. Would be an object with installation details, not same as MySQLConfig;
 */
class MySQLService {
	/**
	 * Provisions a new MySQL database for the site and returns the configuration to be stored
	 * with the site.
	 * @param server
	 * @param mysqlInstancesPath
	 * @param version
	 */
	async provisionDatabase(
		server: SiteServer,
		mysqlInstancesPath: string,
		version: string
	): Promise< MySQLConfig > {
		// We can't use the siteId as directory because it would result in a too long
		// path for the mysql socket. We need to generate a random directory name shorter directory.
		const instanceId = await this.randomDirectoryId( mysqlInstancesPath );
		const rootDir = path.join( mysqlInstancesPath, instanceId );
		const nextPort = await this.getNextPort();

		if ( nextPort === 0 ) {
			throw new Error( 'Could not find an available port for MySQL' );
		}

		const instanceConfig: MySQLConfig = {
			instanceId: instanceId,
			dataDir: path.join( rootDir, 'data' ),
			instanceDir: rootDir,
			host: '127.0.0.1',
			port: nextPort,
			rootPassword: 'root',
			rootUsername: 'root',
			wpDatabase: 'wordpress',
			wpPassword: 'password',
			wpUsername: 'wp_user',
			version,
		};

		const provisioner = new MySQLProvisioner( instanceConfig, server );
		await provisioner.provisionDatabase();

		return instanceConfig;
	}

	async startDatabaseServer( server: SiteServer ) {
		if ( ! server.details.mysql ) {
			return;
		}
		const pm = MySQLProcessManager.getInstance();
		await pm.startProcess( server.details.mysql );

		return await pm.waitForDatabase( server.details.mysql );
	}

	async stopDatabaseServer( server: SiteServer ) {
		if ( ! server.details.mysql ) {
			return;
		}
		const pm = MySQLProcessManager.getInstance();
		return await pm.stopProcess( server.details.mysql.instanceId );
	}

	async deleteDatabaseServer( server: SiteServer ) {
		// Stop processes
		// Delete data directory

		if ( ! server.details.mysql ) {
			return;
		}

		const pm = MySQLProcessManager.getInstance();
		await pm.stopProcess( server.details.mysql.instanceId );

		// Delete files
		await fs.promises.rm( server.details.mysql.instanceDir, { recursive: true } );
	}

	/**
	 * Generates a random directory name that does not already exist in the rootDir.
	 * @param rootDir
	 * @private
	 */
	private async randomDirectoryId( rootDir: string ) {
		let dirName;
		let dirPath;
		do {
			// Generate a 6-character hexadecimal directory name to keep it short
			dirName = crypto.randomBytes( 3 ).toString( 'hex' );
			dirPath = path.join( rootDir, dirName );
		} while ( fs.existsSync( dirPath ) );

		return dirName;
	}

	/**
	 * Try to get the next available port for MySQL
	 * @private
	 */
	private async getNextPort() {
		const { sites } = await loadUserData();
		const takenPorts = sites.map( ( site ) => site.mysql?.port ).filter( ( port ) => port );

		for ( let port = 11000; port < 12000; port++ ) {
			if ( ! takenPorts.includes( port ) && ( await this.checkPortIsFree( port ) ) ) {
				return port;
			}
		}

		return 0;
	}

	/**
	 * Check if a port is free on 127.0.0.1
	 * @param port
	 * @private
	 */
	private checkPortIsFree( port: number ) {
		interface ExtendedError extends Error {
			code?: string;
		}

		return new Promise( ( resolve ) => {
			const server = net.createServer();

			server.once( 'error', ( err: ExtendedError ) => {
				if ( err.code === 'EADDRINUSE' ) {
					resolve( false );
				}
			} );

			server.once( 'listening', () => {
				server.close();
				resolve( true );
			} );

			server.listen( port, '127.0.0.1' );
		} );
	}
}

export { MySQLService };
