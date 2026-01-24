import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ReportCard } from './ReportCard';
import { useReportCard } from '@/hooks/useReportCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

interface ReportCardDialogProps {
  studentId: string | undefined;
  studentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReportCardDialog = ({ studentId, studentName, open, onOpenChange }: ReportCardDialogProps) => {
  const { data: reportData, isLoading } = useReportCard(studentId);
  const reportRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `Report_Card_${studentName.replace(/\s/g, '_')}`,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report Card - {studentName}</DialogTitle>
          <DialogDescription>
            View and download the student's academic report card
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button onClick={() => handlePrint()} disabled={isLoading || !reportData}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={() => handlePrint()} disabled={isLoading || !reportData}>
            <Download className="h-4 w-4 mr-2" />
            Save as PDF
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4 p-8">
            <Skeleton className="h-8 w-64 mx-auto" />
            <Skeleton className="h-4 w-48 mx-auto" />
            <div className="grid grid-cols-2 gap-4 mt-8">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
            <Skeleton className="h-48 w-full mt-8" />
          </div>
        ) : reportData ? (
          <div className="border rounded-lg overflow-hidden">
            <ReportCard ref={reportRef} data={reportData} />
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">No data available</p>
        )}
      </DialogContent>
    </Dialog>
  );
};
