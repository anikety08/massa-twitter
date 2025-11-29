"use client";

import { NFTStorage } from "nft.storage";

export type UploadResult = {
  cid: string;
  url: string;
};

const gateway =
  process.env.NEXT_PUBLIC_IPFS_GATEWAY ?? "https://ipfs.io/ipfs/";

export async function uploadMedia(file: File): Promise<UploadResult> {
  const token = process.env.NEXT_PUBLIC_NFT_STORAGE_TOKEN;
  
  if (!token) {
    throw new Error(
      "NEXT_PUBLIC_NFT_STORAGE_TOKEN is not configured. Please set it in your .env.local file."
    );
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error("File size exceeds 10MB limit. Please choose a smaller file.");
  }

  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
  if (!validTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} is not supported. Please use: ${validTypes.join(', ')}`);
  }

  try {
    const client = new NFTStorage({ token });
    
    // Show progress for large files
    console.log(`Uploading ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB) to IPFS...`);
    
    const cid = await client.storeBlob(file);
    
    if (!cid || cid.length === 0) {
      throw new Error("Upload failed: No CID returned from IPFS storage.");
    }
    
    console.log(`Upload successful! CID: ${cid}`);
    
    return {
      cid,
      url: `${gateway}${cid}`,
    };
  } catch (error) {
    console.error("IPFS upload error:", error);
    
    if (error instanceof Error) {
      // Check for specific error messages
      if (error.message.includes("401") || error.message.includes("Unauthorized")) {
        throw new Error("Invalid NFT.Storage API token. Please check your NEXT_PUBLIC_NFT_STORAGE_TOKEN.");
      }
      if (error.message.includes("429") || error.message.includes("rate limit")) {
        throw new Error("Upload rate limit exceeded. Please try again in a moment.");
      }
      if (error.message.includes("network") || error.message.includes("fetch")) {
        throw new Error("Network error. Please check your connection and try again.");
      }
    }
    
    throw new Error(
      error instanceof Error 
        ? `Upload failed: ${error.message}`
        : "Unable to upload media to IPFS. Please try again."
    );
  }
}


