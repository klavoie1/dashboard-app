import {useEffect, useState} from "react";
import { api } from "../api";

type Characters = { id: number; name: string; role: string; about: string; };

export default function Characters() {
    const [characters, setCharacters] = useState<Characters[]>([]);

    useEffect(() => {
        api.get<Characters[]>("/characters").then((r) => setCharacters(r.data));
    }, []);

    return (
        <>
        <main  className="mt-4 space-y-2">
            <div
                className="relative overflow-x-auto bg-neutral-primary-soft shadow-xs rounded-base border border-default">
                <table className="w-full text-sm text-left text-body">
                    <thead className="text-sm text-body bg-neutral-secondary-medium border-b border-default-medium">
                    <tr>
                        <th scope="col" className="px-6 py-3 font-medium">
                            ID
                        </th>
                        <th scope="col" className="px-6 py-3 font-medium">
                            Name
                        </th>
                        <th scope="col" className="px-6 py-3 font-medium">
                            Role
                        </th>
                        <th scope="col" className="px-6 py-3 font-medium">
                            About
                        </th>
                        <th scope="col" className="px-6 py-3 font-medium">
                            <span className="sr-only">Edit</span>
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    {characters.map((c) =>  {
                        return (
                    <tr className="bg-neutral-primary-soft border-b border-default hover:bg-neutral-secondary-medium" key={c.id}>
                        <th scope="row" className="px-6 py-4 font-medium text-heading whitespace-nowrap">
                            {c.id}
                        </th>
                        <td className="px-6 py-4">
                            {c.name}
                        </td>
                        <td className="px-6 py-4">
                            {c.role}
                        </td>
                        <td className="px-6 py-4">
                            {c.about}
                        </td>
                        <td className="px-6 py-4 text-right">
                            <a href="#" className="font-medium text-fg-brand hover:underline">Edit</a>
                        </td>
                    </tr>
                        )
                    })}
                    </tbody>
                </table>
            </div>
        </main>
</>
    )
}