import { StreamChat } from "stream-chat";
import { StreamClient } from "@stream-io/node-sdk";
import { ENV } from "./env.js";

const apiKey = ENV.STREAM_API_KEY;
const apiSecret = ENV.STREAM_API_SECRET;

if (!apiKey || !apiSecret) {
  console.error("STREAM_API_KEY or STREAM_API_SECRET is missing");
}

// Use this for chat
export const chatClient = StreamChat.getInstance(apiKey, apiSecret);

// Use this for video + user sync
export const streamClient = new StreamClient(apiKey, apiSecret);

// ✅ FIXED: use `streamClient.upsertUsers()` for user creation
export const upsertStreamUser = async (userData) => {
  try {
    await streamClient.upsertUsers([userData]); // expects an array of users
    await chatClient.upsertUser(userData);
    console.log("✅ Stream user upserted successfully:", userData.id);
  } catch (error) {
    console.error("❌ Error upserting Stream user:", error.message);
    throw error;
  }
};

export const deleteStreamUser = async (userId) => {
  try {
    await streamClient.deleteUser(userId, { hard_delete: true });
    console.log("✅ Stream user deleted successfully:", userId);
  } catch (error) {
    console.error("❌ Error deleting the Stream user:", error.message);
  }
};
