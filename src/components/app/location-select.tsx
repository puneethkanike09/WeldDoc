"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input, Field } from "@/components/ui/input";
import { Combobox, type ComboboxOption } from "@/components/sui/combobox";
import {
  FieldError,
  useValidationProxy,
  ValidationProxyInput,
} from "@/lib/use-validation-proxy";
import { Loader2 } from "lucide-react";

const toOptions = (names: string[]): ComboboxOption[] =>
  names.map((n) => ({ value: n, label: n }));

const API = "https://countriesnow.space/api/v0.1";

function locationMessage(
  country: string,
  state: string,
  district: string,
): string {
  if (!country) return "Select a country.";
  if (!state) return "Select a state / region.";
  if (!district.trim()) return "Enter a district / city.";
  return "";
}

/**
 * Cascading Country → State → District selects backed by the free CountriesNow
 * API (no key required). The combined "District, State, Country" string is
 * written to a hidden input so the existing server action keeps working.
 */
export function LocationSelect({
  name = "place_of_birth",
  initialValue,
  required,
  onValuesChange,
  fieldErrors,
}: {
  name?: string;
  initialValue?: string | null;
  required?: boolean;
  onValuesChange?: (values: {
    country: string;
    state: string;
    district: string;
    combined: string;
  }) => void;
  fieldErrors?: {
    country?: string;
    state?: string;
    district?: string;
  };
}) {
  const parsed = useMemo(() => {
    const parts = (initialValue ?? "")
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length === 3)
      return { district: parts[0], state: parts[1], country: parts[2] };
    if (parts.length === 2) return { district: "", state: parts[0], country: parts[1] };
    if (parts.length === 1) return { district: "", state: "", country: parts[0] };
    return { district: "", state: "", country: "" };
  }, [initialValue]);

  const [countries, setCountries] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  const [country, setCountry] = useState(parsed.country);
  const [state, setState] = useState(parsed.state);
  const [district, setDistrict] = useState(parsed.district);

  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`${API}/countries/iso`)
      .then((r) => r.json())
      .then((j) => {
        if (!active) return;
        const names: string[] = (j?.data ?? [])
          .map((d: { name: string }) => d.name)
          .sort();
        setCountries(names);
      })
      .catch(() => {
        if (!active) return;
        setError("Could not load countries.");
        toast.error("Couldn't load the country list", {
          description: "Check your connection and reopen the form.",
        });
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!country) {
      setStates([]);
      return;
    }
    let active = true;
    setLoadingStates(true);
    setError(null);
    fetch(`${API}/countries/states`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country }),
    })
      .then((r) => r.json())
      .then((j) => {
        if (!active) return;
        const names: string[] = (j?.data?.states ?? [])
          .map((s: { name: string }) => s.name)
          .sort();
        setStates(names);
      })
      .catch(() => {
        if (!active) return;
        setError("Could not load states.");
        toast.error("Couldn't load states for this country");
      })
      .finally(() => active && setLoadingStates(false));
    return () => {
      active = false;
    };
  }, [country]);

  useEffect(() => {
    if (!country || !state) {
      setCities([]);
      return;
    }
    let active = true;
    setLoadingCities(true);
    fetch(`${API}/countries/state/cities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country, state }),
    })
      .then((r) => r.json())
      .then((j) => {
        if (!active) return;
        const names: string[] = Array.isArray(j?.data) ? [...j.data].sort() : [];
        setCities(names);
      })
      .catch(() => active && setCities([]))
      .finally(() => active && setLoadingCities(false));
    return () => {
      active = false;
    };
  }, [country, state]);

  const combined = [district, state, country].filter(Boolean).join(", ");
  const complete = Boolean(country && state && district.trim());
  const validationMessage = locationMessage(country, state, district);
  const { ref: proxyRef } = useValidationProxy({
    required,
    valid: !required || complete,
    message: validationMessage || "Complete place of birth.",
  });

  const onValuesChangeRef = useRef(onValuesChange);
  onValuesChangeRef.current = onValuesChange;

  useEffect(() => {
    onValuesChangeRef.current?.({ country, state, district, combined });
  }, [country, state, district, combined]);

  return (
    <div className="relative grid gap-3 sm:grid-cols-3">
      <ValidationProxyInput
        name={name}
        value={complete ? combined : ""}
        proxyRef={proxyRef}
        required={required}
      />

      <div>
        <Field label="Country" required={required}>
          <Combobox
            options={toOptions(countries)}
            value={country}
            invalid={Boolean(fieldErrors?.country)}
            placeholder="Select country"
            searchPlaceholder="Search countries…"
            emptyText="No country found."
            onChange={(v) => {
              setCountry(v);
              setState("");
              setDistrict("");
            }}
          />
        </Field>
        <FieldError show={Boolean(fieldErrors?.country)} message={fieldErrors?.country ?? ""} />
      </div>

      <div>
        <Field label="State / region" required={required}>
          <Combobox
            options={toOptions(states)}
            value={state}
            invalid={Boolean(fieldErrors?.state)}
            disabled={!country || loadingStates}
            placeholder={loadingStates ? "Loading…" : "Select state"}
            searchPlaceholder="Search states…"
            emptyText="No state found."
            onChange={(v) => {
              setState(v);
              setDistrict("");
            }}
          />
        </Field>
        <FieldError show={Boolean(fieldErrors?.state)} message={fieldErrors?.state ?? ""} />
      </div>

      <div>
        <Field label="District / city" required={required}>
          {cities.length > 0 || loadingCities ? (
            <div className="relative">
              <Combobox
                options={toOptions(cities)}
                value={district}
                invalid={Boolean(fieldErrors?.district)}
                disabled={!state || loadingCities}
                placeholder={loadingCities ? "Loading…" : "Select district"}
                searchPlaceholder="Search districts…"
                emptyText="No district found."
                onChange={setDistrict}
              />
              {loadingCities && (
                <Loader2 className="pointer-events-none absolute right-9 top-3.5 h-4 w-4 animate-spin text-steel" />
              )}
            </div>
          ) : (
            <Input
              value={district}
              disabled={!state}
              placeholder="Type district"
              className={cn(
                fieldErrors?.district &&
                  "border-ember ring-1 ring-ember/20",
              )}
              onChange={(e) => setDistrict(e.target.value)}
            />
          )}
        </Field>
        <FieldError show={Boolean(fieldErrors?.district)} message={fieldErrors?.district ?? ""} />
      </div>

      {error && (
        <p className="text-xs text-expired sm:col-span-3">
          {error} You can still pick the available options.
        </p>
      )}
    </div>
  );
}
