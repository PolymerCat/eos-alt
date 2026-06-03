"use client";

import { useMemo, useState, useTransition } from "react";
import { Pencil, Plus, Star, Trash2, X } from "lucide-react";
import {
  createEmergencyContact,
  deleteEmergencyContact,
  setPrimaryEmergencyContact,
  updateEmergencyContact,
  type EmergencyContactInput,
} from "@/app/sos/actions";
import type { DataMode, DeliveryMethod, EmergencyContact, SosRequest } from "@/types/emergency";
import StatusBadge from "@/components/test-ui/StatusBadge";
import PageSection from "@/components/test-ui/PageSection";
import SosAlertFlow from "@/components/sos/SosAlertFlow";

interface SosWorkspaceProps {
  contacts: EmergencyContact[];
  latestRequest?: SosRequest;
  mode: DataMode;
}

type ContactFormState = EmergencyContactInput;

const EMPTY_FORM: ContactFormState = {
  name: "",
  role: "",
  phoneNumber: "",
  deliveryMethod: "SMS",
  isPrimary: false,
};

function sortContacts(contacts: EmergencyContact[]): EmergencyContact[] {
  return [...contacts].sort((left, right) => {
    if (left.isPrimary !== right.isPrimary) return left.isPrimary ? -1 : 1;
    return left.name.localeCompare(right.name);
  });
}

function toFormState(contact: EmergencyContact): ContactFormState {
  return {
    name: contact.name,
    role: contact.role,
    phoneNumber: contact.phoneNumber,
    deliveryMethod: contact.deliveryMethod,
    isPrimary: contact.isPrimary,
  };
}

function applyPrimarySelection(contacts: EmergencyContact[], contactId: string): EmergencyContact[] {
  return contacts.map((contact) => ({
    ...contact,
    isPrimary: contact.id === contactId,
  }));
}

function upsertContact(contacts: EmergencyContact[], contact: EmergencyContact): EmergencyContact[] {
  const nextContacts = contact.isPrimary ? applyPrimarySelection(contacts, contact.id) : contacts;
  const exists = nextContacts.some((item) => item.id === contact.id);

  return exists
    ? nextContacts.map((item) => (item.id === contact.id ? contact : item))
    : [...nextContacts, contact];
}

function createSimulationContact(input: EmergencyContactInput): EmergencyContact {
  return {
    id: `contact-sim-${Date.now()}`,
    name: input.name.trim(),
    role: input.role.trim(),
    phoneNumber: input.phoneNumber.trim(),
    deliveryMethod: input.deliveryMethod,
    isPrimary: input.isPrimary,
  };
}

