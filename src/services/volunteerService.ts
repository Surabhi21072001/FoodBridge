import { VolunteerRepository, VolunteerOpportunity, VolunteerParticipation } from '../repositories/volunteerRepository';
import { UserRepository } from '../repositories/userRepository';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors';

export class VolunteerService {
  private volunteerRepository: VolunteerRepository;
  private userRepository: UserRepository;

  constructor() {
    this.volunteerRepository = new VolunteerRepository();
    this.userRepository = new UserRepository();
  }

  async createOpportunity(data: {
    title: string;
    description?: string;
    max_volunteers: number;
    event_date: Date;
  }): Promise<VolunteerOpportunity> {
    if (data.max_volunteers <= 0) {
      throw new BadRequestError('Max volunteers must be greater than 0');
    }

    if (new Date(data.event_date) <= new Date()) {
      throw new BadRequestError('Event date must be in the future');
    }

    return await this.volunteerRepository.createOpportunity({
      title: data.title,
      description: data.description,
      max_volunteers: data.max_volunteers,
      event_date: data.event_date,
      status: 'open',
    });
  }

  async getOpportunityById(id: string): Promise<VolunteerOpportunity> {
    const opportunity = await this.volunteerRepository.findOpportunityById(id);
    if (!opportunity) {
      throw new NotFoundError('Volunteer opportunity not found');
    }
    return opportunity;
  }

  async listOpportunities(filters?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ opportunities: VolunteerOpportunity[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    return await this.volunteerRepository.findAllOpportunities({
      status: filters?.status,
      limit,
      offset,
    });
  }

  async updateOpportunity(id: string, updates: Partial<VolunteerOpportunity>): Promise<VolunteerOpportunity> {
    const opportunity = await this.volunteerRepository.findOpportunityById(id);
    if (!opportunity) {
      throw new NotFoundError('Volunteer opportunity not found');
    }

    if (updates.max_volunteers !== undefined && updates.max_volunteers <= 0) {
      throw new BadRequestError('Max volunteers must be greater than 0');
    }

    const updated = await this.volunteerRepository.updateOpportunity(id, updates);
    if (!updated) {
      throw new NotFoundError('Volunteer opportunity not found');
    }

    return updated;
  }

  async signupForOpportunity(opportunityId: string, studentId: string): Promise<VolunteerParticipation> {
    // Verify user exists and is a student
    const user = await this.userRepository.findById(studentId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.role !== 'student') {
      throw new BadRequestError('Only students can sign up for volunteer opportunities');
    }

    // Verify opportunity exists
    const opportunity = await this.volunteerRepository.findOpportunityById(opportunityId);
    if (!opportunity) {
      throw new NotFoundError('Volunteer opportunity not found');
    }

    // Check if opportunity is open
    if (opportunity.status !== 'open') {
      throw new BadRequestError('This volunteer opportunity is not open for signups');
    }

    // Check if student already signed up
    const existing = await this.volunteerRepository.findParticipationByOpportunityAndStudent(opportunityId, studentId);
    if (existing) {
      throw new ConflictError('You have already signed up for this opportunity');
    }

    // Check if opportunity is at capacity
    if (opportunity.current_volunteers >= opportunity.max_volunteers) {
      throw new BadRequestError('This volunteer opportunity is at capacity');
    }

    // Create participation record
    const participation = await this.volunteerRepository.createParticipation({
      opportunity_id: opportunityId,
      student_id: studentId,
      status: 'signed_up',
    });

    // Increment volunteer count
    await this.volunteerRepository.incrementVolunteerCount(opportunityId);

    // Close opportunity if at capacity
    if (opportunity.current_volunteers + 1 >= opportunity.max_volunteers) {
      await this.volunteerRepository.updateOpportunity(opportunityId, { status: 'closed' });
    }

    return participation;
  }

  async cancelSignup(participationId: string, studentId: string): Promise<VolunteerParticipation> {
    const participation = await this.volunteerRepository.findParticipationById(participationId);
    if (!participation) {
      throw new NotFoundError('Volunteer signup not found');
    }

    if (participation.student_id !== studentId) {
      throw new NotFoundError('Volunteer signup not found');
    }

    if (participation.status === 'cancelled') {
      throw new BadRequestError('This signup is already cancelled');
    }

    if (participation.status === 'completed') {
      throw new BadRequestError('Cannot cancel a completed volunteer activity');
    }

    // Update participation status
    const updated = await this.volunteerRepository.updateParticipation(participationId, {
      status: 'cancelled',
    });

    if (!updated) {
      throw new NotFoundError('Volunteer signup not found');
    }

    // Decrement volunteer count
    await this.volunteerRepository.decrementVolunteerCount(participation.opportunity_id);

    // Reopen opportunity if it was closed
    const opportunity = await this.volunteerRepository.findOpportunityById(participation.opportunity_id);
    if (opportunity && opportunity.status === 'closed' && opportunity.current_volunteers - 1 < opportunity.max_volunteers) {
      await this.volunteerRepository.updateOpportunity(participation.opportunity_id, { status: 'open' });
    }

    return updated;
  }

  async getStudentParticipation(studentId: string, filters?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ participations: VolunteerParticipation[]; total: number }> {
    // Verify user exists
    const user = await this.userRepository.findById(studentId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    return await this.volunteerRepository.findParticipationsByStudent(studentId, {
      status: filters?.status,
      limit,
      offset,
    });
  }

  async getOpportunityParticipants(opportunityId: string): Promise<VolunteerParticipation[]> {
    const opportunity = await this.volunteerRepository.findOpportunityById(opportunityId);
    if (!opportunity) {
      throw new NotFoundError('Volunteer opportunity not found');
    }

    return await this.volunteerRepository.findParticipationsByOpportunity(opportunityId);
  }
}
