"use client";

import { useEffect, useState } from "react";
import { Box, Filament, UserSettings } from "@/db/types";
import { ArrowLeft, ListFilter } from "lucide-react";
import Input from "@/components/Input";
import SearchTipsModal from "@/components/filament/SearchTips";
import Footer from "@/components/Footer";
import { Select } from "@/components/Select";
import FilamentList from "@/components/filament/FilamentList";
import { endpoints, sidebarWidth } from "@/lib/constants";
import { handleApiError } from "@/lib/errors";
import { useDevice } from "@/lib/hooks";
import { app } from "@/lib/db";

export default function BoxPage({ params }: { params: Promise<{ boxId: string }> }) {
    const [isMobile, width] = useDevice();

    const [box, setBox] = useState<Box>();

    const [sortBy, setSortBy] = useState<keyof Filament>("index");
    const [search, setSearch] = useState("");

    const [openModal, setOpenModal] = useState("");

    const [userSettings, setUserSettings] = useState<UserSettings>();

    const [allFilament, setAllFilament] = useState<Filament[]>();
    const [allBoxes, setAllBoxes] = useState<Box[]>();

    useEffect(() => {
        app.settings.getUserSettings().then(res => {
            if (res.error)
                return void handleApiError(res.error, "toast");

            setUserSettings(res.data);
        });

        app.boxes.getAllBoxes().then(res => {
            if (res.error)
                return void handleApiError(res.error, "toast");

            setAllBoxes(res.data);
        });

        params.then(p => {
            app.boxes.getBox(p.boxId).then(res => {
                if (res.error)
                    return void handleApiError(res.error, "toast");

                setBox(res.data);
            });;

            app.filament.getAllFilaments(p.boxId).then(res => {
                if (res.error)
                    return void handleApiError(res.error, "toast");

                setAllFilament(res.data);
            });
        });
    }, []);

    return <>
        <div
            className="bg-bg w-full p-4 pt-2 mb-[75px] md:mb-0 h-full pb-20"
            style={{ marginLeft: (!width || isMobile) ? undefined : sidebarWidth }}
        >
            <div className="w-full bg-bg-light rounded-lg p-2 flex flex-col md:flex-row md:items-center gap-1 drop-shadow-lg">
                <div className="flex flex-row items-center gap-1 w-full md:w-[unset]">
                    <ListFilter className="min-w-[24px]" />
                    <Select
                        value={sortBy}
                        onChange={v => setSortBy(v as keyof Filament)}
                        className="h-full w-full"
                        options={{
                            index: "Custom",
                            name: "Name",
                            brand: "Brand",
                            material: "Material",
                            lastUsed: "Last Used",
                            currentMass: "Current Mass",
                            startingMass: "Starting Mass",
                        }}
                    />
                </div>
                <Input
                    placeholder="Search Filament..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="focus-within:w-full transition-all"
                    onFocus={() => setOpenModal((userSettings?.seenSearchTips ?? true) ? "" : "searchtips")}
                />
            </div>

            <a href={endpoints.filament} className="style flex items-center gap-1 mt-2">
                <ArrowLeft /> Back
            </a>

            {box && <FilamentList
                data={allFilament}
                title={box.name}
                allowAdd
                sortBy={sortBy}
                search={search}
                userSettings={userSettings}
                boxId={box.id}
                allBoxes={allBoxes}
            />}

            <Footer />
        </div>

        <SearchTipsModal
            open={openModal === "searchtips"}
            onClose={() => {
                setUserSettings({ ...userSettings!, seenSearchTips: true });
                setOpenModal("");
            }}
        />
    </>;
}
