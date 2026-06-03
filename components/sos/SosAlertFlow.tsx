"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { AlertTriangle, CheckCircle2, Loader2, MapPin, MessageCircle, Navigation } from "lucide-react";
import { submitSosRequest } from "@/app/sos/actions";
import type { DataMode, EmergencyContact, SosRequest } from "@/types/emergency";

type GeoPoint = {
  latitude: number;
  longitude: number;
};

type FlowStep = "idle" | "preview" | "submitted";

interface SosAlertFlowProps {
  contacts: EmergencyContact[];
  latestRequest?: SosRequest;
  mode: DataMode;
}

const DEFAULT_MESSAGE = "I need emergency assistance. Please check my current location.";
const HOLD_DURATION_MS = 1200;

function normalizeWhatsAppPhone(phoneNumber: string): string {
  const digits = phoneNumber.replace(/\D/g, "");

  // WhatsApp deep links need country-code phone numbers without "+".
  // Local Malaysian numbers commonly start with 0, so convert 01x... to 601x....
  if (digits.startsWith("0")) {
    return `60${digits.slice(1)}`;
  }

  return digits;
}

function buildMapsUrl(location: GeoPoint): string {
  return `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
}

function buildSosMessage(message: string, location: GeoPoint): string {
  // Keep the generated text plain so it works in WhatsApp, SMS, and future providers.
  return [
    "SOS ALERT",
    "",
    message,
    "",
    "Location:",
    `Latitude: ${location.latitude.toFixed(6)}`,
    `Longitude: ${location.longitude.toFixed(6)}`,
    `Map: ${buildMapsUrl(location)}`,
    "",
    `Sent from Emergency OS at ${new Date().toLocaleString()}.`,
  ].join("\n");
}

function buildWhatsAppLink(phoneNumber: string, message: string): string {
  return `https://wa.me/${normalizeWhatsAppPhone(phoneNumber)}?text=${encodeURIComponent(message)}`;
}

function getPrimaryContact(contacts: EmergencyContact[]): EmergencyContact | undefined {
  return contacts.find((contact) => contact.isPrimary) ?? contacts[0];
}

function createSimulatedRequest(location: GeoPoint, message: string, contactId?: string): SosRequest {
  // Simulation mode should not write into the real SOS table.
  return {
    id: `sos-sim-${Date.now()}`,
    userId: "simulation-user",
    latitude: location.latitude,
    longitude: location.longitude,
    message,
    status: "submitted",
    contactId,
    createdAt: new Date().toISOString(),
  };
}

