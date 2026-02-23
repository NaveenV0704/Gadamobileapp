import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Button } from "../components/ui/Button";
import { useAuth } from "../contexts/AuthContext";
import { useAuthHeader } from "../hooks/useAuthHeader";
import { API_BASE_URL } from "../constants/config";

type RepStatus = "pending" | "approved" | "rejected";

type RepForm = {
  name: string;
  username: string;
  phone: string;
  email: string;
  state: string;
  residentAddress: string;
  residentialState: string;
  proposedLocation: string;
  gadaChatUsername: string;
  note: string;
};

type RepRecord = RepForm & {
  id: number;
  status: RepStatus;
  createdAt?: string;
  updatedAt?: string;
};

type RepErrors = Partial<Record<keyof RepForm, string>>;

export default function Representative() {
  const { user, accessToken } = useAuth();
  const authHeader = useAuthHeader(accessToken);

  const [form, setForm] = useState<RepForm>({
    name:
      user?.firstname || user?.lastname
        ? `${user?.firstname || ""} ${user?.lastname || ""}`.trim()
        : "",
    username: user?.username || "",
    phone: "",
    email: user?.email || "",
    state: "",
    residentAddress: "",
    residentialState: "",
    proposedLocation: "",
    gadaChatUsername: "",
    note: "",
  });

  const [errors, setErrors] = useState<RepErrors>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existing, setExisting] = useState<RepRecord | null>(null);
  const [isEditing, setIsEditing] = useState(true);
  const [isVvip, setIsVvip] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const disableInputs = loading || submitting || (!isEditing && !!existing);

  const loadData = useCallback(async () => {
    if (!accessToken) return;

    setLoading(true);
    setError(null);

    const baseHeaders: Record<string, string> = { ...authHeader };
    delete baseHeaders["Content-Type"];

    try {
      try {
        const pkgRes = await fetch(`${API_BASE_URL}/api/pro/activepackage`, {
          method: "GET",
          headers: baseHeaders,
        });
        if (pkgRes.ok) {
          const pkgJson: any = await pkgRes.json().catch(() => null);
          const pkg =
            pkgJson && typeof pkgJson === "object"
              ? pkgJson.data || pkgJson
              : null;
          const name = String(pkg?.packageName || "").toUpperCase();
          setIsVvip(name === "GADA VVIP");
        } else {
          const name = String(user?.packageName || "").toUpperCase();
          setIsVvip(name === "GADA VVIP");
        }
      } catch {
        const name = String(user?.packageName || "").toUpperCase();
        setIsVvip(name === "GADA VVIP");
      }

      const res = await fetch(`${API_BASE_URL}/api/representatives/me`, {
        method: "GET",
        headers: baseHeaders,
      });

      if (res.status === 404) {
        setExisting(null);
        setIsEditing(true);
        return;
      }

      if (!res.ok) {
        const text = await res.text();
        let message = "Failed to load application";
        if (text) {
          try {
            const parsed = JSON.parse(text);
            message =
              String((parsed as any).error) ||
              String((parsed as any).message) ||
              message;
          } catch {
            message = text;
          }
        }
        throw new Error(message);
      }

      const data: RepRecord = await res.json();

      setExisting(data);
      setForm({
        name: data.name,
        username: data.username,
        phone: data.phone,
        email: data.email,
        state: data.state,
        residentAddress: data.residentAddress,
        residentialState: data.residentialState,
        proposedLocation: data.proposedLocation,
        gadaChatUsername: data.gadaChatUsername,
        note: data.note,
      });
      setIsEditing(false);
    } catch (e: any) {
      const msg = e?.message || "Could not load representative application";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [accessToken, authHeader, user?.packageName]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const updateField = (key: keyof RepForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setSuccess(null);
  };

  const validateForm = (): boolean => {
    const next: RepErrors = {};

    if (!form.name.trim()) {
      next.name = "Name is required";
    }

    if (!form.username.trim()) {
      next.username = "Username is required";
    } else if (form.username.trim().length < 3) {
      next.username = "Username must be at least 3 characters";
    } else if (!/^[a-z0-9._-]+$/i.test(form.username.trim())) {
      next.username = "Only letters, numbers, dot, underscore, dash";
    }

    const phone = form.phone.trim();
    if (!phone) {
      next.phone = "Phone is required";
    } else if (phone.length < 7 || phone.length > 20) {
      next.phone = "Phone must be between 7 and 20 characters";
    } else if (!/^[+0-9 ()-]+$/.test(phone)) {
      next.phone = "Invalid phone number";
    }

    const email = form.email.trim();
    if (!email) {
      next.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = "Invalid email";
    }

    if (!form.state.trim()) {
      next.state = "State is required";
    }

    if (!form.residentAddress.trim()) {
      next.residentAddress = "Address is required";
    } else if (form.residentAddress.trim().length < 5) {
      next.residentAddress = "Address is required";
    }

    if (!form.residentialState.trim()) {
      next.residentialState = "Residential state is required";
    }

    if (!form.proposedLocation.trim()) {
      next.proposedLocation = "Proposed location is required";
    }

    if (!form.gadaChatUsername.trim()) {
      next.gadaChatUsername = "Gada.chat username is required";
    } else if (form.gadaChatUsername.trim().length < 3) {
      next.gadaChatUsername = "Gada.chat username is required";
    } else if (!/^[a-z0-9._-]+$/i.test(form.gadaChatUsername.trim())) {
      next.gadaChatUsername = "Only letters, numbers, dot, underscore, dash";
    }

    const note = form.note.trim();
    if (!note) {
      next.note = "Please add a short note";
    } else if (note.length < 10) {
      next.note = "Please add a short note";
    } else if (note.length > 600) {
      next.note = "Max 600 chars";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const resetToExisting = () => {
    if (!existing) return;
    setForm({
      name: existing.name,
      username: existing.username,
      phone: existing.phone,
      email: existing.email,
      state: existing.state,
      residentAddress: existing.residentAddress,
      residentialState: existing.residentialState,
      proposedLocation: existing.proposedLocation,
      gadaChatUsername: existing.gadaChatUsername,
      note: existing.note,
    });
    setErrors({});
    setIsEditing(false);
    setSuccess(null);
  };

  const handleSubmit = async () => {
    if (!accessToken) return;
    if (!isVvip) return;
    if (!validateForm()) return;

    setSubmitting(true);
    setError(null);

    const headers: Record<string, string> = {
      ...authHeader,
      "Content-Type": "application/json",
    };

    const isUpdate = !!existing;
    const url = isUpdate
      ? `${API_BASE_URL}/api/representatives/me`
      : `${API_BASE_URL}/api/representatives`;

    try {
      const res = await fetch(url, {
        method: isUpdate ? "PUT" : "POST",
        headers,
        body: JSON.stringify(form),
      });

      const text = await res.text();
      if (!res.ok) {
        let message = isUpdate
          ? "Failed to save application"
          : "Failed to submit application";
        if (text) {
          try {
            const parsed = JSON.parse(text);
            message =
              String((parsed as any).error) ||
              String((parsed as any).message) ||
              message;
          } catch {
            message = text;
          }
        }
        throw new Error(message);
      }

      let data: any = {};
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = {};
        }
      }

      const saved: RepRecord = {
        id: Number(data.id ?? existing?.id ?? 0),
        status: (data.status || existing?.status || "pending") as RepStatus,
        name: data.name ?? form.name,
        username: data.username ?? form.username,
        phone: data.phone ?? form.phone,
        email: data.email ?? form.email,
        state: data.state ?? form.state,
        residentAddress: data.residentAddress ?? form.residentAddress,
        residentialState: data.residentialState ?? form.residentialState,
        proposedLocation: data.proposedLocation ?? form.proposedLocation,
        gadaChatUsername: data.gadaChatUsername ?? form.gadaChatUsername,
        note: data.note ?? form.note,
        createdAt: data.createdAt ?? existing?.createdAt,
        updatedAt: data.updatedAt ?? new Date().toISOString(),
      };

      setExisting(saved);
      setForm({
        name: saved.name,
        username: saved.username,
        phone: saved.phone,
        email: saved.email,
        state: saved.state,
        residentAddress: saved.residentAddress,
        residentialState: saved.residentialState,
        proposedLocation: saved.proposedLocation,
        gadaChatUsername: saved.gadaChatUsername,
        note: saved.note,
      });
      setIsEditing(false);
      setSuccess(
        isUpdate
          ? "Your changes have been saved"
          : "We’ll review and get back to you shortly",
      );
    } catch (e: any) {
      const msg = e?.message || "Please try again";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = existing?.status
    ? (() => {
        let bg = "bg-gray-100";
        let textColor = "text-gray-800";
        if (existing.status === "approved") {
          bg = "bg-green-100";
          textColor = "text-green-800";
        } else if (existing.status === "rejected") {
          bg = "bg-red-100";
          textColor = "text-red-800";
        } else {
          bg = "bg-yellow-100";
          textColor = "text-yellow-800";
        }
        return (
          <View className={`px-3 py-1 rounded-full ${bg}`}>
            <Text className={`text-xs font-semibold capitalize ${textColor}`}>
              {existing.status}
            </Text>
          </View>
        );
      })()
    : null;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      <View className="px-6 py-4 bg-white">
        <Text className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Become a Representative
        </Text>
      </View>

      <View className="flex-1" style={{ backgroundColor: "#8e4de0" }}>
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <View
              className="px-4 py-4 flex-row items-start justify-between"
              style={{ backgroundColor: "#4f46e5" }}
            >
              <View className="flex-1 pr-3">
                <Text className="text-white text-xl font-bold mb-1">
                  Become a Representative
                </Text>
                <Text className="text-white/90 text-sm">
                  Share a few details and the team will reach out if it’s a fit.
                </Text>
              </View>
              <View className="items-end gap-2">
                {statusBadge}
                {!!existing && (
                  <Button
                    variant={isEditing ? "secondary" : "outline"}
                    className="px-3 py-1 h-9 bg-white/10 border border-white/30"
                    onPress={() => {
                      if (!existing) return;
                      setIsEditing((v) => !v);
                      setSuccess(null);
                    }}
                    disabled={loading || submitting}
                    label={isEditing ? "Cancel" : "Edit"}
                    textClassName="text-xs font-semibold text-white"
                  />
                )}
              </View>
            </View>

            <View className="p-4">
              <View className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3">
                <Text className="text-sm text-amber-900">
                  Only VVIP user can request to be a Representative
                </Text>
              </View>

              {error && (
                <View className="mb-3">
                  <Text className="text-xs text-red-600">{error}</Text>
                </View>
              )}

              {success && (
                <View className="mb-3">
                  <Text className="text-xs text-green-600">{success}</Text>
                </View>
              )}

              {!isVvip && (
                <View className="mb-3">
                  <Text className="text-xs text-gray-600">
                    You need to be a GADA VVIP user to submit this form.
                  </Text>
                </View>
              )}

              {loading ? (
                <View className="py-10 items-center justify-center">
                  <ActivityIndicator size="small" color="#1877F2" />
                </View>
              ) : (
                <>
                  <View>
                    <View className="mb-3">
                      <Text className="text-xs text-gray-600 mb-1">Name</Text>
                      <TextInput
                        value={form.name}
                        onChangeText={(v) => updateField("name", v)}
                        placeholder="Full name"
                        editable={!disableInputs}
                        className={`border rounded-md px-3 py-2 text-sm ${
                          disableInputs ? "bg-gray-100" : "bg-white"
                        } ${
                          errors.name ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.name && (
                        <Text className="text-xs text-red-500 mt-1">
                          {errors.name}
                        </Text>
                      )}
                    </View>

                    <View className="mb-3">
                      <Text className="text-xs text-gray-600 mb-1">
                        Username
                      </Text>
                      <TextInput
                        value={form.username}
                        onChangeText={(v) => updateField("username", v)}
                        placeholder="username"
                        autoCapitalize="none"
                        editable={!disableInputs}
                        className={`border rounded-md px-3 py-2 text-sm ${
                          disableInputs ? "bg-gray-100" : "bg-white"
                        } ${
                          errors.username ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.username && (
                        <Text className="text-xs text-red-500 mt-1">
                          {errors.username}
                        </Text>
                      )}
                    </View>

                    <View className="mb-3">
                      <Text className="text-xs text-gray-600 mb-1">
                        Phone number
                      </Text>
                      <TextInput
                        value={form.phone}
                        onChangeText={(v) => updateField("phone", v)}
                        placeholder="+234..."
                        keyboardType="phone-pad"
                        editable={!disableInputs}
                        className={`border rounded-md px-3 py-2 text-sm ${
                          disableInputs ? "bg-gray-100" : "bg-white"
                        } ${
                          errors.phone ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.phone && (
                        <Text className="text-xs text-red-500 mt-1">
                          {errors.phone}
                        </Text>
                      )}
                    </View>

                    <View className="mb-3">
                      <Text className="text-xs text-gray-600 mb-1">Email</Text>
                      <TextInput
                        value={form.email}
                        onChangeText={(v) => updateField("email", v)}
                        placeholder="you@example.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!disableInputs}
                        className={`border rounded-md px-3 py-2 text-sm ${
                          disableInputs ? "bg-gray-100" : "bg-white"
                        } ${
                          errors.email ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.email && (
                        <Text className="text-xs text-red-500 mt-1">
                          {errors.email}
                        </Text>
                      )}
                    </View>

                    <View className="mb-3">
                      <Text className="text-xs text-gray-600 mb-1">State</Text>
                      <TextInput
                        value={form.state}
                        onChangeText={(v) => updateField("state", v)}
                        placeholder="e.g., Lagos"
                        editable={!disableInputs}
                        className={`border rounded-md px-3 py-2 text-sm ${
                          disableInputs ? "bg-gray-100" : "bg-white"
                        } ${
                          errors.state ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.state && (
                        <Text className="text-xs text-red-500 mt-1">
                          {errors.state}
                        </Text>
                      )}
                    </View>

                    <View className="mb-3">
                      <Text className="text-xs text-gray-600 mb-1">
                        Residential state
                      </Text>
                      <TextInput
                        value={form.residentialState}
                        onChangeText={(v) => updateField("residentialState", v)}
                        placeholder="e.g., Lagos"
                        editable={!disableInputs}
                        className={`border rounded-md px-3 py-2 text-sm ${
                          disableInputs ? "bg-gray-100" : "bg-white"
                        } ${
                          errors.residentialState
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {errors.residentialState && (
                        <Text className="text-xs text-red-500 mt-1">
                          {errors.residentialState}
                        </Text>
                      )}
                    </View>

                    <View className="mb-3">
                      <Text className="text-xs text-gray-600 mb-1">
                        Resident address
                      </Text>
                      <TextInput
                        value={form.residentAddress}
                        onChangeText={(v) => updateField("residentAddress", v)}
                        placeholder="Street, city, state"
                        editable={!disableInputs}
                        className={`border rounded-md px-3 py-2 text-sm ${
                          disableInputs ? "bg-gray-100" : "bg-white"
                        } ${
                          errors.residentAddress
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {errors.residentAddress && (
                        <Text className="text-xs text-red-500 mt-1">
                          {errors.residentAddress}
                        </Text>
                      )}
                    </View>

                    <View className="mb-3">
                      <Text className="text-xs text-gray-600 mb-1">
                        Proposed location to represent
                      </Text>
                      <TextInput
                        value={form.proposedLocation}
                        onChangeText={(v) => updateField("proposedLocation", v)}
                        placeholder="City / area"
                        editable={!disableInputs}
                        className={`border rounded-md px-3 py-2 text-sm ${
                          disableInputs ? "bg-gray-100" : "bg-white"
                        } ${
                          errors.proposedLocation
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {errors.proposedLocation && (
                        <Text className="text-xs text-red-500 mt-1">
                          {errors.proposedLocation}
                        </Text>
                      )}
                    </View>

                    <View className="mb-3">
                      <Text className="text-xs text-gray-600 mb-1">
                        Gada.chat username
                      </Text>
                      <TextInput
                        value={form.gadaChatUsername}
                        onChangeText={(v) => updateField("gadaChatUsername", v)}
                        placeholder="@yourhandle"
                        autoCapitalize="none"
                        editable={!disableInputs}
                        className={`border rounded-md px-3 py-2 text-sm ${
                          disableInputs ? "bg-gray-100" : "bg-white"
                        } ${
                          errors.gadaChatUsername
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {errors.gadaChatUsername && (
                        <Text className="text-xs text-red-500 mt-1">
                          {errors.gadaChatUsername}
                        </Text>
                      )}
                    </View>

                    <View className="mb-4">
                      <Text className="text-xs text-gray-600 mb-1">
                        Little note about yourself
                      </Text>
                      <TextInput
                        value={form.note}
                        onChangeText={(v) => updateField("note", v)}
                        placeholder="Tell us briefly about yourself, experience, and why you’d like to represent."
                        editable={!disableInputs}
                        multiline
                        numberOfLines={5}
                        textAlignVertical="top"
                        className={`border rounded-md px-3 py-2 text-sm min-h-[120px] ${
                          disableInputs ? "bg-gray-100" : "bg-white"
                        } ${
                          errors.note ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.note && (
                        <Text className="text-xs text-red-500 mt-1">
                          {errors.note}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View className="flex-row justify-end gap-3 mt-2">
                    {!!existing && isEditing && (
                      <Button
                        variant="outline"
                        className="px-4 h-10"
                        onPress={resetToExisting}
                        disabled={submitting}
                        label="Cancel"
                        textClassName="text-xs font-semibold"
                      />
                    )}
                    {isVvip && (
                      <Button
                        className="px-4 h-10 bg-[#1877F2]"
                        onPress={handleSubmit}
                        disabled={submitting || (!isEditing && !!existing)}
                      >
                        <Text className="text-white text-xs font-semibold">
                          {submitting
                            ? "Saving…"
                            : existing
                              ? isEditing
                                ? "Save Changes"
                                : "Locked"
                              : "Submit application"}
                        </Text>
                      </Button>
                    )}
                  </View>

                  {!!existing && (
                    <View className="mt-3">
                      <Text className="text-xs text-gray-500">
                        Last updated:{" "}
                        {existing.updatedAt
                          ? new Date(existing.updatedAt).toLocaleString()
                          : "—"}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
