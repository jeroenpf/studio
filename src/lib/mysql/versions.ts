interface MySQLVersion {
	mysqldBinPath: string; // path to mysqld binary
	mysqlBinPath: string; // path to mysql binary
	mysqladminBinPath: string; // path to mysqladmin binary
	mysqlCnfTemplatePath: string; // my.cnf template using handlebars
}

const versions: Record< string, MySQLVersion > = {
	'8.0.16': {
		mysqldBinPath: '/Users/jeroenpfeil/Projects/mysql-binary/mysql-8.0.16/bin/darwin/bin/mysqld',
		mysqlBinPath: '/Users/jeroenpfeil/Projects/mysql-binary/mysql-8.0.16/bin/darwin/bin/mysql',
		mysqladminBinPath:
			'/Users/jeroenpfeil/Projects/mysql-binary/mysql-8.0.16/bin/darwin/bin/mysqladmin',
		mysqlCnfTemplatePath: '/Users/jeroenpfeil/Projects/mysql-binary/mysql-8.0.16/conf/my.cnf.hbs',
	},
};

export default versions;
