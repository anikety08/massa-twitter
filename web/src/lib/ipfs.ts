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
      "NEXT_PUBLIC_NFT_STORAGE_TOKEN is not configured. Please set it in your environment variables."
    );
  }

  try {
    const client = new NFTStorage({ token });
    const cid = await client.storeBlob(file);
    
    return {
      cid,
      url: `${gateway}${cid}`,
    };
  } catch (error) {
    throw new Error(
      error instanceof Error 
        ? `Unable to upload media to IPFS: ${error.message}`
        : "Unable to upload media to IPFS."
    );
  }
}


