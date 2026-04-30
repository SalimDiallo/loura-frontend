"use client";

/**
 * Composant de saisie de numéro de téléphone international
 * avec sélection d'indicatif pays et validation automatique.
 */

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ChevronDown, Phone } from "lucide-react";
import * as React from "react";

// ─── Configuration des pays ─────────────────────────────────────────────────

export interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  pattern?: RegExp;
  placeholder?: string;
}

export const COUNTRIES: Country[] = [
  {
    code: "GN",
    name: "Guinée",
    dialCode: "+224",
    flag: "🇬🇳",
    pattern: /^\+224\s?(?:0)?(\d{9})$/,
    placeholder: "6 23 70 77 22",
  },
  {
    code: "CI",
    name: "Côte d'Ivoire",
    dialCode: "+225",
    flag: "🇨🇮",
    pattern: /^\+225\s?(?:0)?(\d{10})$/,
    placeholder: "07 08 09 10 11",
  },
  {
    code: "SN",
    name: "Sénégal",
    dialCode: "+221",
    flag: "🇸🇳",
    pattern: /^\+221\s?(?:0)?(\d{9})$/,
    placeholder: "77 123 45 67",
  },
  {
    code: "ML",
    name: "Mali",
    dialCode: "+223",
    flag: "🇲🇱",
    pattern: /^\+223\s?(\d{8})$/,
    placeholder: "20 12 34 56",
  },
  {
    code: "BF",
    name: "Burkina Faso",
    dialCode: "+226",
    flag: "🇧🇫",
    pattern: /^\+226\s?(\d{8})$/,
    placeholder: "70 12 34 56",
  },
  {
    code: "TG",
    name: "Togo",
    dialCode: "+228",
    flag: "🇹🇬",
    pattern: /^\+228\s?(\d{8})$/,
    placeholder: "90 12 34 56",
  },
  {
    code: "BJ",
    name: "Bénin",
    dialCode: "+229",
    flag: "🇧🇯",
    pattern: /^\+229\s?(\d{8})$/,
    placeholder: "40 12 34 56",
  },
  {
    code: "CM",
    name: "Cameroun",
    dialCode: "+237",
    flag: "🇨🇲",
    pattern: /^\+237\s?(?:0)?(\d{9})$/,
    placeholder: "6 12 34 56 78",
  },
  {
    code: "GA",
    name: "Gabon",
    dialCode: "+241",
    flag: "🇬🇦",
    pattern: /^\+241\s?(\d{8})$/,
    placeholder: "06 12 34 56",
  },
  {
    code: "CG",
    name: "Congo",
    dialCode: "+242",
    flag: "🇨🇬",
    pattern: /^\+242\s?(\d{9})$/,
    placeholder: "06 123 45 67",
  },
  {
    code: "CD",
    name: "RD Congo",
    dialCode: "+243",
    flag: "🇨🇩",
    pattern: /^\+243\s?(\d{9})$/,
    placeholder: "81 234 56 78",
  },
  {
    code: "MA",
    name: "Maroc",
    dialCode: "+212",
    flag: "🇲🇦",
    pattern: /^\+212\s?(?:0)?(\d{9})$/,
    placeholder: "6 12 34 56 78",
  },
  {
    code: "TN",
    name: "Tunisie",
    dialCode: "+216",
    flag: "🇹🇳",
    pattern: /^\+216\s?(\d{8})$/,
    placeholder: "20 123 456",
  },
  {
    code: "DZ",
    name: "Algérie",
    dialCode: "+213",
    flag: "🇩🇿",
    pattern: /^\+213\s?(?:0)?(\d{9})$/,
    placeholder: "5 12 34 56 78",
  },
  {
    code: "FR",
    name: "France",
    dialCode: "+33",
    flag: "🇫🇷",
    pattern: /^\+33\s?(?:0)?(\d{9})$/,
    placeholder: "6 12 34 56 78",
  },
  {
    code: "CH",
    name: "Suisse",
    dialCode: "+41",
    flag: "🇨🇭",
    pattern: /^\+41\s?(?:0)?(\d{9})$/,
    placeholder: "79 123 45 67",
  },
  {
    code: "BE",
    name: "Belgique",
    dialCode: "+32",
    flag: "🇧🇪",
    pattern: /^\+32\s?(?:0)?(\d{9})$/,
    placeholder: "47 12 34 56",
  },
  {
    code: "CA",
    name: "Canada",
    dialCode: "+1",
    flag: "🇨🇦",
    pattern: /^\+1\s?(\d{10})$/,
    placeholder: "(416) 123-4567",
  },
  {
    code: "US",
    name: "États-Unis",
    dialCode: "+1",
    flag: "🇺🇸",
    pattern: /^\+1\s?(\d{10})$/,
    placeholder: "(212) 555-0123",
  },
];

// ─── Helper functions ───────────────────────────────────────────────────────

function formatPhoneNumber(value: string, country: Country): string {
  // Supprime tous les caractères non numériques sauf le +
  let cleaned = value.replace(/[^\d+]/g, "");
  
  // Si commence par le dial code, on le garde
  const dialCode = country.dialCode.replace("+", "");
  if (cleaned.startsWith(country.dialCode)) {
    cleaned = cleaned.slice(country.dialCode.length);
  } else if (cleaned.startsWith(dialCode)) {
    cleaned = cleaned.slice(dialCode.length);
  } else if (cleaned.startsWith("0") && country.code === "GN") {
    // Spécial Guinée: enlève le 0 initial
    cleaned = cleaned.slice(1);
  }
  
  return cleaned;
}

