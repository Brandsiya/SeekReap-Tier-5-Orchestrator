import axios from "axios";

const TIER4_URL = process.env.TIER4_URL;
const TIER4_API_KEY = process.env.TIER4_API_KEY;

/**
 * Call Tier-4 single decision endpoint
 */
export async function callTier4Decision(input) {
  if (!TIER4_URL || !TIER4_API_KEY) {
    throw new Error("Tier-4 configuration missing");
  }

  const response = await axios.post(
    `${TIER4_URL}/v1/decision`,
    { input },
    {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": TIER4_API_KEY,
      },
      timeout: 5000,
    }
  );

  return response.data;
}

/**
 * Call Tier-4 batch decision endpoint
 */
export async function callTier4Batch(inputs = []) {
  if (!Array.isArray(inputs)) {
    throw new Error("Inputs must be an array");
  }

  const response = await axios.post(
    `${TIER4_URL}/v1/decision/batch`,
    { inputs },
    {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": TIER4_API_KEY,
      },
      timeout: 5000,
    }
  );

  return response.data;
}
