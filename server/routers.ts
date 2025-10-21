import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { runFullAudit } from "./services/orchestrator";
import { createAuditRun, updateAuditRun, getAuditRun, getUserAuditRuns, createReport, getReport, updateReport } from "./db";
import { checkRateLimit } from "./middleware/rate-limit";
import { randomBytes } from "crypto";
import { createCheckoutSession } from "./services/stripe-service";
import { analytics } from "./services/analytics";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  audit: router({
    // Start a new audit run
    start: publicProcedure
      .input(z.object({
        url: z.string().url(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Rate limit by IP
        const ip = ctx.req.ip || ctx.req.socket.remoteAddress || 'unknown';
        checkRateLimit(`audit:${ip}`, 5, 60 * 60 * 1000); // 5 per hour

        // Validate URL
        try {
          new URL(input.url);
        } catch {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid URL format',
          });
        }

        // Create audit run record
        const auditId = randomBytes(16).toString('hex');
        const auditRun = await createAuditRun({
          id: auditId,
          url: input.url,
          userId: ctx.user?.id || null,
          status: 'pending',
        });

        // Start audit in background
        (async () => {
          try {
            await updateAuditRun(auditId, { status: 'running' });

            const psiApiKey = process.env.PSI_API_KEY || '';
            const cruxApiKey = process.env.CRUX_API_KEY || '';

            if (!psiApiKey || !cruxApiKey) {
              throw new Error('API keys not configured');
            }

            const result = await runFullAudit(input.url, {
              psiApiKey,
              cruxApiKey,
            });

            const lms = Math.round(result.lms);
            const rri = Math.round(result.rri);
            const pmi = Math.round(result.pmi);

            await updateAuditRun(auditId, {
              status: 'completed',
              lms,
              rri,
              pmi,
              categories: result.categories as any,
              gates: result.gates as any,
              topFixes: result.topFixes as any,
              completedAt: new Date(),
            });

            // Track analytics
            analytics.scoreDone(input.url, lms, rri, pmi).catch(console.error);
          } catch (error: any) {
            console.error('[Audit] Error running audit:', error);
            await updateAuditRun(auditId, {
              status: 'failed',
              error: error.message || 'Unknown error',
            });
          }
        })();

        // Track analytics
        analytics.scoreStart(input.url).catch(console.error);

        return {
          auditId,
          status: 'pending',
        };
      }),

    // Get audit status and results
    get: publicProcedure
      .input(z.object({
        auditId: z.string(),
      }))
      .query(async ({ input }) => {
        const auditRun = await getAuditRun(input.auditId);
        
        if (!auditRun) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Audit not found',
          });
        }

        return {
          id: auditRun.id,
          url: auditRun.url,
          status: auditRun.status,
          lms: auditRun.lms,
          rri: auditRun.rri,
          pmi: auditRun.pmi,
          categories: auditRun.categories,
          gates: auditRun.gates,
          topFixes: auditRun.topFixes,
          error: auditRun.error,
          createdAt: auditRun.createdAt,
          completedAt: auditRun.completedAt,
        };
      }),

    // List user's audit history
    list: protectedProcedure
      .query(async ({ ctx }) => {
        const runs = await getUserAuditRuns(ctx.user.id);
        return runs.map(run => ({
          id: run.id,
          url: run.url,
          status: run.status,
          lms: run.lms,
          rri: run.rri,
          pmi: run.pmi,
          createdAt: run.createdAt,
          completedAt: run.completedAt,
        }));
      }),
  }),

  report: router({
    // Create a report purchase intent and get Stripe checkout URL
    create: publicProcedure
      .input(z.object({
        auditId: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const auditRun = await getAuditRun(input.auditId);
        
        if (!auditRun) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Audit not found',
          });
        }

        if (auditRun.status !== 'completed') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Audit not completed yet',
          });
        }

        // Create report record
        const reportId = randomBytes(16).toString('hex');
        await createReport({
          id: reportId,
          auditRunId: input.auditId,
          userId: ctx.user?.id || null,
          isPaid: false,
        });

        // Create Stripe checkout session
        const protocol = ctx.req.protocol || 'https';
        const host = ctx.req.get('host') || 'localhost:3000';
        const baseUrl = `${protocol}://${host}`;

        const checkoutUrl = await createCheckoutSession({
          reportId,
          auditId: input.auditId,
          successUrl: `${baseUrl}/report/${reportId}?success=true`,
          cancelUrl: `${baseUrl}/audit/${input.auditId}`,
        });

        return {
          reportId,
          auditId: input.auditId,
          checkoutUrl,
        };
      }),

    // Get report details
    get: publicProcedure
      .input(z.object({
        reportId: z.string(),
      }))
      .query(async ({ input }) => {
        const report = await getReport(input.reportId);
        
        if (!report) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Report not found',
          });
        }

        return {
          id: report.id,
          auditRunId: report.auditRunId,
          isPaid: report.isPaid,
          pdfUrl: report.pdfUrl,
          jsonUrl: report.jsonUrl,
          badgeCode: report.badgeCode,
          createdAt: report.createdAt,
          paidAt: report.paidAt,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;

