// interface GetCalendarFn {
//   (username: string, lastSynced: Date): Promise<Date[]>
// }


export const sourceTypes = ["leetcode", "gitlab", "wikipedia"] // FIX
export type SourceType = "leetcode" | "gitlab" | "wikipedia"

export abstract class BaseActivitySource {
  constructor(instance?: string) { 
    this.toString = () => {return `${this.constructor.name}(instance=${JSON.stringify(instance)})`}
  }

  abstract getCalendar(username: string, lastSynced: Date): Promise<Date[]>;
}

type BaseActivitySourceClass = typeof BaseActivitySource
export interface IActivitySource extends BaseActivitySourceClass {} // eslint-disable-line @typescript-eslint/no-empty-interface

// Ref: https://jijnasu.in/typescript-cannot-create-an-instance-of-an-abstract-class/
// TODO: WTH??
