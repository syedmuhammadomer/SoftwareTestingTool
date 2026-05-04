import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { ConnectionOptions, Job, Queue, Worker } from 'bullmq';
import OpenAI from 'openai';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import { existsSync, mkdirSync } from 'fs';
import { promises as fs } from 'fs';
import path from 'path';
import { Repository } from 'typeorm';
import { Feature } from './entities/feature.entity';
import { Project, ProjectStatus } from './entities/project.entity';
import { RtmEntry } from './entities/rtm.entity';
import { TestCase } from './entities/test-case.entity';
import { UserStory, UserStoryPriority, UserStoryStatus } from './entities/user-story.entity';
import { CreateUserStoryDto } from './dto/create-user-story.dto';
import { UpdateUserStoryDto } from './dto/update-user-story.dto';

type ProjectJobPayload = {
  projectId: number;
};

type StructuredFeature = {
  title: string;
  description: string;
};

type StructuredUserStory = {
  title: string;
  actor: string;
  goal: string;
  description: string;
  benefit: string;
  acceptanceCriteria: string[];
  priority?: string;
};

type StructuredTestCase = {
  testCaseId: string;
  title: string;
  preconditions: string;
  steps: string[];
  expectedResult: string;
};

type StructuredRtmEntry = {
  requirementId: string;
  description: string;
  linkedUserStories: string[];
  linkedTestCases: string[];
};

type StructuredProjectAnalysis = {
  summary: string;
  generationMode?: 'ai' | 'fallback';
  generationNote?: string;
  features: StructuredFeature[];
  userStories: StructuredUserStory[];
  testCases: StructuredTestCase[];
  rtm: StructuredRtmEntry[];
};

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'srs');

