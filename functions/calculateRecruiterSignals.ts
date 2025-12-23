import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { company_id } = await req.json();

    if (!company_id) {
      return Response.json({ error: 'company_id required' }, { status: 400 });
    }

    // Get company
    const companies = await base44.asServiceRole.entities.Company.filter({ id: company_id });
    const company = companies[0];

    if (!company) {
      return Response.json({ error: 'Company not found' }, { status: 404 });
    }

    // Calculate message reply rate and response time
    const [sentMessages, receivedMessages] = await Promise.all([
      base44.asServiceRole.entities.DirectMessage.filter({ sender_id: user.id }),
      base44.asServiceRole.entities.DirectMessage.filter({ receiver_id: user.id })
    ]);

    let messageReplyRate = 0;
    let avgResponseTimeHours = 0;

    if (receivedMessages.length > 0) {
      const repliedTo = new Set();
      receivedMessages.forEach(msg => {
        const reply = sentMessages.find(sent => 
          new Date(sent.created_date) > new Date(msg.created_date) &&
          sent.receiver_id === msg.sender_id
        );
        if (reply) repliedTo.add(msg.id);
      });

      messageReplyRate = (repliedTo.size / receivedMessages.length) * 100;

      const responseTimes = [];
      receivedMessages.forEach(msg => {
        const reply = sentMessages.find(sent => 
          new Date(sent.created_date) > new Date(msg.created_date) &&
          sent.receiver_id === msg.sender_id
        );
        if (reply) {
          const timeDiff = new Date(reply.created_date) - new Date(msg.created_date);
          responseTimes.push(timeDiff / (1000 * 60 * 60));
        }
      });

      if (responseTimes.length > 0) {
        avgResponseTimeHours = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      }
    }

    // Calculate interview follow-through
    const interviews = await base44.asServiceRole.entities.Interview.filter({ company_id });
    const scheduledInterviews = interviews.filter(i => i.status === 'scheduled' || i.status === 'confirmed' || i.status === 'completed');
    const completedInterviews = interviews.filter(i => i.status === 'completed');
    
    const interviewFollowThroughRate = scheduledInterviews.length > 0 
      ? (completedInterviews.length / scheduledInterviews.length) * 100 
      : 0;

    // Calculate pipeline speed
    const matches = await base44.asServiceRole.entities.Match.filter({ company_id });
    const pipelineTimes = [];
    
    matches.forEach(match => {
      const created = new Date(match.created_date);
      const updated = new Date(match.updated_date);
      const daysDiff = (updated - created) / (1000 * 60 * 60 * 24);
      if (daysDiff > 0) pipelineTimes.push(daysDiff);
    });

    const avgPipelineMoveDays = pipelineTimes.length > 0
      ? pipelineTimes.reduce((a, b) => a + b, 0) / pipelineTimes.length
      : 0;

    // Get activity counts
    const swipes = await base44.asServiceRole.entities.Swipe.filter({ user_id: user.id });
    const swipeActivityCount = swipes.length;
    const matchCount = matches.length;

    // Active conversations
    const uniqueConversations = new Set([
      ...sentMessages.map(m => m.receiver_id),
      ...receivedMessages.map(m => m.sender_id)
    ]);
    const activeConversations = uniqueConversations.size;

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
    const existingSignals = await base44.asServiceRole.entities.RecruiterSignal.filter({ company_id });
    
    const signalData = {
      company_id,
      user_id: user.id,
      avg_response_time_hours: avgResponseTimeHours,
      message_reply_rate: messageReplyRate,
      interview_follow_through_rate: interviewFollowThroughRate,
      avg_pipeline_move_days: avgPipelineMoveDays,
      swipe_activity_count: swipeActivityCount,
      match_count: matchCount,
      active_conversations: activeConversations,
      last_active: new Date().toISOString(),
      responsiveness_score: responsivenessScore
    };

    let signal;
    if (existingSignals.length > 0) {
      signal = await base44.asServiceRole.entities.RecruiterSignal.update(existingSignals[0].id, signalData);
    } else {
      signal = await base44.asServiceRole.entities.RecruiterSignal.create(signalData);
    }

    return Response.json({ 
      success: true, 
      signal,
      details: {
        messageReplyRate: Math.round(messageReplyRate),
        avgResponseTimeHours: Math.round(avgResponseTimeHours * 10) / 10,
        interviewFollowThroughRate: Math.round(interviewFollowThroughRate),
        avgPipelineMoveDays: Math.round(avgPipelineMoveDays * 10) / 10,
        responsivenessScore
      }
    });

  } catch (error) {
    console.error('Error calculating recruiter signals:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});