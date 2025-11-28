import { NextResponse } from "next/server";
import { NFTStorage } from "nft.storage";

const gateway =
  process.env.NEXT_PUBLIC_IPFS_GATEWAY ?? "https://ipfs.io/ipfs/";

export async function POST(request: Request) {
  const token = process.env.NFT_STORAGE_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "NFT_STORAGE_TOKEN is not configured." },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "Missing file payload." },
      { status: 400 },
    );
  }

  const client = new NFTStorage({ token });
  const cid = await client.storeBlob(file);
  return NextResponse.json({
    cid,
    url: `${gateway}${cid}`,
  });
}