@Injectable()
export class ProjectsService implements OnModuleDestroy {
  private readonly logger = new Logger(ProjectsService.name);
  private readonly queue: Queue<ProjectJobPayload> | null = null;
  private readonly worker: Worker<ProjectJobPayload> | null = null;
  private readonly redisEnabled: boolean;
  private openAi: OpenAI | null = null;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(UserStory)
    private readonly userStoryRepository: Repository<UserStory>,
  ) {
    if (!existsSync(UPLOAD_DIR)) {
      mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    this.redisEnabled = this.isRedisEnabled();
    if (this.redisEnabled) {
      const connection = this.redisConnectionOptions();
      this.queue = new Queue('project-processing', { connection });
      this.worker = new Worker('project-processing', (job) => this.handleJob(job), { connection });
      this.worker.on('failed', (job, err) => {
        this.logger.error(`Job ${job.id} failed`, err?.stack || undefined);
      });
      this.worker.on('error', (err) => {
        this.logger.error(`Redis worker error: ${err.message}`, err.stack);
      });
    } else {
      this.logger.log('Redis queue disabled; project processing will run inline.');
    }
  }

  async createProject(projectName: string, srsPath: string) {
    const project = this.projectRepository.create({
      name: projectName,
      srsPath,
      status: ProjectStatus.Queued,
      progress: 0,
    });
    await this.projectRepository.save(project);
    void this.enqueueProjectProcessing(project.id);
    return project;
  }

  private async enqueueProjectProcessing(projectId: number) {
    if (!this.queue) {
      this.logger.log(`Processing project ${projectId} inline because Redis queue is disabled`);
      void this.processProject(projectId, async (value) => {
        await this.updateProjectProgress(projectId, value);
      }).catch(async (error) => {
        const message = error instanceof Error ? error.message : 'Unknown processing error';
        await this.projectRepository.update(projectId, {
          status: ProjectStatus.Failed,
          failureReason: message,
          progress: 100,
        });
        this.logger.error(`Project ${projectId} failed: ${message}`);
      });
      return;
    }

    try {
      await this.queue.add(
        'process-srs',
        { projectId },
        { removeOnComplete: true, removeOnFail: true },
      );
      this.logger.log(`Project ${projectId} queued for processing`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown queue error';
      await this.projectRepository.update(projectId, {
        status: ProjectStatus.Failed,
        failureReason: `Unable to queue project: ${message}`,
        progress: 100,
      });
      this.logger.error(`Project ${projectId} could not be queued: ${message}`);
    }
  }

  async listProjects() {
    return this.projectRepository.find({
      select: {
        id: true,
        name: true,
        status: true,
        progress: true,
        failureReason: true,
        aiResponse: true,
        createdAt: true,
        updatedAt: true,
      },
      relations: {
        features: true,
        userStories: true,
        testCases: true,
        rtm: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async getProject(projectId: number) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        status: true,
        progress: true,
        failureReason: true,
        aiResponse: true,
        createdAt: true,
        updatedAt: true,
      },
      relations: {
        features: true,
        userStories: true,
        testCases: true,
        rtm: true,
      },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  async deleteProject(projectId: number) {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    await this.projectRepository.remove(project);
  }

  async listUserStories(projectId: number) {
    await this.ensureProject(projectId);
    return this.userStoryRepository.find({
      where: { project: { id: projectId } },
      relations: { project: true },
      order: { id: 'DESC' },
    });
  }

  async getUserStory(projectId: number, userStoryId: number) {
    const story = await this.userStoryRepository.findOne({
      where: { id: userStoryId, project: { id: projectId } },
      relations: { project: true },
    });
    if (!story) {
      throw new NotFoundException('User story not found');
    }
    return story;
  }

  async createUserStory(projectId: number, dto: CreateUserStoryDto) {
    const project = await this.ensureProject(projectId);
    const story = this.userStoryRepository.create({
      title: dto.title.trim(),
      actor: dto.userRole.trim(),
      goal: dto.title.trim(),
      description: dto.description.trim(),
      benefit: dto.description.trim(),
      acceptanceCriteria: dto.acceptanceCriteria?.trim() || '',
      priority: dto.priority ?? UserStoryPriority.Medium,
      status: dto.status ?? UserStoryStatus.Backlog,
      dueDate: dto.dueDate,
      assigneeId: dto.assigneeId?.trim() || undefined,
      assigneeName: dto.assigneeName?.trim() || undefined,
      attachmentNames: dto.attachmentNames?.filter(Boolean) ?? [],
      project,
    });
    const savedStory = await this.userStoryRepository.save(story);
    await this.refreshProjectUpdatedAt(projectId);
    return this.getUserStory(projectId, savedStory.id);
  }

  async updateUserStory(projectId: number, userStoryId: number, dto: UpdateUserStoryDto) {
    const story = await this.getUserStory(projectId, userStoryId);

    if (dto.title !== undefined) {
      story.title = dto.title.trim();
      story.goal = dto.title.trim() || story.goal;
    }
    if (dto.userRole !== undefined) {
      story.actor = dto.userRole.trim();
    }
    if (dto.description !== undefined) {
      story.description = dto.description.trim();
      story.benefit = dto.description.trim();
    }
    if (dto.priority !== undefined) {
      story.priority = dto.priority;
    }
    if (dto.status !== undefined) {
      story.status = dto.status;
    }
    if (dto.dueDate !== undefined) {
      story.dueDate = dto.dueDate;
    }
    if (dto.assigneeId !== undefined) {
      story.assigneeId = dto.assigneeId.trim() || undefined;
    }
    if (dto.assigneeName !== undefined) {
      story.assigneeName = dto.assigneeName.trim() || undefined;
    }
    if (dto.attachmentNames !== undefined) {
      story.attachmentNames = dto.attachmentNames.filter(Boolean);
    }
    if (dto.acceptanceCriteria !== undefined) {
      story.acceptanceCriteria = dto.acceptanceCriteria.trim();
    }

    await this.userStoryRepository.save(story);
    await this.refreshProjectUpdatedAt(projectId);
    return this.getUserStory(projectId, userStoryId);
  }

  async deleteUserStory(projectId: number, userStoryId: number) {
    const story = await this.getUserStory(projectId, userStoryId);
    await this.userStoryRepository.remove(story);
    await this.refreshProjectUpdatedAt(projectId);
  }

  async handleJob(job: Job<ProjectJobPayload>) {
    await this.processProject(job.data.projectId, async (value: number) => {
      await job.updateProgress(value);
      await this.updateProjectProgress(job.data.projectId, value);
    });
  }

  private async processProject(projectId: number, reportProgress: (value: number) => Promise<void>) {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });

    if (!project) {
      throw new NotFoundException(`No project found for id ${projectId}`);
    }

    await this.updateProjectStatus(projectId, ProjectStatus.Processing);
    await reportProgress(10);

    try {
      const rawText = await this.extractTextFromFile(project.srsPath);
      await reportProgress(30);
      const cleanedText = this.cleanText(rawText);
      await reportProgress(45);
      const structured = await this.generateStructuredAnalysis(cleanedText, project.name);
      await reportProgress(65);
      await this.persistStructuredOutput(project, cleanedText, structured);
      await reportProgress(100);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown processing error';
      await this.projectRepository.update(projectId, {
        status: ProjectStatus.Failed,
        failureReason: message,
        progress: 100,
      });
      this.logger.error(`Project ${projectId} failed: ${message}`);
      throw error;
    }
  }

  private async persistStructuredOutput(
    project: Project,
    cleanedText: string,
    structured: StructuredProjectAnalysis,
  ) {
    const features = this.mapFeatures(structured.features, project);
    const userStories = this.mapUserStories(structured.userStories, project);
    const testCases = this.mapTestCases(structured.testCases, project);
    const rtm = this.mapRtm(structured.rtm, project);

    project.extractedText = this.truncateText(cleanedText, 20000);
    project.aiResponse = {
      summary: structured.summary,
      generationMode: structured.generationMode ?? 'ai',
      generationNote: structured.generationNote ?? null,
      featureCount: features.length,
      userStoryCount: userStories.length,
      testCaseCount: testCases.length,
      rtmCount: rtm.length,
    };
    project.progress = 100;
    project.features = features;
    project.userStories = userStories;
    project.testCases = testCases;
    project.rtm = rtm;
    project.failureReason = undefined;
    project.status = ProjectStatus.Completed;
    await this.projectRepository.save(project);
    this.logger.log(`Project ${project.id} completed with ${project.features.length} features`);
  }

  private async generateStructuredAnalysis(text: string, projectName: string) {
    try {
      const structured = await this.callOpenAi(text, projectName);
      return {
        ...structured,
        generationMode: 'ai' as const,
      };
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'OpenAI unavailable';
      this.logger.warn(`Falling back to local SRS analysis for "${projectName}": ${reason}`);
      return this.buildFallbackAnalysis(text, projectName, reason);
    }
  }

  private mapFeatures(rawFeatures: StructuredFeature[], project: Project): Feature[] {
    return rawFeatures.map((raw) => {
      const feature = new Feature();
      feature.title = this.toTrimmedString(raw.title, 'Unnamed feature');
      feature.description = this.toTrimmedString(raw.description);
      feature.project = project;
      return feature;
    });
  }

  private getOpenAiClient() {
    if (this.openAi) {
      return this.openAi;
    }

    const key = this.configService.get<string>('OPENAI_API_KEY');
    if (!key) {
      throw new Error('OPENAI_API_KEY must be configured to process SRS documents');
    }

    this.openAi = new OpenAI({ apiKey: key });
    return this.openAi;
  }

  private mapUserStories(rawStories: StructuredUserStory[], project: Project): UserStory[] {
    return rawStories.map((raw) => {
      const story = new UserStory();
      story.title = this.toTrimmedString(raw.title, 'Untitled user story');
      story.actor = this.toTrimmedString(raw.actor, 'User');
      story.goal = this.toTrimmedString(raw.goal, story.title || 'Undefined goal');
      story.description = this.toTrimmedString(raw.description, story.goal);
      story.benefit = this.toTrimmedString(raw.benefit, story.description);
      story.acceptanceCriteria = this.stringifyAcceptance(raw.acceptanceCriteria);
      story.priority = this.normalizeUserStoryPriority(raw.priority);
      story.status = UserStoryStatus.Backlog;
      story.project = project;
      return story;
    });
  }

  private mapTestCases(rawCases: StructuredTestCase[], project: Project): TestCase[] {
    return rawCases.map((raw, index) => {
      const testCase = new TestCase();
      testCase.testCaseId = this.toTrimmedString(raw.testCaseId, `TC-${index + 1}`);
      testCase.title = this.toTrimmedString(raw.title, 'Untitled test case');
      testCase.preconditions = this.toTrimmedString(raw.preconditions);
      testCase.steps = this.stringifySteps(raw.steps);
      testCase.expectedResult = this.toTrimmedString(raw.expectedResult);
      testCase.project = project;
      return testCase;
    });
  }

  private mapRtm(rawRtm: StructuredRtmEntry[], project: Project): RtmEntry[] {
    return rawRtm.map((raw, index) => {
      const entry = new RtmEntry();
      entry.requirementId = this.toTrimmedString(raw.requirementId, `REQ-${index + 1}`);
      entry.description = this.toTrimmedString(raw.description, 'No description provided');
      entry.linkedUserStories = this.toStringArray(raw.linkedUserStories);
      entry.linkedTestCases = this.toStringArray(raw.linkedTestCases);
      entry.project = project;
      return entry;
    });
  }

  private toStringArray(value: any): string[] {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.map((v) => String(v));
    }
    return [String(value)];
  }

  private stringifySteps(value: any): string {
    if (!value) return '';
    if (Array.isArray(value)) {
      return value.map((step, index) => `${index + 1}. ${step}`).join('\n');
    }
    return String(value);
  }

  private stringifyAcceptance(value: any): string {
    if (!value) return '';
    if (Array.isArray(value)) {
      return value.join('\n');
    }
    if (typeof value === 'object') {
      return Object.values(value).join('\n');
    }
    return String(value);
  }

  private normalizeUserStoryPriority(value?: string): UserStoryPriority {
    const normalized = this.toTrimmedString(value).toLowerCase();
    if (normalized === 'high') {
      return UserStoryPriority.High;
    }
    if (normalized === 'low') {
      return UserStoryPriority.Low;
    }
    return UserStoryPriority.Medium;
  }

  private toTrimmedString(value: unknown, fallback = ''): string {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    return fallback;
  }

  private truncateText(value: string, maxLength: number) {
    if (value.length <= maxLength) {
      return value;
    }

    return `${value.slice(0, maxLength)}\n\n[Truncated for storage]`;
  }

  private async ensureProject(projectId: number) {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  private async refreshProjectUpdatedAt(projectId: number) {
    await this.projectRepository
      .createQueryBuilder()
      .update(Project)
      .set({ updatedAt: () => 'CURRENT_TIMESTAMP' } as never)
      .where('id = :id', { id: projectId })
      .execute();
  }

  private cleanText(text: string) {
    return text
      .replace(/\r/g, '')
      .replace(/\t/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ ]{2,}/g, ' ')
      .trim();
  }

  private async extractTextFromFile(filePath: string) {
    const extension = path.extname(filePath).toLowerCase();
    if (extension === '.pdf') {
      const buffer = await fs.readFile(filePath);
      const parsed = await pdfParse(buffer);
      return parsed.text;
    }

    if (extension === '.docx') {
      const content = await mammoth.extractRawText({ path: filePath });
      return content.value;
    }

    if (extension === '.doc') {
      throw new BadRequestException(
        'Legacy .doc files are not supported. Please save the document as .docx or export it as PDF and upload again.',
      );
    }

    throw new BadRequestException('Unsupported document type. Please upload a PDF or DOCX file.');
  }

  private async callOpenAi(text: string, projectName: string): Promise<StructuredProjectAnalysis> {
    const prompt = this.buildAnalysisPrompt(text, projectName);
    try {
      const response = await this.getOpenAiClient().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an experienced business analyst and QA lead. Read SRS documents carefully and return only valid JSON with concise, implementation-ready output.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
      });
      const raw = response.choices?.[0]?.message?.content;
      if (!raw) {
        throw new Error('LLM did not return content');
      }
      return this.normalizeStructuredAnalysis(JSON.parse(this.extractJson(raw)));
    } catch (error) {
      const message = this.getOpenAiErrorMessage(error);
      this.logger.error(`OpenAI request failed: ${message}`, error instanceof Error ? error.stack : undefined);
      throw new Error(message);
    }
  }

  private getOpenAiErrorMessage(error: unknown) {
    if (typeof error === 'object' && error !== null) {
      const openAiError = error as {
        status?: number;
        code?: string;
        type?: string;
        message?: string;
        error?: { message?: string; code?: string; type?: string };
      };

      const nestedMessage = openAiError.error?.message?.trim();
      const topLevelMessage = openAiError.message?.trim();
      const errorCode = openAiError.error?.code || openAiError.code;
      const errorType = openAiError.error?.type || openAiError.type;

      if (errorCode === 'insufficient_quota' || errorType === 'insufficient_quota') {
        return 'OpenAI quota exceeded for the configured API key. Please check billing, usage limits, or replace the key and try again.';
      }

      if (openAiError.status === 401) {
        return 'OpenAI rejected the configured API key. Please verify OPENAI_API_KEY and try again.';
      }

      if (openAiError.status === 429) {
        return nestedMessage || topLevelMessage || 'OpenAI rate limit or quota limit reached. Please try again later.';
      }

      if (nestedMessage) {
        return nestedMessage;
      }

      if (topLevelMessage) {
        return topLevelMessage;
      }
    }

    return 'AI processing failed while calling OpenAI.';
  }

  private buildFallbackAnalysis(
    text: string,
    projectName: string,
    reason: string,
  ): StructuredProjectAnalysis {
    const candidateRequirements = this.extractRequirementCandidates(text);
    const selectedRequirements =
      candidateRequirements.length > 0
        ? candidateRequirements.slice(0, 10)
        : this.splitIntoSentences(text).slice(0, 6);

    const features = this.buildFallbackFeatures(selectedRequirements, projectName);
    const userStories = selectedRequirements.map((requirement, index) =>
      this.buildFallbackUserStory(requirement, index + 1),
    );
    const testCases = userStories.map((story, index) =>
      this.buildFallbackTestCase(story, index + 1),
    );
    const rtm = userStories.map((story, index) => ({
      requirementId: `REQ-${index + 1}`,
      description: selectedRequirements[index] || story.description,
      linkedUserStories: [story.title],
      linkedTestCases: [`TC-${index + 1}`],
    }));

    return {
      summary: `Generated with local fallback because AI processing was unavailable. Project "${projectName}" was analyzed from extracted SRS text.`,
      generationMode: 'fallback',
      generationNote: reason,
      features,
      userStories,
      testCases,
      rtm,
    };
  }

  private extractRequirementCandidates(text: string) {
    const lines = text
      .split(/\n+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 30);

    const requirementLines = lines.filter((line) =>
      /\b(shall|must|should|will|can|allow|support|require|able to|only authorized|system)\b/i.test(line),
    );

    const source = requirementLines.length > 0 ? requirementLines : this.splitIntoSentences(text);
    const unique = new Set<string>();

    return source
      .map((item) => item.replace(/^[\d.\-•)\s]+/, '').trim())
      .filter((item) => item.length > 25)
      .filter((item) => {
        const normalized = item.toLowerCase();
        if (unique.has(normalized)) {
          return false;
        }
        unique.add(normalized);
        return true;
      });
  }

  private splitIntoSentences(text: string) {
    return text
      .split(/(?<=[.!?])\s+|\n+/)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length > 25);
  }

  private buildFallbackFeatures(requirements: string[], projectName: string): StructuredFeature[] {
    const themeDefinitions = [
      { title: 'Authentication & Access', keywords: ['login', 'password', 'authentication', 'authorize', 'role', 'access'] },
      { title: 'User Management', keywords: ['user', 'account', 'profile', 'registration', 'admin'] },
      { title: 'Inventory & Records', keywords: ['inventory', 'stock', 'item', 'record', 'product'] },
      { title: 'Reporting & Analytics', keywords: ['report', 'dashboard', 'analytics', 'metric'] },
      { title: 'Notifications & Communication', keywords: ['notification', 'email', 'message', 'alert'] },
      { title: 'Workflow & Transactions', keywords: ['order', 'payment', 'transaction', 'approval', 'workflow'] },
      { title: 'Search & Retrieval', keywords: ['search', 'filter', 'find', 'sort'] },
    ];

    const matched = themeDefinitions
      .map((theme) => {
        const related = requirements.filter((requirement) =>
          theme.keywords.some((keyword) => requirement.toLowerCase().includes(keyword)),
        );

        if (related.length === 0) {
          return null;
        }

        return {
          title: theme.title,
          description: related.slice(0, 2).join(' '),
        };
      })
      .filter(Boolean) as StructuredFeature[];

    if (matched.length > 0) {
      return matched.slice(0, 6);
    }

    return requirements.slice(0, 4).map((requirement, index) => ({
      title: this.createFeatureTitle(requirement, index + 1, projectName),
      description: requirement,
    }));
  }

  private createFeatureTitle(requirement: string, index: number, projectName: string) {
    const cleaned = requirement.replace(/\b(the system|system|users?|shall|must|should|will)\b/gi, '').trim();
    const words = cleaned.split(/\s+/).slice(0, 4);
    if (words.length > 0) {
      return this.toTitleCase(words.join(' '));
    }
    return `${projectName} Feature ${index}`;
  }

  private buildFallbackUserStory(requirement: string, index: number): StructuredUserStory {
    const actor = this.detectActor(requirement);
    const normalizedGoal = this.normalizeRequirementToGoal(requirement);
    const title = `As ${actor === 'User' ? 'a user' : `a ${actor.toLowerCase()}`}, I want to ${normalizedGoal}`;
    const acceptanceCriteria = [
      `The system supports the requirement: ${requirement}`,
      `Authorized ${actor.toLowerCase()}s can complete the flow successfully`,
      'The system returns a clear success or validation response',
    ];

    return {
      title,
      actor,
      goal: normalizedGoal,
      description: requirement,
      benefit: `This helps ${actor.toLowerCase()}s complete the required business process.`,
      acceptanceCriteria,
      priority: this.detectPriority(requirement),
    };
  }

  private buildFallbackTestCase(story: StructuredUserStory, index: number): StructuredTestCase {
    return {
      testCaseId: `TC-${index}`,
      title: `Validate ${story.goal}`,
      preconditions: `${story.actor} is authenticated and has the required permissions.`,
      steps: [
        `Open the workflow for: ${story.goal}`,
        `Enter valid data needed to complete the action`,
        'Submit the request',
        'Review the system response and saved result',
      ],
      expectedResult: `The system completes the action successfully and satisfies the requirement: ${story.description}`,
    };
  }

  private detectActor(requirement: string) {
    const actorPatterns = [
      { regex: /\badmin(istrator)?\b/i, actor: 'Administrator' },
      { regex: /\bmanager\b/i, actor: 'Manager' },
      { regex: /\bcustomer\b/i, actor: 'Customer' },
      { regex: /\bemployee\b/i, actor: 'Employee' },
      { regex: /\bqa\b|\btester\b/i, actor: 'QA User' },
      { regex: /\bdeveloper\b/i, actor: 'Developer' },
      { regex: /\buser\b/i, actor: 'User' },
    ];

    const match = actorPatterns.find((pattern) => pattern.regex.test(requirement));
    return match?.actor || 'User';
  }

  private normalizeRequirementToGoal(requirement: string) {
    const normalized = requirement
      .replace(/\b(the system|system)\b/gi, '')
      .replace(/\bshall\b/gi, 'can')
      .replace(/\bmust\b/gi, 'can')
      .replace(/\bshould\b/gi, 'can')
      .replace(/\bwill\b/gi, 'can')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/[.]+$/, '');

    return normalized ? normalized.charAt(0).toLowerCase() + normalized.slice(1) : 'complete the required action';
  }

  private detectPriority(requirement: string): string {
    if (/\b(must|critical|security|mandatory|required)\b/i.test(requirement)) {
      return 'High';
    }
    if (/\b(optional|nice to have|may)\b/i.test(requirement)) {
      return 'Low';
    }
    return 'Medium';
  }

  private toTitleCase(value: string) {
    return value
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private buildAnalysisPrompt(text: string, projectName: string) {
    const truncatedText = text.length > 18000 ? `${text.slice(0, 18000)}\n\n[Truncated for analysis]` : text;

    return [
      `Analyze the SRS for the project "${projectName}".`,
      'Identify the most important requirements and convert them into implementation-ready artifacts.',
      'Return strict JSON only with this exact shape:',
      '{',
      '  "summary": "short project summary",',
      '  "features": [{ "title": "string", "description": "string" }],',
      '  "userStories": [{',
      '    "title": "string",',
      '    "actor": "string",',
      '    "goal": "string",',
      '    "description": "string",',
      '    "benefit": "string",',
      '    "acceptanceCriteria": ["string"],',
      '    "priority": "High|Medium|Low"',
      '  }],',
      '  "testCases": [{',
      '    "testCaseId": "TC-1",',
      '    "title": "string",',
      '    "preconditions": "string",',
      '    "steps": ["string"],',
      '    "expectedResult": "string"',
      '  }],',
      '  "rtm": [{',
      '    "requirementId": "REQ-1",',
      '    "description": "string",',
      '    "linkedUserStories": ["story title"],',
      '    "linkedTestCases": ["TC-1"]',
      '  }]',
      '}',
      'Rules:',
      '- Create 3 to 12 features when possible.',
      '- Create 5 to 20 user stories when the SRS supports them.',
      '- Create focused, realistic manual test cases tied to the described requirements.',
      '- Use short, business-readable wording.',
      '- Do not include markdown fences or commentary.',
      '',
      'SRS DOCUMENT:',
      truncatedText,
    ].join('\n');
  }

  private normalizeStructuredAnalysis(raw: Record<string, any>): StructuredProjectAnalysis {
    return {
      summary: this.toTrimmedString(raw.summary),
      features: this.normalizeFeatures(raw.features),
      userStories: this.normalizeUserStories(raw.userStories),
      testCases: this.normalizeTestCases(raw.testCases),
      rtm: this.normalizeRtm(raw.rtm),
    };
  }

  private normalizeFeatures(value: unknown): StructuredFeature[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) => ({
        title: this.toTrimmedString(item?.title ?? item?.name),
        description: this.toTrimmedString(item?.description ?? item?.details),
      }))
      .filter((item) => item.title);
  }

  private normalizeUserStories(value: unknown): StructuredUserStory[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) => {
        const title = this.toTrimmedString(item?.title ?? item?.goal ?? item?.objective);
        const actor = this.toTrimmedString(item?.actor ?? item?.user, 'User');
        const goal = this.toTrimmedString(item?.goal ?? item?.objective, title);
        const description = this.toTrimmedString(item?.description ?? item?.summary, goal);
        const benefit = this.toTrimmedString(item?.benefit ?? item?.reason, description);

        return {
          title: title || goal || 'Untitled user story',
          actor,
          goal: goal || title || 'Undefined goal',
          description,
          benefit,
          acceptanceCriteria: this.toStringArray(item?.acceptanceCriteria ?? item?.criteria),
          priority: this.toTrimmedString(item?.priority, 'Medium'),
        };
      })
      .filter((item) => item.title || item.goal);
  }

  private normalizeTestCases(value: unknown): StructuredTestCase[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item, index) => ({
        testCaseId: this.toTrimmedString(item?.testCaseId ?? item?.id, `TC-${index + 1}`),
        title: this.toTrimmedString(item?.title ?? item?.name, `Test case ${index + 1}`),
        preconditions: this.toTrimmedString(item?.preconditions ?? item?.pre),
        steps: this.toStringArray(item?.steps ?? item?.actions),
        expectedResult: this.toTrimmedString(item?.expectedResult ?? item?.outcome),
      }))
      .filter((item) => item.title);
  }

  private normalizeRtm(value: unknown): StructuredRtmEntry[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item, index) => ({
        requirementId: this.toTrimmedString(item?.requirementId, `REQ-${index + 1}`),
        description: this.toTrimmedString(item?.description ?? item?.details),
        linkedUserStories: this.toStringArray(
          item?.linkedUserStories ?? item?.linkedStories ?? item?.userStories,
        ),
        linkedTestCases: this.toStringArray(item?.linkedTestCases ?? item?.testCases),
      }))
      .filter((item) => item.description);
  }

  private extractJson(raw: string) {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced && fenced[1]) {
      return fenced[1].trim();
    }
    const first = raw.indexOf('{');
    const last = raw.lastIndexOf('}');
    if (first !== -1 && last !== -1) {
      return raw.slice(first, last + 1);
    }
    return raw;
  }

  private async updateProjectStatus(projectId: number, status: ProjectStatus) {
    await this.projectRepository.update(projectId, { status });
  }

  private isRedisEnabled() {
    const redisEnabled = this.configService.get<string>('REDIS_ENABLED');
    if (redisEnabled !== undefined) {
      return redisEnabled.toLowerCase() === 'true';
    }

    return Boolean(this.configService.get<string>('REDIS_URL'));
  }

  private redisConnectionOptions(): ConnectionOptions {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (redisUrl) {
      return { connectionString: redisUrl } as ConnectionOptions;
    }
    return {
      host: this.configService.get<string>('REDIS_HOST') || '127.0.0.1',
      port: Number(this.configService.get<number>('REDIS_PORT') || 6379),
      password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
    };
  }

  private async updateProjectProgress(projectId: number, progress: number) {
    await this.projectRepository.update(projectId, { progress });
  }

  onModuleDestroy() {
    this.worker?.close();
    this.queue?.close();
  }
}
