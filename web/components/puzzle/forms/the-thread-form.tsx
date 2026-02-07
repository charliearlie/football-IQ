"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import {
  Loader2,
  Search,
  Plus,
  Trash2,
  DollarSign,
  Shirt,
  Sparkles,
  X,
  AlertTriangle,
  EyeOff,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

import type { TheThreadContent } from "@/lib/schemas";
import { searchClubsForForm } from "@/app/(dashboard)/calendar/actions";

interface FormValues {
  content: TheThreadContent;
}

interface ClubResult {
  id: string;
  name: string;
}

export function TheThreadForm() {
  const { control, watch, setValue } = useFormContext<FormValues>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "content.path",
  });

  const threadType = watch("content.thread_type");
  const currentClubId = watch("content.correct_club_id");
  const currentClubName = watch("content.correct_club_name");
  const pathValues = watch("content.path");
  const hiddenCount = pathValues?.filter((b: { is_hidden?: boolean }) => b.is_hidden).length ?? 0;

  return (
    <div className="space-y-6">
      {/* Thread Type Toggle */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <Shirt className="h-4 w-4 text-[#58CC02]" />
          Thread Type
        </h3>
        <FormField
          control={control}
          name="content.thread_type"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={field.value === "sponsor" ? "default" : "outline"}
                    onClick={() => field.onChange("sponsor")}
                    className={cn(
                      "flex-1",
                      field.value === "sponsor"
                        ? "bg-[#58CC02] hover:bg-[#46A302] text-black"
                        : "border-white/10 hover:bg-white/5"
                    )}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Shirt Sponsor
                  </Button>
                  <Button
                    type="button"
                    variant={field.value === "supplier" ? "default" : "outline"}
                    onClick={() => field.onChange("supplier")}
                    className={cn(
                      "flex-1",
                      field.value === "supplier"
                        ? "bg-[#58CC02] hover:bg-[#46A302] text-black"
                        : "border-white/10 hover:bg-white/5"
                    )}
                  >
                    <Shirt className="h-4 w-4 mr-2" />
                    Kit Supplier
                  </Button>
                </div>
              </FormControl>
              <FormDescription>
                {field.value === "sponsor"
                  ? "The brands that appeared on the front of the shirt"
                  : "The manufacturers who made the kit (Adidas, Nike, etc.)"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Club Selector */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-4">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <Search className="h-4 w-4 text-[#58CC02]" />
          Answer Club
        </h3>
        <ClubSelector
          control={control}
          currentClubId={currentClubId}
          currentClubName={currentClubName}
          setValue={setValue}
        />
      </div>

      {/* Brand Timeline */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-white">
              {threadType === "sponsor" ? "Shirt Sponsors" : "Kit Suppliers"} ({fields.length})
            </h3>
            <Badge
              variant="outline"
              className={cn(
                "text-xs flex items-center gap-1",
                hiddenCount === 3
                  ? "border-[#58CC02]/50 text-[#58CC02]"
                  : hiddenCount === 0
                    ? "border-white/20 text-gray-400"
                    : "border-[#EF4444]/50 text-[#EF4444]"
              )}
            >
              <EyeOff className="h-3 w-3" />
              {hiddenCount}/3 hidden
            </Badge>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ brand_name: "", years: "", is_hidden: false })}
            className="border-white/10 hover:bg-white/5"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Brand
          </Button>
        </div>

        {hiddenCount > 0 && hiddenCount !== 3 && (
          <div className="flex items-center gap-2 text-[#EF4444] text-sm pl-8">
            <AlertTriangle className="h-4 w-4" />
            <span>Exactly 3 brands must be hidden (currently {hiddenCount})</span>
          </div>
        )}

        {/* Timeline container */}
        <div className="relative pl-8">
          {/* Timeline line */}
          <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-white/10" />

          {fields.map((field, index) => (
            <BrandEntry
              key={field.id}
              control={control}
              index={index}
              isFirst={index === 0}
              canDelete={fields.length > 3}
              onDelete={() => remove(index)}
            />
          ))}
        </div>

        {fields.length < 3 && (
          <div className="flex items-center gap-2 text-[#EF4444] text-sm mt-2 pl-8">
            <AlertTriangle className="h-4 w-4" />
            <span>At least 3 brands required</span>
          </div>
        )}
      </div>

      {/* Kit Lore */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#FACC15]" />
          Kit Lore (Fun Fact)
        </h3>
        <FormField
          control={control}
          name="content.kit_lore.fun_fact"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="e.g., Arsenal's JVC deal was the first major Japanese sponsorship in English football"
                  className="bg-white/5 border-white/10 min-h-[80px]"
                />
              </FormControl>
              <FormDescription>
                An interesting fact about this club&apos;s kit history (revealed after game ends)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

// ============================================================================
// BRAND ENTRY COMPONENT
// ============================================================================

interface BrandEntryProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  index: number;
  isFirst: boolean;
  canDelete: boolean;
  onDelete: () => void;
}

function BrandEntry({ control, index, isFirst, canDelete, onDelete }: BrandEntryProps) {
  return (
    <div className="relative mb-4">
      {/* Timeline node */}
      <div
        className={cn(
          "absolute left-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold -translate-x-1/2",
          isFirst
            ? "bg-[#58CC02] text-black"
            : "bg-white/10 text-white/60 border border-white/20"
        )}
        style={{ left: "-20px" }}
      >
        {index + 1}
      </div>

      {/* Brand card */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex-1 space-y-3">
            {/* Brand name */}
            <FormField
              control={control}
              name={`content.path.${index}.brand_name`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-gray-400">Brand Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={index === 0 ? "e.g., JVC" : "e.g., Nike"}
                      className="bg-white/5 border-white/10"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Years */}
            <FormField
              control={control}
              name={`content.path.${index}.years`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-gray-400">Years</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., 1982-1999 or 2020-"
                      className="bg-white/5 border-white/10"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Format: YYYY-YYYY or YYYY- for ongoing
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Delete button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDelete}
            disabled={!canDelete}
            className={cn(
              "h-8 w-8 p-0 mt-6",
              !canDelete && "opacity-30 cursor-not-allowed"
            )}
          >
            <Trash2 className="h-4 w-4 text-[#EF4444]" />
          </Button>
        </div>

        {/* Hidden toggle */}
        <FormField
          control={control}
          name={`content.path.${index}.is_hidden`}
          render={({ field }) => (
            <FormItem className="flex items-center gap-2 pt-1">
              <FormControl>
                <Checkbox
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="text-xs text-gray-400 !mt-0 cursor-pointer">
                Hidden (revealed as hint)
              </FormLabel>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

// ============================================================================
// CLUB SELECTOR COMPONENT
// ============================================================================

interface ClubSelectorProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  currentClubId: string;
  currentClubName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: any;
}

function ClubSelector({
  control,
  currentClubId,
  currentClubName,
  setValue,
}: ClubSelectorProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ClubResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setQuery(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const result = await searchClubsForForm(value);
        if (result.success && result.data) {
          setResults(result.data);
          setShowDropdown(result.data.length > 0);
        }
      } catch {
        console.error("Club search failed");
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  const handleSelectClub = useCallback(
    (club: ClubResult) => {
      setValue("content.correct_club_id", club.id, { shouldValidate: true });
      setValue("content.correct_club_name", club.name, { shouldValidate: true });
      setQuery("");
      setShowDropdown(false);
    },
    [setValue]
  );

  const handleClear = useCallback(() => {
    setValue("content.correct_club_id", "", { shouldValidate: true });
    setValue("content.correct_club_name", "", { shouldValidate: true });
    setQuery("");
  }, [setValue]);

  // Show selected club or search input
  if (currentClubId && currentClubName) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-md bg-white/5 border border-white/10">
          <Badge variant="outline" className="text-xs">
            {currentClubId}
          </Badge>
          <span className="text-sm text-white">{currentClubName}</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="h-9 w-9 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search for club..."
          value={query}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9 bg-white/5 border-white/10"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-60 overflow-auto rounded-md border border-white/10 bg-[#1e293b] shadow-lg">
          {results.map((club) => (
            <button
              key={club.id}
              type="button"
              className="w-full px-3 py-2 text-left text-sm hover:bg-white/5 flex items-center justify-between"
              onClick={() => handleSelectClub(club)}
            >
              <span className="text-white">{club.name}</span>
              <Badge variant="outline" className="text-[10px]">
                {club.id}
              </Badge>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {showDropdown && results.length === 0 && !isSearching && query.length >= 2 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 p-3 rounded-md border border-white/10 bg-[#1e293b] text-sm text-gray-400 text-center">
          No clubs found for &quot;{query}&quot;
        </div>
      )}

      {/* Hidden form fields for validation */}
      <FormField
        control={control}
        name="content.correct_club_id"
        render={({ field }) => (
          <FormItem className="hidden">
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="content.correct_club_name"
        render={({ field }) => (
          <FormItem className="hidden">
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
