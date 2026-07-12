import { auth, clerkClient } from "@clerk/nextjs/server";

const CLICKUP_API_URL = "https://api.clickup.com/api/v2";

export type ClickUpTask = {
  id: string;
  name: string;
  status: {
    status: string;
    color: string;
  };
  due_date: string | null;
  url: string;
  list: {
    name: string;
  };
};

export type ClickUpData =
  | { status: "not_configured" }
  | { status: "needs_connection" }
  | { status: "needs_reconnect" }
  | { status: "unavailable" }
  | { status: "connected"; tasks: ClickUpTask[] };

export function isClickUpConfigured() {
  return Boolean(process.env.CLICKUP_CLIENT_ID && process.env.CLICKUP_CLIENT_SECRET);
}

export function getClickUpAuthorizeUrl(redirectUri: string) {
  const clientId = process.env.CLICKUP_CLIENT_ID;

  if (!clientId) {
    throw new Error("CLICKUP_CLIENT_ID is not set");
  }

  const query = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri });
  return `https://app.clickup.com/api?${query}`;
}

export async function getStoredClickUpToken(userId: string) {
  const client = await clerkClient();

  try {
    const user = await client.users.getUser(userId);
    const token = user.privateMetadata.clickupAccessToken;
    return typeof token === "string" && token.length > 0 ? token : undefined;
  } catch (error) {
    console.error("Failed to load Clerk user while reading the ClickUp token", error);
    return undefined;
  }
}

async function fetchClickUpJson<T>(path: string, accessToken: string) {
  const url = `${CLICKUP_API_URL}${path}`;

  try {
    const response = await fetch(url, {
      headers: { Authorization: accessToken },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        `ClickUp API request failed with ${response.status}: ${url}`,
        await response.text().catch(() => ""),
      );

      // ClickUp tokens don't expire, so a 401 means the user revoked the
      // app's access — reconnecting mints a fresh token.
      if (response.status === 401) {
        return { status: "needs_reconnect" } as const;
      }

      return { status: "unavailable" } as const;
    }

    return { status: "connected", data: (await response.json()) as T } as const;
  } catch (error) {
    console.error(`ClickUp API request failed: ${url}`, error);
    return { status: "unavailable" } as const;
  }
}

export async function getClickUpData(): Promise<ClickUpData> {
  if (!isClickUpConfigured()) {
    return { status: "not_configured" };
  }

  const { userId } = await auth();

  if (!userId) {
    return { status: "needs_connection" };
  }

  const accessToken = await getStoredClickUpToken(userId);

  if (!accessToken) {
    return { status: "needs_connection" };
  }

  const [me, teams] = await Promise.all([
    fetchClickUpJson<{ user: { id: number } }>("/user", accessToken),
    fetchClickUpJson<{ teams: Array<{ id: string }> }>("/team", accessToken),
  ]);

  if (me.status !== "connected") {
    return me;
  }

  if (teams.status !== "connected") {
    return teams;
  }

  const teamId = teams.data.teams[0]?.id;

  if (!teamId) {
    return { status: "unavailable" };
  }

  const query = new URLSearchParams({ order_by: "due_date", subtasks: "true" });
  query.append("assignees[]", String(me.data.user.id));

  const tasks = await fetchClickUpJson<{ tasks: ClickUpTask[] }>(
    `/team/${teamId}/task?${query}`,
    accessToken,
  );

  if (tasks.status !== "connected") {
    return tasks;
  }

  return { status: "connected", tasks: tasks.data.tasks.slice(0, 8) };
}
