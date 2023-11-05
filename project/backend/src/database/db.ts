import BetterSqlite3 from 'better-sqlite3';

/*
 * Docs for BetterSqlite3: https://github.com/WiseLibs/better-sqlite3/blob/HEAD/docs/api.md
 */

/** Type for describing the results of an update query.
 *
 * @param changes number of row changed as a result of the query
 * @param lastInsertRowId the generated ID of the last inserted row
 */
export type UpdateResult = {
    changes : number;
    lastInsertRowId : number | bigint;
}

/**
 * Class for representing a SQLite connection.
 */
export class SQLiteDatabase {
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //                                        Class Properties
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////
  private database : BetterSqlite3.Database;

  private constructor(filePath: string, options: BetterSqlite3.Options) {
    this.database = new BetterSqlite3(filePath, options);
    process.on('exit', () => this.database.close());
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //                                        Static Methods
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////
  /**
   * Create an in-memory SQLite database. This database will only exist till the process exists.
   * @returns A new {@link DatabaseBuilder}
   */
  static inMemory() {
    const constr = (filePath: string, options: BetterSqlite3.Options) => new SQLiteDatabase(filePath, options);
    return new DatabaseBuilder(constr, ":memory:");
  }

  /**
   * Create a file based SQLite database. By default, the file will be created if it doesn't exists.
   * @returns A new {@link DatabaseBuilder}
   */
  static file(filePath: string) {
    const constr = (filePath: string, options: BetterSqlite3.Options) => new SQLiteDatabase(filePath, options);
    return new DatabaseBuilder(constr, filePath);
  }
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //                                        Class Methods
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////

  /** Executes a SELECT and returns all rows that matches a certain SQL, given the parameters.
   *
   * When submitting `params`, you can either use Array parameters or Object-bind parameters.
   * (See {@link https://github.com/WiseLibs/better-sqlite3/blob/HEAD/docs/api.md#binding-parameters official docs})
   * ```
   * //Object-bind example
   * update("INSERT INTO people VALUES (:name, :age)", {name: "Jane", age: 26})
   * //Array example
   * update("INSERT INTO people (name, age) VALUES (?, ?)", ["Jane", 26])
   * ```
   *
   * @param sql the sql
   * @param params the parameters
   * @return All rows that matches the query. The array might be empty.
   */
  queryAll<T>(sql : string, ...params : unknown[]) : T[] {
    if (opIs(sql, 'SELECT')) {
      return this.database.prepare(sql).all(params) as T[];
    }
    throw new Error("Can only execute SELECT query");
  }

  /** Executes a SELECT and returns the first row that matches a certain SQL, given the parameters.
   *
   * When submitting `params`, you can either use Array parameters or Object-bind parameters.
   * (See {@link https://github.com/WiseLibs/better-sqlite3/blob/HEAD/docs/api.md#binding-parameters official docs})
   * ```
   * //Object-bind example
   * update("INSERT INTO people VALUES (:name, :age)", {name: "Jane", age: 26})
   * //Array example
   * update("INSERT INTO people (name, age) VALUES (?, ?)", ["Jane", 26])
   * ```
   *
   * @param sql the sql
   * @param params the parameters
   * @return The first row that matches the query. The result might be `undefined` if nothing matched.
   */
  queryFirst<T>(sql : string, ...params : unknown[]) : T|undefined {
    if (opIs(sql, 'SELECT')) {
      return this.database.prepare(sql).get(params) as T;
    }
    throw new Error("Can only execute SELECT query");
  }

  /**
   * Executes CREATE and DROP statements
   * @param sql the sql
   */
  ddl(sql: string) {
    if (opIs(sql, "CREATE", "DROP")) {
      this.database.prepare(sql).run();
    }
    else {
      throw new Error("Can only execute CREATE or DROP ddl query");
    }
  }

  /** Executes a INSERT/UPDATE/DELETE or REPLACE, given the sql and parameters.
   *
   * When submitting `params`, you can either use Array parameters or Object-bind parameters.
   * (See {@link https://github.com/WiseLibs/better-sqlite3/blob/HEAD/docs/api.md#binding-parameters official docs})
   * ```
   * //Object-bind example
   * update("INSERT INTO people VALUES (:name, :age)", {name: "Jane", age: 26})
   * //Array example
   * update("INSERT INTO people (name, age) VALUES (?, ?)", ["Jane", 26])
   * ```
   * @param sql the sql
   * @param params the parameters
   */
  update(sql : string, ...params : unknown[]) : UpdateResult {
    if (opIs(sql, "INSERT", "UPDATE", "DELETE", "REPLACE")) {
      const res = this.database.prepare(sql).run(...params);
      return {
        changes: res.changes,
        lastInsertRowId: res.lastInsertRowid as number
      };
    }
    throw new Error("Can only execute INSERT, UPDATE, DELETE or REPLACE query");
  }

  /** Executes a INSERT/UPDATE/DELETE or REPLACE, given the sql and parameters. This method requires Object-bind parameters in the query.
   * (See {@link https://github.com/WiseLibs/better-sqlite3/blob/HEAD/docs/api.md#binding-parameters official docs})
   *
   * ```
   * //Object-bind example
   * update("INSERT INTO people VALUES (:name, :age)", {name: "Jane", age: 26})
   * ```
   * @param sql the sql
   * @param params the params
   * @returns An array containing each input object, where each object has also been assigned an `id` property with the SQL insert Id (if it received one)
   */
  bulkUpdate<T extends object>(sql : string, params : Array<T>) : Array<T & {id: number}> {
    if (opIs(sql, "INSERT", "UPDATE", "DELETE", "REPLACE")) {
      const prep = this.database.prepare(sql);
      const out = new Array<T & {id: number}>();
      for(const param of params) {
        const res = prep.run(param);
        out.push({
          ...param,
          id: res.lastInsertRowid as number
        });
      }
      return out;
    }
    throw new Error("Can only execute INSERT, UPDATE, DELETE or REPLACE query");
  }

  /**
   * Wraps a series of values in parentheses and sql escapes them, making them ready for insert.
   *
   * @example toValueString("a",1) => "('a','1')"
   * @param fields
   */
  toValuesString(...fields: (string|number|bigint)[]) {
    const s = fields
      .map(s => s.toString())
      .map(s =>  escape(s))
      .map(s => `'${s}'`)
      .join(",");
    return "(" + s + ")";
  }

  /**
   * Executes a query without checking types, escaping, or anything.
   * @param sql The sql to execute
   */
  executeRaw(sql: string) {
    this.database.exec(sql);
  }

  /**
   * Executes the given function `fn` inside a database transaction. If `fn` returns normally, the transaction will
   * be committed. But if `fn` throws an exception, the transaction is rolled back (and the exception will propagate
   * as usual).
   * @param fn Function to run in a database transaction.
   */
  transaction<T>(fn: () => T) {
    try {
      const val = this.database.transaction(fn)();
      return val;
    }
    catch(ex) {
      console.log(ex);
      throw ex;
    }
  }
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                Module Convenience Functions
////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** Escapes special characters that might break a query.
     *
     * @param sql the query to escape
     */
function escape(sql: (string|number|bigint)) {
  return (typeof sql === 'string') ? sql.replace(/'/g, "''") : sql;
}


type SQL_OPERAND = "INSERT"|"SELECT"|"UPDATE"|"DELETE"|"REPLACE"|"CREATE"|"DROP";
function opIs(sql: string, ...allowed: SQL_OPERAND[]) {
  const func = sql.trim().split(' ', 2)[0].toUpperCase() as SQL_OPERAND;
  return allowed.includes(func);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                        Builder Class
////////////////////////////////////////////////////////////////////////////////////////////////////////////
type DatabaseConstructor = (filePath: string, options: BetterSqlite3.Options) => SQLiteDatabase;
class DatabaseBuilder {
  private constr: DatabaseConstructor;
  private databaseFile : string;

  private readOnly?: boolean;
  private fileMustExist?: boolean;
  private timeout?: number;
  private verboseLoggerFunc?: (message?: unknown, ...additionalArgs : unknown[]) => void;

  constructor(constructor: DatabaseConstructor, databaseFile: string) {
    this.constr = constructor;
    this.databaseFile = databaseFile;
  }

  /**
   * Open the database connection in readonly mode (default: false).
   * @param readOnly
   * @returns this {@link DatabaseBuilder}
   */
  setReadOnly(readOnly : boolean) {
    this.readOnly = readOnly;
    return this;
  }

  /**
   *  If the database does not exist, an Error will be thrown instead of creating a new file.
   * This option is ignored for in-memory, temporary, or readonly database connections (default: false).
   * @param fileMustExist
   * @returns this {@link DatabaseBuilder}
   */
  setFileMustExist(fileMustExist : boolean) {
    this.fileMustExist = fileMustExist;
    return this;
  }

  /**
   * The number of milliseconds to wait when executing queries on a locked database, before throwing a `SQLITE_BUSY` error.
   * (default: 5000)
   * @param timeoutMs
   * @returns this {@link DatabaseBuilder}
  */
  setTimeout(timeoutMs : number) {
    this.timeout = timeoutMs;
    return this;
  }

  /**
   * Configure verbose logging
   * @param func Function to call for every query executed on he database
   * @example setVerboseLogger(console.log)
   * @returns this {@link DatabaseBuilder}
   */
  setVerboseLogger(func : (message?: unknown, ...additionalArgs : unknown[]) => void) {
    this.verboseLoggerFunc = func;
    return this;
  }

  /**
   * Builds a new {@link SQLiteDatabase} given this builder's settings
   * @returns a new {@link SQLiteDatabase}
   */
  build() {
    return this.constr(this.databaseFile, {
      verbose: this.verboseLoggerFunc,
      fileMustExist: this.fileMustExist ?? false,
      readonly: this.readOnly ?? false,
      timeout: this.timeout ?? 5000,
    });
  }
}
