import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PostSwipeEngagement from './PostSwipeEngagement';

/**
 * Background service that monitors swipes and triggers notifications
 * Runs for authenticated users, polls for new swipes every 30 seconds
 */
export default function SwipeNotificationHandler({ user, userType }) {
  const [pendingSwipe, setPendingSwipe] = useState(null);
  const [showEngagement, setShowEngagement] = useState(false);
  const [processedSwipes, setProcessedSwipes] = useState(new Set());

  useEffect(() => {
    if (!user) return;

    let mounted = true;
    let interval = null;

    const checkForNewSwipes = async () => {
      try {
        // Get swipes on current user (they are the target)
        const targetId = userType === 'employer' 
          ? (await base44.entities.Company.filter({ user_id: user.id }))[0]?.id
          : (await base44.entities.Candidate.filter({ user_id: user.id }))[0]?.id;

        if (!targetId) return;

        const targetType = userType === 'employer' ? 'company' : 'candidate';
        
        // Find swipes where this user/company/candidate is the target
        const recentSwipes = await base44.entities.Swipe.filter(
          { target_id: targetId, target_type: targetType },
          '-created_date',
          10
        );

        // Filter for right swipes we haven't processed yet
        const newSwipes = recentSwipes.filter(s => 
          (s.direction === 'right' || s.direction === 'super') && 
          !processedSwipes.has(s.id)
        );

        if (newSwipes.length > 0 && mounted) {
          const latestSwipe = newSwipes[0];
          
          // Mark as processed
          setProcessedSwipes(prev => new Set([...prev, latestSwipe.id]));

          // Get swiper details
          let swiperData = null;
          let contextData = null;

          if (latestSwipe.swiper_type === 'candidate') {
            const candidate = await base44.entities.Candidate.get(latestSwipe.swiper_id);
            const candidateUser = await base44.entities.User.get(candidate.user_id);
            swiperData = candidateUser;
            
            // Get job context
            if (latestSwipe.job_id) {
              contextData = await base44.entities.Job.get(latestSwipe.job_id);
            }
          } else if (latestSwipe.swiper_type === 'employer') {
            const company = await base44.entities.Company.get(latestSwipe.company_id);
            const recruiterUser = await base44.entities.User.get(company.user_id);
            swiperData = recruiterUser;
            contextData = company;
          }

          if (mounted && swiperData) {
            // Create in-app notification
            await base44.entities.Notification.create({
              user_id: user.id,
              type: 'swipe_received',
              title: '👋 Someone swiped on you!',
              message: `${swiperData.full_name} is interested${contextData ? ` in ${contextData.title || contextData.name}` : ''}`
            });

            // Send email notification (check preferences)
            const targetProfile = userType === 'employer'
              ? await base44.entities.Company.get(targetId)
              : await base44.entities.Candidate.get(targetId);

            if (targetProfile?.email_frequency !== 'never') {
              await base44.integrations.Core.SendEmail({
                to: user.email,
                subject: '👋 New Interest on SwipeHire',
                body: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
                      <h1 style="color: white; margin: 0; font-size: 24px;">Someone's Interested! 🎉</h1>
                    </div>
                    <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px;">
                      <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                        <strong>${swiperData.full_name}</strong> swiped on you${contextData ? ` for <strong>${contextData.title || contextData.name}</strong>` : ''}!
                      </p>
                      <p style="color: #666; margin-bottom: 30px;">
                        Don't keep them waiting - respond now to start the conversation.
                      </p>
                      <div style="text-align: center;">
                        <a href="${window.location.origin}" 
                           style="display: inline-block; background: linear-gradient(135deg, #FF005C 0%, #FF7B00 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                          Open SwipeHire
                        </a>
                      </div>
                    </div>
                  </div>
                `
              });
            }

            // Show engagement modal
            setPendingSwipe({
              swiper: swiperData,
              target: { id: user.id, full_name: user.full_name },
              context: contextData,
              swipeData: latestSwipe
            });
            setShowEngagement(true);
          }
        }
      } catch (error) {
        console.error('[SwipeNotificationHandler] Error:', error);
      }
    };

    // Initial check
    checkForNewSwipes();

    // Poll every 30 seconds
    interval = setInterval(checkForNewSwipes, 30000);

    return () => {
      mounted = false;
      if (interval) clearInterval(interval);
    };
  }, [user, userType, processedSwipes]);

  return (
    <PostSwipeEngagement
      open={showEngagement}
      onOpenChange={setShowEngagement}
      swiper={pendingSwipe?.swiper}
      target={pendingSwipe?.target}
      context={pendingSwipe?.context}
      userType={userType}
    />
  );
}