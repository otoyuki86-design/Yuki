"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Company, Event, EntrySheet, InterviewNote, ApplicationStatus } from "@/types";

interface JobStore {
  companies: Company[];
  addCompany: (company: Omit<Company, "id" | "createdAt" | "updatedAt">) => string;
  updateCompany: (id: string, updates: Partial<Company>) => void;
  deleteCompany: (id: string) => void;
  updateStatus: (id: string, status: ApplicationStatus) => void;

  addEvent: (event: Omit<Event, "id">) => void;
  updateEvent: (companyId: string, eventId: string, updates: Partial<Event>) => void;
  deleteEvent: (companyId: string, eventId: string) => void;
  toggleEventCompleted: (companyId: string, eventId: string) => void;

  addEntrySheet: (es: Omit<EntrySheet, "id" | "createdAt" | "updatedAt">) => void;
  updateEntrySheet: (companyId: string, esId: string, updates: Partial<EntrySheet>) => void;
  deleteEntrySheet: (companyId: string, esId: string) => void;

  addInterviewNote: (note: Omit<InterviewNote, "id" | "createdAt">) => void;
  updateInterviewNote: (companyId: string, noteId: string, updates: Partial<InterviewNote>) => void;
  deleteInterviewNote: (companyId: string, noteId: string) => void;
}

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const useJobStore = create<JobStore>()(
  persist(
    (set) => ({
      companies: [],

      addCompany: (company) => {
        const id = generateId();
        set((s) => ({
          companies: [
            ...s.companies,
            {
              ...company,
              id,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        }));
        return id;
      },

      updateCompany: (id, updates) =>
        set((s) => ({
          companies: s.companies.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
          ),
        })),

      deleteCompany: (id) =>
        set((s) => ({ companies: s.companies.filter((c) => c.id !== id) })),

      updateStatus: (id, status) =>
        set((s) => ({
          companies: s.companies.map((c) =>
            c.id === id ? { ...c, status, updatedAt: new Date().toISOString() } : c
          ),
        })),

      addEvent: (event) =>
        set((s) => ({
          companies: s.companies.map((c) =>
            c.id === event.companyId
              ? { ...c, events: [...c.events, { ...event, id: generateId() }] }
              : c
          ),
        })),

      updateEvent: (companyId, eventId, updates) =>
        set((s) => ({
          companies: s.companies.map((c) =>
            c.id === companyId
              ? {
                  ...c,
                  events: c.events.map((e) => (e.id === eventId ? { ...e, ...updates } : e)),
                }
              : c
          ),
        })),

      deleteEvent: (companyId, eventId) =>
        set((s) => ({
          companies: s.companies.map((c) =>
            c.id === companyId
              ? { ...c, events: c.events.filter((e) => e.id !== eventId) }
              : c
          ),
        })),

      toggleEventCompleted: (companyId, eventId) =>
        set((s) => ({
          companies: s.companies.map((c) =>
            c.id === companyId
              ? {
                  ...c,
                  events: c.events.map((e) =>
                    e.id === eventId ? { ...e, completed: !e.completed } : e
                  ),
                }
              : c
          ),
        })),

      addEntrySheet: (es) =>
        set((s) => ({
          companies: s.companies.map((c) =>
            c.id === es.companyId
              ? {
                  ...c,
                  entrySheets: [
                    ...c.entrySheets,
                    {
                      ...es,
                      id: generateId(),
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    },
                  ],
                }
              : c
          ),
        })),

      updateEntrySheet: (companyId, esId, updates) =>
        set((s) => ({
          companies: s.companies.map((c) =>
            c.id === companyId
              ? {
                  ...c,
                  entrySheets: c.entrySheets.map((es) =>
                    es.id === esId
                      ? { ...es, ...updates, updatedAt: new Date().toISOString() }
                      : es
                  ),
                }
              : c
          ),
        })),

      deleteEntrySheet: (companyId, esId) =>
        set((s) => ({
          companies: s.companies.map((c) =>
            c.id === companyId
              ? { ...c, entrySheets: c.entrySheets.filter((es) => es.id !== esId) }
              : c
          ),
        })),

      addInterviewNote: (note) =>
        set((s) => ({
          companies: s.companies.map((c) =>
            c.id === note.companyId
              ? {
                  ...c,
                  interviewNotes: [
                    ...c.interviewNotes,
                    { ...note, id: generateId(), createdAt: new Date().toISOString() },
                  ],
                }
              : c
          ),
        })),

      updateInterviewNote: (companyId, noteId, updates) =>
        set((s) => ({
          companies: s.companies.map((c) =>
            c.id === companyId
              ? {
                  ...c,
                  interviewNotes: c.interviewNotes.map((n) =>
                    n.id === noteId ? { ...n, ...updates } : n
                  ),
                }
              : c
          ),
        })),

      deleteInterviewNote: (companyId, noteId) =>
        set((s) => ({
          companies: s.companies.map((c) =>
            c.id === companyId
              ? { ...c, interviewNotes: c.interviewNotes.filter((n) => n.id !== noteId) }
              : c
          ),
        })),
    }),
    { name: "yuki-job-store" }
  )
);
