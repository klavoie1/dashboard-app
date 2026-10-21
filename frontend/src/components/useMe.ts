import {useEffect, useState} from "react";
import {api} from "../api.ts";

// Asked once per page load and shared by the navbar and the greeting
let request: Promise<string> | null = null

export function useMe() {
    const [name, setName] = useState<string | null>(null)
    useEffect(() => {
        request ??= api.get<{ username: string }>("/me").then((r) => r.data.username)
        let current = true
        void request.then((n) => current && setName(n)).catch(() => {})
        return () => { current = false }
    }, [])
    return name
}

// "klavoie" -> "KL", "jane doe" -> "JD"
export function initialsOf(name: string | null) {
    if (!name) return ""
    const parts = name.trim().split(/[\s._-]+/).filter(Boolean)
    return (parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).toUpperCase()
}

// "klavoie" -> "Klavoie"
export const displayName = (name: string | null) => (name ? name.charAt(0).toUpperCase() + name.slice(1) : "")
