/**
 * convex/storage.ts
 *
 * File storage helpers for avatar uploads, cover images, and certificates.
 * Uses Convex's built-in file storage API.
 *
 * Typical flow:
 *   1. Client calls `generateUploadUrl` → receives a short-lived signed POST URL.
 *   2. Client PUTs/POSTs the file directly to that URL.
 *   3. Convex returns a `storageId` string.
 *   4. Client passes the `storageId` to a profile mutation (e.g. `saveBasicInfo`
 *      with `avatarStorageId`).
 *   5. When displaying, call `getStorageUrl` to get a signed download URL.
 */

import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Generates a signed upload URL that the client can use to POST a file
 * directly to Convex storage.
 *
 * The user must be authenticated — we do not want anonymous uploads.
 * The returned URL is short-lived (expires in ~1 minute).
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Must be authenticated to upload files");
    }

    return ctx.storage.generateUploadUrl();
  },
});

/**
 * Returns a signed download URL for the given storage ID, or null if the
 * file no longer exists.
 *
 * This is a public query — the caller supplies the storageId they already
 * know from a profile/project/achievement document.
 */
export const getStorageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return ctx.storage.getUrl(args.storageId);
  },
});
