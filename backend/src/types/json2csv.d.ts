declare module 'json2csv' {
  export class Parser<T = any> {
    constructor(opts?: { fields?: string[] });
    parse(rows: T[]): string;
  }
}