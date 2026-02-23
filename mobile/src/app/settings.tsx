import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  Shield,
  Bell,
  Lock,
  User as UserIcon,
  Smartphone,
} from "lucide-react-native";
import { useAuth } from "../contexts/AuthContext";
import { useAuthHeader } from "../hooks/useAuthHeader";
import {
  changePassword,
  getGeneral,
  getNotifications,
  getPrivacy,
  getSessions,
  revokeSession,
  type GeneralSettings,
  type NotificationSettings,
  type PrivacySettings,
  type SessionRow,
  updateGeneral,
  updateNotifications,
  updatePrivacy,
} from "../services/settingsService";
import { Button } from "../components/ui/Button";

const sections = [
  { key: "general", label: "General", icon: UserIcon },
  { key: "privacy", label: "Privacy", icon: Shield },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "security", label: "Security", icon: Lock },
] as const;

type TabKey = (typeof sections)[number]["key"];

function SectionCard(props: { title: string; children: React.ReactNode }) {
  return (
    <View className="bg-white rounded-2xl shadow border border-gray-100 p-4 mb-4">
      <Text className="text-base font-semibold text-gray-900 mb-3">
        {props.title}
      </Text>
      {props.children}
    </View>
  );
}

function FieldLabel(props: { label: string }) {
  return (
    <Text className="text-xs font-medium text-gray-600 mb-1">
      {props.label}
    </Text>
  );
}

function SwitchRow(props: {
  label: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      className="flex-row items-center justify-between py-2"
      onPress={props.onToggle}
      activeOpacity={0.8}
    >
      <Text className="text-sm text-gray-800 flex-1 mr-3">{props.label}</Text>
      <View
        className={`w-11 h-6 rounded-full px-0.5 flex-row items-center ${
          props.value ? "bg-blue-600" : "bg-gray-300"
        }`}
      >
        <View
          className={`w-5 h-5 rounded-full bg-white ${
            props.value ? "ml-auto" : ""
          }`}
        />
      </View>
    </TouchableOpacity>
  );
}

