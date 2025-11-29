"use client";

import type { TopicStat } from "@/lib/massa/types";
import { topicToLabel } from "@/lib/utils";

type TrendingTopicsProps = {
  topics?: TopicStat[];
};

export function TrendingTopics({ topics }: TrendingTopicsProps) {
  if (!topics?.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/60 to-slate-800/40 p-6 text-sm text-slate-400 shadow-lg">
        🔥 No trending topics yet. Be the first to post!
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-800/60 p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🔥</span>
        <h3 className="text-base font-bold text-white">Trending Topics</h3>
      </div>
      <div className="space-y-3">
        {topics.map((topic, index) => (
          <div
            key={topic.topic}
            className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-white/5 hover:border-sky-500/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-500/20 to-indigo-500/20 flex items-center justify-center text-sky-400 font-bold text-sm border border-sky-500/30">
                {index + 1}
              </div>
              <div>
                <p className="font-semibold text-white">#{topicToLabel(topic.topic)}</p>
                <p className="text-xs text-slate-400">
                  {topic.score} {topic.score === 1 ? 'mention' : 'mentions'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


