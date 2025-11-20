"use client";
import {useEffect, useState} from "react";
import {useQuery, useMutation} from "convex/react";
import {api} from "@/convex/_generated/api";
import {Id, Doc} from "@/convex/_generated/dataModel";
import {useAppStore} from "@/lib/store";
import {useToast} from "@/components/ToastProvider";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {friendlyError} from "@/lib/errors";
import {Modal} from "@/components/Modal";
import {useQueryState, parseAsString} from "nuqs";

export default function FolderSidebar() {
    const folders = useQuery(api.folders.listFolders);
    const createFolder = useMutation(api.folders.createFolder);
    const deleteFolder = useMutation(api.folders.deleteFolder);
    const {selectedFolderId, setSelectedFolderId} = useAppStore();
    const {push} = useToast();
    const [folderParam, setFolderParam] = useQueryState(
        "folderId",
        parseAsString.withDefault("")
    );
    const [name, setName] = useState("");
    const [creating, setCreating] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<null | { id: string; name: string }>(null);

    useEffect(() => {
        if (folderParam && folderParam !== selectedFolderId) {
            setSelectedFolderId(folderParam);
        }
    }, [folderParam]);

    useEffect(() => {
        if (selectedFolderId && selectedFolderId !== folderParam) {
            setFolderParam(selectedFolderId);
        }
    }, [selectedFolderId]);

    // Inline validation for folder name: 1-50 chars and unique per user
    const nameError = (() => {
        const n = name.trim();
        if (!n) return "";
        if (n.length < 1 || n.length > 50) return "Folder name must be 1–50 characters.";
        if (folders && folders.some((f: Doc<"folders">) => f.name.toLowerCase() === n.toLowerCase()))
            return "You already have a folder with that name.";
        return "";
    })();

    const onCreate = async () => {
        const n = name.trim();
        if (!n) return;
        try {
            setCreating(true);
            const id = await createFolder({name: n});
            setName("");
            setSelectedFolderId(id as unknown as string);
            push({type: "success", description: "Folder created"});
        } catch (e) {
            push({type: "error", description: friendlyError(e)});
        } finally {
            setCreating(false);
        }
    };

    const requestDelete = (id: string, name: string) => {
        setDeleteTarget({id, name});
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        const id = deleteTarget.id;
        try {
            await deleteFolder({folderId: id as Id<"folders">});
            if (selectedFolderId === id) setSelectedFolderId(null);
            push({type: "success", description: "Folder deleted"});
        } catch (e) {
            push({type: "error", description: friendlyError(e)});
        } finally {
            setDeleteTarget(null);
        }
    };

    if (!folders) {
        return (
            <aside className="w-64 border-r bg-white flex flex-col">
                <div className="p-3 border-b">
                    <div className="flex gap-2">
                        <div className="flex-1 h-8 bg-neutral-200 rounded animate-pulse"/>
                        <div className="w-16 h-8 bg-neutral-200 rounded animate-pulse"/>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2 animate-pulse">
                    {Array.from({length: 8}).map((_, i: number) => (
                        <div key={i} className="h-8 bg-neutral-200 rounded"/>
                    ))}
                </div>
            </aside>
        );
    }

    return (
        <aside className="w-64 border-r bg-white flex flex-col">
            <div className="p-3 border-b">
                <div className="flex gap-2">
                    <Input placeholder="New folder" value={name} onChange={(e) => setName(e.target.value)}/>
                    <Button onClick={onCreate} size="sm" disabled={!name.trim() || !!nameError || creating}>
                        {creating ? "Adding..." : "Add"}
                    </Button>
                </div>
                {name && nameError && (
                    <div className="mt-2 text-xs text-red-600">{nameError}</div>
                )}
            </div>
            <div className="flex-1 overflow-y-auto">
                <ul>
                    {(folders || []).map((f: Doc<"folders">) => (
                        <li
                            key={f._id}
                            className={`flex items-center justify-between px-3 py-2 cursor-pointer ${selectedFolderId === f._id ? "bg-neutral-100" : ""}`}
                            onClick={() => setSelectedFolderId(f._id)}
                        >
                            <span className="truncate">{f.name}</span>
                            <button
                                className="text-xs text-red-600 hover:underline"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    requestDelete(f._id, f.name);
                                }}
                            >
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
            <Modal
                open={!!deleteTarget}
                title="Delete Folder"
                onClose={() => setDeleteTarget(null)}
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                        <Button variant="destructive" size="sm" onClick={confirmDelete}>Delete</Button>
                    </div>
                }
            >
                <p className="text-sm text-neutral-700">
                    Are you sure you want to delete “{deleteTarget?.name}”? This action requires the folder to be empty.
                </p>
            </Modal>
        </aside>
    );
}
