import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { candidate_id, resume_url } = await req.json();

    if (!candidate_id || !resume_url) {
      return Response.json({ error: 'candidate_id and resume_url required' }, { status: 400 });
    }

    // Extract text from resume
    const extractResponse = await base44.functions.invoke('extractResumeText', { resume_url });
    
    if (!extractResponse.data.success) {
      // Update candidate with failed status
      await base44.asServiceRole.entities.Candidate.update(candidate_id, {
        index_status: 'failed',
        index_timestamp: new Date().toISOString(),
        index_error: extractResponse.data.error || 'Text extraction failed'
      });

      return Response.json({
        success: false,
        error: extractResponse.data.error || 'Text extraction failed'
      }, { status: 400 });
    }

    const { resume_plain_text, resume_normalized_text } = extractResponse.data;

    // Update candidate with indexed content
    await base44.asServiceRole.entities.Candidate.update(candidate_id, {
      resume_plain_text,
      resume_normalized_text,
      index_status: 'success',
      index_timestamp: new Date().toISOString(),
      index_error: null
    });

    return Response.json({
      success: true,
      candidate_id,
      text_length: resume_plain_text.length,
      indexed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Resume indexing error:', error);
    
    // Try to update candidate with error status
    try {
      const { candidate_id } = await req.json();
      if (candidate_id) {
        const base44 = createClientFromRequest(req);
        await base44.asServiceRole.entities.Candidate.update(candidate_id, {
          index_status: 'failed',
          index_timestamp: new Date().toISOString(),
          index_error: error.message
        });
      }
    } catch (updateError) {
      console.error('Failed to update error status:', updateError);
    }

    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});