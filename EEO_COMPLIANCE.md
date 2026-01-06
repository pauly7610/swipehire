# EEO Compliance Documentation

SwipeHire now includes Equal Employment Opportunity (EEO) data collection as part of the candidate onboarding process.

## What Was Added

### New Onboarding Step (Step 8 of 9)

A dedicated EEO questionnaire appears after resume upload and before profile review. This step includes:

1. **Gender Identity**
   - Male
   - Female
   - Non-binary
   - Prefer not to answer

2. **Race/Ethnicity** (EEOC compliant categories)
   - Hispanic or Latino
   - White (Not Hispanic or Latino)
   - Black or African American (Not Hispanic or Latino)
   - Native American or Alaska Native
   - Asian
   - Native Hawaiian or Other Pacific Islander
   - Two or More Races
   - Prefer not to answer

3. **Veteran Status**
   - I am a protected veteran
   - I am not a protected veteran
   - Prefer not to answer

4. **Disability Status**
   - Yes, I have a disability (or previously had a disability)
   - No, I don't have a disability
   - Prefer not to answer

## Compliance Features

### ✅ Legal Requirements Met

- **Optional Questions**: All EEO questions are completely optional
- **Clear Disclaimers**: Explains why data is collected and how it's used
- **Privacy Notice**: States data won't affect employment decisions
- **EEOC Categories**: Uses standard government-required categories
- **Confidentiality**: Emphasizes data is kept separate from application

### ✅ Data Storage

EEO data is stored in the Candidate entity with prefixed fields:
```javascript
{
  eeo_gender: string | null,
  eeo_race: string | null,
  eeo_veteran_status: string | null,
  eeo_disability_status: string | null
}
```

The `eeo_` prefix helps:
- Clearly identify compliance data
- Separate it from profile data
- Make it easy to exclude from job matching algorithms
- Comply with regulations requiring data separation

## UI/UX Design

### User-Friendly Features

1. **Clear Explanation**: Blue info alert at top explains purpose
2. **Radio Buttons**: Easy single-selection for each question
3. **Visual Feedback**: Selected answers highlighted with pink gradient
4. **Skip Option**: "Prefer not to answer" for every question
5. **Privacy Reassurance**: Footer emphasizes confidentiality

### Accessibility

- Proper ARIA labels on all inputs
- Keyboard navigation supported
- High contrast colors for readability
- Clear, simple language (no legal jargon)

## For Employers/Recruiters

### Reporting

EEO data can be used for:
- OFCCP compliance reports
- Diversity metrics
- Equal opportunity analysis
- Government filing requirements (EEO-1)

### Best Practices

**DO:**
- ✅ Use data for aggregate reporting only
- ✅ Keep EEO data separate from candidate reviews
- ✅ Generate diversity reports for internal use
- ✅ File required government reports

**DON'T:**
- ❌ Use EEO data in hiring decisions
- ❌ Share individual EEO responses
- ❌ Display EEO data to recruiters during review
- ❌ Filter or sort candidates by EEO fields

## Database Schema

When setting up your Base44 Candidate entity, add these optional fields:

```javascript
// Candidate Entity Schema
{
  // ... existing fields ...

  // EEO fields (optional)
  eeo_gender: {
    type: 'string',
    required: false,
    description: 'Self-reported gender identity for EEO compliance'
  },
  eeo_race: {
    type: 'string',
    required: false,
    description: 'Self-reported race/ethnicity for EEO compliance'
  },
  eeo_veteran_status: {
    type: 'string',
    required: false,
    description: 'Self-reported veteran status for EEO compliance'
  },
  eeo_disability_status: {
    type: 'string',
    required: false,
    description: 'Self-reported disability status for EEO compliance'
  }
}
```

## Legal Compliance Notes

### US Federal Requirements

SwipeHire's EEO implementation follows:
- **Title VII** of the Civil Rights Act of 1964
- **OFCCP** (Office of Federal Contract Compliance Programs) guidelines
- **ADA** (Americans with Disabilities Act) requirements
- **VEVRAA** (Vietnam Era Veterans' Readjustment Assistance Act)

### International Considerations

**Important**: EEO requirements vary by country.

- **US**: Required for federal contractors, optional but recommended for others
- **EU/UK**: GDPR requires explicit consent and "lawful basis" for processing
- **Canada**: Similar employment equity reporting
- **Australia**: Workplace diversity reporting

If operating internationally, consult with legal counsel to ensure compliance with local regulations.

## Implementation Details

### Files Modified

1. **`src/components/onboarding/EEOQuestionnaire.jsx`** (NEW)
   - Standalone component for EEO questions
   - Includes all disclaimers and privacy notices
   - Fully accessible and responsive

2. **`src/pages/OnboardingWizard.jsx`**
   - Added Step 8 (EEO) before Review
   - Updated candidate data state with EEO fields
   - Passes EEO data to backend on profile creation

3. **Candidate Data Structure**
   - Added 4 new optional fields
   - All default to empty string
   - Saved as `null` if not provided

### Analytics Tracking

The onboarding completion event now includes:
```javascript
analytics.track('Onboarding Completed', {
  hasPhoto: boolean,
  experienceCount: number,
  skillsCount: number,
  hasResume: boolean,
  // EEO completion is intentionally NOT tracked
  // to maintain candidate privacy
});
```

## Testing

To test the EEO flow:

1. Start onboarding
2. Complete steps 1-7
3. Reach EEO step (step 8)
4. Try answering questions (optional)
5. Try skipping with "Prefer not to answer"
6. Verify profile creates successfully
7. Check Base44 that EEO fields are populated/null correctly

## Future Enhancements

Potential additions (not yet implemented):

- [ ] EEO reporting dashboard for admins
- [ ] Export EEO-1 report format
- [ ] Bulk EEO data anonymization
- [ ] EEO data retention policies
- [ ] Multi-language EEO questions
- [ ] Additional protected class questions (as required by specific industries)

## Support & Questions

For questions about:
- **Legal compliance**: Consult with employment law attorney
- **EEOC requirements**: Visit [https://www.eeoc.gov](https://www.eeoc.gov)
- **OFCCP requirements**: Visit [https://www.dol.gov/ofccp](https://www.dol.gov/ofccp)
- **Technical implementation**: Check this documentation or create an issue

---

**Last Updated**: January 2026
**Compliance Standard**: US EEOC Guidelines
