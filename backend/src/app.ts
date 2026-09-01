import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { config } from './config/index.js';
import { errorHandler } from './middlewares/error.js';

// Route imports
import authRoutes from './modules/auth/auth.routes.js';
import superAdminRoutes from './modules/super-admin/super-admin.routes.js';
import clinicRoutes from './modules/clinics/clinics.routes.js';
import doctorRoutes from './modules/doctors/doctors.routes.js';
import receptionistRoutes from './modules/receptionists/receptionists.routes.js';
import patientRoutes from './modules/patients/patients.routes.js';
import appointmentRoutes from './modules/appointments/appointments.routes.js';
import queueRoutes from './modules/queue/queue.routes.js';
import consultationRoutes from './modules/consultations/consultations.routes.js';
import prescriptionRoutes from './modules/prescriptions/prescriptions.routes.js';
import billingRoutes from './modules/billing/billing.routes.js';
import reportsRoutes from './modules/reports/reports.routes.js';
import subscriptionRoutes from './modules/subscriptions/subscriptions.routes.js';
import healthRoutes from './modules/health/health.routes.js';

export const createApp = (): Express => {
  const app = express();

  // Global Security & Parsers
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    })
  );

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl) or matching origins
        callback(null, true);
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  if (config.env !== 'test') {
    app.use(morgan('dev'));
  }

  // API Routes
  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/super-admin', superAdminRoutes);
  app.use('/api/clinics', clinicRoutes);
  app.use('/api/doctors', doctorRoutes);
  app.use('/api/receptionists', receptionistRoutes);
  app.use('/api/patients', patientRoutes);
  app.use('/api/appointments', appointmentRoutes);
  app.use('/api/queue', queueRoutes);
  app.use('/api/consultations', consultationRoutes);
  app.use('/api/prescriptions', prescriptionRoutes);
  app.use('/api/payments', billingRoutes);
  app.use('/api/reports', reportsRoutes);
  app.use('/api/subscriptions', subscriptionRoutes);

  // 404 Handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${req.originalUrl} not found`,
      },
    });
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};