function getFormattedNumber(value: string, country: Country): string {
  const digits = value.replace(/\D/g, "");
  
  // Formatage selon le pays
  if (country.code === "GN" && digits.length === 9) {
    return `${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`;
  }
  if (country.code === "CI" && digits.length === 10) {
    return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
  }
  if (country.code === "FR" && digits.length === 9) {
    return `${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`;
  }
  
  // Groupe par 2 par défaut
  return digits.replace(/(\d{2})(?=\d)/g, "$1 ");
}

export function isValidPhoneNumber(value: string, country: Country): boolean {
  const fullNumber = `${country.dialCode}${value.replace(/\D/g, "")}`;
  if (country.pattern) {
    return country.pattern.test(fullNumber);
  }
  // Validation générique: minimum 8 chiffres après l'indicatif
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8;
}

export function getInternationalFormat(value: string, country: Country): string {
  const digits = value.replace(/\D/g, "");
  return `${country.dialCode}${digits}`;
}

// ─── Composant PhoneInput ────────────────────────────────────────────────────

interface PhoneInputProps {
  value: string;
  onChange: (value: string, country: Country) => void;
  onValidationChange?: (isValid: boolean) => void;
  defaultCountry?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
}

export function PhoneInput({
  value,
  onChange,
  onValidationChange,
  defaultCountry = "GN",
  disabled,
  placeholder,
  className,
  id,
  name,
}: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = React.useState<Country>(
    () => COUNTRIES.find((c) => c.code === defaultCountry) || COUNTRIES[0]
  );
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  // Synchronise la valeur externe avec l'affichage interne
  React.useEffect(() => {
    if (value) {
      // Extrait le dial code de la valeur si présent
      const country = COUNTRIES.find((c) => 
        value.startsWith(c.dialCode.replace("+", "00")) || 
        value.startsWith(c.dialCode)
      );
      if (country) {
        setSelectedCountry(country);
        // Échappe le + pour la regex
        const escapedDialCode = country.dialCode.replace(/\+/g, "\\+");
        const digits = value.replace(new RegExp(`^(${escapedDialCode}|00${country.dialCode.slice(1)})`, "g"), "");
        setInputValue(digits.replace(/\D/g, ""));
      } else {
        setInputValue(value.replace(/\D/g, ""));
      }
    }
  }, [value]);

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setOpen(false);
    // Réformate la valeur avec le nouveau pays
    const digits = inputValue.replace(/\D/g, "");
    const formatted = `${country.dialCode.replace("+", "00")}${digits}`;
    onChange(formatted, country);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value.replace(/[^\d\s]/g, "");
    
    // Limite la longueur selon le pays
    const maxLength = selectedCountry.code === "CI" ? 14 : 12;
    if (newValue.replace(/\s/g, "").length > maxLength) {
      newValue = newValue.slice(0, maxLength);
    }
    
    setInputValue(newValue);
    const digits = newValue.replace(/\D/g, "");
    const formatted = `${selectedCountry.dialCode.replace("+", "00")}${digits}`;
    onChange(formatted, selectedCountry);
    
    if (onValidationChange) {
      onValidationChange(isValidPhoneNumber(newValue, selectedCountry));
    }
  };

  const isValid = isValidPhoneNumber(inputValue, selectedCountry);
  const displayValue = inputValue ? getFormattedNumber(inputValue, selectedCountry) : "";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Sélecteur de pays */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[120px] shrink-0 justify-between"
            disabled={disabled}
          >
            <span className="flex items-center gap-2">
              <span className="text-lg">{selectedCountry.flag}</span>
              <span className="font-medium">{selectedCountry.dialCode}</span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0">
          <Command>
            <CommandInput placeholder="Rechercher un pays..." />
            <CommandList>
              <CommandEmpty>Aucun pays trouvé.</CommandEmpty>
              <CommandGroup>
                {COUNTRIES.map((country) => (
                  <CommandItem
                    key={country.code}
                    value={`${country.name} ${country.dialCode}`}
                    onSelect={() => handleCountrySelect(country)}
                    className="flex items-center gap-3"
                  >
                    <span className="text-xl">{country.flag}</span>
                    <div className="flex flex-col">
                      <span className="font-medium">{country.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {country.dialCode}
                      </span>
                    </div>
                    {selectedCountry.code === country.code && (
                      <svg
                        className="ml-auto h-4 w-4 text-primary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Champ de saisie */}
      <div className="relative flex-1">
        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id={id}
          name={name}
          type="tel"
          inputMode="tel"
          placeholder={placeholder || selectedCountry.placeholder}
          value={displayValue}
          onChange={handleInputChange}
          disabled={disabled}
          autoComplete="tel"
          className={cn(
            "pl-10",
            inputValue && !isValid && "border-destructive focus-visible:ring-destructive"
          )}
        />
      </div>
    </div>
  );
}

// ─── Hook utilitaire ─────────────────────────────────────────────────────────

export function usePhoneInput(defaultCountry = "GN") {
  const [value, setValue] = React.useState("");
  const [country, setCountry] = React.useState<Country>(
    () => COUNTRIES.find((c) => c.code === defaultCountry) || COUNTRIES[0]
  );
  const [isValid, setIsValid] = React.useState(false);

  const handleChange = (newValue: string, newCountry: Country) => {
    setValue(newValue);
    setCountry(newCountry);
    setIsValid(isValidPhoneNumber(newValue.replace(newCountry.dialCode, ""), newCountry));
  };

  return {
    value,
    country,
    isValid,
    handleChange,
    setValue,
    formattedValue: value ? getInternationalFormat(value.replace(country.dialCode, ""), country) : "",
  };
}
