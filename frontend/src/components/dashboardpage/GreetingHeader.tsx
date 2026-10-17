import {useState} from "react";


export default function GreetingHeader() {
    const [date] = useState(() => new Date());
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = d.getUTCDay() || 7;            // Monday = 1 ... Sunday = 7
    d.setUTCDate(d.getUTCDate() + 4 - day);    // jump to the Thursday of this week
    const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
    const week = Math.ceil(((d.getTime() - yearStart) / 86_400_000 + 1) / 7);
    const dateFormat = date.toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    return (
        <section>
            <h1 className="text-3xl font-semibold">Hello, User!</h1>
            <p className="text-xs font-light">{dateFormat} • Week {week}</p>
        </section>
    )

}