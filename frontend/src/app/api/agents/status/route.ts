import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    agents: [
      {
        id: 'webwizard',
        name: 'WebWizard',
        status: 'ready',
        lastTask: 'UI redesign',
      },
      {
        id: 'devguardian',
        name: 'DevGuardian',
        status: 'ready',
        lastTask: 'Security audit',
      },
      {
        id: 'dataalchemist',
        name: 'DataAlchemist',
        status: 'busy',
        lastTask: 'Redis config',
      },
      {
        id: 'growthpilot',
        name: 'GrowthPilot',
        status: 'ready',
        lastTask: 'CRM sync',
      },
      {
        id: 'architectai',
        name: 'ArchitectAI',
        status: 'ready',
        lastTask: 'Deploy config',
      },
    ],
    services: {
      frontend: 'ok',
      backend: 'ok',
      database: 'ok',
      containers: 'ok',
    },
  });
}
