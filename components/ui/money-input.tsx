"use client";

/**
 * MoneyInput — saisie de montants en GNF (ou autre devise) avec :
 * - formatage live des milliers (ex: ``1 234 567``) pendant la frappe
 * - suffix devise dans le champ (``GNF`` par défaut)
 * - sous-titre USD optionnel pour transparence côté utilisateur
 * - boutons +/- avec ``step`` configurable (par défaut 1 000 GNF)
 * - valeur exposée en ``string`` numérique pure (sans formatage), pour
 *   rester compatible avec les payloads API qui attendent du JSON-safe
 *
 * Le composant est **contrôlé** : on lui passe ``value`` (string ou
 * number), il appelle ``onChange`` avec une string contenant uniquement
 * des chiffres et au plus un point décimal.
 *
 * Stockage backend : les modèles Django utilisent ``DecimalField``, donc
 * passer une string est OK (DRF convertit). Si tu veux un number côté
 * appelant, parse avec ``Number(value)``.
 *
 * Ne réinventons pas la roue : on s'appuie sur ``Input`` shadcn pour
 * hériter des classes et de l'``aria-invalid``.
 */

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";
import * as React from "react";

export interface MoneyInputProps
    extends Omit<
        React.ComponentProps<"input">,
        "value" | "onChange" | "type" | "min" | "max" | "step"
    > {
    /** Valeur courante (string numérique pure ou number). */
    value: string | number | null | undefined;
    /** Callback : reçoit une string numérique pure (ex: "1234.50") ou "". */
    onChange: (value: string) => void;
    /** Code devise affiché en suffix. Défaut : ``GNF``. */
    currency?: string;
    /** Pas pour les boutons +/- et la touche flèche haut/bas. Défaut : 1000. */
    step?: number;
    /** Borne minimale (incluse). */
    min?: number;
    /** Borne maximale (incluse). */
    max?: number;
    /** Affiche un sous-titre ``≈ $X.XX`` sous l'input. */
    showUsdSubtitle?: boolean;
    /** Cache les boutons +/-. */
    hideStepButtons?: boolean;
    /** Marque l'input comme invalide (déclenche le style destructive). */
    invalid?: boolean;
    /** Active le formatage des milliers à la saisie. Défaut : true. */
    formatThousands?: boolean;
    /** Nombre de décimales autorisées. Défaut : 2. */
    decimals?: number;
}

/** Sépare les milliers avec un espace insécable fin (cohérent FR). */
function formatNumberWithSpaces(raw: string): string {
    if (!raw) return "";
    const [intPart, decPart] = raw.split(".");
    const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return decPart !== undefined ? `${formatted},${decPart}` : formatted;
}

/** Retire tout ce qui n'est pas chiffre ou séparateur, normalise en "1234.56". */
function sanitize(input: string, decimals: number): string {
    if (!input) return "";
    // Accepte ``,`` et ``.`` comme séparateur décimal côté UI.
    let cleaned = input.replace(/\s/g, "").replace(/,/g, ".");
    // Garde le 1er point uniquement.
    const firstDot = cleaned.indexOf(".");
    if (firstDot !== -1) {
        cleaned =
            cleaned.slice(0, firstDot + 1) +
            cleaned.slice(firstDot + 1).replace(/\./g, "");
    }
    // Retire tout caractère non chiffre / non point.
    cleaned = cleaned.replace(/[^\d.]/g, "");
    if (decimals === 0 && cleaned.includes(".")) {
        cleaned = cleaned.split(".")[0];
    } else if (cleaned.includes(".")) {
        const [i, d] = cleaned.split(".");
        cleaned = `${i}.${d.slice(0, decimals)}`;
    }
    // Pas de zéros tête sauf "0." ou seul "0".
    if (cleaned.length > 1 && cleaned.startsWith("0") && !cleaned.startsWith("0.")) {
        cleaned = cleaned.replace(/^0+/, "") || "0";
    }
    return cleaned;
}

