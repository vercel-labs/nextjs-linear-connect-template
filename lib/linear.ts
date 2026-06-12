import {
  ConnectError,
  getTokenResponse,
  NoValidTokenError,
  UserAuthorizationRequiredError,
  type ConnectTokenResponse,
} from "@vercel/connect";
import { CONNECTOR, getSubject, SCOPES } from "./connect";
import { isoDatePlusDays } from "./format";

const LINEAR_GRAPHQL_ENDPOINT = "https://api.linear.app/graphql";

/** How many days ahead the "Due soon" panel looks. */
const DUE_SOON_WINDOW_DAYS = 14;

// ---------------------------------------------------------------------------
// Connection: exchange the Vercel OIDC token for a Linear token.
// ---------------------------------------------------------------------------

export type LinearConnection =
  | { status: "connected"; token: string; response: ConnectTokenResponse }
  | { status: "needs_auth" }
  | { status: "error"; message: string; kind: "connector" | "generic" };

/**
 * Ask Vercel Connect for a Linear user-scoped token.
 *
 * - `connected`   — we have a valid token.
 * - `needs_auth`  — the user hasn't authorized Linear yet; show the consent CTA
 *                   (it links to `/api/linear/authorize`, which calls
 *                   `startAuthorization`).
 * - `error`       — something else is wrong (project not linked, missing OIDC
 *                   token in local dev, etc.); show the setup hint.
 */
export async function getLinearConnection(): Promise<LinearConnection> {
  try {
    const response = await getTokenResponse(CONNECTOR, {
      subject: getSubject(),
      scopes: SCOPES,
    });
    return { status: "connected", token: response.token, response };
  } catch (error) {
    if (
      error instanceof UserAuthorizationRequiredError ||
      error instanceof NoValidTokenError
    ) {
      return { status: "needs_auth" };
    }

    // A wrong/missing connector or an unlinked project comes back as a base
    // ConnectError with a `code`. These are config problems, not "the user
    // needs to authorize" — point at the CONNECTOR env var specifically.
    const code = error instanceof ConnectError ? error.code : undefined;
    const isConnectorIssue =
      code === "connector_not_found" ||
      code === "client_not_linked_to_project" ||
      code === "client_not_enabled_for_environment";

    return {
      status: "error",
      kind: isConnectorIssue ? "connector" : "generic",
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

// ---------------------------------------------------------------------------
// GraphQL transport.
// ---------------------------------------------------------------------------

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{
    message: string;
    extensions?: { userPresentableMessage?: string; type?: string };
  }>;
};

/** POST a GraphQL query to Linear with a bearer token. Throws on errors. */
export async function linearGraphQL<T>(
  token: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(LINEAR_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  // Linear returns HTTP 200 even for some errors, so always check `errors`.
  const json = (await res.json().catch(() => null)) as GraphQLResponse<T> | null;

  if (json?.errors?.length) {
    const first = json.errors[0];
    throw new Error(first.extensions?.userPresentableMessage ?? first.message);
  }
  if (!res.ok || !json?.data) {
    throw new Error(`Linear API request failed (HTTP ${res.status}).`);
  }
  return json.data;
}

// ---------------------------------------------------------------------------
// Types returned to the UI.
// ---------------------------------------------------------------------------

export type LinearState = { name: string; type: string; color: string };

export type LinearIssue = {
  id: string;
  identifier: string;
  title: string;
  url: string;
  priority: number;
  priorityLabel: string;
  dueDate: string | null;
  slaBreachesAt: string | null;
  state: LinearState | null;
  assignee: { name: string; avatarUrl: string | null } | null;
  team: { key: string } | null;
};

export type LinearTeam = { id: string; key: string; name: string };

export type LinearViewer = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  organization: { name: string; urlKey: string };
};

export type DashboardData = {
  viewer: LinearViewer;
  dueSoon: LinearIssue[];
  slaAtRisk: LinearIssue[];
  assigned: LinearIssue[];
  teams: LinearTeam[];
};

// ---------------------------------------------------------------------------
// The dashboard query — one round trip, several aliased issue lists.
// ---------------------------------------------------------------------------

const ISSUE_FRAGMENT = /* GraphQL */ `
  fragment IssueFields on Issue {
    id
    identifier
    title
    url
    priority
    priorityLabel
    dueDate
    slaBreachesAt
    state {
      name
      type
      color
    }
    assignee {
      name
      avatarUrl
    }
    team {
      key
    }
  }
`;

const DASHBOARD_QUERY = /* GraphQL */ `
  ${ISSUE_FRAGMENT}
  query Dashboard($dueBefore: TimelessDateOrDuration!) {
    viewer {
      id
      name
      email
      avatarUrl
      organization {
        name
        urlKey
      }
    }
    dueSoon: issues(
      filter: {
        dueDate: { lte: $dueBefore }
        state: { type: { nin: ["completed", "canceled"] } }
      }
      first: 12
    ) {
      nodes {
        ...IssueFields
      }
    }
    slaAtRisk: issues(
      filter: { slaStatus: { in: [Breached, HighRisk, MediumRisk] } }
      first: 12
    ) {
      nodes {
        ...IssueFields
      }
    }
    assigned: issues(
      filter: {
        assignee: { isMe: { eq: true } }
        state: { type: { nin: ["completed", "canceled"] } }
      }
      first: 12
    ) {
      nodes {
        ...IssueFields
      }
    }
    teams(first: 25) {
      nodes {
        id
        key
        name
      }
    }
  }
`;

type DashboardQueryResult = {
  viewer: LinearViewer;
  dueSoon: { nodes: LinearIssue[] };
  slaAtRisk: { nodes: LinearIssue[] };
  assigned: { nodes: LinearIssue[] };
  teams: { nodes: LinearTeam[] };
};

/** Fetch everything the dashboard renders. Sorting is done here in JS. */
export async function fetchDashboard(token: string): Promise<DashboardData> {
  const data = await linearGraphQL<DashboardQueryResult>(
    token,
    DASHBOARD_QUERY,
    { dueBefore: isoDatePlusDays(DUE_SOON_WINDOW_DAYS) },
  );

  return {
    viewer: data.viewer,
    dueSoon: [...data.dueSoon.nodes].sort(byNullableAsc((i) => i.dueDate)),
    slaAtRisk: [...data.slaAtRisk.nodes].sort(
      byNullableAsc((i) => i.slaBreachesAt),
    ),
    assigned: data.assigned.nodes,
    teams: data.teams.nodes,
  };
}

/** Ascending comparator that pushes null keys to the end. */
function byNullableAsc<T>(key: (item: T) => string | null) {
  return (a: T, b: T) =>
    (key(a) ?? "9999-12-31").localeCompare(key(b) ?? "9999-12-31");
}
