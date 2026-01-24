import { forwardRef } from 'react';
import { ReportCardData } from '@/hooks/useReportCard';
import { format } from 'date-fns';

interface ReportCardProps {
  data: ReportCardData;
}

export const ReportCard = forwardRef<HTMLDivElement, ReportCardProps>(({ data }, ref) => {
  return (
    <div ref={ref} className="bg-white text-black p-8 max-w-4xl mx-auto" style={{ fontFamily: 'Georgia, serif' }}>
      {/* Header */}
      <div className="text-center border-b-2 border-black pb-4 mb-6">
        <h1 className="text-2xl font-bold uppercase tracking-wider">Academic Report Card</h1>
        <p className="text-sm text-gray-600 mt-1">Academic Year 2024-2025</p>
      </div>

      {/* Student Information */}
      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div className="space-y-1">
          <p><span className="font-semibold">Student Name:</span> {data.student.name}</p>
          <p><span className="font-semibold">Student ID:</span> {data.student.studentCode}</p>
          <p><span className="font-semibold">Class:</span> {data.student.className} - {data.student.sectionName}</p>
        </div>
        <div className="space-y-1 text-right">
          <p><span className="font-semibold">Enrollment Date:</span> {format(new Date(data.student.enrollmentDate), 'MMM dd, yyyy')}</p>
          <p><span className="font-semibold">Parent/Guardian:</span> {data.student.parentName || 'N/A'}</p>
          <p><span className="font-semibold">Report Date:</span> {format(new Date(), 'MMM dd, yyyy')}</p>
        </div>
      </div>

      {/* Grades Table */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3 border-b border-gray-300 pb-1">Academic Performance</h2>
        {data.grades.length > 0 ? (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">Subject</th>
                <th className="border border-gray-300 p-2 text-center">Exam Type</th>
                <th className="border border-gray-300 p-2 text-center">Max Marks</th>
                <th className="border border-gray-300 p-2 text-center">Obtained</th>
                <th className="border border-gray-300 p-2 text-center">Percentage</th>
                <th className="border border-gray-300 p-2 text-center">Grade</th>
              </tr>
            </thead>
            <tbody>
              {data.grades.map((grade, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border border-gray-300 p-2">{grade.subjectName}</td>
                  <td className="border border-gray-300 p-2 text-center capitalize">{grade.examType}</td>
                  <td className="border border-gray-300 p-2 text-center">{grade.maxMarks}</td>
                  <td className="border border-gray-300 p-2 text-center">{grade.obtainedMarks}</td>
                  <td className="border border-gray-300 p-2 text-center">{grade.percentage}%</td>
                  <td className="border border-gray-300 p-2 text-center font-bold">{grade.grade}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-200 font-bold">
                <td className="border border-gray-300 p-2" colSpan={2}>Total</td>
                <td className="border border-gray-300 p-2 text-center">{data.summary.totalMarks}</td>
                <td className="border border-gray-300 p-2 text-center">{data.summary.obtainedMarks}</td>
                <td className="border border-gray-300 p-2 text-center">{data.summary.percentage}%</td>
                <td className="border border-gray-300 p-2 text-center">{data.summary.overallGrade}</td>
              </tr>
            </tfoot>
          </table>
        ) : (
          <p className="text-gray-500 italic">No grades recorded yet.</p>
        )}
      </div>

      {/* Attendance Summary */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3 border-b border-gray-300 pb-1">Attendance Summary</h2>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="p-3 bg-gray-50 rounded">
            <p className="text-2xl font-bold">{data.attendance.totalDays}</p>
            <p className="text-xs text-gray-600">Total Days</p>
          </div>
          <div className="p-3 bg-green-50 rounded">
            <p className="text-2xl font-bold text-green-700">{data.attendance.presentDays}</p>
            <p className="text-xs text-gray-600">Present</p>
          </div>
          <div className="p-3 bg-red-50 rounded">
            <p className="text-2xl font-bold text-red-700">{data.attendance.absentDays}</p>
            <p className="text-xs text-gray-600">Absent</p>
          </div>
          <div className="p-3 bg-blue-50 rounded">
            <p className="text-2xl font-bold text-blue-700">{data.attendance.attendancePercentage}%</p>
            <p className="text-xs text-gray-600">Attendance Rate</p>
          </div>
        </div>
      </div>

      {/* Remarks & Signature */}
      <div className="grid grid-cols-2 gap-8 mt-8 pt-4 border-t border-gray-300">
        <div>
          <p className="font-semibold mb-2">Teacher's Remarks:</p>
          <div className="border-b border-dotted border-gray-400 h-16"></div>
        </div>
        <div className="text-right">
          <p className="font-semibold mb-2">Principal's Signature:</p>
          <div className="border-b border-dotted border-gray-400 h-16"></div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 mt-8 pt-4 border-t border-gray-200">
        <p>This is a computer-generated report card. For any discrepancies, please contact the school office.</p>
      </div>
    </div>
  );
});

ReportCard.displayName = 'ReportCard';
