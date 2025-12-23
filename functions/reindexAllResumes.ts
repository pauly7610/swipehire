import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    // Get all candidates with resumes
    const allCandidates = await base44.asServiceRole.entities.Candidate.list();
    const candidatesWithResumes = allCandidates.filter(c => c.resume_url);

    console.log(`Found ${candidatesWithResumes.length} candidates with resumes`);

    const results = {
      total: candidatesWithResumes.length,
      success: 0,
      failed: 0,
      errors: []
    };

    // Process in batches to avoid timeouts
    const batchSize = 5;
    for (let i = 0; i < candidatesWithResumes.length; i += batchSize) {
      const batch = candidatesWithResumes.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (candidate) => {
          try {
            const indexResponse = await base44.functions.invoke('indexResume', {
              candidate_id: candidate.id,
              resume_url: candidate.resume_url
            });

            if (indexResponse.data.success) {
              results.success++;
            } else {
              results.failed++;
              results.errors.push({
                candidate_id: candidate.id,
                error: indexResponse.data.error
              });
            }
          } catch (error) {
            results.failed++;
            results.errors.push({
              candidate_id: candidate.id,
              error: error.message
            });
          }
        })
      );

      // Log progress
      console.log(`Processed ${Math.min(i + batchSize, candidatesWithResumes.length)}/${candidatesWithResumes.length} resumes`);
    }

    return Response.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Reindex error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});