function PillSelectRow<T extends string>(props: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <View className="mb-3">
      <FieldLabel label={props.label} />
      <View className="flex-row flex-wrap mt-1 -mr-2">
        {props.options.map((opt) => {
          const active = opt.value === props.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => props.onChange(opt.value)}
              className={`px-3 py-1.5 mr-2 mb-2 rounded-full border ${
                active
                  ? "bg-blue-600 border-blue-600"
                  : "bg-white border-gray-300"
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  active ? "text-white" : "text-gray-800"
                }`}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function useSettingsHeaders() {
  const { accessToken } = useAuth();
  const headers = useAuthHeader(accessToken);
  return headers;
}

function GeneralSection() {
  const headers = useSettingsHeaders();
  const [data, setData] = useState<GeneralSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!headers.Authorization) return;
    getGeneral(headers)
      .then((res) => {
        setData({
          ...res,
          dateOfBirth: res.dateOfBirth
            ? new Date(res.dateOfBirth).toISOString().split("T")[0]
            : "",
        });
      })
      .catch((e) => setError(e.message || "Failed to load settings"));
  }, [headers.Authorization]);

  const onSave = async () => {
    if (!data) return;
    setSaving(true);
    setError(null);
    try {
      await updateGeneral(data, headers);
    } catch (e: any) {
      setError(e?.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!data) {
    return (
      <View className="flex-1 items-center justify-center py-12">
        <ActivityIndicator size="small" color="#2563eb" />
        <Text className="mt-2 text-xs text-gray-500">Loading settings…</Text>
      </View>
    );
  }

  return (
    <SectionCard title="General">
      {error ? (
        <View className="mb-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <Text className="text-xs text-red-700">{error}</Text>
        </View>
      ) : null}
      <View className="flex-row flex-wrap -mx-2">
        <View className="w-full md:w-1/2 px-2 mb-3">
          <FieldLabel label="Username" />
          <View className="border border-gray-300 rounded-md px-3 py-2 bg-gray-100">
            <Text className="text-sm text-gray-800">{data.username}</Text>
          </View>
        </View>
        <View className="w-full md:w-1/2 px-2 mb-3">
          <FieldLabel label="Email" />
          <View className="border border-gray-300 rounded-md px-3 py-2 bg-gray-100">
            <Text className="text-sm text-gray-800">{data.email}</Text>
          </View>
        </View>
        <View className="w-full md:w-1/2 px-2 mb-3">
          <FieldLabel label="Phone" />
          <TextInput
            keyboardType="phone-pad"
            value={data.phone ?? ""}
            onChangeText={(v) => setData({ ...data, phone: v })}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
          />
        </View>
        <View className="w-full md:w-1/2 px-2 mb-3">
          <FieldLabel label="Date of Birth" />
          <TextInput
            placeholder="YYYY-MM-DD"
            value={data.dateOfBirth ?? ""}
            onChangeText={(v) => setData({ ...data, dateOfBirth: v })}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
          />
        </View>
        <View className="w-full md:w-1/2 px-2 mb-3">
          <FieldLabel label="Gender" />
          <PillSelectRow
            label=""
            value={(data.gender ?? "") as any}
            options={[
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
              { value: "non_binary", label: "Non-binary" },
              { value: "prefer_not", label: "Prefer not to say" },
            ]}
            onChange={(v) => setData({ ...data, gender: v })}
          />
        </View>
        <View className="w-full md:w-1/2 px-2 mb-3">
          <FieldLabel label="Website" />
          <TextInput
            value={data.website ?? ""}
            onChangeText={(v) => setData({ ...data, website: v })}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
          />
        </View>
        <View className="w-full md:w-1/2 px-2 mb-3">
          <FieldLabel label="City" />
          <TextInput
            value={data.city ?? ""}
            onChangeText={(v) => setData({ ...data, city: v })}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
          />
        </View>
        <View className="w-full md:w-1/2 px-2 mb-3">
          <FieldLabel label="Country" />
          <TextInput
            value={data.country ?? ""}
            onChangeText={(v) => setData({ ...data, country: v })}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
          />
        </View>
        <View className="w-full md:w-1/2 px-2 mb-3">
          <FieldLabel label="Timezone" />
          <TextInput
            value={data.timezone ?? "UTC"}
            onChangeText={(v) => setData({ ...data, timezone: v })}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
          />
        </View>
        <View className="w-full md:w-1/2 px-2 mb-3">
          <FieldLabel label="Language" />
          <TextInput
            value={data.language ?? "en"}
            onChangeText={(v) => setData({ ...data, language: v })}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
          />
        </View>
        <View className="w-full px-2 mb-3">
          <FieldLabel label="Work" />
          <TextInput
            value={data.work ?? ""}
            onChangeText={(v) => setData({ ...data, work: v })}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
          />
        </View>
        <View className="w-full px-2 mb-2">
          <FieldLabel label="Education" />
          <TextInput
            value={data.education ?? ""}
            onChangeText={(v) => setData({ ...data, education: v })}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
          />
        </View>
      </View>

      <View className="mt-2 flex-row justify-end">
        <Button disabled={saving} onPress={onSave}>
          <Text className="text-white text-sm font-semibold">
            {saving ? "Saving…" : "Save changes"}
          </Text>
        </Button>
      </View>
    </SectionCard>
  );
}

function PrivacySection() {
  const headers = useSettingsHeaders();
  const [data, setData] = useState<PrivacySettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!headers.Authorization) return;
    getPrivacy(headers)
      .then(setData)
      .catch((e) => setError(e.message || "Failed to load privacy settings"));
  }, [headers.Authorization]);

  const save = async () => {
    if (!data) return;
    setSaving(true);
    setError(null);
    try {
      await updatePrivacy(data, headers);
    } catch (e: any) {
      setError(e?.message || "Failed to save privacy settings");
    } finally {
      setSaving(false);
    }
  };

  if (!data) {
    return (
      <View className="flex-1 items-center justify-center py-12">
        <ActivityIndicator size="small" color="#2563eb" />
        <Text className="mt-2 text-xs text-gray-500">Loading privacy…</Text>
      </View>
    );
  }

  return (
    <SectionCard title="Privacy">
      {error ? (
        <View className="mb-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <Text className="text-xs text-red-700">{error}</Text>
        </View>
      ) : null}
      <PillSelectRow
        label="Profile visibility"
        value={data.profileVisibility}
        options={[
          { value: "everyone", label: "Everyone" },
          { value: "friends", label: "Friends" },
          { value: "only_me", label: "Only me" },
        ]}
        onChange={(v) => setData({ ...data, profileVisibility: v })}
      />
      <PillSelectRow
        label="Who can send you friend requests"
        value={data.friendRequestPolicy}
        options={[
          { value: "everyone", label: "Everyone" },
          { value: "friends_of_friends", label: "Friends of friends" },
        ]}
        onChange={(v) => setData({ ...data, friendRequestPolicy: v })}
      />
      <PillSelectRow
        label="Who can look you up by email"
        value={data.lookupEmail}
        options={[
          { value: "everyone", label: "Everyone" },
          { value: "friends", label: "Friends" },
          { value: "only_me", label: "Only me" },
        ]}
        onChange={(v) => setData({ ...data, lookupEmail: v })}
      />
      <PillSelectRow
        label="Who can look you up by phone"
        value={data.lookupPhone}
        options={[
          { value: "everyone", label: "Everyone" },
          { value: "friends", label: "Friends" },
          { value: "only_me", label: "Only me" },
        ]}
        onChange={(v) => setData({ ...data, lookupPhone: v })}
      />
      <View className="mt-2">
        <SwitchRow
          label="Show online status"
          value={data.showOnline}
          onToggle={() => setData({ ...data, showOnline: !data.showOnline })}
        />
        <SwitchRow
          label="Require review before tags appear"
          value={data.tagReview}
          onToggle={() => setData({ ...data, tagReview: !data.tagReview })}
        />
      </View>
      <View className="mt-4 flex-row justify-end">
        <Button disabled={saving} onPress={save}>
          <Text className="text-white text-sm font-semibold">
            {saving ? "Saving…" : "Save changes"}
          </Text>
        </Button>
      </View>
    </SectionCard>
  );
}

