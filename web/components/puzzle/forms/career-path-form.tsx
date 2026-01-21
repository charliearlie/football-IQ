"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { Plus, Trash2, GripVertical } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

import type { CareerPathContent } from "@/lib/schemas";

interface FormValues {
  content: CareerPathContent;
}

export function CareerPathForm() {
  const { control, register, formState: { errors } } = useFormContext<FormValues>();

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "content.career_steps",
  });

  return (
    <div className="space-y-6">
      {/* Player Name (Answer) */}
      <FormField
        control={control}
        name="content.answer"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Player Name (Answer)</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="e.g., Zlatan Ibrahimovic"
                className="bg-white/5 border-white/10"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Career Steps */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            Career Steps ({fields.length})
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({ type: "club", text: "", year: "", apps: null, goals: null })
            }
            className="border-white/10"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Step
          </Button>
        </div>

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="glass-card p-4 space-y-3"
            >
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                <span className="text-sm font-medium text-floodlight">
                  Step {index + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="ml-auto h-8 w-8 text-muted-foreground hover:text-red-card"
                  onClick={() => remove(index)}
                  disabled={fields.length <= 3}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Type */}
                <FormField
                  control={control}
                  name={`content.career_steps.${index}.type`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">Type</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white/5 border-white/10">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="club">Club</SelectItem>
                          <SelectItem value="loan">Loan</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {/* Year */}
                <FormField
                  control={control}
                  name={`content.career_steps.${index}.year`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">Year(s)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="2019-2023"
                          className="bg-white/5 border-white/10"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Club Name */}
              <FormField
                control={control}
                name={`content.career_steps.${index}.text`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Club Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Manchester United"
                        className="bg-white/5 border-white/10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Apps & Goals */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={control}
                  name={`content.career_steps.${index}.apps`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">Apps (optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          placeholder="123"
                          className="bg-white/5 border-white/10"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name={`content.career_steps.${index}.goals`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">Goals (optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          placeholder="45"
                          className="bg-white/5 border-white/10"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ))}
        </div>

        {fields.length < 3 && (
          <p className="text-sm text-red-card">
            At least 3 career steps required
          </p>
        )}
      </div>
    </div>
  );
}
