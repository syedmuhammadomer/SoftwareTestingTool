import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InviteTeamMemberDto } from './dto/invite-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { TeamService } from './team.service';

@ApiTags('team')
@Controller('api/team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get()
  @ApiOperation({ summary: 'Get team management dashboard data' })
  async getDashboard() {
    return this.teamService.getDashboard();
  }

  @Post('invite')
  @ApiOperation({ summary: 'Invite a new team member' })
  async inviteMember(@Body() body: InviteTeamMemberDto) {
    return this.teamService.inviteMember(body);
  }

  @Patch('members/:id')
  @ApiOperation({ summary: 'Update a team member' })
  async updateMember(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateTeamMemberDto,
  ) {
    return this.teamService.updateMember(id, body);
  }

  @Delete('members/:id')
  @ApiOperation({ summary: 'Delete a team member' })
  async deleteMember(@Param('id', ParseIntPipe) id: number) {
    await this.teamService.deleteMember(id);
    return { message: 'Team member deleted successfully' };
  }
}
