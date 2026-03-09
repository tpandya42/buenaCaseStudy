import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import pdfParse from 'pdf-parse';
import { ExtractionResult } from './ai-extraction.types.js';

@Injectable()
export class AiExtractionService {
  private genAI: GoogleGenerativeAI | null = null;
  private readonly logger = new Logger(AiExtractionService.name);

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
      this.logger.warn(
        'GEMINI_API_KEY is not set — AI extraction will be unavailable',
      );
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async extractFromPdf(buffer: Buffer): Promise<ExtractionResult> {
    if (!this.genAI) {
      throw new BadRequestException(
        'AI extraction is unavailable — GEMINI_API_KEY is not configured',
      );
    }

    const pdfData = await (pdfParse as any)(buffer);
    let text: string = pdfData.text;

    // Truncate to ~32k chars, keeping relevant paragraphs for German property docs
    if (text.length > 32000) {
      const paragraphs = text.split('\n\n');
      const relevant = paragraphs.filter((p: string) =>
        /Teilung|Wohnung|Gebäude|Miteigentum/i.test(p),
      );
      text = relevant.join('\n\n').substring(0, 32000);
    }

    if (!text || text.trim().length === 0) {
      throw new BadRequestException('Could not extract text from PDF');
    }

    const prompt = `You are a German real-estate document parser. Extract structured data from this Teilungserklärung text (${text.length} chars).

TEXT:
${text}

RETURN ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "confidence": 95,
  "buildings": [{"label": "Haus A", "street": "Musterstr.", "houseNumber": "12"}],
  "units": [{"number": "1", "type": "APARTMENT", "buildingLabel": "Haus A", "floor": "EG", "sizeSqm": 80, "coOwnershipShare": 12.5}]
}

Rules:
- "type" must be one of: APARTMENT, OFFICE, GARDEN, PARKING
- "coOwnershipShare" is in per-mille (‰) — all units should sum to ~1000
- Extract ALL buildings and units found in the document`;

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
      },
    });

    const result = await model.generateContent(prompt);
    const raw = result.response.text();

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new BadRequestException('AI did not return valid JSON');
    }

    const parsed = JSON.parse(jsonMatch[0]) as ExtractionResult;

    // Validate co-ownership share sum (~1000‰ with ±50 tolerance)
    const totalShare = (parsed.units ?? []).reduce(
      (sum, u) => sum + (u.coOwnershipShare ?? 0),
      0,
    );

    const shareValid = Math.abs(totalShare - 1000) <= 50;

    return {
      confidence: shareValid ? 95 : 70,
      buildings: parsed.buildings ?? [],
      units: parsed.units ?? [],
      warning: shareValid
        ? undefined
        : `Co-ownership share sum: ${totalShare.toFixed(1)}‰ (expected ~1000‰)`,
    };
  }
}