export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
    function MoneyInput(
        {
            value,
            onChange,
            currency = "GNF",
            step = 1000,
            min,
            max,
            showUsdSubtitle = false,
            hideStepButtons = false,
            invalid = false,
            formatThousands = true,
            decimals = 2,
            className,
            disabled,
            placeholder = "0",
            ...rest
        },
        ref
    ) {
        // On garde une valeur "string pure" en interne pour gérer les états
        // intermédiaires (ex: l'utilisateur tape ``1.`` avant ``1.5``) sans
        // que la conversion number ne tronque le ``.`` final.
        const stringValue = React.useMemo(() => {
            if (value === null || value === undefined || value === "") return "";
            if (typeof value === "number") {
                if (!Number.isFinite(value)) return "";
                return String(value);
            }
            return sanitize(String(value), decimals);
        }, [value, decimals]);

        const displayValue = formatThousands
            ? formatNumberWithSpaces(stringValue)
            : stringValue;

        const numericValue = stringValue === "" ? null : Number(stringValue);

        const handleChange = (raw: string) => {
            const cleaned = sanitize(raw, decimals);
            // On pousse la string nettoyée — pas de bornes ici : les bornes
            // ne s'appliquent qu'aux clics +/- et au blur, pour ne pas
            // bloquer l'utilisateur en cours de frappe (ex: il tape ``5``
            // pour finir à ``50000`` avec min=10000, on ne veut pas
            // l'empêcher d'écrire le ``5`` initial).
            onChange(cleaned);
        };

        const clamp = (n: number): number => {
            let r = n;
            if (typeof min === "number" && r < min) r = min;
            if (typeof max === "number" && r > max) r = max;
            return r;
        };

        const stepBy = (delta: number) => {
            const current = numericValue ?? 0;
            const next = clamp(current + delta);
            // On formatte selon le ``decimals`` autorisé sans aller à
            // ``toFixed`` qui forcerait des zéros décimatifs en sortie.
            const factor = Math.pow(10, decimals);
            const rounded = Math.round(next * factor) / factor;
            onChange(String(rounded));
        };

        const handleKeyDown = (
            e: React.KeyboardEvent<HTMLInputElement>
        ) => {
            if (e.key === "ArrowUp") {
                e.preventDefault();
                stepBy(step);
            } else if (e.key === "ArrowDown") {
                e.preventDefault();
                stepBy(-step);
            }
        };

        const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            // Au blur, on applique les bornes — l'utilisateur a fini de
            // saisir. Ça réajuste un montant en dehors des limites sans
            // l'avoir bloqué pendant la frappe.
            if (numericValue !== null && Number.isFinite(numericValue)) {
                const clamped = clamp(numericValue);
                if (clamped !== numericValue) {
                    onChange(String(clamped));
                }
            }
            rest.onBlur?.(e);
        };

        // Conversion USD pour le sous-titre — uniquement si demandé pour
        // // ne pas déclencher de fetch pour rien.
        // const { usdToGnf } = useUsdToGnfRate();
        // const usdLabel = React.useMemo(() => {
        //     if (!showUsdSubtitle || numericValue === null) return null;
        //     if (currency.toUpperCase() !== "GNF") return null;
        //     return formatUsd(gnfToUsd(numericValue, usdToGnf));
        // }, [showUsdSubtitle, numericValue, currency, usdToGnf]);

        return (
            <div className={cn("flex flex-col gap-1", className)}>
                <div className="relative flex items-center">
                    {!hideStepButtons && (
                        <button
                            type="button"
                            tabIndex={-1}
                            aria-label="Diminuer"
                            onClick={() => stepBy(-step)}
                            disabled={disabled}
                            className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7 inline-flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Minus className="h-4 w-4" />
                        </button>
                    )}
                    <Input
                        ref={ref}
                        // ``inputMode=decimal`` ouvre un pavé numérique sur
                        // mobile sans empêcher la saisie d'un point ; on
                        // évite ``type="number"`` qui sur Chrome perd les
                        // espaces de formatage et casse le state local.
                        inputMode="decimal"
                        autoComplete="off"
                        spellCheck={false}
                        value={displayValue}
                        placeholder={placeholder}
                        disabled={disabled}
                        aria-invalid={invalid || undefined}
                        onChange={(e) => handleChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleBlur}
                        className={cn(
                            "text-right font-mono tabular-nums",
                            !hideStepButtons && "pl-9",
                            "pr-14"
                        )}
                        {...rest}
                    />
                    {/* <span
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground pointer-events-none select-none"
                        aria-hidden
                    >
                        {currency}
                    </span> */}
                    {!hideStepButtons && (
                        <button
                            type="button"
                            tabIndex={-1}
                            aria-label="Augmenter"
                            onClick={() => stepBy(step)}
                            disabled={disabled}
                            className="absolute right-0 top-1/2 -translate-y-1/2 h-7 w-7 inline-flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                    )}
                </div>
                {/* {usdLabel && (
                    <span className="text-[10px] text-muted-foreground/70 font-mono pl-1">
                        ≈ {usdLabel}
                    </span>
                )} */}
            </div>
        );
    }
);
