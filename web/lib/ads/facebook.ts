/**
 * Facebook Graph API utility for posting photos to a Facebook Page.
 *
 * Uses the Pages API (free, no ad account needed).
 * Requires FACEBOOK_PAGE_ID and FACEBOOK_PAGE_ACCESS_TOKEN env vars.
 */

interface PostPhotoResult {
  id: string;
  post_id: string;
}

/**
 * Post a photo with caption to a Facebook Page.
 *
 * @param imageBuffer - The image as a Buffer
 * @param caption - The post text/caption
 * @param mimeType - Image MIME type (default: image/png)
 * @returns Facebook post ID
 */
export async function postPhotoToPage(
  imageBuffer: Buffer,
  caption: string,
  mimeType = "image/png",
): Promise<PostPhotoResult> {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

  if (!pageId || !accessToken) {
    throw new Error(
      "Missing FACEBOOK_PAGE_ID or FACEBOOK_PAGE_ACCESS_TOKEN env vars",
    );
  }

  const formData = new FormData();
  const blob = new Blob([imageBuffer], { type: mimeType });
  formData.append("source", blob, "ad-image.png");
  formData.append("message", caption);
  formData.append("access_token", accessToken);

  const response = await fetch(
    `https://graph.facebook.com/v21.0/${pageId}/photos`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Facebook API error (${response.status}): ${errorBody}`,
    );
  }

  return response.json() as Promise<PostPhotoResult>;
}
