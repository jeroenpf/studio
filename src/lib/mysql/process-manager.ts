import { ChildProcess, spawn } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import { execAsync } from './utils';
import versions from './versions';

class MySQLProcessManager {
	private static instance: MySQLProcessManager;
	private static exitHandlerBound = false;
	private processes: Map< string, ChildProcess > = new Map();
	private configs: Map< string, MySQLConfig > = new Map();

	private constructor() {
		// Private constructor to prevent instantiation
		if ( ! MySQLProcessManager.exitHandlerBound ) {
			this.bindExitHandlers();
			MySQLProcessManager.exitHandlerBound = true;
		}
	}

	/**
	 * Get the singleton instance of the MySQLProcessManager.
	 * @returns MySQLProcessManager
	 */
	public static getInstance() {
		if ( ! MySQLProcessManager.instance ) {
			MySQLProcessManager.instance = new MySQLProcessManager();
		}

		return MySQLProcessManager.instance;
	}

	/**
	 * Start a new MySQL process for the given configuration.
	 * @param config
	 */
	public async startProcess( config: MySQLConfig ) {
		if ( this.processes.has( config.instanceId ) ) {
			throw new Error( `MySQL process for site ${ config.instanceId } already started` );
		}

		await fs.ensureDir( config.dataDir );
		const version = versions[ config.version ];

		const mysqld = version.mysqldBinPath;
		const args = [ `--defaults-file=${ path.join( config.instanceDir, 'my.cnf' ) }` ];

		const proc = spawn( mysqld, args, {
			stdio: 'inherit',
		} );

		this.processes.set( config.instanceId, proc );
		this.configs.set( config.instanceId, config );

		proc.on( 'exit', ( code ) => {
			console.log( `MySQL process for site ${ config.instanceId } exited with code ${ code }` );
			this.processes.delete( config.instanceId );
			this.configs.delete( config.instanceId );
		} );
	}

	/**
	 * Stop the MySQL process for the given instance.
	 * @param instanceId
	 */
	public async stopProcess( instanceId: string ) {
		const proc = this.processes.get( instanceId );
		if ( ! proc ) {
			return;
		}

		return new Promise( ( resolve, reject ) => {
			console.log( `Stopping MySQL process for site ${ instanceId }` );
			proc.on( 'exit', resolve );
			proc.on( 'error', reject );
			proc.kill( 'SIGTERM' );
		} ).then( () => {
			this.processes.delete( instanceId );
			this.configs.delete( instanceId );
		} );
	}

	/**
	 * Restart the MySQL process for the given instance.
	 * @param instanceId
	 */
	public async restartProcess( instanceId: string ) {
		await this.stopProcess( instanceId );
		const config = this.configs.get( instanceId );
		if ( ! config ) {
			throw new Error( `MySQL config for site ${ instanceId } not found` );
		}
		await this.startProcess( config );
	}

	/**
	 * Stop all MySQL processes.
	 */
	public async stopAllProcesses() {
		const stopPromises = [];
		console.log( 'Stopping all MySQL processes' );
		for ( const [ instanceId ] of this.processes ) {
			stopPromises.push( this.stopProcess( instanceId ) );
		}

		await Promise.all( stopPromises );
	}

	/**
	 * Check if a MySQL process is running for the given instance.
	 * @param instanceId
	 */
	public async hasProcess( instanceId: string ) {
		return this.processes.has( instanceId );
	}

	/**
	 * Checks whether the database is ready to accept connections.
	 * If not, it will retry a few times with a delay in between.
	 * Finally, if the database is not in a ready state after the
	 * retries, it will return false.
	 *
	 * @param config MySQLConfig
	 */
	public async waitForDatabase( config: MySQLConfig ) {
		const version = versions[ config.version ];
		const mysql = version.mysqladminBinPath;
		const cfgPath = path.join( config.instanceDir, 'my.cnf' );
		const args = [ `--defaults-file=${ cfgPath }`, '--password=', 'ping' ];

		const maxTries = 10;
		const delayMs = 1000; // 1 second delay between attempts
		for ( let attempt = 1; attempt <= maxTries; attempt++ ) {
			try {
				const result = await execAsync( mysql, args );
				if ( result.code === 0 ) {
					return true;
				}
			} catch ( error ) {
				console.log( `Attempt ${ attempt } failed: ${ error }` );
			}

			if ( attempt < maxTries ) {
				await this.delay( delayMs );
			}
		}
		return false;
	}

	/**
	 * Delay for a given number of milliseconds.
	 * @param ms
	 * @private
	 */
	private async delay( ms: number ) {
		return new Promise( ( resolve ) => setTimeout( resolve, ms ) );
	}

	/**
	 * Bind exit handlers to stop all processes when the process exits.
	 * @private
	 */
	private bindExitHandlers() {
		process.on( 'exit', async () => {
			await this.stopAllProcesses();
		} );

		process.on( 'SIGINT', async () => {
			await this.stopAllProcesses();
		} );

		process.on( 'uncaughtException', async ( error ) => {
			console.error( 'Uncaught exception:', error );
			await this.stopAllProcesses();
		} );
	}
}

export { MySQLProcessManager };
