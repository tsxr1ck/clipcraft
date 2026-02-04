import { supabase, STORAGE_BUCKET } from '../lib/supabase';
import type { Story } from '../types/story';
import type {
    DbSegment,
    StoryWithSegments,
} from '../types/database';

// Audio storage bucket name
const AUDIO_BUCKET = 'story-audios';
const VIDEO_BUCKET = 'story-videos';

export class SupabaseService {
    /**
     * Save a new story with its segments to the database
     */
    static async saveStory(
        story: Story,
        baseIdea: string,
        visualStyle?: string,
        scriptTone?: string,
        profileId?: string
    ): Promise<StoryWithSegments> {
        // 1. Insert the story first
        const { data: storyData, error: storyError } = await supabase
            .from('stories')
            .insert({
                base_idea: baseIdea,
                story_title: story.story_title,
                visual_style: visualStyle,
                script_tone: scriptTone,
                profile_id: profileId,
            } as never)
            .select()
            .single();

        if (storyError || !storyData) {
            throw new Error(`Failed to save story: ${storyError?.message}`);
        }

        const typedStoryData = storyData as StoryWithSegments;

        // 2. Insert all segments with the story_id
        const segmentsToInsert = story.segments.map((segment, index) => ({
            story_id: typedStoryData.id,
            segment_index: index,
            duration_seconds: segment.duration_seconds,
            text: segment.text,
            visual_prompt: segment.visual_prompt,
            image_url: segment.image_url || null,
            audio_url: null,
        }));

        const { data: segmentsData, error: segmentsError } = await supabase
            .from('segments')
            .insert(segmentsToInsert as never)
            .select()
            .order('segment_index', { ascending: true });

        if (segmentsError) {
            // Rollback: delete the story if segments failed
            await supabase.from('stories').delete().eq('id', typedStoryData.id);
            throw new Error(`Failed to save segments: ${segmentsError.message}`);
        }

        return {
            ...typedStoryData,
            segments: (segmentsData || []) as DbSegment[],
        };
    }

    /**
     * Get all stories with their segments
     */
    static async getAllStories(): Promise<StoryWithSegments[]> {
        const { data: stories, error: storiesError } = await supabase
            .from('stories')
            .select('*')
            .order('created_at', { ascending: false });

        if (storiesError) {
            throw new Error(`Failed to fetch stories: ${storiesError.message}`);
        }

        if (!stories || stories.length === 0) {
            return [];
        }

        const typedStories = stories as StoryWithSegments[];

        // Fetch all segments for these stories
        const storyIds = typedStories.map(s => s.id);
        const { data: segments, error: segmentsError } = await supabase
            .from('segments')
            .select('*')
            .in('story_id', storyIds)
            .order('segment_index', { ascending: true });

        if (segmentsError) {
            throw new Error(`Failed to fetch segments: ${segmentsError.message}`);
        }

        const typedSegments = (segments || []) as DbSegment[];

        // Group segments by story_id
        const segmentsByStoryId = typedSegments.reduce((acc, segment) => {
            if (!acc[segment.story_id]) {
                acc[segment.story_id] = [];
            }
            acc[segment.story_id].push(segment);
            return acc;
        }, {} as Record<string, DbSegment[]>);

        // Combine stories with their segments
        return typedStories.map(story => ({
            ...story,
            segments: segmentsByStoryId[story.id] || [],
        }));
    }

    /**
     * Get a single story by ID with its segments
     */
    static async getStoryById(id: string): Promise<StoryWithSegments | null> {
        const { data: story, error: storyError } = await supabase
            .from('stories')
            .select('*')
            .eq('id', id)
            .single();

        if (storyError) {
            if (storyError.code === 'PGRST116') {
                return null;
            }
            throw new Error(`Failed to fetch story: ${storyError.message}`);
        }

        const typedStory = story as StoryWithSegments;

        const { data: segments, error: segmentsError } = await supabase
            .from('segments')
            .select('*')
            .eq('story_id', id)
            .order('segment_index', { ascending: true });

        if (segmentsError) {
            throw new Error(`Failed to fetch segments: ${segmentsError.message}`);
        }

        return {
            ...typedStory,
            segments: (segments || []) as DbSegment[],
        };
    }

