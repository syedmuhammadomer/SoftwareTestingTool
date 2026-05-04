import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailService } from '../auth/email.service';
import { InviteTeamMemberDto } from './dto/invite-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { TeamActivity } from './entities/team-activity.entity';
import { TeamMember, TeamMemberStatus } from './entities/team-member.entity';

@Injectable()
export class TeamService implements OnModuleInit {
  constructor(
    @InjectRepository(TeamMember)
    private readonly teamMemberRepository: Repository<TeamMember>,
    @InjectRepository(TeamActivity)
    private readonly teamActivityRepository: Repository<TeamActivity>,
    private readonly emailService: EmailService,
  ) {}

  async onModuleInit() {
    await this.seedIfEmpty();
  }

  async getDashboard() {
    const members = await this.teamMemberRepository.find({ order: { createdAt: 'ASC' } });
    const activities = await this.teamActivityRepository.find({ order: { createdAt: 'DESC' }, take: 8 });
    const totalMembers = members.length;
    const activeNow = members.filter((member) => member.status === TeamMemberStatus.Online).length;
    const avgTestCases =
      totalMembers === 0
        ? 0
        : Math.round(members.reduce((total, member) => total + member.testCases, 0) / totalMembers);

    return {
      stats: {
        totalMembers,
        activeNow,
        avgTestCases,
      },
      members,
      activity: activities,
      roles: [
        { name: 'QA', desc: 'Access dashboard analytics, assigned projects, user stories, test cases, backlogs, and bug reporting tools.' },
        { name: 'Product Owner', desc: 'Manage projects, backlog priorities, sprint planning, team setup, RTM, and story assignments.' },
        { name: 'Developer', desc: 'Work inside assigned projects, update delivery status, move tasks across workflow stages, and track implementation progress.' },
      ],
    };
  }

  async inviteMember(dto: InviteTeamMemberDto) {
    const existing = await this.teamMemberRepository.findOne({ where: { email: dto.email.toLowerCase() } });
    if (existing) {
      throw new BadRequestException('A team member with this email already exists.');
    }

    const member = this.teamMemberRepository.create({
      fullName: dto.fullName.trim(),
      email: dto.email.toLowerCase().trim(),
      role: dto.role.trim(),
      team: dto.team.trim(),
      project: dto.project?.trim() || undefined,
      accessPreset: dto.accessPreset,
      sendCopy: dto.sendCopy,
      addWelcomeNote: dto.addWelcomeNote,
      testCases: 0,
      status: TeamMemberStatus.Invited,
      lastActive: 'Invitation sent just now',
    });

    const savedMember = await this.teamMemberRepository.save(member);
    await this.logActivity(savedMember.fullName, `invited to ${savedMember.team}${savedMember.project ? ` for ${savedMember.project}` : ''}`, 'Just now');
    await this.emailService.sendTeamInviteEmail({
      email: savedMember.email,
      fullName: savedMember.fullName,
      role: savedMember.role,
      team: savedMember.team,
      project: savedMember.project,
    });
    return savedMember;
  }

  async updateMember(id: number, dto: UpdateTeamMemberDto) {
    const member = await this.teamMemberRepository.findOne({ where: { id } });
    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    if (dto.fullName !== undefined) member.fullName = dto.fullName.trim();
    if (dto.role !== undefined) member.role = dto.role.trim();
    if (dto.team !== undefined) member.team = dto.team.trim();
    if (dto.project !== undefined) member.project = dto.project.trim() || undefined;
    if (dto.accessPreset !== undefined) member.accessPreset = dto.accessPreset;
    if (dto.status !== undefined) member.status = dto.status;
    if (dto.lastActive !== undefined) member.lastActive = dto.lastActive;

    const updated = await this.teamMemberRepository.save(member);
    await this.logActivity(updated.fullName, 'profile updated in Team Management', 'Just now');
    return updated;
  }

  async deleteMember(id: number) {
    const member = await this.teamMemberRepository.findOne({ where: { id } });
    if (!member) {
      throw new NotFoundException('Team member not found');
    }
    await this.teamMemberRepository.remove(member);
    await this.logActivity(member.fullName, 'removed from the workspace roster', 'Just now');
  }

  private async logActivity(actor: string, action: string, timeLabel: string) {
    const entry = this.teamActivityRepository.create({ actor, action, timeLabel });
    await this.teamActivityRepository.save(entry);
  }

  private async seedIfEmpty() {
    const count = await this.teamMemberRepository.count();
    if (count > 0) {
      return;
    }

    const members = this.teamMemberRepository.create([
      {
        fullName: 'Dana Holloway',
        email: 'dana@project.ai',
        role: 'QA',
        team: 'Quality Ops',
        project: 'Banking App',
        testCases: 312,
        accessPreset: 'full',
        sendCopy: true,
        addWelcomeNote: true,
        status: TeamMemberStatus.Online,
        lastActive: '2 mins ago',
      },
      {
        fullName: 'Maya Brooks',
        email: 'maya@project.ai',
        role: 'Product Owner',
        team: 'Quality Ops',
        project: 'Banking App',
        testCases: 244,
        accessPreset: 'project',
        sendCopy: true,
        addWelcomeNote: true,
        status: TeamMemberStatus.Online,
        lastActive: '18 mins ago',
      },
      {
        fullName: 'Marcus Li',
        email: 'marcus@project.ai',
        role: 'QA',
        team: 'Quality Ops',
        project: 'Healthcare Portal',
        testCases: 198,
        accessPreset: 'project',
        sendCopy: true,
        addWelcomeNote: true,
        status: TeamMemberStatus.Online,
        lastActive: '12 mins ago',
      },
      {
        fullName: 'Priya Singh',
        email: 'priya@project.ai',
        role: 'Developer',
        team: 'Automation Guild',
        project: 'Inventory Portal',
        testCases: 176,
        accessPreset: 'project',
        sendCopy: false,
        addWelcomeNote: true,
        status: TeamMemberStatus.Offline,
        lastActive: '1 hour ago',
      },
    ]);
    await this.teamMemberRepository.save(members);

    await this.teamActivityRepository.save(
      this.teamActivityRepository.create([
        { actor: 'Dana Holloway', action: 'pushed 12 regression tests to Banking App', timeLabel: '2 minutes ago' },
        { actor: 'Maya Brooks', action: 'approved backlog priorities for Banking App sprint', timeLabel: '18 minutes ago' },
        { actor: 'Marcus Li', action: 'validated automation pipeline for Healthcare', timeLabel: '40 minutes ago' },
        { actor: 'Priya Singh', action: 'shared coverage report for Inventory portal', timeLabel: '2 hours ago' },
      ]),
    );
  }
}
