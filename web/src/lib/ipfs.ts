"use client";

export type UploadResult = {
  cid: string;
  url: string;
};

export async function uploadMedia(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/storage", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Unable to upload media to IPFS.");
  }

  return (await response.json()) as UploadResult;
}


