import { auth, clerkClient } from "@clerk/nextjs/server";

import { getWeekRange } from "@/lib/week";

type ClerkClient = Awaited<ReturnType<typeof clerkClient>>;

// Must match the scopes configured on the Google connection in the Clerk
// dashboard, or reconnecting keeps prompting for consent.
export const GOOGLE_WORKSPACE_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
];

export type GoogleCalendarEvent = {
  id: string;
  title: string;
  start: {
    date?: string;
    dateTime?: string;
  };
  end: {
    date?: string;
    dateTime?: string;
  };
  location?: string;
  htmlLink?: string;
};

export type GoogleDriveFile = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  webViewLink?: string;
};

export type GoogleDataResult<T> =
  | { status: "connected"; data: T }
  | { status: "needs_connection" }
  | { status: "needs_reconnect" }
  | { status: "needs_permission" }
  | { status: "unavailable" };

export type GoogleWorkspaceData = {
  calendar: GoogleDataResult<GoogleCalendarEvent[]>;
  drive: GoogleDataResult<GoogleDriveFile[]>;
};

type GoogleCalendarResponse = {
  items?: Array<Omit<GoogleCalendarEvent, "title"> & { summary?: string }>;
};

type GoogleDriveResponse = {
  files?: GoogleDriveFile[];
};

async function fetchGoogleJson<T>(url: string, accessToken: string) {
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        `Google API request failed with ${response.status}: ${url}`,
        await response.text().catch(() => ""),
      );

      // 401 means the stored token is no longer valid, not that the
      // account was never connected.
      if (response.status === 401) {
        return { status: "needs_reconnect" } as const;
      }

      if (response.status === 403) {
        return { status: "needs_permission" } as const;
      }

      return { status: "unavailable" } as const;
    }

    return { status: "connected", data: (await response.json()) as T } as const;
  } catch (error) {
    console.error(`Google API request failed: ${url}`, error);
    return { status: "unavailable" } as const;
  }
}

function getCalendarEventsUrl() {
  const { timeMin, timeMax } = getWeekRange();
  const query = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    maxResults: "50",
    singleEvents: "true",
    orderBy: "startTime",
    fields: "items(id,summary,start,end,location,htmlLink)",
  });

  return `https://www.googleapis.com/calendar/v3/calendars/primary/events?${query}`;
}

function getDriveFilesUrl() {
  const query = new URLSearchParams({
    q: "trashed = false",
    orderBy: "modifiedTime desc",
    pageSize: "8",
    fields: "files(id,name,mimeType,modifiedTime,webViewLink)",
  });

  return `https://www.googleapis.com/drive/v3/files?${query}`;
}

async function hasGoogleAccount(client: ClerkClient, userId: string) {
  try {
    const user = await client.users.getUser(userId);
    return user.externalAccounts.some((account) => account.provider === "oauth_google");
  } catch (error) {
    console.error("Failed to load Clerk user while checking Google connection", error);
    return false;
  }
}

export async function getGoogleWorkspaceData(): Promise<GoogleWorkspaceData> {
  const { userId } = await auth();

  if (!userId) {
    return {
      calendar: { status: "needs_connection" },
      drive: { status: "needs_connection" },
    };
  }

  const client = await clerkClient();
  let accessToken: string | undefined;

  try {
    const tokens = await client.users.getUserOauthAccessToken(userId, "google");
    accessToken = tokens.data[0]?.token;
  } catch (error) {
    console.error("Failed to get a Google OAuth access token from Clerk", error);
  }

  if (!accessToken) {
    // A connected account without a usable token means the token expired
    // and Clerk could not refresh it — reconnecting fixes that.
    const status = (await hasGoogleAccount(client, userId))
      ? ("needs_reconnect" as const)
      : ("needs_connection" as const);

    return { calendar: { status }, drive: { status } };
  }

  const [calendarResponse, driveResponse] = await Promise.all([
    fetchGoogleJson<GoogleCalendarResponse>(getCalendarEventsUrl(), accessToken),
    fetchGoogleJson<GoogleDriveResponse>(getDriveFilesUrl(), accessToken),
  ]);

  return {
    calendar:
      calendarResponse.status === "connected"
        ? {
            status: "connected",
            data: (calendarResponse.data.items ?? []).map(({ summary, ...event }) => ({
              ...event,
              title: summary ?? "Untitled event",
            })),
          }
        : calendarResponse,
    drive:
      driveResponse.status === "connected"
        ? { status: "connected", data: driveResponse.data.files ?? [] }
        : driveResponse,
  };
}
