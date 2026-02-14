"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
});

type Values = z.infer<typeof schema>;

export default function WatchdogIssueForm() {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "" },
    mode: "onSubmit",
  });

  async function onSubmit(values: Values) {
    console.log(values);
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-5 pb-20 pt-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-[#1A2B38]">Report an issue</h1>
        <p className="text-sm text-soltas-muted">Help us keep the community safe and informed.</p>
      </div>

      <div className="rounded-2xl border border-[#6B9FB8]/25 bg-white p-7 shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue title</FormLabel>
                  <FormControl>
                    <Input placeholder="Short summary" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the issue..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </div>
    </main>
  );
}
