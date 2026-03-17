import { scoreContent, saveQAHistory, QAPayload } from './content-qa';

export interface PublishGateResult {
  allowed: boolean;
  minScore: number;
  qa: ReturnType<typeof scoreContent>;
}

export async function enforcePublishGate(payload: QAPayload, minScore = 70): Promise<PublishGateResult> {
  const qa = scoreContent(payload);
  await saveQAHistory(payload, qa, 'publish_check');
  return {
    allowed: qa.overall >= minScore,
    minScore,
    qa
  };
}
