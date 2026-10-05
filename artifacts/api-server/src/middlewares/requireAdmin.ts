import { clerkClient, getAuth } from "@clerk/express";
import type { RequestHandler } from "express";
import { getClerkProxyHost } from "./clerkProxyMiddleware";

export const requireSameOrigin: RequestHandler = (req, res, next): void => {
  const origin = req.get("origin");
  if (!origin) {
    next();
    return;
  }

  const requestHost = getClerkProxyHost(req);
  if (!requestHost) {
    res.status(403).json({ error: "Cross-origin request rejected." });
    return;
  }

  try {
    const originUrl = new URL(origin);
    const expectedHost = new URL(`${originUrl.protocol}//${requestHost}`).host;
    if (originUrl.host.toLowerCase() !== expectedHost.toLowerCase()) {
      res.status(403).json({ error: "Cross-origin request rejected." });
      return;
    }
  } catch {
    res.status(403).json({ error: "Cross-origin request rejected." });
    return;
  }

  next();
};

export const requireAdmin: RequestHandler = async (
  req,
  res,
  next,
): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Sign-in required." });
    return;
  }

  const allowlist = new Set(
    (process.env.VIVID_ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );

  if (allowlist.size === 0) {
    req.log.error("VIVID_ADMIN_EMAILS is missing or empty.");
    res.status(503).json({ error: "Staff access is not configured." });
    return;
  }

  try {
    const user = await clerkClient.users.getUser(userId);
    const primaryEmail = user.emailAddresses.find(
      (email) => email.id === user.primaryEmailAddressId,
    );
    const verifiedEmail =
      primaryEmail?.verification.status === "verified"
        ? primaryEmail.emailAddress.trim().toLowerCase()
        : undefined;

    if (!verifiedEmail || !allowlist.has(verifiedEmail)) {
      res.status(403).json({ error: "Staff access required." });
      return;
    }

    next();
  } catch {
    req.log.error("Could not verify the signed-in user's staff email.");
    res.status(503).json({ error: "Unable to verify staff access right now." });
  }
};
