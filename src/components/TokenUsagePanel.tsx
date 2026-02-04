// components/TokenUsagePanel.tsx
// Panel component for displaying token usage at various entity levels

import React from 'react';
import { TokenUsageBadge } from './TokenUsageBadge';
import {
    useSegmentTokenUsage,
    useEpisodeTokenUsage,
    useSeasonTokenUsage,
    useSeriesTokenUsage,
    useStoryTokenUsage,
} from '../hooks/useTokenUsage';
import './TokenUsageBadge.css';

interface TokenUsagePanelProps {
    entityType: 'segment' | 'episode' | 'season' | 'series' | 'story';
    entityId: string;
    seasonNumber?: number; // Required when entityType is 'season'
    title?: string;
    variant?: 'compact' | 'detailed';
    showBreakdown?: boolean;
    className?: string;
}

export const TokenUsagePanel: React.FC<TokenUsagePanelProps> = ({
    entityType,
    entityId,
    seasonNumber = 1,
    title,
    variant = 'detailed',
    showBreakdown = true,
    className = '',
}) => {
    // Use the appropriate hook based on entity type
    const segmentUsage = useSegmentTokenUsage(
        entityType === 'segment' ? entityId : undefined
    );
    const episodeUsage = useEpisodeTokenUsage(
        entityType === 'episode' ? entityId : undefined
    );
    const seasonUsage = useSeasonTokenUsage(
        entityType === 'season' ? entityId : undefined,
        seasonNumber
    );
    const seriesUsage = useSeriesTokenUsage(
        entityType === 'series' ? entityId : undefined
    );
    const storyUsage = useStoryTokenUsage(
        entityType === 'story' ? entityId : undefined
    );

    // Select the appropriate result based on entity type
    const usageResult = {
        segment: segmentUsage,
        episode: episodeUsage,
        season: seasonUsage,
        series: seriesUsage,
        story: storyUsage,
    }[entityType];

    const entityLabels = {
        segment: 'Segment',
        episode: 'Episode',
        season: `Season ${seasonNumber}`,
        series: 'Series',
        story: 'Story',
    };

    const displayTitle = title || `${entityLabels[entityType]} Usage`;

    return (
        <div className={`token-usage-panel ${className}`}>
            {title !== '' && (
                <div className="token-usage-panel__header">
                    <h4 className="token-usage-panel__title">{displayTitle}</h4>
                    <button
                        className="token-usage-panel__refresh"
                        onClick={() => usageResult.refresh()}
                        disabled={usageResult.isLoading}
                        title="Refresh usage data"
                    >
                        🔄
                    </button>
                </div>
            )}
            {usageResult.error && (
                <div className="token-usage-panel__error">
                    Failed to load usage: {usageResult.error}
                </div>
            )}
            <TokenUsageBadge
                usage={usageResult.usage}
                isLoading={usageResult.isLoading}
                variant={variant}
                showBreakdown={showBreakdown}
            />
        </div>
    );
};

// Specialized components for each entity type
export const SegmentTokenUsage: React.FC<{
    segmentId: string;
    variant?: 'compact' | 'detailed' | 'inline';
}> = ({ segmentId, variant = 'compact' }) => {
    const { usage, isLoading } = useSegmentTokenUsage(segmentId);
    return <TokenUsageBadge usage={usage} isLoading={isLoading} variant={variant} />;
};

export const EpisodeTokenUsage: React.FC<{
    episodeId: string;
    variant?: 'compact' | 'detailed' | 'inline';
    showBreakdown?: boolean;
}> = ({ episodeId, variant = 'detailed', showBreakdown = true }) => {
    const { usage, isLoading } = useEpisodeTokenUsage(episodeId);
    return (
        <TokenUsageBadge
            usage={usage}
            isLoading={isLoading}
            variant={variant}
            showBreakdown={showBreakdown}
        />
    );
};

export const SeasonTokenUsage: React.FC<{
    seriesId: string;
    seasonNumber: number;
    variant?: 'compact' | 'detailed' | 'inline';
    showBreakdown?: boolean;
}> = ({ seriesId, seasonNumber, variant = 'detailed', showBreakdown = true }) => {
    const { usage, isLoading } = useSeasonTokenUsage(seriesId, seasonNumber);
    return (
        <TokenUsageBadge
            usage={usage}
            isLoading={isLoading}
            variant={variant}
            showBreakdown={showBreakdown}
        />
    );
};

export const SeriesTokenUsage: React.FC<{
    seriesId: string;
    variant?: 'compact' | 'detailed' | 'inline';
    showBreakdown?: boolean;
}> = ({ seriesId, variant = 'detailed', showBreakdown = true }) => {
    const { usage, isLoading } = useSeriesTokenUsage(seriesId);
    return (
        <TokenUsageBadge
            usage={usage}
            isLoading={isLoading}
            variant={variant}
            showBreakdown={showBreakdown}
        />
    );
};

export default TokenUsagePanel;
