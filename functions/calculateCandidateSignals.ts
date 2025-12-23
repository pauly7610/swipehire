import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { candidate_id } = await req.json();

    if (!candidate_id) {
      return Response.json({ error: 'candidate_id required' }, { status: 400 });
    }

    // Fetch candidate
    const candidates = await base44.entities.Candidate.filter({ id: candidate_id });
    const candidate = candidates[0];

    if (!candidate) {
      return Response.json({ error: 'Candidate not found' }, { status: 404 });
    }

    // Calculate profile completion
    const requiredFields = ['headline', 'bio', 'skills', 'location', 'photo_url', 'resume_url'];
    const completedFields = requiredFields.filter(field => {
      const value = candidate[field];
      if (Array.isArray(value)) return value.length > 0;
      return !!value;
    });
    const profileCompletionPercent = Math.round((completedFields.length / requiredFields.length) * 100);

    // Calculate message reply rate and response time
    const [sentMessages, receivedMessages] = await Promise.all([
      base44.asServiceRole.entities.DirectMessage.filter({ sender_id: candidate.user_id }),
      base44.asServiceRole.entities.DirectMessage.filter({ receiver_id: candidate.user_id })
    ]);

    let messageReplyRate = 0;
    let avgResponseTimeHours = 0;

    if (receivedMessages.length > 0) {
      // Calculate replies
      const repliedTo = new Set();
      receivedMessages.forEach(msg => {
        const reply = sentMessages.find(sent => 
          new Date(sent.created_date) > new Date(msg.created_date) &&
          sent.receiver_id === msg.sender_id
        );
        if (reply) repliedTo.add(msg.id);
      });

      messageReplyRate = (repliedTo.size / receivedMessages.length) * 100;

      // Calculate average response time
      const responseTimes = [];
      receivedMessages.forEach(msg => {
        const reply = sentMessages.find(sent => 
          new Date(sent.created_date) > new Date(msg.created_date) &&
          sent.receiver_id === msg.sender_id
        );
        if (reply) {
          const timeDiff = new Date(reply.created_date) - new Date(msg.created_date);
          responseTimes.push(timeDiff / (1000 * 60 * 60)); // Convert to hours
        }
      });

      if (responseTimes.length > 0) {
        avgResponseTimeHours = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      }
    }

    // Calculate interview completion rate
    const interviews = await base44.asServiceRole.entities.Interview.filter({ candidate_id });
    const scheduledInterviews = interviews.filter(i => i.status === 'scheduled' || i.status === 'confirmed' || i.status === 'completed');
    const completedInterviews = interviews.filter(i => i.status === 'completed');
    
    const interviewCompletionRate = scheduledInterviews.length > 0 
      ? (completedInterviews.length / scheduledInterviews.length) * 100 
      : 0;

    // Get view counts
    const signals = await base44.asServiceRole.entities.InterestSignal.filter({ candidate_id });
    const videoViewCount = signals.filter(s => s.signal_type === 'view' && s.metadata?.video).length;
    const profileViewCount = signals.filter(s => s.signal_type === 'view').length;

    // Get swipe count
    const swipes = await base44.asServiceRole.entities.Swipe.filter({ target_id: candidate_id, direction: 'right' });
    const swipeRightCount = swipes.length;

    // Determine responsiveness score
    let responsivenessScore = 'unknown';
    if (messageReplyRate > 0) {
      if (messageReplyRate >= 75 && avgResponseTimeHours < 24) {
        responsivenessScore = 'high';
      } else if (messageReplyRate >= 50 && avgResponseTimeHours < 48) {
        responsivenessScore = 'medium';
      } else {
        responsivenessScore = 'low';
      }
    }

    // Create or update signal record
    const existingSignals = await base44.asServiceRole.entities.CandidateSignal.filter({ candidate_id });
    
    const signalData = {
      candidate_id,
      user_id: candidate.user_id,
      profile_completion_percent: profileCompletionPercent,
      avg_response_time_hours: avgResponseTimeHours,
      message_reply_rate: messageReplyRate,
      interview_completion_rate: interviewCompletionRate,
      video_view_count: videoViewCount,
      video_replay_count: 0, // Will be tracked separately
      profile_view_count: profileViewCount,
      swipe_right_count: swipeRightCount,
      last_active: new Date().toISOString(),
      responsiveness_score: responsivenessScore
    };

    let signal;
    if (existingSignals.length > 0) {
      signal = await base44.asServiceRole.entities.CandidateSignal.update(existingSignals[0].id, signalData);
    } else {
      signal = await base44.asServiceRole.entities.CandidateSignal.create(signalData);
    }

    return Response.json({ 
      success: true, 
      signal,
      details: {
        profileCompletionPercent,
        messageReplyRate: Math.round(messageReplyRate),
        avgResponseTimeHours: Math.round(avgResponseTimeHours * 10) / 10,
        interviewCompletionRate: Math.round(interviewCompletionRate),
        responsivenessScore
      }
    });

  } catch (error) {
    console.error('Error calculating candidate signals:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});