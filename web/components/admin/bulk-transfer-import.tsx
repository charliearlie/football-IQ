"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { bulkImportTransfers } from "@/app/(dashboard)/admin/guess-the-transfer/actions";

export function BulkTransferImport() {
  const [jsonInput, setJsonInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    { index: number; errors: string[] }[] | null
  >(null);
  const [result, setResult] = useState<{
    inserted: number;
    dates: string[];
  } | null>(null);

  async function handleImport() {
    setError(null);
    setValidationErrors(null);
    setResult(null);

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonInput);
    } catch {
      setError("Invalid JSON — could not parse input");
      return;
    }

    if (!Array.isArray(parsed)) {
      setError("Expected a JSON array of transfer objects");
      return;
    }

    setLoading(true);
    try {
      const res = await bulkImportTransfers(parsed);

      if (!res.success) {
        if (res.validationErrors) {
          setValidationErrors(res.validationErrors);
        } else {
          setError(res.error ?? "Unknown error");
        }
        return;
      }

      setResult({ inserted: res.inserted!, dates: res.dates! });
      setJsonInput("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Paste a JSON array of transfer objects. Each will be assigned to the next
        empty date from 27th March 2026 onwards.
      </p>

      <Textarea
        value={jsonInput}
        onChange={(e) => setJsonInput(e.target.value)}
        placeholder={`[\n  {\n    "answer": "Eden Hazard",\n    "from_club": "Chelsea",\n    "to_club": "Real Madrid",\n    "fee": "€100M",\n    "from_club_color": "#034694",\n    "to_club_color": "#FEBE10",\n    "from_club_abbreviation": "CHE",\n    "to_club_abbreviation": "RMA",\n    "hints": ["2019", "ATT", "BE"]\n  },\n  {\n    "answer": "Virgil van Dijk",\n    "from_club": "Southampton",\n    "to_club": "Liverpool",\n    "fee": "£75M",\n    "hints": ["2018", "DEF", "NL"]\n  }\n]`}
        rows={16}
        className="bg-white/5 border-white/10 font-mono text-sm"
      />

      <Button onClick={handleImport} disabled={loading || !jsonInput.trim()}>
        {loading ? "Importing..." : "Import Transfers"}
      </Button>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {validationErrors && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 space-y-2">
          <p className="text-sm font-medium text-destructive">
            Validation failed — no transfers were imported:
          </p>
          {validationErrors.map((ve) => (
            <div key={ve.index} className="text-sm text-destructive/80">
              <span className="font-mono">Item {ve.index}:</span>{" "}
              {ve.errors.join(", ")}
            </div>
          ))}
        </div>
      )}

      {result && (
        <div className="rounded-md border border-emerald-500/50 bg-emerald-500/10 p-3 space-y-1">
          <p className="text-sm font-medium text-emerald-400">
            Imported {result.inserted} transfers
          </p>
          <p className="text-xs text-muted-foreground">
            Dates filled: {result.dates[0]} to{" "}
            {result.dates[result.dates.length - 1]}
          </p>
        </div>
      )}
    </div>
  );
}
