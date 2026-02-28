'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';

const reports = [
  {
    title: 'Executive Risk Summary',
    description: 'Board-level quantum cryptographic risk assessment',
    date: '2025-02-28',
    size: '2.4 MB',
  },
  {
    title: 'Detailed Asset Audit',
    description: 'Complete inventory with migration recommendations',
    date: '2025-02-28',
    size: '8.7 MB',
  },
  {
    title: 'Compliance Report',
    description: 'NIST post-quantum cryptography guidelines alignment',
    date: '2025-02-27',
    size: '1.2 MB',
  },
  {
    title: 'Migration Roadmap',
    description: 'Phased transition plan with timelines and dependencies',
    date: '2025-02-26',
    size: '3.1 MB',
  },
];

export default function ReportsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Reports & Exports</h1>
          <p className="text-muted-foreground">Generate and download executive reports and detailed audits</p>
        </div>

        <div className="space-y-3">
          {reports.map((report, idx) => (
            <div key={idx} className="border border-border rounded-lg bg-card p-4 hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{report.title}</h3>
                    <p className="text-xs text-muted-foreground">{report.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">Generated: {report.date} • {report.size}</p>
                  </div>
                </div>
                <Button size="sm" className="h-8 px-3 text-xs bg-primary hover:bg-primary/90 text-primary-foreground flex-shrink-0">
                  <Download className="w-3 h-3 mr-1" />
                  PDF
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="border border-border rounded-lg bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Generate New Report</h3>
          <select className="w-full h-9 px-3 rounded bg-secondary border border-border text-sm text-foreground">
            <option>Select report type...</option>
            <option>Executive Summary</option>
            <option>Technical Assessment</option>
            <option>Migration Plan</option>
            <option>Compliance Checklist</option>
          </select>
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            Generate Report
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
