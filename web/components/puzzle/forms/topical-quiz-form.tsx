"use client";

import { useFormContext } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  FormDescription,
} from "@/components/ui/form";

import type { TopicalQuizContent } from "@/lib/schemas";

interface FormValues {
  content: TopicalQuizContent;
}

export function TopicalQuizForm() {
  const { control } = useFormContext<FormValues>();

  return (
    <div className="space-y-6">
      {[0, 1, 2, 3, 4].map((questionIndex) => (
        <div key={questionIndex} className="glass-card p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Q{questionIndex + 1}</Badge>
            <span className="text-sm font-medium text-floodlight">
              Question {questionIndex + 1}
            </span>
          </div>

          {/* Question Text */}
          <FormField
            control={control}
            name={`content.questions.${questionIndex}.question`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Question</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Enter the question text..."
                    className="bg-white/5 border-white/10 min-h-[80px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Image URL (optional) */}
          <FormField
            control={control}
            name={`content.questions.${questionIndex}.imageUrl`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image URL (optional)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="https://..."
                    className="bg-white/5 border-white/10"
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Optional image to display with the question
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Options */}
          <div className="space-y-3">
            <FormLabel>Answer Options</FormLabel>
            <div className="grid grid-cols-2 gap-3">
              {([0, 1, 2, 3] as const).map((optionIndex) => (
                <FormField
                  key={optionIndex}
                  control={control}
                  name={`content.questions.${questionIndex}.options.${optionIndex}` as `content.questions.${number}.options.${0 | 1 | 2 | 3}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">
                        Option {String.fromCharCode(65 + optionIndex)}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value as string}
                          placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                          className="bg-white/5 border-white/10"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </div>

          {/* Correct Answer */}
          <FormField
            control={control}
            name={`content.questions.${questionIndex}.correctIndex`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correct Answer</FormLabel>
                <Select
                  value={String(field.value)}
                  onValueChange={(v) => field.onChange(Number(v))}
                >
                  <FormControl>
                    <SelectTrigger className="bg-white/5 border-white/10 w-40">
                      <SelectValue placeholder="Select correct" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0">A</SelectItem>
                    <SelectItem value="1">B</SelectItem>
                    <SelectItem value="2">C</SelectItem>
                    <SelectItem value="3">D</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ))}
    </div>
  );
}
