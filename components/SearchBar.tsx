"use client";
import {useEffect} from "react";
import {useQueryState, parseAsString} from "nuqs";

export default function SearchBar() {
    const [q, setQ] = useQueryState("q", parseAsString.withDefault(""));

    useEffect(() => {
        // no-op to read q param on mount
    }, [q]);

    return (
        <div className="space-y-2">
            <input
                className="w-full border rounded px-3 py-2"
                placeholder="Search your cards by original word"
                value={q}
                onChange={(e) => setQ(e.target.value)}
            />
        </div>
    );
}
