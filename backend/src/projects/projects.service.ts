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
import { UserStory } from './entities/user-story.entity';

type ProjectJobPayload = {
  projectId: number;
};

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'srs');

@Injectable()
export class ProjectsService implements OnModuleDestroy {
  private readonly logger = new Logger(ProjectsService.name);
  private readonly queue: Queue<ProjectJobPayload>;
  private readonly worker: Worker<ProjectJobPayload>;
  private openAi: OpenAI | null = null;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {
    if (!existsSync(UPLOAD_DIR)) {
      mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    const connection = this.redisConnectionOptions();
    this.queue = new Queue('project-processing', { connection });
    this.worker = new Worker('project-processing', (job) => this.handleJob(job), { connection });
    this.worker.on('failed', (job, err) => {
      this.logger.error(`Job ${job.id} failed`, err?.stack || undefined);
    });
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
    return this.projectRepository.find({ order: { createdAt: 'DESC' } });
  }

  async getProject(projectId: number) {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
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

  async handleJob(job: Job<ProjectJobPayload>) {
    const projectId = job.data.projectId;
    const project = await this.projectRepository.findOne({ where: { id: projectId } });

    if (!project) {
      throw new NotFoundException(`No project found for job ${job.id}`);
    }

    await this.updateProjectStatus(projectId, ProjectStatus.Processing);

    const reportProgress = async (value: number) => {
      job.updateProgress(value);
      await this.updateProjectProgress(projectId, value);
    };

    await reportProgress(10);

    try {
      const rawText = await this.extractTextFromFile(project.srsPath);
      await reportProgress(30);
      const cleanedText = this.cleanText(rawText);
      await reportProgress(45);
      const structured = await this.callOpenAi(cleanedText, project.name);
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

  private async persistStructuredOutput(project: Project, cleanedText: string, structured: Record<string, any>) {
    project.extractedText = cleanedText;
    project.aiResponse = structured;
    project.progress = 100;
    project.features = this.mapFeatures(
      Array.isArray(structured.features) ? structured.features : [],
      project,
    );
    project.userStories = this.mapUserStories(
      Array.isArray(structured.userStories) ? structured.userStories : [],
      project,
    );
    project.testCases = this.mapTestCases(
      Array.isArray(structured.testCases) ? structured.testCases : [],
      project,
    );
    project.rtm = this.mapRtm(
      Array.isArray(structured.rtm) ? structured.rtm : [],
      project,
    );
    project.failureReason = undefined;
    project.status = ProjectStatus.Completed;
    await this.projectRepository.save(project);
    this.logger.log(`Project ${project.id} completed with ${project.features.length} features`);
  }

  private mapFeatures(rawFeatures: any[], project: Project): Feature[] {
    return rawFeatures.map((raw) => {
      const feature = new Feature();
      feature.title = typeof raw.title === 'string' ? raw.title : raw.name ?? 'Unnamed feature';
      feature.description = raw.description ?? raw.details ?? '';
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

  private mapUserStories(rawStories: any[], project: Project): UserStory[] {
    return rawStories.map((raw) => {
      const story = new UserStory();
      story.actor = raw.user ?? raw.actor ?? 'User';
      story.goal = raw.goal ?? raw.objective ?? 'Undefined goal';
      story.benefit = raw.benefit ?? raw.reason ?? '';
      story.acceptanceCriteria = this.stringifyAcceptance(raw.acceptanceCriteria ?? raw.criteria);
      story.project = project;
      return story;
    });
  }

  private mapTestCases(rawCases: any[], project: Project): TestCase[] {
    return rawCases.map((raw, index) => {
      const testCase = new TestCase();
      testCase.testCaseId = raw.testCaseId ?? raw.id ?? `TC-${index + 1}`;
      testCase.title = raw.title ?? raw.name ?? 'Untitled test case';
      testCase.preconditions = raw.preconditions ?? raw.pre ?? '';
      testCase.steps = this.stringifySteps(raw.steps ?? raw.actions);
      testCase.expectedResult = raw.expectedResult ?? raw.outcome ?? '';
      testCase.project = project;
      return testCase;
    });
  }

  private mapRtm(rawRtm: any[], project: Project): RtmEntry[] {
    return rawRtm.map((raw, index) => {
      const entry = new RtmEntry();
      entry.requirementId = raw.requirementId ?? `REQ-${index + 1}`;
      entry.description = raw.description ?? raw.details ?? 'No description provided';
      entry.linkedUserStories = this.toStringArray(raw.linkedUserStories ?? raw.linkedStories ?? raw.userStories);
      entry.linkedTestCases = this.toStringArray(raw.testCases ?? raw.linkedTestCases);
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

  private cleanText(text: string) {
    return text.replace(/\s+/g, ' ').trim();
  }

  private async extractTextFromFile(filePath: string) {
    const extension = path.extname(filePath).toLowerCase();
    if (extension === '.pdf') {
      const buffer = await fs.readFile(filePath);
      const parsed = await pdfParse(buffer);
      return parsed.text;
    }

    if (extension === '.docx' || extension === '.doc') {
      const content = await mammoth.extractRawText({ path: filePath });
      return content.value;
    }

    throw new BadRequestException('Unsupported document type');
  }

  private async callOpenAi(text: string, projectName: string) {
    const prompt = `Analyze the following SRS document for project ${projectName}:\n\n${text}`;
    try {
      const response = await this.getOpenAiClient().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an experienced requirements analyst crafting features, user stories, RTM and test cases. Return a single JSON document with keys: features, userStories, rtm, testCases.',
          },
          {
            role: 'user',
            content: `${prompt}\n\nReturn output in strict JSON format.`,
          },
        ],
        temperature: 0.2,
      });
      const raw = response.choices?.[0]?.message?.content;
      if (!raw) {
        throw new Error('LLM did not return content');
      }
      return JSON.parse(this.extractJson(raw));
    } catch (error) {
      this.logger.error('OpenAI request failed', error);
      throw new Error('AI processing failed');
    }
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
