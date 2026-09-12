import { describe, expect, it } from 'vitest';
import { DEFAULT_CLIENT_POLICY } from '../../src/domain/client-policy';
import { getNextQualificationQuestion, getQualificationProgress } from '../../src/domain/qualification-question-engine';

describe('qualification question engine', () => {
  it('asks a required question before optional enrichment', () => {
    const question = getNextQualificationQuestion({ serviceFit: true }, DEFAULT_CLIENT_POLICY);
    expect(question?.field).toBe('needConfirmed');
  });

  it('prioritizes tenant-required budget over optional questions', () => {
    const policy = { ...DEFAULT_CLIENT_POLICY, minimumBudget: 100000 };
    const question = getNextQualificationQuestion({ serviceFit: true, needConfirmed: true }, policy);
    expect(question?.field).toBe('budget');
    expect(question?.required).toBe(true);
  });

  it('reports missing required fields and progress', () => {
    const policy = { ...DEFAULT_CLIENT_POLICY, requireDecisionMaker: true, requireLocationFit: true };
    const progress = getQualificationProgress({ serviceFit: true, needConfirmed: true }, policy);
    expect(progress.complete).toBe(false);
    expect(progress.missingRequired).toEqual(['decisionMaker', 'locationFit']);
    expect(progress.nextQuestion?.field).toBe('decisionMaker');
    expect(progress.progressPercent).toBeGreaterThan(0);
  });

  it('becomes complete when all tenant-required fields are answered', () => {
    const policy = { ...DEFAULT_CLIENT_POLICY, minimumBudget: 100000, requireDecisionMaker: true };
    const progress = getQualificationProgress({ serviceFit: true, needConfirmed: true, budget: 150000, decisionMaker: true }, policy);
    expect(progress.complete).toBe(true);
    expect(progress.missingRequired).toEqual([]);
  });
});
