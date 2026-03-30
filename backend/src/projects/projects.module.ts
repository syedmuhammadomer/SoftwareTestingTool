import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { Feature } from './entities/feature.entity';
import { Project } from './entities/project.entity';
import { RtmEntry } from './entities/rtm.entity';
import { TestCase } from './entities/test-case.entity';
import { UserStory } from './entities/user-story.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Project, Feature, UserStory, TestCase, RtmEntry]),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
