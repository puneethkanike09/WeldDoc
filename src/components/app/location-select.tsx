"use client";

import { useEffect, useMemo, useState } from "react";
import { Select, Input, Field } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

const API = "https://countriesnow.space/api/v0.1";

/**
 * Cascading Country → State → District selects backed by the free CountriesNow
 * API (no key required). The combined "District, State, Country" string is
 * written to a hidden input so the existing server action keeps working.
 */
export function LocationSelect({
  name = "place_of_birth",
  initialValue,
}: {
  name?: string;
  initialValue?: string | null;
}) {
  // Stored as "District, State, Country" — parse back for edit mode.
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

  // Load the country list once.
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
      .catch(() => active && setError("Could not load countries."));
    return () => {
      active = false;
    };
  }, []);

  // Load states whenever the country changes.
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
      .catch(() => active && setError("Could not load states."))
      .finally(() => active && setLoadingStates(false));
    return () => {
      active = false;
    };
  }, [country]);

  // Load cities/districts whenever the state changes.
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

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <input type="hidden" name={name} value={combined} />

      <Field label="Country">
        <Select
          value={country}
          onChange={(e) => {
            setCountry(e.target.value);
            setState("");
            setDistrict("");
          }}
        >
          <option value="">Select country</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="State / region">
        <div className="relative">
          <Select
            value={state}
            disabled={!country || loadingStates}
            onChange={(e) => {
              setState(e.target.value);
              setDistrict("");
            }}
          >
            <option value="">
              {loadingStates ? "Loading…" : "Select state"}
            </option>
            {states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          {loadingStates && (
            <Loader2 className="pointer-events-none absolute right-9 top-3.5 h-4 w-4 animate-spin text-steel" />
          )}
        </div>
      </Field>

      <Field label="District / city">
        {cities.length > 0 || loadingCities ? (
          <div className="relative">
            <Select
              value={district}
              disabled={!state || loadingCities}
              onChange={(e) => setDistrict(e.target.value)}
            >
              <option value="">
                {loadingCities ? "Loading…" : "Select district"}
              </option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            {loadingCities && (
              <Loader2 className="pointer-events-none absolute right-9 top-3.5 h-4 w-4 animate-spin text-steel" />
            )}
          </div>
        ) : (
          // Fallback to free text when the API has no city list for the state.
          <Input
            value={district}
            disabled={!state}
            placeholder="Type district"
            onChange={(e) => setDistrict(e.target.value)}
          />
        )}
      </Field>

      {error && (
        <p className="text-xs text-expired sm:col-span-3">
          {error} You can still pick the available options.
        </p>
      )}
    </div>
  );
}
