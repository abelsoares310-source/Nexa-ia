import React from "react";
import { Youtube, ExternalLink, Play } from "lucide-react";
import { getYouTubeSearchUrl } from "../utils/youtube";

interface YouTubeExplanationLinkProps {
  topic: string;
  subject?: string;
  variant?: "button" | "pill" | "banner" | "compact";
  customLabel?: string;
  className?: string;
  extraKeywords?: string;
}

export const YouTubeExplanationLink: React.FC<YouTubeExplanationLinkProps> = ({
  topic,
  subject,
  variant = "button",
  customLabel,
  className = "",
  extraKeywords = "aula explicação completa",
}) => {
  const url = getYouTubeSearchUrl(topic, subject, extraKeywords);
  const defaultLabel = customLabel || `Ver explicação no YouTube`;

  if (variant === "compact") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title={`Buscar vídeo-aula sobre ${topic} no YouTube`}
        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 hover:border-red-500/50 text-red-300 hover:text-red-200 text-xs font-semibold transition group ${className}`}
      >
        <Youtube className="w-3.5 h-3.5 text-red-400 group-hover:scale-110 transition-transform shrink-0" />
        <span className="truncate">{customLabel || "Aula no YouTube"}</span>
        <ExternalLink className="w-2.5 h-2.5 opacity-60 ml-0.5 shrink-0" />
      </a>
    );
  }

  if (variant === "pill") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title={`Abrir vídeo-aula no YouTube sobre ${topic}`}
        className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 hover:text-red-200 text-[11px] font-bold transition shadow-sm group ${className}`}
      >
        <Youtube className="w-3.5 h-3.5 text-red-400 group-hover:scale-110 transition-transform" />
        <span>{customLabel || "Vídeo no YouTube"}</span>
        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
      </a>
    );
  }

  if (variant === "banner") {
    return (
      <div
        className={`p-4 rounded-xl bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-900 border border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${className}`}
      >
        <div className="flex items-start space-x-3">
          <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center shrink-0 mt-0.5">
            <Youtube className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>Vídeo-aula & Explicação Complementar</span>
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Assista a explicações detalhadas e resolução de questões de <strong>{subject ? `${subject} - ` : ""}{topic}</strong> no YouTube.
            </p>
          </div>
        </div>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md hover:shadow-red-600/20 transition flex items-center justify-center space-x-2 shrink-0"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{customLabel || "Assistir no YouTube"}</span>
          <ExternalLink className="w-3 h-3 opacity-75" />
        </a>
      </div>
    );
  }

  // Default "button"
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 hover:border-red-500/60 text-red-200 hover:text-white text-xs font-bold transition shadow-sm group ${className}`}
    >
      <Youtube className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
      <span>{defaultLabel}</span>
      <ExternalLink className="w-3 h-3 opacity-60 ml-0.5" />
    </a>
  );
};
