import { clerkClient, requireAuth } from "@clerk/express";
import { upsertStreamUser } from "../lib/stream.js";
import User from "../models/User.js";

export const protectRoute = [
  requireAuth(),
  async (req, res, next) => {
    try {
      const clerkId = req.auth().userId;

      if (!clerkId) return res.status(401).json({ message: "Unauthorized - invalid token" });

      let user = await User.findOne({ clerkId });
      if (!user) {
        const clerkUser = await clerkClient.users.getUser(clerkId);
        const email = clerkUser.primaryEmailAddress?.emailAddress;

        if (!email) {
          return res.status(422).json({ message: "A primary email address is required" });
        }

        const name =
          [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
          clerkUser.username ||
          email.split("@")[0];

        await upsertStreamUser({
          id: clerkId,
          name,
          image: clerkUser.imageUrl,
        });

        user = await User.findOneAndUpdate(
          { clerkId },
          {
            $setOnInsert: {
              clerkId,
              email,
              name,
              profileImage: clerkUser.imageUrl,
            },
          },
          { upsert: true, new: true, runValidators: true }
        );
      }

      req.user = user;

      next();
    } catch (error) {
      console.error("Error in protectRoute middleware", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
];
