import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

// Realtime Developer Notification payload (subset)
const subSchema = z.object({
  subscriptionNotification: z.object({ purchaseToken: z.string() }).optional(),
  oneTimeProductNotification: z.object({ purchaseToken: z.string(), notificationType: z.number() }).optional(),
  testNotification: z.object({ version: z.string() }).optional(),
});

const bodySchema = z.object({
  message: z.object({
    data: z.string().optional(),
    attributes: z.record(z.string(), z.string()).optional(),
    messageId: z.string().optional(),
  }).optional(),
  // Direct shape used by manual / app-side notifications
  purchase_id: z.string().uuid().optional(),
  google_order_id: z.string().optional(),
  failure_reason: z.string().optional(),
  status: z.enum(["completed", "failed"]).optional(),
});

function unauthorized() {
  return new Response("Unauthorized", { status: 401 });
}

export const Route = createFileRoute("/api/public/google-play-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.GOOGLE_PLAY_WEBHOOK_SECRET;
        if (!secret) return new Response("Webhook not configured", { status: 500 });

        const authHeader = request.headers.get("authorization") ?? "";
        const expected = `Bearer ${secret}`;
        if (authHeader.length !== expected.length) return unauthorized();
        let ok = 0;
        for (let i = 0; i < expected.length; i++) {
          ok |= authHeader.charCodeAt(i) ^ expected.charCodeAt(i);
        }
        if (ok !== 0) return unauthorized();

        let raw: unknown;
        try { raw = await request.json(); } catch { return new Response("Invalid JSON", { status: 400 }); }

        const parsed = bodySchema.safeParse(raw);
        if (!parsed.success) return new Response("Invalid payload", { status: 400 });
        const body = parsed.data;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const sb = supabaseAdmin as any;

        // Path 1: direct call from server-side app passing purchase_id + status
        if (body.purchase_id && body.status) {
          if (body.status === "completed") {
            const { data, error } = await sb.rpc("complete_purchase", {
              p_purchase_id: body.purchase_id,
              p_google_order_id: body.google_order_id ?? null,
            });
            if (error) return new Response(error.message, { status: 500 });
            return Response.json(data);
          }
          const { data, error } = await sb.rpc("fail_purchase", {
            p_purchase_id: body.purchase_id,
            p_reason: body.failure_reason ?? null,
          });
          if (error) return new Response(error.message, { status: 500 });
          return Response.json(data);
        }

        // Path 2: Google Pub/Sub Realtime Developer Notifications
        if (body.message?.data) {
          let decoded: unknown;
          try {
            const json = Buffer.from(body.message.data, "base64").toString("utf8");
            decoded = JSON.parse(json);
          } catch {
            return new Response("Bad envelope", { status: 400 });
          }
          const sub = subSchema.safeParse(decoded);
          if (!sub.success) return Response.json({ ok: true, ignored: true });

          if (sub.data.testNotification) return Response.json({ ok: true, test: true });

          const token =
            sub.data.subscriptionNotification?.purchaseToken ??
            sub.data.oneTimeProductNotification?.purchaseToken;
          if (!token) return Response.json({ ok: true, ignored: true });

          const { data: row, error: lookupErr } = await sb
            .from("credit_purchases")
            .select("id,status")
            .eq("google_purchase_token", token)
            .maybeSingle();
          if (lookupErr) return new Response(lookupErr.message, { status: 500 });
          if (!row) return Response.json({ ok: true, unknown_token: true });

          // oneTimeProductNotification: 1 = PURCHASED, 2 = CANCELED
          const notifType = sub.data.oneTimeProductNotification?.notificationType;
          if (notifType === 1) {
            await sb.rpc("complete_purchase", { p_purchase_id: row.id, p_google_order_id: null });
          } else if (notifType === 2) {
            await sb.rpc("fail_purchase", { p_purchase_id: row.id, p_reason: "google_canceled" });
          }
          return Response.json({ ok: true });
        }

        return new Response("Empty payload", { status: 400 });
      },
    },
  },
});