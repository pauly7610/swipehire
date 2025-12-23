import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Analyze video content and extract hiring intelligence
 * Called automatically when videos are uploaded
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { video_post_id, video_url, caption, tags, candidate } = await req.json();

    if (!video_post_id || !video_url) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate AI insights from video metadata and candidate profile
    const prompt = `Analyze this hiring video and extract structured intelligence.
    
    Video context:
    - Caption: ${caption || 'N/A'}
    - Tags: ${tags?.join(', ') || 'N/A'}
    - Candidate headline: ${candidate?.headline || 'N/A'}
    - Candidate skills: ${candidate?.skills?.join(', ') || 'N/A'}
    - Candidate location: ${candidate?.location || 'N/A'}
    
    Extract:
    1. Skills mentioned or demonstrated (array of strings)
    2. Experience level (entry/mid/senior/lead/executive)
    3. Work type preference (Remote/Hybrid/Onsite/Contract/Full-Time)
    4. Location mentioned (city, state, or Remote)
    5. Clearance level if mentioned (Secret/Top Secret/TS/SCI/None)
    6. Video segments (estimate timestamps):
       - Intro (0-X seconds)
       - Skills showcase (X-Y seconds)
       - Proof/Examples (Y-Z seconds)
       - CTA (Z-end seconds)
    7. Clarity score (0-100): How clear and articulate
    8. Confidence score (0-100): How confident the delivery
    9. Depth score (0-100): How thorough and detailed
    
    Return as structured JSON.`;

    const aiAnalysis = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          skills: { type: "array", items: { type: "string" } },
          experience_level: { type: "string" },
          work_type: { type: "string" },
          location: { type: "string" },
          clearance: { type: "string" },
          segments: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                start: { type: "number" },
                end: { type: "number" }
              }
            }
          },
          clarity_score: { type: "number" },
          confidence_score: { type: "number" },
          depth_score: { type: "number" }
        }
      }
    });

    // Update video post with AI insights
    await base44.asServiceRole.entities.VideoPost.update(video_post_id, {
      ai_insights: aiAnalysis
    });

    return Response.json({ 
      success: true, 
      insights: aiAnalysis 
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});