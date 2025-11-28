"use client";

import type { TopicStat } from "@/lib/massa/types";
import { topicToLabel } from "@/lib/utils";

type TrendingTopicsProps = {
  topics?: TopicStat[];
};

export function TrendingTopics({ topics }: TrendingTopicsProps) {
  if (!topics?.length) {
    return (
      <div className="rounded-3xl border border-white/5 bg-white/5 p-5 text-sm text-slate-400">
        No trending topics yet.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/5 bg-white/5 p-5">
      <h3 className="text-sm font-semibold text-slate-200">Trending</h3>
      <div className="mt-4 space-y-3 text-sm">
        {topics.map((topic, index) => (
          <div
            key={topic.topic}
            className="flex items-center justify-between text-slate-300"
          >
            <div>
              <p className="font-medium text-white">{topicToLabel(topic.topic)}</p>
              <p className="text-xs text-slate-400">
                {topic.score} mentions
              </p>
            </div>
            <span className="text-xs text-slate-500">#{index + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


