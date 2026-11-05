/**
 * Utility functions for YouTube educational video links and explanations
 */

export function getYouTubeSearchUrl(topic: string, subject?: string, extraKeywords?: string): string {
  const cleanTopic = (topic || "").trim();
  const cleanSubject = (subject || "").trim();
  const cleanExtra = (extraKeywords || "aula explicação").trim();

  // Combine cleanly
  const queryParts = [cleanSubject, cleanTopic, cleanExtra].filter(Boolean);
  const query = queryParts.join(" ");

  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

export function openYouTubeExplanation(topic: string, subject?: string, extraKeywords?: string): void {
  const url = getYouTubeSearchUrl(topic, subject, extraKeywords);
  window.open(url, "_blank", "noopener,noreferrer");
}
