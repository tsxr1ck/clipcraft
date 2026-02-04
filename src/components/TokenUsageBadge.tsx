// components/TokenUsageBadge.tsx
// Compact badge component showing token usage summary

import React from 'react';
import type { TokenUsageSummary } from '../services/tokenUsageService';
import './TokenUsageBadge.css';

export interface TokenUsageBadgeProps {
    usage: TokenUsageSummary | null;
    isLoading?: boolean;
    variant?: 'compact' | 'detailed' | 'inline';
    showBreakdown?: boolean;
}

// Format large numbers with K/M suffix
function formatNumber(num: number): string {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

export const TokenUsageBadge: React.FC<TokenUsageBadgeProps> = ({
    usage,
    isLoading = false,
    variant = 'compact',
    showBreakdown = false,
}) => {
    if (isLoading) {
        return (
            <div className={`token-usage-badge token-usage-badge--${variant} token-usage-badge--loading`}>
                <span className="token-usage-badge__icon">📊</span>
                <span className="token-usage-badge__value">...</span>
            </div>
        );
    }

    if (!usage || usage.total_generations === 0) {
        return (
            <div className={`token-usage-badge token-usage-badge--${variant} token-usage-badge--empty`}>
                <span className="token-usage-badge__icon">📊</span>
                <span className="token-usage-badge__value">No usage</span>
            </div>
        );
    }

    if (variant === 'inline') {
        return (
            <span className="token-usage-inline">
                <span className="token-usage-inline__icon">🪙</span>
                <span className="token-usage-inline__tokens">{formatNumber(usage.total_tokens)}</span>
                {usage.total_generations > 0 && (
                    <span className="token-usage-inline__gens">
                        ({usage.total_generations} gen{usage.total_generations !== 1 ? 's' : ''})
                    </span>
                )}
            </span>
        );
    }

    if (variant === 'compact') {
        return (
            <div className="token-usage-badge token-usage-badge--compact">
                <div className="token-usage-badge__main">
                    <span className="token-usage-badge__icon">🪙</span>
                    <span className="token-usage-badge__tokens">{formatNumber(usage.total_tokens)} tokens</span>
                </div>
                <div className="token-usage-badge__meta">
                    {usage.text_generations > 0 && (
                        <span className="token-usage-badge__count token-usage-badge__count--text">
                            📝 {usage.text_generations}
                        </span>
                    )}
                    {usage.image_generations > 0 && (
                        <span className="token-usage-badge__count token-usage-badge__count--image">
                            🖼️ {usage.image_generations}
                        </span>
                    )}
                    {usage.audio_generations > 0 && (
                        <span className="token-usage-badge__count token-usage-badge__count--audio">
                            🔊 {usage.audio_generations}
                        </span>
                    )}
                </div>
            </div>
        );
    }

    // Detailed variant
    return (
        <div className="token-usage-badge token-usage-badge--detailed">
            <div className="token-usage-badge__header">
                <span className="token-usage-badge__icon">📊</span>
                <span className="token-usage-badge__title">Token Usage</span>
            </div>

            <div className="token-usage-badge__stats">
                <div className="token-usage-stat">
                    <span className="token-usage-stat__label">Total Tokens</span>
                    <span className="token-usage-stat__value token-usage-stat__value--primary">
                        {formatNumber(usage.total_tokens)}
                    </span>
                </div>
                <div className="token-usage-stat">
                    <span className="token-usage-stat__label">Prompt</span>
                    <span className="token-usage-stat__value">{formatNumber(usage.prompt_tokens)}</span>
                </div>
                <div className="token-usage-stat">
                    <span className="token-usage-stat__label">Completion</span>
                    <span className="token-usage-stat__value">{formatNumber(usage.completion_tokens)}</span>
                </div>
            </div>

            <div className="token-usage-badge__generations">
                <div className="token-usage-badge__generations-title">Generations</div>
                <div className="token-usage-badge__generations-grid">
                    {usage.text_generations > 0 && (
                        <div className="token-usage-gen token-usage-gen--text">
                            <span className="token-usage-gen__icon">📝</span>
                            <span className="token-usage-gen__count">{usage.text_generations}</span>
                            <span className="token-usage-gen__label">Text</span>
                        </div>
                    )}
                    {usage.image_generations > 0 && (
                        <div className="token-usage-gen token-usage-gen--image">
                            <span className="token-usage-gen__icon">🖼️</span>
                            <span className="token-usage-gen__count">{usage.image_generations}</span>
                            <span className="token-usage-gen__label">Images</span>
                        </div>
                    )}
                    {usage.audio_generations > 0 && (
                        <div className="token-usage-gen token-usage-gen--audio">
                            <span className="token-usage-gen__icon">🔊</span>
                            <span className="token-usage-gen__count">{usage.audio_generations}</span>
                            <span className="token-usage-gen__label">Audio</span>
                        </div>
                    )}
                    {usage.video_generations > 0 && (
                        <div className="token-usage-gen token-usage-gen--video">
                            <span className="token-usage-gen__icon">🎬</span>
                            <span className="token-usage-gen__count">{usage.video_generations}</span>
                            <span className="token-usage-gen__label">Video</span>
                        </div>
                    )}
                </div>
            </div>

            {showBreakdown && Object.keys(usage.by_model).length > 0 && (
                <div className="token-usage-badge__breakdown">
                    <div className="token-usage-badge__breakdown-title">By Model</div>
                    {Object.entries(usage.by_model).map(([model, data]) => (
                        <div key={model} className="token-usage-breakdown-row">
                            <span className="token-usage-breakdown-row__model">{model}</span>
                            <span className="token-usage-breakdown-row__value">
                                {formatNumber(data.tokens)} ({data.count}×)
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {usage.estimated_cost_usd !== null && (
                <div className="token-usage-badge__cost">
                    <span className="token-usage-badge__cost-label">Est. Cost</span>
                    <span className="token-usage-badge__cost-value">
                        ${usage.estimated_cost_usd.toFixed(4)}
                    </span>
                </div>
            )}
        </div>
    );
};

export default TokenUsageBadge;
