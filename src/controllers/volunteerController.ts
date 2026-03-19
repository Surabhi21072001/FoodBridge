import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { VolunteerService } from '../services/volunteerService';
import { sendSuccess, sendError } from '../utils/response';

export class VolunteerController {
  private volunteerService: VolunteerService;

  constructor() {
    this.volunteerService = new VolunteerService();
  }

  createOpportunity = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { title, description, max_volunteers, event_date } = req.body;

      const opportunity = await this.volunteerService.createOpportunity({
        title,
        description,
        max_volunteers,
        event_date: new Date(event_date),
      });

      sendSuccess(res, 201, 'Volunteer opportunity created', { opportunity });
    } catch (error) {
      next(error);
    }
  };

  getOpportunity = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const opportunity = await this.volunteerService.getOpportunityById(id);
      sendSuccess(res, 200, 'Volunteer opportunity retrieved', { opportunity });
    } catch (error) {
      next(error);
    }
  };

  listOpportunities = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const status = req.query.status as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await this.volunteerService.listOpportunities({
        status,
        page,
        limit,
      });

      sendSuccess(res, 200, 'Volunteer opportunities retrieved', {
        opportunities: result.opportunities,
        pagination: {
          total: result.total,
          page,
          limit,
          total_pages: Math.ceil(result.total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  updateOpportunity = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const opportunity = await this.volunteerService.updateOpportunity(id, updates);
      sendSuccess(res, 200, 'Volunteer opportunity updated', { opportunity });
    } catch (error) {
      next(error);
    }
  };

  signupForOpportunity = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { opportunity_id } = req.body;
      const studentId = req.user?.id;

      if (!studentId) {
        return sendError(res, 401, 'Unauthorized');
      }

      const participation = await this.volunteerService.signupForOpportunity(opportunity_id, studentId);
      sendSuccess(res, 201, 'Successfully signed up for volunteer opportunity', { participation });
    } catch (error) {
      next(error);
    }
  };

  cancelSignup = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const studentId = req.user?.id;

      if (!studentId) {
        return sendError(res, 401, 'Unauthorized');
      }

      const participation = await this.volunteerService.cancelSignup(id, studentId);
      sendSuccess(res, 200, 'Volunteer signup cancelled', { participation });
    } catch (error) {
      next(error);
    }
  };

  getStudentParticipation = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { studentId } = req.params;
      const status = req.query.status as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      // Verify user is accessing their own data or is admin
      if (req.user?.id !== studentId && req.user?.role !== 'admin') {
        return sendError(res, 403, 'Unauthorized');
      }

      const result = await this.volunteerService.getStudentParticipation(studentId, {
        status,
        page,
        limit,
      });

      sendSuccess(res, 200, 'Student volunteer participation retrieved', {
        participations: result.participations,
        pagination: {
          total: result.total,
          page,
          limit,
          total_pages: Math.ceil(result.total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getOpportunityParticipants = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { opportunityId } = req.params;

      const participants = await this.volunteerService.getOpportunityParticipants(opportunityId);
      sendSuccess(res, 200, 'Opportunity participants retrieved', { participants });
    } catch (error) {
      next(error);
    }
  };
}
