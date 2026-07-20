import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Check,
  Copy,
  Plus,
  Loader2,
  Contact,
  X as XIcon,
  UserRoundPlus,
  Star,
  StarOff,
  ChevronDown,
} from "lucide-react";
import {
  addContact,
  getContacts,
  removeTrusted,
  setTrusted,
} from "../services/contact.services";

const TYPE_LABEL = {
  EMAIL: "Email",
  PHONE_NUMBER: "Phone number",
  PAYMENT_ID: "Payment ID",
};

const TYPE_PLACEHOLDER = {
  EMAIL: "Enter email address",
  PHONE_NUMBER: "Enter phone number",
  PAYMENT_ID: "Enter payment ID",
};

export default function ContactCard() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [alias, setAlias] = useState("");
  const [identifierType, setIdentifierType] = useState("EMAIL");
  const [identifierValue, setIdentifierValue] = useState("");

  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [trustingId, setTrustingId] = useState(null);

  const sortedContacts = useMemo(() => {
    const arr = Array.isArray(contacts) ? [...contacts] : [];
    arr.sort((a, b) => {
      const aAlias = (a?.alias ?? "").toString().trim().toLowerCase();
      const bAlias = (b?.alias ?? "").toString().trim().toLowerCase();
      if (aAlias !== bAlias) return aAlias.localeCompare(bAlias);

      const aVal = (a?.identifierValue ?? "").toString().trim().toLowerCase();
      const bVal = (b?.identifierValue ?? "").toString().trim().toLowerCase();
      return aVal.localeCompare(bVal);
    });
    return arr;
  }, [contacts]);

  const loadContacts = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const res = await getContacts();
      setContacts(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Failed to load contacts", e);
      setError(e?.response?.data?.message || "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const resetForm = () => {
    setAlias("");
    setIdentifierType("EMAIL");
    setIdentifierValue("");
    setError("");
  };

  const handleOpenNew = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setError("");
    resetForm();
  };

  const handleSave = async () => {
    setError("");

    const payload = {
      alias: alias?.trim(),
      identifierType,
      identifierValue: identifierValue?.trim(),
    };

    if (!payload.alias) return setError("Alias is required");
    if (!payload.identifierType) return setError("Identifier type is required");
    if (!payload.identifierValue)
      return setError("Details is required");

    setSaving(true);
    try {
      const res = await addContact(payload);
      const created = res?.data;

      if (created && created.contactId) {
        setContacts((prev) => {
          const prevArr = Array.isArray(prev) ? prev : [];
          const exists = prevArr.some((c) => c.contactId === created.contactId);
          if (exists) return prevArr;
          return [...prevArr, created];
        });
      } else {
        await loadContacts();
      }

      handleCloseModal();
    } catch (e) {
      console.error("Failed to add contact", e);
      setError(e?.response?.data?.message || "Failed to add contact");
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = async (contactId, text) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const copied = document.execCommand("copy");
        document.body.removeChild(textArea);

        if (!copied) {
          throw new Error("Fallback copy failed");
        }
      }

      setCopiedId(contactId);
      setTimeout(() => setCopiedId(null), 1200);
    } catch (e) {
      console.error("Copy failed", e);
      setError("Copy is not supported on this device/browser over HTTP");
    }
  };

  const handleToggleTrusted = async (c) => {
    if (!c) return;
    if (trustingId) return;

    setError("");
    setTrustingId(c.contactId);

    try {
      const payload = { contactId: c.contactId };

      if (c.isTrusted) {
        await removeTrusted(payload);
      } else {
        await setTrusted(payload);
      }

      setContacts((prev) =>
        (Array.isArray(prev) ? prev : []).map((x) =>
          x.contactId === c.contactId ? { ...x, isTrusted: !c.isTrusted } : x,
        ),
      );
    } catch (e) {
      console.error("Failed to toggle trusted", e);
      setError(e?.response?.data?.message || "Failed to update trusted status");
    } finally {
      setTrustingId(null);
    }
  };

  const ContactRow = ({ c }) => {
    const typeLabel = TYPE_LABEL[c.identifierType] ?? c.identifierType ?? "-";
    const isTrusting = trustingId === c.contactId;

    return (
      <div className="flex items-center justify-between gap-3 py-3 p-2 px-4 hover:bg-muted/30 transition-colors">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-medium truncate">{c.alias}</span>
          </div>

          <div className="mt-1 flex items-center gap-2 min-w-0">
            <span className="text-xs text-muted-foreground shrink-0">
              {typeLabel}
            </span>
            <span className="text-sm text-foreground/90 truncate font-mono">
              {c.identifierValue}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {c.isTrusted ? (
            <Badge
              variant="outline"
              className="border-green-500 text-green-500 font-medium"
            >
              Trusted
            </Badge>
          ) : null}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(c.contactId, c.identifierValue)}
              >
                {copiedId === c.contactId ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{copiedId === c.contactId ? "Copied" : "Copy"}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleToggleTrusted(c)}
                disabled={isTrusting}
              >
                {isTrusting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : c.isTrusted ? (
                  <StarOff className="h-4 w-4" />
                ) : (
                  <Star className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {c.isTrusted
                  ? isTrusting
                    ? "Removing..."
                    : "Remove trusted"
                  : isTrusting
                    ? "Setting..."
                    : "Set as trusted"}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    );
  };

  return (
    <>
      <Card className="w-full card-glow overflow-hidden h-88">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Contact className="h-5 w-5" />
            <span className="text-md font-medium">My Contacts</span>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="border-none p-2"
                onClick={handleOpenNew}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent align="center" side="top">
              <p>Add contact</p>
            </TooltipContent>
          </Tooltip>
        </CardHeader>

        <CardContent className="pt-2">
          {error ? (
            <div className="text-sm text-destructive mb-3">{error}</div>
          ) : null}

          {loading ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              Loading...
            </div>
          ) : sortedContacts.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              No contacts yet
            </div>
          ) : (
            <div className="relative rounded-md">
              <ScrollArea className="h-55 w-full **:data-radix-scroll-area-scrollbar:hidden">
                <div className="flex flex-col">
                  {sortedContacts.map((c) => (
                    <ContactRow key={c.contactId} c={c} />
                  ))}
                </div>
              </ScrollArea>

              {sortedContacts.length > 3 ? (
                <>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-background to-transparent" />
                  <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2">
                    <div className="bg-background/70 backdrop-blur shadow-sm">
                      <ChevronDown className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden overscroll-none bg-background/25 p-4 backdrop-blur-sm">
          <div className="relative z-50 w-90 max-w-[90%] rounded-2xl border bg-card p-6 shadow-xl animate-in scale-in duration-200">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleCloseModal}
              className="absolute top-3 right-3 text-red-600 hover:bg-red-500"
              disabled={saving}
            >
              <XIcon className="h-6 w-6" />
            </Button>

            <div className="flex items-center gap-2 mb-6">
              <UserRoundPlus className="h-6 w-6 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Add Contact</h2>
            </div>

            {error ? (
              <div className="text-sm text-red-600 font-bold h-8 ">{error}</div>
            ) : <div className="h-8" />}

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="alias">Alias</Label>
                <Input
                  id="alias"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="Enter an alias"
                  className="text-sm"
                />
              </div>

              <div className="grid gap-2">
                <Label>Type</Label>
                <Select
                  value={identifierType}
                  onValueChange={setIdentifierType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="text-sm">
                    <SelectItem value="EMAIL">Email</SelectItem>
                    <SelectItem value="PHONE_NUMBER">Phone number</SelectItem>
                    <SelectItem value="PAYMENT_ID">Payment ID</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="identifierValue">Details</Label>
                <Input
                  id="identifierValue"
                  value={identifierValue}
                  onChange={(e) => setIdentifierValue(e.target.value)}
                  placeholder={
                    TYPE_PLACEHOLDER[identifierType] || "Enter value"
                  }
                  className="text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-15">
                <Button
                  variant="outline"
                  onClick={handleCloseModal}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