export default function SosWorkspace({ contacts, latestRequest, mode }: SosWorkspaceProps) {
  const [currentContacts, setCurrentContacts] = useState<EmergencyContact[]>(contacts);
  const [form, setForm] = useState<ContactFormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const sortedContacts = useMemo(() => sortContacts(currentContacts), [currentContacts]);
  const isSimulation = mode === "simulation";

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError(null);
  }

  function updateForm<Key extends keyof ContactFormState>(key: Key, value: ContactFormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function beginEdit(contact: EmergencyContact) {
    setEditingId(contact.id);
    setForm(toFormState(contact));
    setError(null);
  }

  function submitContact() {
    const normalized = {
      ...form,
      name: form.name.trim(),
      role: form.role.trim(),
      phoneNumber: form.phoneNumber.trim(),
    };

    if (!normalized.name || !normalized.phoneNumber) {
      setError("Name and phone number are required.");
      return;
    }

    startTransition(async () => {
      setError(null);

      if (isSimulation) {
        const localContact = editingId
          ? { ...createSimulationContact(normalized), id: editingId }
          : createSimulationContact(normalized);

        setCurrentContacts((current) => upsertContact(current, localContact));
        resetForm();
        return;
      }

      const result = editingId
        ? await updateEmergencyContact(editingId, normalized)
        : await createEmergencyContact(normalized);

      if (!result.ok || !result.contact) {
        setError(result.error ?? "Failed to save emergency contact.");
        return;
      }

      const savedContact = result.contact;
      setCurrentContacts((current) => upsertContact(current, savedContact));
      resetForm();
    });
  }

  function removeContact(contactId: string) {
    startTransition(async () => {
      setError(null);

      if (isSimulation) {
        setCurrentContacts((current) => current.filter((contact) => contact.id !== contactId));
        if (editingId === contactId) resetForm();
        return;
      }

      const result = await deleteEmergencyContact(contactId);
      if (!result.ok) {
        setError(result.error ?? "Failed to delete emergency contact.");
        return;
      }

      setCurrentContacts((current) => current.filter((contact) => contact.id !== contactId));
      if (editingId === contactId) resetForm();
    });
  }

  function markPrimary(contactId: string) {
    startTransition(async () => {
      setError(null);

      if (isSimulation) {
        setCurrentContacts((current) => applyPrimarySelection(current, contactId));
        return;
      }

      const result = await setPrimaryEmergencyContact(contactId);
      if (!result.ok || !result.contact) {
        setError(result.error ?? "Failed to set primary contact.");
        return;
      }

      const primaryContactId = result.contact.id;
      setCurrentContacts((current) => applyPrimarySelection(current, primaryContactId));
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
      <SosAlertFlow contacts={sortedContacts} latestRequest={latestRequest} mode={mode} />

      <PageSection title="Emergency Contacts">
        <div className="rounded-lg border border-border bg-panel p-4">
          <div className="grid gap-3">
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold text-foreground/70">Name</span>
              <input
                value={form.name}
                onChange={(event) => updateForm("name", event.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-xs font-semibold text-foreground/70">Role</span>
              <input
                value={form.role}
                onChange={(event) => updateForm("role", event.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-xs font-semibold text-foreground/70">Phone number</span>
              <input
                value={form.phoneNumber}
                onChange={(event) => updateForm("phoneNumber", event.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                placeholder="+60123456789"
              />
            </label>

            <div className="grid grid-cols-[1fr_auto] items-end gap-3">
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold text-foreground/70">Delivery method</span>
                <select
                  value={form.deliveryMethod}
                  onChange={(event) => updateForm("deliveryMethod", event.target.value as DeliveryMethod)}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                >
                  <option value="SMS">SMS</option>
                  <option value="Email">Email</option>
                  <option value="App Notification">App Notification</option>
                </select>
              </label>

              <label className="flex min-h-10 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={form.isPrimary}
                  onChange={(event) => updateForm("isPrimary", event.target.checked)}
                />
                Primary
              </label>
            </div>

            {error ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {error}
              </p>
            ) : null}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={submitContact}
                disabled={isPending}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-foreground px-3 py-2 text-sm font-semibold text-background transition hover:bg-foreground/90 disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                {editingId ? "Update contact" : "Add contact"}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center justify-center rounded-md border border-border px-3 py-2 text-sm font-semibold transition hover:bg-background"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {sortedContacts.length === 0 ? (
            <p className="rounded-lg border border-border bg-panel p-4 text-sm text-foreground/60">
              No emergency contacts saved.
            </p>
          ) : (
            sortedContacts.map((contact) => (
              <article key={contact.id} className="rounded-lg border border-border bg-panel p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-foreground">{contact.name}</h2>
                    <p className="mt-1 text-sm text-foreground/60">{contact.role || "Emergency contact"}</p>
                  </div>
                  {contact.isPrimary ? <StatusBadge label="Primary" /> : null}
                </div>
                <p className="mt-3 text-sm font-medium text-foreground">{contact.phoneNumber}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => beginEdit(contact)}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold transition hover:bg-background"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  {!contact.isPrimary ? (
                    <button
                      type="button"
                      onClick={() => markPrimary(contact.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold transition hover:bg-background"
                    >
                      <Star className="h-3.5 w-3.5" />
                      Primary
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => removeContact(contact.id)}
                    className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </PageSection>
    </div>
  );
}
