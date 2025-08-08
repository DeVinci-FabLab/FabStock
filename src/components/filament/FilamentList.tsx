"use client";

import { useEffect, useState } from "react";
import FilamentEntry from "./Filament";
import { Box, Filament, UserSettings } from "@/db/types";
import Skeleton from "../Skeleton";
import { ArchiveRestore, ChevronUp, Pencil, Plus, QrCode, Trash2, X } from "lucide-react";
import AddFilamentModal from "./AddFilament";
import Divider from "../Divider";
import Button, { ButtonStyles } from "../Button";
import Subtext from "../Subtext";
import { deleteFilaments, reorderFilament } from "@/lib/db/filament";
import QRCodeModal from "./QRCodeModal";
import Modal, { ModalFooter } from "../Modal";
import { ReorderableList } from "../RerorderList";
import MoveFilamentModal from "./MoveFilament";

export default function FilamentList({ data, userSettings, allowAdd, title, sortBy, search, boxId, allBoxes, collapsable, onModify }:
    { data?: Filament[] | null, userSettings?: UserSettings, allowAdd?: boolean, boxId?: string, allBoxes?: Box[],
        isEmpty?: boolean, title: string, sortBy?: keyof Filament, search?: string, onModify?: () => void, collapsable?: boolean,
}) {
    const [editMode, setEditMode] = useState(false);
    const [openModal, setOpenModal] = useState("");
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [collapsed, setCollapsed] = useState(false);

    const [filament, setFilament] = useState(data);
    const [searchedFilament, setSearchedFilament] = useState<number[] | null>(null);
    const [selectedFilament, setSelectedFilament] = useState<Filament[]>([]);

    function sort(filament: Filament[]) {
        if (!sortBy || !filament)
            return;

        let newFilament: Filament[] = [...filament];

        if (sortBy === "index")
            newFilament = [...filament.sort((a, b) => a.index - b.index)];

        if (sortBy === "currentMass" || sortBy === "startingMass")
            newFilament = [...filament.sort((a, b) => b[sortBy] - a[sortBy])];

        if (sortBy === "name" || sortBy === "brand" || sortBy === "material" || sortBy === "lastUsed")
            newFilament = [...filament.sort((a, b) => {
                let aVal = a[sortBy];
                let bVal = b[sortBy];
                if (sortBy !== "lastUsed") {
                    aVal = (aVal as string).toUpperCase();
                    bVal = (bVal as string).toUpperCase();
                }
                if (aVal < bVal)
                    return -1;
                if (aVal > bVal)
                    return 1;
                return 0;
            })];

        if (sortBy === "lastUsed")
            newFilament.reverse();

        setFilament(newFilament);
    }

    function updateSearch(filament: Filament[]) {
        if (!search || !filament) {
            setSearchedFilament(null);

            if (filament)
                sort(filament);

            return;
        }

        let searchField = "name";

        if (search.startsWith("b:"))
            searchField = "brand";
        else if (search.startsWith("m:"))
            searchField = "material";

        search = search.replace(/^.:/, "").trim();

        const toShow = [];

        for (const f of filament) {
            if ((f[searchField as keyof Filament] as string).toLowerCase().includes(search.toLowerCase()))
                toShow.push(filament.indexOf(f));
        }

        sort(filament);
        setSearchedFilament(toShow);
    }

    function deleteFilament(i: number) {
        if (!filament)
            return;
        setFilament([...filament.slice(0, i), ...filament.slice(i + 1)]);
        onModify?.();
    }

    function deleteSelectedFilament() {
        if (!selectedFilament)
            return;
        setFilament(filament?.filter(f => !selectedFilament.includes(f)) ?? []);
        setSelectedFilament([]);
        onModify?.();
    }

    function editFilament(i: number, newData: Filament) {
        if (!filament)
            return;

        if (newData.box !== filament[i].box)
            setFilament([...filament.slice(0, i), ...filament.slice(i + 1)]);
        else
            setFilament([...filament.slice(0, i), newData, ...filament.slice(i + 1)]);
        onModify?.();
    }

    function moveFilament(newFilament: Filament[]) {
        if (!filament)
            return;

        setFilament(filament.filter(f => !newFilament.map(f => f.id).includes(f.id)));
        setSelectedFilament([]);
        onModify?.();
    }

    function onReorderFilament(newElements: React.ReactElement[]) {
        if (!filament)
            return;

        const newFilamentIds = newElements.map(e => e.key!.slice(2));

        const newFilament = newFilamentIds.map(id => filament.find(f => f.id === id)!).map((f, i) => ({ ...f, index: i }));

        reorderFilament(newFilament);
        setFilament(newFilament);
    }

    function selectChangeFilament(filament: Filament, selected: boolean) {
        if (!filament)
            return;

        if (selected)
            setSelectedFilament([...selectedFilament, filament]);
        else
            setSelectedFilament(selectedFilament.filter(f => f !== filament));
    }

    useEffect(() => {
        if (!data)
            return;

        setFilament(data);
        updateSearch(data);
    }, [data]);

    useEffect(() => {
        if (!filament)
            return;

        sort(filament);
    }, [sortBy]);

    useEffect(() => {
        if (!filament)
            return;

        updateSearch(filament);
    }, [search]);

    useEffect(() => {
        setSelectedFilament([]);
    }, [editMode]);

    const filamentElements = filament?.map((f, i) => (
        (searchedFilament === null || searchedFilament.includes(i)) &&
            <FilamentEntry
                key={f.id}
                filament={f}
                isPreview={editMode}

                onDelete={() => deleteFilament(i)}
                onEdit={f => editFilament(i, f)}
                onAdd={f => setFilament([...filament, f])}

                userSettings={userSettings}

                allBoxes={allBoxes}

                editMode={editMode}
                selected={selectedFilament.includes(f)}
                onSelectedChange={v => selectChangeFilament(f, v)}
            />
    ));

    return (<div>
        <div className="flex flex-row items-center justify-between mt-1">
            <div className="flex flex-row gap-2 items-center">
                {collapsable && <ChevronUp
                    size={32}
                    className={`${collapsed ? "rotate-180" : ""} transition-all cursor-pointer`}
                    onClick={() => setCollapsed(!collapsed)}
                />}

                <h2>{title}</h2>
            </div>
            {allowAdd && <div className="flex flex-row gap-2">
                {editMode && <>
                    <Button
                        look={ButtonStyles.secondary}
                        disabled={!selectedFilament.length}
                        onClick={() => setOpenModal("move")}
                    >
                        <ArchiveRestore size={32} />
                    </Button>
                    <Button
                        look={ButtonStyles.secondary}
                        disabled={!selectedFilament.length}
                        onClick={() => setOpenModal("qrcode")}
                    >
                        <QrCode size={32} />
                    </Button>
                    <Button
                        look={ButtonStyles.danger}
                        disabled={!selectedFilament.length}
                        onClick={() => setOpenModal("delete")}
                    >
                        <Trash2 size={32} />
                    </Button>
                </>}

                <Button
                    onClick={() => setEditMode(!editMode)}
                    look={editMode ? ButtonStyles.primary : ButtonStyles.secondary}
                >
                    {editMode ? <X size={32} /> : <Pencil size={24} />}
                </Button>

                {!editMode && <Button
                    onClick={() => setOpenModal("add")}
                >
                    <Plus size={32} />
                </Button>}
            </div>}
        </div>
        <Divider />

        <div className={`${(!editMode && filament) && "grid grid-cols-2"} ${!filament && "md:grid md:grid-cols-2"}
            md:flex md:flex-row gap-2 md:flex-wrap`}>
            {!filament && <Skeleton
                width="100%"
                height={270}
                count={2}
                className="flex flex-row gap-2 md:flex-wrap [&>br]:hidden w-full *:w-full md:*:!w-[175px]"
            />}

            {!collapsed && (editMode ?
                <ReorderableList onChange={onReorderFilament}>
                    {filamentElements}
                </ReorderableList> :
                filamentElements
            )}

            {(allowAdd && !!filament && !editMode && !collapsed) &&
            <div
                className={`bg-bg-light rounded-lg p-2 flex flex-col gap-1 items-center justify-center relative md:w-[175px]
                    cursor-pointer transition-all border-2 border-transparent hover:border-primary w-full min-h-[270px]
                    drop-shadow-lg`}
                onClick={() => setOpenModal("add")}
            >
                <Plus className="absolute-center text-gray-500" size={64} />
            </div>
            }

            {(filament && !allowAdd && !filament.length) && <Subtext>Nothing to see here.</Subtext>}

            {(userSettings && filament) && <AddFilamentModal
                open={openModal === "add"}
                onClose={() => setOpenModal("")}
                onAdd={f => setFilament([...filament, ...(Array.isArray(f) ? f : [f])])}
                userSettings={userSettings}
                boxId={boxId}
            />}
        </div>

        {editMode && <Subtext>Click & drag filament to reorder</Subtext>}

        <QRCodeModal open={openModal === "qrcode"} onClose={() => setOpenModal("")} filament={selectedFilament} />

        {allBoxes && <MoveFilamentModal
            open={openModal === "move"}
            onClose={() => setOpenModal("")}
            filament={selectedFilament}
            allBoxes={allBoxes}
            onMove={moveFilament}
        />}

        <Modal open={openModal === "delete"} onClose={() => setOpenModal("")} title="Delete Filament">
            <Subtext className="mb-2">Removes this filament from your library.</Subtext>
            <Divider />
            <p className="w-full text-center text-danger">
                Are you sure you want to delete these {selectedFilament.length} filaments?
            </p>
            <p className="w-full text-center">This will also delete all of the logs made with these filaments.</p>
            <p className="w-full text-center">Any QR codes you've made with these filaments will also stop working.</p>
            <ModalFooter
                tip={`Don't delete the filament if you just used it all up. 
                    Instead, press the 'Move to Empty' button in the filament's menu.`}
            >
                <Button look={ButtonStyles.secondary} onClick={() => setOpenModal("")}>Cancel</Button>
                <Button look={ButtonStyles.danger} onClick={() => {
                    setDeleteLoading(true);
                    deleteFilaments(selectedFilament.map(f => f.id)).then(deleteSelectedFilament)
                        .then(() => setDeleteLoading(false))
                        .then(() => setOpenModal(""));
                }} loading={deleteLoading}>Confirm</Button>
            </ModalFooter>
        </Modal>
    </div>);
}
