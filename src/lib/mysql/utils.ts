import { spawn, SpawnOptions, execFile } from 'child_process';

interface ExecResult {
	stdout: string;
	stderr: string;
	code: number | null;
}

function execAsync(
	command: string,
	args: string[],
	options: SpawnOptions = {}
): Promise< ExecResult > {
	return new Promise( ( resolve, reject ) => {
		const process = spawn( command, args, { ...options, stdio: 'pipe' } );
		let stdout = '';
		let stderr = '';

		process.stdout?.on( 'data', ( data ) => {
			stdout += data.toString();
		} );

		process.stderr?.on( 'data', ( data ) => {
			stderr += data.toString();
		} );

		process.on( 'close', ( code ) => {
			resolve( { stdout, stderr, code } );
		} );

		process.on( 'error', ( err ) => {
			reject( err );
		} );

		// Handle case where process is killed
		process.on( 'exit', ( code, signal ) => {
			if ( signal ) {
				reject( new Error( `Process was killed with signal ${ signal }` ) );
			}
		} );

		// Optional: Handle timeout
		if ( options.timeout ) {
			setTimeout( () => {
				process.kill();
				reject( new Error( `Process timed out after ${ options.timeout }ms` ) );
			}, options.timeout );
		}
	} );
}

export { execAsync, ExecResult };
