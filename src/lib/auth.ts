import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "~/server/db";
import { Polar } from "@polar-sh/sdk";
import { polar, checkout, portal, webhooks } from "@polar-sh/better-auth";
import { env } from "~/env";

const polarClient = new Polar({
  accessToken: env.POLAR_ACCESS_TOKEN,
  server: "sandbox",
});

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql", // or "mysql", "postgresql", ...etc
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            {
              productId: "4b89547e-3f66-49f4-bd84-01ff93cb9584",
              slug: "small",
            },
            {
              productId: "173ca5f0-1378-442a-b445-56312fe9c565",
              slug: "medium",
            },
            {
              productId: "44cb33c6-6ab6-4ec3-84fd-a40bdf1a8361",
              slug: "large",
            },
          ],
          successUrl: "/",
          authenticatedUsersOnly: true,
        }),
        portal(),
        webhooks({
          secret: env.POLAR_WEBHOOK_SECRET,
          onOrderPaid: async (order) => {
            const externalCustomerId = order.data.customer.externalId;

            if (!externalCustomerId) {
              console.error("No external customer ID found");
              throw new Error("No external customer id found");
            }

            const productId = order.data.productId;

            let creditsToAdd = 0;

            switch (productId) {
              case "4b89547e-3f66-49f4-bd84-01ff93cb9584":
                creditsToAdd = 10;
                break;
              case "173ca5f0-1378-442a-b445-56312fe9c565":
                creditsToAdd = 25;
                break;
              case "44cb33c6-6ab6-4ec3-84fd-a40bdf1a8361":
                creditsToAdd = 50;
                break;
            }

            await db.user.update({
              where: { id: externalCustomerId },
              data: {
                credits: {
                  increment: creditsToAdd,
                },
              },
            });
          },
        }),
      ],
    }),
  ],
});
