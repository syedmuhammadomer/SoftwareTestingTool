import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectsService } from './projects.service';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'srs');
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}
const allowedMimeTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const fileFilter = (_req, file, callback) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    callback(null, true);
    return;
  }
  callback(new BadRequestException('Only PDF, DOC, and DOCX files are supported'), false);
};

const storage = diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, UPLOAD_DIR);
  },
  filename: (_req, file, callback) => {
    const timestamp = Date.now();
    const name = file.originalname.replace(/\s+/g, '-');
    callback(null, `${timestamp}-${name}`);
  },
});

@ApiTags('projects')
@Controller('api/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Upload an SRS document to create a new project' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        projectName: { type: 'string', example: 'New Platform' },
        srsDocument: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['projectName', 'srsDocument'],
    },
  })
  @ApiResponse({ status: 201, description: 'Project queued for AI processing' })
  @ApiResponse({ status: 400, description: 'Invalid inputs or wrong file type' })
  @UseInterceptors(
    FileInterceptor('srsDocument', {
      storage,
      fileFilter,
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async createProject(@Body() body: CreateProjectDto, @UploadedFile() file: Express.Multer.File) {
    if (file == null) {
      throw new BadRequestException('SRS document is required');
    }
    const project = await this.projectsService.createProject(body.projectName, file.path);
    return {
      message: 'Project queued for processing',
      projectId: project.id,
      status: project.status,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List processed projects' })
  @ApiResponse({ status: 200, description: 'Project list' })
  async listProjects() {
    return this.projectsService.listProjects();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project with AI results' })
  @ApiResponse({ status: 200, description: 'Project returned' })
  async getProject(@Param('id', ParseIntPipe) id: number) {
    const project = await this.projectsService.getProject(id);
    if (project == null) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a project and its AI output' })
  @ApiResponse({ status: 200, description: 'Project deleted successfully' })
  async deleteProject(@Param('id', ParseIntPipe) id: number) {
    await this.projectsService.deleteProject(id);
    return { message: 'Project deleted successfully' };
  }
}
