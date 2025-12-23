import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import * as pdfParse from 'npm:pdf-parse@1.1.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { resume_url } = await req.json();

    if (!resume_url) {
      return Response.json({ error: 'resume_url required' }, { status: 400 });
    }

    // Fetch the resume file
    const response = await fetch(resume_url);
    if (!response.ok) {
      return Response.json({ error: 'Failed to fetch resume' }, { status: 500 });
    }

    const contentType = response.headers.get('content-type') || '';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    let plainText = '';

    // Extract text based on file type
    if (contentType.includes('pdf') || resume_url.toLowerCase().endsWith('.pdf')) {
      // Parse PDF
      const data = await pdfParse.default(buffer);
      plainText = data.text;
    } else if (contentType.includes('word') || contentType.includes('document') || 
               resume_url.toLowerCase().endsWith('.doc') || resume_url.toLowerCase().endsWith('.docx')) {
      // For Word documents, use LLM to extract
      const fileBlob = new Blob([buffer]);
      const file = new File([fileBlob], 'resume.docx', { type: contentType });
      
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      
      const extractResult = await base44.integrations.Core.InvokeLLM({
        prompt: 'Extract all text content from this resume document. Return the complete text exactly as it appears, preserving section headers like Experience, Education, Skills, etc. Do not summarize or modify the content.',
        file_urls: [uploadResult.file_url]
      });
      
      plainText = extractResult;
    } else {
      return Response.json({ error: 'Unsupported file format. Only PDF and DOCX are supported.' }, { status: 400 });
    }

    if (!plainText || plainText.trim().length < 50) {
      return Response.json({ 
        error: 'Failed to extract meaningful text from resume',
        plainText 
      }, { status: 400 });
    }

    // Normalize text
    let normalizedText = plainText
      .toLowerCase()
      .replace(/[•◦▪▫■□●○◘◙]/g, '') // Remove bullets
      .replace(/[_\-—–]{2,}/g, ' ') // Replace long dashes/underlines
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/\n{3,}/g, '\n\n') // Max 2 newlines
      .trim();

    // Preserve section headers
    const sectionHeaders = [
      'experience', 'work experience', 'professional experience',
      'education', 'academic background',
      'skills', 'technical skills', 'core competencies',
      'certifications', 'licenses',
      'projects', 'portfolio',
      'awards', 'honors',
      'summary', 'objective', 'profile'
    ];

    sectionHeaders.forEach(header => {
      const regex = new RegExp(`\\b${header}\\b`, 'gi');
      normalizedText = normalizedText.replace(regex, `\n${header.toUpperCase()}\n`);
    });

    return Response.json({
      success: true,
      resume_plain_text: plainText,
      resume_normalized_text: normalizedText,
      text_length: plainText.length,
      normalized_length: normalizedText.length
    });

  } catch (error) {
    console.error('Resume extraction error:', error);
    return Response.json({ 
      error: error.message,
      details: error.stack 
    }, { status: 500 });
  }
});