export default function SosAlertFlow({ contacts, latestRequest, mode }: SosAlertFlowProps) {
  const [step, setStep] = useState<FlowStep>("idle");
  const [location, setLocation] = useState<GeoPoint | null>(null);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [selectedContactId, setSelectedContactId] = useState(getPrimaryContact(contacts)?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submittedRequest, setSubmittedRequest] = useState<SosRequest | undefined>(latestRequest);
  const [isPending, startTransition] = useTransition();
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedContact = useMemo(
    () => contacts.find((contact) => contact.id === selectedContactId) ?? getPrimaryContact(contacts),
    [contacts, selectedContactId]
  );

  const previewMessage = useMemo(() => {
    if (!location) return "";
    return buildSosMessage(message, location);
  }, [location, message]);

  const canPreview = Boolean(location && selectedContact && message.trim());
  const canSubmit = canPreview && !isPending;

  function requestCurrentLocation() {
    setError(null);

    if (!navigator.geolocation) {
      setError("This browser does not support location detection.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setStep("preview");
      },
      () => {
        setError("Could not get your current location. Please allow location access and try again.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30_000,
        timeout: 12_000,
      }
    );
  }

  function clearHoldTimer() {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }

  function beginHoldConfirm() {
    if (!canSubmit || !location || !selectedContact) return;

    // Holding prevents accidental emergency submissions from a single tap.
    clearHoldTimer();
    holdTimerRef.current = setTimeout(() => {
      clearHoldTimer();
      submitAndOpenWhatsApp(location, selectedContact);
    }, HOLD_DURATION_MS);
  }

  function submitAndOpenWhatsApp(currentLocation: GeoPoint, contact: EmergencyContact) {
    setError(null);

    startTransition(async () => {
      if (mode === "simulation") {
        // Still open WhatsApp so the UI flow can be tested, but keep persistence local.
        const request = createSimulatedRequest(currentLocation, previewMessage, contact.id);
        setSubmittedRequest(request);
        setStep("submitted");
        window.open(buildWhatsAppLink(contact.phoneNumber, previewMessage), "_blank", "noopener,noreferrer");
        return;
      }

      const result = await submitSosRequest({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        message: previewMessage,
        contactId: contact.id,
      });

      if (!result.ok || !result.request) {
        setError(result.error ?? "Failed to submit SOS request.");
        return;
      }

      setSubmittedRequest(result.request);
      setStep("submitted");
      window.open(buildWhatsAppLink(contact.phoneNumber, previewMessage), "_blank", "noopener,noreferrer");
    });
  }

  return (
    <section className="rounded-lg border border-red-200 bg-red-50 p-6">
      <div className="flex items-start gap-4">
        <div className="rounded-full bg-red-600 p-3 text-white">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-red-700">Emergency Action</p>
          <h2 className="mt-1 text-2xl font-bold text-red-800">Send SOS Request</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-red-800/75">
            Detect your current location, review the SOS message, then hold to confirm. WhatsApp opens with the final message after the request is saved.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-red-900">Alert message</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="mt-2 min-h-24 w-full rounded-md border border-red-200 bg-white px-3 py-2 text-sm text-red-950 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-red-900">Emergency contact</span>
            <select
              value={selectedContact?.id ?? ""}
              onChange={(event) => setSelectedContactId(event.target.value)}
              className="mt-2 w-full rounded-md border border-red-200 bg-white px-3 py-2 text-sm text-red-950 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            >
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name} - {contact.phoneNumber}
                </option>
              ))}
            </select>
          </label>

          {location ? (
            <div className="rounded-md border border-red-200 bg-white p-4 text-sm text-red-950">
              <div className="flex items-center gap-2 font-semibold">
                <MapPin className="h-4 w-4 text-red-600" />
                Current location detected
              </div>
              <p className="mt-2 text-red-900/70">
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </p>
              <a
                href={buildMapsUrl(location)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-red-700 underline"
              >
                <Navigation className="h-3.5 w-3.5" />
                Open map preview
              </a>
            </div>
          ) : null}
        </div>

        <div className="rounded-md border border-red-200 bg-white p-4">
          <h3 className="text-sm font-bold text-red-950">Send status</h3>
          <div className="mt-3 space-y-3 text-sm text-red-900/70">
            <p>Mode: <span className="font-semibold capitalize text-red-950">{mode}</span></p>
            <p>Contact: <span className="font-semibold text-red-950">{selectedContact?.name ?? "No contact"}</span></p>
            <p>Delivery: <span className="font-semibold text-red-950">WhatsApp deep link</span></p>
          </div>

          <button
            type="button"
            onClick={requestCurrentLocation}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50"
          >
            <MapPin className="h-4 w-4" />
            {location ? "Refresh Location" : "Get Current Location"}
          </button>
        </div>
      </div>

      {step === "preview" && location ? (
        <div className="mt-5 rounded-md border border-red-200 bg-white p-4">
          <h3 className="text-sm font-bold text-red-950">Preview message</h3>
          <pre className="mt-3 whitespace-pre-wrap rounded-md bg-red-950 p-4 text-xs leading-5 text-red-50">
            {previewMessage}
          </pre>
        </div>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-md border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          disabled={!canSubmit}
          onPointerDown={beginHoldConfirm}
          onPointerUp={clearHoldTimer}
          onPointerCancel={clearHoldTimer}
          onPointerLeave={clearHoldTimer}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
          Hold to Confirm SOS
        </button>

        {submittedRequest ? (
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-red-800">
            <CheckCircle2 className="h-4 w-4" />
            Latest request: {submittedRequest.status}
          </div>
        ) : (
          <p className="text-sm text-red-800/70">Hold the button for {HOLD_DURATION_MS / 1000} seconds to submit.</p>
        )}
      </div>
    </section>
  );
}
