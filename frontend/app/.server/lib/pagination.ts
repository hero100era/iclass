export function getPaginationFromResponse(response: Response, limit: number) {
  const contentRange = response.headers.get("Content-Range");
  let totalCount = 0;
  if (contentRange) {
    const parts = contentRange.split("/");
    if (parts.length > 1) {
      totalCount = parseInt(parts[1], 10);
    }
  }
  const totalPages = Math.ceil(totalCount / limit);
  return { totalCount, totalPages };
}