function NotificationsSection() {
  const headers = useSettingsHeaders();
  const [data, setData] = useState<NotificationSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!headers.Authorization) return;
    getNotifications(headers)
      .then(setData)
      .catch((e) =>
        setError(e.message || "Failed to load notification settings"),
      );
  }, [headers.Authorization]);

  const toggle = (key: keyof NotificationSettings) => {
    setData((prev) => (prev ? { ...prev, [key]: !prev[key] } : prev));
  };

  const save = async () => {
    if (!data) return;
    setSaving(true);
    setError(null);
    try {
      await updateNotifications(data, headers);
    } catch (e: any) {
      setError(e?.message || "Failed to save notification settings");
    } finally {
      setSaving(false);
    }
  };

  if (!data) {
    return (
      <View className="flex-1 items-center justify-center py-12">
        <ActivityIndicator size="small" color="#2563eb" />
        <Text className="mt-2 text-xs text-gray-500">
          Loading notifications…
        </Text>
      </View>
    );
  }

  const rows: [keyof NotificationSettings, string][] = [
    ["inappLikes", "Likes"],
    ["inappComments", "Comments"],
    ["inappMentions", "Mentions"],
    ["inappFriendRequests", "Friend requests"],
    ["inappGroupActivity", "Group activity"],
    ["inappPayments", "Payments"],
    ["emailDigest", "Email weekly digest"],
    ["emailSecurity", "Email security alerts"],
  ];

  return (
    <SectionCard title="Notifications">
      {error ? (
        <View className="mb-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <Text className="text-xs text-red-700">{error}</Text>
        </View>
      ) : null}
      <View className="space-y-1">
        {rows.map(([k, label]) => (
          <SwitchRow
            key={k}
            label={label}
            value={data[k]}
            onToggle={() => toggle(k)}
          />
        ))}
      </View>
      <View className="mt-4 flex-row justify-end">
        <Button disabled={saving} onPress={save}>
          <Text className="text-white text-sm font-semibold">
            {saving ? "Saving…" : "Save changes"}
          </Text>
        </Button>
      </View>
    </SectionCard>
  );
}

