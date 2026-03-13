import { createSign } from "crypto";
import { normalizeContractDetails, renderContractHtml } from "@/lib/contracts";

const DEMO_AUTH_SERVER = "account-d.docusign.com";
const PROD_AUTH_SERVER = "account.docusign.com";
const JWT_GRANT_TYPE = "urn:ietf:params:oauth:grant-type:jwt-bearer";

function base64UrlEncode(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function getAuthServer() {
  return process.env.DOCUSIGN_AUTH_SERVER?.trim() || DEMO_AUTH_SERVER;
}

function getPrivateKey() {
  const raw = process.env.DOCUSIGN_PRIVATE_KEY?.trim();
  return raw ? raw.replace(/\\n/g, "\n") : null;
}

function getConfig() {
  return {
    authServer: getAuthServer(),
    integrationKey: process.env.DOCUSIGN_INTEGRATION_KEY?.trim() || "",
    userId: process.env.DOCUSIGN_USER_ID?.trim() || "",
    privateKey: getPrivateKey() || "",
    accountId: process.env.DOCUSIGN_ACCOUNT_ID?.trim() || "",
  };
}

function getWebhookUrl() {
  const explicit = process.env.DOCUSIGN_CONNECT_WEBHOOK_URL?.trim();
  if (explicit) {
    return explicit;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!siteUrl) {
    return null;
  }

  return `${siteUrl.replace(/\/$/, "")}/api/webhooks/docusign`;
}

export function isDocuSignConfigured() {
  const config = getConfig();
  return Boolean(
    config.integrationKey && config.userId && config.privateKey
  );
}

export function getDocuSignSetupError() {
  if (isDocuSignConfigured()) {
    return null;
  }

  return "DocuSign is not configured. Add DOCUSIGN_INTEGRATION_KEY, DOCUSIGN_USER_ID, and DOCUSIGN_PRIVATE_KEY.";
}

function createJwtAssertion() {
  const config = getConfig();
  const now = Math.floor(Date.now() / 1000);

  const header = base64UrlEncode(
    JSON.stringify({
      alg: "RS256",
      typ: "JWT",
    })
  );

  const payload = base64UrlEncode(
    JSON.stringify({
      iss: config.integrationKey,
      sub: config.userId,
      aud: config.authServer,
      iat: now,
      exp: now + 3600,
      scope: "signature impersonation",
    })
  );

  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${payload}`);
  signer.end();

  const signature = base64UrlEncode(signer.sign(config.privateKey));

  return `${header}.${payload}.${signature}`;
}

async function docusignFetch<T>(
  url: string,
  init: RequestInit,
  accessToken: string
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const text = await response.text();
  const parsed = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(
      parsed?.message || parsed?.error_description || "DocuSign request failed"
    );
  }

  return parsed as T;
}

async function getAccessToken() {
  const assertion = createJwtAssertion();
  const authServer = getAuthServer();
  const response = await fetch(`https://${authServer}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: JWT_GRANT_TYPE,
      assertion,
    }),
  });

  const text = await response.text();
  const parsed = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(
      parsed?.error_description || parsed?.error || "Failed to authenticate with DocuSign"
    );
  }

  if (!parsed.access_token) {
    throw new Error("DocuSign access token missing from response");
  }

  return parsed.access_token as string;
}

async function getAccountContext(accessToken: string) {
  const authServer = getAuthServer();
  const info = await docusignFetch<{
    accounts?: Array<{
      account_id: string;
      is_default?: boolean;
      base_uri: string;
    }>;
  }>(`https://${authServer}/oauth/userinfo`, { method: "GET" }, accessToken);

  const configuredAccountId = process.env.DOCUSIGN_ACCOUNT_ID?.trim();
  const account =
    info.accounts?.find((item) => item.account_id === configuredAccountId) ||
    info.accounts?.find((item) => item.is_default) ||
    info.accounts?.[0];

  if (!account) {
    throw new Error("No DocuSign account found for the configured user");
  }

  return {
    accountId: account.account_id,
    baseUri: account.base_uri,
  };
}