    /**
     * Update a single segment's image URL
     */
    static async updateSegmentImageUrl(segmentId: string, imageUrl: string): Promise<DbSegment> {
        const { data, error } = await supabase
            .from('segments')
            .update({ image_url: imageUrl } as never)
            .eq('id', segmentId)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update segment image: ${error.message}`);
        }

        return data as DbSegment;
    }

    /**
     * Update a single segment's audio URL
     */
    static async updateSegmentAudioUrl(segmentId: string, audioUrl: string): Promise<DbSegment> {
        const { data, error } = await supabase
            .from('segments')
            .update({ audio_url: audioUrl } as never)
            .eq('id', segmentId)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update segment audio: ${error.message}`);
        }

        return data as DbSegment;
    }

    /**
     * Delete a story and all its segments (cascade)
     */
    static async deleteStory(id: string): Promise<void> {
        // Delete associated images from storage
        const { data: imageFiles } = await supabase.storage
            .from(STORAGE_BUCKET)
            .list(id);

        if (imageFiles && imageFiles.length > 0) {
            const filePaths = imageFiles.map(file => `${id}/${file.name}`);
            await supabase.storage.from(STORAGE_BUCKET).remove(filePaths);
        }

        // Delete associated audios from storage
        const { data: audioFiles } = await supabase.storage
            .from(AUDIO_BUCKET)
            .list(id);

        if (audioFiles && audioFiles.length > 0) {
            const filePaths = audioFiles.map(file => `${id}/${file.name}`);
            await supabase.storage.from(AUDIO_BUCKET).remove(filePaths);
        }

        // Delete associated videos from storage
        const { data: videoFiles } = await supabase.storage
            .from(VIDEO_BUCKET)
            .list(id);

        if (videoFiles && videoFiles.length > 0) {
            const filePaths = videoFiles.map(file => `${id}/${file.name}`);
            await supabase.storage.from(VIDEO_BUCKET).remove(filePaths);
        }

        // Delete story (segments cascade automatically)
        const { error } = await supabase
            .from('stories')
            .delete()
            .eq('id', id);

        if (error) {
            throw new Error(`Failed to delete story: ${error.message}`);
        }
    }

    /**
     * Upload an image to Supabase Storage
     */
    static async uploadImage(
        imageData: Blob | ArrayBuffer,
        storyId: string,
        segmentIndex: number
    ): Promise<string> {
        const fileName = `${storyId}/segment-${segmentIndex}-${Date.now()}.png`;

        const { error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(fileName, imageData, {
                contentType: 'image/png',
                upsert: true,
            });

        if (uploadError) {
            throw new Error(`Failed to upload image: ${uploadError.message}`);
        }

        const { data } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(fileName);

        return data.publicUrl;
    }

    /**
     * Upload an audio file to Supabase Storage
     */
    static async uploadAudio(
        audioData: Blob | ArrayBuffer,
        storyId: string,
        segmentIndex: number
    ): Promise<string> {
        const fileName = `${storyId}/segment-${segmentIndex}-${Date.now()}.mp3`;

        const { error: uploadError } = await supabase.storage
            .from(AUDIO_BUCKET)
            .upload(fileName, audioData, {
                contentType: 'audio/mpeg',
                upsert: true,
            });

        if (uploadError) {
            throw new Error(`Failed to upload audio: ${uploadError.message}`);
        }

        const { data } = supabase.storage
            .from(AUDIO_BUCKET)
            .getPublicUrl(fileName);

        return data.publicUrl;
    }

    /**
     * Get a segment by story ID and index
     */
    static async getSegmentByIndex(storyId: string, segmentIndex: number): Promise<DbSegment | null> {
        const { data, error } = await supabase
            .from('segments')
            .select('*')
            .eq('story_id', storyId)
            .eq('segment_index', segmentIndex)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            throw new Error(`Failed to fetch segment: ${error.message}`);
        }

        return data as DbSegment;
    }

    /**
     * Upload a video file to Supabase Storage
     */
    static async uploadVideo(
        videoData: Blob | ArrayBuffer,
        storyId: string
    ): Promise<string> {
        const fileName = `${storyId}/full-story-${Date.now()}.mp4`;

        const { error: uploadError } = await supabase.storage
            .from(VIDEO_BUCKET)
            .upload(fileName, videoData, {
                contentType: 'video/mp4',
                upsert: true,
            });

        if (uploadError) {
            throw new Error(`Failed to upload video: ${uploadError.message}`);
        }

        const { data } = supabase.storage
            .from(VIDEO_BUCKET)
            .getPublicUrl(fileName);

        return data.publicUrl;
    }

    /**
     * Update story with video URL and status
     */
    static async updateStoryVideo(
        storyId: string,
        videoUrl: string | null,
        videoStatus: string,
        videoJobId: string | null
    ): Promise<void> {
        const { error } = await supabase
            .from('stories')
            .update({
                video_url: videoUrl,
                video_status: videoStatus,
                video_job_id: videoJobId,
            } as never)
            .eq('id', storyId);

        if (error) {
            throw new Error(`Failed to update story video: ${error.message}`);
        }
    }
}
