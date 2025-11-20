"use client";
import React from "react";
import {useQuery, useMutation} from "convex/react";
import {api} from "@/convex/_generated/api";
import {Id, Doc} from "@/convex/_generated/dataModel";
import {useAppStore} from "@/lib/store";
import {useToast} from "@/components/ToastProvider";
import {Modal} from "@/components/Modal";
import {Button} from "@/components/ui/button";
import {friendlyError} from "@/lib/errors";
import {useUser} from "@clerk/nextjs";
import {useQueryState, parseAsString} from "nuqs";

// Type for folder item in dropdown
type FolderItem = { _id: string; name: string };

function CardView({card, onDelete, onUpdate, folders, onMove}: {
    card: Doc<"cards">;
    onDelete: (id: Id<"cards">) => void;
    onUpdate: (id: Id<"cards">, patch: { translation?: string; exampleSentences?: string[] }) => void;
    folders: FolderItem[];
    onMove: (id: Id<"cards">, folderId: Id<"folders">) => void;
}) {
    const [flipped, setFlipped] = React.useState(false);
    const [editOpen, setEditOpen] = React.useState(false);
    const [moveOpen, setMoveOpen] = React.useState(false);
    const [translation, setTranslation] = React.useState(card.translation);
    const [examples, setExamples] = React.useState<string[]>(card.exampleSentences);
    const [moveTarget, setMoveTarget] = React.useState<string>(card.folderId);
    const [savingEdit, setSavingEdit] = React.useState(false);
    const editError = (() => {
        const t = (translation || "").trim();
        if (!t) return "Translation is required.";
        if (!examples || examples.length !== 3) return "Exactly 3 example sentences required.";
        if (examples.some((e: string) => !(e || "").trim())) return "Example sentences cannot be empty.";
        return "";
    })();
    const {user} = useUser();
    const role = (user?.publicMetadata as { role?: string })?.role || "user";
    return (
        <div className="border rounded p-3 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-neutral-500">{new Date(card.createdAt).toLocaleString()}</div>
                {role === "admin" && (
                    <button
                        className="text-xs text-red-600 hover:underline"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(card._id);
                        }}
                    >
                        Delete
                    </button>
                )}
            </div>
            <div className="flex items-center gap-2 mb-2">
                <button className="text-xs underline" onClick={() => setEditOpen(true)}>Edit</button>
                <button className="text-xs underline" onClick={() => setMoveOpen(true)}>Move</button>
            </div>
            <Modal
                open={editOpen}
                title="Edit Card"
                onClose={() => setEditOpen(false)}
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}
                                disabled={savingEdit}>Cancel</Button>
                        <Button
                            size="sm"
                            disabled={!!editError || savingEdit}
                            onClick={async () => {
                                if (editError) return;
                                try {
                                    setSavingEdit(true);
                                    await onUpdate(card._id, {translation, exampleSentences: examples});
                                    setEditOpen(false);
                                } finally {
                                    setSavingEdit(false);
                                }
                            }}
                        >
                            {savingEdit ? "Saving..." : "Save"}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-3">
                    <div>
                        <div className="text-xs text-neutral-600 mb-1">Translation</div>
                        <input className="w-full border rounded px-2 py-1" value={translation}
                               onChange={(e) => setTranslation(e.target.value)}/>
                    </div>
                    <div>
                        <div className="text-xs text-neutral-600 mb-1">Examples (3)</div>
                        {examples.map((ex, i) => (
                            <input key={i} className="w-full border rounded px-2 py-1 mb-1" value={ex}
                                   onChange={(e) => {
                                       const next = [...examples];
                                       next[i] = e.target.value;
                                       setExamples(next);
                                   }}/>
                        ))}
                    </div>
                    {editError && <div className="text-xs text-red-600">{editError}</div>}
                </div>
            </Modal>
            <Modal
                open={moveOpen}
                title="Move Card"
                onClose={() => setMoveOpen(false)}
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setMoveOpen(false)}>Cancel</Button>
                        <Button size="sm" disabled={moveTarget === card.folderId} onClick={() => {
                            onMove(card._id, moveTarget as Id<"folders">);
                            setMoveOpen(false);
                        }}>Move</Button>
                    </div>
                }
            >
                <select className="w-full border rounded px-2 py-2" value={moveTarget}
                        onChange={(e) => setMoveTarget(e.target.value)}>
                    {folders.map((f) => (
                        <option key={f._id} value={f._id}>{f.name}</option>
                    ))}
                </select>
            </Modal>
            <div className="cursor-pointer" onClick={() => setFlipped((f) => !f)}>
                {!flipped ? (
                    <div>
                        <div className="text-2xl font-semibold">{card.originalWord}</div>
                        <div className="text-sm text-neutral-500">Click to flip</div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="font-medium">Translation</div>
                        <div>{card.translation}</div>
                        <div className="font-medium">Breakdown</div>
                        <ul className="list-disc pl-5">
                            {card.characterBreakdown.map((s: string, i: number) => (
                                <li key={i}>{s}</li>
                            ))}
                        </ul>
                        <div className="font-medium">Examples</div>
                        <ul className="list-disc pl-5">
                            {card.exampleSentences.map((s: string, i: number) => (
                                <li key={i}>{s}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function CardList() {
    const {selectedFolderId} = useAppStore();
    const deleteCard = useMutation(api.cards.deleteCard);
    const updateCard = useMutation(api.cards.updateCard);
    const moveCard = useMutation(api.cards.moveCard);
    const folders = useQuery(api.folders.listFolders);
    const {push} = useToast();
    const [q] = useQueryState("q", parseAsString.withDefault(""));

    // Use separate queries for search vs list
    const searchResults = useQuery(
        api.cards.searchCards,
        selectedFolderId && q
            ? {q, folderId: selectedFolderId as Id<"folders">}
            : "skip"
    );
    const listResults = useQuery(
        api.cards.listCardsByFolder,
        selectedFolderId && !q
            ? {folderId: selectedFolderId as Id<"folders">}
            : "skip"
    );
    const cards = q ? searchResults : listResults;

    if (!selectedFolderId) {
        return <div className="text-neutral-500">Select a folder to view cards.</div>;
    }

    const handleDelete = async (id: Id<"cards">) => {
        try {
            await deleteCard({cardId: id});
            push({type: "success", description: "Card deleted"});
        } catch (e) {
            push({type: "error", description: friendlyError(e)});
        }
    };

    const handleUpdate = async (
        id: Id<"cards">,
        patch: { translation?: string; exampleSentences?: string[] }
    ) => {
        try {
            await updateCard({
                cardId: id,
                translation: patch.translation,
                exampleSentences: patch.exampleSentences,
            });
            push({type: "success", description: "Card updated"});
        } catch (e) {
            push({type: "error", description: friendlyError(e)});
        }
    };

    const handleMove = async (id: Id<"cards">, folderId: Id<"folders">) => {
        try {
            await moveCard({cardId: id, folderId});
            push({type: "success", description: "Card moved"});
        } catch (e) {
            push({type: "error", description: friendlyError(e)});
        }
    };

    if (!cards) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 animate-pulse">
                {Array.from({length: 6}).map((_, i) => (
                    <div key={i} className="h-40 bg-neutral-200 rounded"/>
                ))}
            </div>
        );
    }

    if ((cards || []).length === 0) {
        return (
            <div className="text-neutral-500">
                {q ? (
                    <span>No matches for “{q}” in this folder.</span>
                ) : (
                    <span>No cards in this folder yet. Use the form above to generate one.</span>
                )}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(cards || []).map((c: Doc<"cards">) => (
                <CardView
                    key={c._id}
                    card={c}
                    onDelete={handleDelete}
                    onUpdate={handleUpdate}
                    onMove={handleMove}
                    folders={(folders || []).map((f) => ({_id: f._id, name: f.name}))}
                />
            ))}
        </div>
    );
}