function buildEnvelopePayload(contract: Record<string, any>) {
  const details = normalizeContractDetails(contract.contract_details_json, contract);
  const documentHtml = renderContractHtml(contract, details);
  const fileNameBase = (contract.client_name || "event-contract")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const webhookUrl = getWebhookUrl();
  const includeHmac = Boolean(process.env.DOCUSIGN_CONNECT_KEY?.trim());

  return {
    emailSubject: `Elel Event and Design Contract for ${contract.client_name}`,
    documents: [
      {
        documentBase64: Buffer.from(documentHtml, "utf-8").toString("base64"),
        name: `${fileNameBase || "event-contract"}.html`,
        fileExtension: "html",
        documentId: "1",
      },
    ],
    recipients: {
      signers: [
        {
          email: contract.client_email,
          name: contract.client_name,
          recipientId: "1",
          routingOrder: "1",
          tabs: {
            signHereTabs: [
              {
                anchorString: "[[CLIENT_SIGN_1]]",
                anchorUnits: "pixels",
                anchorXOffset: "0",
                anchorYOffset: "0",
              },
              {
                anchorString: "[[CLIENT_SIGN_2]]",
                anchorUnits: "pixels",
                anchorXOffset: "0",
                anchorYOffset: "0",
              },
            ],
            dateSignedTabs: [
              {
                anchorString: "[[CLIENT_DATE_1]]",
                anchorUnits: "pixels",
                anchorXOffset: "0",
                anchorYOffset: "0",
              },
              {
                anchorString: "[[CLIENT_DATE_2]]",
                anchorUnits: "pixels",
                anchorXOffset: "0",
                anchorYOffset: "0",
              },
            ],
          },
        },
      ],
    },
    ...(webhookUrl
      ? {
          eventNotification: {
            url: webhookUrl,
            requireAcknowledgment: "true",
            loggingEnabled: "true",
            deliveryMode: "SIM",
            ...(includeHmac ? { includeHMAC: "true" } : {}),
            events: ["envelope-completed", "envelope-declined", "envelope-voided"],
            eventData: {
              version: "restv2.1",
              format: "json",
              includeData: ["recipients"],
            },
          },
        }
      : {}),
    status: "sent",
  };
}

export async function createDocusignEnvelope(contract: Record<string, any>) {
  if (!contract.client_email || !contract.client_name) {
    throw new Error("Client name and email are required before sending via DocuSign");
  }

  const accessToken = await getAccessToken();
  const { accountId, baseUri } = await getAccountContext(accessToken);

  const envelope = await docusignFetch<{
    envelopeId: string;
    status: string;
    uri?: string;
  }>(
    `${baseUri}/restapi/v2.1/accounts/${accountId}/envelopes`,
    {
      method: "POST",
      body: JSON.stringify(buildEnvelopePayload(contract)),
    },
    accessToken
  );

  return {
    envelopeId: envelope.envelopeId,
    status: envelope.status,
    accountId,
    baseUri,
  };
}

export async function getDocusignEnvelopeStatus(envelopeId: string) {
  const accessToken = await getAccessToken();
  const { accountId, baseUri } = await getAccountContext(accessToken);

  const envelope = await docusignFetch<{
    envelopeId: string;
    status: string;
    completedDateTime?: string;
    deliveredDateTime?: string;
    sentDateTime?: string;
    voidedDateTime?: string;
    declinedDateTime?: string;
  }>(
    `${baseUri}/restapi/v2.1/accounts/${accountId}/envelopes/${envelopeId}`,
    { method: "GET" },
    accessToken
  );

  return envelope;
}

export function isDocuSignDemo() {
  return getAuthServer() === DEMO_AUTH_SERVER;
}

export function getDocusignWebhookUrl() {
  return getWebhookUrl();
}

export { DEMO_AUTH_SERVER, PROD_AUTH_SERVER };
