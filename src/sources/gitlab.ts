import { assert } from "console";
import { USER_AGENT } from "../common";

interface CalendarQueryResult {
    [key: string]: number;
}

export default async function getCalendar(username: string, lastSynced: Date): Promise<Date[]> {
    const response = await fetch(`https://gitlab.com/users/${username}/calendar.json`, {
        headers: {
            "User-Agent": USER_AGENT,
            Accept: "application/json",
            "content-type": "application/json",
            "Cache-Control": "no-cache",
        }
    })

    const raw: CalendarQueryResult = await response.json()
    const calendar = [];
    for (const yyyymmdd of Object.keys(raw)) {
        const date = new Date(yyyymmdd)
        assert(date.getTime() !== NaN)
        for (let i = 0; i < raw[yyyymmdd]; i++) {
            // A little trick to distinguish activities between each other within one day
            const offsetDate = new Date(date.getTime() + i)
            if (offsetDate > lastSynced) {
                calendar.push(offsetDate)
            }
        }
    }
    return calendar;
}
