"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar, ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";

export interface Period {
    from: string; // YYYY-MM-DD
    to: string; // YYYY-MM-DD
    label: string;
}

const toISO = (d: Date) => d.toISOString().split("T")[0];

const startOfMonth = (d = new Date()) =>
    new Date(d.getFullYear(), d.getMonth(), 1);
const startOfQuarter = (d = new Date()) =>
    new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1);
const startOfYear = (d = new Date()) => new Date(d.getFullYear(), 0, 1);
const daysAgo = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
};

export function defaultPeriod(): Period {
    const today = new Date();
    const from = startOfMonth(today);
    return {
        from: toISO(from),
        to: toISO(today),
        label: "Mois en cours",
    };
}

const PRESETS: Array<() => Period> = [
    () => {
        const today = new Date();
        return {
            from: toISO(today),
            to: toISO(today),
            label: "Aujourd'hui",
        };
    },
    () => ({
        from: toISO(daysAgo(6)),
        to: toISO(new Date()),
        label: "7 derniers jours",
    }),
    () => ({
        from: toISO(daysAgo(29)),
        to: toISO(new Date()),
        label: "30 derniers jours",
    }),
    () => ({
        from: toISO(startOfMonth()),
        to: toISO(new Date()),
        label: "Mois en cours",
    }),
    () => ({
        from: toISO(startOfQuarter()),
        to: toISO(new Date()),
        label: "Trimestre en cours",
    }),
    () => ({
        from: toISO(startOfYear()),
        to: toISO(new Date()),
        label: "Année en cours",
    }),
];

interface PeriodFilterProps {
    value: Period;
    onChange: (period: Period) => void;
}

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
    const [open, setOpen] = useState(false);
    const [draftFrom, setDraftFrom] = useState(value.from);
    const [draftTo, setDraftTo] = useState(value.to);

    const displayLabel = useMemo(() => {
        const from = new Date(value.from).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
        const to = new Date(value.to).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
        return `${value.label} · ${from} → ${to}`;
    }, [value]);

    const applyPreset = (preset: () => Period) => {
        const p = preset();
        setDraftFrom(p.from);
        setDraftTo(p.to);
        onChange(p);
        setOpen(false);
    };

    const applyCustom = () => {
        if (!draftFrom || !draftTo || draftFrom > draftTo) return;
        onChange({
            from: draftFrom,
            to: draftTo,
            label: "Personnalisé",
        });
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    <span className="text-xs truncate max-w-[300px]">
                        {displayLabel}
                    </span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="p-3 border-b">
                    <p className="text-xs font-semibold mb-2">Périodes prédéfinies</p>
                    <div className="grid grid-cols-2 gap-1">
                        {PRESETS.map((preset, i) => {
                            const p = preset();
                            const isActive = p.label === value.label;
                            return (
                                <Button
                                    key={i}
                                    variant={isActive ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => applyPreset(preset)}
                                    className="justify-start text-xs h-8"
                                >
                                    {p.label}
                                </Button>
                            );
                        })}
                    </div>
                </div>
                <div className="p-3 space-y-2">
                    <p className="text-xs font-semibold">Période personnalisée</p>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label className="text-[10px] text-muted-foreground">
                                Du
                            </Label>
                            <Input
                                type="date"
                                value={draftFrom}
                                onChange={(e) => setDraftFrom(e.target.value)}
                                max={draftTo}
                                className="h-8 text-xs"
                            />
                        </div>
                        <div>
                            <Label className="text-[10px] text-muted-foreground">
                                Au
                            </Label>
                            <Input
                                type="date"
                                value={draftTo}
                                onChange={(e) => setDraftTo(e.target.value)}
                                min={draftFrom}
                                className="h-8 text-xs"
                            />
                        </div>
                    </div>
                    <Button
                        size="sm"
                        onClick={applyCustom}
                        disabled={!draftFrom || !draftTo || draftFrom > draftTo}
                        className="w-full h-8 text-xs"
                    >
                        Appliquer
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