function SecuritySection() {
  const headers = useSettingsHeaders();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  useEffect(() => {
    if (!headers.Authorization) return;
    getSessions(headers)
      .then(setSessions)
      .catch((e) => setSessionsError(e.message || "Failed to load sessions"))
      .finally(() => setLoadingSessions(false));
  }, [headers.Authorization]);

  const onChangePassword = async () => {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await changePassword(currentPassword, newPassword, headers);
      setCurrentPassword("");
      setNewPassword("");
      setSuccess("Your password has been updated successfully");
    } catch (e: any) {
      setError(e?.message || "Failed to change password");
    } finally {
      setBusy(false);
    }
  };

  const onRevoke = async (id: string) => {
    try {
      await revokeSession(id, headers);
      setSessions((s) => s.filter((x) => x.id !== id));
    } catch (e: any) {
      setSessionsError(e?.message || "Failed to revoke session");
    }
  };

  return (
    <View>
      <SectionCard title="Change password">
        {error ? (
          <View className="mb-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <Text className="text-xs text-red-700">{error}</Text>
          </View>
        ) : null}
        {success ? (
          <View className="mb-3 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            <Text className="text-xs text-emerald-700">{success}</Text>
          </View>
        ) : null}
        <View className="mb-3">
          <FieldLabel label="Current password" />
          <TextInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
          />
        </View>
        <View className="mb-3">
          <FieldLabel label="New password" />
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
          />
          <Text className="mt-1 text-[11px] text-gray-500">
            Must be at least 8 characters.
          </Text>
        </View>
        <View className="mt-2 flex-row justify-end">
          <Button
            disabled={busy || !currentPassword || newPassword.length < 8}
            onPress={onChangePassword}
          >
            <Text className="text-white text-sm font-semibold">
              {busy ? "Saving…" : "Change password"}
            </Text>
          </Button>
        </View>
      </SectionCard>

      <SectionCard title="Active sessions">
        {loadingSessions ? (
          <View className="py-4 items-center justify-center">
            <ActivityIndicator size="small" color="#2563eb" />
            <Text className="mt-2 text-xs text-gray-500">
              Loading sessions…
            </Text>
          </View>
        ) : sessions.length === 0 ? (
          <Text className="text-sm text-gray-500">No active sessions.</Text>
        ) : (
          <View className="space-y-3">
            {sessions.map((s) => (
              <View
                key={s.id}
                className="border border-gray-200 rounded-lg p-3 flex-row items-start justify-between"
              >
                <View className="flex-1 pr-3">
                  <View className="flex-row items-center mb-1">
                    <Smartphone
                      size={16}
                      color="#111827"
                      style={{ marginRight: 6 }}
                    />
                    <Text className="text-sm font-medium text-gray-900">
                      {s.userAgent || "Unknown device"}
                    </Text>
                  </View>
                  <Text className="text-[11px] text-gray-600">
                    IP {s.ip || "—"} • Created{" "}
                    {new Date(s.createdAt).toLocaleString()}
                    {s.lastSeen
                      ? ` • Last seen ${new Date(s.lastSeen).toLocaleString()}`
                      : ""}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => onRevoke(s.id)}
                  className="px-3 py-1.5 rounded-full border border-gray-300"
                  activeOpacity={0.8}
                >
                  <Text className="text-xs font-semibold text-gray-800">
                    Revoke
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        {sessionsError ? (
          <View className="mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <Text className="text-xs text-red-700">{sessionsError}</Text>
          </View>
        ) : null}
      </SectionCard>
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("general");

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 pt-2 pb-3 flex-row items-center">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-3 h-9 w-9 rounded-full items-center justify-center bg-gray-100"
        >
          <ChevronLeft size={20} color="#111827" />
        </TouchableOpacity>
        <View>
          <Text className="text-lg font-semibold text-gray-900">Settings</Text>
          <Text className="text-xs text-gray-500 mt-0.5">
            Manage your Gada account from mobile
          </Text>
        </View>
      </View>

      <View className="px-4 pb-2">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 4 }}
        >
          {sections.map((s) => {
            const Icon = s.icon;
            const active = tab === s.key;
            return (
              <TouchableOpacity
                key={s.key}
                onPress={() => setTab(s.key)}
                className={`flex-row items-center px-3 py-2 mr-2 rounded-full border ${
                  active
                    ? "bg-blue-600 border-blue-600"
                    : "bg-white border-gray-200"
                }`}
              >
                <Icon
                  size={16}
                  color={active ? "#FFFFFF" : "#111827"}
                  style={{ marginRight: 6 }}
                />
                <Text
                  className={`text-xs font-medium ${
                    active ? "text-white" : "text-gray-800"
                  }`}
                >
                  {s.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {tab === "general" && <GeneralSection />}
        {tab === "privacy" && <PrivacySection />}
        {tab === "notifications" && <NotificationsSection />}
        {tab === "security" && <SecuritySection />}
      </ScrollView>
    </SafeAreaView>
  );
}
