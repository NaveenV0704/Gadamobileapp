import { API_BASE_URL } from "../constants/config";

function api(path: string, params?: Record<string, any>) {
  let url = `${API_BASE_URL}/api/groups${path}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        searchParams.set(k, String(v));
      }
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }
  return url;
}

async function ok<T>(r: Response): Promise<T> {
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    throw new Error((data as any)?.error || "Request failed");
  }
  return data as T;
}

export function fetchGroupCategories(headers: Record<string, string> = {}) {
  return fetch(api("/categories"), { headers }).then(ok);
}

export function createGroup(body: any, headers: Record<string, string> = {}) {
  return fetch(api(""), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  }).then(ok);
}

export function listGroups(params: any, headers: Record<string, string> = {}) {
  return fetch(api("", params), { headers }).then(ok);
}

export function getGroup(
  idOrName: string | number,
  headers: Record<string, string> = {},
) {
  return fetch(api(`/${idOrName}`), { headers }).then(ok);
}

export async function updateGroupPicture(
  idOrName: string | number,
  file: { uri: string; name: string; type: string },
  headers: Record<string, string> = {},
) {
  const fd = new FormData();
  fd.append("picture", {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as any);

  const h = { ...headers };
  delete h["Content-Type"];

  const res = await fetch(api(`/${idOrName}/picture`), {
    method: "POST",
    headers: h,
    body: fd,
  });
  return ok(res);
}

export async function updateGroupCover(
  idOrName: string | number,
  file: { uri: string; name: string; type: string },
  headers: Record<string, string> = {},
) {
  const fd = new FormData();
  fd.append("cover", {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as any);

  const h = { ...headers };
  delete h["Content-Type"];

  const res = await fetch(api(`/${idOrName}/cover`), {
    method: "POST",
    headers: h,
    body: fd,
  });
  return ok(res);
}

export function joinGroup(
  idOrName: string | number,
  headers: Record<string, string> = {},
) {
  return fetch(api(`/${idOrName}/join`), { method: "POST", headers }).then(ok);
}

export function leaveGroup(
  idOrName: string | number,
  headers: Record<string, string> = {},
) {
  return fetch(api(`/${idOrName}/leave`), { method: "POST", headers }).then(ok);
}

export function fetchGroupPosts(
  idOrName: string | number,
  params: any,
  headers: Record<string, string> = {},
) {
  return fetch(api(`/${idOrName}/posts`, params), { headers }).then(ok);
}

export function createGroupPost(
  idOrName: string | number,
  body: any,
  headers: Record<string, string> = {},
) {
  return fetch(api(`/${idOrName}/posts`), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  }).then(ok);
}

export function suggestGroupUsers(
  q: string,
  headers: Record<string, string> = {},
) {
  return fetch(api("/users/suggest", { q }), { headers }).then(ok);
}

export function listMyGroupInvites(headers: Record<string, string> = {}) {
  return fetch(api("/invites"), { headers }).then(ok);
}

export function listGroupInvites(
  idOrName: string | number,
  headers: Record<string, string> = {},
) {
  return fetch(api(`/${idOrName}/invites`), { headers }).then(ok);
}

export function inviteUserToGroup(
  idOrName: string | number,
  userId: number,
  headers: Record<string, string> = {},
) {
  return fetch(api(`/${idOrName}/invites`), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ userId }),
  }).then(ok);
}

export function acceptGroupInvite(
  idOrName: string | number,
  inviteId: number,
  headers: Record<string, string> = {},
) {
  return fetch(api(`/${idOrName}/invites/${inviteId}/accept`), {
    method: "POST",
    headers,
  }).then(ok);
}

export function declineGroupInvite(
  idOrName: string | number,
  inviteId: number,
  headers: Record<string, string> = {},
) {
  return fetch(api(`/${idOrName}/invites/${inviteId}/decline`), {
    method: "POST",
    headers,
  }).then(ok);
}
