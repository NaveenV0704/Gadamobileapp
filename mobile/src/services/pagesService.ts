import { API_BASE_URL } from "../constants/config";

function api(path: string, params?: Record<string, any>) {
  let url = `${API_BASE_URL}/api/pages${path}`;
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

export function fetchCategories(headers: Record<string, string> = {}) {
  return fetch(api("/categories"), { headers }).then(ok);
}

export function createPage(body: any, headers: Record<string, string> = {}) {
  return fetch(api(""), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  }).then(ok);
}

export function listPages(params: any, headers: Record<string, string> = {}) {
  return fetch(api("", params), { headers }).then(ok);
}

export function getPage(
  idOrName: string | number,
  headers: Record<string, string> = {},
) {
  return fetch(api(`/${idOrName}`), { headers }).then(ok);
}

export async function updatePagePicture(
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

export async function updatePageCover(
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

export function togglePageLike(
  idOrName: string | number,
  headers: Record<string, string> = {},
) {
  return fetch(api(`/${idOrName}/like`), { method: "POST", headers }).then(ok);
}

export function fetchPagePosts(
  idOrName: string | number,
  params: any,
  headers: Record<string, string> = {},
) {
  return fetch(api(`/${idOrName}/posts`, params), { headers }).then(ok);
}

export async function createPagePost(
  handle: string,
  data: { content?: string; images?: any[]; videos?: any[] },
  headers: Record<string, string>,
) {
  const fd = new FormData();
  if (data.content?.trim()) fd.append("content", data.content.trim());

  (data.images || []).forEach((img, i) => {
    fd.append("images", {
      uri: img.uri,
      name: img.fileName || `img_${i}.jpg`,
      type: img.mimeType || "image/jpeg",
    } as any);
  });

  (data.videos || []).forEach((vid, i) => {
    fd.append("videos", {
      uri: vid.uri,
      name: vid.fileName || `vid_${i}.mp4`,
      type: vid.mimeType || "video/mp4",
    } as any);
  });

  const h = { ...headers };
  delete h["Content-Type"];

  const res = await fetch(
    `${API_BASE_URL}/api/pages/${encodeURIComponent(handle)}/posts`,
    {
      method: "POST",
      headers: h,
      body: fd,
    },
  );
  return ok(res);
}

export function suggestUsers(q: string, headers: Record<string, string> = {}) {
  return fetch(api("/users/suggest", { q }), { headers }).then(ok);
}

export function listMyInvites(headers: Record<string, string> = {}) {
  return fetch(api("/invites"), { headers }).then(ok);
}

export function listPageInvites(
  idOrName: string | number,
  headers: Record<string, string> = {},
) {
  return fetch(api(`/${idOrName}/invites`), { headers }).then(ok);
}

export function inviteUserToPage(
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

export function acceptInvite(
  idOrName: string | number,
  inviteId: number,
  headers: Record<string, string> = {},
) {
  return fetch(api(`/${idOrName}/invites/${inviteId}/accept`), {
    method: "POST",
    headers,
  }).then(ok);
}

export function declineInvite(
  idOrName: string | number,
  inviteId: number,
  headers: Record<string, string> = {},
) {
  return fetch(api(`/${idOrName}/invites/${inviteId}/decline`), {
    method: "POST",
    headers,
  }).then(ok);
}

export function togglePageBoost(
  idOrHandle: string | number,
  enable: boolean,
  headers: Record<string, string>,
) {
  return fetch(api(`/${encodeURIComponent(String(idOrHandle))}/boost`), {
    method: enable ? "POST" : "DELETE",
    headers,
  }).then(ok);
}
